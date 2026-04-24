import {
  ListIdentitiesCommand,
  SendEmailCommand,
  SESClient,
} from "@aws-sdk/client-ses";

import { getSesConfig } from "@/lib/env";

let sesClient: SESClient | null = null;
let discoveredFromEmail: Promise<string> | null = null;

function getSesClient() {
  if (!sesClient) {
    const config = getSesConfig();
    sesClient = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return sesClient;
}

async function getSesFromEmail() {
  const config = getSesConfig();
  if (config.fromEmail) {
    return config.fromEmail;
  }

  if (!discoveredFromEmail) {
    discoveredFromEmail = (async () => {
      const client = getSesClient();
      const response = await client.send(
        new ListIdentitiesCommand({
          IdentityType: "EmailAddress",
          MaxItems: 25,
        }),
      );

      const identity = response.Identities?.find(Boolean);
      if (!identity) {
        throw new Error(
          "SES_FROM_EMAIL is missing and no verified SES email identities were found.",
        );
      }

      return identity;
    })();
  }

  return discoveredFromEmail;
}

export async function sendSongReadyEmails(params: {
  customerEmail: string;
  venueEmail: string;
  venueName: string;
  songUrl: string;
  prompt: string;
  names: string;
}) {
  const client = getSesClient();
  const fromEmail = await getSesFromEmail();

  const emails = [
    {
      to: params.customerEmail,
      subject: `Your ${params.venueName} AI song is ready`,
      heading: "Your custom track is live",
      copy: "We finished your venue anthem and uploaded it for replay.",
    },
    {
      to: params.venueEmail,
      subject: `A guest song is ready for ${params.venueName}`,
      heading: "A new venue song just landed",
      copy: `A guest request for ${params.names} has completed and is ready to play back.`,
    },
  ];

  await Promise.all(
    emails.map((email) =>
      client.send(
        new SendEmailCommand({
          Source: fromEmail,
          Destination: {
            ToAddresses: [email.to],
          },
          Message: {
            Subject: {
              Charset: "UTF-8",
              Data: email.subject,
            },
            Body: {
              Html: {
                Charset: "UTF-8",
                Data: `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201733;">
                    <h1 style="margin-bottom: 12px;">${email.heading}</h1>
                    <p>${email.copy}</p>
                    <p><strong>Prompt:</strong> ${params.prompt}</p>
                    <p><a href="${params.songUrl}" style="display: inline-block; padding: 12px 18px; background: #ff6b35; color: white; border-radius: 999px; text-decoration: none;">Listen now</a></p>
                  </div>
                `,
              },
            },
          },
        }),
      ),
    ),
  );
}

import https from "node:https";

import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

import { getSesConfig } from "@/lib/env";

function getSesFromEmail() {
  const config = getSesConfig();
  if (!config.fromEmail) {
    throw new Error(
      "SES_FROM_EMAIL must be configured with a verified SES sender address.",
    );
  }

  return config.fromEmail;
}

async function sendRawSesEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const config = getSesConfig();
  const host = `email.${config.region}.amazonaws.com`;
  const body = new URLSearchParams({
    Action: "SendEmail",
    Version: "2010-12-01",
    Source: getSesFromEmail(),
    "Destination.ToAddresses.member.1": params.to,
    "Message.Subject.Charset": "UTF-8",
    "Message.Subject.Data": params.subject,
    "Message.Body.Html.Charset": "UTF-8",
    "Message.Body.Html.Data": params.html,
    "Message.Body.Text.Charset": "UTF-8",
    "Message.Body.Text.Data": params.text,
  });

  if (config.configurationSetName) {
    body.set("ConfigurationSetName", config.configurationSetName);
  }

  const signer = new SignatureV4({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    region: config.region,
    service: "ses",
    sha256: Hash.bind(null, "sha256"),
  });

  const request = new HttpRequest({
    protocol: "https:",
    hostname: host,
    method: "POST",
    path: "/",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
      host,
    },
    body: body.toString(),
  });

  const signedRequest = await signer.sign(request);

  const response = await new Promise<{ statusCode: number; body: string }>(
    (resolve, reject) => {
      const outgoing = https.request(
        {
          hostname: host,
          method: signedRequest.method,
          path: signedRequest.path,
          headers: signedRequest.headers,
        },
        (incoming) => {
          let responseBody = "";
          incoming.setEncoding("utf8");
          incoming.on("data", (chunk) => {
            responseBody += chunk;
          });
          incoming.on("end", () => {
            resolve({
              statusCode: incoming.statusCode ?? 500,
              body: responseBody,
            });
          });
        },
      );

      outgoing.on("error", reject);
      outgoing.write(body.toString());
      outgoing.end();
    },
  );

  if (response.statusCode >= 400) {
    const messageMatch = response.body.match(/<Message>([\s\S]*?)<\/Message>/);
    const message = messageMatch?.[1]
      ?.replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    throw new Error(message ?? `SES email failed with status ${response.statusCode}.`);
  }
}

export async function sendSongReadyEmails(params: {
  customerEmail: string;
  venueEmail: string;
  venueName: string;
  songUrl: string;
  prompt: string;
  names: string;
}) {
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
      sendRawSesEmail({
        to: email.to,
        subject: email.subject,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201733;">
            <h1 style="margin-bottom: 12px;">${email.heading}</h1>
            <p>${email.copy}</p>
            <p><strong>Prompt:</strong> ${params.prompt}</p>
            <p><a href="${params.songUrl}" style="display: inline-block; padding: 12px 18px; background: #ff6b35; color: white; border-radius: 999px; text-decoration: none;">Listen now</a></p>
          </div>
        `,
        text: `${email.heading}\n\n${email.copy}\n\nPrompt: ${params.prompt}\n\nListen now: ${params.songUrl}`,
      }),
    ),
  );
}

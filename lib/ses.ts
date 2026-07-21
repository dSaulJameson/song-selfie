import https from "node:https";

import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

import { getBaseUrl, getSesConfig } from "@/lib/env";
import { getVenuePublicPath } from "@/lib/system-venues";

function getSesFromEmail() {
  const config = getSesConfig();
  if (!config.fromEmail) {
    throw new Error(
      "SES_FROM_EMAIL must be configured with a verified SES sender address.",
    );
  }

  return config.fromEmail;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getBusinessLeadRecipients() {
  const configured = process.env.BUSINESS_LEAD_EMAILS;
  const fallback = [
    "saul@anyaiyouwant.com",
    "dsauljameson@gmail.com",
  ];

  return [...new Set((configured ? configured.split(",") : fallback)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean))];
}

async function sendRawSesEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const mailerUrl = process.env.MAILER_WORKER_URL?.trim();
  const mailerSecret = process.env.MAILER_WORKER_SECRET?.trim();

  if (mailerUrl || mailerSecret) {
    if (!mailerUrl || !mailerSecret) {
      throw new Error(
        "MAILER_WORKER_URL and MAILER_WORKER_SECRET must be configured together.",
      );
    }

    const response = await fetch(mailerUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${mailerSecret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(params),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Cloudflare mailer failed with status ${response.status}.`);
    }

    return;
  }

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
  slideshowUrl?: string | null;
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
            ${
              params.slideshowUrl
                ? `<p><a href="${params.slideshowUrl}" style="display: inline-block; padding: 12px 18px; background: #8d66ff; color: white; border-radius: 999px; text-decoration: none;">Watch slideshow</a></p>`
                : ""
            }
          </div>
        `,
        text:
          `${email.heading}\n\n${email.copy}\n\nPrompt: ${params.prompt}\n\nListen now: ${params.songUrl}` +
          (params.slideshowUrl ? `\nWatch slideshow: ${params.slideshowUrl}` : ""),
      }),
    ),
  );
}

export async function sendVenueInviteEmail(params: {
  to: string;
  venueName: string;
  venueSlug: string;
  dashboardUrl?: string;
}) {
  const venueUrl = `${getBaseUrl()}${getVenuePublicPath(params.venueSlug)}`;
  const loginUrl = params.dashboardUrl ?? `${getBaseUrl()}/login`;

  await sendRawSesEmail({
    to: params.to,
    subject: `Song Selfie invite for ${params.venueName}`,
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201733;">
          <h1 style="margin-bottom: 12px;">Your Song Selfie venue is ready</h1>
          <p>${params.venueName} now has a public guest page and a venue dashboard.</p>
          <p>You can start in about two minutes: create or verify your dashboard account with this email, print your QR code, set your song price, and leave payout setup for later.</p>
          <p><strong>Your venue page:</strong> <a href="${venueUrl}">${venueUrl}</a></p>
          <p><strong>Open your dashboard:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <ol>
            <li>Open the dashboard link and use this same email.</li>
            <li>Print the QR code for tables, menus, signs, or the bar.</li>
            <li>Set your song price. The minimum is $1.00.</li>
          <li>When songs come in, hit play from the playlist on your dashboard.</li>
          <li>Use the Get Paid section when you are ready to connect Stripe, request secure bank transfer setup, or choose checks.</li>
        </ol>
      </div>
    `,
    text:
        `Your Song Selfie venue is ready.\n\n` +
        `Venue page: ${venueUrl}\n` +
        `Open your dashboard: ${loginUrl}\n\n` +
        `Start in about two minutes:\n` +
        `1. Create or verify your account with this email.\n` +
      `2. Print the QR code.\n` +
      `3. Set your song price. Minimum is $1.00.\n` +
      `4. Play completed songs from your dashboard playlist.\n` +
      `5. Set up payouts later in the Get Paid section.`,
  });
}

export async function sendBusinessLeadEmail(params: {
  email: string;
  businessName?: string | null;
  phone?: string | null;
  venueUrl?: string | null;
  dashboardUrl?: string | null;
}) {
  const recipients = getBusinessLeadRecipients();
  const safeEmail = escapeHtml(params.email);
  const safeBusinessName = escapeHtml(params.businessName?.trim() || "Not provided");
  const safePhone = escapeHtml(params.phone?.trim() || "Not provided");
  const safeVenueUrl = escapeHtml(params.venueUrl?.trim() || "Not created");
  const safeDashboardUrl = escapeHtml(params.dashboardUrl?.trim() || "Not created");
  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  });

  await Promise.all(
    recipients.map((to) =>
      sendRawSesEmail({
        to,
        subject: `New Song Selfie venue lead: ${params.businessName?.trim() || params.email}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201733;">
            <h1 style="margin-bottom: 12px;">New Song Selfie venue lead</h1>
            <p>A business owner requested setup from the homepage.</p>
            <p><strong>Business:</strong> ${safeBusinessName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
            <p><strong>Phone/Text:</strong> ${safePhone}</p>
            <p><strong>Venue page:</strong> <a href="${safeVenueUrl}">${safeVenueUrl}</a></p>
            <p><strong>Dashboard:</strong> <a href="${safeDashboardUrl}">${safeDashboardUrl}</a></p>
            <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)} Pacific</p>
          </div>
        `,
        text:
          `New Song Selfie venue lead\n\n` +
          `Business: ${params.businessName?.trim() || "Not provided"}\n` +
          `Email: ${params.email}\n` +
          `Phone/Text: ${params.phone?.trim() || "Not provided"}\n` +
          `Venue page: ${params.venueUrl?.trim() || "Not created"}\n` +
          `Dashboard: ${params.dashboardUrl?.trim() || "Not created"}\n` +
          `Submitted: ${submittedAt} Pacific`,
      }),
    ),
  );
}

export async function sendForwardedSongEmail(params: {
  to: string;
  venueName: string;
  songUrl: string;
  title: string;
  sentByEmail: string;
}) {
  await sendRawSesEmail({
    to: params.to,
    subject: `${params.venueName} forwarded your Song Selfie track`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201733;">
        <h1 style="margin-bottom: 12px;">Your Song Selfie link was forwarded</h1>
        <p>${params.sentByEmail} forwarded <strong>${params.title}</strong> from ${params.venueName}.</p>
        <p><a href="${params.songUrl}" style="display: inline-block; padding: 12px 18px; background: #ff6b35; color: white; border-radius: 999px; text-decoration: none;">Play your song</a></p>
      </div>
    `,
    text:
      `Your Song Selfie link was forwarded.\n\n` +
      `${params.sentByEmail} forwarded ${params.title} from ${params.venueName}.\n\n` +
      `Play your song: ${params.songUrl}`,
  });
}

export async function sendVenuePayoutPreferenceEmail(params: {
  venueName: string;
  venueEmail: string;
  payoutMethod: string;
  details: string;
}) {
  const recipients = getBusinessLeadRecipients();
  const safeVenueName = escapeHtml(params.venueName);
  const safeVenueEmail = escapeHtml(params.venueEmail);
  const safeMethod = escapeHtml(params.payoutMethod);
  const safeDetails = escapeHtml(params.details || "No details provided");

  await Promise.all(
    recipients.map((to) =>
      sendRawSesEmail({
        to,
        subject: `Song Selfie payout request: ${params.venueName}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201733;">
            <h1 style="margin-bottom: 12px;">Venue payout preference</h1>
            <p><strong>Venue:</strong> ${safeVenueName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeVenueEmail}">${safeVenueEmail}</a></p>
            <p><strong>Preference:</strong> ${safeMethod}</p>
            <p><strong>Details:</strong></p>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${safeDetails}</pre>
          </div>
        `,
        text:
          `Venue payout preference\n\n` +
          `Venue: ${params.venueName}\n` +
          `Email: ${params.venueEmail}\n` +
          `Preference: ${params.payoutMethod}\n` +
          `Details: ${params.details || "No details provided"}`,
      }),
    ),
  );
}

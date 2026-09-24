const SENDER = "info@songselfie.com";
const REPLY_TO = "saul@anyaiyouwant.com";
const MAX_BODY_LENGTH = 100_000;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function validEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function authorized(header, secret) {
  if (!secret || !header?.startsWith("Bearer ")) return false;

  const provided = await digest(header.slice(7));
  const expected = await digest(secret);
  if (provided.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= provided[index] ^ expected[index];
  }
  return mismatch === 0;
}

function validPayload(payload) {
  return (
    payload &&
    validEmail(payload.to) &&
    typeof payload.subject === "string" &&
    payload.subject.length >= 1 &&
    payload.subject.length <= 200 &&
    typeof payload.html === "string" &&
    payload.html.length <= MAX_BODY_LENGTH &&
    typeof payload.text === "string" &&
    payload.text.length <= MAX_BODY_LENGTH
  );
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        status: "ok",
        provider: "cloudflare-email-service",
        sender: SENDER,
      });
    }

    if (url.pathname !== "/" || request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405);
    }

    if (!(await authorized(request.headers.get("authorization"), env.MAILER_SECRET))) {
      return json({ error: "Unauthorized." }, 401);
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    if (!validPayload(payload)) {
      return json({ error: "Invalid email payload." }, 400);
    }

    try {
      const result = await env.EMAIL.send({
        to: payload.to,
        from: { email: SENDER, name: "Song Selfie" },
        replyTo: REPLY_TO,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      return json({
        ok: true,
        messageId: result.messageId,
        delivered: result.delivered?.length ?? null,
        queued: result.queued?.length ?? null,
        permanentBounces: result.permanentBounces?.length ?? 0,
        suppressedRecipients: result.suppressedRecipients?.length ?? 0,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "Cloudflare email delivery failed",
          name: error instanceof Error ? error.name : "UnknownError",
          code:
            error && typeof error === "object" && "code" in error
              ? String(error.code)
              : null,
        }),
      );
      return json({ error: "Cloudflare could not deliver this email." }, 502);
    }
  },
};

export default worker;

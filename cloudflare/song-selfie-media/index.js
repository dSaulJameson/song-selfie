const encoder = new TextEncoder();
const maxObjectBytes = 95 * 1024 * 1024;
const objectPathPrefix = "/objects/";
const allowedPrefixes = ["songs/", "uploads/temp/", "slideshows/temp/"];

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function authorized(header, secret) {
  if (!secret || !header?.startsWith("Bearer ")) return false;

  const supplied = header.slice(7);
  const [suppliedHash, secretHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
    crypto.subtle.digest("SHA-256", encoder.encode(secret)),
  ]);
  const left = new Uint8Array(suppliedHash);
  const right = new Uint8Array(secretHash);
  let difference = left.length ^ right.length;

  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

function validKey(key) {
  return (
    key.length > 0 &&
    key.length <= 512 &&
    !key.includes("..") &&
    !key.includes("//") &&
    /^[a-z0-9][a-z0-9/_.-]*$/i.test(key) &&
    allowedPrefixes.some((prefix) => key.startsWith(prefix))
  );
}

function storageKey(url) {
  if (!url.pathname.startsWith(objectPathPrefix)) return null;

  try {
    const key = decodeURIComponent(url.pathname.slice(objectPathPrefix.length));
    return validKey(key) ? key : null;
  } catch {
    return null;
  }
}

function objectHeaders(object, key) {
  const headers = new Headers({
    "accept-ranges": "bytes",
    "access-control-allow-origin": "*",
    "cache-control": key.startsWith("songs/")
      ? "public, max-age=86400"
      : "public, max-age=300",
    etag: object.httpEtag,
    "x-content-type-options": "nosniff",
  });
  object.writeHttpMetadata(headers);
  return headers;
}

async function readObject(request, env, key) {
  if (request.method === "HEAD") {
    const object = await env.MEDIA_BUCKET.head(key);
    if (!object) return json({ error: "Not found." }, 404);
    const headers = objectHeaders(object, key);
    headers.set("content-length", String(object.size));
    return new Response(null, { headers });
  }

  const rangeRequested = request.headers.has("range");
  const object = await env.MEDIA_BUCKET.get(key, {
    range: request.headers,
    onlyIf: request.headers,
  });
  if (!object) return json({ error: "Not found." }, 404);

  const headers = objectHeaders(object, key);
  if (!object.body) return new Response(null, { status: 304, headers });

  const range = object.range;
  if (rangeRequested && range && "offset" in range && "length" in range) {
    headers.set("content-length", String(range.length));
    headers.set(
      "content-range",
      `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`,
    );
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
}

async function writeObject(request, env, key) {
  const contentLength = Number(request.headers.get("content-length"));
  if (
    !Number.isInteger(contentLength) ||
    contentLength < 1 ||
    contentLength > maxObjectBytes ||
    !request.body
  ) {
    return json({ error: "Invalid object size." }, 413);
  }

  const contentType = (request.headers.get("content-type") || "application/octet-stream").slice(
    0,
    255,
  );
  await env.MEDIA_BUCKET.put(key, request.body, {
    httpMetadata: {
      contentType,
      cacheControl: key.startsWith("songs/")
        ? "public, max-age=86400"
        : "public, max-age=300",
    },
    customMetadata: { application: "song-selfie" },
  });

  return json({ ok: true, key }, 201);
}

async function listObjects(url, env) {
  const prefix = url.searchParams.get("prefix") || "";
  const cursor = url.searchParams.get("cursor") || undefined;
  if (!allowedPrefixes.includes(prefix)) return json({ error: "Invalid prefix." }, 400);

  const result = await env.MEDIA_BUCKET.list({
    prefix,
    cursor,
    limit: 1000,
  });

  return json({
    objects: result.objects.map((object) => ({
      key: object.key,
      size: object.size,
      uploaded: object.uploaded.toISOString(),
      etag: object.httpEtag,
    })),
    truncated: result.truncated,
    cursor: result.truncated ? result.cursor : null,
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ status: "ok", storage: "r2" });
    }

    try {
      if (url.pathname === "/admin/objects" && request.method === "GET") {
        if (!(await authorized(request.headers.get("authorization"), env.GATEWAY_SECRET))) {
          return json({ error: "Unauthorized." }, 401);
        }
        return listObjects(url, env);
      }

      const key = storageKey(url);
      if (!key) return json({ error: "Invalid object key." }, 400);

      if (request.method === "GET" || request.method === "HEAD") {
        return readObject(request, env, key);
      }

      if (!(await authorized(request.headers.get("authorization"), env.GATEWAY_SECRET))) {
        return json({ error: "Unauthorized." }, 401);
      }

      if (request.method === "PUT") return writeObject(request, env, key);
      if (request.method === "DELETE") {
        await env.MEDIA_BUCKET.delete(key);
        return new Response(null, { status: 204 });
      }

      return json({ error: "Method not allowed." }, 405);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "Song Selfie R2 gateway request failed",
          method: request.method,
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return json({ error: "Object storage request failed." }, 502);
    }
  },
};

export default worker;

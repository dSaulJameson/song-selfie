import { getObjectStorageConfig } from "@/lib/env";
import { slugify } from "@/lib/utils";

const TEMP_MEDIA_PREFIXES = ["uploads/temp/", "slideshows/temp/"] as const;

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function getConfiguredStorage() {
  const config = getObjectStorageConfig();
  if (!config.gatewayUrl || !config.gatewaySecret) {
    throw new Error("Cloudflare R2 media storage is not fully configured.");
  }
  return config;
}

function getObjectUrl(key: string) {
  const config = getConfiguredStorage();
  const publicBaseUrl = config.publicBaseUrl || `${config.gatewayUrl}/objects`;
  return `${publicBaseUrl}/${encodeObjectKey(key)}`;
}

function sanitizeObjectName(fileName: string, fallbackExtension: string) {
  const trimmed = fileName.trim();
  const extensionMatch = trimmed.match(/\.([a-z0-9]{2,8})$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? fallbackExtension;
  const baseName = extensionMatch ? trimmed.slice(0, -extensionMatch[0].length) : trimmed;
  const normalizedBase = slugify(baseName) || "asset";
  return `${normalizedBase}.${extension}`;
}

async function gatewayRequest(path: string, init: RequestInit = {}) {
  const config = getConfiguredStorage();
  return fetch(`${config.gatewayUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${config.gatewaySecret}`,
      ...init.headers,
    },
    cache: "no-store",
  });
}

async function uploadBuffer(params: { key: string; buffer: Buffer; contentType: string }) {
  const response = await gatewayRequest(`/objects/${encodeObjectKey(params.key)}`, {
    method: "PUT",
    headers: {
      "content-length": String(params.buffer.byteLength),
      "content-type": params.contentType,
    },
    body: new Uint8Array(params.buffer),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare R2 rejected an upload with status ${response.status}.`);
  }

  return {
    key: params.key,
    publicUrl: getObjectUrl(params.key),
  };
}

export function hasObjectStorage() {
  const config = getObjectStorageConfig();
  return Boolean(config.gatewayUrl && config.gatewaySecret);
}

export async function uploadSong(params: {
  buffer: Buffer;
  orderId: string;
  venueSlug: string;
}) {
  const key = `songs/${params.venueSlug}/${params.orderId}.mp3`;
  return uploadBuffer({ key, buffer: params.buffer, contentType: "audio/mpeg" });
}

export async function uploadPhoto(params: {
  batchId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}) {
  const fallbackExtension = params.contentType.includes("png")
    ? "png"
    : params.contentType.includes("webp")
      ? "webp"
      : "jpg";
  const safeFileName = sanitizeObjectName(params.fileName, fallbackExtension);
  const key = `uploads/temp/${params.batchId}/${Date.now()}-${safeFileName}`;
  return uploadBuffer({ key, buffer: params.buffer, contentType: params.contentType });
}

export async function uploadSlideshow(params: {
  buffer: Buffer;
  orderId: string;
  venueSlug: string;
}) {
  const key = `slideshows/temp/${params.venueSlug}/${params.orderId}.mp4`;
  return uploadBuffer({ key, buffer: params.buffer, contentType: "video/mp4" });
}

type ListedObject = {
  key: string;
  uploaded: string;
};

export async function cleanupTemporaryMedia(options?: {
  olderThanHours?: number;
  prefixes?: string[];
}) {
  if (!hasObjectStorage()) return { deleted: 0 };

  const olderThanHours = options?.olderThanHours ?? 24;
  const prefixes = options?.prefixes ?? [...TEMP_MEDIA_PREFIXES];
  const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
  let deleted = 0;

  for (const prefix of prefixes) {
    let cursor: string | null = null;

    do {
      const query = new URLSearchParams({ prefix });
      if (cursor) query.set("cursor", cursor);
      const response = await gatewayRequest(`/admin/objects?${query}`);
      if (!response.ok) {
        throw new Error(`Cloudflare R2 rejected a listing with status ${response.status}.`);
      }

      const result = (await response.json()) as {
        objects: ListedObject[];
        truncated: boolean;
        cursor: string | null;
      };
      const staleObjects = result.objects.filter(
        (object) => new Date(object.uploaded).getTime() < cutoff,
      );

      for (const object of staleObjects) {
        const deleteResponse = await gatewayRequest(`/objects/${encodeObjectKey(object.key)}`, {
          method: "DELETE",
        });
        if (!deleteResponse.ok) {
          throw new Error(`Cloudflare R2 rejected a delete with status ${deleteResponse.status}.`);
        }
        deleted += 1;
      }

      cursor = result.truncated ? result.cursor : null;
    } while (cursor);
  }

  return { deleted };
}

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getS3Config } from "@/lib/env";
import { slugify } from "@/lib/utils";

let s3Client: S3Client | null = null;
const TEMP_MEDIA_PREFIXES = ["uploads/temp/", "slideshows/temp/"] as const;

function getS3Client() {
  if (!s3Client) {
    const config = getS3Config();
    if (!config.bucket || !config.region || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error("S3 is not fully configured.");
    }
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return s3Client;
}

function getPublicS3Url(key: string) {
  const config = getS3Config();
  if (!config.bucket || !config.region) {
    throw new Error("S3 is not fully configured.");
  }

  return config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

function sanitizeObjectName(fileName: string, fallbackExtension: string) {
  const trimmed = fileName.trim();
  const extensionMatch = trimmed.match(/\.([a-z0-9]{2,8})$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? fallbackExtension;
  const baseName = extensionMatch
    ? trimmed.slice(0, -extensionMatch[0].length)
    : trimmed;
  const normalizedBase = slugify(baseName) || "asset";
  return `${normalizedBase}.${extension}`;
}

async function uploadBufferToS3(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}) {
  const config = getS3Config();
  if (!config.bucket || !config.region || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("S3 is not fully configured.");
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    }),
  );

  return {
    key: params.key,
    publicUrl: getPublicS3Url(params.key),
  };
}

export async function uploadSongToS3(params: {
  buffer: Buffer;
  orderId: string;
  venueSlug: string;
}) {
  const key = `songs/${params.venueSlug}/${params.orderId}.mp3`;
  return uploadBufferToS3({
    key,
    buffer: params.buffer,
    contentType: "audio/mpeg",
  });
}

export async function uploadPhotoToS3(params: {
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

  return uploadBufferToS3({
    key,
    buffer: params.buffer,
    contentType: params.contentType,
  });
}

export async function uploadSlideshowToS3(params: {
  buffer: Buffer;
  orderId: string;
  venueSlug: string;
}) {
  const key = `slideshows/temp/${params.venueSlug}/${params.orderId}.mp4`;
  return uploadBufferToS3({
    key,
    buffer: params.buffer,
    contentType: "video/mp4",
  });
}

export async function cleanupTemporaryMedia(options?: {
  olderThanHours?: number;
  prefixes?: string[];
}) {
  const config = getS3Config();
  if (!config.bucket || !config.region || !config.accessKeyId || !config.secretAccessKey) {
    return { deleted: 0 };
  }

  const client = getS3Client();
  const olderThanHours = options?.olderThanHours ?? 24;
  const prefixes = options?.prefixes ?? [...TEMP_MEDIA_PREFIXES];
  const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
  let deleted = 0;

  for (const prefix of prefixes) {
    let continuationToken: string | undefined;

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const staleObjects =
        response.Contents?.filter((item) => {
          const lastModified = item.LastModified?.getTime();
          return Boolean(item.Key && lastModified && lastModified < cutoff);
        }).map((item) => ({ Key: item.Key! })) ?? [];

      if (staleObjects.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: config.bucket,
            Delete: {
              Objects: staleObjects,
              Quiet: true,
            },
          }),
        );
        deleted += staleObjects.length;
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  return { deleted };
}

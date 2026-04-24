import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getS3Config } from "@/lib/env";

let s3Client: S3Client | null = null;

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

export async function uploadSongToS3(params: {
  buffer: Buffer;
  orderId: string;
  venueSlug: string;
}) {
  const config = getS3Config();
  if (!config.bucket || !config.region || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("S3 is not fully configured.");
  }
  const client = getS3Client();
  const key = `songs/${params.venueSlug}/${params.orderId}.mp3`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: params.buffer,
      ContentType: "audio/mpeg",
    }),
  );

  const publicUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

  return { key, publicUrl };
}

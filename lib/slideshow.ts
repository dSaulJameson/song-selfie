import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";

import type { UploadedPhotoAsset } from "@/lib/schema";

const execFileAsync = promisify(execFile);

function toConcatPath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/'/g, "'\\''");
}

function getExtensionFromAsset(asset: UploadedPhotoAsset) {
  if (asset.contentType.includes("png")) {
    return "png";
  }
  if (asset.contentType.includes("webp")) {
    return "webp";
  }
  return "jpg";
}

async function downloadAsset(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not download slideshow asset (${response.status}).`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function createSongSlideshow(params: {
  orderId: string;
  durationSeconds: number;
  audioBuffer: Buffer;
  photoAssets: UploadedPhotoAsset[];
}) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not resolve a binary path.");
  }

  if (params.photoAssets.length === 0) {
    throw new Error("At least one photo is required to build a slideshow.");
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "song-selfie-slideshow-"));

  try {
    const audioPath = path.join(tempDir, `${params.orderId}.mp3`);
    await fs.writeFile(audioPath, params.audioBuffer);

    const imagePaths: string[] = [];
    for (let index = 0; index < params.photoAssets.length; index += 1) {
      const asset = params.photoAssets[index];
      const extension = getExtensionFromAsset(asset);
      const imagePath = path.join(tempDir, `photo-${index}.${extension}`);
      const buffer = await downloadAsset(asset.url);
      await fs.writeFile(imagePath, buffer);
      imagePaths.push(imagePath);
    }

    const secondsPerImage = Math.max(
      1.6,
      Number((params.durationSeconds / params.photoAssets.length).toFixed(2)),
    );
    const concatManifestPath = path.join(tempDir, "slideshow.txt");
    const concatManifest = [
      ...imagePaths.flatMap((imagePath) => [
        `file '${toConcatPath(imagePath)}'`,
        `duration ${secondsPerImage}`,
      ]),
      `file '${toConcatPath(imagePaths.at(-1)!)}'`,
    ].join("\n");
    await fs.writeFile(concatManifestPath, concatManifest);

    const outputPath = path.join(tempDir, `${params.orderId}.mp4`);
    await execFileAsync(ffmpegPath, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatManifestPath,
      "-i",
      audioPath,
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      outputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

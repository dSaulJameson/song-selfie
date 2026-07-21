import { NextResponse } from "next/server";

import { cleanupTemporaryMedia, uploadPhotoToS3 } from "@/lib/s3";
import type { UploadedPhotoAsset } from "@/lib/schema";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const runtime = "nodejs";

function isFile(value: FormDataEntryValue): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("photos").filter(isFile);

    if (files.length === 0) {
      return NextResponse.json({ error: "Please add at least one photo." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Please upload ${MAX_FILES} photos or fewer.` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Use JPG, PNG, or WebP images only." },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Keep each photo under 12MB." },
          { status: 400 },
        );
      }
    }

    const batchId = crypto.randomUUID();
    const assets = await Promise.all(
      files.map(async (file) => {
        const upload = await uploadPhotoToS3({
          batchId,
          fileName: file.name || "photo.jpg",
          contentType: file.type,
          buffer: Buffer.from(await file.arrayBuffer()),
        });

        return {
          key: upload.key,
          url: upload.publicUrl,
          name: file.name || "photo.jpg",
          contentType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        } satisfies UploadedPhotoAsset;
      }),
    );

    void cleanupTemporaryMedia({ olderThanHours: 24 });

    return NextResponse.json({
      batchId,
      assets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload photos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

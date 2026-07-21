import {
  claimQueuedOrders,
  completeOrder,
  countProcessingOrders,
  failOrder,
  getOrderById,
  getVenueById,
  listCompletedOrdersMissingEmail,
  listStaleProcessingOrders,
  mergeOrderMetadata,
  markOrderEmailed,
  requeueProcessingOrderWithoutGeneration,
  releaseQueueLock,
  tryAcquireQueueLock,
  updateOrderGenerationState,
} from "@/lib/db";
import {
  createFineTuneGeneration,
  getFineTuneGeneration,
} from "@/lib/finetune";
import {
  analyzePhotoStory,
  buildFallbackSongPacket,
  generateSongPacket,
} from "@/lib/openrouter";
import { buildPromptPackage } from "@/lib/prompt-builder";
import { songRequestSchema } from "@/lib/schema";
import {
  cleanupTemporaryMedia,
  uploadSlideshowToS3,
  uploadSongToS3,
} from "@/lib/s3";
import { sendSongReadyEmails } from "@/lib/ses";
import { createSongSlideshow } from "@/lib/slideshow";

const QUEUE_LOCK_ID = 41022;
const MAX_CONCURRENT_GENERATIONS = 10;

const FINETUNE_KEY_MAP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

async function deliverCompletedOrderEmail(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order || order.status !== "completed" || !order.songUrl || order.emailedAt) {
    return order;
  }

  const venue = await getVenueById(order.venueId);
  if (!venue) {
    return order;
  }

  const input = songRequestSchema.parse(order.rawInputs);
  const slideshowUrl =
    typeof order.metadata?.slideshowUrl === "string" ? order.metadata.slideshowUrl : null;

  await sendSongReadyEmails({
    customerEmail: order.customerEmail,
    venueEmail: venue.contactEmail,
    venueName: venue.name,
    songUrl: order.songUrl,
    slideshowUrl,
    prompt: order.generatedPrompt ?? "Your Song Selfie custom song is ready.",
    names: input.names,
  });

  await markOrderEmailed(orderId);
  return getOrderById(orderId);
}

async function finalizeCompletedOrder(orderId: string) {
  const existingOrder = await getOrderById(orderId);
  if (!existingOrder) {
    return null;
  }
  if (existingOrder.songUrl) {
    try {
      return await deliverCompletedOrderEmail(orderId);
    } catch (error) {
      console.error("Song email delivery failed", {
        orderId,
        message: error instanceof Error ? error.message : "Unknown SES error",
      });
      return getOrderById(orderId);
    }
  }
  if (!existingOrder.finetuneGenerationId) {
    return existingOrder;
  }

  const venue = await getVenueById(existingOrder.venueId);
  if (!venue) {
    await failOrder(orderId, "Venue was deleted before generation could complete.");
    return null;
  }

  const input = songRequestSchema.parse(existingOrder.rawInputs);
  const generation = await getFineTuneGeneration(existingOrder.finetuneGenerationId);
  const status = generation.status.toLowerCase();

  if (status === "failed" || status === "error" || status === "cancelled") {
    throw new Error(
      generation.errorMessage ||
        generation.error ||
        `FineTune generation ${existingOrder.finetuneGenerationId} failed with status ${status}.`,
    );
  }

  if (status !== "completed" && status !== "succeeded") {
    return existingOrder;
  }

  const audioUrl =
    (generation.audioUrl as string | undefined) ??
    (generation.audio_url as string | undefined);

  if (!audioUrl) {
    throw new Error("FineTune completed without returning an audio URL.");
  }

  const audioResponse = await fetch(audioUrl, { cache: "no-store" });
  if (!audioResponse.ok) {
    throw new Error(`Could not download generated audio (${audioResponse.status}).`);
  }

  const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
  let songUrl = audioUrl;
  let s3Key = "";
  let slideshowUrl: string | null = null;
  let slideshowKey: string | null = null;

  try {
    const upload = await uploadSongToS3({
      buffer: audioBuffer,
      orderId,
      venueSlug: venue.slug,
    });
    songUrl = upload.publicUrl;
    s3Key = upload.key;
  } catch {
    // Fall back to the provider-hosted audio URL when S3 is not configured.
  }

  if (input.photoAssets.length > 0) {
    try {
      const slideshowBuffer = await createSongSlideshow({
        orderId,
        durationSeconds: input.duration,
        audioBuffer,
        photoAssets: input.photoAssets,
      });
      const upload = await uploadSlideshowToS3({
        buffer: slideshowBuffer,
        orderId,
        venueSlug: venue.slug,
      });
      slideshowUrl = upload.publicUrl;
      slideshowKey = upload.key;
      await mergeOrderMetadata(orderId, {
        slideshowUrl,
        slideshowKey,
        mediaExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error("Slideshow generation failed", {
        orderId,
        message: error instanceof Error ? error.message : "Unknown slideshow error",
      });
    }
  }

  await completeOrder({
    orderId,
    songUrl,
    s3Key,
    finetuneResponse: generation as Record<string, unknown>,
  });

  try {
    await deliverCompletedOrderEmail(orderId);
  } catch (error) {
    console.error("Song email delivery failed", {
      orderId,
      message: error instanceof Error ? error.message : "Unknown SES error",
    });
  }

  try {
    await cleanupTemporaryMedia({ olderThanHours: 24 });
  } catch (error) {
    console.error("Temporary media cleanup failed", {
      orderId,
      message: error instanceof Error ? error.message : "Unknown cleanup error",
    });
  }

  return getOrderById(orderId);
}

async function sweepQueueBacklog() {
  const staleOrders = await listStaleProcessingOrders({
    olderThanMinutes: 5,
    limit: MAX_CONCURRENT_GENERATIONS * 2,
  });

  await Promise.allSettled(
    staleOrders.map(async (order) => {
      if (order.finetuneGenerationId) {
        await recoverProcessingOrder(order.id);
        return;
      }

      await requeueProcessingOrderWithoutGeneration(order.id);
    }),
  );

  const missingEmailOrders = await listCompletedOrdersMissingEmail(20);
  await Promise.allSettled(
    missingEmailOrders.map(async (order) => {
      try {
        await deliverCompletedOrderEmail(order.id);
      } catch (error) {
        console.error("Missed completion email recovery failed", {
          orderId: order.id,
          message: error instanceof Error ? error.message : "Unknown SES recovery error",
        });
      }
    }),
  );
}

export async function recoverProcessingOrder(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order || order.status !== "processing" || !order.finetuneGenerationId) {
    return order;
  }

  try {
    return await finalizeCompletedOrder(orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation recovery error";
    await failOrder(orderId, message);
    return getOrderById(orderId);
  }
}

async function processOrder(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) {
    return;
  }

  const venue = await getVenueById(order.venueId);
  if (!venue) {
    await failOrder(orderId, "Venue was deleted before generation could start.");
    return;
  }

  try {
    const input = songRequestSchema.parse(order.rawInputs);
    let photoStory = null;

    if (input.photoAssets.length > 0) {
      try {
        photoStory = await analyzePhotoStory(input.photoAssets, {
          story: input.story,
          names: input.names,
          venueName: venue.name,
        });
        await mergeOrderMetadata(orderId, { photoStory });
      } catch (error) {
        console.error("Photo analysis failed, continuing without image context", {
          orderId,
          message: error instanceof Error ? error.message : "Unknown photo analysis error",
        });
      }
    }

    const promptContext = { venueName: venue.name, photoStory };
    const promptPackage = buildPromptPackage(input, promptContext);
    let songPacket = buildFallbackSongPacket(input, promptContext);

    try {
      songPacket = await generateSongPacket(input, promptContext);
    } catch (error) {
      console.error("OpenRouter lyric generation failed, using fallback packet", {
        orderId,
        message: error instanceof Error ? error.message : "Unknown OpenRouter error",
      });
    }

    const generationPayload = {
      tags: songPacket.tags,
      lyrics: songPacket.lyrics || promptPackage.lyrics,
      duration: input.duration,
      bpm: input.bpm ?? undefined,
      language: input.language,
      key:
        input.key === "auto" ? undefined : (FINETUNE_KEY_MAP[input.key] ?? input.key),
      scale: input.scale === "auto" ? undefined : input.scale,
      timesignature: input.timesignature,
      seed: input.seed ?? undefined,
    };

    const generation = await createFineTuneGeneration(generationPayload);

    await updateOrderGenerationState({
      orderId,
      generatedPrompt: songPacket.naturalPrompt,
      finetuneGenerationId: generation.id,
      finetuneRequest: {
        ...generationPayload,
        openrouterModel: songPacket.model,
        openrouterUsedFallback: songPacket.usedFallback,
        openrouterContentProfile: songPacket.contentProfile,
        openrouterExplicitRoute: songPacket.explicit,
        fallbackPrompt: promptPackage.naturalPrompt,
      },
    });

    await finalizeCompletedOrder(orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    await failOrder(orderId, message);
  }
}

export async function ensureCompletedOrderDelivery(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order || order.status !== "completed" || order.emailedAt) {
    return order;
  }

  try {
    return await deliverCompletedOrderEmail(orderId);
  } catch (error) {
    console.error("Completion email recovery failed", {
      orderId,
      message: error instanceof Error ? error.message : "Unknown SES recovery error",
    });
    return getOrderById(orderId);
  }
}

export async function drainGenerationQueue() {
  const locked = await tryAcquireQueueLock(QUEUE_LOCK_ID);
  if (!locked) {
    return { started: 0, skipped: true };
  }

  try {
    await sweepQueueBacklog();

    const activeCount = await countProcessingOrders();
    const availableSlots = Math.max(0, MAX_CONCURRENT_GENERATIONS - activeCount);

    if (availableSlots === 0) {
      return { started: 0, skipped: false };
    }

    const claimed = await claimQueuedOrders(availableSlots);
    await Promise.allSettled(claimed.map((order) => processOrder(order.id)));

    return { started: claimed.length, skipped: false };
  } finally {
    await releaseQueueLock(QUEUE_LOCK_ID);
  }
}

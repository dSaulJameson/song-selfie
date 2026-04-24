import {
  claimQueuedOrders,
  completeOrder,
  countProcessingOrders,
  failOrder,
  getOrderById,
  getVenueById,
  markOrderEmailed,
  releaseQueueLock,
  tryAcquireQueueLock,
  updateOrderGenerationState,
} from "@/lib/db";
import { createFineTuneGeneration, waitForFineTuneCompletion } from "@/lib/finetune";
import { buildFallbackSongPacket, generateSongPacket } from "@/lib/openrouter";
import { buildPromptPackage } from "@/lib/prompt-builder";
import { songRequestSchema } from "@/lib/schema";
import { uploadSongToS3 } from "@/lib/s3";
import { sendSongReadyEmails } from "@/lib/ses";

const QUEUE_LOCK_ID = 41022;
const MAX_CONCURRENT_GENERATIONS = 10;

const FINETUNE_KEY_MAP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

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
    const promptPackage = buildPromptPackage(input, { venueName: venue.name });
    let songPacket = buildFallbackSongPacket(input, { venueName: venue.name });

    try {
      songPacket = await generateSongPacket(input, { venueName: venue.name });
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

    const completedGeneration = await waitForFineTuneCompletion(generation.id);
    const audioUrl =
      (completedGeneration.audioUrl as string | undefined) ??
      (completedGeneration.audio_url as string | undefined);

    if (!audioUrl) {
      throw new Error("FineTune completed without returning an audio URL.");
    }

    const audioResponse = await fetch(audioUrl, { cache: "no-store" });
    if (!audioResponse.ok) {
      throw new Error(`Could not download generated audio (${audioResponse.status}).`);
    }

    let songUrl = audioUrl;
    let s3Key = "";

    try {
      const buffer = Buffer.from(await audioResponse.arrayBuffer());
      const upload = await uploadSongToS3({
        buffer,
        orderId,
        venueSlug: venue.slug,
      });
      songUrl = upload.publicUrl;
      s3Key = upload.key;
    } catch {
      // Fall back to the provider-hosted audio URL when S3 is not configured.
    }

    await completeOrder({
      orderId,
      songUrl,
      s3Key,
      finetuneResponse: completedGeneration as Record<string, unknown>,
    });

    try {
      await sendSongReadyEmails({
        customerEmail: order.customerEmail,
        venueEmail: venue.contactEmail,
        venueName: venue.name,
        songUrl,
        prompt: songPacket.naturalPrompt,
        names: input.names,
      });

      await markOrderEmailed(orderId);
    } catch (error) {
      console.error("Song email delivery failed", {
        orderId,
        message: error instanceof Error ? error.message : "Unknown SES error",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    await failOrder(orderId, message);
  }
}

export async function drainGenerationQueue() {
  const locked = await tryAcquireQueueLock(QUEUE_LOCK_ID);
  if (!locked) {
    return { started: 0, skipped: true };
  }

  try {
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

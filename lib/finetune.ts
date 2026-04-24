import { getFineTuneConfig } from "@/lib/env";
import { sleep } from "@/lib/utils";

type FineTunePayload = {
  tags: string;
  lyrics?: string;
  duration?: number;
  bpm?: number;
  language?: string;
  key?: string;
  scale?: string;
  timesignature?: string;
  seed?: number;
};

export type FineTuneGeneration = {
  id: string;
  status: string;
  audio_url?: string;
  audioUrl?: string;
  error?: string;
  errorMessage?: string | null;
  [key: string]: unknown;
};

type FineTuneEnvelope<T> = {
  data: T;
};

async function finetuneFetch<T>(path: string, init?: RequestInit) {
  const config = getFineTuneConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "X-API-Key": config.apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`FineTune API error (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as T | FineTuneEnvelope<T>;
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data !== undefined
  ) {
    return payload.data;
  }

  return payload as T;
}

export async function createFineTuneGeneration(payload: FineTunePayload) {
  return finetuneFetch<FineTuneGeneration>("/v1/generations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFineTuneGeneration(id: string) {
  return finetuneFetch<FineTuneGeneration>(`/v1/generations/${id}`);
}

export async function waitForFineTuneCompletion(id: string) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const generation = await getFineTuneGeneration(id);
    const status = generation.status.toLowerCase();

    if (status === "completed" || status === "succeeded") {
      return generation;
    }

    if (status === "failed" || status === "error" || status === "cancelled") {
      throw new Error(
        generation.errorMessage ||
          generation.error ||
          `FineTune generation ${id} failed with status ${status}.`,
      );
    }

    await sleep(Math.min(5000, 1500 + attempt * 125));
  }

  throw new Error(`FineTune generation ${id} timed out while polling.`);
}

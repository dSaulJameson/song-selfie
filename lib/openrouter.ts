import { z } from "zod";

import { getBaseUrl, getOpenRouterConfig } from "@/lib/env";
import {
  buildPromptPackage,
  getLyricCharacterBudget,
  getLyricLineBudget,
} from "@/lib/prompt-builder";
import type { SongRequestInput } from "@/lib/schema";
import { safeJsonParse } from "@/lib/utils";

const openRouterSongPacketSchema = z.object({
  title: z.string().trim().min(1).max(80),
  tags: z.string().trim().min(1).max(500),
  lyrics: z.string().trim().min(1).max(2000),
  contentProfile: z.enum(["safe", "mature"]).optional(),
});

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  model?: string;
};

type OpenRouterMessageContent =
  | string
  | Array<{ type?: string; text?: string }>
  | undefined;

export type GeneratedSongPacket = z.infer<typeof openRouterSongPacketSchema> & {
  naturalPrompt: string;
  model: string;
  usedFallback: boolean;
  explicit: boolean;
};

function limitText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function normalizeLyrics(value: string, maxCharacters: number, maxLines: number) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);

  let resultLines: string[] = [];
  for (const line of lines) {
    if (resultLines.length >= maxLines) {
      break;
    }

    const nextCandidate = [...resultLines, line].join("\n");
    if (nextCandidate.length > maxCharacters) {
      break;
    }

    resultLines = [...resultLines, line];
  }

  const result = resultLines.join("\n").trim();
  if (result) {
    return result;
  }

  return normalized.slice(0, maxCharacters).trim();
}

function extractJsonObject(value: string) {
  const direct = safeJsonParse<unknown>(value);
  if (direct && typeof direct === "object") {
    return direct;
  }

  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return safeJsonParse<unknown>(value.slice(start, end + 1));
}

function getMessageText(content: OpenRouterMessageContent) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export function buildFallbackSongPacket(
  input: SongRequestInput,
  context?: { venueName?: string },
): GeneratedSongPacket {
  const promptPackage = buildPromptPackage(input, context);
  const lyricCharacterBudget = getLyricCharacterBudget(input.duration);
  const lyricLineBudget = getLyricLineBudget(input.duration);

  return {
    title: promptPackage.title,
    naturalPrompt: promptPackage.naturalPrompt,
    tags: promptPackage.tags,
    lyrics: normalizeLyrics(
      promptPackage.lyrics ||
        [
          "[Hook]",
          `Tonight belongs to ${promptPackage.subject}.`,
          "[Verse 1]",
          `${promptPackage.subject} is in the spotlight tonight.`,
          "[Chorus]",
          `Raise it up for ${promptPackage.subject}.`,
          "[Outro]",
          "One more chorus and fade.",
        ].join("\n"),
      lyricCharacterBudget,
      lyricLineBudget,
    ),
    contentProfile: promptPackage.explicit ? "mature" : "safe",
    model: "fallback",
    usedFallback: true,
    explicit: promptPackage.explicit,
  };
}

export async function generateSongPacket(
  input: SongRequestInput,
  context?: { venueName?: string },
): Promise<GeneratedSongPacket> {
  const promptPackage = buildPromptPackage(input, context);
  const config = getOpenRouterConfig();
  const selectedModel = promptPackage.explicit ? config.explicitModel : config.safeModel;
  const lyricCharacterBudget = getLyricCharacterBudget(input.duration);
  const lyricLineBudget = getLyricLineBudget(input.duration);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getBaseUrl(),
      "X-Title": config.appName,
    },
    body: JSON.stringify({
      model: selectedModel,
      temperature: 0.7,
      max_completion_tokens: 900,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You write production-ready lyric packets for a music generation API. Return valid JSON only. The JSON must include title, tags, lyrics, and optional contentProfile. Keep title under 80 characters. Keep tags under 500 characters and make them a concise comma-separated production brief for a music model, not prose. Make the requested genre unmistakable by using concrete production language and sonic anchors instead of generic labels. Keep lyrics under 2000 characters as plain text with bracketed section headers such as [Verse 1], [Chorus], and [Bridge]. Match the requested language. Do not wrap the JSON in markdown.",
        },
        {
          role: "user",
          content: JSON.stringify({
            app: "Song Selfie",
            venueName: context?.venueName ?? null,
            requestedLanguage: input.language,
            durationSeconds: input.duration,
            bpm: input.bpm,
            key: input.key,
            scale: input.scale,
            timeSignature: input.timesignature,
            lyricCharacterBudget,
            lyricLineBudget,
            modelRouting: promptPackage.explicit ? "mature_or_explicit" : "standard",
            prompt: promptPackage.naturalPrompt,
            lyricBrief: promptPackage.lyricBrief,
            fallbackTags: promptPackage.tags,
            lyricSeed: promptPackage.lyrics ?? null,
            requiredJsonShape: {
              title: "string",
              tags: "string",
              lyrics: "string",
              contentProfile: "safe | mature",
            },
          }),
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as OpenRouterChatResponse;
  const content = getMessageText(payload.choices?.[0]?.message?.content);
  const parsed = extractJsonObject(content);
  const songPacket = openRouterSongPacketSchema.parse(parsed);

  return {
    title: limitText(songPacket.title, 80),
    naturalPrompt: promptPackage.naturalPrompt,
    tags: limitText(songPacket.tags, 500),
    lyrics: normalizeLyrics(songPacket.lyrics, lyricCharacterBudget, lyricLineBudget),
    contentProfile: songPacket.contentProfile ?? (promptPackage.explicit ? "mature" : "safe"),
    model: payload.model || selectedModel,
    usedFallback: false,
    explicit: promptPackage.explicit,
  };
}

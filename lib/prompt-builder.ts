import type { SongRequestInput } from "@/lib/schema";

const SONG_TYPE_DESCRIPTORS: Record<
  SongRequestInput["songType"],
  { headline: string; tag: string }
> = {
  "epic-battle": {
    headline: "epic battle song",
    tag: "cinematic clash anthem",
  },
  "love-song": {
    headline: "love song",
    tag: "romantic slow-burn pop",
  },
  "party-anthem": {
    headline: "party anthem",
    tag: "festival-ready singalong banger",
  },
  "funny-roast": {
    headline: "funny roast song",
    tag: "playful roast comedy track",
  },
  "sexy-vibe": {
    headline: "late-night sexy vibe",
    tag: "sleek sensual groove",
  },
  "chill-vibe": {
    headline: "chill vibe track",
    tag: "laid-back cool-down groove",
  },
  "story-mode": {
    headline: "story mode anthem",
    tag: "narrative-driven scene setter",
  },
};

const MOOD_TAGS: Record<SongRequestInput["mood"], string> = {
  chill: "smooth and easygoing",
  happy: "bright and celebratory",
  aggressive: "sharp, aggressive, and high-impact",
  emotional: "heartfelt and dramatic",
  hype: "hype, loud, and peak-hour ready",
};

const STRUCTURE_TAGS: Record<SongRequestInput["structure"], string> = {
  "instant-hook": "opens with the hook immediately",
  "story-arc": "builds like a story with a payoff ending",
  "drop-heavy": "leans into a huge drop and payoff chorus",
  "slow-burn": "starts sparse and blooms over time",
  "singalong-chorus": "features an instant singalong chorus",
};

const ENERGY_MAP: Record<number, string> = {
  1: "barely-there afterglow",
  2: "cool head-nod energy",
  3: "balanced mid-tempo lift",
  4: "crowd-up, hands-high momentum",
  5: "full-send explosive energy",
};

function splitNames(value: string) {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function limitText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

export function buildPromptPackage(
  input: SongRequestInput,
  context?: { venueName?: string },
) {
  const names = splitNames(input.names);
  const subject =
    names.length > 0
      ? names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
      : "this table";

  const storySnippet = input.story
    ? `around ${input.story.trim().replace(/\.$/, "")}`
    : "about the moment happening at the table";

  const songDescriptor = SONG_TYPE_DESCRIPTORS[input.songType];
  const tone = MOOD_TAGS[input.mood];
  const structure = STRUCTURE_TAGS[input.structure];
  const energy = ENERGY_MAP[input.energy] ?? ENERGY_MAP[3];
  const venueContext = context?.venueName ? ` at ${context.venueName}` : "";

  const naturalPrompt = limitText(
    `Create a ${tone} ${songDescriptor.headline} about ${subject}${venueContext}, ${storySnippet}. Make it feel ${energy}, use a ${input.genre} foundation, and shape it so it ${structure}. ${
      input.makeFunny ? "Keep the writing funny and packed with sharp punchlines. " : ""
    }${
      input.makeDramatic
        ? "Push the drama with cinematic rises, pauses, and tension. "
        : ""
    }${
      input.includeEveryoneNames && names.length > 0
        ? `Work these names directly into the lyrics or chant: ${names.join(", ")}. `
        : ""
    }`,
    500,
  );

  const tagParts = [
    input.genre.replace(/-/g, " "),
    songDescriptor.tag,
    tone,
    structure,
    energy,
    input.bpm ? `${input.bpm} bpm` : null,
    input.makeFunny ? "funny witty lyrical moments" : null,
    input.makeDramatic ? "dramatic cinematic swells" : null,
    input.includeEveryoneNames && names.length > 0
      ? `include names ${names.join(" ")}`
      : null,
    input.story ? `scene ${input.story}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    names,
    naturalPrompt,
    tags: limitText(tagParts, 500),
    lyrics: input.lyrics || undefined,
    title: limitText(`${songDescriptor.headline} for ${subject}`, 80),
  };
}

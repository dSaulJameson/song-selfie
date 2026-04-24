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

const EXPLICIT_SIGNAL_PATTERN =
  /\b(explicit|nsfw|18\+|hookup|hook-up|bedroom|turn on|naked|nude|dirty talk|horny|seduce|body on body|grind)\b/i;

function splitNames(value: string) {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function limitText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function buildSubject(names: string[]) {
  if (names.length === 0) {
    return "this table";
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function getDurationGuidance(duration: number) {
  if (duration <= 30) {
    return "Keep it tight: one fast intro, one verse, one chorus, and a quick outro.";
  }

  if (duration <= 60) {
    return "Aim for a compact structure with an intro, one verse, one chorus, and a short outro.";
  }

  if (duration <= 120) {
    return "Use a full song shape with intro, verse, chorus, verse, chorus, bridge, and outro.";
  }

  return "Use a full-length arrangement with intro, two verses, repeated chorus, bridge, final chorus, and outro.";
}

export function isExplicitSongRequest(input: SongRequestInput) {
  return (
    input.songType === "sexy-vibe" ||
    EXPLICIT_SIGNAL_PATTERN.test(`${input.story}\n${input.lyrics}`)
  );
}

export function buildPromptPackage(
  input: SongRequestInput,
  context?: { venueName?: string },
) {
  const names = splitNames(input.names);
  const subject = buildSubject(names);
  const storySnippet = input.story
    ? `around ${input.story.trim().replace(/\.$/, "")}`
    : "about the moment happening at the table";
  const songDescriptor = SONG_TYPE_DESCRIPTORS[input.songType];
  const tone = MOOD_TAGS[input.mood];
  const structure = STRUCTURE_TAGS[input.structure];
  const energy = ENERGY_MAP[input.energy] ?? ENERGY_MAP[3];
  const venueContext = context?.venueName ? ` at ${context.venueName}` : "";
  const explicit = isExplicitSongRequest(input);
  const namesInstruction =
    input.includeEveryoneNames && names.length > 0
      ? `Work these names directly into the lyrics or chant: ${names.join(", ")}. `
      : "";

  const naturalPrompt = limitText(
    `Create a ${tone} ${songDescriptor.headline} about ${subject}${venueContext}, ${storySnippet}. Make it feel ${energy}, use a ${input.genre} foundation, and shape it so it ${structure}. ${
      input.makeFunny ? "Keep the writing funny and packed with sharp punchlines. " : ""
    }${
      input.makeDramatic
        ? "Push the drama with cinematic rises, pauses, and tension. "
        : ""
    }${namesInstruction}`,
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
    explicit ? "mature sensual vocal delivery" : "clean memorable topline",
  ]
    .filter(Boolean)
    .join(", ");

  const lyricBrief = [
    `Write complete lyrics for a ${tone} ${songDescriptor.headline} about ${subject}${venueContext}.`,
    input.story
      ? `The specific table story is: ${input.story.trim()}.`
      : "Center the lyrics on the table's current moment and shared memories.",
    `Musical foundation: ${input.genre.replace(/-/g, " ")} with ${energy}.`,
    `Song structure target: ${structure}. ${getDurationGuidance(input.duration)}`,
    input.includeEveryoneNames && names.length > 0
      ? `Call out these names naturally: ${names.join(", ")}.`
      : "Do not force extra names unless they fit naturally.",
    input.makeFunny
      ? "Lean into humor, punchlines, playful exaggeration, and quotable lines."
      : "Keep the writing catchy and emotionally direct.",
    input.makeDramatic
      ? "Use dramatic rises, cinematic tension, and a bigger-than-life payoff."
      : "Keep the emotional arc smooth and singable.",
    explicit
      ? "This request can be mature and sensual, but keep it performable and avoid hateful or abusive language."
      : "Keep the lyrics clean enough for a lively public venue.",
    input.lyrics
      ? `Use this user-provided lyric seed when helpful: ${input.lyrics.trim()}`
      : "No user-written lyric seed was supplied.",
    "Return plain text lyrics only with bracketed section headers like [Verse 1] and [Chorus].",
  ].join(" ");

  return {
    names,
    subject,
    explicit,
    title: limitText(`${songDescriptor.headline} for ${subject}`, 80),
    naturalPrompt,
    lyricBrief: limitText(lyricBrief, 1800),
    tags: limitText(tagParts, 500),
    lyrics: input.lyrics.trim() || undefined,
  };
}

import {
  GENRE_VALUES,
  KEY_VALUES,
  LANGUAGE_VALUES,
  MOOD_VALUES,
  SCALE_VALUES,
  SONG_TYPE_VALUES,
  STRUCTURE_VALUES,
  TIME_SIGNATURE_VALUES,
  type SongRequestInput,
} from "@/lib/schema";

export type FormOption = {
  value: string;
  label: string;
  description?: string;
};

export type FormField = {
  id: keyof SongRequestInput;
  label: string;
  kind: "text" | "email" | "textarea" | "select" | "cards" | "range" | "toggle";
  placeholder?: string;
  helper?: string;
  required?: boolean;
  apiParameter?: boolean;
  options?: FormOption[];
  min?: number;
  max?: number;
  step?: number;
};

export type FormSection = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  collapsible?: boolean;
  fields: FormField[];
};

const SONG_TYPE_OPTIONS: FormOption[] = [
  {
    value: SONG_TYPE_VALUES[0],
    label: "Epic battle",
    description: "Big cinematic tension, huge hook, total showdown energy.",
  },
  {
    value: SONG_TYPE_VALUES[1],
    label: "Love song",
    description: "Warm, flirty, glossy, and easy to sing along to.",
  },
  {
    value: SONG_TYPE_VALUES[2],
    label: "Party anthem",
    description: "Fast lift, big drop, packed-floor chorus.",
  },
  {
    value: SONG_TYPE_VALUES[3],
    label: "Funny roast",
    description: "Playful jabs, insider jokes, chaotic crowd laughs.",
  },
  {
    value: SONG_TYPE_VALUES[4],
    label: "Sexy vibe",
    description: "Late-night groove, velvet vocal tone, confident swagger.",
  },
  {
    value: SONG_TYPE_VALUES[5],
    label: "Chill vibe",
    description: "Laid-back bounce for the slow sip and head nod crowd.",
  },
  {
    value: SONG_TYPE_VALUES[6],
    label: "Story mode",
    description: "Narrative verses with a clear setup, twist, and payoff.",
  },
];

const MOOD_OPTIONS: FormOption[] = MOOD_VALUES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  description:
    value === "aggressive"
      ? "Harder edges, sharper drums, more bite."
      : value === "emotional"
        ? "Heart-forward and cinematic."
        : value === "hype"
          ? "Big room energy with louder lift."
          : value === "happy"
            ? "Bright, playful, easy-win vibes."
            : "Mellow, smooth, and breezy.",
}));

const GENRE_OPTIONS: FormOption[] = [
  { value: GENRE_VALUES[0], label: "Cinematic pop" },
  { value: GENRE_VALUES[1], label: "Hip-hop" },
  { value: GENRE_VALUES[2], label: "EDM" },
  { value: GENRE_VALUES[3], label: "Rock" },
  { value: GENRE_VALUES[4], label: "Country" },
  { value: GENRE_VALUES[5], label: "R&B" },
  { value: GENRE_VALUES[6], label: "Indie pop" },
  { value: GENRE_VALUES[7], label: "Latin" },
  { value: GENRE_VALUES[8], label: "Lo-fi" },
  { value: GENRE_VALUES[9], label: "House" },
  { value: GENRE_VALUES[10], label: "Jazz funk" },
];

const STRUCTURE_OPTIONS: FormOption[] = [
  { value: STRUCTURE_VALUES[0], label: "Instant hook" },
  { value: STRUCTURE_VALUES[1], label: "Story arc" },
  { value: STRUCTURE_VALUES[2], label: "Drop heavy" },
  { value: STRUCTURE_VALUES[3], label: "Slow burn" },
  { value: STRUCTURE_VALUES[4], label: "Singalong chorus" },
];

export function getSongRequestDefaults(): SongRequestInput {
  return {
    names: "",
    email: "",
    genre: "cinematic-pop",
    bpm: 122,
    songType: "party-anthem",
    mood: "happy",
    energy: 4,
    story: "",
    makeFunny: false,
    includeEveryoneNames: true,
    makeDramatic: false,
    structure: "singalong-chorus",
    duration: 60,
    language: "en",
    key: "auto",
    scale: "auto",
    timesignature: "4",
    lyrics: "",
    seed: null,
  };
}

export function getFineTuneCapabilities() {
  const sections: FormSection[] = [
    {
      id: "spotlight",
      eyebrow: "Guest Inputs",
      title: "Who is this song starring?",
      description:
        "We turn the table details into a structured Finetuning.ai prompt and tag set before checkout completes.",
      fields: [
        {
          id: "names",
          label: "Names",
          kind: "text",
          placeholder: "John, Sarah, the birthday squad",
          helper: "Separate names with commas so we can drop them into the hook.",
          required: true,
        },
        {
          id: "email",
          label: "Email",
          kind: "email",
          placeholder: "you@example.com",
          helper: "We send the finished track here as soon as it clears the queue.",
          required: true,
        },
        {
          id: "genre",
          label: "Genre",
          kind: "select",
          options: GENRE_OPTIONS,
          helper:
            "Genre is expressed through Finetuning.ai tags rather than a dedicated API field.",
          required: true,
        },
        {
          id: "bpm",
          label: "Tempo (BPM)",
          kind: "range",
          min: 60,
          max: 200,
          step: 1,
          helper: "BPM maps directly to the API's `bpm` parameter.",
          apiParameter: true,
        },
      ],
    },
    {
      id: "creative",
      eyebrow: "Creative Control",
      title: "Shape the performance",
      description:
        "These controls feed the tag prompt, letting us steer style, structure, tone, and pacing without hardcoding a one-size-fits-all form.",
      fields: [
        {
          id: "songType",
          label: "Song type",
          kind: "cards",
          options: SONG_TYPE_OPTIONS,
          required: true,
        },
        {
          id: "mood",
          label: "Mood",
          kind: "cards",
          options: MOOD_OPTIONS,
          required: true,
        },
        {
          id: "energy",
          label: "Energy",
          kind: "range",
          min: 1,
          max: 5,
          step: 1,
          helper: "A higher value pushes the tag mix harder, brighter, and more explosive.",
          required: true,
        },
        {
          id: "story",
          label: "What's happening at your table?",
          kind: "textarea",
          placeholder: "Birthday party showdown, surprise proposal, reunion chaos...",
          helper:
            "Story context is translated into a tighter natural-language prompt before we call FineTune.",
        },
        {
          id: "structure",
          label: "Structure",
          kind: "select",
          options: STRUCTURE_OPTIONS,
          helper:
            "Structure is tag-driven. FineTune exposes `tags`, so structure hints are encoded there.",
        },
      ],
    },
    {
      id: "extras",
      eyebrow: "Flavor Boosters",
      title: "Add a twist",
      description:
        "These optional toggles expand the final prompt so the generated track feels custom instead of generic.",
      fields: [
        {
          id: "makeFunny",
          label: "Make it funny",
          kind: "toggle",
        },
        {
          id: "includeEveryoneNames",
          label: "Include everyone's name",
          kind: "toggle",
        },
        {
          id: "makeDramatic",
          label: "Make it dramatic",
          kind: "toggle",
        },
      ],
    },
    {
      id: "advanced",
      eyebrow: "FineTune API",
      title: "Direct generation parameters",
      description:
        "These fields map one-to-one to the documented Finetuning.ai music generation API: `lyrics`, `duration`, `bpm`, `language`, `key`, `scale`, `timesignature`, and `seed`. `tags` is synthesized from the creative controls above.",
      collapsible: true,
      fields: [
        {
          id: "duration",
          label: "Duration (seconds)",
          kind: "range",
          min: 15,
          max: 180,
          step: 15,
          apiParameter: true,
        },
        {
          id: "language",
          label: "Language",
          kind: "select",
          options: LANGUAGE_VALUES.map((value) => ({
            value,
            label: value.toUpperCase(),
          })),
          apiParameter: true,
        },
        {
          id: "key",
          label: "Key",
          kind: "select",
          options: KEY_VALUES.map((value) => ({
            value,
            label: value,
          })),
          apiParameter: true,
        },
        {
          id: "scale",
          label: "Scale",
          kind: "select",
          options: SCALE_VALUES.map((value) => ({
            value,
            label: value.charAt(0).toUpperCase() + value.slice(1),
          })),
          apiParameter: true,
        },
        {
          id: "timesignature",
          label: "Time signature",
          kind: "select",
          options: TIME_SIGNATURE_VALUES.map((value) => ({
            value,
            label: `${value}/4`,
          })),
          apiParameter: true,
        },
        {
          id: "lyrics",
          label: "Optional lyric starter",
          kind: "textarea",
          placeholder: "Write a chant, a hook, or leave this blank for full AI generation.",
          helper: "This maps directly to FineTune's `lyrics` parameter.",
          apiParameter: true,
        },
        {
          id: "seed",
          label: "Seed",
          kind: "text",
          placeholder: "Optional deterministic seed",
          helper: "Leave blank for a fresh take every time.",
          apiParameter: true,
        },
      ],
    },
  ];

  return {
    docs: {
      provider: "Finetuning.ai",
      baseReference: "https://docs.finetuning.ai/docs/api-reference/generations-create",
      exampleReference: "https://docs.finetuning.ai/docs/examples/javascript",
      supportedDirectParameters: [
        "tags",
        "lyrics",
        "duration",
        "bpm",
        "language",
        "key",
        "scale",
        "timesignature",
        "seed",
      ],
      tagDrivenDimensions: [
        "genre",
        "mood",
        "energy",
        "structure",
        "vocal style",
        "instrumentation",
        "story context",
      ],
      notes:
        "Genre, mood, energy, structure, and styling are modeled through `tags`; they are not separate top-level API fields in the current docs.",
    },
    sections,
    defaults: getSongRequestDefaults(),
  };
}

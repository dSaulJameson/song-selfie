import {
  GENRE_VALUES,
  KEY_VALUES,
  LANGUAGE_VALUES,
  TAG_DRUM_STYLE_VALUES,
  TAG_ENERGY_VALUES,
  TAG_ERA_VALUES,
  TAG_INSTRUMENT_VALUES,
  TAG_MOOD_VALUES,
  TAG_PRODUCTION_VALUES,
  TAG_SCENE_VALUES,
  TAG_VOCAL_VALUES,
  SCALE_VALUES,
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
  kind:
    | "text"
    | "email"
    | "textarea"
    | "select"
    | "range"
    | "toggle"
    | "multi-select";
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

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => {
      if (/^\d/.test(part)) {
        return part.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

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
  { value: GENRE_VALUES[11], label: "Reggae" },
  { value: GENRE_VALUES[12], label: "Metal" },
  { value: GENRE_VALUES[13], label: "Emo" },
  { value: GENRE_VALUES[14], label: "Screamo" },
  { value: GENRE_VALUES[15], label: "70s throwback" },
  { value: GENRE_VALUES[16], label: "80s throwback" },
  { value: GENRE_VALUES[17], label: "90s throwback" },
];

const TAG_MOOD_OPTIONS: FormOption[] = TAG_MOOD_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_SCENE_OPTIONS: FormOption[] = TAG_SCENE_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_ENERGY_OPTIONS: FormOption[] = TAG_ENERGY_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_INSTRUMENT_OPTIONS: FormOption[] = TAG_INSTRUMENT_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_DRUM_STYLE_OPTIONS: FormOption[] = TAG_DRUM_STYLE_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_VOCAL_OPTIONS: FormOption[] = TAG_VOCAL_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_PRODUCTION_OPTIONS: FormOption[] = TAG_PRODUCTION_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

const TAG_ERA_OPTIONS: FormOption[] = TAG_ERA_VALUES.map((value) => ({
  value,
  label: titleCase(value),
}));

export function getSongRequestDefaults(): SongRequestInput {
  return {
    names: "",
    email: "",
    genre: "cinematic-pop",
    bpm: 120,
    songType: "party-anthem",
    mood: "happy",
    energy: 4,
    story: "",
    mentionVenueName: false,
    makeFunny: false,
    includeEveryoneNames: true,
    makeDramatic: false,
    makeDirty: false,
    kidsMode: false,
    structure: "singalong-chorus",
    duration: 120,
    language: "en",
    key: "auto",
    scale: "auto",
    timesignature: "4",
    tagMood: [],
    tagScene: [],
    tagEnergy: [],
    tagInstruments: [],
    tagDrumStyle: [],
    tagVocals: [],
    tagProduction: [],
    tagEra: [],
    lyrics: "",
    seed: null,
    photoBatchId: null,
    photoAssets: [],
  };
}

export function getFineTuneCapabilities() {
  const sections: FormSection[] = [
    {
      id: "primary",
      eyebrow: "Core Form",
      title: "Describe the memory",
      description:
        "Keep the front of the form simple, then open advanced controls only if you want to steer the song more directly.",
      fields: [
        {
          id: "names",
          label: "Who is in this memory?",
          kind: "text",
          placeholder: "Sarah, Mike, Buddy the dog",
          helper: "Separate people, groups, and pets with commas.",
          required: true,
        },
        {
          id: "story",
          label: "What happened?",
          kind: "textarea",
          placeholder: "Vegas trip, rooftop drinks, lost phones, great night...",
          helper: "Describe the moment and we will turn it into a song.",
        },
        {
          id: "genre",
          label: "Genre",
          kind: "select",
          options: GENRE_OPTIONS,
          helper:
            "Genre stays outside Advanced and preloads BPM plus a baseline sound profile.",
          required: true,
        },
        {
          id: "email",
          label: "Where are we sending this memory?",
          kind: "email",
          placeholder: "you@example.com",
          helper: "We send the finished song here.",
          required: true,
        },
      ],
    },
    {
      id: "advanced",
      eyebrow: "Advanced",
      title: "Advanced Song Settings",
      description:
        "These controls shape the sound more directly. Duration is fixed at 120 seconds.",
      collapsible: true,
      fields: [
        {
          id: "bpm",
          label: "Tempo (BPM)",
          kind: "range",
          min: 60,
          max: 200,
          step: 1,
          helper: "Sets the tempo directly.",
          apiParameter: true,
        },
        {
          id: "tagMood",
          label: "Mood tags",
          kind: "multi-select",
          options: TAG_MOOD_OPTIONS,
        },
        {
          id: "tagScene",
          label: "Scene tags",
          kind: "multi-select",
          options: TAG_SCENE_OPTIONS,
        },
        {
          id: "tagEnergy",
          label: "Energy tags",
          kind: "multi-select",
          options: TAG_ENERGY_OPTIONS,
        },
        {
          id: "tagInstruments",
          label: "Instruments",
          kind: "multi-select",
          options: TAG_INSTRUMENT_OPTIONS,
        },
        {
          id: "tagDrumStyle",
          label: "Drum styles",
          kind: "multi-select",
          options: TAG_DRUM_STYLE_OPTIONS,
        },
        {
          id: "tagVocals",
          label: "Vocals",
          kind: "multi-select",
          options: TAG_VOCAL_OPTIONS,
        },
        {
          id: "tagProduction",
          label: "Production",
          kind: "multi-select",
          options: TAG_PRODUCTION_OPTIONS,
        },
        {
          id: "tagEra",
          label: "Era",
          kind: "multi-select",
          options: TAG_ERA_OPTIONS,
        },
        {
          id: "makeDirty",
          label: "NSFW (make it dirty)",
          kind: "toggle",
        },
        {
          id: "kidsMode",
          label: "Just for kids",
          kind: "toggle",
        },
        {
          id: "makeFunny",
          label: "Make it funny",
          kind: "toggle",
        },
        {
          id: "makeDramatic",
          label: "Make it dramatic",
          kind: "toggle",
        },
        {
          id: "includeEveryoneNames",
          label: "Include names",
          kind: "toggle",
        },
        {
          id: "mentionVenueName",
          label: "Mention the venue",
          kind: "toggle",
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
            label: titleCase(value),
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
        "scene",
        "energy",
        "instruments",
        "drum styles",
        "vocals",
        "production",
        "era",
        "story context",
      ],
      notes:
        "Genre is surfaced outside Advanced and still shapes the generated sound profile. Duration is fixed to 120 seconds in the UI for now.",
    },
    sections,
    defaults: getSongRequestDefaults(),
  };
}

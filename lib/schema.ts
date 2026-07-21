import { z } from "zod";

export const SONG_TYPE_VALUES = [
  "epic-battle",
  "love-song",
  "party-anthem",
  "funny-roast",
  "sexy-vibe",
  "chill-vibe",
  "story-mode",
] as const;

export const MOOD_VALUES = [
  "chill",
  "happy",
  "aggressive",
  "emotional",
  "hype",
] as const;

export const GENRE_VALUES = [
  "cinematic-pop",
  "hip-hop",
  "edm",
  "rock",
  "country",
  "r-and-b",
  "indie-pop",
  "latin",
  "lo-fi",
  "house",
  "jazz-funk",
  "reggae",
  "metal",
  "emo",
  "screamo",
  "70s-throwback",
  "80s-throwback",
  "90s-throwback",
] as const;

export const STRUCTURE_VALUES = [
  "instant-hook",
  "story-arc",
  "drop-heavy",
  "slow-burn",
  "singalong-chorus",
] as const;

export const LANGUAGE_VALUES = ["en", "es", "fr", "de", "it", "pt"] as const;
export const KEY_VALUES = [
  "auto",
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;
export const SCALE_VALUES = ["auto", "major", "minor"] as const;
export const TIME_SIGNATURE_VALUES = ["2", "3", "4", "5", "6", "7"] as const;
export const TAG_MOOD_VALUES = [
  "chill",
  "upbeat",
  "melancholic",
  "energetic",
  "dreamy",
  "dark",
  "euphoric",
  "nostalgic",
  "peaceful",
  "aggressive",
  "romantic",
  "mysterious",
] as const;
export const TAG_SCENE_VALUES = [
  "study",
  "workout",
  "road-trip",
  "late-night",
  "morning-coffee",
  "party",
  "meditation",
  "gaming",
  "sunset",
  "rain",
  "beach",
  "city-night",
] as const;
export const TAG_ENERGY_VALUES = [
  "slow",
  "moderate",
  "fast",
  "building",
  "explosive",
  "calm",
  "intense",
  "groovy",
] as const;
export const TAG_INSTRUMENT_VALUES = [
  "piano",
  "acoustic-guitar",
  "electric-guitar",
  "nylon-guitar",
  "synth",
  "pad",
  "arp-synth",
  "lead-synth",
  "strings",
  "bass",
  "808-bass",
  "upright-bass",
  "sub-bass",
  "brass",
  "saxophone",
  "flute",
  "organ",
  "marimba",
  "hang-drum",
  "sitar",
  "tabla",
] as const;
export const TAG_DRUM_STYLE_VALUES = [
  "boom-bap",
  "trap-hi-hats",
  "808-kick",
  "breakbeat",
  "four-on-the-floor",
  "amen-break",
  "shuffle",
  "gated-snare",
  "hand-claps",
  "tribal",
  "rim-shots",
  "brush-drums",
  "live-drums",
  "syncopated",
] as const;
export const TAG_VOCAL_VALUES = [
  "male-vocals",
  "female-vocals",
  "choir",
  "whispered",
  "spoken-word",
  "rap-verse",
  "autotune",
  "harmonies",
  "falsetto",
  "gang-vocals",
  "ad-libs",
  "breathy",
  "soulful",
  "vocal-chops",
] as const;
export const TAG_PRODUCTION_VALUES = [
  "lo-fi-tape",
  "vintage-analog",
  "crunchy",
  "polished",
  "pristine",
  "bit-crushed",
  "dusty",
  "stadium-reverb",
  "bedroom",
  "tight-and-dry",
  "underwater",
  "sidechain",
  "tape-saturation",
  "vinyl-crackle",
  "reverb",
] as const;
export const TAG_ERA_VALUES = [
  "60s-psych",
  "70s-funk",
  "70s-disco",
  "80s-synthwave",
  "90s-r-and-b",
  "90s-hip-hop",
  "y2k-pop",
  "retro-futurism",
  "golden-age",
  "modern-trap",
] as const;

const optionalInteger = (min: number, max: number) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value),
    z.number().int().min(min).max(max).nullable(),
  );

const optionalSeed = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  z.number().int().min(0).max(2147483647).nullable(),
);

const booleanFromForm = z.preprocess(
  (value) =>
    value === undefined || value === null || value === ""
      ? undefined
      : value === true || value === "true" || value === "on",
  z.boolean(),
);

const tagSelectionArray = <T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).max(12).default([]);

export const uploadedPhotoAssetSchema = z.object({
  key: z.string().trim().min(1).max(320),
  url: z.url(),
  name: z.string().trim().min(1).max(160),
  contentType: z.string().trim().min(1).max(120),
  size: z.number().int().min(1).max(25_000_000),
  uploadedAt: z.string().trim().min(1).max(64),
});

export const songRequestSchema = z.object({
  names: z.string().trim().min(2).max(120),
  email: z.email(),
  genre: z.enum(GENRE_VALUES),
  bpm: optionalInteger(60, 200),
  songType: z.enum(SONG_TYPE_VALUES),
  mood: z.enum(MOOD_VALUES),
  energy: z.preprocess((value) => Number(value), z.number().int().min(1).max(5)),
  story: z.string().trim().max(320).default(""),
  mentionVenueName: z.boolean().default(false),
  makeFunny: z.boolean().default(false),
  includeEveryoneNames: z.boolean().default(true),
  makeDramatic: z.boolean().default(false),
  makeDirty: z.boolean().default(false),
  kidsMode: z.boolean().default(false),
  structure: z.enum(STRUCTURE_VALUES),
  duration: z.preprocess(
    (value) => Number(value),
    z.number().int().min(15).max(180),
  ),
  language: z.enum(LANGUAGE_VALUES),
  key: z.enum(KEY_VALUES),
  scale: z.enum(SCALE_VALUES),
  timesignature: z.enum(TIME_SIGNATURE_VALUES),
  tagMood: tagSelectionArray(TAG_MOOD_VALUES),
  tagScene: tagSelectionArray(TAG_SCENE_VALUES),
  tagEnergy: tagSelectionArray(TAG_ENERGY_VALUES),
  tagInstruments: tagSelectionArray(TAG_INSTRUMENT_VALUES),
  tagDrumStyle: tagSelectionArray(TAG_DRUM_STYLE_VALUES),
  tagVocals: tagSelectionArray(TAG_VOCAL_VALUES),
  tagProduction: tagSelectionArray(TAG_PRODUCTION_VALUES),
  tagEra: tagSelectionArray(TAG_ERA_VALUES),
  lyrics: z.string().trim().max(2000).default(""),
  seed: optionalSeed,
  photoBatchId: z.string().trim().max(80).nullable().default(null),
  photoAssets: z.array(uploadedPhotoAssetSchema).max(5).default([]),
});

export const createVenueSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(64),
  description: z.string().trim().max(220).default(""),
  contactEmail: z.email(),
  priceCents: z.preprocess(
    (value) => Number(value),
    z.number().int().min(0).max(50000),
  ),
  venueSharePercent: z.preprocess(
    (value) => Number(value),
    z.number().int().min(0).max(100),
  ),
  allowExplicitContent: booleanFromForm.default(true),
  allowKidsMode: booleanFromForm.default(false),
});

export const updateVenueShareSchema = z.object({
  venueId: z.string().trim().min(4),
  venueSharePercent: z.preprocess(
    (value) => Number(value),
    z.number().int().min(0).max(100),
  ),
});

export const updateVenuePricingSchema = z.object({
  venueId: z.string().trim().min(4),
  priceCents: z.preprocess(
    (value) => Number(value),
    z.number().int().min(0).max(50000),
  ),
});

export const updateVenueContentSettingsSchema = z.object({
  venueId: z.string().trim().min(4),
  allowExplicitContent: booleanFromForm.default(false),
  allowKidsMode: booleanFromForm.default(false),
});

export const updateVenuePayoutSchema = z.discriminatedUnion("payoutMethod", [
  z.object({
    venueId: z.string().trim().min(4),
    payoutMethod: z.literal("bank-transfer"),
    accountHolderName: z.string().trim().min(2).max(120),
    bankName: z.string().trim().min(2).max(120),
    routingNumber: z.string().trim().regex(/^\d{9}$/, "Routing number must be 9 digits."),
    accountNumber: z.string().trim().min(4).max(32),
    accountType: z.enum(["checking", "savings"]).default("checking"),
  }),
  z.object({
    venueId: z.string().trim().min(4),
    payoutMethod: z.literal("check"),
    payableTo: z.string().trim().min(2).max(140),
    mailingAddress: z.string().trim().min(8).max(500),
    checkMemo: z.string().trim().max(140).default(""),
  }),
]);

export type SongRequestInput = z.infer<typeof songRequestSchema>;
export type UploadedPhotoAsset = z.infer<typeof uploadedPhotoAssetSchema>;
export type SongType = (typeof SONG_TYPE_VALUES)[number];
export type Mood = (typeof MOOD_VALUES)[number];
export type StructureType = (typeof STRUCTURE_VALUES)[number];
export type Genre = (typeof GENRE_VALUES)[number];
export type TagMood = (typeof TAG_MOOD_VALUES)[number];
export type TagScene = (typeof TAG_SCENE_VALUES)[number];
export type TagEnergy = (typeof TAG_ENERGY_VALUES)[number];
export type TagInstrument = (typeof TAG_INSTRUMENT_VALUES)[number];
export type TagDrumStyle = (typeof TAG_DRUM_STYLE_VALUES)[number];
export type TagVocal = (typeof TAG_VOCAL_VALUES)[number];
export type TagProduction = (typeof TAG_PRODUCTION_VALUES)[number];
export type TagEra = (typeof TAG_ERA_VALUES)[number];

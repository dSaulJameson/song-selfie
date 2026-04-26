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
  structure: z.enum(STRUCTURE_VALUES),
  duration: z.preprocess(
    (value) => Number(value),
    z.number().int().min(15).max(180),
  ),
  language: z.enum(LANGUAGE_VALUES),
  key: z.enum(KEY_VALUES),
  scale: z.enum(SCALE_VALUES),
  timesignature: z.enum(TIME_SIGNATURE_VALUES),
  lyrics: z.string().trim().max(2000).default(""),
  seed: optionalSeed,
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

export type SongRequestInput = z.infer<typeof songRequestSchema>;
export type SongType = (typeof SONG_TYPE_VALUES)[number];
export type Mood = (typeof MOOD_VALUES)[number];
export type StructureType = (typeof STRUCTURE_VALUES)[number];
export type Genre = (typeof GENRE_VALUES)[number];

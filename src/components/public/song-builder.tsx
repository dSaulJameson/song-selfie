"use client";

import {
  ArrowRight,
  ChevronDown,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";

import type {
  FormField,
  getFineTuneCapabilities,
} from "@/lib/finetune-capabilities";
import type { SongRequestInput, UploadedPhotoAsset } from "@/lib/schema";
import { cn, formatCurrency } from "@/lib/utils";
import { SongSelfieLogo } from "@/src/components/public/song-selfie-logo";
import { Button } from "@/src/components/ui/button";

type Capabilities = ReturnType<typeof getFineTuneCapabilities>;

type SongBuilderProps = {
  venue: {
    name: string;
    slug: string;
    description: string | null;
    priceCents: number;
    allowExplicitContent: boolean;
    allowKidsMode: boolean;
  };
  venueOptions?: Array<{
    name: string;
    slug: string;
    priceCents: number;
    allowExplicitContent: boolean;
    allowKidsMode: boolean;
  }>;
  showVenueSelector?: boolean;
  capabilities: Capabilities;
  mode?: "venue" | "paid-home" | "free-testing";
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
};

type ChipGroupProps = {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
};

type ToggleCardProps = {
  title: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type PhotoUploadProps = {
  previews: Array<{ name: string; url: string; size: number }>;
  disabled: boolean;
  onPick: (files: FileList | null) => void;
  onRemove: (index: number) => void;
};

const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE = 12 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const ROTATING_SNIPPETS = [
  "Vegas trip. Pool party. Chaos.",
  "Birthday crew. Loud laughs. Zero regrets.",
  "Rooftop drinks. Lost phones. Great night.",
];

const PLAYER_PREVIEWS = [
  {
    title: "Vegas Trip 2026",
    artist: "Artist: you",
  },
  {
    title: "Birthday Crew Anthem",
    artist: "Artist: you",
  },
  {
    title: "Rooftop Drinks",
    artist: "Artist: you",
  },
] as const;

const MINI_WAVE = [24, 34, 21, 38, 28, 32, 22, 36];

const GENRE_AUTOPILOT: Record<
  SongRequestInput["genre"],
  Pick<
    SongRequestInput,
    | "bpm"
    | "mood"
    | "energy"
    | "songType"
    | "tagMood"
    | "tagScene"
    | "tagEnergy"
    | "tagInstruments"
    | "tagDrumStyle"
    | "tagVocals"
    | "tagProduction"
    | "tagEra"
  >
> = {
  "cinematic-pop": {
    bpm: 120,
    mood: "emotional",
    energy: 4,
    songType: "story-mode",
    tagMood: ["euphoric", "dreamy"],
    tagScene: ["city-night"],
    tagEnergy: ["building"],
    tagInstruments: ["synth", "strings"],
    tagDrumStyle: ["hand-claps"],
    tagVocals: ["female-vocals", "harmonies"],
    tagProduction: ["polished", "stadium-reverb"],
    tagEra: ["y2k-pop"],
  },
  "hip-hop": {
    bpm: 96,
    mood: "aggressive",
    energy: 4,
    songType: "funny-roast",
    tagMood: ["aggressive"],
    tagScene: ["late-night"],
    tagEnergy: ["groovy"],
    tagInstruments: ["808-bass", "lead-synth"],
    tagDrumStyle: ["boom-bap", "trap-hi-hats"],
    tagVocals: ["rap-verse", "ad-libs"],
    tagProduction: ["tight-and-dry"],
    tagEra: ["modern-trap", "90s-hip-hop"],
  },
  edm: {
    bpm: 128,
    mood: "hype",
    energy: 5,
    songType: "party-anthem",
    tagMood: ["euphoric"],
    tagScene: ["party"],
    tagEnergy: ["explosive", "building"],
    tagInstruments: ["synth", "arp-synth", "sub-bass"],
    tagDrumStyle: ["four-on-the-floor"],
    tagVocals: ["female-vocals", "vocal-chops"],
    tagProduction: ["polished", "sidechain"],
    tagEra: ["y2k-pop"],
  },
  rock: {
    bpm: 132,
    mood: "hype",
    energy: 5,
    songType: "epic-battle",
    tagMood: ["energetic"],
    tagScene: ["road-trip"],
    tagEnergy: ["fast", "intense"],
    tagInstruments: ["electric-guitar", "bass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "gang-vocals"],
    tagProduction: ["crunchy"],
    tagEra: ["golden-age"],
  },
  country: {
    bpm: 102,
    mood: "happy",
    energy: 3,
    songType: "story-mode",
    tagMood: ["peaceful", "nostalgic"],
    tagScene: ["sunset", "road-trip"],
    tagEnergy: ["moderate"],
    tagInstruments: ["acoustic-guitar", "piano"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "harmonies"],
    tagProduction: ["polished"],
    tagEra: ["golden-age"],
  },
  "r-and-b": {
    bpm: 92,
    mood: "emotional",
    energy: 3,
    songType: "love-song",
    tagMood: ["romantic", "dreamy"],
    tagScene: ["late-night"],
    tagEnergy: ["slow", "groovy"],
    tagInstruments: ["synth", "sub-bass"],
    tagDrumStyle: ["808-kick"],
    tagVocals: ["female-vocals", "breathy", "harmonies"],
    tagProduction: ["pristine"],
    tagEra: ["90s-r-and-b"],
  },
  "indie-pop": {
    bpm: 112,
    mood: "happy",
    energy: 3,
    songType: "chill-vibe",
    tagMood: ["upbeat", "nostalgic"],
    tagScene: ["sunset"],
    tagEnergy: ["moderate"],
    tagInstruments: ["acoustic-guitar", "synth"],
    tagDrumStyle: ["hand-claps"],
    tagVocals: ["female-vocals"],
    tagProduction: ["bedroom", "vinyl-crackle"],
    tagEra: ["retro-futurism"],
  },
  latin: {
    bpm: 104,
    mood: "happy",
    energy: 4,
    songType: "party-anthem",
    tagMood: ["upbeat"],
    tagScene: ["beach", "party"],
    tagEnergy: ["groovy", "fast"],
    tagInstruments: ["nylon-guitar", "sub-bass"],
    tagDrumStyle: ["syncopated", "hand-claps"],
    tagVocals: ["male-vocals", "female-vocals"],
    tagProduction: ["polished"],
    tagEra: ["modern-trap"],
  },
  "lo-fi": {
    bpm: 78,
    mood: "chill",
    energy: 2,
    songType: "chill-vibe",
    tagMood: ["chill", "peaceful"],
    tagScene: ["study", "rain"],
    tagEnergy: ["slow", "calm"],
    tagInstruments: ["piano", "synth"],
    tagDrumStyle: ["brush-drums"],
    tagVocals: ["spoken-word"],
    tagProduction: ["lo-fi-tape", "vinyl-crackle"],
    tagEra: ["retro-futurism"],
  },
  house: {
    bpm: 124,
    mood: "hype",
    energy: 4,
    songType: "party-anthem",
    tagMood: ["energetic"],
    tagScene: ["party", "city-night"],
    tagEnergy: ["groovy", "building"],
    tagInstruments: ["synth", "sub-bass"],
    tagDrumStyle: ["four-on-the-floor"],
    tagVocals: ["female-vocals", "vocal-chops"],
    tagProduction: ["sidechain", "polished"],
    tagEra: ["y2k-pop"],
  },
  "jazz-funk": {
    bpm: 110,
    mood: "happy",
    energy: 3,
    songType: "chill-vibe",
    tagMood: ["upbeat", "euphoric"],
    tagScene: ["morning-coffee"],
    tagEnergy: ["groovy"],
    tagInstruments: ["bass", "saxophone", "piano"],
    tagDrumStyle: ["syncopated"],
    tagVocals: ["soulful"],
    tagProduction: ["pristine"],
    tagEra: ["70s-funk"],
  },
  reggae: {
    bpm: 84,
    mood: "chill",
    energy: 3,
    songType: "chill-vibe",
    tagMood: ["peaceful", "upbeat"],
    tagScene: ["beach", "sunset"],
    tagEnergy: ["groovy", "calm"],
    tagInstruments: ["electric-guitar", "sub-bass", "organ"],
    tagDrumStyle: ["syncopated"],
    tagVocals: ["male-vocals", "harmonies"],
    tagProduction: ["vintage-analog"],
    tagEra: ["golden-age"],
  },
  metal: {
    bpm: 150,
    mood: "aggressive",
    energy: 5,
    songType: "epic-battle",
    tagMood: ["dark", "aggressive"],
    tagScene: ["workout"],
    tagEnergy: ["fast", "intense"],
    tagInstruments: ["electric-guitar", "sub-bass"],
    tagDrumStyle: ["live-drums", "808-kick"],
    tagVocals: ["male-vocals", "gang-vocals"],
    tagProduction: ["crunchy"],
    tagEra: ["golden-age"],
  },
  emo: {
    bpm: 142,
    mood: "emotional",
    energy: 4,
    songType: "story-mode",
    tagMood: ["melancholic", "nostalgic"],
    tagScene: ["rain", "late-night"],
    tagEnergy: ["building"],
    tagInstruments: ["electric-guitar", "bass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "falsetto"],
    tagProduction: ["bedroom", "reverb"],
    tagEra: ["y2k-pop"],
  },
  screamo: {
    bpm: 168,
    mood: "aggressive",
    energy: 5,
    songType: "epic-battle",
    tagMood: ["dark", "aggressive"],
    tagScene: ["city-night"],
    tagEnergy: ["fast", "explosive"],
    tagInstruments: ["electric-guitar", "sub-bass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "gang-vocals"],
    tagProduction: ["crunchy", "reverb"],
    tagEra: ["golden-age"],
  },
  "70s-throwback": {
    bpm: 108,
    mood: "happy",
    energy: 3,
    songType: "party-anthem",
    tagMood: ["nostalgic", "upbeat"],
    tagScene: ["party"],
    tagEnergy: ["groovy"],
    tagInstruments: ["bass", "piano", "brass"],
    tagDrumStyle: ["live-drums"],
    tagVocals: ["male-vocals", "female-vocals"],
    tagProduction: ["vintage-analog"],
    tagEra: ["70s-funk", "70s-disco"],
  },
  "80s-throwback": {
    bpm: 118,
    mood: "hype",
    energy: 4,
    songType: "party-anthem",
    tagMood: ["euphoric", "dreamy"],
    tagScene: ["city-night"],
    tagEnergy: ["building"],
    tagInstruments: ["synth", "arp-synth"],
    tagDrumStyle: ["gated-snare"],
    tagVocals: ["female-vocals", "harmonies"],
    tagProduction: ["polished", "stadium-reverb"],
    tagEra: ["80s-synthwave"],
  },
  "90s-throwback": {
    bpm: 100,
    mood: "happy",
    energy: 3,
    songType: "party-anthem",
    tagMood: ["nostalgic", "upbeat"],
    tagScene: ["road-trip"],
    tagEnergy: ["moderate", "groovy"],
    tagInstruments: ["piano", "synth", "bass"],
    tagDrumStyle: ["boom-bap", "live-drums"],
    tagVocals: ["male-vocals", "female-vocals"],
    tagProduction: ["polished"],
    tagEra: ["90s-r-and-b", "90s-hip-hop"],
  },
};

function getField(capabilities: Capabilities, fieldId: keyof SongRequestInput) {
  return capabilities.sections
    .flatMap((section) => section.fields)
    .find((field) => field.id === fieldId);
}

function getOptions(field: FormField) {
  return field.options ?? [];
}

function fieldShellClassName() {
  return "w-full rounded-[1rem] border border-white/10 bg-white/6 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none backdrop-blur-sm transition duration-200 placeholder:text-white/35 focus:border-pink-400/70 focus:bg-white/10 focus:ring-4 focus:ring-pink-500/12";
}

function formatPhotoSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white sm:text-xs">
      {children}
    </p>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xl font-black tracking-tight text-white">{children}</p>;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn("h-12 appearance-none pr-10", fieldShellClassName())}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-950 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      </div>
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: SliderFieldProps) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>{label}</SectionLabel>
        <span className="text-sm font-black text-pink-200">
          {value}
          {suffix}
        </span>
      </div>
      <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-pink-400"
        />
      </div>
    </label>
  );
}

function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  const toggle = (nextValue: string) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  return (
    <section className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                checked
                  ? "border-pink-300/40 bg-[linear-gradient(135deg,rgba(255,79,163,0.18),rgba(141,102,255,0.2))] text-white"
                  : "border-white/10 bg-white/5 text-white/72 hover:bg-white/8",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ToggleCard({ title, checked, disabled = false, onClick }: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-between rounded-[1rem] border px-4 py-3 text-left transition",
        disabled
          ? "cursor-not-allowed border-white/8 bg-white/4 opacity-45"
          : checked
            ? "border-pink-300/40 bg-[linear-gradient(135deg,rgba(255,79,163,0.18),rgba(141,102,255,0.2))]"
            : "border-white/10 bg-white/5 hover:bg-white/8",
      )}
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked && !disabled ? "bg-pink-500" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            checked && !disabled ? "left-[1.35rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function TopExplainerRow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % ROTATING_SNIPPETS.length);
    }, 2200);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
        <PanelTitle>Describe your moment</PanelTitle>
        <div className="mt-3 min-h-[7rem]">
          <p className="text-xl font-black leading-tight text-white sm:text-2xl">
            {ROTATING_SNIPPETS[index]}
          </p>
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
        <PanelTitle>Song player</PanelTitle>
        <div className="mt-3 flex min-h-[7rem] flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff4fa3,#8d66ff)] text-white">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {PLAYER_PREVIEWS[index].title}
              </p>
              <p className="text-xs text-white/50">
                {PLAYER_PREVIEWS[index].artist}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-1">
            {MINI_WAVE.map((height, waveIndex) => (
              <span
                key={`${height}-${waveIndex}`}
                className="block w-2 rounded-full bg-[linear-gradient(180deg,rgba(255,110,188,0.98),rgba(122,92,255,0.98))]"
                style={{
                  height: `${height + ((index + waveIndex) % 3) * 6}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoUpload({ previews, disabled, onPick, onRemove }: PhotoUploadProps) {
  const remaining = Math.max(0, MAX_PHOTO_COUNT - previews.length);

  return (
    <section className="space-y-3">
      <PanelTitle>Optional 5 pic upload</PanelTitle>
      <p className="text-sm text-white/58">
        Add photos so the lyrics can notice outfits, people, signs, food, and moments from the night.
      </p>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-[1rem] border border-dashed border-pink-300/28 bg-white/5 px-4 py-4 text-center transition hover:border-pink-300/48 hover:bg-white/8">
        <ImagePlus className="h-7 w-7 text-pink-200" />
        <p className="mt-2 text-sm font-semibold text-white">
          {remaining > 0
            ? `Add up to ${remaining} more pic${remaining === 1 ? "" : "s"}`
            : "Photo limit reached"}
        </p>
        <p className="mt-1 text-xs text-white/45">JPG, PNG, or WebP</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || remaining === 0}
          onChange={(event) => {
            onPick(event.target.files);
            event.currentTarget.value = "";
          }}
          className="sr-only"
        />
      </label>

      {previews.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {previews.map((preview, index) => (
            <div
              key={`${preview.name}-${index}`}
              className="overflow-hidden rounded-[1rem] border border-white/10 bg-white/6"
            >
              <div className="aspect-[4/5] overflow-hidden bg-black/20">
                <Image
                  src={preview.url}
                  alt={preview.name}
                  width={600}
                  height={750}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between gap-2 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{preview.name}</p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {formatPhotoSize(preview.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/70 transition hover:bg-white/12 hover:text-white"
                  aria-label={`Remove ${preview.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CheckoutPanel({
  isPending,
  priceCents,
  promoCode,
  onPromoCodeChange,
  onSubmit,
}: {
  isPending: boolean;
  priceCents: number;
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="space-y-3">
      <PanelTitle>Checkout {formatCurrency(priceCents)} or use promo code</PanelTitle>
      <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-pink-200/88">
              Promo code
            </span>
            <input
              type="text"
              value={promoCode}
              onChange={(event) => onPromoCodeChange(event.target.value.toLowerCase())}
              placeholder="Optional"
              className={cn("h-12", fieldShellClassName())}
            />
          </label>

          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="min-h-12 rounded-[1rem] bg-[linear-gradient(90deg,#ff4fa3,#8d66ff)] px-5 text-sm font-black uppercase tracking-[0.08em] text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Continue to secure checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <p className="mt-3 text-sm font-semibold text-white">
          {formatCurrency(priceCents)} per song
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
          <Lock className="h-3.5 w-3.5 text-pink-300" />
          Secure payment powered by Stripe
        </div>
      </div>
    </section>
  );
}

export function SongBuilder({
  venue,
  venueOptions = [],
  showVenueSelector = false,
  capabilities,
}: SongBuilderProps) {
  const selectableVenues = venueOptions.length > 0 ? venueOptions : [venue];
  const [selectedVenueSlug, setSelectedVenueSlug] = useState(venue.slug);
  const [venueQuery, setVenueQuery] = useState(venue.name);
  const [form, setForm] = useState<SongRequestInput>(() => ({
    ...capabilities.defaults,
    ...GENRE_AUTOPILOT[capabilities.defaults.genre],
    genre: capabilities.defaults.genre,
    duration: 120,
  }));
  const [photos, setPhotos] = useState<File[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startSubmit] = useTransition();
  const selectedVenue =
    selectableVenues.find((option) => option.slug === selectedVenueSlug) ?? venue;

  const namesField = getField(capabilities, "names");
  const storyField = getField(capabilities, "story");
  const genreField = getField(capabilities, "genre");
  const emailField = getField(capabilities, "email");
  const bpmField = getField(capabilities, "bpm");
  const tagMoodField = getField(capabilities, "tagMood");
  const tagSceneField = getField(capabilities, "tagScene");
  const tagEnergyField = getField(capabilities, "tagEnergy");
  const tagInstrumentsField = getField(capabilities, "tagInstruments");
  const tagDrumStyleField = getField(capabilities, "tagDrumStyle");
  const tagVocalsField = getField(capabilities, "tagVocals");
  const tagProductionField = getField(capabilities, "tagProduction");
  const tagEraField = getField(capabilities, "tagEra");
  const languageField = getField(capabilities, "language");
  const keyField = getField(capabilities, "key");
  const scaleField = getField(capabilities, "scale");
  const timeSignatureField = getField(capabilities, "timesignature");
  const matchVenueQuery = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return selectableVenues.find(
      (option) =>
        option.name.toLowerCase() === normalized ||
        option.slug.toLowerCase() === normalized,
    );
  };
  const updateField = <T extends keyof SongRequestInput>(
    field: T,
    value: SongRequestInput[T],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const applyGenrePreset = (genre: SongRequestInput["genre"]) => {
    const preset = GENRE_AUTOPILOT[genre];
    setForm((current) => ({
      ...current,
      genre,
      bpm: preset.bpm,
      mood: preset.mood,
      energy: preset.energy,
      songType: preset.songType,
      tagMood: preset.tagMood,
      tagScene: preset.tagScene,
      tagEnergy: preset.tagEnergy,
      tagInstruments: preset.tagInstruments,
      tagDrumStyle: preset.tagDrumStyle,
      tagVocals: preset.tagVocals,
      tagProduction: preset.tagProduction,
      tagEra: preset.tagEra,
      duration: 120,
    }));
  };

  const photoPreviews = useMemo(
    () =>
      photos.map((file) => ({
        name: file.name || "photo",
        url: URL.createObjectURL(file),
        size: file.size,
      })),
    [photos],
  );

  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [photoPreviews]);

  function handlePhotoPick(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setError(null);
    setPhotos((current) => {
      const next = [...current];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_PHOTO_COUNT) {
          break;
        }
        if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
          setError("Use JPG, PNG, or WebP images only.");
          continue;
        }
        if (file.size > MAX_PHOTO_SIZE) {
          setError("Keep each photo under 12MB.");
          continue;
        }
        next.push(file);
      }
      return next;
    });
  }

  function handleVenueQueryChange(value: string) {
    setVenueQuery(value);
    const matchedVenue = matchVenueQuery(value);
    if (matchedVenue) {
      setSelectedVenueSlug(matchedVenue.slug);
    }
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function toggleSimpleField(
    field: "makeFunny" | "makeDramatic" | "includeEveryoneNames" | "mentionVenueName",
  ) {
    setForm((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  function toggleAudienceField(field: "makeDirty" | "kidsMode") {
    setForm((current) => {
      if (field === "makeDirty") {
        if (!selectedVenue.allowExplicitContent) {
          return current;
        }

        const nextDirty = !current.makeDirty;
        return {
          ...current,
          makeDirty: nextDirty,
          kidsMode: nextDirty ? false : current.kidsMode,
        };
      }

      if (!selectedVenue.allowKidsMode) {
        return current;
      }

      const nextKidsMode = !current.kidsMode;
      return {
        ...current,
        kidsMode: nextKidsMode,
        makeDirty: nextKidsMode ? false : current.makeDirty,
      };
    });
  }

  async function handleSubmit() {
    setError(null);

    if (form.names.trim().length < 2) {
      setError("Tell us who is in this memory first.");
      return;
    }

    const normalizedEmail = form.email.trim();
    if (!normalizedEmail) {
      setError("Please put in your email so we know where to send the song.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please put in a valid email so we know where to send the song.");
      return;
    }

    if (showVenueSelector && !matchVenueQuery(venueQuery)) {
      setError("Pick a venue from the list so we know where to play the song.");
      return;
    }

    startSubmit(async () => {
      let payloadForm: SongRequestInput = {
        ...form,
        duration: 120,
        photoBatchId: null,
        photoAssets: [],
      };

      if (photos.length > 0) {
        const uploadForm = new FormData();
        photos.forEach((file) => {
          uploadForm.append("photos", file);
        });

        const uploadResponse = await fetch("/api/uploads/photos", {
          method: "POST",
          body: uploadForm,
        });

        const uploadPayload = (await uploadResponse.json()) as {
          error?: string;
          batchId?: string;
          assets?: UploadedPhotoAsset[];
        };

        if (!uploadResponse.ok || !uploadPayload.batchId || !uploadPayload.assets) {
          setError(uploadPayload.error ?? "Could not upload your photos.");
          return;
        }

        payloadForm = {
          ...payloadForm,
          photoBatchId: uploadPayload.batchId,
          photoAssets: uploadPayload.assets,
        };
      }

      const response = await fetch(`/api/venues/${selectedVenue.slug}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payloadForm,
          promoCode: promoCode.trim().toLowerCase(),
        }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Something went sideways while starting checkout.");
        return;
      }

      window.location.assign(payload.url);
    });
  }

  const sectionCardClassName =
    "rounded-[1.25rem] border border-white/10 bg-white/4 p-4 backdrop-blur-sm sm:p-5";

  return (
    <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(166,86,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,72,167,0.12),transparent_24%),linear-gradient(180deg,rgba(7,8,14,0.99),rgba(16,11,25,0.99))] p-4 shadow-[0_45px_120px_rgba(0,0,0,0.48)] sm:p-5">
      <div className="relative mx-auto max-w-[46rem] space-y-4">
        <div className="space-y-0 text-center">
          <SongSelfieLogo compact />
          <h1 className="text-[2rem] font-black tracking-tight text-white sm:text-[2.4rem]">
            The soundtrack to your memories.
          </h1>
          <p className="text-lg font-semibold text-white sm:text-xl">
            Custom songs about your group, your night, and your story.
          </p>
        </div>

        <TopExplainerRow />

        {showVenueSelector ? (
          <section className={sectionCardClassName}>
            <label className="space-y-2">
              <PanelTitle>Where are you?</PanelTitle>
              <p className="text-sm text-white/55">
                The QR code fills this in. If it looks wrong, type your bar or restaurant name.
              </p>
              <input
                type="text"
                value={venueQuery}
                list="song-selfie-venues"
                placeholder="Start typing the venue name"
                onChange={(event) => handleVenueQueryChange(event.target.value)}
                className={cn("h-12", fieldShellClassName())}
              />
              <datalist id="song-selfie-venues">
                {selectableVenues.map((option) => (
                  <option key={option.slug} value={option.name} />
                ))}
              </datalist>
              <p className="text-xs font-semibold text-pink-100/70">
                Songs from this form will appear in {selectedVenue.name}&apos;s venue playlist.
              </p>
            </label>
          </section>
        ) : null}

        <section className={sectionCardClassName}>
          {namesField ? (
            <label className="space-y-2">
              <PanelTitle>{namesField.label}</PanelTitle>
              <input
                type="text"
                value={form.names}
                placeholder={namesField.placeholder}
                onChange={(event) => updateField("names", event.target.value)}
                className={cn("h-12", fieldShellClassName())}
              />
              {namesField.helper ? (
                <p className="text-sm text-white/55">{namesField.helper}</p>
              ) : null}
            </label>
          ) : null}
        </section>

        {storyField ? (
          <section className={sectionCardClassName}>
            <label className="space-y-2">
              <PanelTitle>What happened?</PanelTitle>
              <p className="text-sm text-white/55">
                Give examples in the text box so we can turn the moment into a song.
              </p>
              <div className="rounded-[1rem] border border-white/10 bg-white/6 p-3">
                <textarea
                  rows={5}
                  value={form.story}
                  placeholder={storyField.placeholder}
                  onChange={(event) => updateField("story", event.target.value)}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/35"
                />
              </div>
            </label>
          </section>
        ) : null}

        <section className={sectionCardClassName}>
          {genreField ? (
            <SelectField
              label="Genre"
              value={form.genre}
              options={getOptions(genreField).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(value) => applyGenrePreset(value as SongRequestInput["genre"])}
            />
          ) : null}
        </section>

        <section className="rounded-[1rem] border border-white/10 bg-white/5">
            <button
              type="button"
              onClick={() => setAdvancedOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <PanelTitle>Advanced Song Settings</PanelTitle>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white/55 transition",
                  advancedOpen ? "rotate-180" : "",
                )}
              />
            </button>

            {advancedOpen ? (
              <div className="space-y-4 border-t border-white/10 px-4 py-4">
                {bpmField ? (
                  <SliderField
                    label="Tempo / BPM"
                    value={form.bpm ?? 120}
                    min={bpmField.min ?? 60}
                    max={bpmField.max ?? 200}
                    step={bpmField.step ?? 1}
                    suffix=" BPM"
                    onChange={(value) => updateField("bpm", value)}
                  />
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleCard
                    title="NSFW"
                    checked={selectedVenue.allowExplicitContent && form.makeDirty}
                    disabled={!selectedVenue.allowExplicitContent}
                    onClick={() => toggleAudienceField("makeDirty")}
                  />
                  <ToggleCard
                    title="Just for kids"
                    checked={selectedVenue.allowKidsMode && form.kidsMode}
                    disabled={!selectedVenue.allowKidsMode}
                    onClick={() => toggleAudienceField("kidsMode")}
                  />
                  <ToggleCard
                    title="Make it funny"
                    checked={form.makeFunny}
                    onClick={() => toggleSimpleField("makeFunny")}
                  />
                  <ToggleCard
                    title="Make it dramatic"
                    checked={form.makeDramatic}
                    onClick={() => toggleSimpleField("makeDramatic")}
                  />
                  <ToggleCard
                    title="Include venue"
                    checked={form.mentionVenueName}
                    onClick={() => toggleSimpleField("mentionVenueName")}
                  />
                  <ToggleCard
                    title="Include names"
                    checked={form.includeEveryoneNames}
                    onClick={() => toggleSimpleField("includeEveryoneNames")}
                  />
                </div>

                {tagMoodField ? (
                  <ChipGroup
                    label={tagMoodField.label}
                    options={getOptions(tagMoodField)}
                    value={form.tagMood}
                    onChange={(value) =>
                      updateField("tagMood", value as SongRequestInput["tagMood"])
                    }
                  />
                ) : null}
                {tagSceneField ? (
                  <ChipGroup
                    label={tagSceneField.label}
                    options={getOptions(tagSceneField)}
                    value={form.tagScene}
                    onChange={(value) =>
                      updateField("tagScene", value as SongRequestInput["tagScene"])
                    }
                  />
                ) : null}
                {tagEnergyField ? (
                  <ChipGroup
                    label={tagEnergyField.label}
                    options={getOptions(tagEnergyField)}
                    value={form.tagEnergy}
                    onChange={(value) =>
                      updateField("tagEnergy", value as SongRequestInput["tagEnergy"])
                    }
                  />
                ) : null}
                {tagInstrumentsField ? (
                  <ChipGroup
                    label={tagInstrumentsField.label}
                    options={getOptions(tagInstrumentsField)}
                    value={form.tagInstruments}
                    onChange={(value) =>
                      updateField(
                        "tagInstruments",
                        value as SongRequestInput["tagInstruments"],
                      )
                    }
                  />
                ) : null}
                {tagDrumStyleField ? (
                  <ChipGroup
                    label={tagDrumStyleField.label}
                    options={getOptions(tagDrumStyleField)}
                    value={form.tagDrumStyle}
                    onChange={(value) =>
                      updateField(
                        "tagDrumStyle",
                        value as SongRequestInput["tagDrumStyle"],
                      )
                    }
                  />
                ) : null}
                {tagVocalsField ? (
                  <ChipGroup
                    label={tagVocalsField.label}
                    options={getOptions(tagVocalsField)}
                    value={form.tagVocals}
                    onChange={(value) =>
                      updateField("tagVocals", value as SongRequestInput["tagVocals"])
                    }
                  />
                ) : null}
                {tagProductionField ? (
                  <ChipGroup
                    label={tagProductionField.label}
                    options={getOptions(tagProductionField)}
                    value={form.tagProduction}
                    onChange={(value) =>
                      updateField(
                        "tagProduction",
                        value as SongRequestInput["tagProduction"],
                      )
                    }
                  />
                ) : null}
                {tagEraField ? (
                  <ChipGroup
                    label={tagEraField.label}
                    options={getOptions(tagEraField)}
                    value={form.tagEra}
                    onChange={(value) =>
                      updateField("tagEra", value as SongRequestInput["tagEra"])
                    }
                  />
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  {languageField ? (
                    <SelectField
                      label={languageField.label}
                      value={form.language}
                      options={getOptions(languageField)}
                      onChange={(value) =>
                        updateField("language", value as SongRequestInput["language"])
                      }
                    />
                  ) : null}
                  {keyField ? (
                    <SelectField
                      label={keyField.label}
                      value={form.key}
                      options={getOptions(keyField)}
                      onChange={(value) =>
                        updateField("key", value as SongRequestInput["key"])
                      }
                    />
                  ) : null}
                  {scaleField ? (
                    <SelectField
                      label={scaleField.label}
                      value={form.scale}
                      options={getOptions(scaleField)}
                      onChange={(value) =>
                        updateField("scale", value as SongRequestInput["scale"])
                      }
                    />
                  ) : null}
                  {timeSignatureField ? (
                    <SelectField
                      label={timeSignatureField.label}
                      value={form.timesignature}
                      options={getOptions(timeSignatureField)}
                      onChange={(value) =>
                        updateField(
                          "timesignature",
                          value as SongRequestInput["timesignature"],
                        )
                      }
                    />
                  ) : null}
                </div>

              </div>
            ) : null}
        </section>

        <section className={sectionCardClassName}>
          {emailField ? (
            <label className="space-y-2">
              <PanelTitle>{emailField.label}</PanelTitle>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-300" />
                <input
                  type="email"
                  value={form.email}
                  placeholder={emailField.placeholder}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={cn("h-12 pl-11", fieldShellClassName())}
                />
              </div>
              {emailField.helper ? (
                <p className="text-sm text-white/55">{emailField.helper}</p>
              ) : null}
            </label>
          ) : null}
        </section>

        <section className={sectionCardClassName}>
          <PhotoUpload
            previews={photoPreviews}
            disabled={isPending}
            onPick={handlePhotoPick}
            onRemove={removePhoto}
          />
        </section>

        <section className={sectionCardClassName}>
          <CheckoutPanel
            isPending={isPending}
            priceCents={selectedVenue.priceCents}
            promoCode={promoCode}
            onPromoCodeChange={setPromoCode}
            onSubmit={handleSubmit}
          />
        </section>

        {error ? (
          <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/12 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import {
  ArrowRight,
  ChevronDown,
  Loader2,
  Lock,
  Mail,
  Music4,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useState, useTransition } from "react";

import type {
  FormField,
  getFineTuneCapabilities,
} from "@/lib/finetune-capabilities";
import type { SongRequestInput } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/src/components/ui/button";

type Capabilities = ReturnType<typeof getFineTuneCapabilities>;

type SongBuilderProps = {
  venue: {
    name: string;
    slug: string;
    description: string | null;
    priceCents: number;
  };
  capabilities: Capabilities;
};

const SONG_TYPE_EMOJI: Record<string, string> = {
  "epic-battle": "⚔️",
  "love-song": "💗",
  "party-anthem": "🪩",
  "funny-roast": "😂",
  "sexy-vibe": "🔥",
  "chill-vibe": "🌴",
  "story-mode": "📖",
};

const MOOD_EMOJI: Record<string, string> = {
  chill: "😎",
  happy: "🙂",
  emotional: "🥹",
  aggressive: "😡",
  hype: "🚀",
};

function money(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}

function getField(capabilities: Capabilities, fieldId: keyof SongRequestInput) {
  return capabilities.sections
    .flatMap((section) => section.fields)
    .find((field) => field.id === fieldId);
}

function getOptions(field: FormField) {
  return field.options ?? [];
}

export function SongBuilder({ venue, capabilities }: SongBuilderProps) {
  const [form, setForm] = useState<SongRequestInput>(capabilities.defaults);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPending, startSubmit] = useTransition();

  const namesField = getField(capabilities, "names");
  const emailField = getField(capabilities, "email");
  const songTypeField = getField(capabilities, "songType");
  const moodField = getField(capabilities, "mood");
  const genreField = getField(capabilities, "genre");
  const bpmField = getField(capabilities, "bpm");
  const energyField = getField(capabilities, "energy");
  const storyField = getField(capabilities, "story");
  const structureField = getField(capabilities, "structure");
  const durationField = getField(capabilities, "duration");
  const languageField = getField(capabilities, "language");
  const keyField = getField(capabilities, "key");
  const scaleField = getField(capabilities, "scale");
  const timeSignatureField = getField(capabilities, "timesignature");
  const lyricsField = getField(capabilities, "lyrics");
  const seedField = getField(capabilities, "seed");

  const updateField = <T extends keyof SongRequestInput>(
    field: T,
    value: SongRequestInput[T],
  ) => {
    startTransition(() => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    });
  };

  async function handleSubmit() {
    setError(null);
    startSubmit(async () => {
      const response = await fetch(`/api/venues/${venue.slug}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Something went sideways while starting checkout.");
        return;
      }

      window.location.assign(payload.url);
    });
  }

  return (
    <section className="rounded-[2.5rem] bg-[radial-gradient(circle_at_top,rgba(176,97,255,0.24),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(255,106,158,0.18),transparent_24%),linear-gradient(180deg,#120f1f,#17122a_45%,#1e1635)] p-3 shadow-[0_50px_120px_rgba(11,8,25,0.45)] sm:p-4">
      <div className="overflow-hidden rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,255,0.93))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="border-b border-slate-200/80 px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-[0_10px_25px_rgba(148,63,255,0.12)]">
                  <span className="text-2xl">🎵</span>
                  <div>
                    <p className="font-black tracking-tight text-[color:#1d122b] sm:text-2xl">
                      Song Selfie
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                  <WandSparkles className="h-4 w-4" />
                  AI Magic
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg text-slate-500 sm:text-xl">
                  Make a soundtrack for your selfies.
                </p>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Let&apos;s make <span className="text-fuchsia-500">your</span> song
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                  Answer a few quick questions and we&apos;ll build a custom song for
                  this moment at {venue.name}. {venue.description ?? "Selfies make the memory. Songs make the soundtrack."}
                </p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-violet-100 bg-[linear-gradient(145deg,#fff7fd,#f8f1ff)] p-4 shadow-[0_16px_34px_rgba(163,90,255,0.12)] md:max-w-xs">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">
                Checkout
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {venue.priceCents === 0 ? "Free today for testing" : money(venue.priceCents)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {venue.priceCents === 0
                  ? "Guests normally review and pay in Stripe before generation starts."
                  : "Guests complete a secure Stripe checkout before we generate the song."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl space-y-8">
            <section className="grid gap-4 md:grid-cols-2">
              {namesField ? (
                <label className="space-y-3">
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                    <span className="text-violet-500">◎</span>
                    Who&apos;s it about?
                  </span>
                  <input
                    type="text"
                    value={form.names}
                    placeholder={namesField.placeholder}
                    onChange={(event) => updateField("names", event.target.value)}
                    className="h-14 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)] outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                  />
                </label>
              ) : null}

              {emailField ? (
                <label className="space-y-3">
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                    <Mail className="h-4 w-4 text-violet-500" />
                    Your email
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    placeholder={emailField.placeholder}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-14 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)] outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                  />
                </label>
              ) : null}
            </section>

            {songTypeField ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                  <span className="text-fuchsia-500">✦</span>
                  Pick a song vibe
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                  {getOptions(songTypeField).map((option) => {
                    const selected = form.songType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateField(
                            "songType",
                            option.value as SongRequestInput["songType"],
                          )
                        }
                        className={cn(
                          "rounded-[1.35rem] border px-3 py-4 text-center transition",
                          selected
                            ? "border-violet-400 bg-[linear-gradient(180deg,#fff,#fff5ff)] shadow-[0_16px_36px_rgba(191,90,242,0.18)]"
                            : "border-slate-200 bg-white hover:border-fuchsia-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
                        )}
                      >
                        <div className="text-3xl">{SONG_TYPE_EMOJI[option.value] ?? "✨"}</div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {option.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {moodField ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                  <span className="text-violet-500">⌁</span>
                  Mood / energy
                </div>
                <div className="grid overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white sm:grid-cols-5">
                  {getOptions(moodField).map((option) => {
                    const selected = form.mood === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateField("mood", option.value as SongRequestInput["mood"])
                        }
                        className={cn(
                          "border-b border-slate-200 px-4 py-4 text-center transition sm:border-b-0 sm:border-r",
                          selected
                            ? "bg-[linear-gradient(135deg,#8b46ff,#f34f8b)] text-white"
                            : "bg-white text-slate-900 hover:bg-slate-50",
                        )}
                      >
                        <div className="text-2xl">{MOOD_EMOJI[option.value] ?? "✨"}</div>
                        <p className="mt-2 text-sm font-semibold">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
                {energyField ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Energy level</p>
                      <p className="text-sm font-black text-violet-600">{form.energy}/5</p>
                    </div>
                    <input
                      type="range"
                      min={energyField.min}
                      max={energyField.max}
                      step={energyField.step}
                      value={form.energy}
                      onChange={(event) =>
                        updateField("energy", Number(event.target.value))
                      }
                      className="w-full accent-[var(--color-accent)]"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
              {genreField ? (
                <label className="space-y-3">
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                    <span className="text-violet-500">♪</span>
                    Genre
                  </span>
                  <div className="relative">
                    <select
                      value={form.genre}
                      onChange={(event) =>
                        updateField(
                          "genre",
                          event.target.value as SongRequestInput["genre"],
                        )
                      }
                      className="h-14 w-full appearance-none rounded-[1.2rem] border border-slate-200 bg-white px-4 pr-12 text-base text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                    >
                      {getOptions(genreField).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
              ) : null}

              {bpmField ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                      <span className="text-violet-500">◔</span>
                      Tempo (BPM)
                    </span>
                    <span className="text-sm font-black text-slate-500">
                      {form.bpm ?? "Auto"} BPM
                    </span>
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4">
                    <input
                      type="range"
                      min={bpmField.min}
                      max={bpmField.max}
                      step={bpmField.step}
                      value={form.bpm ?? 120}
                      onChange={(event) =>
                        updateField("bpm", Number(event.target.value))
                      }
                      className="w-full accent-[var(--color-accent)]"
                    />
                    <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
                      <span>{bpmField.min}</span>
                      <span>120</span>
                      <span>{bpmField.max}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              {storyField ? (
                <label className="space-y-3">
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                    <span className="text-violet-500">✎</span>
                    What&apos;s the story?
                  </span>
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white p-3 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)]">
                    <textarea
                      rows={5}
                      value={form.story}
                      placeholder={storyField.placeholder}
                      onChange={(event) => updateField("story", event.target.value)}
                      className="w-full resize-none bg-transparent px-1 py-1 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400"
                    />
                    <div className="flex justify-end text-sm text-slate-400">
                      {form.story.length}/320
                    </div>
                  </div>
                </label>
              ) : null}

              <div className="flex items-end">
                <div className="relative w-full overflow-hidden rounded-[1.8rem] border border-fuchsia-100 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.24),transparent_35%),linear-gradient(180deg,#fff6fb,#f5efff)] p-5 text-center shadow-[0_20px_40px_rgba(180,90,255,0.14)]">
                  <div className="absolute right-4 top-4 text-2xl">♪</div>
                  <div className="absolute left-5 top-12 text-xl">♫</div>
                  <div className="mx-auto flex h-28 w-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(180deg,#ff8dc8,#d953ff)] text-5xl shadow-[0_20px_40px_rgba(217,83,255,0.28)]">
                    <Music4 className="h-10 w-10 text-white" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Your table becomes the hook, the chorus, and the memory.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 lg:grid-cols-3">
              {[
                {
                  key: "includeEveryoneNames" as const,
                  title: "Include Everyone's Names",
                  subtitle: "We'll shout out your crew.",
                  icon: "✨",
                },
                {
                  key: "makeFunny" as const,
                  title: "Make It Funny",
                  subtitle: "Bring the laughs.",
                  icon: "🙂",
                },
                {
                  key: "makeDramatic" as const,
                  title: "Make It Dramatic",
                  subtitle: "Go big or go home.",
                  icon: "🔥",
                },
              ].map((toggle) => {
                const checked = form[toggle.key];
                return (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => updateField(toggle.key, !checked)}
                    className={cn(
                      "flex items-center justify-between rounded-[1.3rem] border px-4 py-4 text-left transition",
                      checked
                        ? "border-transparent bg-[linear-gradient(135deg,rgba(166,77,255,0.12),rgba(255,99,145,0.14))] shadow-[0_12px_28px_rgba(166,77,255,0.14)]"
                        : "border-slate-200 bg-white hover:border-fuchsia-200",
                    )}
                  >
                    <div>
                      <p className="text-lg">{toggle.icon}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {toggle.title}
                      </p>
                      <p className="text-xs text-slate-500">{toggle.subtitle}</p>
                    </div>
                    <div
                      className={cn(
                        "relative h-7 w-12 rounded-full transition",
                        checked ? "bg-violet-500" : "bg-slate-200",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                          checked ? "left-6" : "left-1",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </section>

            {structureField || durationField || languageField || keyField || scaleField || timeSignatureField || lyricsField || seedField ? (
              <section className="rounded-[1.6rem] border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                      FineTune controls
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Direct generation parameters and optional lyric seeding.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Magic
                  </div>
                </button>

                {showAdvanced ? (
                  <div className="grid gap-4 border-t border-slate-200 px-4 py-4 lg:grid-cols-2">
                    {durationField ? (
                      <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {durationField.label}
                          </p>
                          <p className="text-sm font-black text-violet-600">
                            {form.duration}s
                          </p>
                        </div>
                        <input
                          type="range"
                          min={durationField.min}
                          max={durationField.max}
                          step={durationField.step}
                          value={form.duration}
                          onChange={(event) =>
                            updateField("duration", Number(event.target.value))
                          }
                          className="w-full accent-[var(--color-accent)]"
                        />
                      </div>
                    ) : null}

                    {languageField ? (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {languageField.label}
                        </span>
                        <div className="relative">
                          <select
                            value={form.language}
                            onChange={(event) =>
                              updateField(
                                "language",
                                event.target.value as SongRequestInput["language"],
                              )
                            }
                            className="h-12 w-full appearance-none rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 pr-10 text-sm text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                          >
                            {getOptions(languageField).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </label>
                    ) : null}

                    {keyField ? (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {keyField.label}
                        </span>
                        <div className="relative">
                          <select
                            value={form.key}
                            onChange={(event) =>
                              updateField(
                                "key",
                                event.target.value as SongRequestInput["key"],
                              )
                            }
                            className="h-12 w-full appearance-none rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 pr-10 text-sm text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                          >
                            {getOptions(keyField).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </label>
                    ) : null}

                    {scaleField ? (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {scaleField.label}
                        </span>
                        <div className="relative">
                          <select
                            value={form.scale}
                            onChange={(event) =>
                              updateField(
                                "scale",
                                event.target.value as SongRequestInput["scale"],
                              )
                            }
                            className="h-12 w-full appearance-none rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 pr-10 text-sm text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                          >
                            {getOptions(scaleField).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </label>
                    ) : null}

                    {timeSignatureField ? (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {timeSignatureField.label}
                        </span>
                        <div className="relative">
                          <select
                            value={form.timesignature}
                            onChange={(event) =>
                              updateField(
                                "timesignature",
                                event.target.value as SongRequestInput["timesignature"],
                              )
                            }
                            className="h-12 w-full appearance-none rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 pr-10 text-sm text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                          >
                            {getOptions(timeSignatureField).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </label>
                    ) : null}

                    {lyricsField ? (
                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {lyricsField.label}
                        </span>
                        <textarea
                          rows={4}
                          value={form.lyrics}
                          placeholder={lyricsField.placeholder}
                          onChange={(event) => updateField("lyrics", event.target.value)}
                          className="w-full rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                        />
                      </label>
                    ) : null}

                    {seedField ? (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {seedField.label}
                        </span>
                        <input
                          type="text"
                          value={form.seed ?? ""}
                          placeholder={seedField.placeholder}
                          onChange={(event) => {
                            const nextValue = event.target.value.trim();
                            updateField("seed", nextValue ? Number(nextValue) : null);
                          }}
                          className="h-12 w-full rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {error ? (
              <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <section className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#fbf7ff)] p-4 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="min-h-16 w-full rounded-[1.25rem] bg-[linear-gradient(90deg,#ff5d8f,#8b5cff)] text-lg font-black tracking-[0.08em] uppercase shadow-[0_24px_60px_rgba(160,72,255,0.28)]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Launching checkout...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {venue.priceCents === 0 ? "Create my song" : "Continue to payment"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="mt-4 space-y-2 text-center">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Lock className="h-4 w-4 text-violet-500" />
                  Secure payment powered by Stripe
                </p>
                <p className="text-sm text-slate-500">
                  {venue.priceCents === 0
                    ? "Free today for testing. Guests normally review and pay before we start generation."
                    : "You will review and pay before we create your song."}
                </p>
              </div>

              <div className="mt-5 grid gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-4 md:grid-cols-3">
                {[
                  {
                    icon: "⚡",
                    title: "Custom AI lyrics",
                    copy: "Written just for your table.",
                  },
                  {
                    icon: "♫",
                    title: "Studio-quality output",
                    copy: "Prompted for a polished final track.",
                  },
                  {
                    icon: "✉️",
                    title: "Delivered to you",
                    copy: "Email link as soon as it is ready.",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="text-center md:text-left">
                    <p className="text-xl">{feature.icon}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {feature.title}
                    </p>
                    <p className="text-sm text-slate-500">{feature.copy}</p>
                  </div>
                ))}
              </div>
            </section>
            <div className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_26px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
                Venue tools
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Venue and admin dashboards stay separate from the guest flow, but this
                same page still routes through the normal Stripe-first generation path.
              </p>
              <Link
                href="/sign-in"
                className="mt-4 inline-flex text-sm font-semibold text-violet-700"
              >
                Venue/Admin sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

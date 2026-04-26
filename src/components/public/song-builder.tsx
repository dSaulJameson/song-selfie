"use client";

import { ArrowRight, ChevronDown, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import type {
  FormField,
  getFineTuneCapabilities,
} from "@/lib/finetune-capabilities";
import type { SongRequestInput } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { SongSelfieLogo } from "@/src/components/public/song-selfie-logo";
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
  mode?: "venue" | "paid-home" | "free-testing";
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

export function SongBuilder({
  venue,
  capabilities,
  mode = "venue",
}: SongBuilderProps) {
  const [form, setForm] = useState<SongRequestInput>(capabilities.defaults);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startSubmit] = useTransition();

  const namesField = getField(capabilities, "names");
  const emailField = getField(capabilities, "email");
  const storyField = getField(capabilities, "story");
  const songTypeField = getField(capabilities, "songType");
  const moodField = getField(capabilities, "mood");
  const genreField = getField(capabilities, "genre");
  const structureField = getField(capabilities, "structure");
  const bpmField = getField(capabilities, "bpm");
  const durationField = getField(capabilities, "duration");
  const energyField = getField(capabilities, "energy");
  const mentionVenueField = getField(capabilities, "mentionVenueName");
  const isPaidHome = mode === "paid-home";
  const isFreeTesting = mode === "free-testing";

  const heroEyebrow = isPaidHome
    ? "Paid Song Selfie checkout"
    : isFreeTesting
      ? "Private free testing"
      : venue.name;
  const heroTitle = isPaidHome
    ? "Make a soundtrack for the memory."
    : isFreeTesting
      ? "Build free test songs before launch."
      : "Let's make your song";
  const heroDescription = isPaidHome
    ? "Answer a few questions, complete a secure Stripe checkout, and we'll generate a custom song for your table and email it when it's ready."
    : isFreeTesting
      ? "This page is password-protected for internal testing. Use it to test free songs, email delivery, and generation quality before wider launch."
      : `Answer a few quick questions and we'll build a custom song for this moment. ${
          venue.description ?? "Selfies make the memory. Songs make the soundtrack."
        }`;
  const checkoutLabel = isPaidHome
    ? "Today: $1"
    : isFreeTesting
      ? "Free with testing access"
      : venue.priceCents === 0
        ? "Free today for testing"
        : money(venue.priceCents);
  const checkoutCaption = isPaidHome
    ? "Songs are normally $10. They're 90% off while testing, and guests complete a secure Stripe checkout before we generate anything."
    : isFreeTesting
      ? "Unlocked for free testing only. This bypasses the paid launch flow so we can QA the song experience."
      : venue.priceCents === 0
        ? "Guests normally review and pay in Stripe before generation starts."
        : "Guests complete a secure Stripe checkout before we generate the song.";
  const primaryButtonLabel = isPaidHome
    ? "Continue to $1 checkout"
    : isFreeTesting
      ? "Create free test song"
      : venue.priceCents === 0
        ? "Create my song"
        : "Continue to payment";
  const paymentFootnote = isPaidHome
    ? "You will review and pay in secure Stripe checkout before we create your song."
    : isFreeTesting
      ? "Free internal testing only. The live launch flow uses secure Stripe checkout before generation."
      : venue.priceCents === 0
        ? "Free today for testing. Guests normally review and pay before we start generation."
        : "You will review and pay before we create your song.";
  const features = isPaidHome
    ? [
        {
          title: "Secure Stripe checkout",
          copy: "Payment happens first, then generation starts.",
        },
        {
          title: "Custom AI lyrics",
          copy: "Written for your table, story, and names.",
        },
        {
          title: "Delivered by email",
          copy: "The finished song lands in your inbox fast.",
        },
      ]
    : isFreeTesting
      ? [
          {
            title: "Private testing page",
            copy: "Password-gated so only testers can get in.",
          },
          {
            title: "Free QA generation",
            copy: "Useful for checking prompt quality and flow.",
          },
          {
            title: "Delivered to you",
            copy: "Email link as soon as it is ready.",
          },
        ]
      : [
          {
            title: "Custom AI lyrics",
            copy: "Written just for your moment.",
          },
          {
            title: "Duration-aware writing",
            copy: "Shorter songs now get tighter lyric packets.",
          },
          {
            title: "Delivered to you",
            copy: "Email link as soon as it is ready.",
          },
        ];

  const updateField = <T extends keyof SongRequestInput>(
    field: T,
    value: SongRequestInput[T],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  async function handleSubmit() {
    setError(null);

    if (form.names.trim().length < 2) {
      setError("Tell us who the song is about first.");
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
              <SongSelfieLogo />
              <div className="space-y-2">
                <p className="inline-flex rounded-full border border-fuchsia-100 bg-fuchsia-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-600">
                  {heroEyebrow}
                </p>
                <p className="text-lg text-slate-500 sm:text-xl">
                  Song Selfies are the soundtrack to your memories.
                </p>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {heroTitle.includes("your") ? (
                    <>
                      Let&apos;s make <span className="text-fuchsia-500">your</span> song
                    </>
                  ) : (
                    heroTitle
                  )}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                  {heroDescription}
                </p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-violet-100 bg-[linear-gradient(145deg,#fff7fd,#f8f1ff)] p-4 shadow-[0_16px_34px_rgba(163,90,255,0.12)] md:max-w-xs">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">
                Checkout
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {checkoutLabel}
              </p>
              {isPaidHome ? (
                <p className="mt-1 text-sm font-semibold text-slate-400 line-through">$10 usual price</p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {checkoutCaption}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              {namesField ? (
                <label className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                      Who&apos;s it about?
                    </span>
                    <p className="text-xs text-slate-500">
                      Separate people, groups, and pets with commas.
                    </p>
                  </div>
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
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                      <Mail className="h-4 w-4 text-violet-500" />
                      Email
                    </span>
                    <p className="text-xs text-slate-500">
                      Where are we sending the song?
                    </p>
                  </div>
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

            {storyField ? (
              <section className="space-y-3">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                  What&apos;s the story?
                </span>
                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-3 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)]">
                  <textarea
                    rows={4}
                    value={form.story}
                    placeholder={storyField.placeholder}
                    onChange={(event) => updateField("story", event.target.value)}
                    className="w-full resize-none bg-transparent px-1 py-1 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <div className="flex justify-end text-xs text-slate-400">
                    {form.story.length}/320
                  </div>
                </div>
              </section>
            ) : null}

            {songTypeField ? (
              <section className="space-y-4">
                <div className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
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
                          "rounded-[1.35rem] border px-3 py-3 text-left transition",
                          selected
                            ? "border-violet-400 bg-[linear-gradient(180deg,#fff,#fff5ff)] shadow-[0_16px_36px_rgba(191,90,242,0.18)]"
                            : "border-slate-200 bg-white hover:border-fuchsia-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
                        )}
                      >
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {moodField ? (
              <section className="space-y-4">
                <div className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
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
                          "border-b border-slate-200 px-3 py-3 text-center transition sm:border-b-0 sm:border-r",
                          selected
                            ? "bg-[linear-gradient(135deg,#8b46ff,#f34f8b)] text-white"
                            : "bg-white text-slate-900 hover:bg-slate-50",
                        )}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4 md:grid-cols-2">
                {genreField ? (
                  <label className="space-y-3">
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
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

                {structureField ? (
                  <label className="space-y-3">
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                      Structure
                    </span>
                    <div className="relative">
                      <select
                        value={form.structure}
                        onChange={(event) =>
                          updateField(
                            "structure",
                            event.target.value as SongRequestInput["structure"],
                          )
                        }
                        className="h-14 w-full appearance-none rounded-[1.2rem] border border-slate-200 bg-white px-4 pr-12 text-base text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                      >
                        {getOptions(structureField).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {bpmField ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                        Tempo
                      </span>
                      <span className="text-sm font-black text-slate-500">
                        {form.bpm ?? "Auto"} BPM
                      </span>
                    </div>
                    <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                      <input
                        type="range"
                        min={bpmField.min}
                        max={bpmField.max}
                        step={bpmField.step}
                        value={form.bpm ?? 120}
                        onChange={(event) => updateField("bpm", Number(event.target.value))}
                        className="w-full accent-[var(--color-accent)]"
                      />
                      <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
                        <span>{bpmField.min}</span>
                        <span>120</span>
                        <span>{bpmField.max}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {durationField ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                        Duration
                      </span>
                      <span className="text-sm font-black text-slate-500">
                        {form.duration}s
                      </span>
                    </div>
                    <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
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
                      <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
                        <span>{durationField.min}s</span>
                        <span>60s</span>
                        <span>{durationField.max}s</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {energyField ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                    Energy level
                  </span>
                  <span className="text-sm font-black text-violet-600">{form.energy}/5</span>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                  <input
                    type="range"
                    min={energyField.min}
                    max={energyField.max}
                    step={energyField.step}
                    value={form.energy}
                    onChange={(event) => updateField("energy", Number(event.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                </div>
              </section>
            ) : null}

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  key: "includeEveryoneNames" as const,
                  title: "Include everyone's names",
                  subtitle: "Call out the whole crew.",
                },
                {
                  key: "makeFunny" as const,
                  title: "Make it funny",
                  subtitle: "Bring the laughs.",
                },
                {
                  key: "makeDramatic" as const,
                  title: "Make it dramatic",
                  subtitle: "Push the big moments.",
                },
                {
                  key: "mentionVenueName" as const,
                  title: mentionVenueField?.label ?? "Mention the venue",
                  subtitle: "Only if you want the place named.",
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
                      <p className="text-sm font-semibold text-slate-900">{toggle.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{toggle.subtitle}</p>
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
                    {primaryButtonLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="mt-4 space-y-2 text-center">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Lock className="h-4 w-4 text-violet-500" />
                  {isFreeTesting ? "Testing mode unlocked" : "Secure payment powered by Stripe"}
                </p>
                <p className="text-sm text-slate-500">
                  {paymentFootnote}
                </p>
              </div>

              <div className="mt-5 grid gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-4 md:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.title} className="text-center md:text-left">
                    <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{feature.copy}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

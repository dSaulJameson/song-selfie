"use client";

import { ArrowRight, Loader2, Music4, Sparkles } from "lucide-react";
import Link from "next/link";
import { startTransition, useDeferredValue, useState, useTransition } from "react";

import type { getFineTuneCapabilities } from "@/lib/finetune-capabilities";
import { buildPromptPackage } from "@/lib/prompt-builder";
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

function money(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}

export function SongBuilder({ venue, capabilities }: SongBuilderProps) {
  const [form, setForm] = useState<SongRequestInput>(capabilities.defaults);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startSubmit] = useTransition();
  const deferredStory = useDeferredValue(form.story);

  const preview = buildPromptPackage(
    {
      ...form,
      story: deferredStory,
    },
    { venueName: venue.name },
  );

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8">
      <div className="flex-1 space-y-6">
        <section className="panel-glow overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-white/88 p-6 shadow-[0_28px_70px_rgba(22,12,46,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-muted-foreground)]">
            <span className="inline-flex items-center rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 font-semibold text-[color:var(--color-accent)]">
              <Sparkles className="mr-2 h-4 w-4" />
              Song Selfie
            </span>
            <span>Live for {venue.name}</span>
            <span>•</span>
            <span>
              {venue.priceCents === 0
                ? "Free test mode"
                : `${money(venue.priceCents)} per custom track`}
            </span>
          </div>
          <div className="mt-4 max-w-2xl space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
              Make a soundtrack for this memory.
            </h1>
            <p className="text-base leading-7 text-[color:var(--color-muted-foreground)] sm:text-lg">
              Selfies capture what happened. Song Selfie captures how it felt.
              Pick the vibe, tell us the story, and we’ll turn your table into a
              custom soundtrack. Your payment unlocks checkout first, then the
              finished track lands in your inbox.
            </p>
          </div>
        </section>

        {capabilities.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-5 shadow-[0_20px_40px_rgba(22,12,46,0.08)] backdrop-blur sm:p-6"
          >
            <div className="mb-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[color:var(--color-accent)]">
                {section.eyebrow}
              </p>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-[color:var(--color-foreground)]">
                    {section.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {section.fields.map((field) => {
                const currentValue = form[field.id as keyof SongRequestInput];

                if (field.kind === "cards") {
                  return (
                    <div key={field.id} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-[color:var(--color-foreground)]">
                          {field.label}
                        </label>
                        {field.helper ? (
                          <span className="text-xs text-[color:var(--color-muted-foreground)]">
                            {field.helper}
                          </span>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {(field.options ?? []).map((option) => {
                          const selected = currentValue === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                updateField(
                                  field.id,
                                  option.value as SongRequestInput[typeof field.id],
                                )
                              }
                              className={cn(
                                "group rounded-[1.6rem] border px-4 py-4 text-left transition duration-200",
                                selected
                                  ? "border-transparent bg-[linear-gradient(140deg,rgba(255,107,53,0.16),rgba(255,196,86,0.34))] shadow-[0_18px_36px_rgba(255,107,53,0.18)]"
                                  : "border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] hover:border-[color:rgba(255,107,53,0.4)] hover:bg-white",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-bold text-[color:var(--color-foreground)]">
                                    {option.label}
                                  </p>
                                  {option.description ? (
                                    <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                                      {option.description}
                                    </p>
                                  ) : null}
                                </div>
                                <div
                                  className={cn(
                                    "mt-1 h-4 w-4 rounded-full border",
                                    selected
                                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]"
                                      : "border-[color:var(--color-line)] bg-white",
                                  )}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (field.kind === "select") {
                  return (
                    <label key={field.id} className="grid gap-2 text-sm">
                      <span className="font-semibold text-[color:var(--color-foreground)]">
                        {field.label}
                      </span>
                      <select
                        value={String(currentValue)}
                        onChange={(event) =>
                          updateField(
                            field.id,
                            event.target.value as SongRequestInput[typeof field.id],
                          )
                        }
                        className="h-13 rounded-2xl border border-[color:var(--color-line)] bg-white/85 px-4 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {field.helper ? (
                        <span className="text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                          {field.helper}
                        </span>
                      ) : null}
                    </label>
                  );
                }

                if (field.kind === "range") {
                  const numericValue =
                    typeof currentValue === "number" ? currentValue : field.min;
                  const isBpmField = field.id === "bpm";

                  return (
                    <div key={field.id} className="space-y-3 rounded-[1.5rem] bg-[color:var(--color-surface)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-[color:var(--color-foreground)]">
                          {field.label}
                        </label>
                        <span className="text-sm font-black text-[color:var(--color-accent)]">
                          {isBpmField && form.bpm === null
                            ? "Auto"
                            : `${numericValue}${field.id === "duration" ? " sec" : ""}`}
                        </span>
                      </div>
                      {isBpmField ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              form.bpm === null
                                ? "bg-[color:var(--color-accent)] text-white"
                                : "bg-white text-[color:var(--color-muted-foreground)]",
                            )}
                            onClick={() => updateField("bpm", null)}
                          >
                            Auto tempo
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              form.bpm !== null
                                ? "bg-[color:var(--color-accent)] text-white"
                                : "bg-white text-[color:var(--color-muted-foreground)]",
                            )}
                            onClick={() => updateField("bpm", 122)}
                          >
                            Fine tune it
                          </button>
                        </div>
                      ) : null}
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={numericValue}
                        disabled={isBpmField && form.bpm === null}
                        onChange={(event) =>
                          updateField(
                            field.id,
                            Number(event.target.value) as SongRequestInput[typeof field.id],
                          )
                        }
                        className="w-full accent-[var(--color-accent)] disabled:opacity-40"
                      />
                      {field.helper ? (
                        <p className="text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                          {field.helper}
                        </p>
                      ) : null}
                    </div>
                  );
                }

                if (field.kind === "toggle") {
                  const checked = Boolean(currentValue);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() =>
                        updateField(
                          field.id,
                          (!checked) as SongRequestInput[typeof field.id],
                        )
                      }
                      className={cn(
                        "flex w-full items-center justify-between rounded-[1.5rem] border px-4 py-4 text-left transition",
                        checked
                          ? "border-transparent bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(255,196,86,0.24))]"
                          : "border-[color:var(--color-line)] bg-white/80",
                      )}
                    >
                      <div>
                        <p className="font-semibold text-[color:var(--color-foreground)]">
                          {field.label}
                        </p>
                        {field.helper ? (
                          <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                            {field.helper}
                          </p>
                        ) : null}
                      </div>
                      <div
                        className={cn(
                          "relative h-7 w-12 rounded-full transition",
                          checked ? "bg-[color:var(--color-accent)]" : "bg-slate-300/70",
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
                }

                const value = currentValue ?? "";
                const isTextArea = field.kind === "textarea";

                return (
                  <label key={field.id} className="grid gap-2 text-sm">
                    <span className="font-semibold text-[color:var(--color-foreground)]">
                      {field.label}
                    </span>
                    {isTextArea ? (
                      <textarea
                        rows={5}
                        value={String(value)}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          updateField(
                            field.id,
                            event.target.value as SongRequestInput[typeof field.id],
                          )
                        }
                        className="rounded-[1.5rem] border border-[color:var(--color-line)] bg-white/85 px-4 py-3 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
                      />
                    ) : (
                      <input
                        type={field.kind === "email" ? "email" : "text"}
                        value={String(value)}
                        placeholder={field.placeholder}
                        onChange={(event) => {
                          if (field.id === "seed") {
                            const nextValue = event.target.value.trim();
                            updateField("seed", nextValue ? Number(nextValue) : null);
                            return;
                          }

                          updateField(
                            field.id,
                            event.target.value as SongRequestInput[typeof field.id],
                          );
                        }}
                        className="h-13 rounded-[1.5rem] border border-[color:var(--color-line)] bg-white/85 px-4 text-[color:var(--color-foreground)] outline-none transition focus:border-[color:var(--color-accent)]"
                      />
                    )}
                    {field.helper ? (
                      <span className="text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                        {field.helper}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="min-h-14 flex-1 text-base"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Launching checkout...
              </>
            ) : (
              <>
                {venue.priceCents === 0 ? "Generate my song" : "Pay and generate my song"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Link
            href="/sign-in"
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-[color:var(--color-line)] px-5 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:bg-white/80"
          >
            Venue/Admin sign in
          </Link>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:w-[28rem]">
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(160deg,rgba(33,15,67,0.96),rgba(255,107,53,0.92))] p-6 text-white shadow-[0_28px_80px_rgba(33,15,67,0.32)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
                Prompt Preview
              </p>
              <h2 className="mt-2 text-2xl font-black">How the AI hears your table</h2>
            </div>
            <div className="rounded-full bg-white/12 p-3">
              <Music4 className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] bg-white/10 p-4 backdrop-blur">
            <p className="text-sm leading-7 text-white/90">{preview.naturalPrompt}</p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[1.4rem] bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                FineTune tags
              </p>
              <p className="mt-3 text-sm leading-6 text-white/90">{preview.tags}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Duration
                </p>
                <p className="mt-2 text-lg font-bold">{form.duration}s</p>
              </div>
              <div className="rounded-[1.4rem] bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Queue rule
                </p>
                <p className="mt-2 text-lg font-bold">Max 10 live generations</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-white/15 bg-black/10 p-4">
            <p className="text-sm leading-6 text-white/80">
              Powered by Finetuning.ai direct params:
              <span className="ml-2 font-semibold">
                {capabilities.docs.supportedDirectParameters.join(", ")}
              </span>
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

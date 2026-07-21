"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const MEMORY_SNIPPETS = [
  "Vegas trip. Pool party. Chaos.",
  "Rooftop drinks. Lost phones. Great night.",
  "Birthday crew. Loud laughs. Zero regrets.",
];

const WAVE_BARS = [20, 42, 28, 52, 34, 46, 24, 40, 30, 48, 26, 38];

export function MemoryExplainer() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % MEMORY_SNIPPETS.length);
    }, 2600);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[14.5rem] overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(17,18,29,0.94),rgba(26,18,43,0.94))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] xl:max-w-[15.5rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(248,72,167,0.2),transparent_24%),radial-gradient(circle_at_80%_25%,rgba(136,88,255,0.26),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute -left-8 top-10 h-32 w-24 rotate-[-8deg] rounded-[1.6rem] bg-white/8 blur-[2px]" />
      <div className="pointer-events-none absolute left-24 top-16 h-40 w-28 rotate-[10deg] rounded-[1.8rem] bg-pink-300/10 blur-[2px]" />
      <div className="pointer-events-none absolute right-10 top-8 h-36 w-24 rotate-[7deg] rounded-[1.8rem] bg-violet-300/10 blur-[2px]" />

      <div className="relative space-y-4">
        <div className="relative h-[12rem] rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-md xl:h-[12.8rem]">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-pink-200/80">
            Describe your moment
          </p>
          <div className="relative mt-3 h-[7.8rem] xl:h-[8.6rem]">
            {MEMORY_SNIPPETS.map((snippet, snippetIndex) => (
              <p
                key={snippet}
                className={cn(
                  "absolute inset-0 text-base font-semibold leading-7 text-white transition-opacity duration-500 xl:text-[1.65rem] xl:leading-[1.45]",
                  snippetIndex === index ? "opacity-100" : "opacity-0",
                )}
              >
                {snippet}
              </p>
            ))}
          </div>
        </div>

        <div className="flex h-[5.8rem] items-end gap-1.5 rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-md">
          {WAVE_BARS.map((height, barIndex) => (
            <span
              key={`${height}-${barIndex}`}
              className={cn(
                "block w-2 rounded-full bg-[linear-gradient(180deg,rgba(255,110,188,0.98),rgba(122,92,255,0.98))] shadow-[0_0_18px_rgba(245,92,181,0.34)]",
                "animate-[pulse_2.6s_ease-in-out_infinite]",
              )}
              style={{
                height: `${height + ((index + barIndex) % 3) * 10}px`,
                animationDelay: `${barIndex * 90}ms`,
              }}
            />
          ))}
        </div>

        <div className="rounded-[1.7rem] border border-white/12 bg-[linear-gradient(180deg,rgba(13,17,31,0.86),rgba(26,16,44,0.92))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.32)] xl:min-h-[12rem]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Play preview"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff4fa3,#8d66ff)] text-white shadow-[0_0_22px_rgba(255,79,163,0.35)]"
            >
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Vegas Trip 2026</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Original song generated from your moment
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: 24 }).map((_, waveIndex) => (
              <span
                key={waveIndex}
                className="block flex-1 rounded-full bg-white/14 animate-[pulse_2.1s_ease-in-out_infinite]"
                style={{
                  height: `${10 + ((waveIndex + index) % 5) * 5}px`,
                  animationDelay: `${waveIndex * 70}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

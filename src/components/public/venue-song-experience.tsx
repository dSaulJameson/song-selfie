"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { getFineTuneCapabilities } from "@/lib/finetune-capabilities";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SongBuilder } from "@/src/components/public/song-builder";

type VenueSongExperienceProps = {
  venue: {
    id: string;
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
  recentSongs: Array<{
    id: string;
    status: string;
    generatedPrompt: string | null;
    completedAt: string | null;
    updatedAt: string;
    songUrl: string | null;
    rawInputs?: {
      names?: string;
    } | null;
  }>;
  mode?: "venue" | "paid-home" | "free-testing";
};

function buildSongCardLabel(names?: string | null) {
  if (!names?.trim()) {
    return "Your custom song";
  }

  const cleaned = names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .join(", ");

  if (!cleaned) {
    return "Your custom song";
  }

  const shortened = cleaned.length > 42 ? `${cleaned.slice(0, 39)}...` : cleaned;
  return `Song about ${shortened}`;
}

export function VenueSongExperience({
  venue,
  venueOptions,
  showVenueSelector,
  recentSongs,
  mode = "venue",
}: VenueSongExperienceProps) {
  const capabilities = getFineTuneCapabilities();
  const isFreeTesting = mode === "free-testing";
  const useCompactRows = mode !== "venue";
  const [songsOpen, setSongsOpen] = useState(false);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <SongBuilder
        venue={{
          name: venue.name,
          slug: venue.slug,
          description: venue.description,
          priceCents: venue.priceCents,
          allowExplicitContent: venue.allowExplicitContent,
          allowKidsMode: venue.allowKidsMode,
        }}
        venueOptions={venueOptions}
        showVenueSelector={showVenueSelector}
        capabilities={capabilities}
        mode={mode}
      />

      <section className="rounded-[1rem] border border-white/10 bg-white/5">
        <button
          type="button"
          onClick={() => setSongsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div>
            <p className="text-xl font-black tracking-tight text-white">Songs</p>
            <p className="mt-1 text-sm text-white/55">
              {isFreeTesting
                ? "Open the latest free testing songs."
                : "Open the latest songs people made here."}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-white/55 transition",
              songsOpen ? "rotate-180" : "",
            )}
          />
        </button>

        {songsOpen ? (
          <div className="border-t border-white/10 px-4 py-4">
            {recentSongs.length === 0 ? (
              <p className="text-sm leading-6 text-white/58">
                {useCompactRows
                  ? "No songs have been generated here yet."
                  : "This room is ready for its first custom track."}
              </p>
            ) : (
              <div
                className={
                  useCompactRows
                    ? "space-y-3"
                    : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                }
              >
                {recentSongs.map((song) =>
                  useCompactRows ? (
                    <article
                      key={song.id}
                      className="flex flex-col gap-3 rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {buildSongCardLabel(song.rawInputs?.names)}
                        </p>
                        <p className="mt-1 text-xs text-white/48">
                          {formatDate(song.completedAt ?? song.updatedAt)}
                        </p>
                      </div>
                      {song.songUrl ? (
                        <a
                          href={song.songUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 text-sm font-semibold text-pink-200"
                        >
                          Play song
                        </a>
                      ) : null}
                    </article>
                  ) : (
                    <article
                      key={song.id}
                      className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-200/78">
                        {song.status}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-white">
                        {buildSongCardLabel(song.rawInputs?.names)}
                      </p>
                      <p className="mt-4 text-xs text-white/48">
                        {formatDate(song.completedAt ?? song.updatedAt)}
                      </p>
                      {song.songUrl ? (
                        <a
                          href={song.songUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-semibold text-pink-200"
                        >
                          Play song
                        </a>
                      ) : null}
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

"use client";

import { Radio, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Ticket500Song = {
  id: string;
  songUrl: string;
  completedAt: string;
};

type Ticket500DemoProps = {
  songs: Ticket500Song[];
  windowStart: string;
  windowEnd: string;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

function formatPacific(value: string) {
  return `${formatter.format(new Date(value))} PT`;
}

export function Ticket500Demo({
  songs,
  windowStart,
  windowEnd,
}: Ticket500DemoProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [windowIsOpen, setWindowIsOpen] = useState(false);

  useEffect(() => {
    const updateWindowStatus = () => {
      setWindowIsOpen(Date.now() < new Date(windowEnd).getTime());
    };

    updateWindowStatus();
    const interval = window.setInterval(updateWindowStatus, 60_000);
    return () => window.clearInterval(interval);
  }, [windowEnd]);

  useEffect(() => {
    if (!windowIsOpen) return;

    const interval = window.setInterval(() => {
      setRefreshing(true);
      router.refresh();
      window.setTimeout(() => setRefreshing(false), 900);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [router, windowIsOpen]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(255,79,163,0.22),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(141,102,255,0.2),transparent_30%),linear-gradient(180deg,#07070b_0%,#0d0914_55%,#07070b_100%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-9">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-pink-100">
                <Radio className="h-3.5 w-3.5" />
                Unlisted demo room
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                Song Selfie presents
              </p>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.055em] sm:text-7xl">
                Ticket 500
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/62 sm:text-lg">
                A continuously updated listening room containing every completed
                track in the demo window—without customer emails, venue records,
                prompts, or order details.
              </p>
            </div>

            <div className="shrink-0 rounded-[1.4rem] border border-white/10 bg-black/20 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <span className="relative flex h-2.5 w-2.5">
                  {windowIsOpen ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                  ) : null}
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </span>
                {windowIsOpen ? "Auto-updating" : "Demo window complete"}
              </div>
              <p className="mt-2 text-xs leading-5 text-white/45">
                {formatPacific(windowStart)}
                <br />
                through {formatPacific(windowEnd)}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200/70">
                Listening queue
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {songs.length} {songs.length === 1 ? "track" : "tracks"}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/45">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Checks every 30 seconds
            </div>
          </div>

          {songs.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/15 px-6 py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-pink-200" />
              <p className="mt-4 text-lg font-bold">Waiting for the first track</p>
              <p className="mt-2 text-sm text-white/48">
                New completed songs will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {songs.map((song, index) => (
                <article
                  key={song.id}
                  className="grid gap-4 rounded-[1.45rem] border border-white/10 bg-black/20 p-4 transition hover:border-pink-200/25 hover:bg-white/[0.06] sm:grid-cols-[minmax(0,1fr)_minmax(18rem,1.6fr)] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff4fa3,#8d66ff)] text-xs font-black shadow-[0_0_30px_rgba(255,79,163,0.25)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">Ticket 500 track</p>
                        <p className="mt-0.5 text-xs text-white/42">
                          Completed {formatPacific(song.completedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <audio
                    controls
                    controlsList="nodownload"
                    preload="none"
                    src={song.songUrl}
                    className="h-10 w-full accent-pink-400"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-white/32">
          This unlisted page intentionally omits personal and transaction details.
          Share only with people attending the Ticket 500 demo.
        </p>
      </div>
    </main>
  );
}

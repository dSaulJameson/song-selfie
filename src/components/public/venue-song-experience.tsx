import { getFineTuneCapabilities } from "@/lib/finetune-capabilities";
import { formatDate } from "@/lib/utils";
import { SongBuilder } from "@/src/components/public/song-builder";

type VenueSongExperienceProps = {
  venue: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priceCents: number;
  };
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
  recentSongs,
  mode = "venue",
}: VenueSongExperienceProps) {
  const capabilities = getFineTuneCapabilities();
  const isPaidHome = mode === "paid-home";
  const isFreeTesting = mode === "free-testing";
  const useCompactRows = mode !== "venue";

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      {isPaidHome ? (
        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,21,49,0.94),rgba(18,14,31,0.96))] p-6 shadow-[0_28px_80px_rgba(11,8,25,0.3)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">
              Paid checkout is live
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Songs are normally $10. They&apos;re $1 while we test the live launch.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
              Fill out the song details, complete secure Stripe checkout, and Song Selfie
              starts generation only after payment is confirmed.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              "Secure Stripe checkout before generation",
              "Custom songs for tables, birthdays, and bar nights",
              "Fast email delivery as soon as the file is ready",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.6rem] border border-[color:var(--color-line)] bg-white/92 px-5 py-4 shadow-[0_18px_44px_rgba(22,12,46,0.08)]"
              >
                <p className="text-sm font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isFreeTesting ? (
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,21,49,0.94),rgba(18,14,31,0.96))] p-6 shadow-[0_28px_80px_rgba(11,8,25,0.3)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
            Internal testing route
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Free testing is unlocked here so we can QA the full flow.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
            Use this page to test lyrics, delivery, genre quality, and generation results
            without running the live paid checkout.
          </p>
        </section>
      ) : null}

      <SongBuilder
        venue={{
          name: venue.name,
          slug: venue.slug,
          description: venue.description,
          priceCents: venue.priceCents,
        }}
        capabilities={capabilities}
        mode={mode}
      />

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,21,49,0.94),rgba(18,14,31,0.96))] p-6 shadow-[0_28px_80px_rgba(11,8,25,0.3)]">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/95 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
            {useCompactRows ? "Recent songs" : "Recent drops"}
          </p>
          <h2 className="mt-3 text-2xl font-black">
            {isPaidHome
              ? "Songs created in the live checkout"
              : isFreeTesting
                ? "Latest free testing songs"
                : "Freshly generated for this venue"}
          </h2>
          {recentSongs.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              {useCompactRows
                ? "No songs have been generated here yet."
                : "This room is ready for its first custom track."}
            </p>
          ) : (
            <div className={useCompactRows ? "mt-5 space-y-3" : "mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"}>
              {recentSongs.map((song) =>
                useCompactRows ? (
                  <article
                    key={song.id}
                    className="flex flex-col gap-3 rounded-[1.3rem] border border-[color:var(--color-line)] bg-[color:var(--color-card)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--color-foreground)]">
                        {buildSongCardLabel(song.rawInputs?.names)}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                        {formatDate(song.completedAt ?? song.updatedAt)}
                      </p>
                    </div>
                    {song.songUrl ? (
                      <a
                        href={song.songUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 text-sm font-semibold text-[color:var(--color-accent)]"
                      >
                        Play song
                      </a>
                    ) : null}
                  </article>
                ) : (
                  <article
                    key={song.id}
                    className="rounded-[1.5rem] border border-[color:var(--color-line)] bg-[color:var(--color-card)] p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                      {song.status}
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[color:var(--color-foreground)]">
                      {buildSongCardLabel(song.rawInputs?.names)}
                    </p>
                    <p className="mt-4 text-xs text-[color:var(--color-muted-foreground)]">
                      {formatDate(song.completedAt ?? song.updatedAt)}
                    </p>
                    {song.songUrl ? (
                      <a
                        href={song.songUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex text-sm font-semibold text-[color:var(--color-accent)]"
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
      </section>
    </main>
  );
}

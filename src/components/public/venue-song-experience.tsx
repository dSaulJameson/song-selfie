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
  }>;
};

export function VenueSongExperience({
  venue,
  recentSongs,
}: VenueSongExperienceProps) {
  const capabilities = getFineTuneCapabilities();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <SongBuilder
        venue={{
          name: venue.name,
          slug: venue.slug,
          description: venue.description,
          priceCents: venue.priceCents,
        }}
        capabilities={capabilities}
      />

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,21,49,0.94),rgba(18,14,31,0.96))] p-6 shadow-[0_28px_80px_rgba(11,8,25,0.3)]">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/95 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
            Recent drops
          </p>
          <h2 className="mt-3 text-2xl font-black">Freshly generated for this venue</h2>
          {recentSongs.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              This room is ready for its first custom track.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recentSongs.map((song) => (
                <article
                  key={song.id}
                  className="rounded-[1.5rem] border border-[color:var(--color-line)] bg-[color:var(--color-card)] p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                    {song.status}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                    {song.generatedPrompt ?? "Custom AI song"}
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
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

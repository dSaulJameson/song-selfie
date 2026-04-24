import { notFound } from "next/navigation";

import { getVenueBySlug, listRecentCompletedOrdersForVenue } from "@/lib/db";
import { getFineTuneCapabilities } from "@/lib/finetune-capabilities";
import { formatDate } from "@/lib/utils";
import { SongBuilder } from "@/src/components/public/song-builder";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function VenueSongPage({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  const recentSongs = await listRecentCompletedOrdersForVenue(venue.id, 4);
  const capabilities = getFineTuneCapabilities();

  return (
    <main className="pb-8">
      <SongBuilder
        venue={{
          name: venue.name,
          slug: venue.slug,
          description: venue.description,
          priceCents: venue.priceCents,
        }}
        capabilities={capabilities}
      />

      <section className="mx-auto mt-2 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/82 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
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

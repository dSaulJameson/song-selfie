import { notFound } from "next/navigation";

import { getVenueBySlug, listAllVenues, listRecentCompletedOrdersForVenue } from "@/lib/db";
import { ensureSystemVenues, SYSTEM_VENUE_SLUGS } from "@/lib/system-venues";
import { VenueSongExperience } from "@/src/components/public/venue-song-experience";

type Props = {
  searchParams: Promise<{ venue?: string | string[] }>;
};

export default async function GeneratePage({ searchParams }: Props) {
  await ensureSystemVenues();

  const query = await searchParams;
  const requestedVenue = Array.isArray(query.venue) ? query.venue[0] : query.venue;
  const venues = await listAllVenues();
  const fallbackVenue =
    venues.find((venue) => venue.slug === SYSTEM_VENUE_SLUGS.defaultGeneration) ?? venues[0];
  const selectedVenue =
    (requestedVenue ? await getVenueBySlug(requestedVenue) : null) ?? fallbackVenue;

  if (!selectedVenue) {
    notFound();
  }

  const recentSongs = selectedVenue
    ? await listRecentCompletedOrdersForVenue(selectedVenue.id, 4)
    : [];

  return (
    <VenueSongExperience
      venue={selectedVenue}
      venueOptions={venues.map((venue) => ({
        name: venue.name,
        slug: venue.slug,
        priceCents: venue.priceCents,
        allowExplicitContent: venue.allowExplicitContent,
        allowKidsMode: venue.allowKidsMode,
      }))}
      showVenueSelector
      recentSongs={recentSongs}
    />
  );
}

import { notFound } from "next/navigation";

import { getVenueBySlug, listRecentCompletedOrdersForVenue } from "@/lib/db";
import { VenueSongExperience } from "@/src/components/public/venue-song-experience";

const DEMO_VENUE_SLUG = "song-selfie-demo";

export default async function Home() {
  const venue = await getVenueBySlug(DEMO_VENUE_SLUG);

  if (!venue) {
    notFound();
  }

  const recentSongs = await listRecentCompletedOrdersForVenue(venue.id, 4);

  return <VenueSongExperience venue={venue} recentSongs={recentSongs} />;
}

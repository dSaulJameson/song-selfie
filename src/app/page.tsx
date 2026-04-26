import { listRecentCompletedOrdersForVenue } from "@/lib/db";
import { ensureStripeDemoVenue } from "@/lib/system-venues";
import { VenueSongExperience } from "@/src/components/public/venue-song-experience";

export default async function Home() {
  const venue = await ensureStripeDemoVenue();

  const recentSongs = await listRecentCompletedOrdersForVenue(venue.id, 4);

  return <VenueSongExperience venue={venue} recentSongs={recentSongs} mode="paid-home" />;
}

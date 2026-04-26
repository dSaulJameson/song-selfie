import { notFound } from "next/navigation";

import { getVenueBySlug, listRecentCompletedOrdersForVenue } from "@/lib/db";
import { VenueSongExperience } from "@/src/components/public/venue-song-experience";

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
  return <VenueSongExperience venue={venue} recentSongs={recentSongs} />;
}

import { redirect } from "next/navigation";

import { getVenuePublicPath } from "@/lib/system-venues";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function VenueSongPage({ params }: Props) {
  const { slug } = await params;
  redirect(getVenuePublicPath(slug));
}

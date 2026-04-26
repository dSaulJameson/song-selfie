import { redirect } from "next/navigation";

import { getVenueSuccessPath } from "@/lib/system-venues";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
};

export default async function LegacyVenueSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = new URLSearchParams(await searchParams);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`${getVenueSuccessPath(slug)}${suffix}`);
}

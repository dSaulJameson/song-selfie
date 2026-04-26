import { getVenuePublicPath } from "@/lib/system-venues";
import { OrderSuccessExperience } from "@/src/components/public/order-success-experience";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
};

export default async function VenueSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  return (
    <OrderSuccessExperience
      searchParams={await searchParams}
      backHref={getVenuePublicPath(slug)}
    />
  );
}

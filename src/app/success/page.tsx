import { OrderSuccessExperience } from "@/src/components/public/order-success-experience";

type Props = {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  return <OrderSuccessExperience searchParams={await searchParams} backHref="/" />;
}

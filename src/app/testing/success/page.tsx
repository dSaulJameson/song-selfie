import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrderSuccessExperience } from "@/src/components/public/order-success-experience";

import { TESTING_ACCESS_COOKIE } from "../constants";

type Props = {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
};

export default async function TestingSuccessPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get(TESTING_ACCESS_COOKIE)?.value === "granted";

  if (!hasAccess) {
    redirect("/testing");
  }

  return <OrderSuccessExperience searchParams={await searchParams} backHref="/testing" />;
}

import Link from "next/link";

import { getOrderByCheckoutSessionId, getOrderById } from "@/lib/db";
import { OrderStatusCard } from "@/src/components/public/order-status-card";

type Props = {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
};

export default async function VenueSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId, order_id: orderId } = await searchParams;
  const order = sessionId
    ? await getOrderByCheckoutSessionId(sessionId)
    : orderId
      ? await getOrderById(orderId)
      : null;
  const wasFree = (order?.amountTotal ?? 0) === 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-8 shadow-[0_20px_50px_rgba(22,12,46,0.09)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          {wasFree ? "Free test queued" : "Payment received"}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-[color:var(--color-foreground)]">
          Your song is officially in the queue.
        </h1>
        <p className="mt-4 text-base leading-7 text-[color:var(--color-muted-foreground)]">
          We are building the prompt, sending the generation job, and emailing
          the finished file once delivery is complete.
        </p>

        {order ? <OrderStatusCard initialOrder={order} /> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to home
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-5 py-3 text-sm font-semibold"
          >
            Venue/Admin sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

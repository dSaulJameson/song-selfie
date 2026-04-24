import Image from "next/image";
import QRCode from "qrcode";

import { getDashboardActor } from "@/lib/auth";
import {
  listAllVenues,
  listOrdersForVenueIds,
  listVenuesByOwner,
  updateVenuePrice,
  updateVenueStripeStatus,
} from "@/lib/db";
import { getBaseUrl } from "@/lib/env";
import { getConnectedAccountSnapshot } from "@/lib/stripe";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function VenuePage() {
  const actor = await getDashboardActor();
  const venues = actor.isAdmin
    ? await listAllVenues()
    : await listVenuesByOwner(actor.user.id);
  const baseUrl = getBaseUrl();

  const venueCards = await Promise.all(
    venues.map(async (venue) => {
      const publicUrl = `${baseUrl}/v/${venue.slug}`;
      const qrCode = await QRCode.toDataURL(publicUrl, {
        width: 220,
        margin: 1,
      });

      let stripeState = {
        chargesEnabled: venue.stripeChargesEnabled,
        payoutsEnabled: venue.stripePayoutsEnabled,
      };

      if (venue.stripeAccountId) {
        try {
          const snapshot = await getConnectedAccountSnapshot(venue.stripeAccountId);
          stripeState = {
            chargesEnabled: snapshot.chargesEnabled,
            payoutsEnabled: snapshot.payoutsEnabled,
          };

          if (
            snapshot.chargesEnabled !== venue.stripeChargesEnabled ||
            snapshot.payoutsEnabled !== venue.stripePayoutsEnabled
          ) {
            await updateVenueStripeStatus({
              venueId: venue.id,
              chargesEnabled: snapshot.chargesEnabled,
              payoutsEnabled: snapshot.payoutsEnabled,
            });
          }
        } catch {
          // Keep the stored Stripe state if retrieval fails.
        }
      }

      return {
        ...venue,
        qrCode,
        publicUrl,
        stripeState,
      };
    }),
  );

  const orders = await listOrdersForVenueIds(venues.map((venue) => venue.id));
  const totalRevenue = orders.reduce((sum, order) => sum + (order.amountTotal ?? 0), 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          Venue dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[color:var(--color-foreground)]">
              Run the room, track the tracks
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              Signed in as {actor.user.primaryEmailAddress?.emailAddress}. Your QR
              pages, payouts, and song revenue all live here.
            </p>
            {actor.isAdmin ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                Admin venue-mode is active for testing.
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                Venues
              </p>
              <p className="mt-2 text-2xl font-black">{venues.length}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                Orders
              </p>
              <p className="mt-2 text-2xl font-black">{orders.length}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-black">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {venueCards.length === 0 ? (
          <div className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
            <p className="text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              No venues are assigned to this Clerk user yet. An admin can create
              a venue and point it at your Clerk user ID from the admin dashboard.
            </p>
          </div>
        ) : (
          venueCards.map((venue) => (
            <article
              key={venue.id}
              className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                    {venue.slug}
                  </p>
                  <h2 className="text-3xl font-black">{venue.name}</h2>
                  <p className="text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                    {venue.description || "No description added yet."}
                  </p>
                  <a
                    href={venue.publicUrl}
                    className="font-mono text-xs text-[color:var(--color-accent)]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {venue.publicUrl}
                  </a>
                </div>
                <Image
                  src={venue.qrCode}
                  alt={`QR code for ${venue.name}`}
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-[1.5rem] border border-[color:var(--color-line)] bg-white p-3"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                    Price
                  </p>
                  <p className="mt-2 text-xl font-black">{formatCurrency(venue.priceCents)}</p>
                </div>
                <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                    Venue share
                  </p>
                  <p className="mt-2 text-xl font-black">{venue.venueSharePercent}%</p>
                </div>
                <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                    Stripe
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {venue.stripeState.chargesEnabled && venue.stripeState.payoutsEnabled
                      ? "Ready for payouts"
                      : "Needs onboarding"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`/api/venues/connect?venueId=${venue.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
                >
                  {venue.stripeAccountId ? "Manage Stripe Connect" : "Connect Stripe"}
                </a>
                <a
                  href={venue.publicUrl}
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-5 py-3 text-sm font-semibold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open public song page
                </a>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  const priceCents = Number(formData.get("priceCents"));
                  if (Number.isFinite(priceCents) && priceCents >= 0) {
                    await updateVenuePrice(venue.id, priceCents);
                  }
                }}
                className="mt-5 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white/70 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                  Live pricing
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    name="priceCents"
                    defaultValue={venue.priceCents}
                    className="h-11 rounded-full border border-[color:var(--color-line)] px-4"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                  >
                    Update price
                  </button>
                  <span className="text-xs text-[color:var(--color-muted-foreground)]">
                    Set to `0` for free test generations.
                  </span>
                </div>
              </form>
            </article>
          ))
        )}
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          Songs
        </p>
        <h2 className="mt-3 text-2xl font-black">Order and generation history</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[color:var(--color-muted-foreground)]">
              <tr>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Guest</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Prompt</th>
                <th className="pb-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[color:var(--color-line)] align-top">
                  <td className="py-3 pr-4 font-semibold capitalize">{order.status}</td>
                  <td className="py-3 pr-4">{order.customerEmail}</td>
                  <td className="py-3 pr-4">
                    {formatCurrency(order.amountTotal, order.currency ?? "usd")}
                  </td>
                  <td className="max-w-md py-3 pr-4 text-[color:var(--color-muted-foreground)]">
                    {order.generatedPrompt ?? "Waiting for payment or generation"}
                  </td>
                  <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { requireAdminUser } from "@/lib/auth";
import { listAllOrders, listAllVenues } from "@/lib/db";
import { getBaseUrl } from "@/lib/env";
import { ensureSystemVenues } from "@/lib/system-venues";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createVenueAction,
  updateVenuePricingAction,
  updateVenueShareAction,
} from "@/src/app/admin/actions";

export default async function AdminPage() {
  const user = await requireAdminUser();
  await ensureSystemVenues();
  const venues = await listAllVenues();
  const orders = await listAllOrders(50);
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.amountTotal ?? 0),
    0,
  );
  const baseUrl = getBaseUrl();
  const venueCards = await Promise.all(
    venues.map(async (venue) => {
      const publicUrl =
        venue.slug === "song-selfie-demo" ? `${baseUrl}/` : `${baseUrl}/v/${venue.slug}`;
      const qrCode = await QRCode.toDataURL(publicUrl, {
        width: 180,
        margin: 1,
      });

      return {
        ...venue,
        publicUrl,
        qrCode,
      };
    }),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          Admin dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[color:var(--color-foreground)]">
              Venue network control
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              Signed in as {user.primaryEmailAddress?.emailAddress}.
            </p>
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
                Gross
              </p>
              <p className="mt-2 text-2xl font-black">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          action={createVenueAction}
          className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]"
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
            New venue
          </p>
          <h2 className="mt-3 text-2xl font-black">Create a scannable location</h2>
          <div className="mt-5 grid gap-4">
            {[
              ["name", "Venue name", "Neon Disco Lounge"],
              ["slug", "Public slug", "neon-disco-lounge"],
              [
                "description",
                "Description",
                "Late-night room with birthday tables and bottle service",
              ],
              [
                "contactEmail",
                "Invited venue email",
                "venue-owner@example.com",
              ],
              ["priceCents", "Song price (cents)", "0"],
              ["venueSharePercent", "Venue share %", "70"],
            ].map(([name, label, placeholder]) => (
              <label key={name} className="grid gap-2 text-sm">
                <span className="font-semibold text-[color:var(--color-foreground)]">
                  {label}
                </span>
                {name === "description" ? (
                  <textarea
                    name={name}
                    rows={4}
                    placeholder={placeholder}
                    className="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-4 py-3"
                    defaultValue=""
                  />
                ) : (
                  <input
                    name={name}
                    placeholder={placeholder}
                    defaultValue={
                      name === "venueSharePercent"
                        ? "70"
                        : typeof placeholder === "string"
                          ? placeholder
                          : undefined
                    }
                    className="h-12 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-4"
                    required
                  />
                )}
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
            The invited venue email becomes the dashboard access key. Once that person logs in
            at <span className="font-mono text-xs">{baseUrl}/login</span>, they&apos;ll be
            routed into their venue dashboard automatically.
          </p>
          <button
            type="submit"
            className="mt-5 inline-flex rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
          >
            Create venue
          </button>
        </form>

        <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                Venues
              </p>
              <h2 className="mt-3 text-2xl font-black">Revenue splits and links</h2>
            </div>
            <Link href="/stripe-demo" className="text-sm font-semibold text-[color:var(--color-accent)]">
              Open Stripe demo
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {venueCards.length === 0 ? (
              <p className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-5 text-sm text-[color:var(--color-muted-foreground)]">
                No venues yet. Create your first venue to generate QR codes and public pages.
              </p>
            ) : (
              venueCards.map((venue) => (
                <article
                  key={venue.id}
                  className="rounded-[1.5rem] border border-[color:var(--color-line)] bg-[color:var(--color-card)] p-4"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Image
                        src={venue.qrCode}
                        alt={`QR code for ${venue.name}`}
                        width={132}
                        height={132}
                        className="h-32 w-32 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white p-2"
                      />
                      <div className="space-y-2">
                        <h3 className="text-xl font-black">{venue.name}</h3>
                        <p className="text-sm text-[color:var(--color-muted-foreground)]">
                          {venue.description || "No venue description yet."}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Invited email:</span>{" "}
                          {venue.contactEmail}
                        </p>
                        <a
                          href={venue.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block font-mono text-xs text-[color:var(--color-accent)]"
                        >
                          {venue.publicUrl}
                        </a>
                        <div className="flex flex-wrap gap-3 pt-1">
                          <a
                            href={venue.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                          >
                            Open public page
                          </a>
                          <Link
                            href="/venue"
                            className="inline-flex rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                          >
                            Open venue dashboard
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 xl:min-w-[260px]">
                      <form action={updateVenuePricingAction} className="flex flex-col gap-2">
                        <input type="hidden" name="venueId" value={venue.id} />
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                          Venue price
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            name="priceCents"
                            defaultValue={venue.priceCents}
                            className="h-11 w-28 rounded-full border border-[color:var(--color-line)] px-4"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                      <form action={updateVenueShareAction} className="flex flex-col gap-2">
                        <input type="hidden" name="venueId" value={venue.id} />
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                          Venue share %
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            name="venueSharePercent"
                            defaultValue={venue.venueSharePercent}
                            className="h-11 w-24 rounded-full border border-[color:var(--color-line)] px-4"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                      <p className="text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                        Default split is 70% venue / 30% Song Selfie. If Stripe Connect is not
                        onboarded yet, all revenue lands on the platform until payouts are enabled.
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          Orders
        </p>
        <h2 className="mt-3 text-2xl font-black">Latest paid and generated songs</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[color:var(--color-muted-foreground)]">
              <tr>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3 pr-4">Song</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[color:var(--color-line)]">
                  <td className="py-3 pr-4 font-semibold capitalize">{order.status}</td>
                  <td className="py-3 pr-4">{order.customerEmail}</td>
                  <td className="py-3 pr-4">
                    {formatCurrency(order.amountTotal, order.currency ?? "usd")}
                  </td>
                  <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                  <td className="py-3 pr-4">
                    {order.songUrl ? (
                      <a
                        href={order.songUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[color:var(--color-accent)]"
                      >
                        Open track
                      </a>
                    ) : (
                      "Pending"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

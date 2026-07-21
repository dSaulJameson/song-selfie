import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { requireAdminUser } from "@/lib/auth";
import { listAllOrders, listAllVenues } from "@/lib/db";
import { getBaseUrl, getS3Config } from "@/lib/env";
import {
  ensureSystemVenues,
  getVenueGeneratePath,
  getVenuePublicPath,
  isSystemVenueSlug,
} from "@/lib/system-venues";
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
  const totalRevenue = orders.reduce((sum, order) => sum + (order.amountTotal ?? 0), 0);
  const completedSongs = orders.filter((order) => order.status === "completed" && order.songUrl);
  const baseUrl = getBaseUrl();
  const hasS3Bucket = Boolean(getS3Config().bucket);

  const venueCards = await Promise.all(
    venues.map(async (venue) => {
      const publicUrl = `${baseUrl}${getVenuePublicPath(venue.slug)}`;
      const generateUrl = `${baseUrl}${getVenueGeneratePath(venue.slug)}`;
      const qrCode = await QRCode.toDataURL(generateUrl, {
        width: 180,
        margin: 1,
      });

      return {
        ...venue,
        generateUrl,
        publicUrl,
        qrCode,
        isSystemVenue: isSystemVenueSlug(venue.slug),
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
              Song Selfie venue control
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              Signed in as {user.primaryEmailAddress?.emailAddress}. Create venue pages,
              send invite emails, and manage live pricing and splits.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
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
                Songs
              </p>
              <p className="mt-2 text-2xl font-black">{completedSongs.length}</p>
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

      {!hasS3Bucket ? (
        <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50/90 p-5 shadow-[0_12px_30px_rgba(120,53,15,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
            Storage setup needed
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            S3 bucket settings are not configured yet, so completed songs may still fall back
            to provider-hosted audio links. Once you add the bucket, Song Selfie can white-label
            every playback link.
          </p>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          action={createVenueAction}
          className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]"
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
            Invite venue
          </p>
          <h2 className="mt-3 text-2xl font-black">Launch a new venue page</h2>
          <div className="mt-5 grid gap-4">
            {[
              ["name", "Venue name", "Enzo's Barbecue"],
              ["slug", "Venue page path", "enzos-barbecue"],
              [
                "description",
                "Description",
                "House-smoked barbecue, birthdays, and group tables all night",
              ],
              ["contactEmail", "Venue email", "hello@enzosbarbecue.com"],
              ["priceCents", "Starting song price (cents)", "100"],
              ["venueSharePercent", "Venue revenue share %", "70"],
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
                    defaultValue={typeof placeholder === "string" ? placeholder : undefined}
                    type={
                      name === "priceCents" || name === "venueSharePercent" ? "number" : "text"
                    }
                    min={name === "priceCents" ? 100 : name === "venueSharePercent" ? 0 : undefined}
                    max={name === "venueSharePercent" ? 100 : undefined}
                    className="h-12 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-4"
                    required
                  />
                )}
              </label>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-4 py-3 text-sm">
                <div>
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    Allow NSFW songs
                  </span>
                  <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                    Show the dirty toggle on the public page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="allowExplicitContent"
                  defaultChecked
                  className="mt-1 h-5 w-5 rounded border-[color:var(--color-line)]"
                />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-4 py-3 text-sm">
                <div>
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    Forced kids mode
                  </span>
                  <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                    Force every song for this venue to stay clean and family-friendly.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="allowKidsMode"
                  className="mt-1 h-5 w-5 rounded border-[color:var(--color-line)]"
                />
              </label>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[color:var(--color-muted-foreground)]">
            Example: <span className="font-mono">songselfie.com/enzos-barbecue</span>. Real
            venue pages should start at a minimum of $1.00 per song.
          </p>
          <div className="mt-4 rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-4">
            <p className="text-sm font-semibold text-[color:var(--color-foreground)]">
              Invite flow
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              We&apos;ll create the public page, reserve the slug, and send the venue an email
              with their guest URL and dashboard login at{" "}
              <span className="font-mono text-xs">{baseUrl}/login</span>.
            </p>
          </div>
          <button
            type="submit"
            className="mt-5 inline-flex rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
          >
            Create venue and send invite
          </button>
        </form>

        <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                Venue pages
              </p>
              <h2 className="mt-3 text-2xl font-black">Links, QR codes, and pricing</h2>
            </div>
            <Link href="/generate" className="text-sm font-semibold text-[color:var(--color-accent)]">
              Open generation page
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {venueCards.map((venue) => (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black">{venue.name}</h3>
                        {venue.isSystemVenue ? (
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                            Song Selfie page
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-[color:var(--color-muted-foreground)]">
                        {venue.description || "No venue description yet."}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Venue email:</span> {venue.contactEmail}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Page slug:</span> {venue.slug}
                      </p>
                      <a
                        href={venue.generateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block font-mono text-xs text-[color:var(--color-accent)]"
                      >
                        {venue.generateUrl}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:min-w-[280px]">
                    <form action={updateVenuePricingAction} className="flex flex-col gap-2">
                      <input type="hidden" name="venueId" value={venue.id} />
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                        Admin price override
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          name="priceCents"
                          type="number"
                          min={venue.isSystemVenue ? 0 : 100}
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
                      Real venues should usually start at $1.00 minimum. Stripe Connect splits
                      default to 70% venue / 30% Song Selfie.
                    </p>
                  </div>
                </div>
              </article>
            ))}
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

import Image from "next/image";
import QRCode from "qrcode";

import { getDashboardActor } from "@/lib/auth";
import {
  type SongOrderRecord,
  listAllVenues,
  listOrdersForVenueIds,
  listVenuesByContactEmail,
  updateVenueStripeStatus,
} from "@/lib/db";
import { getBaseUrl, getS3Config } from "@/lib/env";
import { getConnectedAccountSnapshot } from "@/lib/stripe";
import {
  getVenuePublicPath,
  isSystemVenueSlug,
} from "@/lib/system-venues";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  forwardVenueSongEmailAction,
  updateVenueDashboardPricingAction,
} from "@/src/app/venue/actions";

function formatChoiceLabel(value: string) {
  if (value === "hip-hop") {
    return "Hip-hop";
  }

  if (value === "r-and-b") {
    return "R&B";
  }

  if (value === "lo-fi") {
    return "Lo-fi";
  }

  if (value === "edm") {
    return "EDM";
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSongTitle(order: SongOrderRecord) {
  const names = order.rawInputs?.names?.trim();
  if (names) {
    return `Song about ${names}`;
  }

  return "Custom venue song";
}

function buildSongTags(order: SongOrderRecord) {
  const tags = [
    order.rawInputs?.songType ? formatChoiceLabel(order.rawInputs.songType) : null,
    order.rawInputs?.mood ? formatChoiceLabel(order.rawInputs.mood) : null,
    typeof order.rawInputs?.energy === "number" ? `Energy ${order.rawInputs.energy}` : null,
  ].filter(Boolean) as string[];

  return tags.slice(0, 3);
}

export default async function VenuePage() {
  const actor = await getDashboardActor();
  const venues = actor.isAdmin
    ? await listAllVenues()
    : await listVenuesByContactEmail(actor.email);
  const baseUrl = getBaseUrl();
  const hasS3Bucket = Boolean(getS3Config().bucket);

  const venueCards = await Promise.all(
    venues.map(async (venue) => {
      const publicUrl = `${baseUrl}${getVenuePublicPath(venue.slug)}`;
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
        isSystemVenue: isSystemVenueSlug(venue.slug),
      };
    }),
  );

  const orders = await listOrdersForVenueIds(venues.map((venue) => venue.id));
  const totalRevenue = orders.reduce((sum, order) => sum + (order.amountTotal ?? 0), 0);
  const completedSongs = orders.filter((order) => order.status === "completed" && order.songUrl);
  const songsByVenueId = new Map<string, SongOrderRecord[]>();

  for (const order of completedSongs) {
    const existing = songsByVenueId.get(order.venueId) ?? [];
    existing.push(order);
    songsByVenueId.set(order.venueId, existing);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          Venue dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[color:var(--color-foreground)]">
              Run your Song Selfie page
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              Signed in as {actor.user.primaryEmailAddress?.emailAddress}. Manage
              pricing, QR access, Stripe payouts, and the songs your guests have made.
            </p>
            {actor.isAdmin ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                Admin venue-mode is active for testing.
              </p>
            ) : null}
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
                Songs
              </p>
              <p className="mt-2 text-2xl font-black">{completedSongs.length}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-black">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                Storage
              </p>
              <p className="mt-2 text-sm font-bold">
                {hasS3Bucket ? "S3 bucket ready" : "Provider fallback"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!hasS3Bucket ? (
        <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50/90 p-5 shadow-[0_12px_30px_rgba(120,53,15,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
            S3 still needed
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Songs are still allowed to complete, but without an S3 bucket they can fall back to
            provider-hosted audio URLs. Add your bucket settings and Song Selfie can serve its own
            playback links.
          </p>
        </section>
      ) : null}

      <section className="space-y-6">
        {venueCards.length === 0 ? (
          <div className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
            <p className="text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              This signed-in email has not been invited to a venue dashboard yet.
              An admin can add your email from the admin dashboard to unlock venue access.
            </p>
          </div>
        ) : (
          venueCards.map((venue) => {
            const songs = songsByVenueId.get(venue.id) ?? [];

            return (
              <article
                key={venue.id}
                className="rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-6 shadow-[0_18px_44px_rgba(22,12,46,0.08)]"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex flex-col gap-5 lg:flex-row">
                    <Image
                      src={venue.qrCode}
                      alt={`QR code for ${venue.name}`}
                      width={168}
                      height={168}
                      className="h-40 w-40 rounded-[1.6rem] border border-[color:var(--color-line)] bg-white p-3"
                    />
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                          {venue.slug}
                        </p>
                        {venue.isSystemVenue ? (
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                            System demo
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-3xl font-black">{venue.name}</h2>
                      <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                        {venue.description || "No description added yet."}
                      </p>
                      <div className="grid gap-2 text-sm text-[color:var(--color-muted-foreground)]">
                        <p>
                          <span className="font-semibold text-[color:var(--color-foreground)]">
                            Venue email:
                          </span>{" "}
                          {venue.contactEmail}
                        </p>
                        <p>
                          <span className="font-semibold text-[color:var(--color-foreground)]">
                            Public page:
                          </span>{" "}
                          <a
                            href={venue.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-[color:var(--color-accent)]"
                          >
                            {venue.publicUrl}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:w-[360px]">
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
                    Open public venue page
                  </a>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-[color:var(--color-line)] bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                    Live pricing
                  </p>
                  {venue.isSystemVenue ? (
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                      System demo venues keep their own fixed pricing. Real venue pages should
                      start at a minimum of $1.00 per song.
                    </p>
                  ) : (
                    <form
                      action={updateVenueDashboardPricingAction}
                      className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input
                        name="priceCents"
                        type="number"
                        min={100}
                        step={25}
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
                        Minimum venue price is $1.00.
                      </span>
                    </form>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                        Songs played here
                      </p>
                      <h3 className="mt-2 text-xl font-black">One-line song library</h3>
                    </div>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">
                      Forward any finished song if a guest misses the email.
                    </p>
                  </div>

                  {songs.length === 0 ? (
                    <div className="rounded-[1.4rem] bg-[color:var(--color-surface)] px-4 py-5 text-sm text-[color:var(--color-muted-foreground)]">
                      No completed songs for this venue yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {songs.slice(0, 12).map((order) => {
                        const tags = buildSongTags(order);

                        return (
                          <div
                            key={order.id}
                            className="grid gap-4 rounded-[1.4rem] border border-[color:var(--color-line)] bg-[color:var(--color-card)] px-4 py-4 xl:grid-cols-[minmax(0,2.2fr)_1fr_1.5fr_auto_minmax(260px,1.7fr)] xl:items-center"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[color:var(--color-foreground)]">
                                {buildSongTitle(order)}
                              </p>
                              <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                                {formatDate(order.completedAt ?? order.createdAt)}
                              </p>
                            </div>

                            <div className="text-sm text-[color:var(--color-foreground)]">
                              {formatChoiceLabel(order.rawInputs.genre)}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "rounded-full bg-[color:var(--color-surface)] px-3 py-1 text-xs font-medium text-[color:var(--color-muted-foreground)]",
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <a
                              href={order.songUrl!}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                            >
                              Play
                            </a>

                            <form
                              action={forwardVenueSongEmailAction}
                              className="flex flex-col gap-2 sm:flex-row"
                            >
                              <input type="hidden" name="venueId" value={venue.id} />
                              <input type="hidden" name="orderId" value={order.id} />
                              <input
                                name="forwardEmail"
                                type="email"
                                placeholder="Forward to email"
                                className="h-11 flex-1 rounded-full border border-[color:var(--color-line)] px-4"
                                required
                              />
                              <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-semibold text-white"
                              >
                                Forward
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

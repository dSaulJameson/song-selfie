import Image from "next/image";
import { auth, currentUser } from "@clerk/nextjs/server";
import QRCode from "qrcode";

import { getUserEmail, isAdminEmail } from "@/lib/auth";
import {
  type VenueRecord,
  type SongOrderRecord,
  getVenueBySlug,
  listAllVenues,
  listOrdersForVenueIds,
  listVenuesByContactEmail,
  updateVenueStripeStatus,
} from "@/lib/db";
import { getBaseUrl } from "@/lib/env";
import { getConnectedAccountSnapshot } from "@/lib/stripe";
import {
  getVenueGeneratePath,
  getVenuePublicPath,
  isSystemVenueSlug,
} from "@/lib/system-venues";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  forwardVenueSongEmailAction,
  sendVenuePayoutPreferenceAction,
  updateVenueDashboardPricingAction,
} from "@/src/app/venue/actions";
import { AudienceSettingsForm } from "@/src/components/venue/audience-settings-form";
import { VenueQrActions } from "@/src/components/venue/qr-actions";

type VenuePageProps = {
  searchParams?: Promise<{
    email?: string;
    venue?: string;
    created?: string;
  }>;
};

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

function getVenueAnalytics(orders: SongOrderRecord[], venueSharePercent: number) {
  const paidOrders = orders.filter(
    (order) =>
      (order.amountTotal ?? 0) > 0 &&
      !["draft", "checkout_created", "failed"].includes(order.status),
  );
  const grossRevenue = paidOrders.reduce((sum, order) => sum + (order.amountTotal ?? 0), 0);
  const venueRevenue = Math.round((grossRevenue * venueSharePercent) / 100);
  const completedCount = orders.filter((order) => order.status === "completed").length;
  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const today = new Date();
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: dayFormatter.format(date),
      revenue: 0,
    };
  });
  const revenueByDayMap = new Map(revenueByDay.map((day) => [day.key, day]));

  for (const order of paidOrders) {
    const date = new Date(order.completedAt ?? order.updatedAt ?? order.createdAt);
    const key = date.toISOString().slice(0, 10);
    const day = revenueByDayMap.get(key);
    if (day) {
      day.revenue += order.amountTotal ?? 0;
    }
  }

  const maxDailyRevenue = Math.max(100, ...revenueByDay.map((day) => day.revenue));
  const genreCounts = new Map<string, number>();

  for (const order of orders) {
    const genre = order.rawInputs?.genre;
    if (!genre) {
      continue;
    }

    const label = formatChoiceLabel(genre);
    genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
  }

  const popularGenres = [...genreCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([genre, count]) => ({ genre, count }));

  return {
    songsSold: paidOrders.length,
    completedCount,
    grossRevenue,
    venueRevenue,
    revenueByDay,
    maxDailyRevenue,
    popularGenres,
  };
}

export default async function VenuePage({ searchParams }: VenuePageProps) {
  const query = (await searchParams) ?? {};
  const queryEmail = typeof query.email === "string" ? query.email.trim().toLowerCase() : "";
  const queryVenueSlug = typeof query.venue === "string" ? query.venue.trim() : "";
  const isClaimPreviewRequest = query.created === "1" && Boolean(queryEmail && queryVenueSlug);
  const session = await auth();
  const signedInUser = session.userId ? await currentUser() : null;
  const signedInEmail = signedInUser ? getUserEmail(signedInUser) : "";
  const actorEmail = signedInEmail || queryEmail;
  const actorIsAdmin = signedInEmail ? isAdminEmail(signedInEmail) : false;
  let pendingClaim = false;
  let venues: VenueRecord[] = [];

  if (signedInEmail) {
    if (actorIsAdmin && queryVenueSlug) {
      const venue = await getVenueBySlug(queryVenueSlug);
      venues = venue ? [venue] : [];
    } else if (actorIsAdmin) {
      venues = await listAllVenues();
    } else {
      venues = await listVenuesByContactEmail(signedInEmail);
    }
  }

  if (!signedInEmail && isClaimPreviewRequest) {
    const venue = await getVenueBySlug(queryVenueSlug);
    if (venue && venue.contactEmail.toLowerCase() === queryEmail) {
      venues = [venue];
      pendingClaim = true;
    }
  }

  const claimUrl = `/sign-up?${new URLSearchParams({
    email: actorEmail,
    venue: queryVenueSlug || venues[0]?.slug || "",
    created: "1",
  }).toString()}`;
  const baseUrl = getBaseUrl();

  const venueCards = await Promise.all(
    venues.map(async (venue) => {
      const publicUrl = `${baseUrl}${getVenuePublicPath(venue.slug)}`;
      const generateUrl = `${baseUrl}${getVenueGeneratePath(venue.slug)}`;
      const qrCode = await QRCode.toDataURL(generateUrl, {
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
        generateUrl,
        qrCode,
        publicUrl,
        stripeState,
        isSystemVenue: isSystemVenueSlug(venue.slug),
      };
    }),
  );

  const orders = await listOrdersForVenueIds(venues.map((venue) => venue.id));
  const completedSongs = orders.filter((order) => order.status === "completed" && order.songUrl);
  const songsByVenueId = new Map<string, SongOrderRecord[]>();
  const ordersByVenueId = new Map<string, SongOrderRecord[]>();

  for (const order of orders) {
    const existing = ordersByVenueId.get(order.venueId) ?? [];
    existing.push(order);
    ordersByVenueId.set(order.venueId, existing);
  }

  for (const order of completedSongs) {
    const existing = songsByVenueId.get(order.venueId) ?? [];
    existing.push(order);
    songsByVenueId.set(order.venueId, existing);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(244,63,148,0.22),transparent_34%),linear-gradient(180deg,#08040d,#16091f_48%,#2a0d2a)] px-4 py-6 text-white sm:px-6 lg:px-8">
      {pendingClaim ? (
        <section className="sticky top-3 z-20 rounded-[1.3rem] border border-pink-300/30 bg-pink-500/15 px-4 py-3 shadow-[0_16px_36px_rgba(244,63,148,0.18)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-200">
                Claim this dashboard
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                Verify {actorEmail} to unlock pricing, payout setup, audience controls,
                and forwarding.
              </p>
            </div>
            <a
              href={claimUrl}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-2.5 text-sm font-bold text-white"
            >
              Claim / verify account
            </a>
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        {venueCards.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_18px_44px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              This signed-in email has not been invited to a venue dashboard yet.
              An admin can add your email from the admin dashboard to unlock venue access.
            </p>
          </div>
        ) : (
          venueCards.map((venue) => {
            const songs = songsByVenueId.get(venue.id) ?? [];
            const venueOrders = ordersByVenueId.get(venue.id) ?? [];
            const analytics = getVenueAnalytics(venueOrders, venue.venueSharePercent);

            return (
              <article
                key={venue.id}
                className="rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl"
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
                            Song Selfie page
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
                            QR generate link:
                          </span>{" "}
                          <a
                            href={venue.generateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-[color:var(--color-accent)]"
                          >
                            {venue.generateUrl}
                          </a>
                        </p>
                        <p>
                          <span className="font-semibold text-[color:var(--color-foreground)]">
                            Venue page:
                          </span>{" "}
                          <a
                            href={venue.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-[color:var(--color-muted-foreground)]"
                          >
                            {venue.publicUrl}
                          </a>
                        </p>
                      </div>
                      <VenueQrActions
                        qrCode={venue.qrCode}
                        venueName={venue.name}
                        publicUrl={venue.generateUrl}
                      />
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
                      <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                        Song Selfie keeps {100 - venue.venueSharePercent}%.
                      </p>
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
                    <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3 sm:col-span-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
                        Audience modes
                      </p>
                      <p className="mt-2 text-sm font-bold">
                        {venue.allowKidsMode
                          ? "Forced kids mode on"
                          : venue.allowExplicitContent
                            ? "NSFW allowed"
                            : "NSFW off"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-emerald-300/25 bg-emerald-400/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                    Start in two minutes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    Print the QR code, set your song price, and leave payout setup for later.
                    Guests can start creating songs on your page right away.
                  </p>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/7 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                        Venue performance
                      </p>
                      <h3 className="mt-2 text-xl font-black">Sales and song trends</h3>
                    </div>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">
                      Revenue is based on paid songs that cleared checkout.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                        Songs sold
                      </p>
                      <p className="mt-2 text-2xl font-black">{analytics.songsSold}</p>
                    </div>
                    <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                        Completed
                      </p>
                      <p className="mt-2 text-2xl font-black">{analytics.completedCount}</p>
                    </div>
                    <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                        Gross revenue
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {formatCurrency(analytics.grossRevenue)}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] bg-[color:var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                        Venue earnings
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {formatCurrency(analytics.venueRevenue)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-[1.3rem] border border-white/10 bg-white/7 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[color:var(--color-foreground)]">
                          Last 7 days
                        </p>
                        <p className="text-xs text-[color:var(--color-muted-foreground)]">
                          Gross revenue
                        </p>
                      </div>
                      <div className="mt-4 flex h-36 items-end gap-2">
                        {analytics.revenueByDay.map((day) => (
                          <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                            <div className="flex h-24 w-full items-end rounded-full bg-[color:var(--color-surface)] px-1">
                              <div
                                className="w-full rounded-full bg-[linear-gradient(180deg,var(--color-accent),var(--color-accent-strong))]"
                                style={{
                                  height:
                                    day.revenue > 0
                                      ? `${Math.max(
                                          6,
                                          Math.round(
                                            (day.revenue / analytics.maxDailyRevenue) * 100,
                                          ),
                                        )}%`
                                      : "0%",
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-[color:var(--color-muted-foreground)]">
                              {day.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.3rem] border border-white/10 bg-white/7 p-4">
                      <p className="text-sm font-bold text-[color:var(--color-foreground)]">
                        Popular genres
                      </p>
                      <div className="mt-4 space-y-3">
                        {analytics.popularGenres.length === 0 ? (
                          <p className="text-sm text-[color:var(--color-muted-foreground)]">
                            Genre trends will appear after guests make songs.
                          </p>
                        ) : (
                          analytics.popularGenres.map((genre) => (
                            <div key={genre.genre} className="space-y-1">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-[color:var(--color-foreground)]">
                                  {genre.genre}
                                </span>
                                <span className="text-[color:var(--color-muted-foreground)]">
                                  {genre.count}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-[color:var(--color-surface)]">
                                <div
                                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-strong))]"
                                  style={{
                                    width: `${Math.max(
                                      10,
                                      Math.round(
                                        (genre.count /
                                          Math.max(
                                            1,
                                            ...analytics.popularGenres.map(
                                              (item) => item.count,
                                            ),
                                          )) *
                                          100,
                                      ),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/7 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                    Live pricing
                  </p>
                  {pendingClaim ? (
                    <div className="mt-3 flex flex-col gap-3 rounded-[1.2rem] border border-pink-300/25 bg-pink-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-white/85">
                        Claim this dashboard to edit pricing. The current price is{" "}
                        <strong>{formatCurrency(venue.priceCents)}</strong>.
                      </p>
                      <a
                        href={claimUrl}
                        className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Claim account
                      </a>
                    </div>
                  ) : venue.isSystemVenue ? (
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                      Song Selfie managed pages keep their own fixed pricing. Real venue pages should
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
                        className="h-11 rounded-full border border-white/10 bg-white/10 px-4 text-white placeholder:text-white/40"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                      >
                        Update price
                      </button>
                      <span className="text-xs text-[color:var(--color-muted-foreground)]">
                        Minimum venue price is $1.00. You keep {venue.venueSharePercent}%.
                      </span>
                    </form>
                  )}
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/7 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                    Get paid
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
                    Stripe is the fastest payout path. Bank transfer and mailed checks are collected
                    here for manual payouts, usually on a weekly to bi-weekly schedule.
                  </p>
                  {pendingClaim ? (
                    <div className="mt-4 flex flex-col gap-3 rounded-[1.2rem] border border-pink-300/25 bg-pink-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-white/85">
                        Claim this dashboard before adding payout details.
                      </p>
                      <a
                        href={claimUrl}
                        className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Claim account
                      </a>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/7 p-4">
                      <p className="text-sm font-bold text-[color:var(--color-foreground)]">
                        Stripe Connect
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                        Fastest automated payout path. Stripe collects bank details securely and
                        payouts can be almost instant once Stripe approves the account.
                      </p>
                      <a
                        href={`/api/venues/connect?venueId=${venue.id}`}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-semibold text-white"
                      >
                        {venue.stripeAccountId ? "Manage Stripe" : "Connect Stripe"}
                      </a>
                    </div>

                    <form
                      action={sendVenuePayoutPreferenceAction}
                      className="rounded-[1.2rem] border border-white/10 bg-white/7 p-4"
                    >
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="payoutMethod" value="bank-transfer" />
                      <p className="text-sm font-bold text-[color:var(--color-foreground)]">
                        Bank transfer
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                        Manual payout option. Usually paid weekly to bi-weekly.
                      </p>
                      {venue.payoutMethod === "bank-transfer" ? (
                        <p className="mt-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          Bank transfer details saved.
                        </p>
                      ) : null}
                      <input
                        name="accountHolderName"
                        placeholder="Account holder name"
                        className="mt-3 h-10 w-full rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white placeholder:text-white/40"
                        required
                      />
                      <input
                        name="bankName"
                        placeholder="Bank name"
                        className="mt-2 h-10 w-full rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white placeholder:text-white/40"
                        required
                      />
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input
                          name="routingNumber"
                          inputMode="numeric"
                          placeholder="Routing number"
                          className="h-10 rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white placeholder:text-white/40"
                          required
                        />
                        <input
                          name="accountNumber"
                          inputMode="numeric"
                          placeholder="Account number"
                          className="h-10 rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                      <select
                        name="accountType"
                        defaultValue="checking"
                        className="mt-2 h-10 w-full rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                      <button
                        type="submit"
                        className="mt-3 inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                      >
                        Save bank details
                      </button>
                    </form>

                    <form
                      action={sendVenuePayoutPreferenceAction}
                      className="rounded-[1.2rem] border border-white/10 bg-white/7 p-4"
                    >
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="payoutMethod" value="check" />
                      <p className="text-sm font-bold text-[color:var(--color-foreground)]">
                        Checks by mail
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted-foreground)]">
                        Add the payee and mailing address. Checks are usually sent bi-weekly.
                      </p>
                      {venue.payoutMethod === "check" ? (
                        <p className="mt-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          Check mailing details saved.
                        </p>
                      ) : null}
                      <input
                        name="payableTo"
                        placeholder="Payable to"
                        className="mt-3 h-10 w-full rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white placeholder:text-white/40"
                        required
                      />
                      <textarea
                        name="mailingAddress"
                        rows={3}
                        placeholder="Mailing address"
                        className="mt-3 w-full rounded-[1rem] border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
                        required
                      />
                      <input
                        name="checkMemo"
                        placeholder="Memo or notes (optional)"
                        className="mt-2 h-10 w-full rounded-full border border-white/10 bg-white/10 px-3 text-sm text-white placeholder:text-white/40"
                      />
                      <button
                        type="submit"
                        className="mt-3 inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
                      >
                        Save check details
                      </button>
                    </form>
                  </div>
                  )}
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/7 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-foreground)]">
                    Audience controls
                  </p>
                  {pendingClaim ? (
                    <div className="mt-3 flex flex-col gap-3 rounded-[1.2rem] border border-pink-300/25 bg-pink-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-white/85">
                        Claim this dashboard to change NSFW and kids-mode settings.
                      </p>
                      <a
                        href={claimUrl}
                        className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Claim account
                      </a>
                    </div>
                  ) : (
                    <AudienceSettingsForm
                      venueId={venue.id}
                      allowExplicitContent={venue.allowExplicitContent}
                      forceKidsMode={venue.allowKidsMode}
                    />
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                        Songs played here
                      </p>
                      <h3 className="mt-2 text-xl font-black">Venue playlist</h3>
                    </div>
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">
                      Walk up to the venue computer, pause the house music, and hit Play.
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
                                className="h-11 flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-white placeholder:text-white/40"
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

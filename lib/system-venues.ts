import { listAllVenues, upsertVenueRecord } from "@/lib/db";
import { getAdminEmails } from "@/lib/env";

const ROOT_DEMO_SLUG = "song-selfie-demo";
const STRIPE_DEMO_SLUG = "stripe-demo";

function getSystemContactEmail() {
  return getAdminEmails()[0] ?? "team@songselfie.com";
}

export async function ensureRootDemoVenue() {
  return upsertVenueRecord({
    name: "Song Selfie Demo",
    slug: ROOT_DEMO_SLUG,
    description: "Create a demo song in seconds with the live Song Selfie guest flow.",
    contactEmail: getSystemContactEmail(),
    priceCents: 0,
    venueSharePercent: 70,
  });
}

export async function ensureStripeDemoVenue() {
  return upsertVenueRecord({
    name: "Stripe Demo",
    slug: STRIPE_DEMO_SLUG,
    description: "Test the paid Song Selfie checkout flow for $1 before generation starts.",
    contactEmail: getSystemContactEmail(),
    priceCents: 100,
    venueSharePercent: 0,
  });
}

export async function ensureSystemVenues() {
  await Promise.all([ensureRootDemoVenue(), ensureStripeDemoVenue()]);
}

export async function getVenueSummaries() {
  await ensureSystemVenues();
  return listAllVenues();
}

export function isSystemVenueSlug(slug: string) {
  return Object.values(SYSTEM_VENUE_SLUGS).includes(slug as (typeof SYSTEM_VENUE_SLUGS)[keyof typeof SYSTEM_VENUE_SLUGS]);
}

export function getVenuePublicPath(slug: string) {
  if (slug === SYSTEM_VENUE_SLUGS.rootDemo) {
    return "/";
  }

  return `/${slug}`;
}

export function getVenueSuccessPath(slug: string) {
  return `/${slug}/success`;
}

export const SYSTEM_VENUE_SLUGS = {
  rootDemo: ROOT_DEMO_SLUG,
  stripeDemo: STRIPE_DEMO_SLUG,
} as const;

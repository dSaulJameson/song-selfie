import { listAllVenues, upsertVenueRecord } from "@/lib/db";
import { getAdminEmails } from "@/lib/env";

const ROOT_DEMO_SLUG = "song-selfie-demo";
const STRIPE_DEMO_SLUG = "stripe-demo";

function getSystemContactEmail() {
  return getAdminEmails()[0] ?? "team@songselfie.com";
}

export async function ensureRootDemoVenue() {
  return upsertVenueRecord({
    name: "Song Selfie Testing",
    slug: ROOT_DEMO_SLUG,
    description: "Private free-testing page for internal Song Selfie feedback and QA.",
    contactEmail: getSystemContactEmail(),
    priceCents: 0,
    venueSharePercent: 70,
  });
}

export async function ensureStripeDemoVenue() {
  return upsertVenueRecord({
    name: "Song Selfie",
    slug: STRIPE_DEMO_SLUG,
    description:
      "Custom songs for tables, birthdays, and moments worth replaying. Secure Stripe checkout before generation starts.",
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
  if (slug === SYSTEM_VENUE_SLUGS.stripeDemo) {
    return "/";
  }

  if (slug === SYSTEM_VENUE_SLUGS.rootDemo) {
    return "/testing";
  }

  return `/${slug}`;
}

export function getVenueSuccessPath(slug: string) {
  if (slug === SYSTEM_VENUE_SLUGS.stripeDemo) {
    return "/success";
  }

  if (slug === SYSTEM_VENUE_SLUGS.rootDemo) {
    return "/testing/success";
  }

  return `/${slug}/success`;
}

export const SYSTEM_VENUE_SLUGS = {
  rootDemo: ROOT_DEMO_SLUG,
  stripeDemo: STRIPE_DEMO_SLUG,
} as const;

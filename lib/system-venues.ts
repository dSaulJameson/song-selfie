import { listAllVenues, renameVenueSlugIfAvailable, upsertVenueRecord } from "@/lib/db";
import { getAdminEmails } from "@/lib/env";

const LEGACY_STRIPE_DEMO_SLUG = "stripe-demo";
const DEFAULT_GENERATION_SLUG = "song-selfie";

function getSystemContactEmail() {
  return getAdminEmails()[0] ?? "team@songselfie.com";
}

export async function ensureDefaultGenerationVenue() {
  await renameVenueSlugIfAvailable({
    oldSlug: LEGACY_STRIPE_DEMO_SLUG,
    newSlug: DEFAULT_GENERATION_SLUG,
    name: "Song Selfie",
  });

  return upsertVenueRecord({
    name: "Song Selfie",
    slug: DEFAULT_GENERATION_SLUG,
    description:
      "Custom songs for tables, birthdays, and moments worth replaying. Secure Stripe checkout before generation starts.",
    contactEmail: getSystemContactEmail(),
    priceCents: 200,
    venueSharePercent: 0,
    allowExplicitContent: true,
    allowKidsMode: false,
  });
}

export const ensureStripeDemoVenue = ensureDefaultGenerationVenue;

export async function ensureSystemVenues() {
  await ensureDefaultGenerationVenue();
}

export async function getVenueSummaries() {
  await ensureSystemVenues();
  return listAllVenues();
}

export function isSystemVenueSlug(slug: string) {
  return (
    slug === LEGACY_STRIPE_DEMO_SLUG ||
    Object.values(SYSTEM_VENUE_SLUGS).includes(
      slug as (typeof SYSTEM_VENUE_SLUGS)[keyof typeof SYSTEM_VENUE_SLUGS],
    )
  );
}

export function getVenuePublicPath(slug: string) {
  if (slug === SYSTEM_VENUE_SLUGS.defaultGeneration || slug === LEGACY_STRIPE_DEMO_SLUG) {
    return "/generate";
  }

  return `/${slug}`;
}

export function getVenueGeneratePath(slug: string) {
  if (slug === SYSTEM_VENUE_SLUGS.defaultGeneration || slug === LEGACY_STRIPE_DEMO_SLUG) {
    return "/generate";
  }

  return `/generate?venue=${encodeURIComponent(slug)}`;
}

export function getVenueSuccessPath(slug: string) {
  if (slug === SYSTEM_VENUE_SLUGS.defaultGeneration || slug === LEGACY_STRIPE_DEMO_SLUG) {
    return "/success";
  }

  return `/${slug}/success`;
}

export const SYSTEM_VENUE_SLUGS = {
  defaultGeneration: DEFAULT_GENERATION_SLUG,
} as const;

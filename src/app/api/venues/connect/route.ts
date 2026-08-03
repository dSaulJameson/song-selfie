import { NextResponse } from "next/server";

import { auth, isAdminEmail } from "@/lib/auth";
import {
  getVenueById,
  saveVenueStripeAccount,
} from "@/lib/db";
import { createConnectOnboardingLink } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");

  if (!venueId) {
    return NextResponse.json({ error: "Venue ID is required." }, { status: 400 });
  }

  const venue = await getVenueById(venueId);
  const email = session.user.email.toLowerCase();
  const canAccessVenue =
    !!venue &&
    (venue.ownerUserId === session.user.id ||
      venue.contactEmail.toLowerCase() === email ||
      isAdminEmail(email));

  if (!canAccessVenue) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  const onboarding = await createConnectOnboardingLink({
    venue: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      priceCents: venue.priceCents,
      venueSharePercent: venue.venueSharePercent,
      stripeAccountId: venue.stripeAccountId,
      stripeChargesEnabled: venue.stripeChargesEnabled,
      stripePayoutsEnabled: venue.stripePayoutsEnabled,
    },
  });

  if (onboarding.accountId !== venue.stripeAccountId) {
    await saveVenueStripeAccount(venue.id, onboarding.accountId);
  }

  return NextResponse.redirect(onboarding.url);
}

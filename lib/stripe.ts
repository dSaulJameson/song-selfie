import Stripe from "stripe";

import type { SongRequestInput } from "@/lib/schema";
import { getBaseUrl, getStripeConfig } from "@/lib/env";
import { chunkString, safeJsonParse } from "@/lib/utils";

let stripeClient: Stripe | null = null;

export type CheckoutVenue = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  venueSharePercent: number;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
};

export function getStripe() {
  if (!stripeClient) {
    const config = getStripeConfig();
    stripeClient = new Stripe(config.secretKey);
  }

  return stripeClient;
}

export function buildCheckoutMetadata(params: {
  input: SongRequestInput;
  orderId: string;
  venue: CheckoutVenue;
}) {
  const payload = JSON.stringify(params.input);
  const chunks = chunkString(payload, 450);

  return chunks.reduce<Record<string, string>>(
    (metadata, chunk, index) => {
      metadata[`formChunk${index + 1}`] = chunk;
      return metadata;
    },
    {
      orderId: params.orderId,
      venueId: params.venue.id,
      venueSlug: params.venue.slug,
      venueName: params.venue.name,
      customerEmail: params.input.email,
      names: params.input.names.slice(0, 500),
    },
  );
}

export function readSongInputFromMetadata(
  metadata?: Stripe.Metadata | null,
): SongRequestInput | null {
  if (!metadata) {
    return null;
  }

  const payload = Object.entries(metadata)
    .filter(([key]) => key.startsWith("formChunk"))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value)
    .join("");

  return safeJsonParse<SongRequestInput>(payload);
}

export function calculateApplicationFee(amountTotal: number, venueSharePercent: number) {
  return Math.max(0, amountTotal - Math.round((amountTotal * venueSharePercent) / 100));
}

export async function createVenueCheckoutSession(params: {
  venue: CheckoutVenue;
  input: SongRequestInput;
  orderId: string;
}) {
  const stripe = getStripe();
  const metadata = buildCheckoutMetadata(params);
  const baseUrl = getBaseUrl();
  const transferEnabled =
    params.venue.stripeAccountId &&
    params.venue.stripeChargesEnabled &&
    params.venue.stripePayoutsEnabled;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    success_url: `${baseUrl}/v/${params.venue.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/v/${params.venue.slug}`,
    customer_email: params.input.email,
    metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: params.venue.priceCents,
          product_data: {
            name: `${params.venue.name} custom AI song`,
            description: `${params.input.songType.replace(/-/g, " ")} for ${params.input.names}`,
          },
        },
      },
    ],
    payment_intent_data: transferEnabled
      ? {
          metadata,
          application_fee_amount: calculateApplicationFee(
            params.venue.priceCents,
            params.venue.venueSharePercent,
          ),
          transfer_data: {
            destination: params.venue.stripeAccountId!,
          },
        }
      : {
          metadata,
        },
  });

  return session;
}

export async function getConnectedAccountSnapshot(accountId: string) {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);

  return {
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

export async function createConnectOnboardingLink(params: {
  venue: CheckoutVenue & { description?: string | null };
}) {
  const stripe = getStripe();
  let accountId = params.venue.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        venueId: params.venue.id,
        venueSlug: params.venue.slug,
      },
      business_profile: {
        name: params.venue.name,
        product_description:
          params.venue.description ?? "Venue-hosted QR code AI song experiences",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    accountId = account.id;
  }

  const baseUrl = getBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${baseUrl}/api/venues/connect?venueId=${params.venue.id}`,
    return_url: `${baseUrl}/venue`,
  });

  return {
    accountId,
    url: link.url,
  };
}

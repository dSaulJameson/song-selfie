import { NextResponse } from "next/server";

import {
  createDraftOrder,
  getVenueBySlug,
  markOrderPaidAndQueued,
  updateOrderCheckoutSession,
} from "@/lib/db";
import { drainGenerationQueue } from "@/lib/queue";
import { createVenueCheckoutSession } from "@/lib/stripe";
import { songRequestSchema } from "@/lib/schema";

type Props = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, { params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  try {
    const rawInput = (await request.json()) as unknown;
    const input = songRequestSchema.parse(rawInput);

    const draftOrder = await createDraftOrder({
      venueId: venue.id,
      customerEmail: input.email,
      rawInputs: input,
      metadata: {
        venueName: venue.name,
        venueSlug: venue.slug,
      },
    });

    if (venue.priceCents === 0) {
      await markOrderPaidAndQueued({
        orderId: draftOrder.id,
        checkoutSessionId: `free_${draftOrder.id}`,
        paymentIntentId: null,
        amountTotal: 0,
        currency: "usd",
        metadata: {
          venueName: venue.name,
          venueSlug: venue.slug,
          checkoutMode: "free",
        },
        rawInputs: input,
      });

      await drainGenerationQueue();

      return NextResponse.json({
        url: `/v/${venue.slug}/success?order_id=${draftOrder.id}`,
      });
    }

    const session = await createVenueCheckoutSession({
      venue: {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        priceCents: venue.priceCents,
        venueSharePercent: venue.venueSharePercent,
        stripeAccountId: venue.stripeAccountId,
        stripeChargesEnabled: venue.stripeChargesEnabled,
        stripePayoutsEnabled: venue.stripePayoutsEnabled,
      },
      input,
      orderId: draftOrder.id,
    });

    await updateOrderCheckoutSession(draftOrder.id, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create checkout session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

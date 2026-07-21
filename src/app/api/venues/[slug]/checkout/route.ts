import { after, NextResponse } from "next/server";
import { ZodError } from "zod";

import { applyVenueAudienceRules } from "@/lib/content-policy";
import {
  createDraftOrder,
  getVenueBySlug,
  markOrderPaidAndQueued,
  updateOrderCheckoutSession,
} from "@/lib/db";
import { drainGenerationQueue } from "@/lib/queue";
import { createVenueCheckoutSession } from "@/lib/stripe";
import { songRequestSchema } from "@/lib/schema";
import { getVenueSuccessPath } from "@/lib/system-venues";

type Props = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
const FREE_PROMO_CODE = "freesong";

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    if (error.issues.some((issue) => issue.path[0] === "email")) {
      return "Please put in your email so we know where to send the song.";
    }

    if (error.issues.some((issue) => issue.path[0] === "names")) {
      return "Tell us who the song is about first.";
    }

    return "Please double-check the song form and try again.";
  }

  return error instanceof Error ? error.message : "Could not create checkout session.";
}

export async function POST(request: Request, { params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  try {
    const rawInput = (await request.json()) as unknown;
    const promoCode =
      rawInput &&
      typeof rawInput === "object" &&
      "promoCode" in rawInput &&
      typeof rawInput.promoCode === "string"
        ? rawInput.promoCode.trim().toLowerCase()
        : "";
    const parsedInput = songRequestSchema.parse(rawInput);
    const input = applyVenueAudienceRules(parsedInput, {
      allowExplicitContent: venue.allowExplicitContent,
      allowKidsMode: venue.allowKidsMode,
    });

    const draftOrder = await createDraftOrder({
      venueId: venue.id,
      customerEmail: input.email,
      rawInputs: input,
      metadata: {
        venueName: venue.name,
        venueSlug: venue.slug,
      },
    });

    if (venue.priceCents === 0 || promoCode === FREE_PROMO_CODE) {
      await markOrderPaidAndQueued({
        orderId: draftOrder.id,
        checkoutSessionId:
          promoCode === FREE_PROMO_CODE
            ? `promo_${FREE_PROMO_CODE}_${draftOrder.id}`
            : `free_${draftOrder.id}`,
        paymentIntentId: null,
        amountTotal: 0,
        currency: "usd",
        metadata: {
          venueName: venue.name,
          venueSlug: venue.slug,
          checkoutMode: promoCode === FREE_PROMO_CODE ? "promo-bypass" : "free",
          promoCode: promoCode || null,
        },
        rawInputs: input,
      });

      after(async () => {
        await drainGenerationQueue();
      });

      return NextResponse.json({
        url: `${getVenueSuccessPath(venue.slug)}?order_id=${draftOrder.id}`,
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
    const message = getCheckoutErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

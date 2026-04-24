import Stripe from "stripe";
import { headers } from "next/headers";
import { after, NextResponse } from "next/server";

import { drainGenerationQueue } from "@/lib/queue";
import {
  getOrderById,
  markOrderPaidAndQueued,
} from "@/lib/db";
import { readSongInputFromMetadata, getStripe } from "@/lib/stripe";
import { songRequestSchema } from "@/lib/schema";
import { getStripeConfig } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();
  const config = getStripeConfig();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const existingOrder = await getOrderById(orderId);

      if (existingOrder && !["processing", "completed"].includes(existingOrder.status)) {
        const reconstructedInput =
          readSongInputFromMetadata(session.metadata) ?? existingOrder.rawInputs;

        const rawInputs = songRequestSchema.parse(reconstructedInput);

        await markOrderPaidAndQueued({
          orderId,
          checkoutSessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          amountTotal: session.amount_total,
          currency: session.currency,
          metadata: {
            ...session.metadata,
            checkoutStatus: session.status,
          },
          rawInputs,
        });

        after(async () => {
          await drainGenerationQueue();
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

"use server";

import { revalidatePath } from "next/cache";

import { getDashboardActor } from "@/lib/auth";
import { getOrderById, getVenueById, updateVenuePrice } from "@/lib/db";
import { sendForwardedSongEmail } from "@/lib/ses";
import { updateVenuePricingSchema } from "@/lib/schema";
import { getVenuePublicPath, isSystemVenueSlug } from "@/lib/system-venues";

async function requireVenueAccess(venueId: string) {
  const actor = await getDashboardActor();
  const venue = await getVenueById(venueId);

  if (!venue) {
    throw new Error("Venue not found.");
  }

  const hasAccess =
    actor.isAdmin || venue.contactEmail.toLowerCase() === actor.email.toLowerCase();

  if (!hasAccess) {
    throw new Error("You do not have access to manage this venue.");
  }

  return { actor, venue };
}

export async function updateVenueDashboardPricingAction(formData: FormData) {
  const input = updateVenuePricingSchema.parse({
    venueId: formData.get("venueId"),
    priceCents: formData.get("priceCents"),
  });

  const { venue } = await requireVenueAccess(input.venueId);
  const minimumPrice = isSystemVenueSlug(venue.slug) ? 0 : 100;

  if (input.priceCents < minimumPrice) {
    throw new Error(
      minimumPrice === 0
        ? "System venues can be free, but this price was invalid."
        : "Venue pricing must be at least $1.00.",
    );
  }

  await updateVenuePrice(venue.id, input.priceCents);
  revalidatePath("/venue");
  revalidatePath(getVenuePublicPath(venue.slug));
}

export async function forwardVenueSongEmailAction(formData: FormData) {
  const venueId = String(formData.get("venueId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const forwardEmail = String(formData.get("forwardEmail") ?? "").trim().toLowerCase();

  if (!forwardEmail.includes("@")) {
    throw new Error("Enter a valid email address to forward the song.");
  }

  const { actor, venue } = await requireVenueAccess(venueId);
  const order = await getOrderById(orderId);

  if (!order || order.venueId !== venue.id) {
    throw new Error("Song order not found for this venue.");
  }

  if (!order.songUrl) {
    throw new Error("This song is not ready to forward yet.");
  }

  const names = order.rawInputs?.names?.trim();
  const title = names ? `Song about ${names}` : `${venue.name} custom song`;

  await sendForwardedSongEmail({
    to: forwardEmail,
    venueName: venue.name,
    songUrl: order.songUrl,
    title,
    sentByEmail: actor.email,
  });

  revalidatePath("/venue");
}

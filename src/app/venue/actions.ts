"use server";

import { revalidatePath } from "next/cache";

import { getDashboardActor } from "@/lib/auth";
import {
  getOrderById,
  getVenueById,
  updateVenueContentSettings,
  updateVenuePayoutDetails,
  updateVenuePrice,
} from "@/lib/db";
import {
  sendForwardedSongEmail,
  sendVenuePayoutPreferenceEmail,
} from "@/lib/ses";
import {
  updateVenueContentSettingsSchema,
  updateVenuePayoutSchema,
  updateVenuePricingSchema,
} from "@/lib/schema";
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

export async function updateVenueAudienceSettingsAction(formData: FormData) {
  const input = updateVenueContentSettingsSchema.parse({
    venueId: formData.get("venueId"),
    allowExplicitContent: formData.get("allowExplicitContent"),
    allowKidsMode: formData.get("allowKidsMode"),
  });

  const { venue } = await requireVenueAccess(input.venueId);

  await updateVenueContentSettings({
    venueId: venue.id,
    allowExplicitContent: input.allowKidsMode ? false : input.allowExplicitContent,
    allowKidsMode: input.allowKidsMode,
  });

  revalidatePath("/venue");
  revalidatePath(getVenuePublicPath(venue.slug));
}

export async function sendVenuePayoutPreferenceAction(formData: FormData) {
  const payoutMethod = String(formData.get("payoutMethod") ?? "").trim();
  const rawInput =
    payoutMethod === "bank-transfer"
      ? {
          venueId: formData.get("venueId"),
          payoutMethod,
          accountHolderName: formData.get("accountHolderName"),
          bankName: formData.get("bankName"),
          routingNumber: formData.get("routingNumber"),
          accountNumber: formData.get("accountNumber"),
          accountType: formData.get("accountType"),
        }
      : {
          venueId: formData.get("venueId"),
          payoutMethod,
          payableTo: formData.get("payableTo"),
          mailingAddress: formData.get("mailingAddress"),
          checkMemo: formData.get("checkMemo"),
        };
  const input = updateVenuePayoutSchema.parse(rawInput);

  const { venue } = await requireVenueAccess(input.venueId);
  const payoutDetails =
    input.payoutMethod === "bank-transfer"
      ? {
          accountHolderName: input.accountHolderName,
          bankName: input.bankName,
          routingNumber: input.routingNumber,
          accountNumber: input.accountNumber,
          accountType: input.accountType,
        }
      : {
          payableTo: input.payableTo,
          mailingAddress: input.mailingAddress,
          checkMemo: input.checkMemo,
        };

  await updateVenuePayoutDetails({
    venueId: venue.id,
    payoutMethod: input.payoutMethod,
    payoutDetails,
  });

  await sendVenuePayoutPreferenceEmail({
    venueName: venue.name,
    venueEmail: venue.contactEmail,
    payoutMethod:
      input.payoutMethod === "bank-transfer" ? "Bank transfer details saved" : "Checks by mail",
    details:
      input.payoutMethod === "bank-transfer"
        ? JSON.stringify(
            {
              accountHolderName: input.accountHolderName,
              bankName: input.bankName,
              routingNumber: input.routingNumber,
              accountType: input.accountType,
              accountNumberLast4: input.accountNumber.slice(-4),
            },
            null,
            2,
          )
        : JSON.stringify(payoutDetails, null, 2),
  });

  revalidatePath("/venue");
}

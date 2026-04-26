"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  createVenueRecord,
  getVenueById,
  updateVenuePrice,
  updateVenueSharePercent,
} from "@/lib/db";
import { sendVenueInviteEmail } from "@/lib/ses";
import {
  createVenueSchema,
  updateVenuePricingSchema,
  updateVenueShareSchema,
} from "@/lib/schema";
import { getVenuePublicPath, isSystemVenueSlug } from "@/lib/system-venues";

export async function createVenueAction(formData: FormData) {
  await requireAdminUser();

  const input = createVenueSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    contactEmail: formData.get("contactEmail"),
    priceCents: formData.get("priceCents"),
    venueSharePercent: formData.get("venueSharePercent"),
  });

  if (!isSystemVenueSlug(input.slug) && input.priceCents < 100) {
    throw new Error("Real venue pricing must start at $1.00 or higher.");
  }

  const venue = await createVenueRecord(input);

  await sendVenueInviteEmail({
    to: venue.contactEmail,
    venueName: venue.name,
    venueSlug: venue.slug,
  });

  revalidatePath("/admin");
  revalidatePath("/venue");
  revalidatePath("/login");
  revalidatePath(getVenuePublicPath(venue.slug));
}

export async function updateVenueShareAction(formData: FormData) {
  await requireAdminUser();
  const input = updateVenueShareSchema.parse({
    venueId: formData.get("venueId"),
    venueSharePercent: formData.get("venueSharePercent"),
  });

  await updateVenueSharePercent(input.venueId, input.venueSharePercent);
  revalidatePath("/admin");
  revalidatePath("/venue");
  revalidatePath("/stripe-demo");
}

export async function updateVenuePricingAction(formData: FormData) {
  await requireAdminUser();
  const input = updateVenuePricingSchema.parse({
    venueId: formData.get("venueId"),
    priceCents: formData.get("priceCents"),
  });

  const venue = await getVenueById(input.venueId);

  if (venue && !isSystemVenueSlug(venue.slug) && input.priceCents < 100) {
    throw new Error("Real venue pricing must stay at $1.00 or higher.");
  }

  await updateVenuePrice(input.venueId, input.priceCents);
  revalidatePath("/admin");
  revalidatePath("/venue");
  revalidatePath("/");
  revalidatePath("/stripe-demo");
  if (venue) {
    revalidatePath(getVenuePublicPath(venue.slug));
  }
}

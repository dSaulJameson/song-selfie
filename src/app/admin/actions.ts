"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  createVenueRecord,
  updateVenuePrice,
  updateVenueSharePercent,
} from "@/lib/db";
import {
  createVenueSchema,
  updateVenuePricingSchema,
  updateVenueShareSchema,
} from "@/lib/schema";

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

  await createVenueRecord(input);
  revalidatePath("/admin");
  revalidatePath("/venue");
  revalidatePath("/login");
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

  await updateVenuePrice(input.venueId, input.priceCents);
  revalidatePath("/admin");
  revalidatePath("/venue");
  revalidatePath("/");
  revalidatePath("/stripe-demo");
}

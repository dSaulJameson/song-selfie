import { NextResponse } from "next/server";
import { z } from "zod";

import { createSelfServeVenueRecord } from "@/lib/db";
import { getBaseUrl } from "@/lib/env";
import { sendBusinessLeadEmail, sendVenueInviteEmail } from "@/lib/ses";
import { getVenuePublicPath } from "@/lib/system-venues";

const businessLeadSchema = z.object({
  email: z.email(),
  businessName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(""),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please enter a venue name and valid email." },
      { status: 400 },
    );
  }

  const parsed = businessLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a venue name and valid email." },
      { status: 400 },
    );
  }

  const venue = await createSelfServeVenueRecord({
    name: parsed.data.businessName,
    contactEmail: parsed.data.email,
    priceCents: 100,
    venueSharePercent: 70,
  });
  const venueUrl = `${getBaseUrl()}${getVenuePublicPath(venue.slug)}`;
  const dashboardUrl = `${getBaseUrl()}/venue?${new URLSearchParams({
    email: venue.contactEmail,
    venue: venue.slug,
    created: "1",
  }).toString()}`;

  await Promise.all([
    sendVenueInviteEmail({
      to: parsed.data.email,
      venueName: venue.name,
      venueSlug: venue.slug,
      dashboardUrl,
    }),
    sendBusinessLeadEmail({
      email: parsed.data.email,
      businessName: parsed.data.businessName,
      phone: parsed.data.phone,
      venueUrl,
      dashboardUrl,
    }),
  ]);

  return NextResponse.json({
    message: "Your venue page is ready. Continue to your dashboard to print the QR code.",
    venueUrl,
    dashboardUrl,
    slug: venue.slug,
  });
}

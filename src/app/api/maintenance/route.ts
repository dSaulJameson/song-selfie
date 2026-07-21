import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function maintenanceResponse() {
  return NextResponse.json(
    {
      error: "Song Selfie is briefly unavailable while production data is being migrated.",
    },
    {
      status: 503,
      headers: {
        "Retry-After": "120",
      },
    },
  );
}

export const GET = maintenanceResponse;
export const POST = maintenanceResponse;
export const PUT = maintenanceResponse;
export const PATCH = maintenanceResponse;
export const DELETE = maintenanceResponse;

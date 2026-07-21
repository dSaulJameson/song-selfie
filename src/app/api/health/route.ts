import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const databaseHealthy = await checkDatabaseConnection();
    if (!databaseHealthy) {
      throw new Error("Database health query returned an unexpected result.");
    }

    return NextResponse.json({
      status: "ok",
      database: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed", {
      message: error instanceof Error ? error.message : "Unknown health check error",
    });

    return NextResponse.json(
      { status: "unhealthy", database: "unavailable" },
      { status: 503 },
    );
  }
}

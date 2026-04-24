import { NextResponse } from "next/server";

import { drainGenerationQueue } from "@/lib/queue";

export const runtime = "nodejs";

export async function POST() {
  const result = await drainGenerationQueue();
  return NextResponse.json(result);
}

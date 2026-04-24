import { NextResponse } from "next/server";

import { getFineTuneCapabilities } from "@/lib/finetune-capabilities";

export async function GET() {
  return NextResponse.json(getFineTuneCapabilities());
}

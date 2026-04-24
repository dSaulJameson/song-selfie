import { NextResponse } from "next/server";

import { getOrderById } from "@/lib/db";
import { recoverProcessingOrder } from "@/lib/queue";

type Props = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  let order = await getOrderById(id);

  if (order?.status === "processing" && order.finetuneGenerationId) {
    order = await recoverProcessingOrder(id);
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt,
      generatedPrompt: order.generatedPrompt,
      songUrl: order.songUrl,
      errorMessage: order.errorMessage,
      emailedAt: order.emailedAt,
    },
  });
}

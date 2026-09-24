import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listCompletedSongsInWindow } from "@/lib/db";
import { Ticket500Demo } from "@/src/components/public/ticket-500-demo";

type Props = {
  params: Promise<{ accessKey: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ticket 500 | Song Selfie",
  description: "An unlisted Song Selfie demo listening room.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

function readDemoWindow() {
  const startAt = process.env.TICKET_500_DEMO_START_AT?.trim();
  const endAt = process.env.TICKET_500_DEMO_END_AT?.trim();

  if (
    !startAt ||
    !endAt ||
    !Number.isFinite(Date.parse(startAt)) ||
    !Number.isFinite(Date.parse(endAt)) ||
    Date.parse(startAt) >= Date.parse(endAt)
  ) {
    return null;
  }

  return { startAt, endAt };
}

export default async function Ticket500Page({ params }: Props) {
  const { accessKey } = await params;
  const configuredAccessKey = process.env.TICKET_500_DEMO_ACCESS_KEY?.trim();
  const demoWindow = readDemoWindow();

  if (!configuredAccessKey || accessKey !== configuredAccessKey || !demoWindow) {
    notFound();
  }

  const records = await listCompletedSongsInWindow(
    demoWindow.startAt,
    demoWindow.endAt,
  );
  const songs = records.flatMap((record) =>
    record.songUrl && record.completedAt
      ? [
          {
            id: record.id,
            songUrl: record.songUrl,
            completedAt: record.completedAt,
          },
        ]
      : [],
  );

  return (
    <Ticket500Demo
      songs={songs}
      windowStart={demoWindow.startAt}
      windowEnd={demoWindow.endAt}
    />
  );
}

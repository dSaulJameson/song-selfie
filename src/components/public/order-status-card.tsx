"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDate } from "@/lib/utils";

type OrderStatus = {
  id: string;
  status: string;
  customerEmail: string;
  createdAt: string;
  generatedPrompt: string | null;
  songUrl: string | null;
  slideshowUrl?: string | null;
  errorMessage: string | null;
  emailedAt: string | null;
};

type OrderStatusCardProps = {
  initialOrder: OrderStatus;
};

const progressSteps = [
  { id: "paid", label: "Paid" },
  { id: "lyrics", label: "Writing lyrics" },
  { id: "song", label: "Making song" },
  { id: "upload", label: "Uploading" },
  { id: "email", label: "Email sent" },
] as const;

function getCompletedProgressCount(order: OrderStatus) {
  if (order.status === "failed") {
    return 1;
  }

  if (order.emailedAt) {
    return 5;
  }

  if (order.songUrl) {
    return 4;
  }

  if (order.generatedPrompt) {
    return 2;
  }

  if (["queued", "processing", "completed"].includes(order.status)) {
    return 1;
  }

  return 0;
}

export function OrderStatusCard({ initialOrder }: OrderStatusCardProps) {
  const [order, setOrder] = useState(initialOrder);
  const completedProgressCount = getCompletedProgressCount(order);

  const isTerminal = useMemo(
    () => ["completed", "failed"].includes(order.status),
    [order.status],
  );

  useEffect(() => {
    void fetch("/api/queue/drain", { method: "POST" });
  }, []);

  useEffect(() => {
    if (isTerminal) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const response = await fetch(`/api/orders/${order.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { order?: OrderStatus };
      if (!cancelled && payload.order) {
        setOrder(payload.order);
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isTerminal, order.id]);

  return (
    <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-slate-900">
      <div className="grid gap-2 sm:grid-cols-5">
        {progressSteps.map((step, index) => {
          const complete = index < completedProgressCount;
          return (
            <div
              key={step.id}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                complete
                  ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-slate-900">
        <span className="font-semibold">Status:</span> {order.status}
      </p>
      <p className="mt-2 text-sm text-slate-900">
        <span className="font-semibold">Email:</span> {order.customerEmail}
      </p>
      <p className="mt-2 text-sm text-slate-900">
        <span className="font-semibold">Created:</span> {formatDate(order.createdAt)}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {order.generatedPrompt ??
          "Prompt generation begins after the queue picks up your order."}
      </p>
      {order.errorMessage ? (
        <p className="mt-3 text-sm text-rose-600">{order.errorMessage}</p>
      ) : null}
      {order.songUrl ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={order.songUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-semibold text-fuchsia-600"
          >
            Open your song
          </a>
          {order.slideshowUrl ? (
            <a
              href={order.slideshowUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-semibold text-fuchsia-600"
            >
              Open your slideshow
            </a>
          ) : null}
        </div>
      ) : null}
      {order.emailedAt ? (
        <p className="mt-3 text-xs text-slate-500">
          Delivery email sent.
        </p>
      ) : null}
    </div>
  );
}

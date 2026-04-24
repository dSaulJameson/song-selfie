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
  errorMessage: string | null;
  emailedAt: string | null;
};

type OrderStatusCardProps = {
  initialOrder: OrderStatus;
};

export function OrderStatusCard({ initialOrder }: OrderStatusCardProps) {
  const [order, setOrder] = useState(initialOrder);

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
    <div className="mt-6 rounded-[1.5rem] bg-[color:var(--color-surface)] p-5">
      <p className="text-sm">
        <span className="font-semibold">Status:</span> {order.status}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Email:</span> {order.customerEmail}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Created:</span> {formatDate(order.createdAt)}
      </p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
        {order.generatedPrompt ??
          "Prompt generation begins after the queue picks up your order."}
      </p>
      {order.errorMessage ? (
        <p className="mt-3 text-sm text-rose-600">{order.errorMessage}</p>
      ) : null}
      {order.songUrl ? (
        <a
          href={order.songUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-semibold text-[color:var(--color-accent)]"
        >
          Open your song
        </a>
      ) : null}
      {order.emailedAt ? (
        <p className="mt-3 text-xs text-[color:var(--color-muted-foreground)]">
          Delivery email sent.
        </p>
      ) : null}
    </div>
  );
}

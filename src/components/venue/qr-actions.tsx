"use client";

import { useState } from "react";

type VenueQrActionsProps = {
  qrCode: string;
  venueName: string;
  publicUrl: string;
};

export function VenueQrActions({
  qrCode,
  venueName,
  publicUrl,
}: VenueQrActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = publicUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <a
        href={qrCode}
        download={`${venueName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-song-selfie-qr.png`}
        className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-semibold text-white"
      >
        Download QR
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

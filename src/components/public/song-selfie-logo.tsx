"use client";

import Image from "next/image";
import { Lobster_Two } from "next/font/google";

const lobsterTwo = Lobster_Two({
  subsets: ["latin"],
  weight: ["700"],
});

type SongSelfieLogoProps = {
  compact?: boolean;
};

export function SongSelfieLogo({ compact = false }: SongSelfieLogoProps) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-3"
          : "flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left"
      }
    >
      <Image
        src="/icon.svg"
        alt="Song Selfie icon"
        width={compact ? 56 : 96}
        height={compact ? 56 : 96}
        className={compact ? "h-14 w-14" : "h-20 w-20 sm:h-24 sm:w-24"}
        priority
      />
      <div className="flex items-start gap-1">
        <span
          className={`${lobsterTwo.className} leading-none tracking-tight text-slate-950 ${
            compact ? "text-4xl sm:text-5xl" : "text-5xl sm:text-7xl"
          }`}
        >
          Song Selfie
        </span>
        <span
          aria-hidden="true"
          className={compact ? "pt-1 text-xl text-pink-500" : "pt-2 text-2xl text-pink-500 sm:text-3xl"}
        >
          ✦
        </span>
      </div>
    </div>
  );
}

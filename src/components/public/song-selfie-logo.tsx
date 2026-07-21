"use client";

import Image from "next/image";

type SongSelfieLogoProps = {
  compact?: boolean;
  tone?: "light" | "dark";
};

export function SongSelfieLogo({ compact = false }: SongSelfieLogoProps) {
  return (
    <div
      className={
        compact
          ? "mx-auto w-full max-w-[12rem] overflow-hidden -my-5 sm:max-w-[13rem] sm:-my-6"
          : "mx-auto w-full max-w-[20rem] overflow-hidden -my-6 sm:max-w-[22rem] sm:-my-8"
      }
    >
      <Image
        src="/song-selfie-new-logo.png"
        alt="Song Selfie"
        width={1152}
        height={768}
        priority
        className="block h-auto w-full scale-[1.16] object-contain"
      />
    </div>
  );
}

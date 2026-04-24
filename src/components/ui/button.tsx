"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] text-white shadow-[0_18px_40px_rgba(255,107,53,0.28)] hover:-translate-y-0.5",
        variant === "secondary" &&
          "border border-[color:var(--color-line)] bg-white/80 text-[color:var(--color-foreground)] hover:bg-white",
        variant === "ghost" &&
          "bg-transparent text-[color:var(--color-foreground)] hover:bg-white/70",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

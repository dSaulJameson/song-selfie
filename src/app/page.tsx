import Link from "next/link";

import { getBaseUrl } from "@/lib/env";

export default function Home() {
  const baseUrl = getBaseUrl();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.4rem] border border-[color:var(--color-line)] bg-[linear-gradient(140deg,rgba(255,107,53,0.12),rgba(14,165,233,0.1),rgba(255,255,255,0.9))] px-6 py-8 shadow-[0_32px_90px_rgba(22,12,46,0.13)] sm:px-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
              Song Selfie
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-[color:var(--color-foreground)] sm:text-6xl">
                Selfies make memories. Songs make the soundtrack.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-muted-foreground)]">
                Song Selfie gives bars, restaurants, and live venues a QR-powered
                music experience: guests scan, tell the story of the moment, and
                get a custom soundtrack for that memory delivered by email.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,107,53,0.28)]"
              >
                Sign in for dashboards
              </Link>
              <span className="inline-flex items-center rounded-full border border-[color:var(--color-line)] px-6 py-3 text-sm font-semibold text-[color:var(--color-foreground)]">
                Public song pages live at{" "}
                <code className="ml-2 font-mono">{baseUrl}/v/&lt;slug&gt;</code>
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-[0_20px_55px_rgba(22,12,46,0.11)] backdrop-blur">
            <div className="rounded-[1.6rem] bg-[linear-gradient(160deg,#21153b,#ff6b35)] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/65">
                Memory flow
              </p>
              <ol className="mt-4 space-y-4 text-sm leading-6">
                <li>1. Guest scans a QR code at the venue table.</li>
                <li>2. They turn the moment into a Song Selfie with dynamic FineTune controls.</li>
                <li>3. Stripe captures payment or a free test run.</li>
                <li>4. The app generates the song and emails both the guest and venue.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            title: "Guest-facing builder",
            copy:
              "A fun mobile-first form that turns table chaos, birthdays, roasts, and romance into a soundtrack.",
          },
          {
            title: "Venue dashboard",
            copy:
              "QR generation, Stripe Connect onboarding, pricing controls, revenue tracking, and song history in one place.",
          },
          {
            title: "Admin controls",
            copy:
              "Venue management, split percentages, global order visibility, and a venue-mode view for live testing.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[1.9rem] border border-[color:var(--color-line)] bg-white/80 p-6 shadow-[0_16px_34px_rgba(22,12,46,0.07)]"
          >
            <h2 className="text-xl font-black text-[color:var(--color-foreground)]">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
              {item.copy}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

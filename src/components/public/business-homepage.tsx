"use client";

import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Loader2,
  Mail,
  MonitorPlay,
  Music2,
  Phone,
  Play,
  QrCode,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { SongSelfieLogo } from "@/src/components/public/song-selfie-logo";
import { Button } from "@/src/components/ui/button";

const flowSteps = [
  {
    title: "Scan",
    copy: "Guests scan a table QR code.",
    icon: QrCode,
  },
  {
    title: "Create",
    copy: "They describe the moment and pay before generation.",
    icon: Sparkles,
  },
  {
    title: "Play",
    copy: "Your team hits play from the venue dashboard.",
    icon: Volume2,
  },
  {
    title: "Earn",
    copy: "Stripe collects payment and tracks revenue.",
    icon: BadgeDollarSign,
  },
] as const;

const venueBullets = [
  "Onboard a venue page in minutes",
  "Stripe checkout included",
  "QR code generated for every venue",
  "You choose the song price",
  "Keep 70%+ of song revenue by default",
] as const;

const staffSteps = [
  "Guests scan",
  "Guests pay",
  "Song appears in dashboard",
  "Staff hits play",
  "No app install",
] as const;

const useCases = [
  "Birthday tables",
  "Bachelorette groups",
  "Karaoke nights",
  "Bottle service",
  "Trivia breaks",
  "Private events",
] as const;

const controlPoints = [
  {
    title: "Content controls",
    copy: "Disable explicit content, enable kids mode, and keep the room comfortable.",
    icon: ShieldCheck,
  },
  {
    title: "Venue pricing",
    copy: "Set songs at $10, $20, or whatever fits your crowd.",
    icon: SlidersHorizontal,
  },
  {
    title: "Missed delivery backup",
    copy: "Forward completed song links from the venue dashboard.",
    icon: Mail,
  },
] as const;

const faqs = [
  {
    question: "How fast are songs ready?",
    answer: "Most songs are ready in about a minute or two, then appear in the venue dashboard and email.",
  },
  {
    question: "Do guests need an app?",
    answer: "No. Guests scan a QR code, create their song in the browser, and pay through Stripe.",
  },
  {
    question: "Can venues choose the price?",
    answer: "Yes. Venues can set the per-song price and keep 70%+ of revenue by default.",
  },
  {
    question: "Do I need payouts before I start?",
    answer: "No. Create the venue page first, print the QR code, and finish payout setup later from Get Paid.",
  },
  {
    question: "Can we block explicit songs?",
    answer: "Yes. Venues can turn explicit content off and enable kids mode for family-friendly rooms.",
  },
] as const;

function ExplainerAnimation() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="grid grid-cols-4 gap-2">
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="relative min-h-28 rounded-md border border-white/10 bg-black/20 p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff4fa3,#8d66ff)] text-white shadow-[0_0_24px_rgba(255,79,163,0.28)]">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-black text-white">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/62">{step.copy}</p>
              {index < flowSteps.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-6 hidden h-4 w-4 text-pink-200/70 sm:block" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-[#08040d] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">Table 12 Anthem</p>
            <p className="text-xs text-white/52">Ready for speakers</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white shadow-[0_0_26px_rgba(255,79,163,0.42)]"
            aria-label="Play preview"
          >
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </button>
        </div>
        <div className="mt-4 flex h-10 items-end gap-1">
          {[18, 28, 22, 36, 30, 24, 38, 20, 32, 26, 34, 22].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="block w-full rounded-full bg-[linear-gradient(180deg,#ff6fbd,#8d66ff)]"
              style={{
                height: `${height}px`,
                animation: `pulse ${1.2 + index * 0.04}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#09050f] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-white">Venue dashboard</p>
          <p className="text-xs text-white/52">Ready songs for tonight</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100">
          <MonitorPlay className="h-3.5 w-3.5" />
          Speaker ready
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {[
          ["Table 12 Anthem", "$10", "Play"],
          ["Birthday Crew Roast", "$20", "Play"],
          ["Last Call Love Song", "$10", "Play"],
        ].map(([title, price, action]) => (
          <div
            key={title}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md border border-white/10 bg-white/6 px-3 py-2"
          >
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="text-xs font-black text-pink-100">{price}</p>
            <span className="rounded-md bg-pink-500 px-3 py-1 text-xs font-black text-white">
              {action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadForm() {
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitLead() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/business-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          businessName,
          phone,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        venueUrl?: string;
        dashboardUrl?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not send the signup request.");
        return;
      }

      if (payload.dashboardUrl) {
        window.location.assign(payload.dashboardUrl);
        return;
      }

      setMessage(payload.message ?? "Your venue page is ready. Continue to your dashboard.");
    });
  }

  return (
    <div className="rounded-lg border border-pink-300/20 bg-white/6 p-4">
      <p className="text-lg font-black text-white">Bring Song Selfie to your venue</p>
      <p className="mt-1 text-sm leading-6 text-white/62">
        Enter your venue and email. We create your page immediately so you can print a QR code and start making music and money.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto]">
        <input
          type="text"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          placeholder="Venue name"
          required
          className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-pink-300/70 focus:ring-4 focus:ring-pink-500/15"
        />
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-200" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@example.com"
            required
            className="h-12 w-full rounded-md border border-white/10 bg-black/24 px-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-pink-300/70 focus:ring-4 focus:ring-pink-500/15"
          />
        </div>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-200" />
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone or text number"
            className="h-12 w-full rounded-md border border-white/10 bg-black/24 px-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-pink-300/70 focus:ring-4 focus:ring-pink-500/15"
          />
        </div>
        <Button
          type="button"
          onClick={submitLead}
          disabled={isPending}
          className="h-12 rounded-md bg-[linear-gradient(90deg,#ff4fa3,#8d66ff)] px-5 text-sm font-black text-white shadow-[0_0_32px_rgba(255,79,163,0.24)] transition hover:scale-[1.01]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            <>
              Create my venue page
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-rose-400/20 bg-rose-500/12 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-md border border-emerald-300/20 bg-emerald-500/12 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function BusinessHomepage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#07040c,#15091d_48%,#08040d)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <SongSelfieLogo compact />
          <Link
            href="/generate"
            className="rounded-md border border-white/12 bg-white/6 px-4 py-2 text-sm font-bold text-white/82 transition hover:bg-white/12 hover:text-white"
          >
            Try it out
          </Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-pink-100">
              <Music2 className="h-3.5 w-3.5" />
              Built for bars, restaurants, and live rooms
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              AI songs made on demand.
              <br />
              Ready to play over your venue&apos;s speakers in minutes.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
              Song Selfie turns table QR codes into a new paid entertainment moment:
              guests make custom songs, your staff plays them, and Stripe handles
              checkout before generation starts.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {venueBullets.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-white/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#venue-signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[linear-gradient(90deg,#ff4fa3,#8d66ff)] px-5 text-sm font-black text-white shadow-[0_0_36px_rgba(255,79,163,0.28)] transition hover:scale-[1.01]"
              >
                Create my venue page
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                href="/generate"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/12 bg-white/7 px-5 text-sm font-black text-white transition hover:bg-white/12"
              >
                Try it out
              </Link>
            </div>
          </div>

          <ExplainerAnimation />
        </section>

        <section className="grid gap-4 rounded-lg border border-pink-200/25 bg-[linear-gradient(135deg,rgba(255,79,163,0.16),rgba(141,102,255,0.14)),rgba(255,255,255,0.07)] p-4 shadow-[0_0_50px_rgba(255,79,163,0.12)] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-3xl font-black text-white">$250</p>
            <p className="mt-1 text-sm leading-6 text-white/62">25 guests buying $10 songs creates $250 in new nightly revenue.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">2 min</p>
            <p className="mt-1 text-sm leading-6 text-white/62">Venue setup flow once your account is ready.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">70%+</p>
            <p className="mt-1 text-sm leading-6 text-white/62">Revenue share for venues by default.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">$10-$20</p>
            <p className="mt-1 text-sm leading-6 text-white/62">Common song prices venues can test.</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-black text-white">How it works during service</p>
            <div className="mt-4 grid gap-2">
              {staffSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-md bg-white/6 px-3 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-500 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-black text-white">Built for loud rooms</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="rounded-full border border-white/10 bg-white/7 px-3 py-2 text-sm font-semibold text-white/82"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-black text-white">Venue controls included</p>
            <div className="mt-4 grid gap-3">
              {controlPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="flex gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-pink-200" />
                    <div>
                      <p className="text-sm font-black text-white">{point.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/62">{point.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="venue-signup">
          <LeadForm />
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-2xl font-black text-white">Questions venues ask first</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-md border border-white/10 bg-black/18 p-4">
                <p className="text-sm font-black text-white">{faq.question}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

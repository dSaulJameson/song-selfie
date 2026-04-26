import { cookies } from "next/headers";

import { listRecentCompletedOrdersForVenue } from "@/lib/db";
import { ensureRootDemoVenue } from "@/lib/system-venues";
import { VenueSongExperience } from "@/src/components/public/venue-song-experience";

import { unlockTestingAccessAction } from "./actions";
import { TESTING_ACCESS_COOKIE } from "./constants";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function TestingPage({ searchParams }: Props) {
  const [cookieStore, query] = await Promise.all([cookies(), searchParams]);
  const hasAccess = cookieStore.get(TESTING_ACCESS_COOKIE)?.value === "granted";

  if (!hasAccess) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(176,97,255,0.24),transparent_28%),linear-gradient(180deg,#120f1f,#17122a_45%,#1e1635)] p-3 shadow-[0_50px_120px_rgba(11,8,25,0.45)]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/96 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-600">
              Private testing
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              Free Song Selfie testing page
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-500">
              This route is password protected so we can share free test songs before
              the paid launch goes wide.
            </p>

            <form action={unlockTestingAccessAction} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                  Testing password
                </span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-14 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100"
                  placeholder="all lowercase"
                />
              </label>

              {query.error ? (
                <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  That password did not match the testing page.
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[linear-gradient(90deg,#ff5d8f,#8b5cff)] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_24px_60px_rgba(160,72,255,0.28)]"
              >
                Unlock free testing
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const venue = await ensureRootDemoVenue();
  const recentSongs = await listRecentCompletedOrdersForVenue(venue.id, 4);

  return <VenueSongExperience venue={venue} recentSongs={recentSongs} mode="free-testing" />;
}

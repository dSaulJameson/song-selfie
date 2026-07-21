import { auth, currentUser } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboardDestinationForEmail, getUserEmail } from "@/lib/auth";
import { hasClerkClientKeys } from "@/lib/clerk";

type Props = {
  searchParams: Promise<{
    email?: string;
    venue?: string;
    created?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email : "";
  const venueSlug = typeof query.venue === "string" ? query.venue : "";
  const isNewVenue = query.created === "1";
  const returnPath = venueSlug
    ? `/venue?${new URLSearchParams({ venue: venueSlug }).toString()}`
    : "/venue";
  const signUpUrl = `/sign-up?${new URLSearchParams({
    ...(email ? { email } : {}),
    ...(venueSlug ? { venue: venueSlug } : {}),
    ...(isNewVenue ? { created: "1" } : {}),
  }).toString()}`;

  if (!hasClerkClientKeys()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
        <section className="w-full rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-8 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
            Auth setup needed
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[color:var(--color-foreground)]">
            Clerk is not configured in this environment yet.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
            Add Clerk keys to enable shared admin and venue dashboard sign-in.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Song Selfie
          </Link>
        </section>
      </main>
    );
  }

  const session = await auth();

  if (session.userId) {
    const user = await currentUser();
    const email = user ? getUserEmail(user) : "";
    if (venueSlug) {
      redirect(returnPath);
    }

    const destination = email ? await getDashboardDestinationForEmail(email) : null;

    if (destination) {
      redirect(destination);
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
        <section className="w-full rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 p-8 shadow-[0_18px_44px_rgba(22,12,46,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
            Access pending
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[color:var(--color-foreground)]">
            This email has not been invited to a Song Selfie dashboard yet.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted-foreground)]">
            Ask an admin to add your email to a venue, then come back here and we&apos;ll
            route you to the right dashboard automatically.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Song Selfie
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08040d,#16091f)] px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {isNewVenue ? (
          <section className="rounded-[1rem] border border-rose-300/25 bg-rose-500/14 px-4 py-3 text-white shadow-[0_18px_50px_rgba(244,63,148,0.16)]">
            <p className="text-sm font-bold leading-6 text-white">
              Claim and verify this dashboard with {email || "the email you entered"}.
            </p>
            {venueSlug ? (
              <p className="mt-2 rounded-lg border border-white/10 bg-black/18 px-3 py-2 font-mono text-xs text-white/70">
                songselfie.com/{venueSlug}
              </p>
            ) : null}
          </section>
        ) : null}

        <SignIn
          path="/login"
          routing="path"
          fallbackRedirectUrl={returnPath}
          forceRedirectUrl={returnPath}
          signUpUrl={signUpUrl}
          signUpFallbackRedirectUrl={returnPath}
          signUpForceRedirectUrl={returnPath}
          initialValues={email ? { emailAddress: email } : undefined}
        />
      </div>
    </main>
  );
}

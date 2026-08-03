import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getDashboardDestinationForEmail,
  getOptionalSession,
  getUserEmail,
} from "@/lib/auth";
import {
  EmailAuthForm,
  SignOutButton,
} from "@/src/components/auth/email-auth-form";

type Props = {
  params: Promise<{ login?: string[] }>;
  searchParams: Promise<{
    email?: string;
    venue?: string;
    created?: string;
    returnTo?: string;
    error?: string;
  }>;
};

function safeReturnPath(value: string | undefined, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export default async function LoginPage({ params, searchParams }: Props) {
  const route = await params;
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email : "";
  const venueSlug = typeof query.venue === "string" ? query.venue : "";
  const isNewVenue = query.created === "1";
  const venuePath = venueSlug
    ? `/venue?${new URLSearchParams({ venue: venueSlug }).toString()}`
    : "/venue";
  const returnPath = safeReturnPath(query.returnTo, venuePath);
  const sharedQuery = new URLSearchParams({
    ...(email ? { email } : {}),
    ...(venueSlug ? { venue: venueSlug } : {}),
    ...(isNewVenue ? { created: "1" } : {}),
    ...(query.returnTo ? { returnTo: returnPath } : {}),
  });

  if (route.login?.length) {
    redirect(`/login?${sharedQuery.toString()}`);
  }

  const signUpUrl = `/sign-up?${sharedQuery.toString()}`;
  const session = await getOptionalSession();

  if (session?.user) {
    if (query.returnTo || venueSlug) {
      redirect(returnPath);
    }

    const destination = await getDashboardDestinationForEmail(
      getUserEmail(session.user),
    );

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
            Ask an admin to add {session.user.email} to a venue, then return here.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Song Selfie
            </Link>
            <SignOutButton />
          </div>
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

        {query.error ? (
          <p className="rounded-xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            That authentication link is invalid or expired. Please sign in again.
          </p>
        ) : null}

        <EmailAuthForm
          mode="sign-in"
          initialEmail={email}
          returnPath={returnPath}
          alternateUrl={signUpUrl}
        />
      </div>
    </main>
  );
}

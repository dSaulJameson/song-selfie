import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { hasClerkClientKeys } from "@/lib/clerk";

type Props = {
  searchParams: Promise<{
    email?: string;
    venue?: string;
    created?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email : "";
  const venueSlug = typeof query.venue === "string" ? query.venue : "";
  const isNewVenue = query.created === "1";
  const returnPath = venueSlug
    ? `/venue?${new URLSearchParams({ venue: venueSlug }).toString()}`
    : "/venue";
  const signInUrl = `/login?${new URLSearchParams({
    ...(email ? { email } : {}),
    ...(venueSlug ? { venue: venueSlug } : {}),
    ...(isNewVenue ? { created: "1" } : {}),
  }).toString()}`;

  if (!hasClerkClientKeys()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08040d,#16091f)] px-4 py-10 text-white">
        <section className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/8 p-6 shadow-[0_18px_50px_rgba(244,63,148,0.16)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-300">
            Auth setup needed
          </p>
          <h1 className="mt-3 text-3xl font-black">Clerk is not configured here yet.</h1>
        </section>
      </main>
    );
  }

  const session = await auth();
  if (session.userId) {
    redirect(returnPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08040d,#16091f)] px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {isNewVenue ? (
          <section className="rounded-[1rem] border border-pink-300/25 bg-pink-500/14 px-4 py-3 text-white shadow-[0_18px_50px_rgba(244,63,148,0.16)]">
            <p className="text-sm font-bold leading-6">
              Claim and verify this dashboard with {email || "the email you entered"}.
            </p>
            {venueSlug ? (
              <p className="mt-2 rounded-lg border border-white/10 bg-black/18 px-3 py-2 font-mono text-xs text-white/70">
                songselfie.com/{venueSlug}
              </p>
            ) : null}
          </section>
        ) : null}

        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl={signInUrl}
          fallbackRedirectUrl={returnPath}
          forceRedirectUrl={returnPath}
          initialValues={email ? { emailAddress: email } : undefined}
        />
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";

import { getOptionalSession } from "@/lib/auth";
import { EmailAuthForm } from "@/src/components/auth/email-auth-form";

type Props = {
  params: Promise<{ "sign-up"?: string[] }>;
  searchParams: Promise<{
    email?: string;
    venue?: string;
    created?: string;
    returnTo?: string;
  }>;
};

function safeReturnPath(value: string | undefined, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export default async function SignUpPage({ params, searchParams }: Props) {
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

  if (route["sign-up"]?.length) {
    redirect(`/sign-up?${sharedQuery.toString()}`);
  }

  const signInUrl = `/login?${sharedQuery.toString()}`;
  const session = await getOptionalSession();

  if (session?.user) {
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

        <EmailAuthForm
          mode="sign-up"
          initialEmail={email}
          returnPath={returnPath}
          alternateUrl={signInUrl}
        />
      </div>
    </main>
  );
}

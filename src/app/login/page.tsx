import { auth, currentUser } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboardDestinationForEmail, getUserEmail } from "@/lib/auth";
import { hasClerkClientKeys } from "@/lib/clerk";

export default async function LoginPage() {
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignIn path="/login" routing="path" fallbackRedirectUrl="/login" signUpUrl="/login" />
    </main>
  );
}

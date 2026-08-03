"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

type EmailAuthFormProps = {
  mode: "sign-in" | "sign-up";
  initialEmail?: string;
  returnPath: string;
  alternateUrl: string;
};

export function EmailAuthForm({
  mode,
  initialEmail = "",
  returnPath,
  alternateUrl,
}: EmailAuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          callbackURL: returnPath,
        });

        if (result.error) {
          throw new Error(result.error.message || "Unable to create your account.");
        }

        setVerificationSent(true);
        return;
      }

      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe: true,
        callbackURL: returnPath,
      });

      if (result.error) {
        if (result.error.status === 403) {
          throw new Error(
            "Please verify your email. We sent a new verification link.",
          );
        }

        throw new Error(result.error.message || "Unable to sign in.");
      }

      window.location.assign(returnPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  if (verificationSent) {
    return (
      <section className="rounded-[1.6rem] border border-pink-300/25 bg-white/8 p-6 text-white shadow-[0_18px_50px_rgba(244,63,148,0.16)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-300">
          Check your email
        </p>
        <h1 className="mt-3 text-3xl font-black">Verify your Song Selfie account.</h1>
        <p className="mt-4 text-sm leading-7 text-white/75">
          We sent a verification link to <strong className="text-white">{email}</strong>.
          Open it to sign in and continue to your dashboard.
        </p>
        <Link
          href={alternateUrl}
          className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
        >
          Back to sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_18px_50px_rgba(244,63,148,0.16)] backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-300">
        {isSignUp ? "Create account" : "Dashboard access"}
      </p>
      <h1 className="mt-3 text-3xl font-black">
        {isSignUp ? "Create your Song Selfie login." : "Sign in to Song Selfie."}
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/65">
        {isSignUp
          ? "Use the email connected to your venue. We’ll verify it before granting dashboard access."
          : "Use your verified admin or venue email."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isSignUp ? (
          <label className="block text-sm font-semibold text-white/85">
            Name
            <input
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-pink-300"
              placeholder="Your name"
            />
          </label>
        ) : null}

        <label className="block text-sm font-semibold text-white/85">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-pink-300"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-semibold text-white/85">
          Password
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-pink-300"
            placeholder="At least 8 characters"
          />
        </label>

        {isSignUp ? (
          <label className="block text-sm font-semibold text-white/85">
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-pink-300"
              placeholder="Repeat your password"
            />
          </label>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[linear-gradient(135deg,#ff4f87,#a855f7)] px-5 py-3 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={alternateUrl} className="font-semibold text-pink-200 hover:text-white">
          {isSignUp ? "Already have an account?" : "Create an account"}
        </Link>
        {!isSignUp ? (
          <Link
            href={`/forgot-password?${new URLSearchParams(email ? { email } : {}).toString()}`}
            className="text-white/60 hover:text-white"
          >
            Forgot password?
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        window.location.assign("/login");
      }}
      className="mt-6 inline-flex rounded-full border border-[color:var(--color-line)] px-5 py-3 text-sm font-semibold text-[color:var(--color-foreground)]"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

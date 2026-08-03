"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const result = await authClient.requestPasswordReset({
      email: email.trim().toLowerCase(),
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setPending(false);
    if (result.error) {
      setError(result.error.message || "Unable to request a password reset.");
      return;
    }

    setSent(true);
  }

  return (
    <section className="w-full rounded-[1.6rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_18px_50px_rgba(244,63,148,0.16)]">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-300">
        Password recovery
      </p>
      <h1 className="mt-3 text-3xl font-black">Reset your password.</h1>
      {sent ? (
        <p className="mt-4 text-sm leading-7 text-white/75">
          If an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-white/85">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-pink-300"
            />
          </label>
          {error ? <p role="alert" className="text-sm text-red-200">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[linear-gradient(135deg,#ff4f87,#a855f7)] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <Link href="/login" className="mt-5 inline-flex text-sm font-semibold text-pink-200 hover:text-white">
        Back to sign in
      </Link>
    </section>
  );
}

export function ResetPasswordForm({ token, invalid }: { token?: string; invalid: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(
    invalid || !token ? "This password reset link is invalid or expired." : "",
  );
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setPending(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);

    if (result.error) {
      setError(result.error.message || "Unable to reset your password.");
      return;
    }

    setComplete(true);
  }

  return (
    <section className="w-full rounded-[1.6rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_18px_50px_rgba(244,63,148,0.16)]">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-300">
        Password recovery
      </p>
      <h1 className="mt-3 text-3xl font-black">
        {complete ? "Password updated." : "Choose a new password."}
      </h1>
      {complete ? (
        <p className="mt-4 text-sm leading-7 text-white/75">
          Your password has been changed. You can sign in now.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-white/85">
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={!token || invalid}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-pink-300 disabled:opacity-50"
            />
          </label>
          <label className="block text-sm font-semibold text-white/85">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={!token || invalid}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-pink-300 disabled:opacity-50"
            />
          </label>
          {error ? <p role="alert" className="text-sm text-red-200">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || !token || invalid}
            className="w-full rounded-full bg-[linear-gradient(135deg,#ff4f87,#a855f7)] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {pending ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      <Link href="/login" className="mt-5 inline-flex text-sm font-semibold text-pink-200 hover:text-white">
        Back to sign in
      </Link>
    </section>
  );
}

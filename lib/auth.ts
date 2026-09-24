import "server-only";

import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { listVenuesByContactEmail } from "@/lib/db";
import { getAdminEmails, getBaseUrl, getDatabaseUrl } from "@/lib/env";
import {
  sendAuthPasswordResetEmail,
  sendAuthVerificationEmail,
} from "@/lib/mailer";

const globalForAuth = globalThis as typeof globalThis & {
  songSelfieAuthPool?: Pool;
};

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const authDatabaseUrl =
  process.env.DATABASE_URL?.trim() ||
  (isProductionBuild
    ? "postgresql://build:build@127.0.0.1:5432/song_selfie_build"
    : getDatabaseUrl());

const authPool =
  globalForAuth.songSelfieAuthPool ??
  new Pool({
    connectionString: authDatabaseUrl,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.songSelfieAuthPool = authPool;
}

const siteUrl = process.env.BETTER_AUTH_URL?.trim() || getBaseUrl();
const authSecret =
  process.env.BETTER_AUTH_SECRET?.trim() ||
  (isProductionBuild
    ? "song-selfie-build-only-secret-not-used-at-runtime"
    : "");

if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET must be configured.");
}

export const auth = betterAuth({
  appName: "Song Selfie",
  baseURL: siteUrl,
  secret: authSecret,
  database: authPool,
  trustedOrigins: [
    ...new Set([
      siteUrl,
      "https://songselfie.com",
      "https://www.songselfie.com",
      "http://localhost:3000",
    ]),
  ],
  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthPasswordResetEmail({ to: user.email, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthVerificationEmail({ to: user.email, url });
    },
  },
  advanced: {
    cookiePrefix: "song_selfie",
    useSecureCookies: siteUrl.startsWith("https://"),
  },
});

export async function getOptionalSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSignedInUser() {
  const session = await getOptionalSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export function getUserEmail(user: { email: string }) {
  return user.email.toLowerCase();
}

export function isAdminEmail(email: string) {
  const admins = getAdminEmails();
  if (admins.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return admins.includes(email.toLowerCase());
}

export async function getDashboardDestinationForEmail(email: string) {
  if (isAdminEmail(email)) {
    return "/admin";
  }

  const venues = await listVenuesByContactEmail(email);
  return venues.length > 0 ? "/venue" : null;
}

export async function requireAdminUser() {
  const user = await requireSignedInUser();
  const email = getUserEmail(user);

  if (!isAdminEmail(email)) {
    redirect("/venue");
  }

  return user;
}

export async function getDashboardActor() {
  const user = await requireSignedInUser();
  const email = getUserEmail(user);
  const dashboardDestination = await getDashboardDestinationForEmail(email);

  return {
    user,
    email,
    isAdmin: isAdminEmail(email),
    hasVenueAccess: dashboardDestination === "/venue" || dashboardDestination === "/admin",
  };
}

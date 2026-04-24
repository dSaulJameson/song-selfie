import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { hasClerkServerKeys } from "@/lib/clerk";
import { getAdminEmails } from "@/lib/env";

export async function requireSignedInUser() {
  if (!hasClerkServerKeys()) {
    redirect("/sign-in");
  }

  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export function getUserEmail(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
}

export function isAdminEmail(email: string) {
  const admins = getAdminEmails();
  if (admins.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return admins.includes(email.toLowerCase());
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

  return {
    user,
    email,
    isAdmin: isAdminEmail(email),
  };
}

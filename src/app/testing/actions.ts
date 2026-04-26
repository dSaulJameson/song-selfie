"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TESTING_ACCESS_COOKIE, TESTING_PASSWORD } from "./constants";

export async function unlockTestingAccessAction(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim().toLowerCase();

  if (password !== TESTING_PASSWORD) {
    redirect("/testing?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(TESTING_ACCESS_COOKIE, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/testing",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/testing");
}

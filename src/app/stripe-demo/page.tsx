import { redirect } from "next/navigation";

export default async function StripeDemoPage() {
  redirect("/generate");
}

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import { hasClerkClientKeys } from "@/lib/clerk";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Song Selfie",
  description:
    "Song Selfie creates original custom songs that become the soundtrack to your memories.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkProxyUrl =
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "https://www.songselfie.com/__clerk";
  const body = hasClerkClientKeys() ? (
    <ClerkProvider proxyUrl={clerkProxyUrl}>{children}</ClerkProvider>
  ) : (
    children
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {body}
      </body>
    </html>
  );
}

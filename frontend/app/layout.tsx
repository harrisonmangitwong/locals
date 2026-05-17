import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "Locals | NYC Restaurant Recommendations",
  description:
    "Eat like a local. Not a tourist. We rank NYC restaurants by how much locals love them, not by tourist hype.",
  openGraph: {
    title: "Locals | Eat like a local. Not a tourist.",
    description:
      "We rank NYC restaurants by how much locals love them — not by how many tourists stumble in. Find your next neighborhood gem.",
    siteName: "Locals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Locals | Eat like a local. Not a tourist.",
    description:
      "We rank NYC restaurants by how much locals love them — not by how many tourists stumble in.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}

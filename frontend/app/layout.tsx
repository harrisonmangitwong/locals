import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const displayFont = Bricolage_Grotesque({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-display-face",
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
    <html lang="en" className={`${plusJakarta.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-nav">Skip to main content</a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

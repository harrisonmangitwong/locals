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
  title: "Locals | Where to eat in NYC tonight",
  description:
    "Most food apps give you endless recs. Locals tells you where to go tonight: a few quick questions, a this-or-that, and one NYC restaurant worth it.",
  openGraph: {
    title: "Locals | Where to eat in NYC tonight",
    description:
      "Most food apps give you endless recs. Locals tells you where to go tonight.",
    siteName: "Locals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Locals | Where to eat in NYC tonight",
    description:
      "Most food apps give you endless recs. Locals tells you where to go tonight.",
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

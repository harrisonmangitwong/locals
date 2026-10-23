import type { Metadata } from "next";

// The page is a client component, so its title lives here.
export const metadata: Metadata = { title: "Your profile" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

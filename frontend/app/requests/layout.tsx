import type { Metadata } from "next";

// The page is a client component, so its title lives here.
export const metadata: Metadata = { title: "Follow requests" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

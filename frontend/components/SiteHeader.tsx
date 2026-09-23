"use client";

import Link from "next/link";
import UserMenu from "./UserMenu";
import GoogleSignInButton from "./GoogleSignInButton";
import { useCurrentUser } from "@/lib/useCurrentUser";

type NavKey = "recs" | "saved" | "visited" | "about";

interface SiteHeaderProps {
  /** Which nav item to render as the current page, if any. */
  current?: NavKey;
}

const NAV_ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: "recs", href: "/recommendations", label: "Recs" },
  { key: "saved", href: "/favorites", label: "Saved" },
  { key: "visited", href: "/visited", label: "Visited" },
  { key: "about", href: "/about", label: "About" },
];

export default function SiteHeader({ current }: SiteHeaderProps) {
  const { user, loading } = useCurrentUser();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
    >
      <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
        Locals
      </Link>
      <nav className="flex items-center gap-3 sm:gap-6">
        {NAV_ITEMS.map((item) => {
          const active = item.key === current;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={
                active
                  ? "text-xs sm:text-sm font-medium"
                  : `text-xs sm:text-sm transition-colors hover:opacity-75${item.key === "about" ? " hidden sm:inline" : ""}`
              }
              style={{ color: active ? "var(--text)" : "var(--text-secondary)" }}
            >
              {item.label}
            </Link>
          );
        })}
        {!loading && !user && (
          <GoogleSignInButton compact label="Sign up" />
        )}
        <UserMenu />
      </nav>
    </header>
  );
}

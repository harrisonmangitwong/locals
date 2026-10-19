"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import GoogleSignInButton from "./GoogleSignInButton";
import Icon, { type IconName } from "./Icon";
import { useCurrentUser } from "@/lib/useCurrentUser";

type NavKey = "pick" | "recs" | "saved" | "visited" | "about";

interface SiteHeaderProps {
  /** Which nav item to render as the current page, if any. */
  current?: NavKey;
  /** Show the floating tab bar on phones. Off for flows that own the
      bottom of the screen (Help me pick). */
  tabBar?: boolean;
}

const NAV_ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: "pick", href: "/pick", label: "Pick" },
  { key: "recs", href: "/recommendations", label: "Browse" },
  { key: "saved", href: "/favorites", label: "Saved" },
  { key: "visited", href: "/visited", label: "Visited" },
  { key: "about", href: "/about", label: "About" },
];

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/pick", label: "Pick", icon: "split" },
  { href: "/recommendations", label: "Browse", icon: "compass" },
  { href: "/favorites", label: "Saved", icon: "bookmark" },
  { href: "/visited", label: "Visited", icon: "circle-check" },
];

function TabBar() {
  const pathname = usePathname();

  // Leave room at the bottom of the page so the bar never covers content.
  useEffect(() => {
    document.body.classList.add("has-tab-bar");
    return () => document.body.classList.remove("has-tab-bar");
  }, []);

  return (
    <nav
      aria-label="Main"
      className="tab-bar md:hidden fixed z-40 left-1/2 -translate-x-1/2 rounded-full p-1 flex gap-0.5"
      style={{ bottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }}
    >
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className="tab-item" aria-current={active ? "page" : undefined}>
            <Icon name={t.icon} size={20} strokeWidth={active ? 2.25 : 1.9} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SiteHeader({ current, tabBar = true }: SiteHeaderProps) {
  const { user, loading } = useCurrentUser();

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center justify-between gap-4 px-4 sm:px-6 h-14"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="text-[19px] font-bold tracking-[-0.025em]" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <nav className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-0.5 mr-2">
            {NAV_ITEMS.map((item) => {
              const active = item.key === current;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="text-[14px] px-3 py-1.5 rounded-full transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{
                    color: active ? "var(--text)" : "var(--text-secondary)",
                    backgroundColor: active ? "var(--bg-subtle)" : undefined,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </span>
          {!loading && !user && (
            <GoogleSignInButton compact label="Sign in" />
          )}
          <UserMenu />
        </nav>
      </header>
      {tabBar && <TabBar />}
    </>
  );
}

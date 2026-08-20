"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile/privacy").then((r) => r.json()).then((d) => setIsPrivate(!!d.is_private)).catch(() => {});
    fetch("/api/follow/requests").then((r) => r.json()).then((d) => setRequestCount((d.requests ?? []).length)).catch(() => {});
  }, [user]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function togglePrivate() {
    const next = !isPrivate;
    setIsPrivate(next);
    try {
      await fetch("/api/profile/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_private: next }),
      });
    } catch {
      setIsPrivate(!next);
    }
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name ?? user.email ?? "?";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="relative flex items-center gap-2 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full"
        style={{ ["--tw-ring-color" as string]: "var(--accent)", ["--tw-ring-offset-color" as string]: "var(--bg)" }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" aria-hidden="true" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {name[0]}
          </div>
        )}
        {requestCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--accent)", border: "1.5px solid var(--bg)" }}
            aria-hidden="true"
          />
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account options"
          className="absolute right-0 mt-2 w-56 rounded-xl py-1 z-50 menu-drop"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        >
          <p className="px-4 py-2 text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>

          <Link
            href="/requests"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-sm transition-opacity hover:opacity-75"
            style={{ color: "var(--text)" }}
          >
            Follow requests
            {requestCount > 0 && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent)", color: "#fff", lineHeight: 1.4 }}
              >
                {requestCount}
              </span>
            )}
          </Link>

          <button
            role="menuitemcheckbox"
            aria-checked={isPrivate}
            onClick={togglePrivate}
            className="w-full flex items-center justify-between px-4 py-2 text-sm transition-opacity hover:opacity-75"
            style={{ color: "var(--text)" }}
          >
            <span>Private account</span>
            <span
              className="relative inline-flex items-center rounded-full transition-colors duration-150"
              style={{ width: 32, height: 18, backgroundColor: isPrivate ? "var(--accent)" : "var(--border-strong)" }}
            >
              <span
                className="absolute rounded-full bg-white transition-transform duration-150"
                style={{ width: 14, height: 14, left: 2, transform: isPrivate ? "translateX(14px)" : "translateX(0)" }}
              />
            </span>
          </button>

          <div style={{ borderTop: "1px solid var(--border)" }} className="my-1" />

          <button
            role="menuitem"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm transition-opacity hover:opacity-75"
            style={{ color: "var(--text)" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

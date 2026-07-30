"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

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
        className="flex items-center gap-2 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full"
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
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account options"
          className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-50 menu-drop"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        >
          <p className="px-4 py-2 text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
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

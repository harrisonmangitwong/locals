"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name ?? user.email ?? "?";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 focus:outline-none">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {name[0]}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-50 shadow-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="px-4 py-2 text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
          <button
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

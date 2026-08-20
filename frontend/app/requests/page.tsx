"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

interface FollowRequest {
  userId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/follow/requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function respond(userId: string, action: "accept" | "decline") {
    setRespondingTo(userId);
    try {
      await fetch("/api/follow/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester_id: userId, action }),
      });
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch {
      // leave it in the list so the user can retry
    } finally {
      setRespondingTo(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/recommendations" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Recs
          </Link>
          <Link href="/favorites" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Saved
          </Link>
          <Link href="/visited" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Visited
          </Link>
          <Link href="/about" className="hidden sm:inline text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            About
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl mb-6" style={{ color: "var(--text)" }}>Follow requests</h1>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>No pending requests</p>
            <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
              When someone with a private account wants to follow you, it&apos;ll show up here.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.userId}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatarUrl} alt="" className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    {r.name[0]}
                  </div>
                )}
                <p className="text-sm font-medium flex-1 truncate" style={{ color: "var(--text)" }}>{r.name}</p>
                <button
                  onClick={() => respond(r.userId, "decline")}
                  disabled={respondingTo === r.userId}
                  className="text-xs font-medium px-3 py-2 rounded-full min-h-[44px] transition-opacity hover:opacity-75 disabled:opacity-50"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)" }}
                >
                  Decline
                </button>
                <button
                  onClick={() => respond(r.userId, "accept")}
                  disabled={respondingTo === r.userId}
                  className="text-xs font-semibold px-3 py-2 rounded-full min-h-[44px] transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

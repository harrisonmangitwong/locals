"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import LockedState from "@/components/LockedState";
import SiteHeader from "@/components/SiteHeader";

interface FollowRequest {
  userId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  isActiveLocal: boolean;
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
      <SiteHeader />

      <main id="main-content" className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <h1 className="font-display text-[34px] md:text-[44px]">Follow requests</h1>

        {loading && (
          <div className="mt-6 flex flex-col gap-4" aria-busy="true" aria-label="Loading requests">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-11 h-11 rounded-full" />
                <div className="skeleton h-4 w-40 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <LockedState
            heading="No requests right now"
            body="When someone asks to follow your private account, they'll show up here."
          />
        )}

        {!loading && requests.length > 0 && (
          <ul className="mt-5">
            {requests.map((r, i) => (
              <li
                key={r.userId}
                className="flex items-center gap-3 py-3"
                style={{ borderTop: i ? "1px solid var(--border)" : undefined }}
              >
                <Avatar url={r.avatarUrl} name={r.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold truncate">{r.name}</p>
                  {r.isActiveLocal && (
                    <p className="flex items-center gap-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      <Icon name="map-pin" size={12} /> Active locally
                    </p>
                  )}
                </div>
                <button
                  onClick={() => respond(r.userId, "accept")}
                  disabled={respondingTo === r.userId}
                  className="soft-btn is-compact px-5 text-[15px] disabled:opacity-40"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(r.userId, "decline")}
                  disabled={respondingTo === r.userId}
                  aria-label={`Decline ${r.name}`}
                  className="row-action disabled:opacity-40"
                >
                  <Icon name="x" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

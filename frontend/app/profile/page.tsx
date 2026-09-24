"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import FollowListModal from "@/components/FollowListModal";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  username: string | null;
  is_private: boolean;
  isActiveLocal: boolean;
}

export default function ProfilePage() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(null);
  const [listModalType, setListModalType] = useState<"followers" | "following" | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setAccountName(u?.user_metadata?.full_name ?? u?.email ?? null);
      setAccountAvatarUrl(u?.user_metadata?.avatar_url ?? null);
    });
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setUsernameInput(d.username ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/follow/counts?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setFollowCounts({ followers: d.followers ?? 0, following: d.following ?? 0 }))
      .catch(() => {});
  }, [user]);

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — try again?");
        return;
      }
      setProfile((prev) => (prev ? { ...prev, username: data.username } : prev));
      setEditing(false);
    } catch {
      setError("Something went wrong — try again?");
    } finally {
      setSaving(false);
    }
  }

  const avatarLetter = accountName ? accountName[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl mb-6" style={{ color: "var(--text)" }}>
          Your profile
        </h1>

        {loading && (
          <div className="flex flex-col gap-3">
            <div className="skeleton h-16 w-16 rounded-full" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        )}

        {!loading && profile && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              {accountAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={accountAvatarUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-16 h-16 rounded-full shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold shrink-0"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  {avatarLetter}
                </div>
              )}
              <div className="flex flex-col gap-1">
                {profile.isActiveLocal && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full self-start"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    Active locally
                  </span>
                )}
                {profile.username && !editing && (
                  <Link
                    href={`/u/${profile.username}`}
                    className="text-sm transition-opacity hover:opacity-75"
                    style={{ color: "var(--accent-text)" }}
                  >
                    View your public profile →
                  </Link>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                Username
              </h2>
              {!editing && (
                <div className="flex items-center gap-3">
                  <p className="text-sm" style={{ color: profile.username ? "var(--text)" : "var(--text-muted)" }}>
                    {profile.username ? `@${profile.username}` : "Not set yet"}
                  </p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm font-medium underline transition-opacity hover:opacity-75"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {profile.username ? "Change" : "Choose one"}
                  </button>
                </div>
              )}
              {editing && (
                <form onSubmit={handleSaveUsername} className="flex flex-col gap-2 max-w-sm">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="your_username"
                    maxLength={20}
                    className="search-input rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", outline: "none" }}
                  />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    3-20 characters: lowercase letters, numbers, and underscores only.
                  </p>
                  {error && (
                    <p className="text-xs" style={{ color: "var(--accent)" }}>{error}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={saving || !usernameInput.trim()}
                      className="cta-btn self-start px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setError(null);
                        setUsernameInput(profile.username ?? "");
                      }}
                      className="text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {followCounts && (
              <div>
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => setListModalType("followers")}
                    className="transition-opacity hover:opacity-75"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <strong style={{ color: "var(--text)" }}>{followCounts.followers}</strong> followers
                  </button>
                  <button
                    onClick={() => setListModalType("following")}
                    className="transition-opacity hover:opacity-75"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <strong style={{ color: "var(--text)" }}>{followCounts.following}</strong> following
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {user && (
        <FollowListModal
          open={listModalType !== null}
          onClose={() => setListModalType(null)}
          userId={user.id}
          type={listModalType ?? "followers"}
        />
      )}
    </div>
  );
}

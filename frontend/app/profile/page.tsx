"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import FollowListModal from "@/components/FollowListModal";
import FollowCounts from "@/components/FollowCounts";
import Chip from "@/components/Chip";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PRICE_TIERS = ["$", "$$", "$$$", "$$$$"];

interface ProfileData {
  username: string | null;
  is_private: boolean;
  isActiveLocal: boolean;
  savedCount: number;
  visitedCount: number;
  preferredNeighborhoods: string[];
  preferredCuisines: string[];
  preferredPrice: string[];
}

export default function ProfilePage() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(null);
  const [listModalType, setListModalType] = useState<"followers" | "following" | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<{ neighborhoods: string[]; cuisines: string[] } | null>(null);
  const [draftNeighborhoods, setDraftNeighborhoods] = useState<string[]>([]);
  const [draftCuisines, setDraftCuisines] = useState<string[]>([]);
  const [draftPrice, setDraftPrice] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setAccountName(u?.user_metadata?.full_name ?? u?.email ?? null);
      setAccountAvatarUrl(u?.user_metadata?.avatar_url ?? null);
    });
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  function loadProfile() {
    setLoading(true);
    setFetchError(false);
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((d) => {
        setProfile(d);
        setUsernameInput(d.username ?? "");
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }

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

  function startEditingPrefs() {
    if (!profile) return;
    setDraftNeighborhoods(profile.preferredNeighborhoods);
    setDraftCuisines(profile.preferredCuisines);
    setDraftPrice(profile.preferredPrice);
    setPrefsError(null);
    setEditingPrefs(true);
    if (!filterOptions) {
      fetch(`${API_BASE}/api/filters`)
        .then((r) => r.json())
        .then((d) => setFilterOptions({ neighborhoods: d.neighborhoods ?? [], cuisines: d.cuisines ?? [] }))
        .catch(() => setFilterOptions({ neighborhoods: [], cuisines: [] }));
    }
  }

  function toggleDraft(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSavePreferences() {
    setSavingPrefs(true);
    setPrefsError(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ neighborhoods: draftNeighborhoods, cuisines: draftCuisines, price: draftPrice }),
      });
      if (!res.ok) throw new Error();
      setProfile((prev) =>
        prev
          ? { ...prev, preferredNeighborhoods: draftNeighborhoods, preferredCuisines: draftCuisines, preferredPrice: draftPrice }
          : prev
      );
      setEditingPrefs(false);
    } catch {
      setPrefsError("Something went wrong — try again?");
    } finally {
      setSavingPrefs(false);
    }
  }

  function handleInvite() {
    if (!user) return;
    const url = `${window.location.origin}${profile?.username ? `/u/${profile.username}` : `/list/${user.id}`}`;
    if (navigator.share) {
      navigator.share({ title: "Follow me on Locals", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
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

        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
              Couldn&apos;t load your profile
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Something went wrong. Try again.
            </p>
            <button
              onClick={loadProfile}
              className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && profile && (
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
                {accountName && (
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    Hi, {accountName}
                  </p>
                )}
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
                On Locals
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href="/favorites"
                  className="flex items-center gap-1 px-3 min-h-[44px] rounded-full transition-colors hover:opacity-75"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                >
                  <strong style={{ color: "var(--text)" }}>{profile.savedCount}</strong> saved
                </Link>
                <Link
                  href="/visited"
                  className="flex items-center gap-1 px-3 min-h-[44px] rounded-full transition-colors hover:opacity-75"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                >
                  <strong style={{ color: "var(--text)" }}>{profile.visitedCount}</strong> visited
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                Username
              </h2>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                This becomes your public link — locals-nyc.com/u/{profile.username ?? "yourname"}
              </p>
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
                  <label htmlFor="username-input" className="sr-only">Username</label>
                  <input
                    id="username-input"
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

            <div>
              <h2 className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                Preferences
              </h2>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Used to seed your recommendations — changeable anytime.
              </p>

              {!editingPrefs && (
                <div className="flex flex-col gap-2">
                  {profile.preferredCuisines.length === 0 &&
                  profile.preferredPrice.length === 0 &&
                  profile.preferredNeighborhoods.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Not set yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {[...profile.preferredCuisines, ...profile.preferredPrice, ...profile.preferredNeighborhoods].map((v) => (
                        <span
                          key={v}
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={startEditingPrefs}
                    className="text-sm font-medium underline transition-opacity hover:opacity-75 self-start"
                    style={{ color: "var(--accent-text)" }}
                  >
                    Change
                  </button>
                </div>
              )}

              {editingPrefs && (
                <div className="flex flex-col gap-6 max-w-xl">
                  <div>
                    <h3 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Cuisines</h3>
                    {!filterOptions ? (
                      <div className="skeleton h-10 w-full rounded-full" />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.cuisines.map((c) => (
                          <Chip key={c} label={c} active={draftCuisines.includes(c)} onClick={() => toggleDraft(draftCuisines, setDraftCuisines, c)} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Typical price range</h3>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_TIERS.map((p) => (
                        <Chip key={p} label={p} active={draftPrice.includes(p)} onClick={() => toggleDraft(draftPrice, setDraftPrice, p)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Neighborhoods</h3>
                    {!filterOptions ? (
                      <div className="skeleton h-10 w-full rounded-full" />
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {filterOptions.neighborhoods.map((n) => (
                          <Chip key={n} label={n} active={draftNeighborhoods.includes(n)} onClick={() => toggleDraft(draftNeighborhoods, setDraftNeighborhoods, n)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {prefsError && (
                    <p className="text-xs" style={{ color: "var(--accent)" }}>{prefsError}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSavePreferences}
                      disabled={savingPrefs}
                      className="cta-btn self-start px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
                    >
                      {savingPrefs ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPrefs(false);
                        setPrefsError(null);
                      }}
                      className="text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {followCounts && (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FollowCounts
                    followers={followCounts.followers}
                    following={followCounts.following}
                    onSelect={setListModalType}
                  />
                  <button
                    onClick={handleInvite}
                    className="flex items-center gap-2 px-4 min-h-[44px] rounded-full text-sm font-medium transition-opacity hover:opacity-75"
                    style={{ border: "1px solid var(--border-strong)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    {copied ? "Link copied!" : "Share"}
                  </button>
                </div>
                {followCounts.followers === 0 && (
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    You&apos;re one of the first Locals here — share your profile to get followers.
                  </p>
                )}
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

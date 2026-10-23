"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import FollowListModal from "@/components/FollowListModal";
import FollowCounts from "@/components/FollowCounts";
import PriceSlider from "@/components/PriceSlider";
import ExpandableChipGroup from "@/components/ExpandableChipGroup";
import NeighborhoodPicker from "@/components/NeighborhoodPicker";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import { CUISINE_ORIGINS } from "@/lib/cuisineOrigins";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MAX_BIO_LENGTH = 280;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProfileData {
  username: string | null;
  is_private: boolean;
  isActiveLocal: boolean;
  savedCount: number;
  visitedCount: number;
  preferredNeighborhoods: string[];
  preferredCuisines: string[];
  preferredPrice: number | null;
  bio: string | null;
  avatarUrl: string | null;
}

// One line of a settings list: label on the left, value or action on the
// right, a hairline between lines. Editing expands below it in place.
function SettingRow({ label, value, action, children, first }: { label: string; value?: ReactNode; action?: ReactNode; children?: ReactNode; first?: boolean }) {
  return (
    <div className="py-3.5" style={{ borderTop: first ? undefined : "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-4 min-h-[44px]">
        <div className="min-w-0">
          <p className="text-[16px] font-medium">{label}</p>
          {value != null && <div className="text-[15px] mt-0.5 [overflow-wrap:anywhere]" style={{ color: "var(--text-secondary)" }}>{value}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function TextAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="min-h-[44px] px-3 -mr-3 rounded-full text-[15px] font-medium transition-colors hover:bg-[var(--bg-subtle)]">
      {children}
    </button>
  );
}

function SaveCancel({ saving, disabled, onCancel, onSave }: { saving: boolean; disabled?: boolean; onCancel: () => void; onSave?: () => void }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <button type={onSave ? "button" : "submit"} onClick={onSave} disabled={saving || disabled} className="cta-btn px-6 text-[15px] disabled:opacity-40">
        {saving ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={onCancel} className="soft-btn px-6 text-[15px]">Cancel</button>
    </div>
  );
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
  const [draftPrice, setDraftPrice] = useState<number | null>(null);
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setError(data.error ?? "Couldn’t save that. Try again?");
        return;
      }
      setProfile((prev) => (prev ? { ...prev, username: data.username } : prev));
      setEditing(false);
    } catch {
      setError("Couldn’t save that. Try again?");
    } finally {
      setSaving(false);
    }
  }

  function startEditingBio() {
    setBioInput(profile?.bio ?? "");
    setBioError(null);
    setEditingBio(true);
  }

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault();
    setSavingBio(true);
    setBioError(null);
    try {
      const res = await fetch("/api/profile/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBioError(data.error ?? "Couldn’t save that. Try again?");
        return;
      }
      setProfile((prev) => (prev ? { ...prev, bio: data.bio } : prev));
      setEditingBio(false);
    } catch {
      setBioError("Couldn’t save that. Try again?");
    } finally {
      setSavingBio(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setAvatarError(null);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 5MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(`${user.id}/avatar`, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/avatar`);
      const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const res = await fetch("/api/profile/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      if (!res.ok) throw new Error("Failed to save photo");

      setProfile((prev) => (prev ? { ...prev, avatarUrl } : prev));
    } catch {
      setAvatarError("Couldn’t upload that photo. Try again?");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function startEditingPrefs() {
    if (!profile) return;
    setDraftNeighborhoods(profile.preferredNeighborhoods);
    setDraftCuisines(profile.preferredCuisines);
    setDraftPrice(profile.preferredPrice);
    setShowAllCuisines(false);
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
      setPrefsError("Couldn’t save that. Try again?");
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

  const hasPrefs = !!profile && (profile.preferredCuisines.length > 0 || profile.preferredPrice !== null || profile.preferredNeighborhoods.length > 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <main id="main-content" className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-14">
        <h1 className="sr-only">Your profile</h1>

        {loading && (
          <div className="flex flex-col items-center gap-3" aria-busy="true" aria-label="Loading profile">
            <div className="skeleton w-24 h-24 rounded-full" />
            <div className="skeleton h-7 w-40 rounded-lg" />
            <div className="skeleton h-4 w-28 rounded" />
          </div>
        )}

        {!loading && fetchError && (
          <div className="flex flex-col items-center text-center py-20 gap-3">
            <p className="text-[19px] font-semibold">Couldn&rsquo;t load your profile</p>
            <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>Check your connection and try again.</p>
            <button onClick={loadProfile} className="soft-btn px-6 text-[15px] mt-2">Try again</button>
          </div>
        )}

        {!loading && !fetchError && profile && (
          <>
            {/* Who you are, as others see it. */}
            <div className="flex flex-col items-center text-center rise" style={{ "--i": 0 } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-full transition-opacity hover:opacity-85 disabled:opacity-50"
                aria-label="Change profile photo"
              >
                <Avatar url={profile.avatarUrl ?? accountAvatarUrl} name={accountName} size="xl" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="sr-only" tabIndex={-1} aria-label="Upload a profile photo" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="min-h-[44px] px-3 mt-1 rounded-full text-[14px] font-medium transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ color: "var(--text-secondary)" }}
              >
                {uploadingAvatar ? "Uploading…" : "Change photo"}
              </button>
              {avatarError && <p role="alert" className="text-[13px]" style={{ color: "var(--text)" }}>{avatarError}</p>}

              <p className="font-display text-[30px] md:text-[34px] text-balance [overflow-wrap:anywhere] mt-2">{accountName ?? "You"}</p>
              {profile.isActiveLocal && (
                <p className="flex items-center gap-1.5 text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  <Icon name="map-pin" size={14} /> Active locally
                </p>
              )}
              {followCounts && (
                <div className="mt-2">
                  <FollowCounts followers={followCounts.followers} following={followCounts.following} onSelect={setListModalType} />
                </div>
              )}
              <div className="flex items-center gap-2.5 mt-3 w-full max-w-xs">
                {profile.username && (
                  <Link href={`/u/${profile.username}`} className="soft-btn flex-1 inline-flex items-center justify-center text-[15px]">
                    Public profile
                  </Link>
                )}
                <button onClick={handleInvite} className={`soft-btn inline-flex items-center justify-center gap-2 text-[15px] ${profile.username ? "px-5" : "flex-1"}`}>
                  <Icon name="share" size={16} />
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
              {followCounts && followCounts.followers === 0 && (
                <p className="text-[13px] mt-3 max-w-[34ch]" style={{ color: "var(--text-muted)" }}>
                  You&rsquo;re one of the first Locals here. Share your profile to get followers.
                </p>
              )}
            </div>

            <section className="mt-10 rise" style={{ "--i": 1 } as React.CSSProperties} aria-label="Your lists">
              <Link href="/favorites" className="flex items-center justify-between min-h-[52px] py-2 transition-opacity hover:opacity-70">
                <span className="text-[16px] font-medium">Saved</span>
                <span className="flex items-center gap-1 text-[15px] tabular-nums" style={{ color: "var(--text-secondary)" }}>{profile.savedCount}<Icon name="chevron-right" size={16} /></span>
              </Link>
              <Link href="/visited" className="flex items-center justify-between min-h-[52px] py-2 transition-opacity hover:opacity-70" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-[16px] font-medium">Visited</span>
                <span className="flex items-center gap-1 text-[15px] tabular-nums" style={{ color: "var(--text-secondary)" }}>{profile.visitedCount}<Icon name="chevron-right" size={16} /></span>
              </Link>
            </section>

            <section className="mt-8 rise" style={{ "--i": 2 } as React.CSSProperties} aria-labelledby="settings-heading">
              <h2 id="settings-heading" className="text-[21px] font-semibold tracking-[-0.015em] mb-1">Profile</h2>

              <SettingRow
                first
                label="Username"
                value={editing ? `locals-nyc.com/u/${usernameInput || "yourname"}` : profile.username ? `@${profile.username}` : "Not set yet"}
                action={!editing && <TextAction onClick={() => setEditing(true)}>{profile.username ? "Change" : "Choose one"}</TextAction>}
              >
                {editing && (
                  <form onSubmit={handleSaveUsername} className="fade-up flex flex-col gap-2 mt-3">
                    <label htmlFor="username-input" className="sr-only">Username</label>
                    <input
                      id="username-input"
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="your_username"
                      maxLength={20}
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-invalid={!!error}
                      aria-describedby={`username-hint${error ? " username-error" : ""}`}
                      className="search-field h-11 rounded-xl px-4 text-[15px]"
                    />
                    <p id="username-hint" className="text-[13px]" style={{ color: "var(--text-muted)" }}>3 to 20 characters: lowercase letters, numbers and underscores.</p>
                    {error && <p id="username-error" role="alert" className="text-[13px]" style={{ color: "var(--text)" }}>{error}</p>}
                    <SaveCancel
                      saving={saving}
                      disabled={!usernameInput.trim()}
                      onCancel={() => { setEditing(false); setError(null); setUsernameInput(profile.username ?? ""); }}
                    />
                  </form>
                )}
              </SettingRow>

              <SettingRow
                label="Bio"
                value={!editingBio && (profile.bio || "Not set yet")}
                action={!editingBio && <TextAction onClick={startEditingBio}>{profile.bio ? "Change" : "Add"}</TextAction>}
              >
                {editingBio && (
                  <form onSubmit={handleSaveBio} className="fade-up flex flex-col gap-2 mt-3">
                    <label htmlFor="bio-input" className="sr-only">Bio</label>
                    <textarea
                      id="bio-input"
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="A line about you and how you eat around the city"
                      maxLength={MAX_BIO_LENGTH}
                      rows={3}
                      autoFocus
                      aria-invalid={!!bioError}
                      aria-describedby={`bio-count${bioError ? " bio-error" : ""}`}
                      className="search-field rounded-xl px-4 py-3 text-[15px] resize-none"
                    />
                    <p id="bio-count" className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>{bioInput.length}/{MAX_BIO_LENGTH}</p>
                    {bioError && <p id="bio-error" role="alert" className="text-[13px]" style={{ color: "var(--text)" }}>{bioError}</p>}
                    <SaveCancel saving={savingBio} onCancel={() => { setEditingBio(false); setBioError(null); }} />
                  </form>
                )}
              </SettingRow>

              <SettingRow
                label="Taste"
                value={!editingPrefs && (hasPrefs
                  ? [
                      profile.preferredPrice !== null ? (profile.preferredPrice >= 100 ? "$100+ a person" : `About $${profile.preferredPrice} a person`) : null,
                      ...profile.preferredCuisines,
                      ...profile.preferredNeighborhoods,
                    ].filter(Boolean).join(" · ")
                  : "Not set yet")}
                action={!editingPrefs && <TextAction onClick={startEditingPrefs}>{hasPrefs ? "Change" : "Add"}</TextAction>}
              >
                {editingPrefs && (
                  <div className="fade-up flex flex-col gap-6 mt-3">
                    <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Used to start your recommendations. Change it anytime.</p>
                    <div>
                      <h3 className="text-[15px] font-semibold mb-2">Cuisines</h3>
                      {!filterOptions ? (
                        <div className="skeleton h-10 w-full rounded-full" />
                      ) : (
                        <ExpandableChipGroup
                          options={filterOptions.cuisines.filter((c) => CUISINE_ORIGINS.has(c))}
                          selected={draftCuisines}
                          onToggle={(c) => toggleDraft(draftCuisines, setDraftCuisines, c)}
                          expanded={showAllCuisines}
                          onToggleExpanded={() => setShowAllCuisines((v) => !v)}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold mb-2">Typical price</h3>
                      <PriceSlider value={draftPrice} onChange={setDraftPrice} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold mb-2">Neighborhoods</h3>
                      {!filterOptions ? (
                        <div className="skeleton h-10 w-full rounded-full" />
                      ) : (
                        <NeighborhoodPicker
                          options={filterOptions.neighborhoods}
                          selected={draftNeighborhoods}
                          onToggle={(n) => toggleDraft(draftNeighborhoods, setDraftNeighborhoods, n)}
                        />
                      )}
                    </div>
                    {prefsError && <p role="alert" className="text-[13px]" style={{ color: "var(--text)" }}>{prefsError}</p>}
                    <SaveCancel saving={savingPrefs} onSave={handleSavePreferences} onCancel={() => { setEditingPrefs(false); setPrefsError(null); }} />
                  </div>
                )}
              </SettingRow>
            </section>
          </>
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

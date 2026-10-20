"use client";

import { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import BrowseRow, { RowsSkeleton, rowCandidate } from "@/components/BrowseRow";
import Icon from "@/components/Icon";
import LockedState from "@/components/LockedState";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import SiteHeader from "@/components/SiteHeader";
import SignInPrompt from "@/components/SignInPrompt";
import FollowListModal from "@/components/FollowListModal";
import FollowCounts from "@/components/FollowCounts";
import Avatar from "@/components/Avatar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { Bucket } from "@/lib/ranking";

interface Restaurant {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  num_reviews: number;
  total_score: number;
  review_count: number;
  url: string;
  rank: number;
  image_url: string;
  price_midpoint: number | null;
  [key: string]: unknown;
}

type FollowStatus = "self" | "accepted" | "pending" | "none" | null;

interface PublicProfileProps {
  /** Provide exactly one of these -- the identity to resolve and display. */
  userId?: string;
  username?: string;
}

export default function PublicProfile({ userId: userIdProp, username }: PublicProfileProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerBio, setOwnerBio] = useState<string | null>(null);
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState<string | null>(null);
  const [ownerIsActiveLocal, setOwnerIsActiveLocal] = useState(false);
  const [ownerIsPrivate, setOwnerIsPrivate] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followedSaveCounts, setFollowedSaveCounts] = useState<Record<string, number>>({});
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(null);
  const [listModalType, setListModalType] = useState<"followers" | "following" | null>(null);
  const { user } = useCurrentUser();
  const [signInReason, setSignInReason] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // The viewer's own saves and ratings, so their bookmark shows true state
  // on someone else's list.
  const [mySaved, setMySaved] = useState<Set<string>>(new Set());
  const [myRatings, setMyRatings] = useState<Record<string, Bucket>>({});

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/saved").then((r) => r.json()).catch(() => ({ ids: [] })),
      fetch("/api/ratings").then((r) => r.json()).catch(() => ({ ratings: [] })),
    ]).then(([saved, ratings]) => {
      setMySaved(new Set(saved.ids ?? []));
      const map: Record<string, Bucket> = {};
      for (const r of ratings.ratings ?? []) map[r.restaurant_id] = r.bucket;
      setMyRatings(map);
    });
  }, [user]);

  const identityQuery = userIdProp ? `userId=${userIdProp}` : `username=${username}`;

  useEffect(() => {
    fetch(`/api/public/saved?${identityQuery}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error || !d.userId) {
          setNotFound(true);
          return;
        }
        setResolvedUserId(d.userId);
        setRestaurants(d.results ?? []);
        setOwnerName(d.name ?? null);
        setOwnerBio(d.bio ?? null);
        setOwnerAvatarUrl(d.avatarUrl ?? null);
        setOwnerIsActiveLocal(!!d.isActiveLocal);
        setOwnerIsPrivate(!!d.isPrivate);

        const ids = (d.results ?? []).map((r: Restaurant) => r.restaurant_id).join(",");
        if (ids) {
          fetch(`/api/follow-save-counts?ids=${ids}`)
            .then((r) => r.json())
            .then((fd) => setFollowedSaveCounts(fd.counts ?? {}))
            .catch(() => {});
        }

        fetch(`/api/follow/counts?userId=${d.userId}`)
          .then((r) => r.json())
          .then((cd) => setFollowCounts({ followers: cd.followers ?? 0, following: cd.following ?? 0 }))
          .catch(() => {});

        fetch(`/api/follow/status?userId=${d.userId}`)
          .then((r) => r.json())
          .then((sd) => setFollowStatus(sd.status ?? "none"))
          .catch(() => setFollowStatus("none"));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [identityQuery]);

  async function handleFollow() {
    if (!user) {
      setSignInReason("Sign in to follow people");
      return;
    }
    if (!resolvedUserId) return;
    setFollowBusy(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: resolvedUserId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFollowStatus(data.status ?? "accepted");
    } catch {
      // leave status as-is on failure
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleUnfollow() {
    if (!resolvedUserId) return;
    setFollowBusy(true);
    const prev = followStatus;
    setFollowStatus("none");
    try {
      await fetch("/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: resolvedUserId }),
      });
    } catch {
      setFollowStatus(prev);
    } finally {
      setFollowBusy(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${ownerName ?? "Someone"}'s NYC picks on Locals`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

  // The API already withholds the actual saved list for a private profile
  // unless the viewer is the owner or an accepted follower -- this just
  // decides which message to show in its place. followStatus starts null
  // while its own fetch is in flight, which correctly falls through to
  // "gated" (the safe default) rather than briefly showing content.
  const isGated = ownerIsPrivate && followStatus !== "self" && followStatus !== "accepted";

  const firstName = ownerName?.split(" ")[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-14">
        {loading && (
          <>
            <div className="flex flex-col items-center gap-3 mb-10" aria-hidden="true">
              <div className="skeleton w-24 h-24 rounded-full" />
              <div className="skeleton h-8 w-48 rounded-lg" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
            <RowsSkeleton count={4} />
          </>
        )}

        {!loading && notFound && (
          <LockedState
            heading="Couldn’t find that profile"
            body="This link may be out of date."
            cta={<Link href="/recommendations" className="cta-btn inline-flex items-center justify-center px-7 text-[15px]">Browse all places</Link>}
          />
        )}

        {!loading && !notFound && resolvedUserId && (
          <>
            {/* Who: centered, like a profile on iOS. */}
            <div className="flex flex-col items-center text-center rise" style={{ "--i": 0 } as CSSProperties}>
              <Avatar url={ownerAvatarUrl} name={ownerName} size="xl" />
              <h1 className="font-display text-[30px] md:text-[38px] text-balance [overflow-wrap:anywhere] mt-4">{ownerName ?? "Locals member"}</h1>
              {ownerIsActiveLocal && (
                <p className="flex items-center gap-1.5 text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  <Icon name="map-pin" size={14} /> Active locally
                </p>
              )}
              {ownerBio && (
                <p className="text-[16px] leading-relaxed mt-3 max-w-[44ch] text-pretty [overflow-wrap:anywhere]" style={{ color: "var(--text-secondary)" }}>
                  {ownerBio}
                </p>
              )}
              {followCounts && (
                <div className="mt-2">
                  <FollowCounts followers={followCounts.followers} following={followCounts.following} onSelect={setListModalType} />
                </div>
              )}
              <div className="flex items-center gap-2.5 mt-4 w-full max-w-xs">
                {followStatus === "none" && (
                  <button onClick={handleFollow} disabled={followBusy} className="cta-btn flex-1 text-[15px] disabled:opacity-50">
                    Follow
                  </button>
                )}
                {(followStatus === "pending" || followStatus === "accepted") && (
                  <button onClick={handleUnfollow} disabled={followBusy} className="soft-btn flex-1 text-[15px] disabled:opacity-50">
                    {followStatus === "pending" ? "Requested" : "Following"}
                  </button>
                )}
                {followStatus === "self" && (
                  <Link href="/profile" className="soft-btn flex-1 inline-flex items-center justify-center text-[15px]">Edit profile</Link>
                )}
                <button onClick={handleShare} className={`soft-btn inline-flex items-center justify-center gap-2 text-[15px] ${followStatus === null ? "flex-1" : "px-5"}`}>
                  <Icon name="share" size={16} />
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
            </div>

            <section className="mt-12 rise" style={{ "--i": 1 } as CSSProperties} aria-labelledby="their-saves">
              <h2 id="their-saves" className="text-[21px] font-semibold tracking-[-0.015em] mb-5 [overflow-wrap:anywhere]">
                {firstName ? `${firstName}\u2019s saved places` : "Saved places"}
                {!isGated && restaurants.length > 0 && (
                  <span className="font-normal tabular-nums ml-1.5" style={{ color: "var(--text-muted)" }}>{restaurants.length}</span>
                )}
              </h2>

              {isGated ? (
                <LockedState
                  heading="This account is private"
                  body={`Follow ${firstName ?? "them"} to see their saved places.`}
                />
              ) : restaurants.length === 0 ? (
                <LockedState
                  heading="Nothing saved yet"
                  body={firstName ? `${firstName} hasn\u2019t saved anything on Locals yet.` : "They haven\u2019t saved anything on Locals yet."}
                />
              ) : (
                <ScrollSpotlight watch={restaurants.map((r) => r.restaurant_id).join(",")}>
                  <ul className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                    {restaurants.map((r, i) => (
                      <li key={r.restaurant_id} className="rise" style={{ "--i": Math.min(i + 2, 8) } as CSSProperties}>
                        <BrowseRow
                          c={rowCandidate(r)}
                          initialSaved={mySaved.has(r.restaurant_id)}
                          initialBucket={myRatings[r.restaurant_id] ?? null}
                          followedSaveCount={followedSaveCounts[r.restaurant_id]}
                          onRated={(id, bucket) => setMyRatings((prev) => ({ ...prev, [id]: bucket }))}
                        />
                      </li>
                    ))}
                  </ul>
                </ScrollSpotlight>
              )}
            </section>
          </>
        )}
      </main>

      {resolvedUserId && (
        <FollowListModal
          open={listModalType !== null}
          onClose={() => setListModalType(null)}
          userId={resolvedUserId}
          type={listModalType ?? "followers"}
        />
      )}

      <SignInPrompt
        open={signInReason !== null}
        reason={signInReason ?? ""}
        onClose={() => setSignInReason(null)}
      />
    </div>
  );
}

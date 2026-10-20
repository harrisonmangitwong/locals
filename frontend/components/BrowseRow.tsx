"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import RateRestaurantFlow from "@/components/RateRestaurantFlow";
import SignInPrompt from "@/components/SignInPrompt";
import { type Candidate, PlaceRow } from "@/components/PickCard";
import { BUCKETS, TAG_LABELS, type Bucket, type Tag } from "@/lib/ranking";
import { useCurrentUser } from "@/lib/useCurrentUser";

const BUCKET_LABELS = Object.fromEntries(BUCKETS.map((b) => [b.key, b.label])) as Record<Bucket, string>;

// A place in a list you act on (Browse, Saved, Visited): the homepage row,
// plus save and "been here" on the right. Visited adds your rank as a
// leading numeral and your score under the row. The whole row lifts on hover (or at mid-screen on phones, via
// ScrollSpotlight); the link and the buttons are siblings, never nested.
export default function BrowseRow({
  c,
  isOpenNow,
  initialSaved = false,
  initialBucket = null,
  saveCount,
  followedSaveCount,
  onRated,
  onUnsave,
  rank,
  ratingScore,
  ratingTags,
}: {
  c: Candidate;
  isOpenNow?: boolean | null;
  initialSaved?: boolean;
  initialBucket?: Bucket | null;
  saveCount?: number;
  followedSaveCount?: number;
  onRated?: (id: string, bucket: Bucket) => void;
  onUnsave?: (id: string) => void;
  rank?: number;
  ratingScore?: number;
  ratingTags?: Tag[];
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [bucket, setBucket] = useState<Bucket | null>(initialBucket);
  const [pop, setPop] = useState(false);
  const [ratedPop, setRatedPop] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [rating, setRating] = useState(false);
  const [signInReason, setSignInReason] = useState<string | null>(null);
  const { user } = useCurrentUser();
  // One save request at a time: a double tap can't race itself into the
  // wrong state.
  const saving = useRef(false);

  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);
  useEffect(() => { setBucket(initialBucket); }, [initialBucket]);

  function toggleSave() {
    if (!user) {
      setSignInReason("Sign in to save restaurants");
      return;
    }
    if (saving.current) return;
    saving.current = true;
    const was = saved;
    setSaved(!was);
    setSaveError(false);
    if (!was) { setPop(true); setTimeout(() => setPop(false), 400); }
    if (was) onUnsave?.(c.restaurant_id);
    fetch("/api/saved", {
      method: was ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant_id: c.restaurant_id }),
    }).then((res) => {
      if (res.status === 401) {
        setSaved(was);
        setSignInReason("Your session ended. Sign in again to save.");
        return;
      }
      if (!res.ok) throw new Error();
    }).catch(() => { setSaved(was); setSaveError(true); })
      .finally(() => { saving.current = false; });
  }

  const yours = bucket && ratingScore != null
    ? [`Your score ${ratingScore.toFixed(1)}`, ...(ratingTags ?? []).map((t) => TAG_LABELS[t])].join(" · ")
    : bucket
      ? `You've been: ${BUCKET_LABELS[bucket]}`
      : null;
  const social = followedSaveCount
    ? `${followedSaveCount === 1 ? "1 person" : `${followedSaveCount} people`} you follow saved this`
    : saveCount
      ? `${saveCount} ${saveCount === 1 ? "person" : "people"} saved this`
      : null;

  return (
    <div className={`row-link relative grid ${rank != null ? "grid-cols-[22px_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"} items-start gap-2 rounded-2xl p-2.5 -m-2.5`}>
      {rank != null && (
        <span className="text-[15px] font-semibold tabular-nums pt-1 text-center" style={{ color: "var(--text-muted)" }}>{rank}</span>
      )}
      <Link href={`/restaurant/${c.restaurant_id}`} className="block min-w-0 rounded-xl" aria-label={`${c.name}, ${c.neighborhood}`}>
        <PlaceRow c={c} tag={isOpenNow ? "Open now" : undefined} />
        {(yours || social || saveError) && (
          <span key={yours ? `y-${bucket}` : "s"} className={`block text-[13px] mt-1.5 pl-[90px]${ratedPop ? " fade-up" : ""}`} style={{ color: yours || followedSaveCount ? "var(--text)" : "var(--text-muted)" }}>
            {saveError ? "Couldn’t save. Try again?" : yours ?? social}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-1">
        {!bucket && (
          <button
            onClick={toggleSave}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${c.name} from saved` : `Save ${c.name}`}
            className="row-action"
          >
            <span className={pop ? "heart-pop" : undefined}>
              <Icon name="bookmark" size={18} className={saved ? "fill-current" : undefined} />
            </span>
          </button>
        )}
        <button
          onClick={() => (user ? setRating(true) : setSignInReason("Sign in to rate a restaurant"))}
          aria-label={bucket ? `Edit your rating of ${c.name}` : `Been to ${c.name}? Rate it`}
          className={`row-action${bucket ? " is-on" : ""}`}
        >
          <span className={ratedPop ? "heart-pop" : undefined}>
            <Icon name="circle-check" size={18} />
          </span>
        </button>
      </div>

      {/* Both dialogs portal themselves to <body>, so the row's lift
          transform can't trap their fixed positioning. */}
      {rating && (
        <RateRestaurantFlow
          restaurantId={c.restaurant_id}
          restaurantName={c.name}
          restaurantPhotoUrl={c.image_url ?? undefined}
          onClose={() => setRating(false)}
          onComplete={(b) => {
            setRating(false);
            setBucket(b);
            setSaved(false);
            setRatedPop(true);
            setTimeout(() => setRatedPop(false), 600);
            onRated?.(c.restaurant_id, b);
          }}
        />
      )}
      <SignInPrompt open={signInReason !== null} reason={signInReason ?? ""} onClose={() => setSignInReason(null)} />
    </div>
  );
}

// A restaurant as the list APIs return it, shaped for the row.
export interface ListRestaurant {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  total_score: number;
  image_url: string;
  price_midpoint?: number | null;
  local_weighted_rating?: number;
  tourist_weighted_rating?: number;
}

export function rowCandidate(r: ListRestaurant): Candidate {
  return {
    restaurant_id: r.restaurant_id,
    name: r.name,
    neighborhood: r.neighborhood,
    cuisine: r.cuisine,
    price_midpoint: r.price_midpoint ?? null,
    image_url: r.image_url || null,
    lat: 0,
    lng: 0,
    local_weighted_rating: r.local_weighted_rating ?? r.total_score,
    tourist_weighted_rating: r.tourist_weighted_rating ?? r.total_score,
    distance_mi: null,
    dishes: [],
    vibe: null,
    wait_note: null,
  };
}

// First-load placeholder in the rows' own shape.
export function RowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid md:grid-cols-2 gap-x-10 gap-y-6" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="grid grid-cols-[76px_minmax(0,1fr)] gap-3.5">
          <div className="skeleton w-[76px] h-[76px] rounded-xl" />
          <div className="space-y-2 pt-1">
            <div className="skeleton h-4 w-3/5 rounded" />
            <div className="skeleton h-3 w-2/5 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

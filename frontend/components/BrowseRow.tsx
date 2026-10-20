"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Icon from "@/components/Icon";
import RateRestaurantFlow from "@/components/RateRestaurantFlow";
import SignInPrompt from "@/components/SignInPrompt";
import { type Candidate, PlaceRow } from "@/components/PickCard";
import { BUCKETS, type Bucket } from "@/lib/ranking";
import { useCurrentUser } from "@/lib/useCurrentUser";

const BUCKET_LABELS = Object.fromEntries(BUCKETS.map((b) => [b.key, b.label])) as Record<Bucket, string>;

// A place in Browse: the homepage row, plus save and "been here" on the
// right. The whole row lifts on hover (or at mid-screen on phones, via
// ScrollSpotlight); the link and the buttons are siblings, never nested.
export default function BrowseRow({
  c,
  isOpenNow,
  initialSaved = false,
  initialBucket = null,
  saveCount,
  followedSaveCount,
  onRated,
}: {
  c: Candidate;
  isOpenNow?: boolean | null;
  initialSaved?: boolean;
  initialBucket?: Bucket | null;
  saveCount?: number;
  followedSaveCount?: number;
  onRated?: (id: string, bucket: Bucket) => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [bucket, setBucket] = useState<Bucket | null>(initialBucket);
  const [pop, setPop] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [rating, setRating] = useState(false);
  const [signInReason, setSignInReason] = useState<string | null>(null);
  const { user } = useCurrentUser();

  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);
  useEffect(() => { setBucket(initialBucket); }, [initialBucket]);

  function toggleSave() {
    if (!user) {
      setSignInReason("Sign in to save restaurants");
      return;
    }
    const was = saved;
    setSaved(!was);
    setSaveError(false);
    if (!was) { setPop(true); setTimeout(() => setPop(false), 400); }
    fetch("/api/saved", {
      method: was ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant_id: c.restaurant_id }),
    }).then((res) => {
      if (!res.ok) throw new Error();
    }).catch(() => { setSaved(was); setSaveError(true); });
  }

  const social = followedSaveCount
    ? `${followedSaveCount === 1 ? "1 person" : `${followedSaveCount} people`} you follow saved this`
    : saveCount
      ? `${saveCount} ${saveCount === 1 ? "person" : "people"} saved this`
      : null;

  return (
    <div className="row-link relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-2xl p-2.5 -m-2.5">
      <Link href={`/restaurant/${c.restaurant_id}`} className="block min-w-0 rounded-xl" aria-label={`${c.name}, ${c.neighborhood}`}>
        <PlaceRow c={c} tag={isOpenNow ? "Open now" : undefined} />
        {(bucket || social || saveError) && (
          <span className="block text-[13px] mt-1.5 pl-[90px]" style={{ color: bucket || followedSaveCount ? "var(--text)" : "var(--text-muted)" }}>
            {saveError ? "Couldn't save, try again" : bucket ? `You've been: ${BUCKET_LABELS[bucket]}` : social}
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
          <Icon name="circle-check" size={18} />
        </button>
      </div>

      {/* Portaled: the row transforms when it lifts, which would trap a
          fixed-position modal inside it. */}
      {rating && createPortal(
        <RateRestaurantFlow
          restaurantId={c.restaurant_id}
          restaurantName={c.name}
          restaurantPhotoUrl={c.image_url ?? undefined}
          onClose={() => setRating(false)}
          onComplete={(b) => {
            setRating(false);
            setBucket(b);
            setSaved(false);
            onRated?.(c.restaurant_id, b);
          }}
        />,
        document.body,
      )}
      {signInReason !== null && createPortal(
        <SignInPrompt open reason={signInReason} onClose={() => setSignInReason(null)} />,
        document.body,
      )}
    </div>
  );
}

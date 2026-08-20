"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPhotoUrl } from "@/lib/photoFallback";
import { ARCHETYPES, isArchetype } from "@/lib/archetypes";
import { BUCKETS, TAG_LABELS, type Bucket, type Tag } from "@/lib/ranking";
import RateRestaurantFlow from "./RateRestaurantFlow";

const BUCKET_LABELS: Record<Bucket, string> = Object.fromEntries(BUCKETS.map((b) => [b.key, b.label])) as Record<Bucket, string>;

async function toggleSaved(id: string, currently: boolean): Promise<boolean> {
  await fetch("/api/saved", {
    method: currently ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurant_id: id }),
  });
  return !currently;
}

export interface RestaurantCardProps {
  restaurantId: string;
  rank: number;
  name: string;
  neighborhood: string;
  cuisine: string;
  reviews: number;
  rating: number;
  mapsUrl: string;
  photoUrl?: string;
  price?: string;
  archetype?: string | null;
  isOpenNow?: boolean | null;
  initialSaved?: boolean;
  initialBucket?: Bucket | null;
  /** Overrides the top-left "#N" badge — e.g. a personal rank-within-bucket instead of the global recommendation rank */
  rankOverride?: number;
  /** Your own interpolated score for this restaurant, if rated — shown next to the bucket label */
  ratingScore?: number;
  /** Tags picked when rating this restaurant (atmosphere / food_quality / service) */
  ratingTags?: Tag[];
  featured?: boolean;
  saveCount?: number;
  /** How many people the current user follows have saved this restaurant */
  followedSaveCount?: number;
  onUnsave?: (id: string) => void;
  onRated?: (id: string, bucket: Bucket) => void;
}

export default function RestaurantCard({
  restaurantId,
  rank,
  name,
  neighborhood,
  cuisine,
  reviews,
  rating,
  mapsUrl,
  photoUrl: photoUrlProp,
  price,
  archetype,
  isOpenNow,
  initialSaved = false,
  initialBucket = null,
  rankOverride,
  ratingScore,
  ratingTags,
  featured = false,
  saveCount,
  followedSaveCount,
  onUnsave,
  onRated,
}: RestaurantCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [bucket, setBucket] = useState<Bucket | null>(initialBucket);
  const [savePop, setSavePop] = useState(false);
  const [ratePop, setRatePop] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(photoUrlProp || getPhotoUrl(cuisine));
  const [showArchetypeInfo, setShowArchetypeInfo] = useState(false);
  const [showRateFlow, setShowRateFlow] = useState(false);

  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);
  useEffect(() => { setBucket(initialBucket); }, [initialBucket]);
  useEffect(() => { setPhotoUrl(photoUrlProp || getPhotoUrl(cuisine)); }, [photoUrlProp, cuisine]);
  const stars = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.5;

  function renderStars() {
    const starEls: React.ReactNode[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        starEls.push(<span key={i} style={{ color: "var(--star-fill)" }}>&#9733;</span>);
      } else if (i === fullStars + 1 && hasHalf) {
        starEls.push(
          <span key={i} className="relative inline-block" style={{ color: "var(--star-empty)" }}>
            &#9733;
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%", color: "var(--star-fill)" }}>
              &#9733;
            </span>
          </span>
        );
      } else {
        starEls.push(<span key={i} style={{ color: "var(--star-empty)" }}>&#9733;</span>);
      }
    }
    return starEls;
  }

  return (
    <div
      className="restaurant-card flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "16px",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Photo */}
      <Link href={`/restaurant/${restaurantId}`} className={`relative overflow-hidden block${featured ? " h-72 sm:h-64" : " h-52 sm:h-48"}`} style={{ flexShrink: 0 }}>
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="card-photo object-cover"
          loading="lazy"
          onError={() => setPhotoUrl(getPhotoUrl(cuisine))}
        />
        {/* Rank */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        >
          #{rankOverride ?? rank}
        </span>
        {/* Open/Closed badge */}
        {isOpenNow !== null && isOpenNow !== undefined && (
          <span
            className="absolute bottom-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: isOpenNow ? "var(--success)" : "rgba(0,0,0,0.55)",
              color: "#ffffff",
              backdropFilter: "blur(4px)",
            }}
          >
            {isOpenNow ? "Open" : "Closed"}
          </span>
        )}
        {/* Bookmark (save) button + confirmation */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {showSavedMsg && (
            <span
              className="save-confirm-pill text-xs font-semibold px-2 py-0.5 rounded-full"
              onAnimationEnd={() => setShowSavedMsg(false)}
              style={{ backgroundColor: "var(--success)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              Saved
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const nowSaved = !saved;
              setSaved(nowSaved);
              if (nowSaved) { setSavePop(true); setTimeout(() => setSavePop(false), 400); setShowSavedMsg(true); }
              if (!nowSaved && onUnsave) onUnsave(restaurantId);
              toggleSaved(restaurantId, saved).catch(() => setSaved(saved));
            }}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-150 hover:scale-110 active:scale-95${savePop ? " heart-pop" : ""}`}
            style={{
              backgroundColor: saved ? "var(--accent)" : "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              cursor: "pointer",
            }}
            aria-label={saved ? "Remove from saved" : "Save restaurant"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15"
              fill={saved ? "#ffffff" : "none"} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/restaurant/${restaurantId}`}>
          <h3
            className="font-semibold text-base leading-snug mb-2 line-clamp-2 hover:underline cursor-pointer"
            style={{ color: "var(--text)" }}
          >
            {name}
          </h3>
        </Link>

        <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
          {neighborhood} · {cuisine}{price ? ` · ${price}` : ""}
        </p>

        {isArchetype(archetype) && (
          <div className="mb-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowArchetypeInfo((v) => !v);
              }}
              aria-expanded={showArchetypeInfo}
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
              style={{ backgroundColor: ARCHETYPES[archetype].bg, color: ARCHETYPES[archetype].color }}
            >
              {archetype}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
            <div className={`filter-expand${showArchetypeInfo ? " open" : ""}`}>
              <div className="filter-expand-inner">
                <p className="text-xs pt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {ARCHETYPES[archetype].description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`} aria-hidden="false">
          {renderStars()}
          <span className="text-xs font-medium ml-0.5" style={{ color: "var(--text-secondary)" }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            ({reviews.toLocaleString()})
          </span>
        </div>

        {followedSaveCount && followedSaveCount > 0 ? (
          <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--accent)" }}>
            {followedSaveCount === 1 ? "1 person" : `${followedSaveCount} people`} you follow saved this
          </p>
        ) : saveCount && saveCount > 0 ? (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            {saveCount} {saveCount === 1 ? "person" : "people"} saved this
          </p>
        ) : null}

        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-opacity hover:opacity-75 min-h-[44px] flex items-center"
            style={{ color: "var(--text-muted)" }}
          >
            Open in Maps &rarr;
          </a>

          {/* Rate / visited status */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowRateFlow(true);
            }}
            className={`flex items-center gap-1 text-xs font-medium transition-all duration-150 hover:opacity-80 active:scale-95 min-h-[44px]${ratePop ? " heart-pop" : ""}`}
            style={{ color: bucket ? "var(--accent)" : "var(--text-muted)", cursor: "pointer" }}
            aria-label={bucket ? "Edit your rating" : "Rate this restaurant"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13"
              fill={bucket ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {bucket ? BUCKET_LABELS[bucket] : "Visited"}
            {bucket && ratingScore != null ? ` · ${ratingScore.toFixed(1)}` : ""}
          </button>
        </div>

        {bucket && ratingTags && ratingTags.length > 0 && (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            {ratingTags.map((t) => TAG_LABELS[t]).join(" · ")}
          </p>
        )}
      </div>

      {showRateFlow && (
        <RateRestaurantFlow
          restaurantId={restaurantId}
          restaurantName={name}
          restaurantPhotoUrl={photoUrl}
          onClose={() => setShowRateFlow(false)}
          onComplete={(newBucket) => {
            setShowRateFlow(false);
            setBucket(newBucket);
            setRatePop(true);
            setTimeout(() => setRatePop(false), 400);
            onRated?.(restaurantId, newBucket);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

async function toggleSaved(id: string, currently: boolean): Promise<boolean> {
  await fetch("/api/saved", {
    method: currently ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurant_id: id }),
  });
  return !currently;
}

async function toggleLiked(id: string, currently: boolean): Promise<boolean> {
  await fetch("/api/liked", {
    method: currently ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurant_id: id }),
  });
  return !currently;
}

const CUISINE_PHOTO_MAP: Record<string, string> = {
  Ramen: "photo-1569050467447-ce54b3bbc37d",
  Japanese: "photo-1553621042-f6e147245754",
  Pizza: "photo-1513104890138-7c749659a591",
  Italian: "photo-1555396273-367ea4eb4db5",
  Chinese: "photo-1563245372-f21724e3856d",
  Korean: "photo-1614563637806-1d0e645e0940",
  Mexican: "photo-1565299585323-38d6b0865b47",
  Indian: "photo-1585937421612-70a008356fbe",
  Mediterranean: "photo-1544025162-d76694265947",
  "Middle Eastern": "photo-1561626423-a51b45aef0a1",
  Thai: "photo-1562565652-a0d8f0c59eb4",
  American: "photo-1550317138-10000687a72b",
  Deli: "photo-1509722747041-616f39b57569",
  Seafood: "photo-1565680018434-b513d5e5fd47",
  French: "photo-1414235077428-338989a2e8c0",
  Halal: "photo-1561626423-a51b45aef0a1",
  Restaurant: "photo-1466978913421-dad2ebd01d17",
};

const DEFAULT_PHOTO = "photo-1504674900247-0877df9cc836";

function getPhotoUrl(cuisine: string): string {
  const photoId = CUISINE_PHOTO_MAP[cuisine] ?? DEFAULT_PHOTO;
  return `https://images.unsplash.com/${photoId}?w=400&q=65&auto=format&fit=crop`;
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
  isOpenNow?: boolean | null;
  initialSaved?: boolean;
  initialLiked?: boolean;
  onUnsave?: (id: string) => void;
  onUnlike?: (id: string) => void;
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
  isOpenNow,
  initialSaved = false,
  initialLiked = false,
  onUnsave,
  onUnlike,
}: RestaurantCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [liked, setLiked] = useState(initialLiked);
  const [savePop, setSavePop] = useState(false);
  const [likePop, setLikePop] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(photoUrlProp || getPhotoUrl(cuisine));

  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);
  useEffect(() => { setLiked(initialLiked); }, [initialLiked]);
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
      <Link href={`/restaurant/${restaurantId}`} className="relative overflow-hidden h-52 sm:h-48 block" style={{ flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name}
          className="card-photo"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          onError={() => setPhotoUrl(getPhotoUrl(cuisine))}
        />
        {/* Rank */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        >
          #{rank}
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
        {/* Bookmark (save) button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const nowSaved = !saved;
            setSaved(nowSaved);
            if (nowSaved) { setSavePop(true); setTimeout(() => setSavePop(false), 400); }
            if (!nowSaved && onUnsave) onUnsave(restaurantId);
            toggleSaved(restaurantId, saved).catch(() => setSaved(saved));
          }}
          className={`absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150 hover:scale-110 active:scale-95${savePop ? " heart-pop" : ""}`}
          style={{
            backgroundColor: saved ? "var(--accent)" : "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
          }}
          aria-label={saved ? "Remove from saved" : "Save restaurant"}
        >
          {/* Bookmark icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15"
            fill={saved ? "#ffffff" : "none"} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
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

        <div className="flex items-center gap-1.5 text-sm" role="img" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}>
          {renderStars()}
          <span className="text-xs font-medium ml-0.5" style={{ color: "var(--text-secondary)" }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            ({reviews.toLocaleString()})
          </span>
        </div>

        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-opacity hover:opacity-75"
            style={{ color: "var(--accent-text)" }}
          >
            Open in Maps &rarr;
          </a>

          {/* Heart (liked — been there) */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const nowLiked = !liked;
              setLiked(nowLiked);
              if (nowLiked) { setLikePop(true); setTimeout(() => setLikePop(false), 400); }
              if (!nowLiked && onUnlike) onUnlike(restaurantId);
              toggleLiked(restaurantId, liked).catch(() => setLiked(liked));
            }}
            className={`flex items-center gap-1 text-xs font-medium transition-all duration-150 hover:opacity-80 active:scale-95${likePop ? " heart-pop" : ""}`}
            style={{ color: liked ? "var(--accent)" : "var(--text-muted)", cursor: "pointer" }}
            aria-label={liked ? "Remove from visited" : "Mark as visited"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13"
              fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Visited
          </button>
        </div>
      </div>
    </div>
  );
}

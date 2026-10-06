"use client";

import { useState } from "react";
import Image from "next/image";
import { getPhotoUrl } from "@/lib/photoFallback";
import { useScrollActive } from "@/lib/useScrollActive";
import type { ProofCardItem } from "@/components/ProofCard";

// Laminated diner-menu-insert treatment for the homepage hero, distinct from
// the shared ProofCard (used elsewhere, e.g. About) so this redesign stays
// scoped to the landing page rather than silently restyling other surfaces.
//
// The two cards overlap (see .diner-cards in globals.css), so the back card
// is permanently half-hidden at rest. Reveal-on-hover fixes that for mouse
// users; touch devices get no real :hover, so this reuses the app's own
// useScrollActive pattern (same one .restaurant-card already uses) as the
// equivalent "comes into view on scroll" behavior. Rotation moves from an
// inline style to a class (.diner-card--left/--right) because an inline
// transform would silently out-rank the hover/in-view CSS, same bug already
// hit once this session with the filter-pill buttons.
export default function DinerProofCard({ item, rotate }: { item: ProofCardItem; rotate: "left" | "right" }) {
  const [photoUrl, setPhotoUrl] = useState(item.imageUrl);
  const { ref, active } = useScrollActive<HTMLDivElement>(0.8);

  return (
    <div
      ref={ref}
      className={`diner-card diner-card--${rotate}${active ? " in-view" : ""}`}
    >
      <div className="relative overflow-hidden rounded-[6px] h-24">
        <Image
          src={photoUrl}
          alt={`${item.name} in ${item.neighborhood}`}
          fill
          sizes="240px"
          className="object-cover"
          onError={() => setPhotoUrl(getPhotoUrl(item.cuisine))}
        />
      </div>
      <div className="diner-card-badge">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
        </svg>
        LOCAL FAVORITE
      </div>
      <p className="diner-card-name">{item.name}</p>
      <p className="diner-card-ratings">
        Locals <b>{item.localRating.toFixed(1)}</b> &middot; Tourists {item.touristRating.toFixed(1)}
      </p>
    </div>
  );
}

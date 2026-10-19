"use client";

import { useState } from "react";
import Image from "next/image";
import { getPhotoUrl } from "@/lib/photoFallback";

// One place as /api/pick returns it. Shared by Help me pick and the
// homepage preview so both show the exact same card.
export interface Candidate {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  price_midpoint: number | null;
  image_url: string | null;
  lat: number;
  lng: number;
  local_weighted_rating: number;
  tourist_weighted_rating: number;
  distance_mi: number | null;
  // From the review analysis: up to 3 standout dishes, the top line on
  // vibe/service (shown when there's no standout dish), and wait times.
  dishes: string[];
  vibe: string | null;
  wait_note: string | null;
}

export function priceLabel(mid: number | null) {
  if (!mid) return null;
  return mid <= 15 ? "$" : mid <= 30 ? "$$" : mid <= 60 ? "$$$" : "$$$$";
}

export function metaLine(c: Candidate) {
  const parts = [c.neighborhood, c.cuisine !== "Restaurant" ? c.cuisine : null, priceLabel(c.price_midpoint)];
  if (c.distance_mi != null) parts.push(`${c.distance_mi < 1 ? c.distance_mi.toFixed(1) : c.distance_mi.toFixed(1).replace(/\.0$/, "")} mi away`);
  return parts.filter(Boolean).join(" · ");
}

export function PickPhoto({ c, sizes, className, priority }: { c: Candidate; sizes: string; className: string; priority?: boolean }) {
  const [src, setSrc] = useState(c.image_url || getPhotoUrl(c.cuisine));
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: "var(--bg-inset)" }}>
      <Image
        src={src}
        alt={`${c.name} in ${c.neighborhood}`}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setSrc(getPhotoUrl(c.cuisine))}
      />
    </div>
  );
}

// Photo, name, where/what/price, the locals' rating, and what it's known
// for. The caller supplies the clickable wrapper (a button in the
// this-or-that, a link on the homepage).
export function PickCardBody({ c, still, photoClass, sizes, priority }: {
  c: Candidate;
  still?: boolean;
  photoClass: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <>
      <div className="relative">
        <PickPhoto c={c} sizes={sizes} className={photoClass} priority={priority} />
        {still && (
          <span className="pick-still absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full">
            Still in
          </span>
        )}
      </div>
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <span className="font-semibold text-base md:text-lg leading-snug" style={{ color: "var(--text)" }}>{c.name}</span>
        <span className="text-xs md:text-sm" style={{ color: "var(--text-secondary)" }}>{metaLine(c)}</span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Locals rate it <b className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{c.local_weighted_rating.toFixed(1)}</b>
        </span>
        {(c.dishes.length > 0 || c.vibe) && (
          <p className="text-sm leading-snug mt-2 pt-2.5 line-clamp-1 md:line-clamp-2" style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{c.dishes.length ? "Known for " : "The vibe: "}</span>
            {c.dishes.length ? c.dishes.join(" · ") : c.vibe}
          </p>
        )}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Icon from "@/components/Icon";
import { getPhotoUrl } from "@/lib/photoFallback";

// One place as /api/pick returns it. Shared by Help me pick and the
// homepage so both show the exact same place.
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

export function fmtDistance(mi: number) {
  return `${mi < 1 ? mi.toFixed(1) : mi.toFixed(1).replace(/\.0$/, "")} mi`;
}

function whereLine(c: Candidate) {
  return [c.neighborhood, c.distance_mi != null ? fmtDistance(c.distance_mi) : null].filter(Boolean).join(" · ");
}
function whatLine(c: Candidate) {
  return [c.cuisine !== "Restaurant" ? c.cuisine : null, priceLabel(c.price_midpoint)].filter(Boolean).join(" · ");
}

// The caller owns size and positioning (the image fills it), e.g.
// "absolute inset-0" or "relative w-[76px] h-[76px] rounded-xl".
export function PickPhoto({ c, sizes, className, priority }: { c: Candidate; sizes: string; className: string; priority?: boolean }) {
  const [src, setSrc] = useState(c.image_url || getPhotoUrl(c.cuisine));
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: "var(--bg-inset)" }}>
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

function MetaLine({ icon, children }: { icon: "map-pin" | "utensils" | "star"; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] leading-snug min-w-0" style={{ color: "var(--text-secondary)" }}>
      <Icon name={icon} size={13} className="shrink-0 opacity-80" />
      <span className="truncate tabular-nums">{children}</span>
    </span>
  );
}

// A place as a list row: rounded photo with a status tag on its edge,
// then name and icon lines. No card, no border.
export function PlaceRow({ c, tag }: { c: Candidate; tag?: string }) {
  return (
    <span className="grid grid-cols-[76px_minmax(0,1fr)] gap-3.5 items-start">
      <span className="relative block">
        <PickPhoto c={c} sizes="76px" className="relative block w-[76px] h-[76px] rounded-xl" />
        {tag && <span className="tag tag-open absolute -bottom-2 left-1.5">{tag}</span>}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0 pt-0.5">
        <span className="text-[16px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>{c.name}</span>
        <MetaLine icon="map-pin">{whereLine(c)}</MetaLine>
        {whatLine(c) && <MetaLine icon="utensils">{whatLine(c)}</MetaLine>}
        <MetaLine icon="star">Locals rate it {c.local_weighted_rating.toFixed(1)}</MetaLine>
      </span>
    </span>
  );
}

// A contender in the this-or-that: big rounded photo, facts underneath.
export function ChoiceBody({ c, still }: { c: Candidate; still?: boolean }) {
  const known = c.dishes.length ? c.dishes.join(" · ") : c.vibe;
  return (
    <>
      <span className="pick-photo relative block rounded-[18px] overflow-hidden">
        <PickPhoto c={c} sizes="(max-width: 768px) 100vw, 520px" className="relative block h-36 sm:h-56 md:h-72" priority />
        {still && <span className="tag tag-pick absolute top-2.5 left-2.5">Still in</span>}
      </span>
      <span className="flex flex-col gap-0.5 pt-3 px-0.5 min-w-0">
        <span className="text-[18px] md:text-[20px] font-semibold leading-snug" style={{ color: "var(--text)" }}>{c.name}</span>
        <MetaLine icon="map-pin">{whereLine(c)}</MetaLine>
        {whatLine(c) && <MetaLine icon="utensils">{whatLine(c)}</MetaLine>}
        <MetaLine icon="star">Locals rate it {c.local_weighted_rating.toFixed(1)}</MetaLine>
        {known && (
          <span className="text-[13px] leading-snug mt-1.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{c.dishes.length ? "Known for: " : "The vibe: "}</span>
            {known}
          </span>
        )}
      </span>
    </>
  );
}

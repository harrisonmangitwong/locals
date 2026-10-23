"use client";

import { useState } from "react";
import Image from "next/image";
import NoPhoto from "@/components/NoPhoto";

export interface ProofCardItem {
  name: string;
  neighborhood: string;
  cuisine: string;
  imageUrl: string;
  localRating: number;
  touristRating: number;
}

// One real restaurant showing the split: a row (photo, name, place), then
// the two ratings side by side, locals' in ink and tourists' in gray.
// item comes from a fixed module-level array, so the photo state only needs
// to initialize from it once.
export default function ProofCard({ item }: { item: ProofCardItem }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3.5 items-center">
      <div className="relative w-[76px] h-[76px] rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-inset)" }}>
        {failed ? (
          <NoPhoto />
        ) : (
          <Image
            src={item.imageUrl}
            alt={`${item.name} in ${item.neighborhood}`}
            fill
            sizes="76px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[16px] font-semibold leading-snug" style={{ color: "var(--text)" }}>{item.name}</p>
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{item.neighborhood} · {item.cuisine}</p>
        <p className="flex items-baseline gap-4 mt-1.5 tabular-nums">
          <span className="text-[15px]" style={{ color: "var(--text)" }}>
            <span className="text-[20px] font-bold tracking-[-0.02em] mr-1">{item.localRating.toFixed(1)}</span>locals
          </span>
          <span className="text-[15px]" style={{ color: "var(--text-muted)" }}>
            <span className="text-[20px] font-semibold tracking-[-0.02em] mr-1">{item.touristRating.toFixed(1)}</span>tourists
          </span>
        </p>
      </div>
    </div>
  );
}

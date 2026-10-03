"use client";

import { useState } from "react";
import Image from "next/image";
import { getPhotoUrl } from "@/lib/photoFallback";

export interface ProofCardItem {
  name: string;
  neighborhood: string;
  cuisine: string;
  imageUrl: string;
  localRating: number;
  touristRating: number;
}

// item comes from a fixed, module-level array (see FEATURED in page.tsx) that
// never changes identity during the component's lifetime, so photoUrl only
// needs to initialize from it once -- no effect required to keep them in sync.
export default function ProofCard({ item }: { item: ProofCardItem }) {
  const [photoUrl, setPhotoUrl] = useState(item.imageUrl);

  return (
    <div
      className="restaurant-card flex flex-col overflow-hidden max-w-xs"
      style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}
    >
      <div className="relative overflow-hidden h-32">
        <Image
          src={photoUrl}
          alt={`${item.name} in ${item.neighborhood}`}
          fill
          sizes="320px"
          className="card-photo object-cover"
          onError={() => setPhotoUrl(getPhotoUrl(item.cuisine))}
        />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.name}</p>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{item.neighborhood} &middot; {item.cuisine}</p>

        {/* Scoreboard: locals' number visually wins, tourists' is muted */}
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xl font-bold" style={{ color: "var(--accent)" }}>{item.localRating.toFixed(1)}</span>
            <span className="block text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Locals</span>
          </div>
          <div className="w-px self-stretch" style={{ backgroundColor: "var(--border)" }} />
          <div>
            <span className="text-xl font-semibold" style={{ color: "var(--text-muted)" }}>{item.touristRating.toFixed(1)}</span>
            <span className="block text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Tourists</span>
          </div>
        </div>
      </div>
    </div>
  );
}

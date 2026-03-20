"use client";

import { useState } from "react";

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
  rank: number;
  name: string;
  neighborhood: string;
  cuisine: string;
  reviews: number;
  rating: number;
  mapsUrl: string;
  photoUrl?: string;
}

export default function RestaurantCard({
  rank,
  name,
  neighborhood,
  cuisine,
  reviews,
  rating,
  mapsUrl,
}: RestaurantCardProps) {
  const [hearted, setHearted] = useState(false);
  const photoUrl = getPhotoUrl(cuisine);

  const stars = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.5;

  function renderStars() {
    const starEls: React.ReactNode[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        starEls.push(
          <span key={i} style={{ color: "#ff385c" }}>
            ★
          </span>
        );
      } else if (i === fullStars + 1 && hasHalf) {
        starEls.push(
          <span key={i} style={{ color: "#ff385c" }}>
            ½
          </span>
        );
      } else {
        starEls.push(
          <span key={i} style={{ color: "rgba(15,23,42,0.20)" }}>
            ★
          </span>
        );
      }
    }
    return starEls;
  }

  return (
    <div
      className="restaurant-card flex flex-col overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 2px 16px rgba(15,23,42,0.08)",
      }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ height: "170px", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={`${cuisine} food`}
          className="card-photo w-full h-full"
          style={{ objectFit: "cover" }}
        />
        {/* Rank pill */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: "#ff385c",
            color: "#ffffff",
          }}
        >
          #{rank}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Name */}
        <h3
          className="font-semibold text-sm leading-snug mb-2 line-clamp-2"
          style={{ color: "rgba(15,23,42,0.96)" }}
        >
          {name}
        </h3>

        {/* Chips row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "rgba(255,56,92,0.08)",
              color: "#ff385c",
            }}
          >
            {neighborhood}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "rgba(15,23,42,0.04)",
              color: "rgba(15,23,42,0.70)",
            }}
          >
            {cuisine}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "rgba(15,23,42,0.04)",
              color: "rgba(15,23,42,0.70)",
            }}
          >
            {reviews.toLocaleString()} reviews
          </span>
        </div>

        {/* Rating stars */}
        <div className="flex items-center gap-1 mb-3 text-sm">
          {renderStars()}
          <span
            className="text-xs ml-1 font-medium"
            style={{ color: "rgba(15,23,42,0.70)" }}
          >
            {rating.toFixed(1)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div
          className="w-full mb-3"
          style={{
            height: "1px",
            backgroundColor: "rgba(15,23,42,0.10)",
          }}
        />

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {/* Heart button */}
          <button
            onClick={() => setHearted(!hearted)}
            className="heart-btn flex items-center justify-center w-8 h-8 rounded-full"
            style={{
              backgroundColor: hearted
                ? "rgba(255,56,92,0.10)"
                : "rgba(15,23,42,0.04)",
            }}
            aria-label={hearted ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill={hearted ? "#ff385c" : "none"}
              stroke={hearted ? "#ff385c" : "rgba(15,23,42,0.50)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Maps link */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold transition-opacity hover:opacity-75"
            style={{ color: "#ff385c" }}
          >
            Open in Maps →
          </a>
        </div>
      </div>
    </div>
  );
}

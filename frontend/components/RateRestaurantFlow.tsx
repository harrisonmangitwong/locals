"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  BUCKETS,
  TAGS,
  TAG_LABELS,
  type Bucket,
  type Tag,
  initComparisonState,
  nextComparisonTarget,
  applyComparisonResult,
  type ComparisonState,
} from "@/lib/ranking";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RatingRow {
  restaurant_id: string;
  rank_position: number;
}

interface RestaurantInfo {
  name: string;
  image_url?: string;
}

interface RateRestaurantFlowProps {
  restaurantId: string;
  restaurantName: string;
  restaurantPhotoUrl?: string;
  onClose: () => void;
  onComplete: (bucket: Bucket) => void;
}

type Step = "bucket" | "loading" | "comparison" | "tags" | "submitting" | "error";

export default function RateRestaurantFlow({
  restaurantId,
  restaurantName,
  restaurantPhotoUrl,
  onClose,
  onComplete,
}: RateRestaurantFlowProps) {
  const [step, setStep] = useState<Step>("bucket");
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [bucketList, setBucketList] = useState<RatingRow[]>([]);
  const [details, setDetails] = useState<Record<string, RestaurantInfo>>({});
  const [comparisonState, setComparisonState] = useState<ComparisonState | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pickBucket(b: Bucket) {
    setBucket(b);
    setStep("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/ratings?bucket=${b}&exclude=${restaurantId}`);
      const data = await res.json();
      const list: RatingRow[] = data.ratings ?? [];
      setBucketList(list);

      const initial = initComparisonState(list.length);
      setComparisonState(initial);

      if (initial.done) {
        setStep("tags");
        return;
      }

      const ids = list.map((r) => r.restaurant_id).join(",");
      const detailRes = await fetch(`${API_BASE}/api/restaurants/batch?ids=${ids}`);
      const detailData = await detailRes.json();
      const map: Record<string, RestaurantInfo> = {};
      for (const r of detailData.results ?? []) {
        map[r.restaurant_id] = { name: r.name, image_url: r.image_url };
      }
      setDetails(map);
      setStep("comparison");
    } catch {
      setErrorMsg("Couldn't load your rankings — try again?");
      setStep("error");
    }
  }

  function answerComparison(result: "better" | "worse") {
    if (!comparisonState) return;
    const next = applyComparisonResult(comparisonState, result);
    setComparisonState(next);
    if (next.done) {
      setStep("tags");
    }
  }

  function toggleTag(tag: Tag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function submit() {
    if (!bucket || !comparisonState?.finalRank) return;
    setStep("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ratings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          bucket,
          final_rank: comparisonState.finalRank,
          tags: selectedTags,
        }),
      });
      if (!res.ok) throw new Error();
      onComplete(bucket);
    } catch {
      setErrorMsg("Something went wrong saving your rating — try again?");
      setStep("tags");
    }
  }

  const compareTargetRank = comparisonState ? nextComparisonTarget(comparisonState) : null;
  const compareTargetId =
    compareTargetRank != null ? bucketList.find((r) => r.rank_position === compareTargetRank)?.restaurant_id : null;
  const compareTarget = compareTargetId ? details[compareTargetId] : null;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="menu-drop w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "bucket" && (
          <>
            <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)" }}>
              How was {restaurantName}?
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              This adds it to your ranked Visited list.
            </p>
            <div className="flex flex-col gap-2">
              {BUCKETS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => pickBucket(b.key)}
                  className="cta-btn rounded-xl px-4 py-3 text-sm font-semibold text-left"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "loading" && (
          <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Loading your rankings…
          </div>
        )}

        {step === "error" && (
          <div className="py-6 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>{errorMsg}</p>
            <button
              onClick={() => bucket && pickBucket(bucket)}
              className="text-sm font-medium underline"
              style={{ color: "var(--text-muted)" }}
            >
              Try again
            </button>
          </div>
        )}

        {step === "comparison" && compareTarget && (
          <>
            <h2 className="font-display text-lg mb-4 text-center" style={{ color: "var(--text)" }}>
              Which did you like more?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => answerComparison("better")}
                className="flex flex-col items-center gap-2 rounded-xl p-3 transition-transform hover:scale-[1.03] active:scale-95"
                style={{ border: "1px solid var(--border-strong)" }}
              >
                <div className="relative w-full h-24 rounded-lg overflow-hidden">
                  {restaurantPhotoUrl && (
                    <Image src={restaurantPhotoUrl} alt={restaurantName} fill sizes="150px" className="object-cover" />
                  )}
                </div>
                <span className="text-xs font-medium text-center" style={{ color: "var(--text)" }}>{restaurantName}</span>
              </button>
              <button
                onClick={() => answerComparison("worse")}
                className="flex flex-col items-center gap-2 rounded-xl p-3 transition-transform hover:scale-[1.03] active:scale-95"
                style={{ border: "1px solid var(--border-strong)" }}
              >
                <div className="relative w-full h-24 rounded-lg overflow-hidden">
                  {compareTarget.image_url && (
                    <Image src={compareTarget.image_url} alt={compareTarget.name} fill sizes="150px" className="object-cover" />
                  )}
                </div>
                <span className="text-xs font-medium text-center" style={{ color: "var(--text)" }}>{compareTarget.name}</span>
              </button>
            </div>
          </>
        )}

        {(step === "tags" || step === "submitting") && bucket && (
          <>
            <h2 className="font-display text-lg mb-4" style={{ color: "var(--text)" }}>
              {BUCKETS.find((b) => b.key === bucket)!.prompt}
            </h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className="text-sm font-medium px-3 py-2 rounded-full transition-all hover:opacity-75"
                    style={{
                      backgroundColor: active ? "var(--accent)" : "var(--bg-subtle)",
                      color: active ? "#ffffff" : "var(--text-secondary)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                );
              })}
            </div>
            {errorMsg && (
              <p className="text-xs mb-3" style={{ color: "var(--accent)" }}>{errorMsg}</p>
            )}
            <button
              onClick={submit}
              disabled={step === "submitting"}
              className="cta-btn w-full rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {step === "submitting" ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Chip from "./Chip";
import Icon from "./Icon";
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
import { useDialog } from "@/lib/useDialog";

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

  const { panelProps, titleId } = useDialog(true, onClose);

  useEffect(() => { setMounted(true); }, []);


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
      setErrorMsg("Couldn’t load your rankings. Try again?");
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
      setErrorMsg("Couldn’t save your rating. Try again?");
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
      className="dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="dialog-panel w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
        {...panelProps}
      >
        <div key={step === "submitting" ? "tags" : step} className="step-in">
        {step === "bucket" && (
          <>
            <h2 id={titleId} className="text-[21px] font-semibold tracking-[-0.015em] text-balance">
              How was {restaurantName}?
            </h2>
            <p className="text-[15px] mt-1 mb-5" style={{ color: "var(--text-secondary)" }}>
              This adds it to your ranked Visited list.
            </p>
            <div className="flex flex-col gap-2">
              {BUCKETS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => pickBucket(b.key)}
                  className="soft-btn w-full flex items-center justify-between px-5 text-[16px]"
                >
                  {b.label}
                  <Icon name="chevron-right" size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === "loading" && (
          <div id={titleId} className="py-10 text-center text-[15px]" style={{ color: "var(--text-secondary)" }} role="status">
            Loading your rankings…
          </div>
        )}

        {step === "error" && (
          <div className="py-6 text-center">
            <p id={titleId} role="alert" className="text-[15px] mb-4" style={{ color: "var(--text)" }}>{errorMsg}</p>
            <button onClick={() => bucket && pickBucket(bucket)} className="soft-btn px-6 text-[15px]">
              Try again
            </button>
          </div>
        )}

        {step === "comparison" && compareTarget && (
          <>
            <h2 id={titleId} className="text-[21px] font-semibold tracking-[-0.015em] mb-5 text-center">
              Which did you like more?
            </h2>
            {/* The same this-or-that as Help me pick: no box until hover. */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { side: "better" as const, name: restaurantName, photo: restaurantPhotoUrl },
                { side: "worse" as const, name: compareTarget.name, photo: compareTarget.image_url },
              ].map((o) => (
                <button key={o.side} onClick={() => answerComparison(o.side)} className="pick-choice flex flex-col gap-2">
                  <span className="pick-photo relative block w-full aspect-square rounded-[18px] overflow-hidden" style={{ backgroundColor: "var(--bg-inset)" }}>
                    {o.photo && <Image src={o.photo} alt="" fill sizes="160px" className="object-cover" />}
                  </span>
                  <span className="text-[15px] font-semibold leading-snug line-clamp-2">{o.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {(step === "tags" || step === "submitting") && bucket && (
          <>
            <h2 id={titleId} className="text-[21px] font-semibold tracking-[-0.015em] mb-4">
              {BUCKETS.find((b) => b.key === bucket)!.prompt}
            </h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <Chip key={tag} label={TAG_LABELS[tag]} active={active} onClick={() => toggleTag(tag)} />
                );
              })}
            </div>
            {errorMsg && (
              <p role="alert" className="text-[13px] mb-3" style={{ color: "var(--text)" }}>{errorMsg}</p>
            )}
            <button
              onClick={submit}
              disabled={step === "submitting"}
              className="cta-btn w-full text-[16px] disabled:opacity-40"
            >
              {step === "submitting" ? "Saving…" : "Save"}
            </button>
          </>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}

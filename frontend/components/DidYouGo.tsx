"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import RateRestaurantFlow from "@/components/RateRestaurantFlow";
import { PickPhoto } from "@/components/PickCard";
import { type LastPick, answerVisit, markAsked, pickToAskAbout } from "@/lib/track";
import { useCurrentUser } from "@/lib/useCurrentUser";

type Answer = "went" | "not_yet" | "elsewhere";

const ANSWERS: { key: Answer; label: string }[] = [
  { key: "went", label: "Went" },
  { key: "not_yet", label: "Not yet" },
  { key: "elsewhere", label: "Went elsewhere" },
];

// Asks once, 2 to 72 hours after a pick, whether the person actually went.
// The answer is the pick-to-visit rate, the number that says whether Help me
// pick works. A quiet soft tile on the page, never a pop-up; dismissing it
// just stops asking.
export default function DidYouGo({ className = "" }: { className?: string }) {
  const [pick, setPick] = useState<LastPick | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [gone, setGone] = useState(false);
  const [rating, setRating] = useState(false);
  const [rated, setRated] = useState(false);
  const { user } = useCurrentUser();

  // Read from this browser after mount, so the server render never differs.
  // (localStorage doesn't exist on the server, so this can't be initial state.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPick(pickToAskAbout());
  }, []);

  if (!pick || gone) return null;

  function respond(a: Answer) {
    if (!pick) return;
    setAnswer(a);
    answerVisit(pick, a);
    // Nothing more to offer unless they went; let the thanks register, then go.
    if (a !== "went") setTimeout(() => setGone(true), 2400);
  }

  function dismiss() {
    markAsked();
    setGone(true);
  }

  const candidate = {
    restaurant_id: pick.restaurantId,
    name: pick.name,
    neighborhood: pick.neighborhood,
    cuisine: pick.cuisine,
    image_url: pick.imageUrl,
    price_midpoint: null,
    lat: 0,
    lng: 0,
    local_weighted_rating: 0,
    tourist_weighted_rating: 0,
    distance_mi: null,
    dishes: [],
    vibe: null,
    wait_note: null,
  };

  return (
    <section aria-label="Did you go?" className={`on-subtle rise rounded-[20px] p-4 text-left ${className}`} style={{ backgroundColor: "var(--bg-subtle)" }}>
      <div className="flex items-start gap-3.5">
        <PickPhoto c={candidate} sizes="56px" className="relative shrink-0 w-14 h-14 rounded-xl" />
        <div className="min-w-0 flex-1" aria-live="polite">
          {!answer && (
            <>
              <p className="text-[16px] font-semibold leading-snug">Did you end up going to {pick.name}?</p>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Your pick from Help me pick</p>
            </>
          )}
          {answer === "went" && !rated && (
            <>
              <p className="text-[16px] font-semibold leading-snug">Nice. How was {pick.name}?</p>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {user ? "Rate it and it joins your Visited list." : "Thanks for telling us."}
              </p>
            </>
          )}
          {answer === "went" && rated && (
            <p className="text-[16px] font-semibold leading-snug fade-up">Added to your Visited list.</p>
          )}
          {answer && answer !== "went" && (
            <p className="text-[16px] font-semibold leading-snug fade-up">Thanks, that helps us pick better.</p>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="row-action -mt-2 -mr-2 shrink-0">
          <Icon name="x" size={16} />
        </button>
      </div>

      {!answer && (
        <div className="flex flex-wrap gap-2 mt-3.5" role="group" aria-label="Did you go?">
          {ANSWERS.map((a) => (
            <button key={a.key} onClick={() => respond(a.key)} className="filter-pill h-11 px-4 text-[15px] font-medium">
              {a.label}
            </button>
          ))}
        </div>
      )}

      {answer === "went" && user && !rated && (
        <div className="flex gap-2 mt-3.5 fade-up">
          <button onClick={() => setRating(true)} className="soft-btn is-compact px-5 text-[15px]">Rate it</button>
        </div>
      )}

      {rating && (
        <RateRestaurantFlow
          restaurantId={pick.restaurantId}
          restaurantName={pick.name}
          restaurantPhotoUrl={pick.imageUrl ?? undefined}
          onClose={() => setRating(false)}
          onComplete={() => {
            setRating(false);
            setRated(true);
            setTimeout(() => setGone(true), 2400);
          }}
        />
      )}
    </section>
  );
}

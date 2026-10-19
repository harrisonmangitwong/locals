"use client";

import { type ReactNode, useEffect, useRef } from "react";

// Phones have no hover, so as you scroll, the one row (.row-link) whose
// center is nearest the middle of the screen gets the hover treatment
// instead, via .is-focus. Desktop keeps real hover; this does nothing there.
// `watch` re-scans when the rows inside change (e.g. the shortlist refreshing).
export default function ScrollSpotlight({ children, className, watch }: { children: ReactNode; className?: string; watch?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !window.matchMedia("(hover: none)").matches) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".row-link"));
    let frame = 0;
    let current: HTMLElement | null = null;

    const update = () => {
      const mid = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = row;
        }
      }
      // Only when that row is actually near the middle, not just the closest.
      if (best && bestDist > window.innerHeight * 0.22) best = null;
      if (best !== current) {
        current?.classList.remove("is-focus");
        best?.classList.add("is-focus");
        current = best;
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      current?.classList.remove("is-focus");
    };
  }, [watch]);

  return <div ref={ref} className={className}>{children}</div>;
}

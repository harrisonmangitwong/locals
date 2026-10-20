"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import Link from "next/link";
import { type Candidate, PickPhoto } from "@/components/PickCard";

// Where each photo floats (% of the collage box), its tilt, its size, and
// how far it drifts with the pointer (nearer photos move more).
const TILES = [
  { left: 2, top: 26, rot: -7, size: 0.86, depth: 0.6 },
  { left: 17, top: 58, rot: 5, size: 0.8, depth: 1 },
  { left: 31, top: 6, rot: -2, size: 1, depth: 0.8 },
  { left: 51, top: 44, rot: 4, size: 0.94, depth: 1.25 },
  { left: 65, top: 4, rot: -5, size: 0.84, depth: 0.7 },
  { left: 77, top: 50, rot: 6, size: 0.8, depth: 1.1 },
];

// Real places open right now, assembling into a loose pile on arrival and
// shifting with the pointer (and with scroll, on any device) like layers
// at different depths. Each photo
// straightens up and names itself on hover, and opens its restaurant.
export default function Collage({ places }: { places: Candidate[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const host = (el.closest("section") as HTMLElement | null) ?? el;
    let frame = 0;
    let scrollFrame = 0;
    // Scroll depth works everywhere; it's the phone's version of hover.
    const onScroll = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        el.style.setProperty("--sy", String(Math.min(Math.max(window.scrollY, 0), 600)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (!finePointer) {
      return () => {
        cancelAnimationFrame(scrollFrame);
        window.removeEventListener("scroll", onScroll);
      };
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const my = ((e.clientY - r.top) / r.height) * 2 - 1;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", mx.toFixed(3));
        el.style.setProperty("--my", my.toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Needs a full set of photos; with fewer open places (late at night)
  // the headline stands on its own.
  if (places.length < TILES.length) return null;

  return (
    <div ref={ref} className="collage relative mx-auto max-w-5xl h-[230px] sm:h-[320px] md:h-[400px] lg:h-[440px] max-h-[50svh]">
      {TILES.map((t, i) => {
        const c = places[i];
        return (
          <Link
            key={c.restaurant_id}
            href={`/restaurant/${c.restaurant_id}`}
            aria-label={`${c.name}, ${c.neighborhood}`}
            className="collage-item absolute"
            style={{
              left: `${t.left}%`,
              top: `${t.top}%`,
              // Also bounded by screen height, so a phone in landscape keeps the
              // headline and buttons above the fold. --tile-base lets CSS shrink
              // the photos further on very short screens.
              width: `calc(var(--tile-base, clamp(82px, min(17vw, 30svh), 210px)) * ${t.size})`,
              "--rot": `${t.rot}deg`,
              "--d": t.depth,
              "--i": i,
            } as CSSProperties}
          >
            <PickPhoto c={c} sizes="220px" priority={i < 3} className="collage-tile relative block aspect-square" />
            <span className="collage-label">{c.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

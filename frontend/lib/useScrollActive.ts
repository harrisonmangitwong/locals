"use client";

import { useEffect, useRef, useState } from "react";

/** Toggles true while the element is substantially in view -- a touch-device
 * stand-in for :hover, which never fires on scroll/tap. Pair with a CSS
 * class scoped to `@media (hover: none)` so it doesn't double up with real
 * mouse hover on desktop. */
export function useScrollActive<T extends HTMLElement>(threshold = 0.6) {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, active };
}

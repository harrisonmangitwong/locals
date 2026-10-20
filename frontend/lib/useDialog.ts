import { useEffect, useId, useRef, useState } from "react";
import { useBodyScrollLock } from "./useBodyScrollLock";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Everything a modal needs to behave like one: background scroll locks,
 * focus moves into the panel when it opens and stays there (Tab wraps),
 * Escape closes it, and focus goes back to whatever opened it.
 *
 * Spread `panelProps` onto the dialog panel and put `titleId` on its
 * heading, so screen readers announce "dialog, <heading>".
 */
export function useDialog(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // The latest onClose without re-running the effect when callers pass a
  // new function every render.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useBodyScrollLock(active);

  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;

    // The panel mounts through a portal a frame after `active` flips, so
    // wait for it before moving focus in.
    let frame = requestAnimationFrame(function focusIn() {
      const panel = ref.current;
      if (!panel) {
        frame = requestAnimationFrame(focusIn);
        return;
      }
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus({ preventScroll: true });
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        ref.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const inside = ref.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      // Back to where the person was, if that element is still on the page.
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active]);

  const panelProps = {
    ref,
    role: "dialog" as const,
    "aria-modal": true as const,
    "aria-labelledby": titleId,
    tabIndex: -1,
  };

  return { panelProps, titleId };
}

/**
 * Keeps a dialog mounted for a short exit animation after `open` turns
 * false. Render while `present`; put `data-closing` on the overlay while
 * `closing` so CSS can play the exit (see .dialog-backdrop / .dialog-panel).
 */
export function usePresence(open: boolean, exitMs = 160) {
  const [present, setPresent] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) {
      setPresent(true);
      setClosing(false);
      return;
    }
    if (!present) return;
    setClosing(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      setPresent(false);
      setClosing(false);
    }, reduced ? 0 : exitMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return { present, closing };
}

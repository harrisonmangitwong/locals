"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import GoogleSignInButton from "./GoogleSignInButton";

interface SignInPromptProps {
  open: boolean;
  onClose: () => void;
  reason: string;
}

export default function SignInPrompt({ open, onClose, reason }: SignInPromptProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defers portal mounting until after hydration -- document.body isn't
    // available during SSR, and this must match RateRestaurantFlow.tsx's
    // mount guard so the initial client render matches the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="menu-drop w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl mb-5" style={{ color: "var(--text)" }}>
          {reason}
        </h2>
        <GoogleSignInButton className="w-full mb-2" />
        <button
          onClick={onClose}
          className="text-sm font-medium underline"
          style={{ color: "var(--text-muted)" }}
        >
          Not now
        </button>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useState } from "react";
import Icon from "./Icon";
import SignInPrompt from "./SignInPrompt";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface RequestRestaurantFormProps {
  triggerLabel?: string;
  className?: string;
}

export default function RequestRestaurantForm({
  triggerLabel = "Missing a spot or got feedback? Tell us",
  className = "",
}: RequestRestaurantFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const [showSignIn, setShowSignIn] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    if (!user) {
      setShowSignIn(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurant-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_name: name.trim(), note: note.trim() }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Couldn't send that. Try again?");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p role="status" className={`inline-flex items-center gap-1.5 text-[15px] fade-in ${className}`} style={{ color: "var(--text)" }}>
        <Icon name="circle-check" size={16} /> Thanks, we&apos;ll take a look.
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-[14px] font-medium min-h-[44px] px-3 rounded-full flex items-center transition-colors hover:bg-[var(--bg-subtle)]"
        style={{ color: "var(--text-secondary)" }}
      >
        {triggerLabel}
      </button>
      <div className={`filter-expand${open ? " open" : ""}`}>
        <div className="filter-expand-inner">
          <form onSubmit={handleSubmit} className="pt-3 flex flex-col gap-2 max-w-sm text-left">
            <label htmlFor="req-name" className="sr-only">Restaurant name or feedback</label>
            <input
              id="req-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Restaurant name or feedback"
              maxLength={200}
              required
              aria-describedby={error ? "req-error" : undefined}
              className="search-field h-11 rounded-xl px-4 text-[15px]"
            />
            <label htmlFor="req-note" className="sr-only">More details</label>
            <textarea
              id="req-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any more details? (optional)"
              maxLength={500}
              rows={2}
              className="search-field rounded-xl px-4 py-3 text-[15px] resize-none"
            />
            {error && (
              <p id="req-error" role="alert" className="text-[13px]" style={{ color: "var(--text)" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="soft-btn self-start px-6 text-[15px] disabled:opacity-40"
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>

      <SignInPrompt
        open={showSignIn}
        reason="Sign in to send a restaurant request"
        onClose={() => setShowSignIn(false)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";

interface RequestRestaurantFormProps {
  triggerLabel?: string;
  className?: string;
}

export default function RequestRestaurantForm({
  triggerLabel = "Don't see a restaurant here? Tell us",
  className = "",
}: RequestRestaurantFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
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
      setError("Something went wrong — try again?");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className={`text-sm fade-in ${className}`} style={{ color: "var(--success)" }}>
        Thanks — we&apos;ll take a look!
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-sm font-medium transition-opacity hover:opacity-75 min-h-[44px] flex items-center"
        style={{ color: "var(--accent-text)" }}
      >
        {triggerLabel}
      </button>
      <div className={`filter-expand${open ? " open" : ""}`}>
        <div className="filter-expand-inner">
          <form onSubmit={handleSubmit} className="pt-3 flex flex-col gap-2 max-w-sm text-left">
            <label htmlFor="req-name" className="sr-only">Restaurant name</label>
            <input
              id="req-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Restaurant name"
              maxLength={200}
              required
              className="search-input rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", outline: "none" }}
            />
            <label htmlFor="req-note" className="sr-only">Neighborhood or other details</label>
            <textarea
              id="req-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Neighborhood, cross street, anything that helps us find it (optional)"
              maxLength={500}
              rows={2}
              className="search-input rounded-lg px-3 py-2.5 text-sm resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", outline: "none" }}
            />
            {error && (
              <p className="text-xs" style={{ color: "var(--accent)" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="cta-btn self-start px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

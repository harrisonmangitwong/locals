"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface Person {
  userId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  isPrivate: boolean;
}

interface FindPeopleModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FindPeopleModal({ open, onClose }: FindPeopleModalProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [searched, setSearched] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
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

  // Reset on close so reopening doesn't show a stale search.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setPeople([]);
      setSearched(false);
    }
  }, [open]);

  // Debounced search-as-you-type.
  useEffect(() => {
    if (query.trim().length < 2) {
      setPeople([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        const d = await res.json();
        setPeople(d.people ?? []);
      } catch {
        setPeople([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="menu-drop w-full max-w-sm rounded-2xl p-6 max-h-[70vh] flex flex-col"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-lg mb-4" style={{ color: "var(--text)" }}>Find people</h2>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or username"
          autoFocus
          className="search-input rounded-lg px-3 py-2.5 text-sm mb-4 shrink-0"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", outline: "none" }}
        />

        <div className="overflow-y-auto overscroll-contain">
          {loading && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Searching…</p>
          )}

          {!loading && searched && people.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No one found.</p>
          )}

          {!loading && people.length > 0 && (
            <div className="flex flex-col gap-3">
              {people.map((p) => (
                <Link
                  key={p.userId}
                  href={p.username ? `/u/${p.username}` : `/list/${p.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 transition-opacity hover:opacity-75 active:opacity-60"
                >
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt="" aria-hidden="true" className="w-9 h-9 rounded-full shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ backgroundColor: "var(--accent)", color: "#241f18" }}
                    >
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{p.name}</span>
                    <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {p.username ? `@${p.username}` : "No username"}
                    </span>
                  </div>
                  {p.isPrivate && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: "var(--text-muted)" }} className="ml-auto shrink-0"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

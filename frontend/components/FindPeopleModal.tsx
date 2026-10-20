"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "@/lib/useDialog";
import PersonRow from "@/components/PersonRow";

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

  const { panelProps, titleId } = useDialog(open, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);


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
        {...panelProps}
      >
        <h2 id={titleId} className="text-[21px] font-semibold tracking-[-0.015em] mb-4">Find people</h2>

        <label htmlFor="find-people" className="sr-only">Search by name or username</label>
        <input
          id="find-people"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or username"
          autoComplete="off"
          className="search-field h-11 rounded-full px-4 text-[15px] mb-3 shrink-0"
        />

        <div className="overflow-y-auto overscroll-contain -mx-2 px-2" aria-live="polite">
          {loading && <p className="text-[15px] py-2" style={{ color: "var(--text-secondary)" }}>Searching…</p>}
          {!loading && searched && people.length === 0 && (
            <p className="text-[15px] py-2" style={{ color: "var(--text-secondary)" }}>No one by that name yet.</p>
          )}
          {!loading && people.length > 0 && (
            <ul className="flex flex-col">
              {people.map((p) => (
                <li key={p.userId}>
                  <PersonRow p={p} meta={p.username ? `@${p.username}` : null} onSelect={onClose} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface Person {
  userId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  isActiveLocal: boolean;
}

interface FollowListModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

export default function FollowListModal({ open, onClose, userId, type }: FollowListModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);

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

  useEffect(() => {
    if (!open) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/follow/list?userId=${userId}&type=${type}`);
        const d = await res.json();
        setPeople(d.people ?? []);
      } catch {
        setPeople([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, userId, type]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="menu-drop w-full max-w-sm rounded-2xl p-6 max-h-[70vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl mb-4" style={{ color: "var(--text)" }}>
          {type === "followers" ? "Followers" : "Following"}
        </h2>

        {loading && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        )}

        {!loading && people.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {type === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        )}

        {!loading && people.length > 0 && (
          <div className="flex flex-col gap-3">
            {people.map((p) => (
              <Link
                key={p.userId}
                href={p.username ? `/u/${p.username}` : `/list/${p.userId}`}
                onClick={onClose}
                className="flex items-center gap-3 transition-opacity hover:opacity-75"
              >
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt="" aria-hidden="true" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    {p.name[0]}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{p.name}</span>
                  {p.isActiveLocal && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Active locally</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

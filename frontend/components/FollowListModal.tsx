"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog, usePresence } from "@/lib/useDialog";
import PersonRow from "@/components/PersonRow";

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

  const { panelProps, titleId } = useDialog(open, onClose);
  const { present, closing } = usePresence(open);

  useEffect(() => {
    setMounted(true);
  }, []);


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

  if (!mounted || !present) return null;

  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      data-closing={closing || undefined}
      onClick={onClose}
    >
      <div
        className="dialog-panel w-full max-w-sm rounded-2xl p-6 max-h-[70vh] overflow-y-auto overscroll-contain"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
        {...panelProps}
      >
        <h2 id={titleId} className="text-[21px] font-semibold tracking-[-0.015em] mb-3">
          {type === "followers" ? "Followers" : "Following"}
        </h2>

        {loading && <p className="text-[15px] py-2" style={{ color: "var(--text-secondary)" }} role="status">Loading…</p>}

        {!loading && people.length === 0 && (
          <p className="text-[15px] py-2" style={{ color: "var(--text-secondary)" }}>
            {type === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        )}

        {!loading && people.length > 0 && (
          <ul className="flex flex-col">
            {people.map((p) => (
              <li key={p.userId}>
                <PersonRow p={p} meta={p.isActiveLocal ? "Active locally" : null} onSelect={onClose} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}

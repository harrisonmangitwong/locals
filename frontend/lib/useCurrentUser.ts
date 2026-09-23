"use client";

import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setUser(d.id ? { id: d.id } : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

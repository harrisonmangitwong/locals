import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Titled by the restaurant, so tabs, bookmarks and shared links say
// "Fish Cheeks · Locals" instead of the generic line.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/restaurant/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: "Restaurant" };
    const r = await res.json();
    const where = [r.neighborhood, r.cuisine !== "Restaurant" ? r.cuisine : null].filter(Boolean).join(" \u00b7 ");
    return {
      title: r.name,
      description: where ? `${r.name}: ${where}, ranked by what locals think.` : undefined,
      openGraph: { title: `${r.name} · Locals`, description: where || undefined },
    };
  } catch {
    return { title: "Restaurant" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

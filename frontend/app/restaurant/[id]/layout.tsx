import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/restaurant/${id}`, {
      next: { revalidate: 3600 },
    });
    const r = await res.json();

    const localRating = (r.local_weighted_rating as number) ?? 0;
    const touristRating = (r.tourist_weighted_rating as number) ?? 0;
    const gap = localRating - touristRating;

    let verdict = `Locals (${localRating.toFixed(1)}) and tourists (${touristRating.toFixed(1)}) agree.`;
    if (gap > 0.3)
      verdict = `Locals rate it ${localRating.toFixed(1)} vs. tourists' ${touristRating.toFixed(1)} — regulars love it more.`;
    if (gap < -0.3)
      verdict = `Tourists give it ${touristRating.toFixed(1)}, locals ${localRating.toFixed(1)} — popular with visitors.`;

    const title = `${r.name} — ${r.cuisine} in ${r.neighborhood} | Locals NYC`;
    const description = `${verdict} Ranked #${r.rank} on Locals NYC — where New Yorkers actually eat.`;
    const ogImage = `/api/og?id=${id}`;

    return {
      title,
      description,
      openGraph: {
        title: `${r.name} | Locals NYC`,
        description: verdict,
        images: [ogImage],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${r.name} | Locals NYC`,
        description: verdict,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "Locals NYC" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

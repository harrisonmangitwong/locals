import type { CSSProperties } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ProofCard from "@/components/ProofCard";
import { REVIEW_COUNT_LABEL } from "@/lib/stats";
import { PROOF_EXAMPLES } from "@/lib/proofExamples";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Live count, not hardcoded -- a stale "374 restaurants" is exactly the
// class of bug the 48k/73k review-count mismatch was. Revalidates hourly,
// matching the product's own batch-pipeline cadence rather than refetching
// on every request. Falls back to a vaguer phrase if the backend is ever
// unreachable at render time, rather than failing the whole page.
async function getRestaurantCount(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/api/recommendations?page_size=1`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.total === "number" ? data.total : null;
  } catch {
    return null;
  }
}

// How a pick is made, in the order it happens.
const STEPS = [
  {
    title: "Open and near you",
    body: "Only places that are open right now, within the distance and price you set.",
  },
  {
    title: "Rated by people who live here",
    body: "Every review counts, but reviews from New Yorkers count more. How local a reviewer is comes from where else they review, whether they’ve reviewed here over time or in one burst, and Google Local Guide status.",
  },
  {
    title: "Checked against the hype",
    body: "A model trained on 200 restaurants I rated by hand learns which places hold up and which are coasting on a reputation, and ranks the shortlist with it.",
  },
  {
    title: "Then you choose",
    body: "A few rounds of this or that, between places you haven’t been, until there’s one left. That’s where you’re going.",
  },
];

export default async function AboutPage() {
  const restaurantCount = await getRestaurantCount();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <h1 className="font-display text-[34px] md:text-[44px] rise" style={{ "--i": 0 } as CSSProperties}>About</h1>
        <p className="text-[21px] md:text-[23px] font-semibold leading-snug tracking-[-0.015em] mt-4 max-w-[30ch] text-pretty rise" style={{ "--i": 1 } as CSSProperties}>
          Most food apps give you endless recs. Locals tells you where to go tonight.
        </p>

        <div className="flex flex-col gap-4 mt-6 text-[17px] leading-relaxed max-w-[60ch] rise" style={{ color: "var(--text-secondary)", "--i": 2 } as CSSProperties}>
          <p>
            A few months ago I was traveling through Asia, trying to find good places to eat.
            Google, Yelp, Instagram, TikTok: every restaurant had nearly the same rating, and
            nothing told me which ones were actually worth going to.
          </p>
          <p>
            Back in New York, it was the same problem with more apps. Beli, Google Maps, TikTok,
            whatever friends had saved. I never had too few options. I&rsquo;d still end up somewhere
            overhyped, or too expensive for what it was, because the hard part was never finding
            a place. It was picking one.
          </p>
          <p>
            So Locals does the picking. Tell it what you&rsquo;re in the mood for, compare a few
            places that are open near you, and it hands you one. Behind that are {REVIEW_COUNT_LABEL}{" "}
            reviews of {restaurantCount ? `${restaurantCount.toLocaleString()} restaurants` : "restaurants"} across
            Manhattan, Brooklyn, Queens and the Bronx, weighted toward the people who actually live here.
          </p>
          <p>Hope it helps you find somewhere good tonight.</p>
          <p style={{ color: "var(--text)" }}>Harrison</p>
        </div>

        <section className="mt-12 rise" style={{ "--i": 3 } as CSSProperties} aria-labelledby="how-it-picks">
          <h2 id="how-it-picks" className="text-[21px] font-semibold tracking-[-0.015em]">How Locals picks</h2>
          <ol className="mt-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 py-3.5" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                <span className="text-[15px] font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                <span>
                  <span className="block text-[16px] font-semibold">{step.title}</span>
                  <span className="block text-[15px] leading-relaxed mt-0.5 max-w-[58ch]" style={{ color: "var(--text-secondary)" }}>{step.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <h3 className="text-[17px] font-semibold mt-8 mb-3">Where locals and visitors disagree</h3>
          <ProofCard item={PROOF_EXAMPLES[0]} />
        </section>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-12">
          <Link href="/pick" className="cta-btn inline-flex items-center justify-center px-8 text-[16px]">Help me pick</Link>
          <Link href="/recommendations" className="soft-btn inline-flex items-center justify-center px-8 text-[16px]">Browse all places</Link>
        </div>
        <p className="text-[14px] mt-5" style={{ color: "var(--text-secondary)" }}>
          Missing a spot, found a bug, or have feedback?{" "}
          <Link href="/recommendations#request-restaurant" className="font-medium underline underline-offset-4 transition-opacity hover:opacity-70" style={{ color: "var(--text)" }}>
            Tell us
          </Link>
        </p>
      </main>
    </div>
  );
}

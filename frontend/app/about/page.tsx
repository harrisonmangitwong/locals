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

export default async function AboutPage() {
  const restaurantCount = await getRestaurantCount();
  const factors = [
    {
      weight: "Most",
      title: "Geographic concentration",
      body: "What share of their reviews are for NYC restaurants? Someone who's reviewed 200 spots worldwide but only 1 in NYC is probably a tourist.",
    },
    {
      weight: "Some",
      title: "Review stability",
      body: "Have they been reviewing NYC spots consistently over time, or just in one burst during a trip?",
    },
    {
      weight: "A little",
      title: "Local Guide status",
      body: "Google-verified Local Guides get a small boost.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="about" />

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <h1 className="font-display text-[34px] md:text-[44px] rise" style={{ "--i": 0 } as CSSProperties}>About</h1>

        <div className="flex flex-col gap-4 mt-6 text-[17px] leading-relaxed max-w-[60ch] rise" style={{ color: "var(--text-secondary)", "--i": 1 } as CSSProperties}>
          <p>
            A few months ago I was traveling through Asia, trying to find good places to eat.
            Google, Yelp, Instagram, TikTok. Didn&apos;t matter which app, every restaurant
            had nearly identical ratings. No way to tell what was actually worth going to.
          </p>
          <p>
            I came back to NYC and realized the same problem exists here, just at a bigger
            scale. Ratings aren&apos;t wrong exactly, they&apos;re just not weighted by who&apos;s
            doing the rating. A local who&apos;s eaten there 20 times and a tourist who visited
            once shouldn&apos;t count the same. So I pulled together {REVIEW_COUNT_LABEL} NYC
            reviews and built Locals to fix that.
          </p>
          <p>
            Right now that covers{" "}
            {restaurantCount ? <>{restaurantCount.toLocaleString()} restaurants</> : "restaurants"} across
            Manhattan, Brooklyn, Queens, and the Bronx, with new spots added regularly.
          </p>
          <p>Hope it helps you find somewhere good.</p>
          <p style={{ color: "var(--text)" }}>Harrison</p>
        </div>

        <section className="mt-12 rise" style={{ "--i": 2 } as CSSProperties} aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-[21px] font-semibold tracking-[-0.015em]">How the score works</h2>
          <p className="text-[15px] mt-1.5 max-w-[60ch]" style={{ color: "var(--text-secondary)" }}>
            Every review counts, but reviews from people who actually live here count more. Three things decide how local a reviewer is:
          </p>
          <dl className="mt-4">
            {factors.map((f, i) => (
              <div key={f.title} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 py-3.5" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                <dt className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>{f.weight}</dt>
                <dd>
                  <span className="block text-[15px] font-semibold" style={{ color: "var(--text)" }}>{f.title}</span>
                  <span className="block text-[15px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{f.body}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-[15px] leading-relaxed mt-3 max-w-[60ch]" style={{ color: "var(--text-secondary)" }}>
            The full ranking also weighs review text and location, and refreshes as new data comes in.
          </p>

          <h3 className="text-[17px] font-semibold mt-8 mb-3">What that looks like on a real restaurant</h3>
          <ProofCard item={PROOF_EXAMPLES[0]} />
        </section>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-12 rise" style={{ "--i": 3 } as CSSProperties}>
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

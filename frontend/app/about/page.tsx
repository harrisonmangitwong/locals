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
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="about" />

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-10">About</h1>

        <div className="space-y-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
          <p style={{ color: "var(--text-muted)" }}>- Harrison</p>
        </div>

        {/* How the score works — for the curious */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="font-semibold text-lg mb-1" style={{ color: "var(--text)" }}>How the score works</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Here&apos;s how the ratings work, for the curious.</p>
          <div className="space-y-4 rounded-xl p-5 mb-6" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-4">
              <span className="font-bold text-lg leading-none shrink-0 w-14" style={{ color: "var(--text)" }}>Most</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Geographic concentration</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>What share of their reviews are for NYC restaurants? Someone who&apos;s reviewed 200 spots worldwide but only 1 in NYC is probably a tourist.</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex items-start gap-4">
              <span className="font-bold text-lg leading-none shrink-0 w-14" style={{ color: "var(--text)" }}>Some</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Review stability</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>Have they been reviewing NYC spots consistently over time, or just in one burst during a trip?</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex items-start gap-4">
              <span className="font-bold text-lg leading-none shrink-0 w-14" style={{ color: "var(--text)" }}>Minor</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Local Guide status</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>Google-verified Local Guides get a small boost.</div>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
            The full ranking also weighs review text and location, and refreshes as new data comes in.
          </p>

          <p className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>What that looks like on a real restaurant:</p>
          <ProofCard item={PROOF_EXAMPLES[0]} />
        </div>

        {/* CTA */}
        <div className="pt-10">
          <Link
            href="/recommendations"
            className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
          >
            Browse recommendations
          </Link>
          <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
            Missing a spot, found a bug, or have feedback?{" "}
            <Link href="/recommendations#request-restaurant" className="font-medium transition-opacity hover:opacity-75 active:opacity-60" style={{ color: "var(--accent-text)" }}>
              Tell us
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

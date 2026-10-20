import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Icon from "@/components/Icon";
import { type CSSProperties } from "react";
import Collage from "@/components/Collage";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import { type Candidate, PlaceRow } from "@/components/PickCard";
import { REVIEW_COUNT_LABEL, RESTAURANT_POOL_LABEL } from "@/lib/stats";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Real places that are open right now: their photos float around the
// headline, and the first few are listed below it. Refreshed every 15
// minutes; if the API is down or nothing is open, the page just goes
// without them.
async function getOpenNow(): Promise<Candidate[]> {
  try {
    const res = await fetch(`${API_BASE}/api/pick`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const { candidates = [] } = (await res.json()) as { candidates?: Candidate[] };
    return candidates;
  } catch {
    return [];
  }
}

export default async function Home() {
  const places = await getOpenNow();

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <section id="main-content" className="short-hero w-full px-4 sm:px-6 pt-6 md:pt-10 pb-12 text-center overflow-x-clip">
        <Collage places={places} />

        <h1 className="font-display text-[46px] sm:text-[58px] md:text-[66px] mt-4 rise" style={{ "--i": 4 } as CSSProperties}>Let&rsquo;s eat.</h1>
        <p className="text-[17px] sm:text-[19px] leading-snug mt-3 mx-auto max-w-[30ch] text-pretty rise" style={{ color: "var(--text-secondary)", "--i": 5 } as CSSProperties}>
          Most food apps give you endless recs. Locals tells you where to go tonight.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5 mt-7 mx-auto max-w-sm sm:max-w-none rise" style={{ "--i": 6 } as CSSProperties}>
          <Link href="/pick" className="cta-btn inline-flex items-center justify-center px-8 text-[16px]">
            Help me pick
          </Link>
          <Link href="/recommendations" className="soft-btn inline-flex items-center justify-center px-8 text-[16px]">
            Browse all places
          </Link>
        </div>
        <p className="text-[13px] mt-5" style={{ color: "var(--text-muted)" }}>
          <Link href="/about" className="underline-offset-4 decoration-[var(--border-strong)] hover:underline transition-colors hover:text-[var(--text-secondary)]">
            Ranked from {REVIEW_COUNT_LABEL} reviews of {RESTAURANT_POOL_LABEL} NYC restaurants
          </Link>
        </p>
      </section>

      {places.length > 0 && (
        <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-14" aria-labelledby="open-now">
          <div className="flex items-baseline justify-between mb-5">
            <h2 id="open-now" className="text-[21px] font-semibold tracking-[-0.015em]">Open right now</h2>
            <Link href="/recommendations" className="inline-flex items-center gap-0.5 min-h-[44px] -mr-2 px-2 rounded-full text-[15px] font-medium transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: "var(--text-secondary)" }}>
              See all <Icon name="chevron-right" size={15} />
            </Link>
          </div>
          <ScrollSpotlight>
            <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
              {places.slice(0, 4).map((c) => (
                <li key={c.restaurant_id}>
                  <Link href={`/restaurant/${c.restaurant_id}`} className="row-link block rounded-2xl p-2.5 -m-2.5">
                    <PlaceRow c={c} />
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollSpotlight>
        </section>
      )}

      <footer
        className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[14px]"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        <span className="text-[17px] font-bold tracking-[-0.025em]" style={{ color: "var(--text)" }}>Locals</span>
        <nav className="flex items-center gap-1 -mx-2">
          <Link href="/pick" className="inline-flex items-center min-h-[44px] px-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]">Pick</Link>
          <Link href="/recommendations" className="inline-flex items-center min-h-[44px] px-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]">Browse</Link>
          <Link href="/about" className="inline-flex items-center min-h-[44px] px-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]">About</Link>
        </nav>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>&copy; {new Date().getFullYear()} Locals</p>
      </footer>
    </main>
  );
}

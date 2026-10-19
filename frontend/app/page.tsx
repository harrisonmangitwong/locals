import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { type Candidate, PickCardBody } from "@/components/PickCard";
import { REVIEW_COUNT_LABEL, RESTAURANT_POOL_LABEL } from "@/lib/stats";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Two real places that are open right now, shown as the same this-or-that
// Help me pick uses, so the homepage shows the product instead of
// describing it. Refreshed every 15 minutes; if the API is down or almost
// nothing is open (late night), the hero just goes without it.
async function getTonightPair(): Promise<Candidate[]> {
  try {
    const res = await fetch(`${API_BASE}/api/pick`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const { candidates = [] } = (await res.json()) as { candidates?: Candidate[] };
    const [first, ...rest] = candidates;
    if (!first) return [];
    // A real choice reads better than two of the same kind of night out.
    const second =
      rest.find((c) => c.cuisine !== first.cuisine && c.price_midpoint !== first.price_midpoint) ??
      rest.find((c) => c.cuisine !== first.cuisine) ??
      rest[0];
    return second ? [first, second] : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const pair = await getTonightPair();

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <section id="main-content" className="flex-1 flex items-center">
        <div
          className={`w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid gap-12 md:gap-16 items-center${pair.length ? " md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]" : ""}`}
        >
          <div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl mb-5 text-balance">Let&apos;s eat.</h1>
            <p className="text-lg sm:text-xl max-w-md mb-8 leading-relaxed text-pretty" style={{ color: "var(--text-secondary)" }}>
              Most food apps give you endless recs. Locals tells you where to go tonight.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/pick" className="cta-btn inline-flex items-center justify-center px-7 py-3 rounded-full text-base font-semibold">
                Help me pick
              </Link>
              <Link
                href="/recommendations"
                className="text-base font-semibold underline underline-offset-4 decoration-1 transition-opacity hover:opacity-75"
                style={{ color: "var(--text-secondary)" }}
              >
                Browse all places
              </Link>
            </div>
            <p className="mt-8 text-sm" style={{ color: "var(--text-muted)" }}>
              Ranked from {REVIEW_COUNT_LABEL} reviews of {RESTAURANT_POOL_LABEL} NYC restaurants.
            </p>
          </div>

          {pair.length === 2 && (
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-display text-xl sm:text-2xl">Which sounds better tonight?</h2>
                <span className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success-strong)" }} aria-hidden="true" />
                  Open now
                </span>
              </div>
              <div className="grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-4 items-stretch">
                {pair.map((c, i) => (
                  <div key={c.restaurant_id} className="contents">
                    {i === 1 && (
                      <span className="text-sm font-semibold text-center self-center" style={{ color: "var(--text-secondary)" }} aria-hidden="true">or</span>
                    )}
                    <Link href="/pick" aria-label={`Help me pick, starting with places like ${c.name}`} className="pick-choice rounded-2xl overflow-hidden flex flex-col">
                      <PickCardBody c={c} photoClass="h-36 sm:h-48" sizes="(max-width: 640px) 100vw, 400px" priority={i === 0} />
                    </Link>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed max-w-md" style={{ color: "var(--text-muted)" }}>
                Help me pick narrows places like these down to one, based on what you&apos;re craving, your budget, and how far you&apos;ll go.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div>
          <span className="font-display text-lg" style={{ color: "var(--text)" }}>Locals</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/recommendations" className="text-sm transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Browse
          </Link>
          <Link href="/about" className="text-sm transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            About
          </Link>
        </nav>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          &copy; {new Date().getFullYear()} Locals
        </p>
      </footer>
    </main>
  );
}

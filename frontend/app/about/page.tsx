import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { ARCHETYPES } from "@/lib/archetypes";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/recommendations" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Recs
          </Link>
          <Link href="/favorites" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Saved
          </Link>
          <Link href="/visited" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Visited
          </Link>
          <Link href="/about" className="text-xs sm:text-sm font-medium" style={{ color: "var(--text)" }}>
            About
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-10">About</h1>

        <div className="space-y-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <p>
            A few months ago I was traveling through Asia, trying to find good places to eat.
            Google, Yelp, Instagram, TikTok — didn&apos;t matter which app, every restaurant
            had nearly identical ratings. No way to tell what was actually worth going to.
          </p>
          <p>
            I came back to NYC and realized the same problem exists here, just at a bigger
            scale. Ratings aren&apos;t wrong exactly, they&apos;re just not weighted by who&apos;s
            doing the rating — a local who&apos;s eaten there 20 times and a tourist who visited
            once shouldn&apos;t count the same. So I scraped 48,000+ NYC reviews and built
            Locals to fix that.
          </p>
          <p>Hope you enjoy :)</p>
          <p style={{ color: "var(--text-muted)" }}>- Harrison</p>
        </div>

        {/* How the score works — for the curious */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="font-display text-lg mb-1" style={{ color: "var(--text)" }}>How the score works</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Here&apos;s how the ratings work, for the curious.</p>
          <div className="space-y-4 rounded-xl p-5 mb-6" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-4">
              <span className="font-display text-xl leading-none shrink-0 w-10" style={{ color: "var(--warm)" }}>60%</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Geographic concentration</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>What share of their reviews are for NYC restaurants? Someone who&apos;s reviewed 200 spots worldwide but only 1 in NYC is probably a tourist.</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex items-start gap-4">
              <span className="font-display text-xl leading-none shrink-0 w-10" style={{ color: "var(--warm)" }}>25%</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Review stability</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>Have they been reviewing NYC spots consistently over time, or just in one burst during a trip?</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex items-start gap-4">
              <span className="font-display text-xl leading-none shrink-0 w-10" style={{ color: "var(--warm)" }}>15%</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Local Guide status</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>Google-verified Local Guides get a small boost.</div>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            The full ranking also weighs review text and location, and refreshes as new data comes in.
          </p>
        </div>

        {/* What the tags mean */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="font-display text-lg mb-1" style={{ color: "var(--text)" }}>What the tags mean</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Not every restaurant gets a badge on its card — only the ones that clearly earn one.
          </p>
          <div className="space-y-4 rounded-xl p-5" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            {(Object.keys(ARCHETYPES) as (keyof typeof ARCHETYPES)[]).map((key, i) => (
              <div key={key}>
                {i > 0 && <div className="mb-4" style={{ borderTop: "1px solid var(--border)" }} />}
                <div className="flex items-start gap-4">
                  <span
                    className="text-xs font-medium shrink-0 px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: ARCHETYPES[key].bg, color: ARCHETYPES[key].color }}
                  >
                    {key}
                  </span>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>{ARCHETYPES[key].description}</div>
                </div>
              </div>
            ))}
          </div>
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
            Know a spot we&apos;re missing?{" "}
            <Link href="/recommendations" className="font-medium hover:opacity-75" style={{ color: "var(--accent-text)" }}>
              Browse and tell us
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

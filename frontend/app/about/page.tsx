import Link from "next/link";

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
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Home
          </Link>
          <Link href="/recommendations" className="text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Recommendations
          </Link>
          <Link href="/favorites" className="text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Favorites
          </Link>
          <Link href="/about" className="text-sm font-medium" style={{ color: "var(--text)" }}>
            About
          </Link>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">How Locals Works</h1>
        <p className="text-sm mb-12" style={{ color: "var(--text-muted)" }}>
          The methodology behind our restaurant rankings
        </p>

        {/* The Problem */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--accent-text)" }}>
            The Problem
          </h2>
          <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Google Maps rankings are skewed by tourist reviews. A restaurant near Times Square
            with thousands of one-time visitor reviews can outrank an authentic neighborhood spot
            that locals return to every week. Star ratings alone don&apos;t tell you who&apos;s
            doing the rating.
          </p>
        </section>

        {/* The Data */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--accent-text)" }}>
            The Data
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            We scraped 48,000+ reviews across 1,000+ NYC restaurants using Apify&apos;s Google Maps
            crawler. For each review, we capture the star rating plus reviewer metadata:
          </p>
          <ul className="list-disc list-inside space-y-2" style={{ color: "var(--text-secondary)" }}>
            <li><strong style={{ color: "var(--text)" }}>Global review count</strong> — total reviews posted worldwide</li>
            <li><strong style={{ color: "var(--text)" }}>NYC review count</strong> — how many reviews are for NYC restaurants</li>
            <li><strong style={{ color: "var(--text)" }}>Local Guide status</strong> — whether Google has verified them as a Local Guide</li>
            <li><strong style={{ color: "var(--text)" }}>Review recency</strong> — how recently they reviewed NYC spots</li>
          </ul>
        </section>

        {/* Localness Score */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--accent-text)" }}>
            Localness Score
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            Each reviewer gets a localness score from 0 to 1 based on three weighted signals:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="font-display text-2xl leading-none shrink-0" style={{ color: "var(--accent-text)" }}>60%</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Geographic concentration</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  NYC reviews / global reviews. A tourist with 300 worldwide reviews but 1 NYC review scores low.
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex items-start gap-4">
              <span className="font-display text-2xl leading-none shrink-0" style={{ color: "var(--accent-text)" }}>25%</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Review stability</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Consistent NYC reviewing over time, not a one-time visit.
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex items-start gap-4">
              <span className="font-display text-2xl leading-none shrink-0" style={{ color: "var(--accent-text)" }}>15%</span>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Local Guide badge</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Google-verified Local Guides get a small boost.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Restaurant Ranking */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--accent-text)" }}>
            Restaurant Ranking
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            Each restaurant&apos;s final score blends multiple perspectives:
          </p>
          <ol className="list-decimal list-inside space-y-2" style={{ color: "var(--text-secondary)" }}>
            <li><strong style={{ color: "var(--text)" }}>Local-weighted rating</strong> — average rating weighted by reviewer localness</li>
            <li><strong style={{ color: "var(--text)" }}>Tourist-weighted rating</strong> — the inverse, to measure tourist sentiment separately</li>
            <li><strong style={{ color: "var(--text)" }}>NLP signals</strong> — keyword analysis of review text (quality language, local language, tourist complaints)</li>
            <li><strong style={{ color: "var(--text)" }}>Location and price data</strong> — distance from tourist centers, price range, rating distribution</li>
          </ol>
          <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            A Random Forest model trained on 200+ hand-labeled restaurants classifies each spot
            as &quot;local-approved&quot; or not. The model uses 21 features spanning review statistics,
            NLP signals, and location data. Restaurants that pass are ranked by confidence score
            and surfaced in the app.
          </p>
        </section>

        {/* Vision */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--accent-text)" }}>
            What&apos;s Next
          </h2>
          <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Locals started with NYC, but the vision is bigger: help you find the right
            (non-touristy) restaurants wherever you are and wherever you travel. We&apos;re
            expanding to more cities soon.
          </p>
        </section>

        {/* CTA */}
        <div className="pt-4">
          <Link
            href="/recommendations"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            Browse recommendations
          </Link>
        </div>
      </main>
    </div>
  );
}

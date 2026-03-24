import Link from "next/link";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#111111", color: "#f1f5f9" }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "rgba(17,17,17,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(241,245,249,0.08)",
        }}
      >
        <Link href="/" className="font-bold text-lg" style={{ color: "#f1f5f9" }}>
          🍜 Locals
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm transition-colors hover:opacity-75"
            style={{ color: "rgba(241,245,249,0.55)" }}
          >
            Home
          </Link>
          <Link
            href="/recommendations"
            className="text-sm transition-colors hover:opacity-75"
            style={{ color: "rgba(241,245,249,0.55)" }}
          >
            Recommendations
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium"
            style={{ color: "#f1f5f9" }}
          >
            About
          </Link>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">How Locals Works</h1>
        <p className="text-sm mb-10" style={{ color: "rgba(241,245,249,0.55)" }}>
          The methodology behind our restaurant rankings
        </p>

        {/* The Problem */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#ff385c" }}>
            The Problem
          </h2>
          <p className="leading-relaxed" style={{ color: "rgba(241,245,249,0.75)" }}>
            Google Maps rankings are skewed by tourist reviews. A restaurant near Times Square
            with thousands of one-time visitor reviews can outrank an authentic neighborhood spot
            that locals return to every week. Star ratings alone don&apos;t tell you who&apos;s
            doing the rating.
          </p>
        </section>

        {/* The Data */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#ff385c" }}>
            The Data
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "rgba(241,245,249,0.75)" }}>
            We scrape 7,500+ reviews from Google Maps across NYC neighborhoods using Apify.
            For each review, we capture not just the star rating, but reviewer metadata:
          </p>
          <ul className="list-disc list-inside space-y-2" style={{ color: "rgba(241,245,249,0.75)" }}>
            <li><strong style={{ color: "#f1f5f9" }}>Global review count</strong> — how many total reviews the reviewer has posted worldwide</li>
            <li><strong style={{ color: "#f1f5f9" }}>NYC review count</strong> — how many of their reviews are for NYC restaurants</li>
            <li><strong style={{ color: "#f1f5f9" }}>Local Guide status</strong> — whether Google has verified them as a Local Guide</li>
            <li><strong style={{ color: "#f1f5f9" }}>Review recency</strong> — how recently they reviewed NYC spots</li>
          </ul>
        </section>

        {/* Localness Score */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#ff385c" }}>
            Localness Score
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "rgba(241,245,249,0.75)" }}>
            Each reviewer gets a localness score from 0 to 1 based on three weighted signals:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(241,245,249,0.12)" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: "#ff385c" }}>60%</div>
              <div className="text-sm font-medium mb-1">Geographic concentration</div>
              <div className="text-xs" style={{ color: "rgba(241,245,249,0.55)" }}>
                NYC reviews / global reviews. A tourist with 300 worldwide reviews but 1 NYC review scores low.
              </div>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(241,245,249,0.12)" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: "#ff385c" }}>25%</div>
              <div className="text-sm font-medium mb-1">Review stability</div>
              <div className="text-xs" style={{ color: "rgba(241,245,249,0.55)" }}>
                Consistent NYC reviewing over time, not a one-time visit.
              </div>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(241,245,249,0.12)" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: "#ff385c" }}>15%</div>
              <div className="text-sm font-medium mb-1">Local Guide badge</div>
              <div className="text-xs" style={{ color: "rgba(241,245,249,0.55)" }}>
                Google-verified Local Guides get a small boost.
              </div>
            </div>
          </div>
        </section>

        {/* Restaurant Ranking */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#ff385c" }}>
            Restaurant Ranking
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: "rgba(241,245,249,0.75)" }}>
            Each restaurant&apos;s final score blends two perspectives:
          </p>
          <ol className="list-decimal list-inside space-y-2" style={{ color: "rgba(241,245,249,0.75)" }}>
            <li><strong style={{ color: "#f1f5f9" }}>Local-weighted rating</strong> — average rating weighted by each reviewer&apos;s localness score, so locals&apos; opinions count more</li>
            <li><strong style={{ color: "#f1f5f9" }}>Tourist-weighted rating</strong> — the inverse weighting, to measure tourist sentiment separately</li>
            <li><strong style={{ color: "#f1f5f9" }}>Adjusted score</strong> — combines local rating, tourist penalty, and review volume into a single ranking metric</li>
          </ol>
          <p className="mt-4 leading-relaxed" style={{ color: "rgba(241,245,249,0.75)" }}>
            A logistic regression model then classifies each restaurant as &quot;local-approved&quot;
            or not. Restaurants that pass the threshold are ranked by their adjusted score and surfaced
            in the app.
          </p>
        </section>

        {/* Vision */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#ff385c" }}>
            What&apos;s Next
          </h2>
          <p className="leading-relaxed" style={{ color: "rgba(241,245,249,0.75)" }}>
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
            style={{ backgroundColor: "#ff385c", color: "#ffffff" }}
          >
            Browse recommendations →
          </Link>
        </div>
      </main>
    </div>
  );
}

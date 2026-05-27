import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/recommendations"
            className="text-xs sm:text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            Recs
          </Link>
          <Link
            href="/favorites"
            className="text-xs sm:text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            Saved
          </Link>
          <Link
            href="/visited"
            className="text-xs sm:text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            Visited
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            About
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-20 sm:py-28 text-center">
        {/* Eyebrow */}
        <span
          className="inline-block text-xs font-medium tracking-widest uppercase mb-8 px-3 py-1.5 rounded-full"
          style={{ color: "var(--accent-text)", backgroundColor: "var(--accent-soft)", letterSpacing: "0.12em" }}
        >
          New York City
        </span>

        {/* Headline — serif, no gradient */}
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl mb-6 max-w-2xl"
          style={{ color: "var(--text)" }}
        >
          Eat like a local.
          <br />
          <span style={{ color: "var(--accent)" }}>Not a tourist.</span>
        </h1>

        {/* Subtext */}
        <p
          className="text-lg md:text-xl max-w-lg mb-14 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          We analyze thousands of NYC restaurant reviews to find the places
          real New Yorkers love — not the ones tourists stumble into.
        </p>

        {/* CTA */}
        <Link
          href="/recommendations"
          className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        >
          Find a restaurant
        </Link>
        <p className="mt-4 mb-14 text-xs" style={{ color: "var(--text-muted)" }}>
          48,000+ Google Maps reviews &mdash; filtered for who&apos;s actually from here
        </p>

        {/* How it works — editorial text, not cards */}
        <div className="mt-28 max-w-2xl w-full text-left">
          <h2
            className="font-display text-2xl mb-8"
            style={{ color: "var(--text)" }}
          >
            How it works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-5">
              <span
                className="font-display text-3xl leading-none shrink-0 w-8"
                style={{ color: "var(--warm)" }}
              >
                1
              </span>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                  Score every reviewer
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  We look at each reviewer&apos;s history to figure out if they live in
                  NYC or were just passing through.
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex gap-5">
              <span
                className="font-display text-3xl leading-none shrink-0 w-8"
                style={{ color: "var(--warm)" }}
              >
                2
              </span>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                  Weight the ratings
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Local reviewers&apos; opinions count more. Restaurants that coast on
                  out-of-towner hype get penalized.
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex gap-5">
              <span
                className="font-display text-3xl leading-none shrink-0 w-8"
                style={{ color: "var(--warm)" }}
              >
                3
              </span>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                  Rank by local love
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Restaurants where locals keep coming back — not ones that ride
                  tourist hype — rise to the top.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

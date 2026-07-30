import Link from "next/link";
import UserMenu from "@/components/UserMenu";

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
          <UserMenu />
        </nav>
      </header>

      {/* Hero */}
      <section id="main-content" className="flex flex-col items-center justify-center flex-1 px-6 py-20 sm:py-28 text-center">
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl mb-6 max-w-2xl"
          style={{ color: "var(--text)" }}
        >
          Eat like a local.
          <br />
          <span style={{ color: "var(--accent)" }}>Not a tourist.</span>
        </h1>

        <p
          className="text-lg md:text-xl max-w-md mb-12 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          We sift through the tourist traps so you don&apos;t have to.
        </p>

        <Link
          href="/recommendations"
          className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
        >
          Find a restaurant
        </Link>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          48,000+ Google Maps reviews &mdash; filtered for who&apos;s actually from here
        </p>
      </section>
    </main>
  );
}

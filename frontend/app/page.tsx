import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import DinerProofCard from "@/components/DinerProofCard";
import { REVIEW_COUNT_LABEL, RESTAURANT_POOL_LABEL } from "@/lib/stats";
import { PROOF_EXAMPLES as FEATURED } from "@/lib/proofExamples";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      {/* Hero -- a 24-hour NYC diner counter, not another editorial food
          page. Day shift in light mode, neon night shift in dark mode; see
          .diner-hero in globals.css and this page's surface brief. */}
      <section id="main-content" className="diner-hero flex-1 flex items-center">
        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row gap-12 md:gap-16 md:items-center">
          <div className="flex-1">
            <div className="diner-open-tag mb-5">
              <span className="diner-open-dot" />
              Open &middot; deciding now
            </div>
            <h1 className="diner-headline text-5xl sm:text-6xl md:text-7xl mb-6">
              Let&apos;s eat.
            </h1>

            <p className="diner-sub text-lg sm:text-xl max-w-md mb-10 leading-relaxed">
              Ranking NYC&apos;s restaurants by who actually eats here, not just by star ratings.
            </p>

            <Link href="/recommendations" className="diner-cta-btn">
              Browse the picks
            </Link>
            <p className="diner-footer-stat mt-6 text-xs uppercase tracking-wide">
              {REVIEW_COUNT_LABEL} reviews &middot; {RESTAURANT_POOL_LABEL} NYC restaurants, filtered for locals
            </p>
          </div>

          <div className="diner-cards min-w-0">
            {FEATURED.slice(0, 2).map((item, i) => (
              <DinerProofCard key={item.name} item={item} rotate={i === 0 ? "left" : "right"} />
            ))}
          </div>
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
            Browse restaurants
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

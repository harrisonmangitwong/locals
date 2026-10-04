import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ProofCard from "@/components/ProofCard";

// Real examples for the homepage's trust proof-point -- a curated, static
// pick (not a live fetch), same batch-pipeline philosophy as the rest of the
// product. Every restaurant photo in this dataset is a ~408px-wide Google
// Places thumbnail, so a single full-bleed hero blows them up 3x+ and turns
// soft. A 3-up grid at roughly card width renders each one near its native
// resolution instead (this is exactly the card-grid layout the rest of the
// app already uses these same images at). These are the three largest
// local-vs-tourist rating gaps in backend/data.csv among restaurants both
// sides still rate 4.0+ (so the gap is "locals love it a bit more," not
// "tourists think it's bad") -- checked by looking at each actual photo, not
// just its data row. Revisit if a future data refresh changes these numbers.
const FEATURED = [
  {
    name: "Yopcity Restaurant",
    neighborhood: "Belmont",
    cuisine: "American",
    imageUrl: "https://komriwzkkknrsirifgqg.supabase.co/storage/v1/object/public/restaurant-photos/r_243c5d.jpg",
    localRating: 4.5,
    touristRating: 4.1,
  },
  {
    name: "Grandma’s Dumpling House",
    neighborhood: "Tribeca",
    cuisine: "Chinese",
    imageUrl: "https://komriwzkkknrsirifgqg.supabase.co/storage/v1/object/public/restaurant-photos/r_7a662f.jpg",
    localRating: 4.7,
    touristRating: 4.4,
  },
  {
    name: "Veselka Williamsburg",
    neighborhood: "Williamsburg",
    cuisine: "Ukrainian",
    imageUrl: "https://komriwzkkknrsirifgqg.supabase.co/storage/v1/object/public/restaurant-photos/r_742cf1.jpg",
    localRating: 4.6,
    touristRating: 4.3,
  },
];

// Slight alternating horizontal offset per card -- a loose, stacked-photos
// feel instead of a rigid list, echoing the asymmetry of the hero split.
const CARD_OFFSET = ["", "sm:ml-8", "sm:ml-4"];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      {/* Hero -- the proof strip beside the pitch demonstrates the product
          immediately, instead of requiring a scroll to see it work. */}
      <section
        id="main-content"
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-16 items-start"
      >
        <div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl mb-6" style={{ color: "var(--text)" }}>
            Let&apos;s eat.
          </h1>

          <p className="text-lg sm:text-xl max-w-md mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Ranking NYC&apos;s restaurants by who actually eats here, not just by star ratings.
          </p>

          <Link
            href="/recommendations"
            className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
          >
            Find restaurants
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            73,000+ reviews across 2,000+ NYC restaurants, filtered for locals.
          </p>
        </div>

        <div className="rounded-3xl p-5 sm:p-6" style={{ backgroundColor: "var(--accent-soft)" }}>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            Some examples where local ratings are higher
          </p>
          <div className="flex flex-col gap-4">
            {FEATURED.map((item, i) => (
              <div key={item.name} className={CARD_OFFSET[i]}>
                <ProofCard item={item} />
              </div>
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

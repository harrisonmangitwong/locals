import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";

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

function ProofCard({ item }: { item: (typeof FEATURED)[number] }) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}
    >
      <div className="relative overflow-hidden h-52 sm:h-48">
        <Image
          src={item.imageUrl}
          alt={`${item.name} in ${item.neighborhood}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.name}</p>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{item.neighborhood} &middot; {item.cuisine}</p>

        {/* Scoreboard: locals' number visually wins, tourists' is muted */}
        <div className="flex items-center gap-4">
          <div>
            <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{item.localRating.toFixed(1)}</span>
            <span className="block text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Locals</span>
          </div>
          <div className="w-px self-stretch" style={{ backgroundColor: "var(--border)" }} />
          <div>
            <span className="text-2xl font-semibold" style={{ color: "var(--text-muted)" }}>{item.touristRating.toFixed(1)}</span>
            <span className="block text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Tourists</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      {/* Hero */}
      <section id="main-content" className="flex flex-col items-center justify-center px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl mb-6" style={{ color: "var(--text)" }}>
          No more tourist traps.
        </h1>

        <p className="text-lg md:text-xl max-w-md mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          We rank restaurants by who actually eats there, not just star rating.
        </p>

        <Link
          href="/recommendations"
          className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
        >
          Find restaurants
        </Link>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          73,000+ Google Maps reviews across 2,000+ NYC restaurants, filtered for who&apos;s actually from here
        </p>
      </section>

      {/* Proof: real restaurants, real local-vs-tourist gaps */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-xl sm:text-2xl font-semibold mb-8 text-center" style={{ color: "var(--text)" }}>
          Some examples where local ratings are higher.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED.map((item) => (
            <ProofCard key={item.name} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

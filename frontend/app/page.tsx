import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Icon from "@/components/Icon";
import { type Candidate, PickPhoto, PlaceRow } from "@/components/PickCard";
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

// Where each photo floats, as % of the collage box, plus a slight tilt.
const TILES = [
  { left: 2, top: 26, rot: -7, size: 0.86 },
  { left: 17, top: 58, rot: 5, size: 0.8 },
  { left: 31, top: 6, rot: -2, size: 1 },
  { left: 51, top: 44, rot: 4, size: 0.94 },
  { left: 65, top: 4, rot: -5, size: 0.84 },
  { left: 77, top: 50, rot: 6, size: 0.8 },
];

export default async function Home() {
  const places = await getOpenNow();

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <section id="main-content" className="w-full px-4 sm:px-6 pt-6 md:pt-10 pb-12 text-center overflow-x-clip">
        {places.length >= TILES.length && (
          <div className="relative mx-auto max-w-5xl h-[230px] sm:h-[320px] md:h-[400px] lg:h-[440px]" aria-hidden="true">
            {TILES.map((t, i) => (
              <div
                key={places[i].restaurant_id}
                className="absolute"
                style={{
                  left: `${t.left}%`,
                  top: `${t.top}%`,
                  width: `calc(clamp(82px, 17vw, 210px) * ${t.size})`,
                  transform: `rotate(${t.rot}deg)`,
                }}
              >
                <PickPhoto
                  c={places[i]}
                  sizes="160px"
                  priority={i < 3}
                  className="collage-tile relative block aspect-square"
                />
              </div>
            ))}
          </div>
        )}

        <h1 className="font-display text-[46px] sm:text-[58px] md:text-[66px] mt-4">Let&rsquo;s eat.</h1>
        <p className="text-[17px] sm:text-[19px] leading-snug mt-3 mx-auto max-w-[30ch] text-pretty" style={{ color: "var(--text-secondary)" }}>
          Most food apps give you endless recs. Locals tells you where to go tonight.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5 mt-7 mx-auto max-w-sm sm:max-w-none">
          <Link href="/pick" className="cta-btn inline-flex items-center justify-center px-8 text-[16px]">
            Help me pick
          </Link>
          <Link href="/recommendations" className="soft-btn inline-flex items-center justify-center px-8 text-[16px]">
            Browse all places
          </Link>
        </div>
        <p className="text-[13px] mt-5" style={{ color: "var(--text-muted)" }}>
          Ranked from {REVIEW_COUNT_LABEL} reviews of {RESTAURANT_POOL_LABEL} NYC restaurants
        </p>
      </section>

      {places.length > 0 && (
        <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-14" aria-labelledby="open-now">
          <div className="flex items-baseline justify-between mb-5">
            <h2 id="open-now" className="text-[21px] font-semibold tracking-[-0.015em]">Open right now</h2>
            <Link href="/recommendations" className="inline-flex items-center gap-0.5 text-[15px] font-medium transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
              See all <Icon name="chevron-right" size={15} />
            </Link>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
            {places.slice(0, 4).map((c) => (
              <li key={c.restaurant_id}>
                <Link href={`/restaurant/${c.restaurant_id}`} className="block rounded-2xl p-2 -m-2 transition-colors hover:bg-[var(--bg-subtle)]">
                  <PlaceRow c={c} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer
        className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[14px]"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        <span className="text-[17px] font-bold tracking-[-0.025em]" style={{ color: "var(--text)" }}>Locals</span>
        <nav className="flex items-center gap-5">
          <Link href="/pick" className="transition-opacity hover:opacity-70">Pick</Link>
          <Link href="/recommendations" className="transition-opacity hover:opacity-70">Browse</Link>
          <Link href="/about" className="transition-opacity hover:opacity-70">About</Link>
        </nav>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>&copy; {new Date().getFullYear()} Locals</p>
      </footer>
    </main>
  );
}

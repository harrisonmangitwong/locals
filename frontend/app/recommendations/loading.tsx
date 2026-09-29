import SiteHeader from "@/components/SiteHeader";

// Shown instantly on navigation to /recommendations, before the page's own
// data fetch resolves -- mirrors the page's real shell and the skeleton
// cards it already renders for its own client-side loading state, so there's
// no layout jump when the real content swaps in.
export default function RecommendationsLoading() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="recs" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="skeleton h-10 w-full rounded-lg mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              <div className="skeleton h-52 sm:h-48" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

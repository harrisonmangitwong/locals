import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#111111", color: "#f1f5f9" }}
    >
      {/* Topbar */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(241,245,249,0.08)" }}
      >
        <Link href="/" className="font-bold text-lg" style={{ color: "#f1f5f9" }}>
          🍜 Locals
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/recommendations"
            className="text-sm transition-colors hover:opacity-75"
            style={{ color: "rgba(241,245,249,0.55)" }}
          >
            Recommendations
          </Link>
          <Link
            href="/about"
            className="text-sm transition-colors hover:opacity-75"
            style={{ color: "rgba(241,245,249,0.55)" }}
          >
            About
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        {/* Eyebrow pill */}
        <span
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
          style={{
            backgroundColor: "rgba(255, 56, 92, 0.15)",
            color: "#ff385c",
            border: "1px solid rgba(255, 56, 92, 0.3)",
          }}
        >
          🗽 New York City
        </span>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight max-w-3xl">
          Eat like a{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #ff385c, #fb7185)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            local
          </span>
          .<br />Not a tourist.
        </h1>

        {/* Subtext */}
        <p
          className="text-lg md:text-xl max-w-xl mb-12 leading-relaxed"
          style={{ color: "rgba(241, 245, 249, 0.55)" }}
        >
          We rank NYC restaurants by how much locals love them — not by how many
          tourists stumble in. Find your next neighborhood gem.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 w-full max-w-3xl">
          <div
            className="rounded-2xl p-6 text-left"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(241,245,249,0.12)",
            }}
          >
            <div className="text-2xl mb-3">📡</div>
            <h3 className="font-semibold text-base mb-2" style={{ color: "#f1f5f9" }}>
              Local signal scoring
            </h3>
            <p className="text-sm" style={{ color: "rgba(241,245,249,0.55)" }}>
              Our algorithm weighs reviewer localness to surface spots that real New Yorkers return to.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 text-left"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(241,245,249,0.12)",
            }}
          >
            <div className="text-2xl mb-3">🚫</div>
            <h3 className="font-semibold text-base mb-2" style={{ color: "#f1f5f9" }}>
              Tourist trap detection
            </h3>
            <p className="text-sm" style={{ color: "rgba(241,245,249,0.55)" }}>
              High tourist review ratio? Flagged. We penalize places that coast on out-of-towner hype.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 text-left"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(241,245,249,0.12)",
            }}
          >
            <div className="text-2xl mb-3">🗺️</div>
            <h3 className="font-semibold text-base mb-2" style={{ color: "#f1f5f9" }}>
              Neighborhood discovery
            </h3>
            <p className="text-sm" style={{ color: "rgba(241,245,249,0.55)" }}>
              Filter by neighborhood and cuisine to find the best local picks wherever you are in NYC.
            </p>
          </div>
        </div>

        {/* CTA button */}
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#ff385c", color: "#ffffff" }}
        >
          See recommendations →
        </Link>
      </section>
    </main>
  );
}

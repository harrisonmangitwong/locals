import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let r: Record<string, unknown> = {};
    try {
      const res = await fetch(`${API_BASE}/api/restaurant/${id}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) r = await res.json();
    } catch {
      // backend unreachable — render fallback card
    }

    const name = (r.name as string) ?? "Locals NYC";
    const neighborhood = r.neighborhood as string | undefined;
    const cuisine = r.cuisine as string | undefined;
    const rank = r.rank as number | undefined;
    const localRating = (r.local_weighted_rating as number) ?? 0;
    const touristRating = (r.tourist_weighted_rating as number) ?? 0;
    const photoUrl =
      (r.image_url as string) ||
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80&auto=format&fit=crop";

    const gap = localRating - touristRating;
    let verdict = `Locals (${localRating.toFixed(1)}) and tourists (${touristRating.toFixed(1)}) agree — holds up across the board.`;
    if (gap > 0.3)
      verdict = `Locals rate it ${localRating.toFixed(1)} vs. tourists' ${touristRating.toFixed(1)} — regulars love it more.`;
    if (gap < -0.3)
      verdict = `Tourists give it ${touristRating.toFixed(1)}, locals ${localRating.toFixed(1)} — popular with visitors.`;

    const meta = [neighborhood, cuisine].filter(Boolean).join(" · ");

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "1200px",
            height: "630px",
            position: "relative",
            backgroundColor: "#1a1814",
          }}
        >
          {/* Background photo */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${photoUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.10) 100%)",
              display: "flex",
            }}
          />
          {/* Content */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "48px 56px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Rank badge */}
            {rank ? (
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#d95030",
                    color: "#ffffff",
                    fontSize: "18px",
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: "999px",
                  }}
                >
                  #{rank}
                </div>
              </div>
            ) : null}
            {/* Name */}
            <div
              style={{
                fontSize: "62px",
                color: "#ffffff",
                lineHeight: 1.1,
                fontWeight: 600,
              }}
            >
              {name}
            </div>
            {/* Meta */}
            {meta ? (
              <div
                style={{
                  fontSize: "24px",
                  color: "rgba(255,255,255,0.70)",
                }}
              >
                {meta}
              </div>
            ) : null}
            {/* Verdict */}
            <div
              style={{
                fontSize: "20px",
                color: "rgba(255,255,255,0.85)",
                marginTop: "4px",
              }}
            >
              {verdict}
            </div>
            {/* Branding */}
            <div
              style={{
                fontSize: "18px",
                color: "rgba(255,255,255,0.40)",
                marginTop: "8px",
              }}
            >
              locals-nyc.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    return new Response(`OG image error: ${err}`, { status: 500 });
  }
}

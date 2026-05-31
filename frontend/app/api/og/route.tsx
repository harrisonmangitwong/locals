import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Attempt to load DM Serif Display; fall back gracefully if unavailable
  let fontData: ArrayBuffer | null = null;
  try {
    const fontRes = await fetch(
      "https://fonts.gstatic.com/s/dmseriftext/v12/rnCu-xZa_krGokauCeNq3wUDBg.woff"
    );
    if (fontRes.ok) fontData = await fontRes.arrayBuffer();
  } catch {
    // font optional — Satori falls back to built-in sans-serif
  }

  let r: Record<string, unknown> = {};
  try {
    const res = await fetch(`${API_BASE}/api/restaurant/${id}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) r = await res.json();
  } catch {
    // fallback to empty state
  }

  const name = (r.name as string) ?? "Locals NYC";
  const neighborhood = r.neighborhood as string | undefined;
  const cuisine = r.cuisine as string | undefined;
  const rank = r.rank as number | undefined;
  const localRating = (r.local_weighted_rating as number) ?? 0;
  const touristRating = (r.tourist_weighted_rating as number) ?? 0;
  const photoUrl =
    (r.image_url as string) ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80";

  const gap = localRating - touristRating;
  let verdict = `Locals (${localRating.toFixed(1)}) and tourists (${touristRating.toFixed(1)}) agree — holds up across the board.`;
  if (gap > 0.3)
    verdict = `Locals rate it ${localRating.toFixed(1)} vs. tourists' ${touristRating.toFixed(1)} — regulars love it more.`;
  if (gap < -0.3)
    verdict = `Tourists give it ${touristRating.toFixed(1)}, locals ${localRating.toFixed(1)} — popular with visitors.`;

  const meta = [neighborhood, cuisine].filter(Boolean).join(" · ");

  const fonts: { name: string; data: ArrayBuffer; style: "normal" }[] = [];
  if (fontData) fonts.push({ name: "DM Serif Display", data: fontData, style: "normal" });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: 1200,
          height: 630,
          position: "relative",
          backgroundColor: "#1a1814",
        }}
      >
        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          alt=""
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)",
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
            gap: 10,
          }}
        >
          {/* Rank badge */}
          {rank && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  backgroundColor: "#d95030",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: 999,
                }}
              >
                #{rank}
              </div>
            </div>
          )}
          {/* Name */}
          <div
            style={{
              fontFamily: fontData ? "DM Serif Display" : "serif",
              fontSize: 62,
              color: "#fff",
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            {name}
          </div>
          {/* Meta */}
          {meta && (
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {meta}
            </div>
          )}
          {/* Verdict */}
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.85)",
              marginTop: 4,
            }}
          >
            {verdict}
          </div>
          {/* Branding */}
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.4)",
              marginTop: 8,
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
      fonts,
    }
  );
}

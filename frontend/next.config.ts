import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve photos straight from Supabase Storage. Vercel's optimizer has a
    // monthly cap on the Hobby plan; past it, new photos fail with 402 and
    // render blank. The mirrored photos are already small (median ~66 KB).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "streetviewpixels-pa.googleapis.com" },
      { protocol: "https", hostname: "komriwzkkknrsirifgqg.supabase.co" },
    ],
  },
  webpack: (config) => config,
};

export default nextConfig;

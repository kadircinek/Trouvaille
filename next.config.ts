import type { NextConfig } from "next";
import { REMOTE_IMAGE_HOSTS } from "./src/lib/image-hosts";

function supabaseImagePattern() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return [];
    return [{ protocol: "https" as const, hostname: url.hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    // Ürün görselleri yayından sonra değişmez (yeni görsel = yeni dosya adı).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      ...REMOTE_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
      ...supabaseImagePattern(),
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;

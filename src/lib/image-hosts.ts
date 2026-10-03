// next/image ile optimize edilebilecek uzak görsel adresleri.
// next.config.ts'teki images.remotePatterns bu listeden üretilir.
export const REMOTE_IMAGE_HOSTS = [
  "*.supabase.co", // ablanın yüklediği görseller (Supabase Storage)
  "cdn.dsmcdn.com", // Trendyol ürün görselleri
  "**.dsmcdn.com",
  "productimages.hepsiburada.net", // Hepsiburada ürün görselleri
  "**.hepsiburada.net",
] as const;

/** Supabase özel alan adı kullanılıyorsa onu da kapsamak için. */
export function supabaseHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.hostname : null;
  } catch {
    return null;
  }
}

function matches(hostname: string, pattern: string): boolean {
  if (pattern.startsWith("**.")) return hostname.endsWith(pattern.slice(2));
  if (pattern.startsWith("*.")) {
    const rest = pattern.slice(1); // ".supabase.co"
    return hostname.endsWith(rest) && !hostname.slice(0, -rest.length).includes(".");
  }
  return hostname === pattern;
}

/** Görsel next/image optimizasyonundan geçebilir mi? Geçemiyorsa olduğu gibi gösterilir. */
export function isOptimizable(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    if (url.hostname === supabaseHost()) return true;
    return REMOTE_IMAGE_HOSTS.some((p) => matches(url.hostname, p));
  } catch {
    return false;
  }
}

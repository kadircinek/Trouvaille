// Ziyaretçi isteğinden kişisel veri saklamadan çıkarılan bilgiler.

// Link önizleme tarayıcıları, arama motorları ve otomasyon araçları.
// Dikkat: Instagram / Facebook uygulama içi tarayıcıları gerçek kullanıcıdır,
// burada eşleşmemeleri gerekir.
const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-external|whatsapp|skypeuripreview|embedly|quora link preview|vkshare|w3c_validator|lighthouse|headless|phantomjs|puppeteer|playwright|preview|curl\/|wget|python|httpclient|axios|node-fetch|undici|okhttp|go-http-client|java\/|libwww|scrapy|^$/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  return BOT_PATTERN.test((userAgent ?? "").trim());
}

/** Tarayıcının önden yüklediği (prefetch) istekler gerçek tıklama değildir. */
export function isPrefetchRequest(headers: Headers): boolean {
  const purpose = `${headers.get("sec-purpose") ?? ""} ${headers.get("purpose") ?? ""} ${headers.get("x-purpose") ?? ""}`;
  return /prefetch|prerender|preview/i.test(purpose);
}

export type Device = "ios" | "android" | "desktop" | "other";

export function detectDevice(userAgent: string | null | undefined): Device {
  const ua = userAgent ?? "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|mac os x|linux|cros/i.test(ua)) return "desktop";
  return "other";
}

/** Uygulama içi tarayıcı (Instagram vb.) — yoksa null. */
export function detectInAppBrowser(userAgent: string | null | undefined): string | null {
  const ua = userAgent ?? "";
  if (/instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook";
  if (/musical_ly|tiktok|bytedancewebview/i.test(ua)) return "tiktok";
  if (/snapchat/i.test(ua)) return "snapchat";
  if (/pinterest/i.test(ua)) return "pinterest";
  if (/twitter/i.test(ua)) return "twitter";
  if (/\bline\//i.test(ua)) return "line";
  return null;
}

export type ClickSource = "vitrin" | "hikaye" | "paylasim";

/** ?s= parametresini kaynak türüne çevirir (PRD: hikâye linki ?s=story ile gelir). */
export function normalizeSource(value: string | null | undefined): ClickSource {
  switch ((value ?? "").toLowerCase()) {
    case "story":
    case "hikaye":
    case "hikâye":
      return "hikaye";
    case "share":
    case "paylasim":
    case "paylaşım":
      return "paylasim";
    default:
      return "vitrin";
  }
}

/** Yönlendiren sayfayı yalnızca köken + yol olarak (sorgu parametreleri olmadan) tutar. */
export function sanitizeReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return null;
  }
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || null;
}

/**
 * IP saklanmaz: IP + tarayıcı bilgisinden tuzlu (HMAC-SHA256) bir özet üretilir.
 * Yalnızca tekil ziyaretçi sayımı için kullanılır; özetten IP geri elde edilemez.
 */
export async function hashVisitor(
  ip: string | null,
  userAgent: string | null,
  salt: string,
): Promise<string | null> {
  if (!ip || !salt) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${ip}|${userAgent ?? ""}`));
  return Array.from(new Uint8Array(sig).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

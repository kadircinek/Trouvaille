import { detectStoreFromUrl } from "./stores";

export type ProductInfo = {
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

function metaTags(html: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const key = (attrs.property ?? attrs.name ?? attrs.itemprop ?? "").toLowerCase();
    const content = attrs.content?.trim();
    if (key && content && !map.has(key)) map.set(key, content);
  }
  return map;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function findProductNode(node: JsonValue, depth = 0): Record<string, JsonValue> | null {
  if (depth > 6 || node === null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductNode(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === "string" && /^(Product|ProductGroup)$/i.test(t))) return node;
  for (const key of ["@graph", "mainEntity", "itemListElement"]) {
    if (key in node) {
      const found = findProductNode(node[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function firstString(value: JsonValue | undefined): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const s = firstString(v);
      if (s) return s;
    }
    return null;
  }
  if (value && typeof value === "object") {
    return firstString(value.url ?? value.contentUrl ?? value.name);
  }
  return null;
}

function jsonLdProduct(html: string): ProductInfo | null {
  const scripts = html.match(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const script of scripts) {
    const body = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    let data: JsonValue;
    try {
      data = JSON.parse(body);
    } catch {
      continue;
    }
    const product = findProductNode(data);
    if (!product) continue;
    return {
      title: firstString(product.name),
      brand: firstString(product.brand),
      imageUrl: firstString(product.image),
    };
  }
  return null;
}

/** Mağaza başlıklarındaki "Fiyatı, Yorumları - Trendyol" gibi ekleri temizler. */
export function cleanTitle(raw: string | null): string | null {
  if (!raw) return null;
  let title = decodeEntities(raw).replace(/\s+/g, " ").trim();
  title = title.replace(/\s*[-|–—]\s*(Trendyol|Hepsiburada)(\.com)?\s*$/i, "");
  title = title.replace(/\s+(Fiyatı|Fiyatları)\s*([,-]\s*(Yorumları|Taksit Seçenekleri)\s*)?$/i, "");
  title = title.replace(/\s*[-|–—]\s*$/, "").trim();
  return title || null;
}

function absoluteUrl(value: string | null, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Ürün sayfası HTML'inden ad, marka ve görsel çıkarır (JSON-LD öncelikli, sonra Open Graph). */
export function parseProductHtml(html: string, pageUrl: string): ProductInfo {
  const meta = metaTags(html);
  const ld = jsonLdProduct(html);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null;

  const title = cleanTitle(ld?.title ?? meta.get("og:title") ?? meta.get("twitter:title") ?? titleTag);
  const brand = ld?.brand ?? meta.get("product:brand") ?? meta.get("og:brand") ?? null;
  const image = absoluteUrl(
    ld?.imageUrl ?? meta.get("og:image:secure_url") ?? meta.get("og:image") ?? meta.get("twitter:image") ?? null,
    pageUrl,
  );
  return { title, brand: brand ? decodeEntities(brand).trim() || null : null, imageUrl: image };
}

/**
 * Sayfa okunamadığında son çare: ürün adresindeki okunabilir parça.
 *   trendyol.com/zara/saten-midi-elbise-p-123   → "Saten midi elbise", marka "zara"
 *   hepsiburada.com/x-marka-urun-adi-p-HBC0001 → "X marka urun adi"
 * Türkçe karakterler adreste olmadığı için admin düzeltebilsin diye yalnızca öneri.
 */
export function guessFromProductUrl(url: string): ProductInfo {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split("/").filter(Boolean);
    const last = parts.at(-1) ?? "";
    const m = last.match(/^(.*?)-p(?:m)?-[a-z0-9]+$/i);
    if (!m) return { title: null, brand: null, imageUrl: null };
    const words = m[1].replace(/-+/g, " ").trim();
    const title = words ? words.charAt(0).toLocaleUpperCase("tr") + words.slice(1) : null;
    const brand = parts.length >= 2 ? parts[parts.length - 2].replace(/-+/g, " ") : null;
    return { title, brand, imageUrl: null };
  } catch {
    return { title: null, brand: null, imageUrl: null };
  }
}

// ---------------------------------------------------------------------------
// Ağ: kısaltılmış linkleri çöz, ürün sayfasını oku. (Yalnızca sunucuda, admin için.)
// ---------------------------------------------------------------------------

const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const MAX_HOPS = 6;
const MAX_HTML_BYTES = 2_000_000;

function isForbiddenHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return host.includes(":"); // IPv6 literalleri
}

async function readLimited(res: Response, limit: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(total, limit));
  let offset = 0;
  for (const c of chunks) {
    const slice = c.subarray(0, Math.min(c.byteLength, buf.byteLength - offset));
    buf.set(slice, offset);
    offset += slice.byteLength;
    if (offset >= buf.byteLength) break;
  }
  return new TextDecoder("utf-8").decode(buf);
}

export type LinkInspection = ProductInfo & {
  store: string | null;
  /** Yönlendirmeler sonrası varılan adres (yalnızca bilgi amaçlı; kayıtta orijinal link tutulur). */
  resolvedUrl: string;
  /** Sayfa okunabildi mi? Okunamazsa bilgiler adresten tahmin edilir. */
  fetched: boolean;
};

export async function inspectProductLink(
  originalUrl: string,
  { timeoutMs = 7000, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<LinkInspection> {
  let current = originalUrl;
  let store = detectStoreFromUrl(current);
  const deadline = AbortSignal.timeout(timeoutMs);

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      break;
    }
    if ((url.protocol !== "https:" && url.protocol !== "http:") || isForbiddenHost(url.hostname)) break;

    let res: Response;
    try {
      res = await fetchImpl(url, {
        redirect: "manual",
        signal: deadline,
        headers: {
          "user-agent": BROWSER_UA,
          accept: "text/html,application/xhtml+xml",
          "accept-language": "tr-TR,tr;q=0.9",
        },
        cache: "no-store",
      });
    } catch {
      break;
    }

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {});
      current = new URL(location, url).toString();
      store = store ?? detectStoreFromUrl(current);
      continue;
    }

    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
      await res.body?.cancel().catch(() => {});
      break;
    }

    let html: string;
    try {
      html = await readLimited(res, MAX_HTML_BYTES);
    } catch {
      break;
    }

    // Bazı kısaltıcılar HTML/JS ile yönlendirir.
    const refresh = html.match(/<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*>/i)?.[0];
    const refreshUrl = refresh ? parseAttributes(refresh).content?.match(/url\s*=\s*['"]?([^'";]+)/i)?.[1] : null;
    if (refreshUrl && !detectStoreFromUrl(current)) {
      current = new URL(decodeEntities(refreshUrl), url).toString();
      store = store ?? detectStoreFromUrl(current);
      continue;
    }

    const info = parseProductHtml(html, current);
    const guess = guessFromProductUrl(current);
    return {
      store: store ?? detectStoreFromUrl(current),
      resolvedUrl: current,
      fetched: true,
      title: info.title ?? guess.title,
      brand: info.brand ?? guess.brand,
      imageUrl: info.imageUrl,
    };
  }

  const guess = guessFromProductUrl(current);
  return { store: store ?? detectStoreFromUrl(current), resolvedUrl: current, fetched: false, ...guess };
}

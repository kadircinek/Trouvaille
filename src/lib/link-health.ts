// Link sağlık kontrolü: ürün sayfası hâlâ var mı, stokta mı?
//
// Affiliate linkinin kendisine her gün istek atılmaz (mağazanın tıklama sayacına
// sahte tıklama düşmesin diye). Kısa link (ty.gl gibi) yalnızca bir kez çözülür;
// sonraki kontroller ürün sayfasının takip parametresi olmayan adresine yapılır.

import { BROWSER_UA, decodeEntities, isForbiddenHost, jsonLdProductNode, readLimited, type JsonValue } from "./product-info";
import type { LinkStatus } from "./types";

export type LinkCheck = {
  status: LinkStatus;
  /** Panelde gösterilecek kısa açıklama. */
  note: string | null;
  /** Kontrol edilen ürün sayfası (bir sonraki kontrolde yeniden kullanılır). */
  checkUrl: string | null;
};

type Options = { fetchImpl?: typeof fetch; timeoutMs?: number };

const STORE_PAGE_HOSTS = ["trendyol.com", "hepsiburada.com"];
const MAX_HOPS = 6;
const MAX_HTML_BYTES = 1_500_000;

function isStorePageHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return STORE_PAGE_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Mağazadaki ürün sayfası adresi, sorgu parametreleri (takip kodları) olmadan. */
export function canonicalProductUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !isStorePageHost(u.hostname)) return null;
    return `https://${u.hostname.toLowerCase()}${u.pathname}`;
  } catch {
    return null;
  }
}

/** trendyol.com/marka/urun-adi-p-123 · hepsiburada.com/urun-adi-p-HBC0001 (ya da -pm-) */
export function looksLikeProductPage(url: string): boolean {
  try {
    return /-pm?-[a-z0-9]+\/?$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

const IN_STOCK = /(InStock|LimitedAvailability|PreOrder|PreSale|BackOrder|OnlineOnly|InStoreOnly)$/i;
const OUT_OF_STOCK = /(OutOfStock|SoldOut|Discontinued)$/i;

function collectOffers(node: JsonValue | undefined, out: Record<string, JsonValue>[], depth = 0) {
  if (!node || typeof node !== "object" || depth > 4) return;
  if (Array.isArray(node)) {
    for (const item of node) collectOffers(item, out, depth + 1);
    return;
  }
  out.push(node);
  if ("offers" in node) collectOffers(node.offers, out, depth + 1);
}

/** JSON-LD'deki stok bilgisi: en az bir teklif stoktaysa "in", hepsi tükenmişse "out". */
export function availabilityFromProductNode(product: Record<string, JsonValue>): "in" | "out" | null {
  const offers: Record<string, JsonValue>[] = [];
  collectOffers(product.offers, offers);
  let sawOut = false;
  for (const offer of offers) {
    const value = offer.availability;
    if (typeof value !== "string") continue;
    if (IN_STOCK.test(value.trim())) return "in";
    if (OUT_OF_STOCK.test(value.trim())) sawOut = true;
  }
  return sawOut ? "out" : null;
}

const OUT_OF_STOCK_TEXT = /ürün(?:ü)? (?:şu an )?satışta değil|stokta yok|stokta bulunmamaktadır|ürün tükendi/i;
const BLOCKED_TEXT = /captcha|are you a robot|verify you are human|access denied|erişim engellendi/i;

/** Ürün sayfasının HTML'ini yorumlar. */
export function classifyProductHtml(html: string, pageUrl: string): Omit<LinkCheck, "checkUrl"> {
  const product = jsonLdProductNode(html);
  if (product) {
    const availability = availabilityFromProductNode(product);
    if (availability === "out") return { status: "stokta_yok", note: "Mağazada stokta yok görünüyor." };
    return { status: "ok", note: null };
  }
  const text = decodeEntities(html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "));
  if (BLOCKED_TEXT.test(text)) return { status: "bilinmiyor", note: "Mağaza otomatik kontrole izin vermedi." };
  if (OUT_OF_STOCK_TEXT.test(text)) return { status: "stokta_yok", note: "Sayfada “stokta yok / satışta değil” yazıyor." };
  if (looksLikeProductPage(pageUrl)) return { status: "ok", note: null };
  return { status: "bilinmiyor", note: "Ürün sayfası okunamadı." };
}

type Hop = { kind: "page"; url: string; res: Response } | { kind: "error"; note: string };

async function request(url: URL, signal: AbortSignal, fetchImpl: typeof fetch): Promise<Response> {
  return fetchImpl(url, {
    redirect: "manual",
    signal,
    cache: "no-store",
    headers: { "user-agent": BROWSER_UA, accept: "text/html,application/xhtml+xml", "accept-language": "tr-TR,tr;q=0.9" },
  });
}

/** Kısa linki (ty.gl …) mağaza sayfasına kadar izler; mağaza sayfasının kendisine istek atmaz. */
export async function resolveStorePage(
  shortUrl: string,
  { fetchImpl = fetch, timeoutMs = 8000 }: Options = {},
): Promise<{ url: string } | { dead: true } | { error: string }> {
  const signal = AbortSignal.timeout(timeoutMs);
  let current = shortUrl;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (canonicalProductUrl(current)) return { url: current };
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return { error: "Link geçersiz." };
    }
    if ((url.protocol !== "https:" && url.protocol !== "http:") || isForbiddenHost(url.hostname)) {
      return { error: "Link geçersiz." };
    }
    let res: Response;
    try {
      res = await request(url, signal, fetchImpl);
    } catch {
      return { error: "Kısa linke ulaşılamadı." };
    }
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {});
      current = new URL(location, url).toString();
      continue;
    }
    if (res.status === 404 || res.status === 410) {
      await res.body?.cancel().catch(() => {});
      return { dead: true };
    }
    if (res.ok && (res.headers.get("content-type") ?? "").includes("html")) {
      const html = await readLimited(res, 200_000).catch(() => "");
      const refresh = html.match(/<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["'][^"']*url\s*=\s*([^"';]+)/i)?.[1];
      if (refresh) {
        current = new URL(decodeEntities(refresh.trim()), url).toString();
        continue;
      }
    } else {
      await res.body?.cancel().catch(() => {});
    }
    return { error: `Kısa link mağazaya yönlendirmedi (${res.status}).` };
  }
  return { error: "Çok fazla yönlendirme." };
}

async function fetchPage(start: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<Hop> {
  const signal = AbortSignal.timeout(timeoutMs);
  let current = start;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const url = new URL(current);
    if (!isStorePageHost(url.hostname)) return { kind: "error", note: "Mağaza başka bir siteye yönlendiriyor." };
    let res: Response;
    try {
      res = await request(url, signal, fetchImpl);
    } catch {
      return { kind: "error", note: "Mağazaya ulaşılamadı." };
    }
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {});
      current = new URL(location, url).toString();
      continue;
    }
    return { kind: "page", url: current, res };
  }
  return { kind: "error", note: "Çok fazla yönlendirme." };
}

/** Bir ürünün linkini kontrol eder. Hiçbir zaman hata fırlatmaz. */
export async function checkProductLink(
  product: { affiliate_url: string; check_url: string | null },
  options: Options = {},
): Promise<LinkCheck> {
  try {
    return await runCheck(product, options);
  } catch (error) {
    console.error("Link kontrolü başarısız:", error);
    return { status: "bilinmiyor", note: "Kontrol sırasında hata oluştu.", checkUrl: product.check_url };
  }
}

async function runCheck(
  product: { affiliate_url: string; check_url: string | null },
  { fetchImpl = fetch, timeoutMs = 8000 }: Options,
): Promise<LinkCheck> {
  let checkUrl = product.check_url ?? canonicalProductUrl(product.affiliate_url);
  if (!checkUrl) {
    const resolved = await resolveStorePage(product.affiliate_url, { fetchImpl, timeoutMs });
    if ("dead" in resolved) return { status: "kirik", note: "Link çalışmıyor (sayfa bulunamadı).", checkUrl: null };
    if ("error" in resolved) return { status: "bilinmiyor", note: resolved.error, checkUrl: null };
    checkUrl = canonicalProductUrl(resolved.url);
    if (!checkUrl) return { status: "bilinmiyor", note: "Link mağazaya gitmiyor.", checkUrl: null };
  }

  const hop = await fetchPage(checkUrl, timeoutMs, fetchImpl);
  if (hop.kind === "error") return { status: "bilinmiyor", note: hop.note, checkUrl };
  const { res, url } = hop;

  if (res.status === 404 || res.status === 410) {
    await res.body?.cancel().catch(() => {});
    return { status: "kirik", note: "Ürün sayfası bulunamadı (kaldırılmış olabilir).", checkUrl };
  }
  if (!res.ok) {
    await res.body?.cancel().catch(() => {});
    return { status: "bilinmiyor", note: `Mağaza şu an yanıt vermedi (${res.status}).`, checkUrl };
  }
  if (looksLikeProductPage(checkUrl) && !looksLikeProductPage(url)) {
    await res.body?.cancel().catch(() => {});
    return { status: "kirik", note: "Ürün sayfası kaldırılmış; mağaza başka sayfaya yönlendiriyor.", checkUrl };
  }
  if (!(res.headers.get("content-type") ?? "").includes("html")) {
    await res.body?.cancel().catch(() => {});
    return { status: "bilinmiyor", note: "Ürün sayfası okunamadı.", checkUrl };
  }
  let html: string;
  try {
    html = await readLimited(res, MAX_HTML_BYTES);
  } catch {
    return { status: "bilinmiyor", note: "Mağazaya ulaşılamadı.", checkUrl };
  }
  return { ...classifyProductHtml(html, url), checkUrl };
}

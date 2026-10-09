import { site } from "@/config/site";

/** Veritabanındaki kısa kod biçimiyle aynı (products_short_code_format). */
export const SHORT_CODE_PATTERN = /^[a-z0-9]{4,12}$/;

/** Hikâyedeki link çıkartmasına konan adres: site.com/u/ab3kz */
export function shortLinkUrl(code: string, base = site.url): string {
  return `${base.replace(/\/+$/, "")}/u/${code}`;
}

/** Ekranda gösterim için: "https://" olmadan. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/** Kısa linkten gelen ziyaretçi nereye gider (tıklamalar "hikâye" olarak sayılır). */
export function shortLinkTarget(product: { id: string; slug: string; status: string }): string | null {
  if (product.status === "published") return `/p/${product.slug}?s=hikaye`;
  // Arşivlenen ürünün eski hikâyelerdeki (öne çıkanlar) linki doğrudan mağazaya gider.
  if (product.status === "archived") return `/go/${product.id}?s=hikaye`;
  return null;
}

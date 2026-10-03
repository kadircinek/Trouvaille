// Affiliate linkleri hiçbir şekilde değiştirilmez: kısaltılmaz, parametresi
// silinmez, yeniden kodlanmaz. Buradaki fonksiyonlar yalnızca doğrular.

/** Yapıştırılan metni doğrular; geçerliyse yalnızca baş/son boşlukları atılmış halini döner. */
export function parseAffiliateUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null;
  return trimmed;
}

/**
 * 302 yanıtının Location başlığı. Link ASCII ise birebir aynısı kullanılır.
 * HTTP başlıkları ASCII dışı karakter taşıyamadığı için yalnızca o karakterler
 * yüzde-kodlanır (tarayıcının zaten yapacağı dönüşüm); diğer her şey aynen kalır.
 */
export function redirectLocation(affiliateUrl: string): string | null {
  const url = parseAffiliateUrl(affiliateUrl);
  if (!url) return null;
  if (/^[\x21-\x7e]+$/.test(url)) return url;
  return url.replace(/[^\x21-\x7e]/gu, (ch) => encodeURIComponent(ch));
}

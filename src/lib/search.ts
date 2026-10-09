// Arama: veritabanındaki public.tr_fold() ile aynı dönüşüm (ı/i, ş/s, ğ/g … ayrımı yok).
const FROM = "ÇĞİIÖŞÜÂÎÛçğıöşüâîû";
const TO = "cgiiosuaiucgiosuaiu";
const MAP = new Map([...FROM].map((ch, i) => [ch, TO[i]]));

export const MAX_QUERY_LENGTH = 60;

export function foldForSearch(input: string): string {
  return [...input].map((ch) => MAP.get(ch) ?? ch).join("").toLowerCase();
}

/** Arama kutusundaki metni kelimelere ayırır; her kelime ürün adında ya da markada geçmeli. */
export function searchTerms(query: string | null | undefined): string[] {
  if (!query) return [];
  return foldForSearch(query.slice(0, MAX_QUERY_LENGTH))
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);
}

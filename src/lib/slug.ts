const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Türkçe karakterleri sadeleştirerek URL dostu bir parça üretir. */
export function slugify(input: string, maxLength = 60): string {
  const lowered = input.toLocaleLowerCase("tr");
  const mapped = Array.from(lowered, (ch) => TR_MAP[ch] ?? ch).join("");
  const ascii = mapped.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  let slug = ascii
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    const cut = slug.lastIndexOf("-");
    if (cut > maxLength / 2) slug = slug.slice(0, cut);
    slug = slug.replace(/-+$/g, "");
  }
  return slug;
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function randomSuffix(length = 4): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Ürün için kalıcı slug: "siyah-saten-elbise-k7m2". Başlık değişse de slug değişmez. */
export function productSlug(title: string): string {
  const base = slugify(title) || "urun";
  return `${base}-${randomSuffix()}`;
}

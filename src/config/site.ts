// Platformun kimliği. Her influencer'ın vitrin adı, açıklaması, Instagram'ı ve
// profil fotoğrafı veritabanındadır (creators tablosu, panelden düzenlenir).
// NEXT_PUBLIC_ değişkenleri yayın sırasında koda gömülür; değiştirince yeniden yayınla.

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Trouvaille",
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ||
    "Influencerların hikâyelerinde paylaştığı ürünler, kaybolmadan tek yerde.",
  url: resolveSiteUrl(),
  locale: "tr_TR",
  /** Tek vitrinli ilk sürümün filtreli linkleri (/?kategori=…) bu vitrine yönlenir. */
  legacyVitrin: process.env.LEGACY_VITRIN_USERNAME || "shopbysac",
} as const;

export const DISCLOSURE_TEXT =
  "Bu sayfadaki linkler satış ortaklığı (affiliate) linkleridir; tıklamalarınızdan gelir elde edebilirim.";

export function instagramUrl(username: string | null | undefined): string | null {
  const name = (username ?? "").replace(/^@+/, "");
  return name ? `https://www.instagram.com/${name}/` : null;
}

/** Influencer vitrininin adresi (site.com/kullaniciadi). */
export function vitrinPath(username: string): string {
  return `/${username}`;
}

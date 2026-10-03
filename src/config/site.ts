// Vitrinin kimliği. Değerler .env (veya Vercel ortam değişkenleri) ile
// değiştirilebilir; NEXT_PUBLIC_ değişkenleri yayın sırasında koda gömülür,
// değiştirdikten sonra yeniden yayınlamak gerekir.

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
    "Hikâyelerimde paylaştığım, gerçekten sevdiğim parçalar.",
  instagram: (process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || "").replace(/^@/, ""),
  // Profil fotoğrafı: tam URL ya da public/ altındaki dosya yolu (ör. /profil.jpg).
  // Boş bırakılırsa adın baş harfi gösterilir.
  avatar: process.env.NEXT_PUBLIC_PROFILE_IMAGE || "",
  url: resolveSiteUrl(),
  locale: "tr_TR",
} as const;

export const DISCLOSURE_TEXT =
  "Bu sayfadaki linkler satış ortaklığı (affiliate) linkleridir; tıklamalarınızdan gelir elde edebilirim.";

export function instagramUrl(): string | null {
  return site.instagram ? `https://www.instagram.com/${site.instagram}/` : null;
}

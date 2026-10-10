// Vitrin adresi = kullanıcı adı: site.com/<kullaniciadi>. Instagram kurallarına yakın:
// küçük harf, rakam, nokta ve alt çizgi; 3–30 karakter; nokta başta/sonda olamaz.
// Veritabanındaki creators.username kontrolüyle aynı.
export const CREATOR_USERNAME_PATTERN = /^[a-z0-9_][a-z0-9._]{1,28}[a-z0-9_]$/;

// Sitenin kendi sayfalarıyla çakışan ya da yanıltıcı olabilecek adlar.
const RESERVED = new Set([
  "admin", "api", "go", "u", "p", "auth", "gizlilik", "kayit", "giris", "panel", "hesap", "yonetim",
  "icons", "icon", "apple-icon", "manifest.webmanifest", "yonetim.webmanifest", "robots.txt", "sitemap.xml",
  "sw.js", "offline.html", "favicon.ico", "ornek", "_next", "static", "assets", "public",
  "trouvaille", "destek", "yardim", "hakkimizda", "iletisim", "kvkk", "blog", "ara", "kesfet", "vitrin",
  "vitrinler", "magaza", "urun", "urunler", "kategori", "ayarlar", "www", "null", "undefined", "reklam",
]);

/** "@Shop.By.Sac " → "shop.by.sac" (Türkçe harfler sadeleştirilir). */
export function normalizeUsername(input: string): string {
  return input
    .trim()
    .replace(/^@+/, "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

/** Kullanıcı adı uygun değilse nedenini (Türkçe) döner. */
export function usernameProblem(username: string): string | null {
  if (username.length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
  if (username.length > 30) return "Kullanıcı adı en fazla 30 karakter olabilir.";
  if (!CREATOR_USERNAME_PATTERN.test(username)) {
    return "Yalnızca harf, rakam, nokta ve alt çizgi kullan; nokta başta ya da sonda olamaz.";
  }
  if (RESERVED.has(username)) return "Bu ad kullanılamıyor, başka bir ad seç.";
  return null;
}

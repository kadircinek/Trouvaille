# Trouvaille — Instagram ürün vitrini

Instagram hikâyelerinde paylaşılan Trendyol ve Hepsiburada affiliate linklerini kalıcı, görsel ve gezilebilir bir vitrine dönüştüren mobil öncelikli web uygulaması (PWA). Ürün gereksinimleri: [`docs/PRD.md`](docs/PRD.md).

> "Trouvaille" çalışma adıdır; ad, açıklama ve Instagram kullanıcı adı ortam değişkenleriyle değiştirilir (aşağıya bakın).

## Faz 1 (MVP) — bu sürümde olanlar

**Ziyaretçi tarafı**
- Instagram profili gibi üst kısım: halkalı avatar, ürün/kategori sayısı, kısa açıklama, "Instagram'da takip et"
- **Hikâye halkaları:** en son eklenen 12 ürün; son 48 saattekiler renkli halka + "Yeni" rozeti, görülenler griye döner (yalnızca o cihazda). Dokununca tam ekran hikâye: ilerleme çubukları, sol/sağ dokunuşla geçiş, 6 sn'de otomatik geçiş, basılı tutunca durur, aşağı kaydırınca/geri tuşuyla kapanır; ortaya ya da "Ürüne git"e dokununca mağaza açılır
- Instagram profil ızgarası gibi 3 sütunlu, hikâye oranında (9:16) akış, sonsuz kaydırma, sabitlenenler en üstte; hikâyedeki yazılar ve ürün kesiti kırpılmaz
- **Fotoğrafa dokunmak doğrudan Trendyol/Hepsiburada'yı açar** (tıklama `/go` ile kaydedilir)
- Kategori ve mağaza filtresi yalnızca ürünü olan seçenekleri gösterir; filtreli link paylaşılabilir (`/?kategori=giyim`)
- Ürün sayfası (`/p/...`, paylaşılan linkler için): hikâye görseli tam boy (+ varsa mağazanın ürün fotoğrafı, kaydırmalı), kısa not, altta sabit "Ürüne Git" butonu; fotoğrafa dokunmak da mağazayı açar
- Her ürünün kendi adresi (`/p/...`) ve WhatsApp/Instagram önizlemesi (Open Graph)
- Her kartta ve detayda kapatılamayan **"#Reklam · [Mağaza] ortaklık linki"** etiketi; hediye ürünlerde "@Marka tarafından hediye olarak alındı"; sayfanın üstünde ve altında affiliate bilgi notu
- Gizlilik ve Aydınlatma Metni (`/gizlilik`)
- PWA: manifest, uygulama simgesi, ana ekrana ekleme, çevrimdışı sayfası

**Tıklama takibi**
- `/go/:id` → tıklamayı kaydeder, **orijinal affiliate linkine hiç değiştirmeden** 302 ile yönlendirir
- Kayıt yönlendirmeyi bekletmez (yanıt gittikten sonra yazılır); kayıt başarısız olsa da yönlendirme çalışır
- Botlar / link önizlemeleri ayrı sayılır; IP saklanmaz, yalnızca tuzlanmış özeti tutulur
- `?s=story` ile gelen tıklamalar "hikâye", paylaşılan linkten gelenler "paylaşım" olarak ayrılır

**Admin paneli (`/admin`, telefondan)**
- Kullanıcı adı + şifreyle giriş; *Hesabım*'dan şifre değiştirme. Şifre unutulursa e-postaya gelen kod ya da linkle giriş
- Hızlı ürün ekleme: fotoğraf seç → linki yapıştır → mağaza ve ürün adı otomatik → (kategori, not) → Yayınla
- Linkten ürün adı/marka/fotoğraf otomatik çekilir; kendi görsel yüklenmezse ürün fotoğrafı kullanılır
- Düzenle, sırala (yukarı/aşağı), sabitle, arşivle (vitrinde gizlenir, link çalışmaya devam eder), sil
- Tıklama paneli: bugün / 7 / 30 gün, günlük grafik, en çok tıklanan 10 ürün, mağaza / kategori / kaynak dağılımı, "24 saatten eski ürünlere giden tıklama payı"

## Faz 2 — bu sürümde eklenenler

- **Hikâye kısa linkleri (`/u/ab3kz`):** panelde her yayındaki ürünün yanında *Hikâye linki* düğmesi; kopyalanan link hikâyedeki link çıkartmasına konur. Link ürün sayfasını açar, oradan mağazaya giden tıklamalar panelde **Hikâye** olarak ayrı sayılır. Ürün arşivlenirse eski hikâyelerdeki link doğrudan mağazaya gider.
- **Link sağlık kontrolü:** her sabah (Vercel Cron, 08:00 civarı) yayındaki ürünler kontrol edilir; sayfası kalkan ya da stokta olmayan ürünler panelin üstünde uyarı ve ürünün yanında *Link kırık / Stokta yok* etiketiyle görünür. Ürün düzenleme sayfasında *Şimdi kontrol et* düğmesi vardır. Kontrol affiliate linkinin kendisine değil, ürün sayfasının takip parametresi olmayan adresine yapılır (sahte tıklama oluşmaz); kısa linkler (ty.gl) yalnızca bir kez çözülür. Mağaza otomatik kontrolü engellerse ürün "kontrol edilemedi" olarak kalır, uyarı verilmez.
- **Arama:** akışın üstündeki büyüteçle ürün adı ya da markada arama; Türkçe karakterden bağımsız ("orme" → "Örme atlet"). Aranan kelime adrese yazılır (`/?ara=elbise`).
- **Favoriler:** kart ve ürün sayfasındaki kalple; üyelik yok, yalnızca o telefonda saklanır. *Favoriler* sekmesi beğenilenleri listeler.
- **Profil fotoğrafı:** panelde *Hesabım → Vitrindeki profil fotoğrafı* (ortadan kare kırpılır).
- **"Şifremi unuttum" e-postası:** `SMTP_*` ayarları girilirse kod ve giriş linki ablanın kendi e-posta hesabından (iCloud, Gmail …) gider; girdikten sonra *Hesabım*'da yeni şifre belirlenir. Ayar yoksa Supabase'in hazır servisi kullanılır (o servis yalnızca Supabase proje ekibindeki adreslere gönderir).

Henüz yok: video.

---

## 1. Gerekli hesaplar

- GitHub (bu repo)
- [Supabase](https://supabase.com) — veritabanı, görseller, giriş (ücretsiz plan yeterli)
- [Vercel](https://vercel.com) — yayın (Hobby plan ile başlanabilir)
- Ablanın Trendyol / Hepsiburada affiliate linklerinden birkaç örnek ve Instagram görselleri

## 2. Supabase kurulumu

En kolay yol, Supabase'i **Vercel üzerinden** bağlamak (5. adım): Vercel projesinde *Storage → Supabase* ile veritabanı oluşturulur, anahtarlar Vercel'e kendiliğinden eklenir ve **tablolar her yayında otomatik kurulur** (`scripts/db-setup.mjs`). Supabase panosuna gerektiğinde Vercel'deki *Storage → (veritabanı) → Open in Supabase* düğmesiyle girilir.

Supabase'i ayrıca kendin açtıysan:

1. **Proje oluştur:** Supabase → *New project*, bölge **Central EU (Frankfurt)**.
2. **Şema:** Vercel'e `POSTGRES_URL_NON_POOLING` (ya da `SUPABASE_DB_URL`) olarak veritabanı bağlantı adresini eklersen tablolar yayında otomatik kurulur (*Project Settings → Database → Connection string*, "Session pooler"). Eklemezsen *SQL Editor*'da `supabase/migrations/` altındaki dosyaları **tarih sırasıyla** birer kez çalıştır.
3. **Anahtarlar:** *Project Settings → API Keys* → Project URL, `anon`/publishable anahtar ve `service_role`/secret anahtar. Service role anahtarı **gizlidir**; yalnızca Vercel'deki sunucu ortam değişkenine girilir.

Her iki yolda da (isteğe bağlı, "Şifremi unuttum" e-postası için):

- **Adresler:** *Authentication → URL Configuration* → *Site URL*: sitenin kalıcı adresi; *Redirect URLs*: `https://<kalıcı-adres>/auth/confirm` (yerel test için `http://localhost:3000/auth/confirm`).
- **E-posta şablonu:** *Authentication → Emails → Templates* → **Magic Link** ve **Confirm signup** için *Subject* `Giriş kodun: {{ .Token }}`, *Body* [`supabase/templates/giris.html`](supabase/templates/giris.html).
- **E-posta gönderimi:** Supabase'in yerleşik e-postası yalnızca proje ekibindeki adreslere ve saatte birkaç e-posta gönderir; ablanın adresine de gitmesi için *Authentication → Emails → SMTP Settings* ile kendi SMTP'ni bağla (ör. Resend'in ücretsiz planı).

## 3. Ortam değişkenleri

[`.env.example`](.env.example) dosyasındaki değişkenler:

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje adresi (Vercel–Supabase bağlantısı kendisi ekler) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable anahtar (herkese açık olabilir, RLS korur) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role / secret anahtar — **gizli, yalnızca sunucuda** |
| `POSTGRES_URL_NON_POOLING` | veritabanı bağlantı adresi; tabloların yayında otomatik kurulması için (Vercel–Supabase bağlantısı kendisi ekler) |
| `ADMIN_USERNAME` | ablanın panel kullanıcı adı (ör. `shopbysac`) |
| `ADMIN_EMAIL` | ablanın e-postası ("Şifremi unuttum" için) |
| `ADMIN_PASSWORD` | ilk şifre; hesap açıldıktan sonra silinebilir, var olan hesabın şifresini **değiştirmez** |
| `IP_HASH_SALT` | tekil ziyaretçi sayımı için gizli tuz (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | sitenin kalıcı adresi (boşsa Vercel'deki kalıcı adres kullanılır) |
| `NEXT_PUBLIC_SITE_NAME` | vitrinin adı (ablanın adı / kullanıcı adı önerilir) |
| `NEXT_PUBLIC_SITE_TAGLINE` | adın altındaki kısa cümle |
| `NEXT_PUBLIC_INSTAGRAM_USERNAME` | Instagram kullanıcı adı (`@` olmadan) |
| `NEXT_PUBLIC_PROFILE_IMAGE` | yedek profil fotoğrafı (asıl yol: panelde *Hesabım*'dan yükleme); boşsa baş harf gösterilir |
| `NEXT_PUBLIC_CONTACT_EMAIL` | gizlilik metnindeki iletişim adresi (isteğe bağlı) |
| `CRON_SECRET` | günlük link kontrolünü yalnızca Vercel'in tetiklemesi için gizli değer (`openssl rand -hex 24`); yoksa kontrol çalışmaz |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | "Şifremi unuttum" e-postasını kendi hesabından göndermek için (isteğe bağlı). iCloud: `smtp.mail.me.com`, `587`, iCloud adresi + appleid.apple.com'dan *uygulamaya özel şifre*. Gmail: `smtp.gmail.com`, `465`, Google *uygulama şifresi*. `SMTP_FROM` hesapla aynı adres olmalı (ör. `Shopbysac <ad@icloud.com>`) |

`NEXT_PUBLIC_` ile başlayanlar yayın sırasında koda gömülür; değiştirdikten sonra yeniden yayınlamak (redeploy) gerekir.

## 4. Yerelde çalıştırma

Gerekenler: Node.js 20.9+ ve pnpm (`corepack enable` ile gelir).

```bash
pnpm install
cp .env.example .env.local     # değerleri doldur (Supabase projesinin anahtarları)
pnpm dev                       # http://localhost:3000  ·  panel: http://localhost:3000/admin
```

**İsteğe bağlı — tamamen yerel Supabase (Docker gerekir):**

```bash
npx supabase start             # şema + örnek ürünler (supabase/seed.sql) yüklenir
npx supabase status            # .env.local için API URL, anon ve service_role anahtarları
```

Yerel admin adresi `admin@ornek.com`; giriş e-postaları http://127.0.0.1:54324 (Mailpit) adresinde görünür. Örnek veri yalnızca yerelde kullanılır, canlı projeye yüklenmez.

Kontroller:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## 5. Vercel'e yayınlama

1. Vercel → *Add New… → Project* → bu GitHub reposunu seç → *Import*. Framework (Next.js) ve pnpm otomatik tanınır.
2. *Storage* sekmesinden **Supabase** veritabanı oluşturup projeye bağla (anahtarlar kendiliğinden eklenir). Ayrıca *Settings → Environment Variables*'a 3. adımdaki diğer değişkenleri gir: `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_TAGLINE`, `NEXT_PUBLIC_INSTAGRAM_USERNAME` ve ablanın hesabı için `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. *Deploy*. Yayın sırasında günlükte `[veritabanı] …` satırları tabloların kurulduğunu ve yönetici hesabının açıldığını gösterir. Fonksiyonlar `vercel.json` ile Frankfurt (`fra1`) bölgesinde çalışır.
4. **Herkese açık adres:** Projenin *Overview → Domains* bölümündeki kalıcı adresi kullan (ör. `trouvaille-….vercel.app`). İçinde rastgele harfler olan yayın adresleri Vercel girişiyle korunur; *Settings → Deployment Protection → Vercel Authentication* kapatılırsa bu sayfa hiç çıkmaz.
5. Ablan `https://<kalıcı-adres>/admin` adresinden kullanıcı adı ve şifresiyle girer, *Hesabım*'dan şifresini değiştirir. Sonra `ADMIN_PASSWORD` değişkenini Vercel'den silebilirsin.
6. **Alan adı (isteğe bağlı):** *Settings → Domains* → alan adını ekle; Supabase'de *Site URL*'yi güncelle.
7. **Analitik:** *Analytics → Web Analytics → Enable* (çerezsiz sayfa görüntüleme ölçümü).
8. Instagram biyografisine vitrinin adresini koy.

Sonraki her `git push` Vercel'de otomatik yayınlanır; yeni veritabanı değişiklikleri de o sırada uygulanır.

## 6. Günlük kullanım (ablan için)

1. Hikâyeyi paylaşırken panelde **+**'ya dokun.
2. **Fotoğraf seç** — hikâyede paylaştığın görselin aynısı (yazıları ve ürün kesitiyle birlikte; vitrinde hikâye oranında görünür).
3. Trendyol/Hepsiburada linkini **Yapıştır** — mağaza ve ürün adı kendiliğinden dolar (gelmezse adı sen yaz).
4. İstersen kategori seç, kısa bir not yaz; marka hediyesiyse **Marka hediyesi**'ni işaretleyip markayı yaz.
5. **Yayınla** — ürün hemen vitrinde.

- **Arşivle:** ürün vitrinden kalkar ama eski hikâyelerdeki linkler çalışmaya devam eder.
- **Sabitle:** ürün vitrinin en üstünde kalır. Oklarla sırayı değiştirebilirsin.
- **Tıklamalar:** hangi ürünün ne kadar tıklandığını, hikâye bittikten sonra gelen tıklamaların payını gösterir.
- **Hikâye linki:** ürünün yanındaki *Hikâye linki*'ne dokun, hikâyede link çıkartmasına yapıştır. Bu linkten gelen tıklamalar *Tıklamalar*'da "Hikâye" olarak görünür.
- **Link uyarısı:** panelin üstünde kırmızı uyarı çıkarsa ürünün linki kırılmış ya da ürün tükenmiştir; linki değiştir ya da ürünü arşivle.

## 7. Teknik notlar

```
src/
  app/(vitrin)/          vitrin: ana sayfa, ürün sayfası (+ @modal katmanı), gizlilik
  app/go/[id]/           tıklama kaydı + 302 yönlendirme
  app/u/[kod]/           hikâye kısa linki → ürün sayfası (?s=hikaye)
  app/api/urunler/       akışın sonraki sayfaları / filtreler / arama / favoriler (CDN önbellekli)
  app/api/cron/          günlük link sağlık kontrolü (vercel.json → crons)
  app/admin/             giriş, ürün listesi, ekleme/düzenleme, tıklama paneli
  app/auth/confirm/      sihirli link doğrulama
  proxy.ts               /admin oturum tazeleme ve yönlendirme
  lib/                   mağaza tanıma, link doğrulama, ürün bilgisi çekme, ziyaretçi bilgisi
supabase/migrations/     şema + RLS + Storage + panel fonksiyonları
```

- Yığın: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (Postgres + Storage + Auth), Vercel.
- **Affiliate linkleri hiçbir zaman değiştirilmez:** yalnızca baş/son boşluklar atılır; `/go` yanıtındaki `Location` başlığı kayıtlı linkin birebir aynısıdır (testler: `src/lib/__tests__/links.test.ts`).
- **Güvenlik (RLS):** herkes yalnızca yayındaki ürünleri okur; ürün ekleme/düzenleme ve görsel yükleme yalnızca `admins` tablosundaki e-postalara açıktır; tıklamaları yalnızca sunucu (service role) yazar, yalnızca admin okur.
- **Hız:** vitrin sayfaları statik üretilir (60 sn'de bir ve her admin değişikliğinde anında tazelenir); görseller tarayıcıda küçültülüp yüklenir, ziyaretçiye AVIF/WebP olarak sunulur.
- Fiyat gösterilmiyor (PRD'de açık soru; fiyatlar sık değiştiği için).

## 8. Yayına çıkmadan önce kontrol listesi

- [ ] Trendyol ve Hepsiburada affiliate program şartları `/go` üzerinden yönlendirmeye izin veriyor mu? (Herkese açık bir kural bulunamadı; Trendyol Influencer panelindeki kullanım koşullarına bakılmalı.)
- [ ] Reklam etiketleri ve Gizlilik/Aydınlatma Metni için kısa bir avukat kontrolü (uygulamadaki metinler hukuki danışmanlık değildir).
- [ ] Linkten otomatik çekilen mağaza ürün fotoğraflarının kullanım şartları.
- [ ] Vitrin adı, alan adı, profil fotoğrafı (panel → *Hesabım*) ve vurgu rengi (`src/app/globals.css` → `--color-accent`, hikâye halkası → `.story-ring`).
- [ ] Kategoriler ablanın paylaşımlarına uyuyor mu? (`src/lib/categories.ts`)

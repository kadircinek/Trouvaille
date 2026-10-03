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
- Şifresiz giriş: e-postaya gelen 6 haneli kod ya da sihirli link
- Hızlı ürün ekleme: fotoğraf seç → linki yapıştır → mağaza ve ürün adı otomatik → (kategori, not) → Yayınla
- Linkten ürün adı/marka/fotoğraf otomatik çekilir; kendi görsel yüklenmezse ürün fotoğrafı kullanılır
- Düzenle, sırala (yukarı/aşağı), sabitle, arşivle (vitrinde gizlenir, link çalışmaya devam eder), sil
- Tıklama paneli: bugün / 7 / 30 gün, günlük grafik, en çok tıklanan 10 ürün, mağaza / kategori / kaynak dağılımı, "24 saatten eski ürünlere giden tıklama payı"

Faz 2'de (henüz yok): arama, favoriler, hikâye için kısa linkler (`/u/ab12`), günlük link sağlık kontrolü, video.

---

## 1. Gerekli hesaplar

- GitHub (bu repo)
- [Supabase](https://supabase.com) — veritabanı, görseller, giriş (ücretsiz plan yeterli)
- [Vercel](https://vercel.com) — yayın (Hobby plan ile başlanabilir)
- Ablanın Trendyol / Hepsiburada affiliate linklerinden birkaç örnek ve Instagram görselleri

## 2. Supabase kurulumu

1. **Proje oluştur:** Supabase → *New project*. Bölge olarak **Central EU (Frankfurt)** seç (Vercel tarafında da Frankfurt kullanılıyor, `/go` yönlendirmesi hızlı kalsın diye).
2. **Şemayı kur:** *SQL Editor* → *New query* → [`supabase/migrations/20261004000000_faz1_vitrin.sql`](supabase/migrations/20261004000000_faz1_vitrin.sql) dosyasının tamamını yapıştır → *Run*.
   (Supabase CLI kullanıyorsan: `npx supabase link --project-ref <ref>` ve `npx supabase db push`.)
3. **Admin e-postasını ekle** (SQL Editor'da, kendi adresinle):
   ```sql
   insert into public.admins (email) values ('abla@ornek.com');
   ```
   Panele yalnızca bu tablodaki adresler girebilir; diğer adreslere e-posta bile gönderilmez.
4. **Adresler:** *Authentication → URL Configuration*
   - *Site URL*: sitenin canlı adresi (ör. `https://vitrin.ablanin-adi.com`; alan adı yoksa önce Vercel adresi)
   - *Redirect URLs*: `https://<canlı-adres>/auth/confirm` ve yerel test için `http://localhost:3000/auth/confirm`
5. **Giriş e-postası şablonu:** *Authentication → Emails → Templates* bölümünde **Magic Link** ve **Confirm signup** şablonlarının ikisinde de:
   - *Subject*: `Giriş kodun: {{ .Token }}`
   - *Body*: [`supabase/templates/giris.html`](supabase/templates/giris.html) içeriği

   Böylece e-postada hem 6 haneli kod hem de giriş linki olur. Kod, ana ekrana eklenmiş uygulamada (PWA) giriş yapmayı kolaylaştırır; link hangi tarayıcıda açılırsa orada giriş yapar.
6. **E-posta gönderimi:** Supabase'in yerleşik e-postası yalnızca proje ekibindeki adreslere ve saatte birkaç e-posta gönderir. İki seçenek:
   - ablanın adresini Supabase organizasyonuna ekip üyesi olarak davet et, **ya da**
   - *Authentication → Emails → SMTP Settings* ile kendi SMTP'ni bağla (ör. Resend'in ücretsiz planı).
7. **Anahtarlar:** *Project Settings → API Keys* → Project URL, `anon`/publishable anahtar ve `service_role`/secret anahtar. Service role anahtarı **gizlidir**; yalnızca Vercel'deki sunucu ortam değişkenine girilir.

## 3. Ortam değişkenleri

[`.env.example`](.env.example) dosyasındaki değişkenler:

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje adresi |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable anahtar (herkese açık olabilir, RLS korur) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role / secret anahtar — **gizli, yalnızca sunucuda** |
| `IP_HASH_SALT` | tekil ziyaretçi sayımı için gizli tuz (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | sitenin canlı adresi (sonunda `/` olmadan) |
| `NEXT_PUBLIC_SITE_NAME` | vitrinin adı (ablanın adı / kullanıcı adı önerilir) |
| `NEXT_PUBLIC_SITE_TAGLINE` | adın altındaki kısa cümle |
| `NEXT_PUBLIC_INSTAGRAM_USERNAME` | Instagram kullanıcı adı (`@` olmadan) |
| `NEXT_PUBLIC_PROFILE_IMAGE` | profil fotoğrafı: `public/profil.jpg` koyup `/profil.jpg` yaz ya da tam URL; boşsa baş harf gösterilir |
| `NEXT_PUBLIC_CONTACT_EMAIL` | gizlilik metnindeki iletişim adresi (isteğe bağlı) |

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
2. *Environment Variables* bölümüne 3. adımdaki değişkenleri gir (Production ve Preview için).
3. *Deploy*. Fonksiyonlar `vercel.json` ile Frankfurt (`fra1`) bölgesinde çalışır.
4. **Alan adı:** *Settings → Domains* → alan adını ekle. Sonra `NEXT_PUBLIC_SITE_URL` değerini yeni adresle güncelle, *Deployments → Redeploy* yap ve Supabase'de *Site URL* / *Redirect URLs* değerlerini de güncelle.
5. **Analitik:** Vercel projesinde *Analytics → Web Analytics → Enable* (çerezsiz sayfa görüntüleme ölçümü).
6. Telefonda `https://<adres>/admin` → e-posta ile giriş → Safari'de *Paylaş → Ana Ekrana Ekle* (panel uygulama gibi açılır).
7. Instagram biyografisine vitrinin adresini koy.

Sonraki her `git push` Vercel'de otomatik yayınlanır.

## 6. Günlük kullanım (ablan için)

1. Hikâyeyi paylaşırken panelde **+**'ya dokun.
2. **Fotoğraf seç** — hikâyede paylaştığın görselin aynısı (yazıları ve ürün kesitiyle birlikte; vitrinde hikâye oranında görünür).
3. Trendyol/Hepsiburada linkini **Yapıştır** — mağaza ve ürün adı kendiliğinden dolar (gelmezse adı sen yaz).
4. İstersen kategori seç, kısa bir not yaz; marka hediyesiyse **Marka hediyesi**'ni işaretleyip markayı yaz.
5. **Yayınla** — ürün hemen vitrinde.

- **Arşivle:** ürün vitrinden kalkar ama eski hikâyelerdeki linkler çalışmaya devam eder.
- **Sabitle:** ürün vitrinin en üstünde kalır. Oklarla sırayı değiştirebilirsin.
- **Tıklamalar:** hangi ürünün ne kadar tıklandığını, hikâye bittikten sonra gelen tıklamaların payını gösterir.

## 7. Teknik notlar

```
src/
  app/(vitrin)/          vitrin: ana sayfa, ürün sayfası (+ @modal katmanı), gizlilik
  app/go/[id]/           tıklama kaydı + 302 yönlendirme
  app/api/urunler/       akışın sonraki sayfaları / filtreler (CDN önbellekli)
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

- [ ] Trendyol ve Hepsiburada affiliate program şartları `/go` üzerinden yönlendirmeye izin veriyor mu?
- [ ] Reklam etiketleri ve Gizlilik/Aydınlatma Metni için kısa bir avukat kontrolü (uygulamadaki metinler hukuki danışmanlık değildir).
- [ ] Linkten otomatik çekilen mağaza ürün fotoğraflarının kullanım şartları.
- [ ] Vitrin adı, alan adı, profil fotoğrafı/logo (`NEXT_PUBLIC_PROFILE_IMAGE`) ve vurgu rengi (`src/app/globals.css` → `--color-accent`, hikâye halkası → `.story-ring`).
- [ ] Kategoriler ablanın paylaşımlarına uyuyor mu? (`src/lib/categories.ts`)

-- YALNIZCA YEREL GELİŞTİRME İÇİN örnek veri (supabase start / supabase db reset).
-- Canlı Supabase projesine uygulanmaz.

insert into public.admins (email) values ('admin@ornek.com');

insert into public.products
  (creator_id, slug, title, brand, store, affiliate_url, image_url, image_width, image_height, category, note,
   is_gift, gift_brand, is_pinned, status, published_at, created_at, sort_key)
select (select id from public.creators where username = 'shopbysac'), v.*
from (values
  ('saten-midi-elbise-a1b2', 'Saten midi elbise', 'Koton', 'trendyol',
   'https://www.trendyol.com/koton/saten-midi-elbise-p-100001?boutiqueId=61&merchantId=968&utm_source=aff',
   'http://localhost:3000/ornek/elbise.jpg', 1080, 1920, 'giyim',
   'Bu rengi çok sevdim; kumaşı dökümlü ve gün boyu terletmiyor.', false, null, false, 'published',
   now() - interval '2 hours', now() - interval '2 hours', extract(epoch from now() - interval '2 hours')),
  ('deri-gorunumlu-omuz-cantasi-c3d4', 'Deri görünümlü omuz çantası', 'Mango', 'hepsiburada',
   'https://www.hepsiburada.com/mango-omuz-cantasi-p-HBC00000000001?wt_af=ornek',
   'http://localhost:3000/ornek/canta.jpg', 1080, 1350, 'canta-aksesuar',
   'Her şeye uyuyor, telefon ve cüzdan rahat sığıyor.', false, null, false, 'published',
   now() - interval '20 hours', now() - interval '20 hours', extract(epoch from now() - interval '20 hours')),
  ('bej-loafer-e5f6', 'Bej loafer', 'Derimod', 'trendyol',
   'https://ty.gl/ornek-loafer',
   'http://localhost:3000/ornek/loafer.jpg', 1080, 1350, 'ayakkabi',
   'İlk günden vurmadı, kalıbı standart.', false, null, true, 'published',
   now() - interval '3 days', now() - interval '3 days', extract(epoch from now() - interval '3 days')),
  ('nemlendirici-yuz-kremi-g7h8', 'Nemlendirici yüz kremi', 'La Roche-Posay', 'hepsiburada',
   'https://www.hepsiburada.com/nemlendirici-yuz-kremi-p-HBC00000000002?wt_af=ornek',
   'http://localhost:3000/ornek/krem.jpg', 1080, 1350, 'kozmetik-bakim',
   'Kış aylarının kurtarıcısı.', true, 'larocheposaytr', false, 'published',
   now() - interval '5 days', now() - interval '5 days', extract(epoch from now() - interval '5 days')),
  ('keten-masa-ortusu-j9k1', 'Keten masa örtüsü', 'English Home', 'trendyol',
   'https://www.trendyol.com/english-home/keten-masa-ortusu-p-100002?boutiqueId=61&utm_source=aff',
   'http://localhost:3000/ornek/ortu.jpg', 1080, 1350, 'ev', null, false, null, false, 'published',
   now() - interval '7 days', now() - interval '7 days', extract(epoch from now() - interval '7 days')),
  ('oversize-triko-hirka-m2n3', 'Oversize triko hırka', 'Mavi', 'trendyol',
   'https://www.trendyol.com/mavi/oversize-triko-hirka-p-100003?utm_source=aff',
   'http://localhost:3000/ornek/hirka.jpg', 1080, 1350, 'giyim',
   'Ğ, ş, ı, İ: Türkçe karakter testi — şık ve ılık.', false, null, false, 'published',
   now() - interval '10 days', now() - interval '10 days', extract(epoch from now() - interval '10 days')),
  ('altin-kaplama-kupe-p4q5', 'Altın kaplama halka küpe', null, 'hepsiburada',
   'https://www.hepsiburada.com/altin-kaplama-kupe-p-HBC00000000003?wt_af=ornek',
   'http://localhost:3000/ornek/kupe.jpg', 1080, 1350, 'canta-aksesuar', null, false, null, false, 'published',
   now() - interval '12 days', now() - interval '12 days', extract(epoch from now() - interval '12 days')),
  ('seramik-kahve-kupasi-r6s7', 'Seramik kahve kupası', 'Karaca', 'trendyol',
   'https://www.trendyol.com/karaca/seramik-kupa-p-100004?utm_source=aff',
   'http://localhost:3000/ornek/kupa.jpg', 1080, 1350, 'ev', 'Sabah kahvesi keyfi.', false, null, false, 'archived',
   now() - interval '20 days', now() - interval '20 days', extract(epoch from now() - interval '20 days')),
  ('taslak-urun-t8u9', 'Taslak ürün', null, 'trendyol',
   'https://ty.gl/ornek-taslak', null, null, null, null, null, false, null, false, 'draft',
   null, now(), extract(epoch from now()))
) as v;

-- İkinci örnek influencer (çoklu vitrin denemesi; hesabı yok, yalnızca vitrin).
insert into public.creators (username, display_name, bio, instagram)
values ('ornek.influencer', 'Örnek Influencer', 'Kombinlerimdeki parçalar burada.', 'ornek.influencer');

insert into public.products
  (creator_id, slug, title, brand, store, affiliate_url, image_url, image_width, image_height, category,
   status, published_at, created_at, sort_key)
select c.id, 'keten-gomlek-x1y2', 'Keten gömlek', 'Mavi', 'trendyol',
       'https://www.trendyol.com/mavi/keten-gomlek-p-100005?utm_source=aff',
       'http://localhost:3000/ornek/hirka.jpg', 1080, 1350, 'giyim',
       'published', now() - interval '1 hour', now() - interval '1 hour', extract(epoch from now() - interval '1 hour')
from public.creators c where c.username = 'ornek.influencer';

-- Panelde grafik görünsün diye son 30 güne yayılmış örnek tıklamalar.
insert into public.clicks (product_id, source, device, app, country, ip_hash, is_bot, created_at)
select p.id,
       (array['vitrin', 'vitrin', 'vitrin', 'hikaye', 'hikaye', 'paylasim'])[1 + floor(random() * 6)::int],
       (array['ios', 'ios', 'android', 'desktop'])[1 + floor(random() * 4)::int],
       case when random() < 0.8 then 'instagram' end,
       'TR',
       md5(floor(random() * 400)::text),
       random() < 0.05,
       greatest(p.published_at, now() - random() * interval '30 days')
from public.products p
cross join generate_series(1, 40)
where p.status <> 'draft' and random() < 0.6;

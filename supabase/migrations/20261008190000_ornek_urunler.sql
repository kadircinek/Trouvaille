-- Vitrin boş görünmesin diye örnek ürünler (yayında bir kez uygulanır).
--
-- "Bambi desenli ceket" ablanın gerçek hikâyesi ve affiliate linkidir.
-- Diğerleri gerçek Trendyol ürün sayfalarına gider ama görselleri "ÖRNEK" yazılı
-- yer tutuculardır; ablan kendi ürünlerini ekledikçe panelden arşivleyebilir ya da silebilir.
-- Görseller sitenin kendi public/ornek klasöründen gelir (panel yalnızca tam adres kabul eder).

insert into public.products
  (slug, title, brand, store, affiliate_url, image_url, image_width, image_height,
   category, note, is_gift, gift_brand, is_pinned, status, published_at, sort_key)
select slug, title, brand, 'trendyol', affiliate_url,
       'https://trouvaille-sigma.vercel.app/ornek/' || image, width, height,
       category, note, false, null, is_pinned, 'published',
       now() - age, extract(epoch from now() - age)
from (values
  ('bambi-desenli-ceket-sb01', 'Bambi desenli ceket', null,
   'https://ty.gl/v3agb8hg9jplb',
   'bambi.jpg', 920, 1488, 'giyim',
   'İnanamıyorum, aynısı gelmiş! Aramaya “bambi” yazın 🤭', true, interval '0 hours'),
  ('orme-atlet-sb02', 'Örme atlet', 'İpekyol',
   'https://www.trendyol.com/ipekyol/orme-atlet-p-1173622244?boutiqueId=61&merchantId=1138&filterOverPriceListings=false&sav=true',
   'atlet.jpg', 1080, 1350, 'giyim', null, false, interval '1 hour'),
  ('ip-askili-asimetrik-midi-saten-elbise-sb03', 'İp askılı asimetrik midi saten elbise', 'Koton',
   'https://www.trendyol.com/koton/ip-askili-degaje-yaka-asimetrik-midi-slip-saten-elbise-p-892549166',
   'elbise.jpg', 1080, 1920, 'giyim', null, false, interval '5 hours'),
  ('bej-deri-loafer-sb04', 'Bej deri loafer', 'Elle',
   'https://www.trendyol.com/elle/bej-deri-kadin-loafer-p-857788034',
   'loafer.jpg', 1080, 1350, 'ayakkabi', null, false, interval '1 day'),
  ('siyah-uzun-askili-omuz-cantasi-sb05', 'Siyah uzun askılı omuz çantası', 'Derimod',
   'https://www.trendyol.com/derimod/kadin-siyah-uzun-askili-omuz-cantasi-26pbd245618-p-1117771862',
   'canta.jpg', 1080, 1350, 'canta-aksesuar', null, false, interval '2 days'),
  ('nemlendirici-yuz-kremi-52-ml-sb06', 'Nemlendirici yüz kremi 52 ml', 'CeraVe',
   'https://www.trendyol.com/cerave/nemlendirici-yuz-kremi-52-ml-p-129620454',
   'krem.jpg', 1080, 1350, 'kozmetik-bakim', null, false, interval '4 days'),
  ('drape-yaka-kisa-kollu-midi-elbise-sb07', 'Drape yaka kısa kollu midi elbise', 'Koton',
   'https://www.trendyol.com/koton/midi-elbise-drape-yaka-kisa-kollu-standart-kesim-p-814028557',
   'hirka.jpg', 1080, 1350, 'giyim', null, false, interval '6 days'),
  ('modern-dots-emaye-kupa-350-ml-sb08', 'Modern Dots emaye kupa 350 ml', 'English Home',
   'https://www.trendyol.com/english-home/modern-dots-emaye-kupa-350-ml-beyaz-p-379326420',
   'kupa.jpg', 1080, 1350, 'ev', null, false, interval '9 days')
) as v(slug, title, brand, affiliate_url, image, width, height, category, note, is_pinned, age)
on conflict (slug) do nothing;

-- =====================================================================
-- Faz 1 — Vitrin şeması
--   * admins   : panele girebilecek e-posta adresleri
--   * products : vitrindeki ürünler
--   * clicks   : /go/:id yönlendirmesinde kaydedilen tıklamalar
--   * product-images bucket'ı (Storage)
--   * Row Level Security: herkes yalnızca yayındaki ürünleri okur,
--     yalnızca admin yazar. Tıklamaları sunucu (service role) yazar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Adminler
-- ---------------------------------------------------------------------
create table public.admins (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- Bilerek politika yok: bu tabloyu yalnızca SQL Editor / service role görür.
revoke all on public.admins from anon, authenticated;

-- Oturumdaki kullanıcı admin mi? (JWT içindeki doğrulanmış e-posta ile)
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Ürünler
-- ---------------------------------------------------------------------
create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique
                       check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title              text not null check (char_length(btrim(title)) between 1 and 200),
  brand              text check (char_length(brand) <= 100),
  -- Mağaza bilinçli olarak enum değil: ileride yeni mağaza eklemek için
  -- yalnızca uygulamadaki listeye eklemek yeterli.
  store              text not null check (store ~ '^[a-z0-9-]{2,32}$'),
  -- Affiliate linki olduğu gibi saklanır, hiçbir zaman değiştirilmez.
  affiliate_url      text not null check (affiliate_url ~* '^https?://' and char_length(affiliate_url) <= 2048),
  image_url          text check (char_length(image_url) <= 2048),        -- ablanın yüklediği görsel
  image_width        int  check (image_width > 0),
  image_height       int  check (image_height > 0),
  image_blur         text check (char_length(image_blur) <= 4000),      -- küçük base64 bulanık önizleme
  fallback_image_url text check (char_length(fallback_image_url) <= 2048), -- linkten çekilen görsel
  category           text check (category ~ '^[a-z0-9-]{1,40}$'),
  note               text check (char_length(note) <= 500),
  is_gift            boolean not null default false,
  gift_brand         text check (char_length(gift_brand) <= 100),
  is_pinned          boolean not null default false,
  -- Vitrin sırası: büyük olan üstte. Varsayılan = eklenme anı.
  sort_key           double precision not null default extract(epoch from clock_timestamp()),
  status             text not null default 'draft'
                       check (status in ('draft', 'published', 'archived')),
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint products_published_has_image
    check (status <> 'published' or image_url is not null or fallback_image_url is not null),
  constraint products_gift_has_brand
    check (not is_gift or char_length(btrim(coalesce(gift_brand, ''))) > 0)
);

create index products_feed_idx
  on public.products (status, is_pinned desc, sort_key desc, id desc);
create index products_published_at_idx
  on public.products (published_at desc) where status = 'published';

create function public.products_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger products_before_write
  before insert or update on public.products
  for each row execute function public.products_before_write();

alter table public.products enable row level security;

create policy "Herkes yayındaki ürünleri okur"
  on public.products for select
  to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "Admin ürün ekler"
  on public.products for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admin ürün günceller"
  on public.products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin ürün siler"
  on public.products for delete
  to authenticated
  using ((select public.is_admin()));

revoke all on public.products from anon, authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;

-- ---------------------------------------------------------------------
-- Tıklamalar
-- ---------------------------------------------------------------------
create table public.clicks (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  source     text not null default 'vitrin'
               check (source in ('vitrin', 'hikaye', 'paylasim')),
  referrer   text check (char_length(referrer) <= 500),
  device     text check (device in ('ios', 'android', 'desktop', 'other')),
  app        text check (char_length(app) <= 32),          -- instagram, facebook, tiktok...
  country    text check (char_length(country) <= 8),
  ip_hash    text check (char_length(ip_hash) <= 128),     -- IP saklanmaz, tuzlanmış hash
  is_bot     boolean not null default false,
  created_at timestamptz not null default now()
);

create index clicks_created_at_idx on public.clicks (created_at desc);
create index clicks_product_created_idx on public.clicks (product_id, created_at desc);

alter table public.clicks enable row level security;

create policy "Admin tıklamaları okur"
  on public.clicks for select
  to authenticated
  using ((select public.is_admin()));

-- Insert politikası bilerek yok: kayıtları yalnızca sunucudaki
-- service role (RLS'i atlar) yazar; dışarıdan sahte tıklama eklenemez.
revoke all on public.clicks from anon, authenticated;
grant select on public.clicks to authenticated;

-- ---------------------------------------------------------------------
-- Görseller (Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Bucket herkese açık olduğundan okumak için politika gerekmez;
-- yazma/silme yalnızca admin.
create policy "Admin ürün görsellerini görür"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admin ürün görseli yükler"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admin ürün görselini günceller"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admin ürün görselini siler"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Admin yardımcı fonksiyonları
-- (security invoker: RLS geçerli kalır, ayrıca açıkça admin kontrolü var)
-- ---------------------------------------------------------------------

-- Ürünü vitrinde yukarı / aşağı / en üste taşır.
create function public.admin_move_product(p_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cur public.products;
  nb  public.products;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  select * into cur from public.products where id = p_id for update;
  if not found then
    raise exception 'ürün bulunamadı' using errcode = 'P0002';
  end if;

  if p_direction = 'top' then
    update public.products
       set sort_key = (select max(p.sort_key) from public.products p) + 1
     where id = cur.id;
    return;
  elsif p_direction = 'up' then
    select * into nb from public.products p
     where p.status = cur.status and p.is_pinned = cur.is_pinned
       and (p.sort_key, p.id) > (cur.sort_key, cur.id)
     order by p.sort_key asc, p.id asc
     limit 1
     for update;
  elsif p_direction = 'down' then
    select * into nb from public.products p
     where p.status = cur.status and p.is_pinned = cur.is_pinned
       and (p.sort_key, p.id) < (cur.sort_key, cur.id)
     order by p.sort_key desc, p.id desc
     limit 1
     for update;
  else
    raise exception 'geçersiz yön: %', p_direction using errcode = '22023';
  end if;

  if nb.id is null then
    return; -- zaten en üstte / en altta
  end if;

  if nb.sort_key = cur.sort_key then
    update public.products
       set sort_key = cur.sort_key + case when p_direction = 'up' then 0.001 else -0.001 end
     where id = cur.id;
  else
    update public.products set sort_key = nb.sort_key  where id = cur.id;
    update public.products set sort_key = cur.sort_key where id = nb.id;
  end if;
end;
$$;

-- Ürün başına son N gündeki (bot hariç) tıklama sayısı.
create function public.admin_product_clicks(p_days int default 30)
returns table (product_id uuid, clicks bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  return query
    select c.product_id, count(*)::bigint
      from public.clicks c
     where not c.is_bot
       and c.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365))
     group by c.product_id;
end;
$$;

-- Tıklama paneli: özet kutular, dönem kırılımları, en çok tıklananlar,
-- son 30 günün günlük serisi. Günler İstanbul saatine göre hesaplanır.
--   p_days = 1  → bugün,  7 → son 7 gün (bugün dahil),  30 → son 30 gün
create function public.admin_dashboard(p_days int default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  tz           constant text := 'Europe/Istanbul';
  today_local  timestamp;
  today_start  timestamptz;
  month_start  timestamptz;
  period_start timestamptz;
  n_days       int;
  summary      jsonb;
  period       jsonb;
  daily        jsonb;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  n_days       := least(greatest(coalesce(p_days, 30), 1), 365);
  today_local  := date_trunc('day', now() at time zone tz);
  today_start  := today_local at time zone tz;
  month_start  := (today_local - interval '29 days') at time zone tz;
  period_start := (today_local - make_interval(days => n_days - 1)) at time zone tz;

  select jsonb_build_object(
           'today',          count(*) filter (where not c.is_bot and c.created_at >= today_start),
           'week',           count(*) filter (where not c.is_bot and c.created_at >= (today_local - interval '6 days') at time zone tz),
           'month',          count(*) filter (where not c.is_bot),
           'visitors_month', count(distinct c.ip_hash) filter (where not c.is_bot),
           'bots_month',     count(*) filter (where c.is_bot)
         )
    into summary
    from public.clicks c
   where c.created_at >= month_start;

  with pc as (
    select c.product_id, c.source, c.ip_hash, c.created_at,
           p.store, p.category, p.title, p.slug, p.status,
           coalesce(p.image_url, p.fallback_image_url) as image,
           coalesce(p.published_at, p.created_at)      as product_at
      from public.clicks c
      join public.products p on p.id = c.product_id
     where not c.is_bot
       and c.created_at >= period_start
  )
  select jsonb_build_object(
           'days',      n_days,
           'clicks',    (select count(*) from pc),
           'visitors',  (select count(distinct ip_hash) from pc),
           'old_share', (select case when count(*) = 0 then null
                                     else round(100.0 * count(*) filter (where created_at - product_at > interval '24 hours') / count(*), 1)
                                end
                           from pc),
           'by_source', coalesce((select jsonb_agg(jsonb_build_object('key', s.source, 'clicks', s.n) order by s.n desc, s.source)
                                    from (select source, count(*) as n from pc group by source) s), '[]'::jsonb),
           'by_store',  coalesce((select jsonb_agg(jsonb_build_object('key', s.store, 'clicks', s.n) order by s.n desc, s.store)
                                    from (select store, count(*) as n from pc group by store) s), '[]'::jsonb),
           'by_category', coalesce((select jsonb_agg(jsonb_build_object('key', s.category, 'clicks', s.n) order by s.n desc, s.category nulls last)
                                      from (select category, count(*) as n from pc group by category) s), '[]'::jsonb),
           'top',       coalesce((select jsonb_agg(t order by t.clicks desc, t.title)
                                    from (select product_id as id, title, slug, store, status, image, count(*) as clicks
                                            from pc
                                           group by product_id, title, slug, store, status, image
                                           order by count(*) desc, title
                                           limit 10) t), '[]'::jsonb)
         )
    into period;

  select coalesce(jsonb_agg(jsonb_build_object('day', to_char(d.day, 'YYYY-MM-DD'), 'clicks', coalesce(x.n, 0)) order by d.day), '[]'::jsonb)
    into daily
    from generate_series(today_local - interval '29 days', today_local, interval '1 day') as d(day)
    left join (
      select date_trunc('day', c.created_at at time zone tz) as day, count(*) as n
        from public.clicks c
       where not c.is_bot and c.created_at >= month_start
       group by 1
    ) x on x.day = d.day;

  return jsonb_build_object('summary', summary, 'period', period, 'daily', daily);
end;
$$;

revoke all on function public.admin_move_product(uuid, text) from public;
revoke all on function public.admin_product_clicks(int)      from public;
revoke all on function public.admin_dashboard(int)           from public;
grant execute on function public.admin_move_product(uuid, text) to authenticated;
grant execute on function public.admin_product_clicks(int)      to authenticated;
grant execute on function public.admin_dashboard(int)           to authenticated;

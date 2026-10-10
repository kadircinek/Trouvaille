-- Çoklu influencer: her influencer kayıt olur, kendi vitrinini (site.com/kullaniciadi)
-- ve ürünlerini yönetir. Ablanın mevcut vitrini "shopbysac" kullanıcısına taşınır.
--
-- Roller:
--   influencer (creators)  → yalnızca kendi ürünlerini, tıklamalarını ve görsellerini yönetir
--   platform yöneticisi (admins, is_admin()) → her şeyi görür, hesap askıya alabilir

-- ---------------------------------------------------------------------
-- Influencerlar
-- ---------------------------------------------------------------------
create table public.creators (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users (id) on delete set null,
  -- Vitrin adresi: site.com/<username>. Instagram kullanıcı adı kuralları (nokta başta/sonda olamaz).
  username     text not null unique
                 check (username ~ '^[a-z0-9_][a-z0-9._]{1,28}[a-z0-9_]$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio          text check (char_length(bio) <= 300),
  instagram    text check (instagram ~ '^[a-z0-9._]{1,30}$'),
  avatar_url   text check (char_length(avatar_url) <= 2048),
  status       text not null default 'active' check (status in ('active', 'suspended')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.creators enable row level security;

-- Oturumdaki kullanıcının (askıda olmayan) influencer kimliği.
create function public.my_creator_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.creators c where c.user_id = auth.uid() and c.status = 'active';
$$;

revoke all on function public.my_creator_id() from public;
grant execute on function public.my_creator_id() to anon, authenticated, service_role;

create policy "Herkes aktif vitrinleri görür"
  on public.creators for select
  to anon, authenticated
  using (status = 'active' or user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Influencer kendi profilini günceller"
  on public.creators for update
  to authenticated
  using (user_id = (select auth.uid()) and status = 'active')
  with check (user_id = (select auth.uid()) and status = 'active');

-- Kayıt yalnızca sunucudan (service role) yapılır; durum yalnızca platform yöneticisinin fonksiyonuyla değişir.
revoke all on public.creators from anon, authenticated;
grant select (id, username, display_name, bio, instagram, avatar_url, status, created_at) on public.creators to anon;
grant select (id, user_id, username, display_name, bio, instagram, avatar_url, status, created_at) on public.creators to authenticated;
grant update (display_name, bio, instagram, avatar_url, updated_at) on public.creators to authenticated;

-- Platform yöneticisi bir vitrini askıya alır / yeniden açar.
create function public.platform_set_creator_status(p_creator uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'geçersiz durum' using errcode = '22023';
  end if;
  update public.creators set status = p_status, updated_at = now() where id = p_creator;
end;
$$;

revoke all on function public.platform_set_creator_status(uuid, text) from public;
grant execute on function public.platform_set_creator_status(uuid, text) to authenticated;

-- Giriş: kullanıcı adından e-postayı bulur (yalnızca sunucu / service role).
create function public.login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select email from (
    select u.email::text as email, 1 as rank
      from public.creators c join auth.users u on u.id = c.user_id
     where c.username = lower(p_username)
    union all
    select a.email, 2 from public.admins a where a.username = lower(p_username)
  ) x
  order by rank
  limit 1;
$$;

-- "Şifremi unuttum": bu e-posta bir influencer ya da yönetici hesabı mı?
create function public.panel_account_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.email = lower(p_email))
      or exists (
           select 1 from public.creators c join auth.users u on u.id = c.user_id
            where lower(u.email) = lower(p_email) and c.status = 'active'
         );
$$;

revoke all on function public.login_email(text) from public, anon, authenticated;
revoke all on function public.panel_account_exists(text) from public, anon, authenticated;
grant execute on function public.login_email(text) to service_role;
grant execute on function public.panel_account_exists(text) to service_role;

-- Giriş e-postası sınırı (admins.login_email_sent_at yerine; influencerlar da kullanır).
create table public.login_email_throttle (
  email   text primary key,
  sent_at timestamptz not null
);
alter table public.login_email_throttle enable row level security;
revoke all on public.login_email_throttle from anon, authenticated;
alter table public.admins drop column if exists login_email_sent_at;

-- ---------------------------------------------------------------------
-- Ablanın mevcut vitrini → "shopbysac"
-- ---------------------------------------------------------------------
insert into public.creators (username, display_name, bio, instagram, avatar_url, user_id)
select 'shopbysac',
       'Shopbysac',
       'Hikâyelerimde paylaştığım parçalar kaybolmasın diye hepsi burada.',
       'shopbysac2',
       (select s.avatar_url from public.site_settings s where s.id),
       (select u.id
          from public.admins a
          join auth.users u on lower(u.email) = a.email
         where a.username = 'shopbysac'
         limit 1)
where exists (select 1 from public.products)
   or exists (select 1 from public.admins where username = 'shopbysac');

-- ---------------------------------------------------------------------
-- Ürünler influencer'a bağlanır
-- ---------------------------------------------------------------------
alter table public.products add column creator_id uuid references public.creators (id) on delete cascade;

alter table public.products disable trigger products_before_write;
update public.products
   set creator_id = (select id from public.creators where username = 'shopbysac')
 where creator_id is null;
alter table public.products enable trigger products_before_write;

alter table public.products alter column creator_id set not null;

create index products_creator_feed_idx
  on public.products (creator_id, status, is_pinned desc, sort_key desc, id desc);

-- Okuma: yayındaki ürün + vitrini aktif olmalı; influencer kendi taslak/arşivini de görür.
drop policy "Herkes yayındaki ürünleri okur" on public.products;
create policy "Herkes yayındaki ürünleri okur"
  on public.products for select
  to anon, authenticated
  using (
    (status = 'published' and exists (
       select 1 from public.creators c where c.id = creator_id and c.status = 'active'))
    or creator_id = (select public.my_creator_id())
    or (select public.is_admin())
  );

drop policy "Admin ürün ekler" on public.products;
create policy "Influencer kendi ürününü ekler"
  on public.products for insert
  to authenticated
  with check (creator_id = (select public.my_creator_id()));

drop policy "Admin ürün günceller" on public.products;
create policy "Influencer kendi ürününü günceller"
  on public.products for update
  to authenticated
  using (creator_id = (select public.my_creator_id()) or (select public.is_admin()))
  with check (creator_id = (select public.my_creator_id()) or (select public.is_admin()));

drop policy "Admin ürün siler" on public.products;
create policy "Influencer kendi ürününü siler"
  on public.products for delete
  to authenticated
  using (creator_id = (select public.my_creator_id()) or (select public.is_admin()));

-- Kısa kod üretimi influencer oturumunda da tüm ürünlere bakabilsin.
alter function public.new_short_code() security definer;

-- ---------------------------------------------------------------------
-- Tıklamalar: influencer yalnızca kendi ürünlerinin tıklamalarını görür
-- ---------------------------------------------------------------------
drop policy "Admin tıklamaları okur" on public.clicks;
create policy "Influencer kendi tıklamalarını okur"
  on public.clicks for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.products p
                where p.id = product_id and p.creator_id = (select public.my_creator_id()))
  );

-- ---------------------------------------------------------------------
-- Görseller: herkes kendi klasörüne (<creator_id>/...) yükler
-- ---------------------------------------------------------------------
drop policy "Admin ürün görsellerini görür" on storage.objects;
drop policy "Admin ürün görseli yükler" on storage.objects;
drop policy "Admin ürün görselini günceller" on storage.objects;
drop policy "Admin ürün görselini siler" on storage.objects;

create policy "Influencer kendi görsellerini görür"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (
    (select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_creator_id())::text));

create policy "Influencer kendi klasörüne görsel yükler"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (
    (select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_creator_id())::text));

create policy "Influencer kendi görselini günceller"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (
    (select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_creator_id())::text))
  with check (bucket_id = 'product-images' and (
    (select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_creator_id())::text));

create policy "Influencer kendi görselini siler"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (
    (select public.is_admin()) or (storage.foldername(name))[1] = (select public.my_creator_id())::text));

-- ---------------------------------------------------------------------
-- Panel fonksiyonları influencer bazlı
-- ---------------------------------------------------------------------
drop function public.admin_move_product(uuid, text);
drop function public.admin_product_clicks(int);
drop function public.admin_dashboard(int);

create function public.can_manage_creator(p_creator uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_creator is not null and (p_creator = public.my_creator_id() or public.is_admin());
$$;

revoke all on function public.can_manage_creator(uuid) from public;
grant execute on function public.can_manage_creator(uuid) to authenticated;

-- Ürünü kendi vitrininde yukarı / aşağı / en üste taşır.
create function public.panel_move_product(p_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cur public.products;
  nb  public.products;
begin
  select * into cur from public.products where id = p_id for update;
  if not found or not public.can_manage_creator(cur.creator_id) then
    raise exception 'ürün bulunamadı' using errcode = 'P0002';
  end if;

  if p_direction = 'top' then
    update public.products
       set sort_key = (select max(p.sort_key) from public.products p where p.creator_id = cur.creator_id) + 1
     where id = cur.id;
    return;
  elsif p_direction = 'up' then
    select * into nb from public.products p
     where p.creator_id = cur.creator_id and p.status = cur.status and p.is_pinned = cur.is_pinned
       and (p.sort_key, p.id) > (cur.sort_key, cur.id)
     order by p.sort_key asc, p.id asc
     limit 1
     for update;
  elsif p_direction = 'down' then
    select * into nb from public.products p
     where p.creator_id = cur.creator_id and p.status = cur.status and p.is_pinned = cur.is_pinned
       and (p.sort_key, p.id) < (cur.sort_key, cur.id)
     order by p.sort_key desc, p.id desc
     limit 1
     for update;
  else
    raise exception 'geçersiz yön: %', p_direction using errcode = '22023';
  end if;

  if nb.id is null then
    return;
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

-- Influencer'ın ürün başına son N gündeki (bot hariç) tıklama sayısı.
create function public.panel_product_clicks(p_creator uuid, p_days int default 30)
returns table (product_id uuid, clicks bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.can_manage_creator(p_creator) then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  return query
    select c.product_id, count(*)::bigint
      from public.clicks c
      join public.products p on p.id = c.product_id
     where p.creator_id = p_creator
       and not c.is_bot
       and c.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365))
     group by c.product_id;
end;
$$;

-- Influencer'ın tıklama paneli (Faz 1'deki admin_dashboard'un influencer bazlı hâli).
create function public.panel_dashboard(p_creator uuid, p_days int default 30)
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
  if not public.can_manage_creator(p_creator) then
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
    join public.products p on p.id = c.product_id
   where p.creator_id = p_creator
     and c.created_at >= month_start;

  with pc as (
    select c.product_id, c.source, c.ip_hash, c.created_at,
           p.store, p.category, p.title, p.slug, p.status,
           coalesce(p.image_url, p.fallback_image_url) as image,
           coalesce(p.published_at, p.created_at)      as product_at
      from public.clicks c
      join public.products p on p.id = c.product_id
     where p.creator_id = p_creator
       and not c.is_bot
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
        join public.products p on p.id = c.product_id
       where p.creator_id = p_creator and not c.is_bot and c.created_at >= month_start
       group by 1
    ) x on x.day = d.day;

  return jsonb_build_object('summary', summary, 'period', period, 'daily', daily);
end;
$$;

revoke all on function public.panel_move_product(uuid, text) from public;
revoke all on function public.panel_product_clicks(uuid, int) from public;
revoke all on function public.panel_dashboard(uuid, int)      from public;
grant execute on function public.panel_move_product(uuid, text) to authenticated;
grant execute on function public.panel_product_clicks(uuid, int) to authenticated;
grant execute on function public.panel_dashboard(uuid, int)      to authenticated;

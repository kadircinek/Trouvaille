-- Faz 2: profil fotoğrafı, hikâye kısa linkleri, arama ve link sağlık kontrolü.

-- ---------------------------------------------------------------------
-- Ürün tetikleyicisi: yalnızca otomatik alanlar (kısa kod, link kontrolü)
-- değiştiğinde "güncellendi" zamanı değişmesin.
-- ---------------------------------------------------------------------
create or replace function public.products_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  automatic constant text[] := array['updated_at', 'search_text', 'short_code', 'link_status', 'link_checked_at', 'link_check_note', 'check_url'];
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - automatic) = (to_jsonb(old) - automatic) then
    return new;
  end if;
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Vitrin ayarları (tek satır): profil fotoğrafı
-- ---------------------------------------------------------------------
create table public.site_settings (
  id         boolean primary key default true check (id),
  avatar_url text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "Herkes vitrin ayarlarını okur"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "Admin vitrin ayarlarını günceller"
  on public.site_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (avatar_url, updated_at) on public.site_settings to authenticated;

-- ---------------------------------------------------------------------
-- Hikâye kısa linkleri: site.com/u/ab3kz
-- Karışan karakterler (0/o, 1/l/i) yok; 31^5 ≈ 28 milyon kod.
-- ---------------------------------------------------------------------
create function public.new_short_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.products p where p.short_code = code);
  end loop;
  return code;
end;
$$;

alter table public.products add column short_code text;

do $$
declare
  r record;
begin
  for r in select id from public.products where short_code is null loop
    update public.products set short_code = public.new_short_code() where id = r.id;
  end loop;
end;
$$;

alter table public.products
  alter column short_code set default public.new_short_code(),
  alter column short_code set not null,
  add constraint products_short_code_format check (short_code ~ '^[a-z0-9]{4,12}$');

create unique index products_short_code_key on public.products (short_code);

-- ---------------------------------------------------------------------
-- Arama: Türkçe karakterden bağımsız (ı/i, ş/s, ğ/g …) ürün adı + marka
-- ---------------------------------------------------------------------
create function public.tr_fold(input text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(translate(coalesce(input, ''), 'ÇĞİIÖŞÜÂÎÛçğıöşüâîû', 'cgiiosuaiucgiosuaiu'));
$$;

alter table public.products
  add column search_text text
  generated always as (public.tr_fold(title || ' ' || coalesce(brand, ''))) stored;

-- ---------------------------------------------------------------------
-- Link sağlık kontrolü (günlük Vercel Cron, service role yazar)
--   check_url: affiliate linkinin vardığı ürün sayfası, takip parametreleri
--              olmadan. Kontrol bu adrese yapılır; affiliate linkine her gün
--              istek atılmaz (sahte tıklama sayılmasın).
-- ---------------------------------------------------------------------
alter table public.products
  add column link_status text
    constraint products_link_status_check check (link_status in ('ok', 'kirik', 'stokta_yok', 'bilinmiyor')),
  add column link_checked_at timestamptz,
  add column link_check_note text,
  add column check_url text;

create index products_link_check_idx on public.products (link_checked_at nulls first) where status = 'published';

-- ---------------------------------------------------------------------
-- "Şifremi unuttum" e-postası uygulamanın SMTP'siyle gönderildiğinde
-- aynı adrese dakikada en fazla bir e-posta (kötüye kullanıma karşı).
-- ---------------------------------------------------------------------
alter table public.admins add column login_email_sent_at timestamptz;

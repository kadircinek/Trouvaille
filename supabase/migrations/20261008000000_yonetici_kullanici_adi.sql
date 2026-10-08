-- =====================================================================
-- Yöneticiler için kullanıcı adı: panele "kullanıcı adı + şifre" ile giriş.
-- (Şifre Supabase Auth'ta saklanır; burada yalnızca kullanıcı adı → e-posta eşlemesi var.)
-- =====================================================================

alter table public.admins
  add column if not exists username text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admins_username_format') then
    alter table public.admins
      add constraint admins_username_format
      check (username is null or username ~ '^[a-z0-9._-]{3,32}$');
  end if;
end;
$$;

create unique index if not exists admins_username_key on public.admins (username);

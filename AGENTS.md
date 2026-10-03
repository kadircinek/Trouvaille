<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proje notları (Vitrin / Trouvaille)

- Ürün gereksinimleri `docs/PRD.md` içinde. Fazlar sırayla yapılır; Faz 1 (MVP) tamamlandı, Faz 2: arama, favoriler, hikâye kısa linkleri (`/u/:kod`), link sağlık kontrolü (Vercel Cron), video.
- Kapsam dışı: yapay zekâ görsel üretimi / persona, ödeme, ziyaretçi üyeliği.
- **Affiliate linkleri asla değiştirilmez, kısaltılmaz, parametresi silinmez.** `/go/[id]` linki 302 ile birebir döndürür (`src/lib/links.ts`, testleri `src/lib/__tests__/links.test.ts`).
- Her ürün kartında ve detayında `<AdLabel>` (#Reklam etiketi) bulunur; kapatılamaz.
- Arayüz Türkçe ve mobil öncelikli (390 px); Instagram uygulama içi tarayıcısında çalışmalı.
- Paket yöneticisi: pnpm. Kontroller: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Veritabanı değişiklikleri `supabase/migrations/` altında SQL migration olarak yazılır; RLS: herkes yalnızca yayındaki ürünleri okur, yalnızca admin yazar, tıklamaları service role yazar.
- Service role anahtarı yalnızca sunucuda (`src/lib/supabase/service.ts`, `server-only`).

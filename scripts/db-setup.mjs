// Yayın (build) öncesi veritabanı kurulumu. `pnpm build` bunu `next build`'den önce çalıştırır.
//
// 1) supabase/migrations/*.sql dosyalarından henüz uygulanmamış olanları sırayla uygular.
//    Kayıt, Supabase CLI ile aynı tabloda tutulur (supabase_migrations.schema_migrations).
//    İlk kurulum SQL Editor'da elle yapılmışsa bunu tanır ve yalnızca kaydını ekler.
// 2) ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD tanımlıysa o yönetici hesabını açar
//    (hesap zaten varsa şifresine dokunmaz).
//
// Veritabanı adresi yoksa (ör. yerel `pnpm build`) sessizce atlar.
// Vercel'in Supabase entegrasyonu POSTGRES_URL_NON_POOLING / POSTGRES_URL değişkenlerini kendisi ekler.

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

// Yerelde .env.local / .env okunur (Vercel'de değişkenler zaten ortamda; dosyalar ezmez).
for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
// Bu ilk sürüm SQL Editor'da elle kurulmuş olabilir; tabloları varsa yeniden çalıştırılmaz.
const BASELINE = { version: "20261004000000", marker: "public.products" };
const LOCK_KEY = "vitrin-db-setup";

const log = (msg) => console.log(`[veritabanı] ${msg}`);

// Sırayla denenir: doğrudan/oturum bağlantısı önce, havuzlu (transaction pooler) sonra.
function databaseUrls() {
  return [
    process.env.SUPABASE_DB_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ].filter((u, i, all) => u && all.indexOf(u) === i);
}

const NETWORK_ERRORS = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH", "EAI_AGAIN"]);

/** İlk bağlanabilen adresle bağlanır; hiçbirine ulaşılamazsa null (yayın durmaz). */
async function connect(urls) {
  for (const raw of urls) {
    const host = (() => {
      try {
        return new URL(raw).host;
      } catch {
        return "geçersiz adres";
      }
    })();
    const client = new pg.Client({ ...connectionConfig(raw), connectionTimeoutMillis: 15000 });
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      const network = NETWORK_ERRORS.has(error.code) || /timeout|terminated/i.test(error.message);
      if (!network) throw new Error(`Veritabanına bağlanılamadı (${host}): ${error.message}`);
      log(`${host} adresine ulaşılamadı (${error.code ?? error.message}); sıradaki deneniyor.`);
    }
  }
  return null;
}

function connectionConfig(raw) {
  const url = new URL(raw);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  // sslmode parametresini node-postgres'e bırakmayıp açıkça veriyoruz: bağlantı şifreli,
  // Supabase sertifika zinciri Node'un kök sertifikalarında olmadığı için doğrulama kapalı
  // (libpq'nun sslmode=require davranışıyla aynı).
  for (const key of ["sslmode", "sslrootcert", "supa", "pgbouncer"]) url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: false } };
}

async function migrate(client) {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{14}_[\w-]+\.sql$/.test(f))
    .sort();

  try {
    await client.query(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key,
        statements text[],
        name text
      );
    `);

    let applied = 0;
    for (const file of files) {
      const version = file.slice(0, 14);
      const name = file.slice(15, -4);
      // Her dosya kendi işleminde (transaction); aynı anda çalışan iki yayın çakışmasın diye kilitli.
      await client.query("begin");
      try {
        await client.query("select pg_advisory_xact_lock(hashtext($1))", [LOCK_KEY]);
        const done = await client.query("select 1 from supabase_migrations.schema_migrations where version = $1", [version]);
        if (done.rowCount) {
          await client.query("commit");
          continue;
        }
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
        if (version === BASELINE.version) {
          const existing = await client.query("select to_regclass($1) is not null as present", [BASELINE.marker]);
          if (existing.rows[0].present) {
            await record(client, version, name, []);
            await client.query("commit");
            log(`${file}: tablolar zaten kurulu, kayıt eklendi.`);
            continue;
          }
        }
        await client.query(sql);
        await record(client, version, name, [sql]);
        await client.query("commit");
        applied++;
        log(`${file} uygulandı.`);
      } catch (error) {
        await client.query("rollback").catch(() => {});
        throw new Error(`${file} uygulanamadı: ${error.message}`);
      }
    }
    if (applied === 0) log("Şema güncel.");
    // PostgREST tablo/sütun değişikliklerini hemen görsün.
    await client.query("notify pgrst, 'reload schema'");
  } finally {
    await client.end();
  }
}

function record(client, version, name, statements) {
  return client.query(
    "insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3) on conflict (version) do nothing",
    [version, name, statements],
  );
}

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase().replace(/^@+/, "") || null;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.ADMIN_PASSWORD || null;
  if (!username && !email && !password) return;

  if (!email) throw new Error("ADMIN_EMAIL tanımlı değil (şifre sıfırlama için yöneticinin e-postası gerekli).");
  if (username && !/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("ADMIN_USERNAME yalnızca küçük harf, rakam, nokta, alt çizgi ve tire içerebilir (3–32 karakter).");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Yönetici açmak için NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (password) {
    if (password.length < 8) throw new Error("ADMIN_PASSWORD en az 8 karakter olmalı.");
    const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error && !/already|exists|registered/i.test(`${error.code ?? ""} ${error.message}`)) {
      throw new Error(`Yönetici hesabı açılamadı: ${error.message}`);
    }
    log(error ? `${email} zaten kayıtlı; şifresi değiştirilmedi.` : `${email} için yönetici hesabı açıldı.`);
  }

  const row = username ? { email, username } : { email };
  const { error } = await supabase.from("admins").upsert(row, { onConflict: "email" });
  if (error) throw new Error(`Yönetici listesine eklenemedi: ${error.message}`);
  log(`Yönetici: ${username ?? email}`);
}

const urls = databaseUrls();
if (urls.length === 0) {
  log("Veritabanı adresi tanımlı değil; şema kurulumu atlandı.");
} else {
  const client = await connect(urls);
  if (client) await migrate(client);
  else log("UYARI: Veritabanına ulaşılamadı; şema kurulumu bu yayında atlandı.");
}
await ensureAdmin();

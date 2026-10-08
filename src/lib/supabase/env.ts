// Supabase anahtarları. Vercel'in Supabase entegrasyonu ve Supabase'in yeni
// anahtar adları (publishable / secret) da desteklenir. NEXT_PUBLIC_ değerleri
// tarayıcı paketine gömüldüğü için her biri açıkça yazılmıştır.

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL tanımlı değil. .env.example dosyasına bakın.");
  }
  return url;
}

export function supabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. .env.example dosyasına bakın.");
  }
  return key;
}

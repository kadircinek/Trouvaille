import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Service role istemcisi: RLS'i atlar. YALNIZCA sunucuda kullanılır
 * (tıklama kaydı, arşivdeki ürünün linkini bulma, admin listesini kontrol).
 * Anahtar hiçbir zaman tarayıcıya gönderilmez ("server-only" bunu garanti eder).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil. .env.example dosyasına bakın.");
  }
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

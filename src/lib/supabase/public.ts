import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Çerezsiz, oturumsuz istemci: herkese açık vitrin sayfaları için.
 * RLS sayesinde yalnızca yayındaki ürünleri görür. Çerez okumadığı için
 * sayfalar statik üretilip önbelleğe alınabilir.
 */
export function createPublicClient() {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

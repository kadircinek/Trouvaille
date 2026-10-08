import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Admin panelinde tarayıcıdan doğrudan Storage'a görsel yüklemek için.
// Oturum çerezlerini kullanır; RLS yalnızca admin'in yüklemesine izin verir.
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

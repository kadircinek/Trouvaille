import { createBrowserClient } from "@supabase/ssr";

// Admin panelinde tarayıcıdan doğrudan Storage'a görsel yüklemek için.
// Oturum çerezlerini kullanır; RLS yalnızca admin'in yüklemesine izin verir.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

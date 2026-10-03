import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  email: string;
};

/** Oturum yoksa ya da kullanıcı admin değilse giriş sayfasına yollar. */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!email) redirect("/admin/giris");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) redirect("/admin/giris?hata=yetki");

  return { supabase, email };
});

/** Server action'lar için: yönlendirmek yerine hata döndürmek gerektiğinde. */
export async function getAdmin(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!email) return null;
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return null;
  return { supabase, email };
}

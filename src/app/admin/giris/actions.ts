"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { site } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string; info?: string };

const emailSchema = z.email().max(254);

async function isAdminEmail(email: string): Promise<boolean> {
  const { data, error } = await createServiceClient().from("admins").select("email").eq("email", email).maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** 1. adım: e-postaya giriş kodu + sihirli link gönder (yalnızca admin listesindekilere). */
export async function sendLoginCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { step: "email", error: "Geçerli bir e-posta adresi yaz." };
  const email = parsed.data;

  let allowed: boolean;
  try {
    allowed = await isAdminEmail(email);
  } catch (error) {
    console.error("Admin listesi okunamadı:", error);
    return { step: "email", error: "Şu an giriş yapılamıyor. Biraz sonra tekrar dene." };
  }

  // Admin olmayan adrese e-posta gönderilmez; ama bu bilgi de sızdırılmaz.
  if (allowed) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${site.url}/auth/confirm?next=/admin` },
    });
    if (error) {
      console.error("Giriş e-postası gönderilemedi:", error.message);
      const tooMany = error.status === 429 || /rate|seconds/i.test(error.message);
      return {
        step: "email",
        error: tooMany
          ? "Çok sık deneme yapıldı. Bir dakika bekleyip tekrar dene."
          : "E-posta gönderilemedi. Biraz sonra tekrar dene.",
      };
    }
  }

  return {
    step: "code",
    email,
    info: "Bu adres yönetici olarak kayıtlıysa e-postana bir giriş kodu ve link gönderdik.",
  };
}

/** 2. adım: e-postadaki kodu doğrula (ana ekrana eklenmiş uygulamada da çalışır). */
export async function verifyLoginCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("code") ?? "").replace(/\s+/g, "");
  if (!emailSchema.safeParse(email).success) return { step: "email", error: "Geçerli bir e-posta adresi yaz." };
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "Kod, e-postadaki rakamlardan oluşur." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { step: "code", email, error: "Kod hatalı ya da süresi dolmuş. Yeni kod isteyebilirsin." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/giris");
}

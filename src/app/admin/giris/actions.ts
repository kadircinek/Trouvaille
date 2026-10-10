"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { site } from "@/config/site";
import { parseLoginIdentifier } from "@/lib/admin-users";
import { loginEmail } from "@/lib/login-email";
import { mailerConfigured, sendMail } from "@/lib/mailer";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string; info?: string };

const emailSchema = z.email().max(254);

/** Bu e-postayla açılmış bir vitrin ya da platform yöneticisi hesabı var mı? */
async function isPanelEmail(email: string): Promise<boolean> {
  const { data, error } = await createServiceClient().rpc("panel_account_exists", { p_email: email });
  if (error) throw new Error(error.message);
  return data === true;
}

/** 1. adım: e-postaya giriş kodu + sihirli link gönder (yalnızca kayıtlı hesaplara). */
export async function sendLoginCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { step: "email", error: "Geçerli bir e-posta adresi yaz." };
  const email = parsed.data;

  let allowed: boolean;
  try {
    allowed = await isPanelEmail(email);
  } catch (error) {
    console.error("Hesap aranamadı:", error);
    return { step: "email", error: "Şu an giriş yapılamıyor. Biraz sonra tekrar dene." };
  }

  // Kayıtlı olmayan adrese e-posta gönderilmez; ama bu bilgi de sızdırılmaz.
  if (allowed) {
    const problem = mailerConfigured() ? await sendOwnLoginEmail(email) : await sendSupabaseLoginEmail(email);
    if (problem) return { step: "email", error: problem };
  }

  return {
    step: "code",
    email,
    info: "Bu adresle bir vitrin açılmışsa e-postana bir giriş kodu ve link gönderdik.",
  };
}

const TOO_MANY = "Çok sık deneme yapıldı. Bir dakika bekleyip tekrar dene.";
const SEND_FAILED = "E-posta gönderilemedi. Biraz sonra tekrar dene.";
/** E-postadaki link/kod ile girildikten sonra yeni şifre belirlensin. */
const AFTER_EMAIL_LOGIN = "/admin/hesap?sifre=yeni";

/** Supabase'in kendi e-posta servisiyle (SMTP ayarı yoksa). */
async function sendSupabaseLoginEmail(email: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${site.url}/auth/confirm?next=${encodeURIComponent(AFTER_EMAIL_LOGIN)}`,
    },
  });
  if (!error) return null;
  console.error("Giriş e-postası gönderilemedi:", error.message);
  return error.status === 429 || /rate|seconds/i.test(error.message) ? TOO_MANY : SEND_FAILED;
}

/**
 * Uygulamanın SMTP ayarıyla: kodu ve linki Supabase üretir (e-posta göndermeden),
 * e-postayı biz göndeririz. Aynı adrese dakikada en fazla bir e-posta.
 */
async function sendOwnLoginEmail(email: string): Promise<string | null> {
  const service = createServiceClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 60_000).toISOString();
  const first = await service.from("login_email_throttle").insert({ email, sent_at: now.toISOString() });
  if (first.error) {
    if (first.error.code !== "23505") {
      console.error("Giriş e-postası sırası alınamadı:", first.error.message);
      return SEND_FAILED;
    }
    const { data: slot, error: slotError } = await service
      .from("login_email_throttle")
      .update({ sent_at: now.toISOString() })
      .eq("email", email)
      .lt("sent_at", cutoff)
      .select("email");
    if (slotError) {
      console.error("Giriş e-postası sırası alınamadı:", slotError.message);
      return SEND_FAILED;
    }
    if (!slot?.length) return TOO_MANY;
  }

  const { data, error } = await service.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties) {
    console.error("Giriş linki üretilemedi:", error?.message);
    return SEND_FAILED;
  }
  const link =
    `${site.url}/auth/confirm?type=magiclink&token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&next=${encodeURIComponent(AFTER_EMAIL_LOGIN)}`;
  try {
    await sendMail({ to: email, ...loginEmail({ siteName: site.name, code: data.properties.email_otp, link }) });
  } catch (err) {
    console.error("Giriş e-postası gönderilemedi (SMTP):", err);
    return SEND_FAILED;
  }
  return null;
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
  redirect(AFTER_EMAIL_LOGIN);
}

export type PasswordState = { error?: string; identifier?: string };

const WRONG_CREDENTIALS = "Kullanıcı adı ya da şifre hatalı.";

/** Kullanıcı adı (ya da e-posta) + şifre ile giriş. */
export async function signInWithPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const raw = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const identifier = parseLoginIdentifier(raw);
  if (!identifier || !password) return { error: "Kullanıcı adını ve şifreni yaz.", identifier: raw };

  let email: string;
  if (identifier.kind === "email") {
    email = identifier.email;
  } else {
    const { data, error } = await createServiceClient().rpc("login_email", { p_username: identifier.username });
    if (error) {
      console.error("Kullanıcı aranamadı:", error.message);
      return { error: "Şu an giriş yapılamıyor. Biraz sonra tekrar dene.", identifier: raw };
    }
    if (typeof data !== "string" || !data) return { error: WRONG_CREDENTIALS, identifier: raw };
    email = data;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const tooMany = error.status === 429 || /rate|too many/i.test(error.message);
    return { error: tooMany ? "Çok fazla deneme yapıldı. Birkaç dakika bekle." : WRONG_CREDENTIALS, identifier: raw };
  }

  // Şifre doğru ama vitrini (ya da yöneticiliği) yoksa / vitrini askıdaysa oturumu kapat.
  const [{ data: isAdmin }, { data: creatorId }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("my_creator_id"),
  ]);
  if (isAdmin !== true && !creatorId) {
    await supabase.auth.signOut();
    return { error: WRONG_CREDENTIALS, identifier: raw };
  }
  redirect(creatorId ? "/admin" : "/admin/platform");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/giris");
}

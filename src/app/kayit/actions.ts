"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { passwordProblem } from "@/lib/admin-users";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeUsername, usernameProblem } from "@/lib/usernames";

export type RegisterValues = { username: string; display_name: string; email: string };
export type RegisterState = { error?: string; values?: RegisterValues };

const emailSchema = z.email().max(254);
const TAKEN = "Bu kullanıcı adı alınmış, başka bir ad seç.";
const FAILED = "Kayıt yapılamadı. Biraz sonra tekrar dene.";

/**
 * Influencer kaydı: hesap + vitrin açılır, oturum açılır ve panele gidilir.
 * Vitrin hemen yayındadır; platform yöneticisi gerekirse askıya alabilir.
 */
export async function registerCreator(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const values: RegisterValues = {
    username: String(formData.get("username") ?? ""),
    display_name: String(formData.get("display_name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const fail = (error: string): RegisterState => ({ error, values });

  // Botlar için görünmez alan: doluysa sessizce reddedilir.
  if (String(formData.get("website") ?? "")) return fail(FAILED);

  const username = normalizeUsername(values.username);
  const usernameError = usernameProblem(username);
  if (usernameError) return fail(usernameError);

  const displayName = values.display_name.trim().replace(/\s+/g, " ") || username;
  if (displayName.length > 60) return fail("Vitrin adı en fazla 60 karakter olabilir.");

  const parsedEmail = emailSchema.safeParse(values.email.trim().toLowerCase());
  if (!parsedEmail.success) return fail("Geçerli bir e-posta adresi yaz.");
  const email = parsedEmail.data;

  const password = String(formData.get("password") ?? "");
  const passwordError = passwordProblem(password, String(formData.get("repeat") ?? ""));
  if (passwordError) return fail(passwordError);

  if (formData.get("onay") !== "on") {
    return fail("Devam etmek için reklam etiketi ve gizlilik koşullarını kabul et.");
  }

  const service = createServiceClient();
  const [creatorTaken, adminTaken] = await Promise.all([
    service.from("creators").select("id").eq("username", username).maybeSingle(),
    service.from("admins").select("email").eq("username", username).maybeSingle(),
  ]);
  if (creatorTaken.error || adminTaken.error) {
    console.error("Kullanıcı adı kontrol edilemedi:", creatorTaken.error?.message ?? adminTaken.error?.message);
    return fail(FAILED);
  }
  if (creatorTaken.data || adminTaken.data) return fail(TAKEN);

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    if (createError && /already|exists|registered/i.test(`${createError.code ?? ""} ${createError.message}`)) {
      return fail("Bu e-postayla zaten bir hesap var. Giriş yap ya da şifreni sıfırla.");
    }
    if (createError?.code === "weak_password") return fail("Bu şifre çok zayıf; daha uzun ya da farklı bir şifre seç.");
    console.error("Hesap açılamadı:", createError?.message);
    return fail(FAILED);
  }

  const { error: insertError } = await service.from("creators").insert({
    user_id: created.user.id,
    username,
    display_name: displayName,
    instagram: /^[a-z0-9._]{1,30}$/.test(username) ? username : null,
  });
  if (insertError) {
    await service.auth.admin.deleteUser(created.user.id).catch(() => {});
    if (insertError.code === "23505") return fail(TAKEN);
    console.error("Vitrin açılamadı:", insertError.message);
    return fail(FAILED);
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/admin/giris");
  redirect("/admin?hosgeldin=1");
}

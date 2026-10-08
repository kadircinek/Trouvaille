"use server";

import { passwordProblem } from "@/lib/admin-users";
import { getAdmin } from "@/lib/auth";

export type PasswordChangeState = { ok?: boolean; error?: string };

/** Giriş yapmış yönetici kendi şifresini değiştirir. */
export async function changePassword(_prev: PasswordChangeState, formData: FormData): Promise<PasswordChangeState> {
  const admin = await getAdmin();
  if (!admin) return { error: "Oturumun kapanmış. Lütfen yeniden giriş yap." };

  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password, String(formData.get("repeat") ?? ""));
  if (problem) return { error: problem };

  const { error } = await admin.supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Yeni şifre eskisiyle aynı olamaz." };
    if (error.code === "weak_password") return { error: "Bu şifre çok zayıf; daha uzun ya da farklı bir şifre seç." };
    console.error("Şifre değiştirilemedi:", error.message);
    return { error: "Şifre değiştirilemedi. Çıkış yapıp yeniden girdikten sonra tekrar dene." };
  }
  return { ok: true };
}

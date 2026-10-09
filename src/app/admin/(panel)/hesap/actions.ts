"use server";

import { revalidatePath } from "next/cache";
import { passwordProblem } from "@/lib/admin-users";
import { getAdmin } from "@/lib/auth";
import { PRODUCT_IMAGE_BUCKET, storagePathFromUrl } from "@/lib/storage";

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

export type AvatarResult = { ok: true } | { ok: false; error: string };

/**
 * Profil fotoğrafını kaydeder (null: kaldırır). Görsel tarayıcıdan Storage'a
 * yüklenmiş olmalı; eski fotoğraf dosyası silinir.
 */
export async function saveAvatar(url: string | null): Promise<AvatarResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Oturumun kapanmış. Lütfen yeniden giriş yap." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url !== null && !storagePathFromUrl(url, supabaseUrl)?.startsWith("profil/")) {
    return { ok: false, error: "Fotoğraf yüklenemedi, tekrar dene." };
  }

  const { data: current } = await admin.supabase.from("site_settings").select("avatar_url").maybeSingle();
  const { error } = await admin.supabase
    .from("site_settings")
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) {
    console.error("Profil fotoğrafı kaydedilemedi:", error.message);
    return { ok: false, error: "Kaydedilemedi, tekrar dene." };
  }

  const oldPath = storagePathFromUrl(current?.avatar_url as string | null | undefined, supabaseUrl);
  if (oldPath && current?.avatar_url !== url) {
    const { error: removeError } = await admin.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([oldPath]);
    if (removeError) console.error("Eski profil fotoğrafı silinemedi:", removeError.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

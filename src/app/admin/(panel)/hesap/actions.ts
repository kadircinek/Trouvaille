"use server";

import { revalidatePath } from "next/cache";
import { passwordProblem } from "@/lib/admin-users";
import { getCreatorSession, getPanelSession } from "@/lib/auth";
import { PRODUCT_IMAGE_BUCKET, storagePathFromUrl } from "@/lib/storage";
import { normalizeUsername } from "@/lib/usernames";

export type PasswordChangeState = { ok?: boolean; error?: string };

const SESSION_EXPIRED = "Oturumun kapanmış. Lütfen yeniden giriş yap.";

/** Giriş yapmış kullanıcı kendi şifresini değiştirir. */
export async function changePassword(_prev: PasswordChangeState, formData: FormData): Promise<PasswordChangeState> {
  const session = await getPanelSession();
  if (!session) return { error: SESSION_EXPIRED };

  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password, String(formData.get("repeat") ?? ""));
  if (problem) return { error: problem };

  const { error } = await session.supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Yeni şifre eskisiyle aynı olamaz." };
    if (error.code === "weak_password") return { error: "Bu şifre çok zayıf; daha uzun ya da farklı bir şifre seç." };
    console.error("Şifre değiştirilemedi:", error.message);
    return { error: "Şifre değiştirilemedi. Çıkış yapıp yeniden girdikten sonra tekrar dene." };
  }
  return { ok: true };
}

export type ProfileState = { ok?: boolean; error?: string };

/** Vitrindeki ad, açıklama ve Instagram kullanıcı adı. */
export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getCreatorSession();
  if (!session) return { error: SESSION_EXPIRED };

  const displayName = String(formData.get("display_name") ?? "").trim().replace(/\s+/g, " ");
  const bio = String(formData.get("bio") ?? "").trim().replace(/\n{3,}/g, "\n\n");
  const instagram = normalizeUsername(String(formData.get("instagram") ?? ""));
  if (!displayName) return { error: "Vitrinde görünecek adı yaz." };
  if (displayName.length > 60) return { error: "Ad en fazla 60 karakter olabilir." };
  if (bio.length > 300) return { error: "Açıklama en fazla 300 karakter olabilir." };
  if (instagram && !/^[a-z0-9._]{1,30}$/.test(instagram)) return { error: "Instagram kullanıcı adı geçersiz." };

  const { error } = await session.supabase
    .from("creators")
    .update({ display_name: displayName, bio: bio || null, instagram: instagram || null, updated_at: new Date().toISOString() })
    .eq("id", session.creator.id);
  if (error) {
    console.error("Vitrin profili kaydedilemedi:", error.message);
    return { error: "Kaydedilemedi, tekrar dene." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export type AvatarResult = { ok: true } | { ok: false; error: string };

/**
 * Profil fotoğrafını kaydeder (null: kaldırır). Görsel tarayıcıdan Storage'daki
 * kendi klasörüne yüklenmiş olmalı; eski fotoğraf dosyası silinir.
 */
export async function saveAvatar(url: string | null): Promise<AvatarResult> {
  const session = await getCreatorSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const { creator } = session;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url !== null && !storagePathFromUrl(url, supabaseUrl)?.startsWith(`${creator.id}/profil/`)) {
    return { ok: false, error: "Fotoğraf yüklenemedi, tekrar dene." };
  }

  const { error } = await session.supabase
    .from("creators")
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq("id", creator.id);
  if (error) {
    console.error("Profil fotoğrafı kaydedilemedi:", error.message);
    return { ok: false, error: "Kaydedilemedi, tekrar dene." };
  }

  const oldPath = storagePathFromUrl(creator.avatar_url, supabaseUrl);
  if (oldPath && creator.avatar_url !== url) {
    const { error: removeError } = await session.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([oldPath]);
    if (removeError) console.error("Eski profil fotoğrafı silinemedi:", removeError.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

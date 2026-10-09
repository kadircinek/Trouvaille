import "server-only";
import { site } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";

export type SiteSettings = { avatar_url: string | null };

/** Vitrin ayarları (panelden yüklenen profil fotoğrafı). Okunamazsa vitrin yine açılır. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await createPublicClient().from("site_settings").select("avatar_url").maybeSingle();
  if (error) console.error("Vitrin ayarları okunamadı:", error.message);
  return { avatar_url: (data?.avatar_url as string | null | undefined) ?? null };
}

/** Profil fotoğrafı: panelden yüklenen, yoksa ortam değişkenindeki (NEXT_PUBLIC_PROFILE_IMAGE). */
export async function getAvatarUrl(): Promise<string | null> {
  const settings = await getSiteSettings();
  return settings.avatar_url ?? (site.avatar || null);
}

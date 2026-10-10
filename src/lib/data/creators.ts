import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { CREATOR_USERNAME_PATTERN } from "@/lib/usernames";
import { PUBLIC_CREATOR_COLUMNS, type PublicCreator } from "@/lib/types";

/** Aktif vitrin (askıdaki ve olmayan kullanıcı adları için null). */
export const getCreatorByUsername = cache(async (username: string): Promise<PublicCreator | null> => {
  const name = username.toLowerCase();
  if (!CREATOR_USERNAME_PATTERN.test(name)) return null;
  const { data, error } = await createPublicClient()
    .from("creators")
    .select(PUBLIC_CREATOR_COLUMNS)
    .eq("username", name)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`Vitrin okunamadı: ${error.message}`);
  return (data as PublicCreator | null) ?? null;
});

export const getCreatorById = cache(async (id: string): Promise<PublicCreator | null> => {
  const { data, error } = await createPublicClient()
    .from("creators")
    .select(PUBLIC_CREATOR_COLUMNS)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`Vitrin okunamadı: ${error.message}`);
  return (data as PublicCreator | null) ?? null;
});

export type CreatorCard = {
  creator: PublicCreator;
  productCount: number;
  /** En son eklenen birkaç ürünün görseli (ana sayfadaki önizleme). */
  previews: { id: string; image: string; blur: string | null }[];
};

/**
 * Platform ana sayfası: en az bir yayında ürünü olan aktif vitrinler,
 * en son ürün ekleyen en üstte.
 */
export async function listCreatorCards(): Promise<CreatorCard[]> {
  const supabase = createPublicClient();
  const [creators, products] = await Promise.all([
    supabase.from("creators").select(PUBLIC_CREATOR_COLUMNS).eq("status", "active").limit(1000),
    supabase
      .from("products")
      .select("id, creator_id, image_url, fallback_image_url, image_blur, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5000),
  ]);
  if (creators.error) throw new Error(`Vitrinler okunamadı: ${creators.error.message}`);
  if (products.error) throw new Error(`Ürünler okunamadı: ${products.error.message}`);

  const byCreator = new Map<string, CreatorCard>();
  for (const creator of (creators.data ?? []) as PublicCreator[]) {
    byCreator.set(creator.id, { creator, productCount: 0, previews: [] });
  }
  const order: string[] = [];
  for (const p of products.data ?? []) {
    const card = byCreator.get(p.creator_id as string);
    if (!card) continue;
    if (card.productCount === 0) order.push(card.creator.id);
    card.productCount++;
    const image = (p.image_url ?? p.fallback_image_url) as string | null;
    if (image && card.previews.length < 3) {
      card.previews.push({ id: p.id as string, image, blur: p.image_url ? (p.image_blur as string | null) : null });
    }
  }
  return order.map((id) => byCreator.get(id)!);
}

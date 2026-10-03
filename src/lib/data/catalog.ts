import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_PRODUCT_COLUMNS, type FeedPage, type PublicProduct } from "@/lib/types";

export const FEED_PAGE_SIZE = 24;
export const NEW_WINDOW_HOURS = 48;

export type FeedFilter = { category?: string | null; store?: string | null };

/** Vitrin akışı: sabitlenenler üstte, sonra admin sırası (varsayılan: en yeni üstte). */
export async function getFeedPage(
  filter: FeedFilter = {},
  offset = 0,
  limit = FEED_PAGE_SIZE,
): Promise<FeedPage> {
  const supabase = createPublicClient();
  let query = supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS).eq("status", "published");
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.store) query = query.eq("store", filter.store);

  const { data, error } = await query
    .order("is_pinned", { ascending: false })
    .order("sort_key", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit); // bir fazlası: devamı var mı?

  if (error) throw new Error(`Ürünler okunamadı: ${error.message}`);
  const rows = (data ?? []) as PublicProduct[];
  return { items: rows.slice(0, limit), hasMore: rows.length > limit };
}

/** "Hikâyede yeni" şeridi: son 48 saatte yayına alınanlar. */
export async function getNewProducts(limit = 20): Promise<PublicProduct[]> {
  const supabase = createPublicClient();
  const since = new Date(Date.now() - NEW_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Yeni ürünler okunamadı: ${error.message}`);
  return (data ?? []) as PublicProduct[];
}

export const getProductBySlug = cache(async (slug: string): Promise<PublicProduct | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Ürün okunamadı: ${error.message}`);
  return (data as PublicProduct | null) ?? null;
});

/** Ürün sayfasının altındaki "Bunlar da ilgini çekebilir" için aynı kategoriden birkaç ürün. */
export async function getRelatedProducts(product: PublicProduct, limit = 6): Promise<PublicProduct[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "published")
    .neq("id", product.id);
  if (product.category) query = query.eq("category", product.category);
  const { data, error } = await query
    .order("is_pinned", { ascending: false })
    .order("sort_key", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Benzer ürünler okunamadı: ${error.message}`);
  return (data ?? []) as PublicProduct[];
}

export function isNew(product: Pick<PublicProduct, "published_at">, now = Date.now()): boolean {
  if (!product.published_at) return false;
  return now - new Date(product.published_at).getTime() < NEW_WINDOW_HOURS * 3600 * 1000;
}

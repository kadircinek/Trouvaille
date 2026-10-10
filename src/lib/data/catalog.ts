import "server-only";
import { cache } from "react";
import { searchTerms } from "@/lib/search";
import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_PRODUCT_COLUMNS, type FeedPage, type PublicProduct } from "@/lib/types";

export const FEED_PAGE_SIZE = 24;
export const NEW_WINDOW_HOURS = 48;

export type FeedFilter = {
  /** Vitrin sahibi influencer (zorunlu). */
  creatorId: string;
  category?: string | null;
  store?: string | null;
  /** Arama metni: her kelime ürün adında ya da markada geçmeli. */
  q?: string | null;
  /** Yalnızca bu ürünler (cihazdaki favoriler). */
  ids?: string[] | null;
};

/** Vitrin akışı: sabitlenenler üstte, sonra admin sırası (varsayılan: en yeni üstte). */
export async function getFeedPage(filter: FeedFilter, offset = 0, limit = FEED_PAGE_SIZE): Promise<FeedPage> {
  const supabase = createPublicClient();
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "published")
    .eq("creator_id", filter.creatorId);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.store) query = query.eq("store", filter.store);
  for (const term of searchTerms(filter.q)) query = query.ilike("search_text", `%${term}%`);
  if (filter.ids) query = query.in("id", filter.ids);

  const { data, error } = await query
    .order("is_pinned", { ascending: false })
    .order("sort_key", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit); // bir fazlası: devamı var mı?

  if (error) throw new Error(`Ürünler okunamadı: ${error.message}`);
  const rows = (data ?? []) as PublicProduct[];
  return { items: rows.slice(0, limit), hasMore: rows.length > limit };
}

/** Hikâye halkaları: en son yayına alınanlar (son 48 saattekiler "yeni" sayılır). */
export async function getStoryProducts(
  creatorId: string,
  limit = 12,
): Promise<(PublicProduct & { isNew: boolean })[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "published")
    .eq("creator_id", creatorId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`Hikâyeler okunamadı: ${error.message}`);
  const now = Date.now();
  return ((data ?? []) as PublicProduct[]).map((p) => ({ ...p, isNew: isNew(p, now) }));
}

export type VitrinFacets = { total: number; categories: string[]; stores: string[] };

/** Profil sayacı ve filtreler için: yalnızca ürünü olan kategoriler ve mağazalar gösterilir. */
export async function getVitrinFacets(creatorId: string): Promise<VitrinFacets> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("category, store")
    .eq("status", "published")
    .eq("creator_id", creatorId)
    .limit(5000);
  if (error) throw new Error(`Filtreler okunamadı: ${error.message}`);
  const rows = (data ?? []) as { category: string | null; store: string }[];
  return {
    total: rows.length,
    categories: [...new Set(rows.map((r) => r.category).filter((c): c is string => Boolean(c)))],
    stores: [...new Set(rows.map((r) => r.store))],
  };
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

/** Ürün sayfasının altındaki "Bunlar da ilgini çekebilir": aynı vitrinden, aynı kategoriden. */
export async function getRelatedProducts(product: PublicProduct, limit = 6): Promise<PublicProduct[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("status", "published")
    .eq("creator_id", product.creator_id)
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

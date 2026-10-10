import "server-only";
import type { PanelSession } from "@/lib/auth";
import type { Product, ProductStatus } from "@/lib/types";

export type AdminProduct = Product & { clicks_30d: number };

/** Link kontrolünde sorun çıkan durumlar (panelde uyarı gösterilir). */
export const LINK_PROBLEMS = ["kirik", "stokta_yok"] as const;

export async function listProducts(
  session: PanelSession,
  creatorId: string,
  status: ProductStatus,
  { linkProblemsOnly = false }: { linkProblemsOnly?: boolean } = {},
): Promise<AdminProduct[]> {
  let query = session.supabase.from("products").select("*").eq("creator_id", creatorId).eq("status", status);
  if (linkProblemsOnly) query = query.in("link_status", [...LINK_PROBLEMS]);
  const [{ data, error }, clicks] = await Promise.all([
    query
      .order("is_pinned", { ascending: false })
      .order("sort_key", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000),
    session.supabase.rpc("panel_product_clicks", { p_creator: creatorId, p_days: 30 }),
  ]);
  if (error) throw new Error(`Ürünler okunamadı: ${error.message}`);
  const counts = new Map<string, number>(
    ((clicks.data ?? []) as { product_id: string; clicks: number }[]).map((r) => [r.product_id, Number(r.clicks)]),
  );
  return ((data ?? []) as Product[]).map((p) => ({ ...p, clicks_30d: counts.get(p.id) ?? 0 }));
}

export async function countProductsByStatus(
  session: PanelSession,
  creatorId: string,
): Promise<Record<ProductStatus, number>> {
  const statuses: ProductStatus[] = ["published", "draft", "archived"];
  const results = await Promise.all(
    statuses.map((s) =>
      session.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .eq("status", s),
    ),
  );
  return Object.fromEntries(statuses.map((s, i) => [s, results[i].count ?? 0])) as Record<ProductStatus, number>;
}

/** Yayındaki ürünlerden linki kırık ya da stokta olmayanların sayısı. */
export async function countLinkProblems(session: PanelSession, creatorId: string): Promise<number> {
  const { count } = await session.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .in("link_status", [...LINK_PROBLEMS]);
  return count ?? 0;
}

export async function getProduct(session: PanelSession, id: string): Promise<Product | null> {
  const { data, error } = await session.supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Ürün okunamadı: ${error.message}`);
  return (data as Product | null) ?? null;
}

export type Breakdown = { key: string | null; clicks: number }[];

export type Dashboard = {
  summary: { today: number; week: number; month: number; visitors_month: number; bots_month: number };
  period: {
    days: number;
    clicks: number;
    visitors: number;
    old_share: number | null;
    by_source: Breakdown;
    by_store: Breakdown;
    by_category: Breakdown;
    top: { id: string; title: string; slug: string; store: string; status: ProductStatus; image: string | null; clicks: number }[];
  };
  daily: { day: string; clicks: number }[];
};

export async function getDashboard(session: PanelSession, creatorId: string, days: number): Promise<Dashboard> {
  const { data, error } = await session.supabase.rpc("panel_dashboard", { p_creator: creatorId, p_days: days });
  if (error) throw new Error(`Panel verisi okunamadı: ${error.message}`);
  return data as Dashboard;
}

export type PlatformCreator = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  instagram: string | null;
  status: "active" | "suspended";
  created_at: string;
  published: number;
};

/** Platform yöneticisi: tüm vitrinler ve yayındaki ürün sayıları (en yeni kayıt üstte). */
export async function listPlatformCreators(session: PanelSession): Promise<PlatformCreator[]> {
  const [creators, products] = await Promise.all([
    session.supabase
      .from("creators")
      .select("id, username, display_name, avatar_url, instagram, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    session.supabase.from("products").select("creator_id").eq("status", "published").limit(20000),
  ]);
  if (creators.error) throw new Error(`Vitrinler okunamadı: ${creators.error.message}`);
  const counts = new Map<string, number>();
  for (const p of products.data ?? []) counts.set(p.creator_id, (counts.get(p.creator_id) ?? 0) + 1);
  return ((creators.data ?? []) as Omit<PlatformCreator, "published">[]).map((c) => ({
    ...c,
    published: counts.get(c.id) ?? 0,
  }));
}

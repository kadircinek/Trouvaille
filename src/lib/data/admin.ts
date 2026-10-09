import "server-only";
import type { AdminSession } from "@/lib/auth";
import type { Product, ProductStatus } from "@/lib/types";

export type AdminProduct = Product & { clicks_30d: number };

/** Link kontrolünde sorun çıkan durumlar (panelde uyarı gösterilir). */
export const LINK_PROBLEMS = ["kirik", "stokta_yok"] as const;

export async function listProducts(
  admin: AdminSession,
  status: ProductStatus,
  { linkProblemsOnly = false }: { linkProblemsOnly?: boolean } = {},
): Promise<AdminProduct[]> {
  let query = admin.supabase.from("products").select("*").eq("status", status);
  if (linkProblemsOnly) query = query.in("link_status", [...LINK_PROBLEMS]);
  const [{ data, error }, clicks] = await Promise.all([
    query
      .order("is_pinned", { ascending: false })
      .order("sort_key", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000),
    admin.supabase.rpc("admin_product_clicks", { p_days: 30 }),
  ]);
  if (error) throw new Error(`Ürünler okunamadı: ${error.message}`);
  const counts = new Map<string, number>(
    ((clicks.data ?? []) as { product_id: string; clicks: number }[]).map((r) => [r.product_id, Number(r.clicks)]),
  );
  return ((data ?? []) as Product[]).map((p) => ({ ...p, clicks_30d: counts.get(p.id) ?? 0 }));
}

export async function countProductsByStatus(admin: AdminSession): Promise<Record<ProductStatus, number>> {
  const statuses: ProductStatus[] = ["published", "draft", "archived"];
  const results = await Promise.all(
    statuses.map((s) => admin.supabase.from("products").select("id", { count: "exact", head: true }).eq("status", s)),
  );
  return Object.fromEntries(statuses.map((s, i) => [s, results[i].count ?? 0])) as Record<ProductStatus, number>;
}

/** Yayındaki ürünlerden linki kırık ya da stokta olmayanların sayısı. */
export async function countLinkProblems(admin: AdminSession): Promise<number> {
  const { count } = await admin.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .in("link_status", [...LINK_PROBLEMS]);
  return count ?? 0;
}

export async function getProduct(admin: AdminSession, id: string): Promise<Product | null> {
  const { data, error } = await admin.supabase.from("products").select("*").eq("id", id).maybeSingle();
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

export async function getDashboard(admin: AdminSession, days: number): Promise<Dashboard> {
  const { data, error } = await admin.supabase.rpc("admin_dashboard", { p_days: days });
  if (error) throw new Error(`Panel verisi okunamadı: ${error.message}`);
  return data as Dashboard;
}

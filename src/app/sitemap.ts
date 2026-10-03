import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await createPublicClient()
    .from("products")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("sort_key", { ascending: false })
    .limit(5000);

  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...(data ?? []).map((p) => ({
      url: `${site.url}/p/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

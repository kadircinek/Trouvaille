import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkProductLink, type LinkCheck } from "@/lib/link-health";
import { createServiceClient } from "@/lib/supabase/service";
import type { LinkStatus } from "@/lib/types";

type Target = { id: string; affiliate_url: string; check_url: string | null };

export async function saveLinkCheck(client: SupabaseClient, id: string, check: LinkCheck): Promise<void> {
  const { error } = await client
    .from("products")
    .update({
      link_status: check.status,
      link_check_note: check.note,
      link_checked_at: new Date().toISOString(),
      check_url: check.checkUrl,
    })
    .eq("id", id);
  if (error) console.error("Link kontrol sonucu kaydedilemedi:", error.message);
}

export type LinkCheckSummary = { checked: number; counts: Record<LinkStatus, number> };

/**
 * Günlük kontrol: en uzun süredir kontrol edilmeyen yayındaki ürünlerden başlar.
 * Süre sınırına yaklaşınca durur; kalanlar ertesi gün sıraya girer.
 */
export async function runLinkChecks({
  limit = 30,
  concurrency = 4,
  budgetMs = 45_000,
}: { limit?: number; concurrency?: number; budgetMs?: number } = {}): Promise<LinkCheckSummary> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, affiliate_url, check_url")
    .eq("status", "published")
    .order("link_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(`Ürünler okunamadı: ${error.message}`);

  const queue = [...((data ?? []) as Target[])];
  const counts: Record<LinkStatus, number> = { ok: 0, kirik: 0, stokta_yok: 0, bilinmiyor: 0 };
  const started = Date.now();
  let checked = 0;

  async function worker() {
    while (queue.length > 0 && Date.now() - started < budgetMs) {
      const product = queue.shift()!;
      const result = await checkProductLink(product);
      await saveLinkCheck(supabase, product.id, result);
      counts[result.status]++;
      checked++;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { checked, counts };
}

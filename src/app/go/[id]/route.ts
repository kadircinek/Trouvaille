import { after, type NextRequest } from "next/server";
import { buildClickRecord, saveClick } from "@/lib/clicks";
import { redirectLocation } from "@/lib/links";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_STORE = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function backToVitrin(request: NextRequest) {
  return new Response(null, { status: 302, headers: { ...NO_STORE, Location: new URL("/", request.url).toString() } });
}

/**
 * /go/:id — tıklamayı kaydeder ve 302 ile ORİJİNAL affiliate linkine yönlendirir.
 * - Link hiçbir şekilde değiştirilmez (takip parametreleri korunur).
 * - Kayıt yönlendirmeyi bekletmez: yanıt gittikten sonra after() ile yazılır;
 *   kayıt başarısız olsa bile yönlendirme çalışır.
 * - Arşivdeki ürünlerin linkleri de çalışmaya devam eder.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return backToVitrin(request);

  const { data, error } = await createServiceClient()
    .from("products")
    .select("id, affiliate_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Yönlendirme için ürün okunamadı:", error.message);
    return new Response("Şu an yönlendirilemiyor, lütfen biraz sonra tekrar deneyin.", {
      status: 503,
      headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8", "Retry-After": "30" },
    });
  }
  const location = data ? redirectLocation(data.affiliate_url) : null;
  if (!data || !location) return backToVitrin(request);

  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  after(async () => {
    await saveClick(await buildClickRecord(data.id, url, headers));
  });

  return new Response(null, { status: 302, headers: { ...NO_STORE, Location: location } });
}

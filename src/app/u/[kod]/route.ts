import type { NextRequest } from "next/server";
import { SHORT_CODE_PATTERN, shortLinkTarget } from "@/lib/short-links";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function redirect(path: string, request: NextRequest) {
  return new Response(null, { status: 302, headers: { ...HEADERS, Location: new URL(path, request.url).toString() } });
}

/**
 * /u/:kod — hikâyedeki link çıkartması. Ürün sayfasını ?s=hikaye ile açar; oradan
 * mağazaya giden tıklamalar panelde "Hikâye" olarak sayılır. Kod bulunamazsa vitrine döner.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/u/[kod]">) {
  const { kod } = await ctx.params;
  const code = kod.toLowerCase();
  if (!SHORT_CODE_PATTERN.test(code)) return redirect("/", request);

  const { data, error } = await createServiceClient()
    .from("products")
    .select("id, slug, status")
    .eq("short_code", code)
    .maybeSingle();
  if (error) console.error("Kısa link okunamadı:", error.message);

  const target = data ? shortLinkTarget(data) : null;
  return redirect(target ?? "/", request);
}

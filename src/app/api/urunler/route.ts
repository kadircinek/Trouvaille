import type { NextRequest } from "next/server";
import { getFeedPage } from "@/lib/data/catalog";
import { isCategoryId } from "@/lib/categories";
import { isStoreId } from "@/lib/stores";

/** Vitrin akışının sonraki sayfaları ve filtreler (CDN'de 60 sn önbelleklenir). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("kategori");
  const store = params.get("magaza");
  const offset = Math.min(Math.max(Number.parseInt(params.get("offset") ?? "0", 10) || 0, 0), 5000);

  try {
    const page = await getFeedPage(
      { category: isCategoryId(category) ? category : null, store: isStoreId(store) ? store : null },
      offset,
    );
    return Response.json(page, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Ürünler yüklenemedi" }, { status: 503 });
  }
}

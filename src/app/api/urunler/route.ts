import type { NextRequest } from "next/server";
import { FEED_PAGE_SIZE, getFeedPage } from "@/lib/data/catalog";
import { isCategoryId } from "@/lib/categories";
import { isStoreId } from "@/lib/stores";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vitrin akışının sonraki sayfaları, filtreler, arama ve favoriler (CDN'de 60 sn önbelleklenir). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("kategori");
  const store = params.get("magaza");
  const offset = Math.min(Math.max(Number.parseInt(params.get("offset") ?? "0", 10) || 0, 0), 5000);
  const q = params.get("ara")?.slice(0, 60) || null;
  // Favoriler: cihazda tutulan ürün kimlikleri (en fazla 100).
  const ids = params.has("ids")
    ? (params.get("ids") ?? "").split(",").filter((id) => UUID.test(id)).slice(0, 100)
    : null;

  try {
    const page = await getFeedPage(
      { category: isCategoryId(category) ? category : null, store: isStoreId(store) ? store : null, q, ids },
      ids ? 0 : offset,
      ids ? Math.max(ids.length, 1) : FEED_PAGE_SIZE,
    );
    return Response.json(page, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Ürünler yüklenemedi" }, { status: 503 });
  }
}

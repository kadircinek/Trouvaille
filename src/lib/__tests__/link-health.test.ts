import { describe, expect, it } from "vitest";
import {
  availabilityFromProductNode,
  canonicalProductUrl,
  checkProductLink,
  classifyProductHtml,
  looksLikeProductPage,
} from "../link-health";

const AFFILIATE =
  "https://www.trendyol.com/ipekyol/orme-atlet-p-1173622244?boutiqueId=61&merchantId=1138&filterOverPriceListings=false&sav=true";
const CANONICAL = "https://www.trendyol.com/ipekyol/orme-atlet-p-1173622244";

function productPage(availability: string | null) {
  const offers = availability ? { "@type": "Offer", price: "499", availability } : { "@type": "Offer", price: "499" };
  return `<html><head><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Örme atlet",
    offers,
  })}</script></head><body>Ürün</body></html>`;
}

type Route = { status: number; location?: string; html?: string };

/** Sahte ağ: hangi adreslere istek atıldığını kaydeder. */
function fakeFetch(routes: Record<string, Route>) {
  const calls: string[] = [];
  const impl = (async (input: URL | RequestInfo) => {
    const url = String(input);
    calls.push(url);
    const route = routes[url];
    if (!route) throw new Error(`beklenmeyen istek: ${url}`);
    const headers = new Headers();
    if (route.location) headers.set("location", route.location);
    if (route.html !== undefined) headers.set("content-type", "text/html; charset=utf-8");
    return new Response(route.html ?? null, { status: route.status, headers });
  }) as typeof fetch;
  return { impl, calls };
}

describe("canonicalProductUrl / looksLikeProductPage", () => {
  it("takip parametrelerini atar, mağaza dışı adresleri kabul etmez", () => {
    expect(canonicalProductUrl(AFFILIATE)).toBe(CANONICAL);
    expect(canonicalProductUrl("https://ty.gl/v3agb8hg9jplb")).toBeNull();
    expect(canonicalProductUrl("https://example.com/x-p-1")).toBeNull();
  });

  it("ürün sayfası adreslerini tanır", () => {
    expect(looksLikeProductPage(CANONICAL)).toBe(true);
    expect(looksLikeProductPage("https://www.hepsiburada.com/urun-adi-p-HBC0000ABC")).toBe(true);
    expect(looksLikeProductPage("https://www.hepsiburada.com/urun-adi-pm-HBC0000ABC")).toBe(true);
    expect(looksLikeProductPage("https://www.trendyol.com/sr?q=atlet")).toBe(false);
    expect(looksLikeProductPage("https://www.trendyol.com/")).toBe(false);
  });
});

describe("stok bilgisi", () => {
  it("JSON-LD teklifinden okur", () => {
    expect(availabilityFromProductNode({ offers: { availability: "https://schema.org/InStock" } })).toBe("in");
    expect(availabilityFromProductNode({ offers: { availability: "http://schema.org/OutOfStock" } })).toBe("out");
    expect(
      availabilityFromProductNode({
        offers: [{ availability: "https://schema.org/OutOfStock" }, { availability: "https://schema.org/InStock" }],
      }),
    ).toBe("in");
    expect(
      availabilityFromProductNode({
        offers: { "@type": "AggregateOffer", offers: [{ availability: "https://schema.org/SoldOut" }] },
      }),
    ).toBe("out");
    expect(availabilityFromProductNode({ offers: { price: "1" } })).toBeNull();
  });

  it("HTML'i yorumlar", () => {
    expect(classifyProductHtml(productPage("https://schema.org/InStock"), CANONICAL).status).toBe("ok");
    expect(classifyProductHtml(productPage("https://schema.org/OutOfStock"), CANONICAL).status).toBe("stokta_yok");
    expect(classifyProductHtml(productPage(null), CANONICAL).status).toBe("ok");
    expect(classifyProductHtml("<html><body>Please complete the captcha</body></html>", CANONICAL).status).toBe(
      "bilinmiyor",
    );
    expect(classifyProductHtml("<html><body><h1>Bu ürün satışta değil</h1></body></html>", CANONICAL).status).toBe(
      "stokta_yok",
    );
  });
});

describe("checkProductLink", () => {
  it("affiliate linkine değil, parametresiz ürün sayfasına istek atar", async () => {
    const net = fakeFetch({ [CANONICAL]: { status: 200, html: productPage("https://schema.org/InStock") } });
    const result = await checkProductLink({ affiliate_url: AFFILIATE, check_url: null }, { fetchImpl: net.impl });
    expect(result).toEqual({ status: "ok", note: null, checkUrl: CANONICAL });
    expect(net.calls).toEqual([CANONICAL]);
  });

  it("kısa linki bir kez çözer, mağaza sayfasını parametreleriyle açmaz", async () => {
    const net = fakeFetch({
      "https://ty.gl/v3agb8hg9jplb": { status: 301, location: AFFILIATE },
      [CANONICAL]: { status: 200, html: productPage("https://schema.org/OutOfStock") },
    });
    const result = await checkProductLink(
      { affiliate_url: "https://ty.gl/v3agb8hg9jplb", check_url: null },
      { fetchImpl: net.impl },
    );
    expect(result.status).toBe("stokta_yok");
    expect(result.checkUrl).toBe(CANONICAL);
    expect(net.calls).toEqual(["https://ty.gl/v3agb8hg9jplb", CANONICAL]);
  });

  it("daha önce çözülen adres varsa kısa linke hiç gitmez", async () => {
    const net = fakeFetch({ [CANONICAL]: { status: 200, html: productPage("https://schema.org/InStock") } });
    await checkProductLink({ affiliate_url: "https://ty.gl/v3agb8hg9jplb", check_url: CANONICAL }, { fetchImpl: net.impl });
    expect(net.calls).toEqual([CANONICAL]);
  });

  it("404 ve arama sayfasına yönlendirme kırık sayılır", async () => {
    const gone = fakeFetch({ [CANONICAL]: { status: 404 } });
    expect((await checkProductLink({ affiliate_url: AFFILIATE, check_url: null }, { fetchImpl: gone.impl })).status).toBe(
      "kirik",
    );
    const moved = fakeFetch({
      [CANONICAL]: { status: 302, location: "/sr?q=atlet" },
      "https://www.trendyol.com/sr?q=atlet": { status: 200, html: "<html>arama</html>" },
    });
    expect((await checkProductLink({ affiliate_url: AFFILIATE, check_url: null }, { fetchImpl: moved.impl })).status).toBe(
      "kirik",
    );
    const deadShort = fakeFetch({ "https://ty.gl/yok": { status: 404 } });
    expect(
      (await checkProductLink({ affiliate_url: "https://ty.gl/yok", check_url: null }, { fetchImpl: deadShort.impl }))
        .status,
    ).toBe("kirik");
  });

  it("mağaza engellerse ya da ağ hatası olursa 'bilinmiyor' der, alarm vermez", async () => {
    const blocked = fakeFetch({ [CANONICAL]: { status: 403 } });
    expect(
      (await checkProductLink({ affiliate_url: AFFILIATE, check_url: null }, { fetchImpl: blocked.impl })).status,
    ).toBe("bilinmiyor");
    const offline = fakeFetch({});
    const result = await checkProductLink({ affiliate_url: AFFILIATE, check_url: null }, { fetchImpl: offline.impl });
    expect(result.status).toBe("bilinmiyor");
  });
});

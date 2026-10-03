import { describe, expect, it } from "vitest";
import { cleanTitle, guessFromProductUrl, inspectProductLink, parseProductHtml } from "@/lib/product-info";

const TRENDYOL_HTML = `<!doctype html><html><head>
<title>Koton Kadın Saten Midi Elbise Fiyatı, Yorumları - Trendyol</title>
<meta property="og:title" content="Koton Kadın Saten Midi Elbise Fiyatı, Yorumları - Trendyol">
<meta property="og:image" content="https://cdn.dsmcdn.com/ty1/prod/abc.jpg">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Kadın Saten Midi Elbise","brand":{"@type":"Brand","name":"Koton"},"image":["https://cdn.dsmcdn.com/ty1/prod/main.jpg","https://cdn.dsmcdn.com/ty1/prod/2.jpg"]}</script>
</head><body></body></html>`;

const HB_HTML = `<html><head>
<meta content="Mango Deri G&#246;r&#252;n&#252;ml&#252; &amp; Şık Çanta Fiyatı - Taksit Seçenekleri" property="og:title"/>
<meta content="//productimages.hepsiburada.net/s/1/abc.jpg" property="og:image"/>
<script type="application/ld+json">{"@graph":[{"@type":"BreadcrumbList"},{"@type":["Product"],"name":"Mango Deri Görünümlü Çanta","brand":"Mango","image":{"@type":"ImageObject","url":"https://productimages.hepsiburada.net/s/1/main.jpg"}}]}</script>
</head></html>`;

describe("ürün sayfası ayrıştırma", () => {
  it("Trendyol: JSON-LD öncelikli", () => {
    expect(parseProductHtml(TRENDYOL_HTML, "https://www.trendyol.com/x")).toEqual({
      title: "Kadın Saten Midi Elbise",
      brand: "Koton",
      imageUrl: "https://cdn.dsmcdn.com/ty1/prod/main.jpg",
    });
  });

  it("Hepsiburada: @graph ve ImageObject", () => {
    const info = parseProductHtml(HB_HTML, "https://www.hepsiburada.com/x");
    expect(info.title).toBe("Mango Deri Görünümlü Çanta");
    expect(info.brand).toBe("Mango");
    expect(info.imageUrl).toBe("https://productimages.hepsiburada.net/s/1/main.jpg");
  });

  it("JSON-LD yoksa Open Graph'a düşer, başlığı temizler, // adresini tamamlar", () => {
    const html = HB_HTML.replace(/<script[\s\S]*<\/script>/, "");
    const info = parseProductHtml(html, "https://www.hepsiburada.com/x");
    expect(info.title).toBe("Mango Deri Görünümlü & Şık Çanta");
    expect(info.imageUrl).toBe("https://productimages.hepsiburada.net/s/1/abc.jpg");
  });

  it("başlık temizleme", () => {
    expect(cleanTitle("Bej Loafer Fiyatı, Yorumları - Trendyol")).toBe("Bej Loafer");
    expect(cleanTitle("Krem | Hepsiburada")).toBe("Krem");
    expect(cleanTitle("  ")).toBeNull();
  });

  it("adresten tahmin", () => {
    expect(guessFromProductUrl("https://www.trendyol.com/zara/saten-midi-elbise-p-12345?boutiqueId=1")).toEqual({
      title: "Saten midi elbise",
      brand: "zara",
      imageUrl: null,
    });
    expect(guessFromProductUrl("https://ty.gl/abc").title).toBeNull();
  });
});

describe("link inceleme (ağ taklidi)", () => {
  it("kısa linki takip eder, mağazayı ve bilgileri bulur", async () => {
    const calls: string[] = [];
    const fakeFetch = (async (input: URL | string) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("https://kisa.link/")) {
        return new Response(null, { status: 301, headers: { location: "https://www.trendyol.com/koton/elbise-p-1?aff=1" } });
      }
      return new Response(TRENDYOL_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    }) as typeof fetch;

    const info = await inspectProductLink("https://kisa.link/abc", { fetchImpl: fakeFetch });
    expect(info.store).toBe("trendyol");
    expect(info.fetched).toBe(true);
    expect(info.title).toBe("Kadın Saten Midi Elbise");
    expect(calls).toEqual(["https://kisa.link/abc", "https://www.trendyol.com/koton/elbise-p-1?aff=1"]);
  });

  it("sayfa engellenirse yine de mağazayı ve adres tahminini döner", async () => {
    const blocked = (async () => new Response("Forbidden", { status: 403 })) as typeof fetch;
    const info = await inspectProductLink("https://www.trendyol.com/zara/saten-elbise-p-9", { fetchImpl: blocked });
    expect(info).toMatchObject({ store: "trendyol", fetched: false, title: "Saten elbise", brand: "zara" });
  });

  it("yerel ağ adreslerine istek atmaz", async () => {
    let called = false;
    const spy = (async () => {
      called = true;
      return new Response("");
    }) as typeof fetch;
    await inspectProductLink("http://127.0.0.1:54321/x", { fetchImpl: spy });
    await inspectProductLink("http://169.254.169.254/latest", { fetchImpl: spy });
    expect(called).toBe(false);
  });
});

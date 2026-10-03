import { describe, expect, it } from "vitest";
import { parseAffiliateUrl, redirectLocation } from "@/lib/links";

describe("affiliate linkleri hiç değiştirilmez", () => {
  const urls = [
    "https://ty.gl/abcXYZ",
    "https://www.trendyol.com/koton/elbise-p-123?boutiqueId=61&merchantId=968&utm_source=aff&utm_campaign=x%20y",
    "https://www.hepsiburada.com/urun-p-HBC0001?wt_af=abc&magaza=x#yorumlar",
    "https://ty.gl/abc?a=1&a=2&empty=&flag",
    "https://ty.gl/A/B/../c?Upper=Case",
  ];

  it.each(urls)("302 Location birebir aynı: %s", (url) => {
    expect(redirectLocation(url)).toBe(url);
  });

  it("yalnızca baş/son boşluklar atılır", () => {
    expect(parseAffiliateUrl("  https://ty.gl/abc?x=1 \n")).toBe("https://ty.gl/abc?x=1");
  });

  it("ASCII dışı karakterler yalnızca yüzde-kodlanır, gerisi aynı kalır", () => {
    expect(redirectLocation("https://www.trendyol.com/çanta-p-1?q=şık&utm=aff")).toBe(
      "https://www.trendyol.com/%C3%A7anta-p-1?q=%C5%9F%C4%B1k&utm=aff",
    );
  });

  it("geçersiz ya da tehlikeli adresleri reddeder", () => {
    expect(parseAffiliateUrl("javascript:alert(1)")).toBeNull();
    expect(parseAffiliateUrl("ftp://ty.gl/x")).toBeNull();
    expect(parseAffiliateUrl("merhaba")).toBeNull();
    expect(parseAffiliateUrl("https://localhost/x")).toBeNull();
    expect(redirectLocation("data:text/html,hi")).toBeNull();
  });
});

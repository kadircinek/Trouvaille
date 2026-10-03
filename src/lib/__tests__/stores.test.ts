import { describe, expect, it } from "vitest";
import { detectStoreFromUrl, storeName } from "@/lib/stores";

describe("mağaza tanıma", () => {
  it.each([
    ["https://www.trendyol.com/x-p-1", "trendyol"],
    ["https://m.trendyol.com/x-p-1", "trendyol"],
    ["https://ty.gl/abc", "trendyol"],
    ["https://www.hepsiburada.com/x-p-HB1", "hepsiburada"],
    ["https://hepsiburada.com/x", "hepsiburada"],
  ])("%s → %s", (url, store) => {
    expect(detectStoreFromUrl(url)).toBe(store);
  });

  it("benzer görünen alan adlarını tanımaz", () => {
    expect(detectStoreFromUrl("https://trendyol.com.evil.example/x")).toBeNull();
    expect(detectStoreFromUrl("https://nottrendyol.com/x")).toBeNull();
    expect(detectStoreFromUrl("https://bit.ly/abc")).toBeNull();
    expect(detectStoreFromUrl("bozuk")).toBeNull();
  });

  it("mağaza adları", () => {
    expect(storeName("trendyol")).toBe("Trendyol");
    expect(storeName("hepsiburada")).toBe("Hepsiburada");
    expect(storeName("amazon")).toBe("Amazon");
  });
});

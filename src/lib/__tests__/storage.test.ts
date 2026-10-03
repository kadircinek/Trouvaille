import { describe, expect, it } from "vitest";
import { storagePathFromUrl } from "@/lib/storage";

describe("storage yolu", () => {
  const base = "https://abc.supabase.co";
  it("kendi bucket'ımızdaki dosyanın yolunu çıkarır", () => {
    expect(storagePathFromUrl(`${base}/storage/v1/object/public/product-images/2026/10/x.jpg`, base)).toBe("2026/10/x.jpg");
  });
  it("başka adresleri ve hileli yolları reddeder", () => {
    expect(storagePathFromUrl("https://cdn.dsmcdn.com/a.jpg", base)).toBeNull();
    expect(storagePathFromUrl(`${base}/storage/v1/object/public/product-images/../secret`, base)).toBeNull();
    expect(storagePathFromUrl(null, base)).toBeNull();
  });
});

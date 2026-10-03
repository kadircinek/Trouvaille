import { describe, expect, it } from "vitest";
import { productSlug, slugify } from "@/lib/slug";

describe("slug", () => {
  it("Türkçe karakterleri sadeleştirir", () => {
    expect(slugify("Şık İnce Örgü Çanta & Ayakkabı Güzelliği")).toBe("sik-ince-orgu-canta-ve-ayakkabi-guzelligi");
    expect(slugify("IŞIL ığdır")).toBe("isil-igdir");
  });

  it("uzun başlığı kelime sınırında keser", () => {
    const s = slugify("çok ".repeat(40));
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });

  it("veritabanı kuralına uyan benzersiz slug üretir", () => {
    const a = productSlug("Saten Midi Elbise");
    const b = productSlug("Saten Midi Elbise");
    expect(a).toMatch(/^saten-midi-elbise-[a-z0-9]{4}$/);
    expect(a).not.toBe(b);
    expect(productSlug("!!!")).toMatch(/^urun-[a-z0-9]{4}$/);
    expect(a).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

import { describe, expect, it } from "vitest";
import { foldForSearch, searchTerms } from "../search";

describe("arama", () => {
  it("Türkçe karakterleri veritabanıyla aynı şekilde sadeleştirir", () => {
    expect(foldForSearch("İpekyol IŞIK Çanta ÖRME ğüş")).toBe("ipekyol isik canta orme gus");
  });

  it("kelimelere ayırır, özel karakterleri atar", () => {
    expect(searchTerms("  Örme   atlet!  ")).toEqual(["orme", "atlet"]);
    expect(searchTerms("%_*,()")).toEqual([]);
    expect(searchTerms(null)).toEqual([]);
    expect(searchTerms("a b c d e f g")).toHaveLength(5);
  });
});

import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameProblem } from "../usernames";

describe("vitrin kullanıcı adı", () => {
  it("Instagram adını sadeleştirir", () => {
    expect(normalizeUsername("  @ShopBySac ")).toBe("shopbysac");
    expect(normalizeUsername("Işıl.Çiçek")).toBe("isil.cicek");
  });

  it("geçerli adları kabul eder", () => {
    expect(usernameProblem("shopbysac")).toBeNull();
    expect(usernameProblem("ornek.influencer")).toBeNull();
    expect(usernameProblem("a_b")).toBeNull();
  });

  it("hatalı ve ayrılmış adları reddeder", () => {
    expect(usernameProblem("ab")).toMatch(/en az 3/);
    expect(usernameProblem(".nokta")).toMatch(/nokta/);
    expect(usernameProblem("nokta.")).toMatch(/nokta/);
    expect(usernameProblem("boşluk var")).not.toBeNull();
    expect(usernameProblem("admin")).toMatch(/kullanılamıyor/);
    expect(usernameProblem("gizlilik")).toMatch(/kullanılamıyor/);
    expect(usernameProblem("robots.txt")).toMatch(/kullanılamıyor/);
  });
});

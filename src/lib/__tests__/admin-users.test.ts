import { describe, expect, it } from "vitest";
import { parseLoginIdentifier, passwordProblem } from "@/lib/admin-users";

describe("giriş kimliği", () => {
  it("kullanıcı adını küçük harfe çevirir, baştaki @'i atar", () => {
    expect(parseLoginIdentifier("  @ShopBySac ")).toEqual({ kind: "username", username: "shopbysac" });
    expect(parseLoginIdentifier("İPEK.su_1")).toEqual({ kind: "username", username: "ipek.su_1" });
  });

  it("e-postayı tanır", () => {
    expect(parseLoginIdentifier("Abla@Ornek.com")).toEqual({ kind: "email", email: "abla@ornek.com" });
  });

  it("geçersizleri reddeder", () => {
    expect(parseLoginIdentifier("")).toBeNull();
    expect(parseLoginIdentifier("ab")).toBeNull();
    expect(parseLoginIdentifier("boşluk var")).toBeNull();
    expect(parseLoginIdentifier("a@b")).toBeNull();
    expect(parseLoginIdentifier("x".repeat(33))).toBeNull();
  });
});

describe("şifre kuralları", () => {
  it("uzunluk ve tekrar", () => {
    expect(passwordProblem("kisa", "kisa")).toMatch(/en az/);
    expect(passwordProblem("uzunsifre1", "uzunsifre2")).toMatch(/tutmuyor/);
    expect(passwordProblem("uzunsifre1", "uzunsifre1")).toBeNull();
  });
});

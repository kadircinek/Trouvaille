import { describe, expect, it } from "vitest";
import { loginEmail } from "../login-email";

describe("loginEmail", () => {
  it("kodu ve linki içerir, HTML'e kaçışlı yazar", () => {
    const mail = loginEmail({
      siteName: "Shop<by>sac",
      code: "123456",
      link: "https://site.com/auth/confirm?type=magiclink&token_hash=abc&next=%2Fadmin",
    });
    expect(mail.subject).toContain("123456");
    expect(mail.text).toContain("https://site.com/auth/confirm?type=magiclink&token_hash=abc&next=%2Fadmin");
    expect(mail.html).toContain("Shop&lt;by&gt;sac");
    expect(mail.html).toContain('href="https://site.com/auth/confirm?type=magiclink&amp;token_hash=abc&amp;next=%2Fadmin"');
    expect(mail.html).not.toContain("<by>");
  });
});

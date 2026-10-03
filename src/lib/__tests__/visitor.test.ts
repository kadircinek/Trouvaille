import { describe, expect, it } from "vitest";
import {
  clientIp,
  detectDevice,
  detectInAppBrowser,
  hashVisitor,
  isBotUserAgent,
  isPrefetchRequest,
  normalizeSource,
  sanitizeReferrer,
} from "@/lib/visitor";

const INSTAGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.13.110 (iPhone14,5; iOS 17_0; tr_TR; tr; scale=3.00; 1170x2532; 515338296)";
const INSTAGRAM_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S911B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 Instagram 312.0.0.32.112 Android (34/14; 450dpi; 1080x2340; samsung; SM-S911B; dm1q; qcom; tr_TR; 548323757)";
const FACEBOOK_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/440.0;FBBV/1;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBSS/3;FBID/phone;FBLC/tr_TR;FBOP/5]";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

describe("bot ayrımı", () => {
  it("gerçek kullanıcıları (Instagram/Facebook tarayıcısı dahil) bot saymaz", () => {
    for (const ua of [INSTAGRAM_IOS, INSTAGRAM_ANDROID, FACEBOOK_IOS, SAFARI_MAC]) {
      expect(isBotUserAgent(ua)).toBe(false);
    }
  });

  it("önizleme tarayıcılarını ve otomasyonu bot sayar", () => {
    for (const ua of [
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "meta-externalagent/1.1",
      "WhatsApp/2.23.20.0 A",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "TelegramBot (like TwitterBot)",
      "Twitterbot/1.0",
      "Slackbot-LinkExpanding 1.0",
      "curl/8.4.0",
      "python-requests/2.31",
      "Mozilla/5.0 HeadlessChrome/120.0",
      "",
      null,
    ]) {
      expect(isBotUserAgent(ua)).toBe(true);
    }
  });

  it("tarayıcı ön yüklemesini (prefetch) ayırır", () => {
    expect(isPrefetchRequest(new Headers({ "sec-purpose": "prefetch;prerender" }))).toBe(true);
    expect(isPrefetchRequest(new Headers({ purpose: "prefetch" }))).toBe(true);
    expect(isPrefetchRequest(new Headers())).toBe(false);
  });
});

describe("cihaz ve uygulama", () => {
  it("cihaz türü", () => {
    expect(detectDevice(INSTAGRAM_IOS)).toBe("ios");
    expect(detectDevice(INSTAGRAM_ANDROID)).toBe("android");
    expect(detectDevice(SAFARI_MAC)).toBe("desktop");
    expect(detectDevice("garip")).toBe("other");
  });

  it("uygulama içi tarayıcı", () => {
    expect(detectInAppBrowser(INSTAGRAM_IOS)).toBe("instagram");
    expect(detectInAppBrowser(FACEBOOK_IOS)).toBe("facebook");
    expect(detectInAppBrowser(SAFARI_MAC)).toBeNull();
  });
});

describe("kaynak ve yönlendiren", () => {
  it("?s= parametresi", () => {
    expect(normalizeSource("story")).toBe("hikaye");
    expect(normalizeSource("STORY")).toBe("hikaye");
    expect(normalizeSource("paylasim")).toBe("paylasim");
    expect(normalizeSource("share")).toBe("paylasim");
    expect(normalizeSource(null)).toBe("vitrin");
    expect(normalizeSource("<script>")).toBe("vitrin");
  });

  it("referrer'dan sorgu parametrelerini atar", () => {
    expect(sanitizeReferrer("https://l.instagram.com/?u=https%3A%2F%2Fx&e=secret")).toBe("https://l.instagram.com/");
    expect(sanitizeReferrer("android-app://com.instagram.android")).toBeNull();
    expect(sanitizeReferrer("bozuk")).toBeNull();
  });
});

describe("IP saklanmaz", () => {
  it("ilk x-forwarded-for adresini alır", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "85.1.2.3, 10.0.0.1" }))).toBe("85.1.2.3");
    expect(clientIp(new Headers({ "x-real-ip": "85.1.2.4" }))).toBe("85.1.2.4");
    expect(clientIp(new Headers())).toBeNull();
  });

  it("tuzlu özet kararlıdır, IP içermez, tuza bağlıdır", async () => {
    const a = await hashVisitor("85.1.2.3", "ua", "tuz-1");
    const b = await hashVisitor("85.1.2.3", "ua", "tuz-1");
    const c = await hashVisitor("85.1.2.3", "ua", "tuz-2");
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain("85.1.2.3");
    expect(await hashVisitor("85.1.2.3", "ua", "")).toBeNull();
    expect(await hashVisitor(null, "ua", "tuz")).toBeNull();
  });
});

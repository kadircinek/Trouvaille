import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
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

export type ClickRecord = {
  product_id: string;
  source: ReturnType<typeof normalizeSource>;
  referrer: string | null;
  device: ReturnType<typeof detectDevice>;
  app: string | null;
  country: string | null;
  ip_hash: string | null;
  is_bot: boolean;
};

/** İstekten kişisel veri saklamadan tıklama kaydı hazırlar (IP yalnızca tuzlu özet olarak). */
export async function buildClickRecord(productId: string, url: URL, headers: Headers): Promise<ClickRecord> {
  const userAgent = headers.get("user-agent");
  const country = headers.get("x-vercel-ip-country");
  return {
    product_id: productId,
    source: normalizeSource(url.searchParams.get("s")),
    referrer: sanitizeReferrer(headers.get("referer")),
    device: detectDevice(userAgent),
    app: detectInAppBrowser(userAgent),
    country: country && /^[A-Z]{2}$/i.test(country) ? country.toUpperCase() : null,
    ip_hash: await hashVisitor(clientIp(headers), userAgent, process.env.IP_HASH_SALT ?? ""),
    is_bot: isBotUserAgent(userAgent) || isPrefetchRequest(headers),
  };
}

export async function saveClick(record: ClickRecord): Promise<void> {
  try {
    const { error } = await createServiceClient().from("clicks").insert(record);
    if (error) console.error("Tıklama kaydedilemedi:", error.message);
  } catch (error) {
    console.error("Tıklama kaydedilemedi:", error);
  }
}

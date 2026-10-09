import { runLinkChecks } from "@/lib/data/link-checks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Günlük link sağlık kontrolü (vercel.json → crons). Vercel isteği
 * "Authorization: Bearer $CRON_SECRET" başlığıyla gönderir; başkası tetikleyemez.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET tanımlı değil" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const summary = await runLinkChecks();
    console.log("[link-kontrol]", JSON.stringify(summary));
    return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[link-kontrol]", error);
    return Response.json({ error: "Kontrol yapılamadı" }, { status: 500 });
  }
}

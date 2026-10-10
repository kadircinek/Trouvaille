"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPanelSession } from "@/lib/auth";

export type StatusResult = { ok: true } | { ok: false; error: string };

/** Platform yöneticisi bir vitrini askıya alır ya da yeniden açar. */
export async function setCreatorStatus(id: string, status: "active" | "suspended"): Promise<StatusResult> {
  const session = await getPanelSession();
  if (!session?.isAdmin) return { ok: false, error: "Bu işlem için yetkin yok." };
  if (!z.uuid().safeParse(id).success || !["active", "suspended"].includes(status)) {
    return { ok: false, error: "Geçersiz istek." };
  }
  if (status === "suspended" && session.creator?.id === id) {
    return { ok: false, error: "Kendi vitrinini askıya alamazsın." };
  }
  const { error } = await session.supabase.rpc("platform_set_creator_status", { p_creator: id, p_status: status });
  if (error) {
    console.error("Vitrin durumu değiştirilemedi:", error.message);
    return { ok: false, error: "Değiştirilemedi, tekrar dene." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

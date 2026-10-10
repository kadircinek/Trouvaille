import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Oturumdaki influencer'ın kendi vitrini (askıdakiler panele giremez). */
export type PanelCreator = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  instagram: string | null;
  avatar_url: string | null;
  status: "active" | "suspended";
};

export type PanelSession = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  email: string;
  userId: string;
  /** Kendi vitrini (yalnızca platform yöneticisi olan hesapta null). */
  creator: PanelCreator | null;
  /** Platform yöneticisi: tüm vitrinleri görür, askıya alabilir. */
  isAdmin: boolean;
};

export type CreatorSession = PanelSession & { creator: PanelCreator };

type Loaded = { session: PanelSession } | { problem: "giris" | "yetki" | "askida" };

const load = cache(async (): Promise<Loaded> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!email || !userId) return { problem: "giris" };

  const [creatorResult, adminResult] = await Promise.all([
    supabase
      .from("creators")
      .select("id, username, display_name, bio, instagram, avatar_url, status")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.rpc("is_admin"),
  ]);
  const creator = (creatorResult.data as PanelCreator | null) ?? null;
  const isAdmin = adminResult.data === true;

  if (creator?.status === "suspended" && !isAdmin) return { problem: "askida" };
  if (!creator && !isAdmin) return { problem: "yetki" };
  return {
    session: { supabase, email, userId, creator: creator?.status === "active" ? creator : null, isAdmin },
  };
});

/** Panel sayfaları: oturum yoksa ya da hesabın vitrini yoksa giriş sayfasına yollar. */
export async function requirePanel(): Promise<PanelSession> {
  const result = await load();
  if ("problem" in result) redirect(result.problem === "giris" ? "/admin/giris" : `/admin/giris?hata=${result.problem}`);
  return result.session;
}

/** Ürün sayfaları: kendi vitrini olmalı (yalnızca platform yöneticisiyse platform sayfasına). */
export async function requireCreator(): Promise<CreatorSession> {
  const session = await requirePanel();
  if (!session.creator) redirect("/admin/platform");
  return session as CreatorSession;
}

/** Server action'lar için: yönlendirmek yerine null döner. */
export async function getPanelSession(): Promise<PanelSession | null> {
  const result = await load();
  return "session" in result ? result.session : null;
}

export async function getCreatorSession(): Promise<CreatorSession | null> {
  const session = await getPanelSession();
  return session?.creator ? (session as CreatorSession) : null;
}

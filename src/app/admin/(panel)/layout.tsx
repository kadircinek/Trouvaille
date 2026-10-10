import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ExternalIcon, LogoutIcon, UserIcon } from "@/components/icons";
import { site } from "@/config/site";
import { requirePanel } from "@/lib/auth";
import { signOut } from "../giris/actions";

export const metadata: Metadata = {
  title: { default: "Panel", template: `%s · Panel · ${site.name}` },
  robots: { index: false, follow: false },
  manifest: "/yonetim.webmanifest",
  appleWebApp: { capable: true, title: `${site.name} Panel`, statusBarStyle: "default" },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { creator, isAdmin } = await requirePanel();
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-4">
          <Link href={creator ? "/admin" : "/admin/platform"} className="min-w-0 truncate font-serif text-[19px] text-ink">
            {creator?.display_name ?? site.name} <span className="font-sans text-[12px] text-muted">panel</span>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            {isAdmin ? (
              <Link href="/admin/platform" className="inline-flex h-9 items-center rounded-full px-2.5 text-[13px] text-ink-soft">
                Platform
              </Link>
            ) : null}
            {creator ? (
              <Link
                href={`/${creator.username}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] text-ink-soft"
              >
                Vitrinim <ExternalIcon size={14} />
              </Link>
            ) : null}
            <Link href="/admin/hesap" aria-label="Hesabım" className="grid size-9 place-items-center rounded-full text-ink-soft">
              <UserIcon size={18} />
            </Link>
            <form action={signOut}>
              <button type="submit" aria-label="Çıkış yap" className="grid size-9 place-items-center rounded-full text-ink-soft">
                <LogoutIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pt-4 pb-28">{children}</main>
      <AdminNav hasVitrin={Boolean(creator)} />
    </div>
  );
}

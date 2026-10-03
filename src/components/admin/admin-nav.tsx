"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, GridIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/** Admin alt menüsü (başparmak erişimi). Form sayfalarında kendi kaydet çubuğu olduğu için gizlenir. */
export function AdminNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/yeni") || pathname.startsWith("/admin/urun/")) return null;

  const item = (href: string, active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
      active ? "text-ink" : "text-muted",
    );

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-end px-6">
        <Link href="/admin" className={item("/admin", pathname === "/admin")}>
          <GridIcon size={22} />
          Ürünler
        </Link>
        <Link
          href="/admin/yeni"
          className="-mt-5 mx-4 grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-lg shadow-accent/30"
          aria-label="Yeni ürün ekle"
        >
          <PlusIcon size={26} />
        </Link>
        <Link href="/admin/tiklamalar" className={item("/admin/tiklamalar", pathname.startsWith("/admin/tiklamalar"))}>
          <ChartIcon size={22} />
          Tıklamalar
        </Link>
      </div>
    </nav>
  );
}

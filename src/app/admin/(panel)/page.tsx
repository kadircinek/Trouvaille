import type { Metadata } from "next";
import Link from "next/link";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { CheckIcon, PinIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { countProductsByStatus, listProducts } from "@/lib/data/admin";
import { storeName } from "@/lib/stores";
import { primaryImage, type ProductStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Ürünler" };

const TABS: { status: ProductStatus; label: string }[] = [
  { status: "published", label: "Yayında" },
  { status: "draft", label: "Taslak" },
  { status: "archived", label: "Arşiv" },
];

const NOTICES: Record<string, string> = {
  yayinda: "Yayına alındı, vitrinde görünüyor.",
  taslak: "Taslak olarak kaydedildi.",
  guncellendi: "Değişiklikler kaydedildi.",
  silindi: "Ürün silindi.",
};

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const status = TABS.find((t) => t.status === params.durum)?.status ?? "published";
  const notice = typeof params.bildirim === "string" ? NOTICES[params.bildirim] : undefined;
  const noticeSlug = typeof params.urun === "string" ? params.urun : undefined;

  const admin = await requireAdmin();
  const [products, counts] = await Promise.all([listProducts(admin, status), countProductsByStatus(admin)]);

  return (
    <div>
      {notice ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-success/10 px-4 py-3 text-[13.5px] text-success">
          <span className="flex items-center gap-2">
            <CheckIcon size={16} /> {notice}
          </span>
          {noticeSlug && params.bildirim !== "taslak" ? (
            <Link href={`/p/${noticeSlug}`} target="_blank" className="shrink-0 font-semibold underline underline-offset-4">
              Vitrinde gör
            </Link>
          ) : null}
        </div>
      ) : null}

      <nav className="mb-4 grid grid-cols-3 rounded-xl bg-paper-2 p-1 text-[13px]">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin?durum=${tab.status}`}
            className={cn(
              "rounded-lg py-2 text-center font-medium transition-colors",
              tab.status === status ? "bg-white text-ink shadow-sm" : "text-ink-soft",
            )}
          >
            {tab.label} <span className="text-muted">{counts[tab.status]}</span>
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-serif text-xl">Burada henüz ürün yok</p>
          {status === "published" ? (
            <Link
              href="/admin/yeni"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[14px] font-semibold text-accent-ink"
            >
              İlk ürünü ekle
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {products.map((p, i) => {
            const image = primaryImage(p);
            const category = getCategory(p.category);
            return (
              <li key={p.id} className="flex gap-3 py-3.5">
                <Link href={`/admin/urun/${p.id}`} className="relative block h-[96px] w-[54px] shrink-0 overflow-hidden rounded-lg bg-paper-2">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- küçük önizleme, optimizasyon gerekmez
                    <img src={image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  ) : null}
                  {p.is_pinned ? (
                    <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-paper/90 text-ink">
                      <PinIcon size={11} />
                    </span>
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/urun/${p.id}`} className="line-clamp-2 text-[14px] leading-snug font-medium text-ink">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-ink-soft">
                    {storeName(p.store)}
                    {category ? ` · ${category.name}` : ""} ·{" "}
                    <span className="font-semibold text-ink">{p.clicks_30d}</span> tıklama (30 gün)
                  </p>
                  <ProductRowActions
                    id={p.id}
                    status={p.status}
                    pinned={p.is_pinned}
                    isFirst={i === 0 || products[i - 1].is_pinned !== p.is_pinned}
                    isLast={i === products.length - 1 || products[i + 1].is_pinned !== p.is_pinned}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

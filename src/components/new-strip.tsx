import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { primaryImage, type PublicProduct } from "@/lib/types";
import { AdLabel } from "@/components/ad-label";

/** "Hikâyede yeni": son 48 saatte eklenenler, yatay kaydırmalı şerit. */
export function NewStrip({ products }: { products: PublicProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="hikayede-yeni" className="pt-2 pb-5">
      <div className="flex items-baseline justify-between px-4">
        <h2 id="hikayede-yeni" className="font-serif text-xl text-ink">
          Hikâyede yeni
        </h2>
        <span className="text-[11px] text-muted">son 48 saat</span>
      </div>
      <ul className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {products.map((p, i) => {
          const image = primaryImage(p);
          return (
            <li key={p.id} className="w-[34%] max-w-40 shrink-0 snap-start">
              <Link href={`/p/${p.slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-paper-2 ring-1 ring-accent/30 ring-offset-2 ring-offset-paper">
                  {image ? (
                    <ProductImage
                      src={image}
                      alt={p.title}
                      sizes="160px"
                      priority={i < 3}
                      blurDataURL={p.image_url ? p.image_blur : null}
                    />
                  ) : null}
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-accent-ink">
                    Yeni
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-1 text-[12px] text-ink">{p.title}</p>
                <AdLabel store={p.store} isGift={p.is_gift} giftBrand={p.gift_brand} className="mt-1" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

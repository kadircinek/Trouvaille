import Link from "next/link";
import { AdLabel } from "@/components/ad-label";
import { PinIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { primaryImage, type PublicProduct } from "@/lib/types";

// 390 px ekranda iki sütun ≈ 180 px; masaüstünde en fazla dört sütun.
export const GRID_IMAGE_SIZES = "(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw";

export function ProductCard({ product, priority = false }: { product: PublicProduct; priority?: boolean }) {
  const image = primaryImage(product);
  return (
    <Link href={`/p/${product.slug}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-paper-2 ring-accent/60 group-focus-visible:ring-2">
        {image ? (
          <ProductImage
            src={image}
            alt={product.title}
            sizes={GRID_IMAGE_SIZES}
            priority={priority}
            blurDataURL={product.image_url ? product.image_blur : null}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : null}
        {product.is_pinned ? (
          <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-paper/90 text-ink shadow-sm">
            <PinIcon size={14} />
            <span className="sr-only">Öne çıkan</span>
          </span>
        ) : null}
      </div>
      <div className="px-0.5 pt-2 pb-1">
        {product.brand ? (
          <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">{product.brand}</p>
        ) : null}
        <p className="line-clamp-2 text-[13px] leading-snug text-ink">{product.title}</p>
        <AdLabel store={product.store} isGift={product.is_gift} giftBrand={product.gift_brand} className="mt-1.5" />
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: PublicProduct[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

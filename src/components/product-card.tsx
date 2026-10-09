import { AdLabel } from "@/components/ad-label";
import { FavoriteButton } from "@/components/favorite-button";
import { PinIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { storeName } from "@/lib/stores";
import { primaryImage, type PublicProduct } from "@/lib/types";

// Instagram profili gibi 3 sütun: 390 px ekranda ≈ 130 px.
export const GRID_IMAGE_SIZES = "(min-width: 896px) 300px, 34vw";

/**
 * Vitrin kartı: Instagram profil ızgarası gibi yalnızca görsel. Hikâye oranında
 * (9:16), yazılar ve ürün kesiti kırpılmaz. Fotoğrafa dokunmak doğrudan mağazayı
 * açar (/go/:id → tıklama kaydı + 302). Sağ alttaki kalp favorilere ekler.
 * Reklam etiketi her kartın altında.
 */
export function ProductCard({ product, priority = false }: { product: PublicProduct; priority?: boolean }) {
  const image = primaryImage(product);
  return (
    <div className="group">
      <div className="relative">
        <a
          href={`/go/${product.id}`}
          rel="sponsored nofollow"
          aria-label={`${product.title} — ${storeName(product.store)}’da aç`}
          className="relative block aspect-[9/16] overflow-hidden bg-paper-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        >
          {image ? (
            <ProductImage
              src={image}
              alt={product.title}
              sizes={GRID_IMAGE_SIZES}
              priority={priority}
              blurDataURL={product.image_url ? product.image_blur : null}
              className="transition duration-300 group-hover:brightness-95"
            />
          ) : null}
          {product.is_pinned ? (
            <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
              <PinIcon size={12} />
              <span className="sr-only">Öne çıkan</span>
            </span>
          ) : null}
        </a>
        <FavoriteButton productId={product.id} title={product.title} className="absolute right-1.5 bottom-1.5" />
      </div>
      <AdLabel
        store={product.store}
        isGift={product.is_gift}
        giftBrand={product.gift_brand}
        size="xs"
        className="px-1.5 pt-1.5"
      />
    </div>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: PublicProduct[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-3 gap-x-0.5 gap-y-3">
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

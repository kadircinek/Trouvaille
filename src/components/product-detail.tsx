import Link from "next/link";
import type { ReactNode } from "react";
import { AdLabel } from "@/components/ad-label";
import { Gallery, type GalleryImage } from "@/components/gallery";
import { GoButton } from "@/components/go-button";
import { ProductGrid } from "@/components/product-card";
import { ShareButton } from "@/components/share-button";
import { site } from "@/config/site";
import { getCategory } from "@/lib/categories";
import { storeName } from "@/lib/stores";
import type { PublicProduct } from "@/lib/types";

/** Detaydaki görsel oranı: yüklenen görselin kendi oranı; hikâye görseli (9:16) tam boy gösterilir. */
function galleryAspect(product: PublicProduct): number {
  if (product.image_url && product.image_width && product.image_height) {
    return Math.min(1, Math.max(9 / 16, product.image_width / product.image_height));
  }
  return 9 / 16;
}

function galleryImages(product: PublicProduct): GalleryImage[] {
  const images: GalleryImage[] = [];
  if (product.image_url) images.push({ src: product.image_url, blur: product.image_blur });
  if (product.fallback_image_url && product.fallback_image_url !== product.image_url) {
    images.push({ src: product.fallback_image_url });
  }
  return images;
}

type Props = {
  product: PublicProduct;
  related: PublicProduct[];
  /** Sol üstteki geri / kapat düğmesi (tam sayfa ve katman için farklı). */
  backButton: ReactNode;
};

export function ProductDetail({ product, related, backButton }: Props) {
  const category = getCategory(product.category);
  const store = storeName(product.store);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <article className="flex-1">
        <div className="relative sm:px-4 sm:pt-4">
          <Gallery
            images={galleryImages(product)}
            alt={product.title}
            aspect={galleryAspect(product)}
            href={`/go/${product.id}`}
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:p-7">
            {backButton}
            <ShareButton path={`/p/${product.slug}`} title={product.title} />
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            {product.brand ? <span>{product.brand}</span> : null}
            {product.brand && category ? <span aria-hidden="true">·</span> : null}
            {category ? (
              <Link href={`/?kategori=${category.id}`} className="underline-offset-4 hover:underline">
                {category.name}
              </Link>
            ) : null}
          </div>
          <h1 className="mt-1.5 font-serif text-[26px] leading-[1.2] text-ink">{product.title}</h1>

          {product.note ? (
            <figure className="mt-5 rounded-2xl bg-accent-soft/60 px-4 py-3.5">
              <blockquote className="font-serif text-[17px] leading-relaxed text-ink italic">
                “{product.note}”
              </blockquote>
              <figcaption className="mt-1.5 text-[12px] text-ink-soft">— {site.name}</figcaption>
            </figure>
          ) : null}
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="benzer" className="mt-10 px-4 pb-6">
            <h2 id="benzer" className="mb-3 px-1 font-serif text-xl text-ink">
              Bunlar da ilgini çekebilir
            </h2>
            <ProductGrid products={related} />
          </section>
        ) : (
          <div className="h-8" />
        )}
      </article>

      {/* Sabit alt buton: başparmakla rahat erişim; hemen üstünde reklam etiketi ve mağaza adı. */}
      <div className="pb-safe sticky bottom-0 z-10 border-t border-line/80 bg-paper/95 px-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <AdLabel
          store={product.store}
          isGift={product.is_gift}
          giftBrand={product.gift_brand}
          size="md"
          className="mb-2.5 text-center"
        />
        <GoButton productId={product.id} storeName={store} />
      </div>
    </div>
  );
}

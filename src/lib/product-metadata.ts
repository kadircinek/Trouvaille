import type { Metadata } from "next";
import { site } from "@/config/site";
import { storeName } from "@/lib/stores";
import { primaryImage, type PublicCreator, type PublicProduct } from "@/lib/types";

/** Ürün sayfası başlığı + WhatsApp/Instagram önizlemesi (Open Graph). */
export function productMetadata(product: PublicProduct, creator: PublicCreator): Metadata {
  const image = primaryImage(product);
  const path = `/p/${product.slug}`;
  const disclosure = `#Reklam · ${storeName(product.store)} ortaklık linki`;
  const description = product.note ? `${product.note} — ${disclosure}` : `${creator.display_name} vitrininde. ${disclosure}`;
  const images = image
    ? [
        {
          url: image,
          alt: product.title,
          ...(product.image_url && product.image_width && product.image_height
            ? { width: product.image_width, height: product.image_height }
            : {}),
        },
      ]
    : undefined;

  return {
    title: product.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: `${creator.display_name} · ${site.name}`,
      locale: site.locale,
      title: product.title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

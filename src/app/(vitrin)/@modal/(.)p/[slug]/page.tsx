import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { CloseModalButton, ProductModal } from "@/components/product-modal";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getCreatorById } from "@/lib/data/creators";
import { productMetadata } from "@/lib/product-metadata";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const product = await getProductBySlug(slug);
  const creator = product ? await getCreatorById(product.creator_id) : null;
  return product && creator ? { product, creator } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  return found ? productMetadata(found.product, found.creator) : {};
}

export default async function ProductModalPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  // Vitrin sahibi ve benzer ürünler birbirini beklemez.
  const [creator, related] = await Promise.all([getCreatorById(product.creator_id), getRelatedProducts(product)]);
  if (!creator) notFound();

  return (
    <ProductModal key={slug}>
      <ProductDetail
        product={product}
        creator={creator}
        related={related}
        backButton={<CloseModalButton label={creator.display_name} />}
      />
    </ProductModal>
  );
}

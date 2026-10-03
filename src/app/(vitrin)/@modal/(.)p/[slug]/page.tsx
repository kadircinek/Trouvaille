import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { CloseModalButton, ProductModal } from "@/components/product-modal";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { productMetadata } from "@/lib/product-metadata";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product ? productMetadata(product) : {};
}

export default async function ProductModalPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);

  return (
    <ProductModal key={slug}>
      <ProductDetail product={product} related={related} backButton={<CloseModalButton />} />
    </ProductModal>
  );
}

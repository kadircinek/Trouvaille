import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { ProductDetail } from "@/components/product-detail";
import { SiteFooter } from "@/components/site-footer";
import { DisclosureBar } from "@/components/site-header";
import { productMetadata } from "@/lib/product-metadata";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";

export const revalidate = 300;

// Ürün sayfaları ilk ziyarette üretilip önbelleğe alınır (ISR).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product ? productMetadata(product) : { title: "Ürün bulunamadı" };
}

export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);

  return (
    <>
      <DisclosureBar />
      <ProductDetail
        product={product}
        related={related}
        backButton={
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-paper/90 pr-3.5 pl-3 text-[13px] font-medium text-ink shadow-sm backdrop-blur"
          >
            <ArrowLeftIcon size={18} />
            Vitrin
          </Link>
        }
      />
      <SiteFooter />
    </>
  );
}

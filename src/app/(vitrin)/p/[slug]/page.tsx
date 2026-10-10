import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { ProductDetail } from "@/components/product-detail";
import { SiteFooter } from "@/components/site-footer";
import { DisclosureBar } from "@/components/site-header";
import { productMetadata } from "@/lib/product-metadata";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getCreatorById } from "@/lib/data/creators";

export const revalidate = 300;

// Ürün sayfaları ilk ziyarette üretilip önbelleğe alınır (ISR).
export function generateStaticParams() {
  return [];
}

async function load(slug: string) {
  const product = await getProductBySlug(slug);
  const creator = product ? await getCreatorById(product.creator_id) : null;
  return product && creator ? { product, creator } : null;
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  return found ? productMetadata(found.product, found.creator) : { title: "Ürün bulunamadı" };
}

export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) notFound();
  const { product, creator } = found;
  const related = await getRelatedProducts(product);

  return (
    <>
      <DisclosureBar />
      <ProductDetail
        product={product}
        creator={creator}
        related={related}
        backButton={
          <Link
            href={`/${creator.username}`}
            className="inline-flex h-10 max-w-[60vw] items-center gap-1.5 rounded-full bg-paper/90 pr-3.5 pl-3 text-[13px] font-medium text-ink shadow-sm backdrop-blur"
          >
            <ArrowLeftIcon size={18} className="shrink-0" />
            <span className="truncate">{creator.display_name}</span>
          </Link>
        }
      />
      <SiteFooter creator={creator} />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { ArrowLeftIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { getProduct } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Ürünü düzenle" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({ params }: PageProps<"/admin/urun/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const admin = await requireAdmin();
  const product = await getProduct(admin, id);
  if (!product) notFound();

  return (
    <div>
      <Link href={`/admin?durum=${product.status}`} className="inline-flex items-center gap-1 text-[13px] text-ink-soft">
        <ArrowLeftIcon size={16} /> Ürünler
      </Link>
      <h1 className="mt-2 mb-5 font-serif text-[26px]">Ürünü düzenle</h1>
      <ProductForm product={product} />
    </div>
  );
}

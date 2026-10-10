import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { requireCreator } from "@/lib/auth";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  const { creator } = await requireCreator();
  return (
    <div>
      <h1 className="mb-5 font-serif text-[26px]">Yeni ürün</h1>
      <ProductForm creatorId={creator.id} />
    </div>
  );
}

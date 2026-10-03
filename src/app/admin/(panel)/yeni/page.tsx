import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Yeni ürün" };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-5 font-serif text-[26px]">Yeni ürün</h1>
      <ProductForm />
    </div>
  );
}

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Supabase public URL'inden bucket içindeki dosya yolunu çıkarır (bizim bucket değilse null). */
export function storagePathFromUrl(url: string | null | undefined, supabaseUrl: string | undefined): string | null {
  if (!url || !supabaseUrl) return null;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0] ?? "");
  return path && !path.includes("..") ? path : null;
}

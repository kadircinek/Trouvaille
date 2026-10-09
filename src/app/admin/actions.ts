"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin, type AdminSession } from "@/lib/auth";
import { isCategoryId } from "@/lib/categories";
import { saveLinkCheck } from "@/lib/data/link-checks";
import { checkProductLink } from "@/lib/link-health";
import { parseAffiliateUrl } from "@/lib/links";
import { inspectProductLink } from "@/lib/product-info";
import { productSlug } from "@/lib/slug";
import { PRODUCT_IMAGE_BUCKET, storagePathFromUrl } from "@/lib/storage";
import { detectStoreFromUrl } from "@/lib/stores";
import type { LinkStatus, ProductStatus } from "@/lib/types";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const NOT_ADMIN: ActionResult<never> = { ok: false, error: "Oturumun kapanmış. Lütfen yeniden giriş yap." };

/** Vitrin sayfaları statik üretildiği için her değişiklikte hemen yenilenir. */
function refreshVitrin() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Linkten ürün bilgisi
// ---------------------------------------------------------------------------

export type LinkInfo = {
  store: string | null;
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  fetched: boolean;
};

export async function inspectLink(rawUrl: string): Promise<ActionResult<LinkInfo>> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const url = parseAffiliateUrl(rawUrl);
  if (!url) return { ok: false, error: "Bu bir link gibi görünmüyor. Trendyol veya Hepsiburada linkini yapıştır." };

  try {
    const info = await inspectProductLink(url);
    return {
      ok: true,
      data: { store: info.store, title: info.title, brand: info.brand, imageUrl: info.imageUrl, fetched: info.fetched },
    };
  } catch (error) {
    console.error("Link incelenemedi:", error);
    return {
      ok: true,
      data: { store: detectStoreFromUrl(url), title: null, brand: null, imageUrl: null, fetched: false },
    };
  }
}

// ---------------------------------------------------------------------------
// Ürün kaydetme
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), "Geçersiz görsel adresi")
  .nullish()
  .transform((v) => (v ? v : null));

const productSchema = z.object({
  title: z.string().trim().min(1, "Ürün adını yaz.").max(200, "Ürün adı çok uzun."),
  brand: optionalText(100),
  store: z.string().regex(/^[a-z0-9-]{2,32}$/, "Mağazayı seç."),
  affiliate_url: z.string(),
  image_url: httpsUrl,
  image_width: z.number().int().positive().max(20000).nullish().transform((v) => v ?? null),
  image_height: z.number().int().positive().max(20000).nullish().transform((v) => v ?? null),
  image_blur: z
    .string()
    .max(4000)
    .refine((v) => v.startsWith("data:image/"), "Geçersiz önizleme")
    .nullish()
    .transform((v) => v ?? null),
  fallback_image_url: httpsUrl,
  category: z
    .string()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isCategoryId(v), "Geçersiz kategori."),
  note: optionalText(500),
  is_gift: z.boolean(),
  gift_brand: optionalText(100).transform((v) => (v ? v.replace(/^@+/, "") : null)),
  status: z.enum(["draft", "published", "archived"]),
});

export type ProductInput = z.input<typeof productSchema>;

async function deleteStoredImage(admin: AdminSession, url: string | null) {
  const path = storagePathFromUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!path) return;
  const { error } = await admin.supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  if (error) console.error("Eski görsel silinemedi:", error.message);
}

function validate(input: ProductInput): ActionResult<z.output<typeof productSchema>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Bilgileri kontrol et." };
  const value = parsed.data;

  // Affiliate linki olduğu gibi saklanır; yalnızca baş/son boşluklar atılır.
  const url = parseAffiliateUrl(value.affiliate_url);
  if (!url) return { ok: false, error: "Geçerli bir Trendyol veya Hepsiburada linki yapıştır." };
  value.affiliate_url = url;

  if (value.status === "published" && !value.image_url && !value.fallback_image_url) {
    return { ok: false, error: "Yayınlamak için bir görsel seç (ya da linkten ürün fotoğrafı gelsin)." };
  }
  if (value.is_gift && !value.gift_brand) {
    return { ok: false, error: "Hediye eden markayı yaz (ör. @marka)." };
  }
  if (!value.is_gift) value.gift_brand = null;
  if (!value.image_url) {
    value.image_width = null;
    value.image_height = null;
    value.image_blur = null;
  }
  return { ok: true, data: value };
}

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const result = validate(input);
  if (!result.ok) return result;

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = productSlug(result.data.title);
    const { data, error } = await admin.supabase
      .from("products")
      .insert({ ...result.data, slug })
      .select("id, slug")
      .single();
    if (!error && data) {
      refreshVitrin();
      return { ok: true, data };
    }
    if (error?.code !== "23505") {
      console.error("Ürün eklenemedi:", error?.message);
      return { ok: false, error: "Ürün kaydedilemedi. Tekrar dene." };
    }
  }
  return { ok: false, error: "Ürün kaydedilemedi. Tekrar dene." };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Ürün bulunamadı." };
  const result = validate(input);
  if (!result.ok) return result;

  const { data: existing } = await admin.supabase
    .from("products")
    .select("image_url, affiliate_url")
    .eq("id", id)
    .maybeSingle();
  // Link değiştiyse eski kontrol sonucu geçersiz; ertesi kontrolde yeni link çözülür.
  const linkChanged = existing && existing.affiliate_url !== result.data.affiliate_url;
  const resetCheck = linkChanged ? { check_url: null, link_status: null, link_checked_at: null, link_check_note: null } : {};
  const { data, error } = await admin.supabase
    .from("products")
    .update({ ...result.data, ...resetCheck })
    .eq("id", id)
    .select("id, slug")
    .single();
  if (error || !data) {
    console.error("Ürün güncellenemedi:", error?.message);
    return { ok: false, error: "Değişiklikler kaydedilemedi. Tekrar dene." };
  }
  if (existing?.image_url && existing.image_url !== result.data.image_url) {
    await deleteStoredImage(admin, existing.image_url);
  }
  refreshVitrin();
  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Liste işlemleri: durum, sabitleme, sıralama, silme
// ---------------------------------------------------------------------------

export async function setProductStatus(id: string, status: ProductStatus): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!["draft", "published", "archived"].includes(status)) return { ok: false, error: "Geçersiz durum." };
  const { error } = await admin.supabase.from("products").update({ status }).eq("id", id);
  if (error) {
    const noImage = error.message.includes("products_published_has_image");
    return { ok: false, error: noImage ? "Yayınlamak için önce bir görsel ekle." : "Durum değiştirilemedi." };
  }
  refreshVitrin();
  return { ok: true, data: undefined };
}

export async function setProductPinned(id: string, pinned: boolean): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase.from("products").update({ is_pinned: pinned }).eq("id", id);
  if (error) return { ok: false, error: "Sabitleme değiştirilemedi." };
  refreshVitrin();
  return { ok: true, data: undefined };
}

export async function moveProduct(id: string, direction: "up" | "down" | "top"): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase.rpc("admin_move_product", { p_id: id, p_direction: direction });
  if (error) return { ok: false, error: "Sıra değiştirilemedi." };
  refreshVitrin();
  return { ok: true, data: undefined };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const { data, error } = await admin.supabase.from("products").delete().eq("id", id).select("image_url").maybeSingle();
  if (error) return { ok: false, error: "Ürün silinemedi." };
  await deleteStoredImage(admin, data?.image_url ?? null);
  refreshVitrin();
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Link sağlık kontrolü (elle)
// ---------------------------------------------------------------------------

export type LinkCheckResult = { status: LinkStatus; note: string | null; checkedAt: string };

/** Panelden "Şimdi kontrol et": tek ürünün linkini hemen kontrol eder. */
export async function recheckProductLink(id: string): Promise<ActionResult<LinkCheckResult>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Ürün bulunamadı." };
  const { data: product } = await admin.supabase
    .from("products")
    .select("id, affiliate_url, check_url")
    .eq("id", id)
    .maybeSingle();
  if (!product) return { ok: false, error: "Ürün bulunamadı." };

  const check = await checkProductLink(product);
  await saveLinkCheck(admin.supabase, id, check);
  revalidatePath("/admin");
  return { ok: true, data: { status: check.status, note: check.note, checkedAt: new Date().toISOString() } };
}

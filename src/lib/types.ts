export type ProductStatus = "draft" | "published" | "archived";

/** Günlük link kontrolünün sonucu (null: henüz kontrol edilmedi). */
export type LinkStatus = "ok" | "kirik" | "stokta_yok" | "bilinmiyor";

export type Product = {
  id: string;
  creator_id: string;
  slug: string;
  title: string;
  brand: string | null;
  store: string;
  affiliate_url: string;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  image_blur: string | null;
  fallback_image_url: string | null;
  category: string | null;
  note: string | null;
  is_gift: boolean;
  gift_brand: string | null;
  is_pinned: boolean;
  sort_key: number;
  status: ProductStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Hikâye kısa linki: site.com/u/<short_code> */
  short_code: string;
  link_status: LinkStatus | null;
  link_checked_at: string | null;
  link_check_note: string | null;
  check_url: string | null;
};

/** Ziyaretçiye giden alanlar: affiliate linki yok, tıklama her zaman /go üzerinden. */
export type PublicProduct = Pick<
  Product,
  | "id"
  | "creator_id"
  | "slug"
  | "title"
  | "brand"
  | "store"
  | "image_url"
  | "image_width"
  | "image_height"
  | "image_blur"
  | "fallback_image_url"
  | "category"
  | "note"
  | "is_gift"
  | "gift_brand"
  | "is_pinned"
  | "published_at"
>;

export const PUBLIC_PRODUCT_COLUMNS =
  "id,creator_id,slug,title,brand,store,image_url,image_width,image_height,image_blur,fallback_image_url,category,note,is_gift,gift_brand,is_pinned,published_at";

export type FeedPage = { items: PublicProduct[]; hasMore: boolean };

/** Ürünün ana görseli: ablanın yüklediği, yoksa linkten çekilen. */
export function primaryImage(p: Pick<Product, "image_url" | "fallback_image_url">): string | null {
  return p.image_url ?? p.fallback_image_url;
}

/** Vitrin sahibi influencer (herkese açık alanlar). */
export type PublicCreator = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  instagram: string | null;
  avatar_url: string | null;
};

export const PUBLIC_CREATOR_COLUMNS = "id,username,display_name,bio,instagram,avatar_url";

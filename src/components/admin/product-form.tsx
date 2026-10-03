"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createProduct,
  deleteProduct,
  inspectLink,
  updateProduct,
  type LinkInfo,
  type ProductInput,
} from "@/app/admin/actions";
import { CheckIcon, ClipboardIcon, GiftIcon, ImageIcon } from "@/components/icons";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { newImagePath, prepareImage } from "@/lib/image-client";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage";
import { STORES, storeName } from "@/lib/stores";
import { createClient } from "@/lib/supabase/browser";
import type { Product, ProductStatus } from "@/lib/types";

type OwnImage = {
  url: string | null; // yüklendikten sonra Supabase adresi
  preview: string; // ekranda gösterilecek (yerel ya da uzak)
  width: number | null;
  height: number | null;
  blur: string | null;
  state: "uploading" | "ready" | "error";
};

type InspectState = "idle" | "loading" | "done" | "error";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 text-[16px] text-ink outline-none transition-colors placeholder:text-muted focus:border-ink";

const STATUS_LABELS: Record<ProductStatus, string> = {
  published: "Yayında",
  draft: "Taslak",
  archived: "Arşiv",
};

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const editing = Boolean(product);
  const fileInput = useRef<HTMLInputElement>(null);

  const [affiliateUrl, setAffiliateUrl] = useState(product?.affiliate_url ?? "");
  const [store, setStore] = useState<string | null>(product?.store ?? null);
  const [title, setTitle] = useState(product?.title ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [fallbackImage, setFallbackImage] = useState<string | null>(product?.fallback_image_url ?? null);
  const [image, setImage] = useState<OwnImage | null>(
    product?.image_url
      ? {
          url: product.image_url,
          preview: product.image_url,
          width: product.image_width,
          height: product.image_height,
          blur: product.image_blur,
          state: "ready",
        }
      : null,
  );
  const [category, setCategory] = useState<string | null>(product?.category ?? null);
  const [note, setNote] = useState(product?.note ?? "");
  const [isGift, setIsGift] = useState(product?.is_gift ?? false);
  const [giftBrand, setGiftBrand] = useState(product?.gift_brand ?? "");
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "published");

  const [inspect, setInspect] = useState<{ state: InspectState; info?: LinkInfo; error?: string }>({
    state: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lastInspected = useRef(product?.affiliate_url ?? "");
  const titleTouched = useRef(editing);

  // Yerel önizleme adreslerini temizle.
  useEffect(() => {
    const preview = image?.preview;
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [image?.preview]);

  async function runInspect(url: string) {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastInspected.current) return;
    lastInspected.current = trimmed;
    setInspect({ state: "loading" });
    const result = await inspectLink(trimmed);
    if (lastInspected.current !== trimmed) return; // bu arada link değişti
    if (!result.ok) {
      setInspect({ state: "error", error: result.error });
      return;
    }
    const info = result.data;
    setInspect({ state: "done", info });
    if (info.store) setStore(info.store);
    if (info.title && !titleTouched.current) setTitle(info.title);
    if (info.brand) setBrand((b) => b || info.brand || "");
    if (info.imageUrl) setFallbackImage(info.imageUrl);
  }

  // Yazarken/yapıştırırken kısa bir beklemeden sonra linki incele.
  useEffect(() => {
    if (!affiliateUrl.trim() || affiliateUrl.trim() === lastInspected.current) return;
    const timer = setTimeout(() => void runInspect(affiliateUrl), 450);
    return () => clearTimeout(timer);
  }, [affiliateUrl]);

  async function pasteFromClipboard() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) setAffiliateUrl(text);
    } catch {
      setError("Panoya erişilemedi; linki kutuya uzun basıp yapıştırabilirsin.");
    }
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setImage({ url: null, preview: localPreview, width: null, height: null, blur: null, state: "uploading" });
    try {
      const prepared = await prepareImage(file);
      const supabase = createClient();
      const path = newImagePath();
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, prepared.blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      setImage((current) =>
        current?.preview === localPreview
          ? {
              url: data.publicUrl,
              preview: localPreview,
              width: prepared.width,
              height: prepared.height,
              blur: prepared.blur,
              state: "ready",
            }
          : current,
      );
    } catch (e) {
      console.error(e);
      setImage((current) => (current?.preview === localPreview ? { ...current, state: "error" } : current));
      setError(e instanceof Error && e.message.length < 120 ? `Görsel yüklenemedi: ${e.message}` : "Görsel yüklenemedi.");
    }
  }

  function buildInput(nextStatus: ProductStatus): ProductInput {
    return {
      title,
      brand,
      store: store ?? "",
      affiliate_url: affiliateUrl,
      image_url: image?.state === "ready" ? image.url : null,
      image_width: image?.state === "ready" ? image.width : null,
      image_height: image?.state === "ready" ? image.height : null,
      image_blur: image?.state === "ready" ? image.blur : null,
      fallback_image_url: fallbackImage,
      category,
      note,
      is_gift: isGift,
      gift_brand: giftBrand,
      status: nextStatus,
    };
  }

  function submit(nextStatus: ProductStatus) {
    setError(null);
    if (image?.state === "uploading") {
      setError("Görsel yükleniyor, birkaç saniye bekle.");
      return;
    }
    startTransition(async () => {
      const input = buildInput(nextStatus);
      const result = product ? await updateProduct(product.id, input) : await createProduct(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const notice = editing ? "guncellendi" : nextStatus === "published" ? "yayinda" : "taslak";
      router.push(`/admin?durum=${nextStatus}&bildirim=${notice}&urun=${result.data.slug}`);
    });
  }

  function remove() {
    if (!product) return;
    if (!window.confirm("Ürün ve tıklama geçmişi kalıcı olarak silinsin mi? Sadece gizlemek için Arşiv'i seç.")) return;
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin?durum=${product.status}&bildirim=silindi`);
    });
  }

  const shownImage = image?.preview ?? fallbackImage;
  const detectedStore = inspect.info?.store ?? null;

  return (
    <form
      className="space-y-6 pb-36"
      onSubmit={(e) => {
        e.preventDefault();
        submit(editing ? status : "published");
      }}
    >
      {/* 1. Görsel */}
      <section>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onFileSelected(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className={cn(
            "relative mx-auto block aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
            shownImage ? "border-transparent bg-paper-2" : "border-line bg-white hover:border-ink/30",
          )}
        >
          {shownImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- yerel (blob:) önizleme
            <img
              src={shownImage}
              alt=""
              className={cn("absolute inset-0 size-full", image ? "object-cover" : "object-contain")}
            />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-ink-soft">
              <ImageIcon size={32} />
              <span className="text-[15px] font-medium text-ink">Fotoğraf seç</span>
              <span className="text-[12.5px]">Instagram’da paylaştığın görselin aynısı</span>
            </span>
          )}
          {image?.state === "uploading" ? (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-paper/90 py-1.5 text-[12px] font-medium text-ink">
              Yükleniyor…
            </span>
          ) : null}
          {image?.state === "error" ? (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-danger py-1.5 text-[12px] font-medium text-white">
              Yüklenemedi — tekrar seç
            </span>
          ) : null}
          {!image && fallbackImage ? (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-paper/90 px-2 py-1.5 text-[11.5px] text-ink">
              Linkteki ürün fotoğrafı kullanılacak · değiştirmek için dokun
            </span>
          ) : null}
        </button>
        {image ? (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setImage(null)}
              className="text-[12.5px] text-ink-soft underline underline-offset-4"
            >
              Görseli kaldır{fallbackImage ? " (ürün fotoğrafını kullan)" : ""}
            </button>
          </div>
        ) : null}
      </section>

      {/* 2. Link */}
      <section className="space-y-2">
        <label htmlFor="affiliate_url" className="block text-[13px] font-semibold text-ink">
          Trendyol / Hepsiburada linki
        </label>
        <div className="flex gap-2">
          <input
            id="affiliate_url"
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            required
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            onBlur={() => void runInspect(affiliateUrl)}
            placeholder="https://ty.gl/…"
            className={cn(field, "h-12 min-w-0 flex-1")}
          />
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-ink px-3.5 text-[14px] font-medium text-ink"
          >
            <ClipboardIcon size={16} /> Yapıştır
          </button>
        </div>
        <p className="min-h-5 text-[12.5px] text-ink-soft" aria-live="polite">
          {inspect.state === "loading" ? "Ürün bilgileri getiriliyor…" : null}
          {inspect.state === "error" ? <span className="text-danger">{inspect.error}</span> : null}
          {inspect.state === "done" && detectedStore ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckIcon size={14} /> {storeName(detectedStore)} linki tanındı
              {inspect.info?.fetched ? "" : " — ürün adını kendin yazabilirsin"}
            </span>
          ) : null}
          {inspect.state === "done" && !detectedStore ? "Mağaza tanınamadı, aşağıdan seç." : null}
        </p>
        <p className="text-[11.5px] text-muted">Link olduğu gibi saklanır; hiçbir parametresi değiştirilmez.</p>
      </section>

      {/* Mağaza */}
      <section>
        <p className="mb-2 text-[13px] font-semibold text-ink">Mağaza</p>
        <div className="grid grid-cols-2 gap-2">
          {STORES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={store === s.id}
              onClick={() => setStore(s.id)}
              className={cn(
                "h-11 rounded-xl border text-[14px] font-medium transition-colors",
                store === s.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Ad, marka */}
      <section className="space-y-3">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Ürün adı
          </label>
          <input
            id="title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => {
              titleTouched.current = true;
              setTitle(e.target.value);
            }}
            placeholder="Linkten otomatik gelir"
            className={cn(field, "h-12")}
          />
        </div>
        <div>
          <label htmlFor="brand" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Marka <span className="font-normal text-muted">(isteğe bağlı)</span>
          </label>
          <input
            id="brand"
            maxLength={100}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={cn(field, "h-11")}
          />
        </div>
      </section>

      {/* 4. Kategori */}
      <section>
        <p className="mb-2 text-[13px] font-semibold text-ink">
          Kategori <span className="font-normal text-muted">(isteğe bağlı)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(category === c.id ? null : c.id)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-[13.5px] transition-colors",
                category === c.id ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Not */}
      <section>
        <label htmlFor="note" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Kısa not <span className="font-normal text-muted">(isteğe bağlı)</span>
        </label>
        <textarea
          id="note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bunu çok sevdim, kalıbı tam oturuyor…"
          className={cn(field, "resize-none py-3 leading-relaxed")}
        />
        <p className="mt-1 text-right text-[11px] text-muted">{note.length}/500</p>
      </section>

      {/* 6. Hediye */}
      <section className="rounded-2xl border border-line bg-white p-4">
        <label className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
            <GiftIcon size={18} /> Marka hediyesi
          </span>
          <input
            type="checkbox"
            checked={isGift}
            onChange={(e) => setIsGift(e.target.checked)}
            className="size-5 accent-[var(--color-accent)]"
          />
        </label>
        {isGift ? (
          <div className="mt-3">
            <input
              aria-label="Hediye eden marka"
              value={giftBrand}
              maxLength={100}
              onChange={(e) => setGiftBrand(e.target.value)}
              placeholder="@marka"
              className={cn(field, "h-11")}
            />
            <p className="mt-1.5 text-[11.5px] text-muted">
              Etiket: “#Reklam · @{giftBrand.replace(/^@+/, "") || "marka"} tarafından hediye olarak alındı”
            </p>
          </div>
        ) : null}
      </section>

      {editing ? (
        <section>
          <p className="mb-2 text-[13px] font-semibold text-ink">Durum</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-11 rounded-xl border text-[14px] font-medium transition-colors",
                  status === s ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink",
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted">Arşivdeki ürün vitrinde görünmez ama linki çalışmaya devam eder.</p>
          <button type="button" onClick={remove} className="mt-6 text-[13px] text-danger underline underline-offset-4">
            Ürünü kalıcı olarak sil
          </button>
        </section>
      ) : null}

      {/* Sabit alt çubuk */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          {error ? (
            <p role="alert" className="mb-2 text-center text-[13px] text-danger">
              {error}
            </p>
          ) : null}
          {editing ? (
            <button
              type="submit"
              disabled={pending}
              className="h-13 w-full rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink disabled:opacity-60"
            >
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => submit("draft")}
                className="rounded-2xl border border-ink px-4 py-3.5 text-[15px] font-medium text-ink disabled:opacity-60"
              >
                Taslak
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink disabled:opacity-60"
              >
                {pending ? "Yayınlanıyor…" : "Yayınla"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon, DownloadIcon, InstagramIcon, LinkIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { isOptimizable } from "@/lib/image-hosts";

type Props = {
  /** Ürünün görseli (ablanın yüklediği hikâye görseli ya da mağaza fotoğrafı). */
  image: string;
  title: string;
  slug: string;
  /** Hikâyedeki link çıkartmasına konacak kısa link. */
  storyUrl: string;
  variant?: "chip" | "block";
};

type Prepared = { file: File; objectUrl: string } | { error: true } | null;

/** Görseli kendi sitemiz üzerinden indirir (başka alan adlarındaki CORS engeline takılmaz). */
async function loadImageFile(image: string, slug: string): Promise<File> {
  const src = isOptimizable(image) ? `/_next/image?url=${encodeURIComponent(image)}&w=1080&q=75` : image;
  const res = await fetch(src, { headers: { accept: "image/jpeg,image/png,image/*;q=0.8" } });
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${slug}.${ext}`, { type });
}

/**
 * "Instagram'da paylaş": daha önce eklenen ürünü tek dokunuşla yeniden hikâyeye
 * taşır. Görsel telefonun paylaşım menüsüyle Instagram'a gider, hikâye linki
 * aynı anda panoya kopyalanır (link çıkartmasına yapıştırılır). Instagram,
 * linkli hikâyenin uygulama dışından otomatik paylaşılmasına izin vermez;
 * son "Paylaş" dokunuşu Instagram'da yapılır.
 */
export function InstagramShareButton({ image, title, slug, storyUrl, variant = "chip" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "chip"
            ? "inline-flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-[12px] font-medium text-ink"
            : "flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left"
        }
      >
        {variant === "chip" ? (
          <>
            <InstagramIcon size={13} /> Instagram’da paylaş
          </>
        ) : (
          <>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <InstagramIcon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-ink">Instagram’da tekrar paylaş</span>
              <span className="block text-[12.5px] text-ink-soft">Görsel + hikâye linki hazır gelir</span>
            </span>
          </>
        )}
      </button>
      {open ? (
        <ShareSheet image={image} title={title} slug={slug} storyUrl={storyUrl} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function ShareSheet({ image, title, slug, storyUrl, onClose }: Omit<Props, "variant"> & { onClose: () => void }) {
  const [prepared, setPrepared] = useState<Prepared>(null);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Paylaş'a dokununca beklemeden menü açılsın diye görsel önceden hazırlanır
  // (telefonlar paylaşım menüsünü yalnızca dokunuşun hemen ardından açar).
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    loadImageFile(image, slug)
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file);
        setPrepared({ file, objectUrl });
      })
      .catch(() => {
        if (!cancelled) setPrepared({ error: true });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image, slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const file = prepared && "file" in prepared ? prepared.file : null;
  const canShareFile = Boolean(
    file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }),
  );

  function copyLink() {
    navigator.clipboard?.writeText(storyUrl).then(
      () => setCopied(true),
      () => setNote(`Link kopyalanamadı; elle kopyala: ${storyUrl}`),
    );
  }

  function share() {
    if (!file) return;
    copyLink();
    navigator.share({ files: [file], title }).catch((err: DOMException) => {
      if (err?.name !== "AbortError") setNote("Paylaşım menüsü açılamadı. Görseli indirip Instagram’da paylaşabilirsin.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instagram’da paylaş"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-in pb-safe w-full max-w-lg rounded-t-3xl bg-paper px-5 pt-4 sm:rounded-3xl sm:pb-5"
      >
        <div className="flex items-center justify-between">
          <p className="font-serif text-[21px] text-ink">Instagram’da paylaş</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid size-9 place-items-center rounded-full text-ink-soft">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="mt-3 flex gap-4">
          <div className="relative aspect-[9/16] w-[96px] shrink-0 overflow-hidden rounded-xl bg-paper-2">
            {prepared && "objectUrl" in prepared ? (
              // eslint-disable-next-line @next/next/no-img-element -- yerel önizleme (blob:)
              <img src={prepared.objectUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className={cn("absolute inset-0", !prepared && "animate-pulse")} />
            )}
          </div>
          <ol className="list-decimal space-y-1.5 pl-4 text-[13px] leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">Paylaş</strong>’a dokun, listeden <strong className="text-ink">Instagram</strong> →{" "}
              <strong className="text-ink">Hikâye</strong>’yi seç.
            </li>
            <li>
              Hikâyede <strong className="text-ink">link çıkartması</strong> ekle; link panoda, yapıştır.
            </li>
            <li>Instagram’da paylaş. Bu linkten gelen tıklamalar panelde “Hikâye” olarak sayılır.</li>
          </ol>
        </div>

        <div className="mt-4 space-y-2.5">
          {prepared && "error" in prepared ? (
            <p className="rounded-xl bg-danger/10 px-3 py-2.5 text-[13px] text-danger">
              Görsel hazırlanamadı.{" "}
              <a href={image} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                Görseli aç
              </a>
              , telefonuna kaydet ve Instagram’da hikâyene ekle.
            </p>
          ) : null}
          {canShareFile ? (
            <button
              type="button"
              onClick={share}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-accent-ink"
            >
              <InstagramIcon size={18} /> Paylaş
            </button>
          ) : file ? (
            <a
              href={prepared && "objectUrl" in prepared ? prepared.objectUrl : image}
              download={file.name}
              onClick={copyLink}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-accent-ink"
            >
              <DownloadIcon size={18} /> Görseli indir ve linki kopyala
            </a>
          ) : !prepared ? (
            <div className="flex h-12 w-full items-center justify-center rounded-xl bg-paper-2 text-[14px] text-ink-soft">
              Görsel hazırlanıyor…
            </div>
          ) : null}
          <button
            type="button"
            onClick={copyLink}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white text-[13.5px] font-medium text-ink"
          >
            {copied ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
            {copied ? "Hikâye linki kopyalandı" : "Yalnızca hikâye linkini kopyala"}
          </button>
          {note ? <p className="text-[12.5px] text-ink-soft">{note}</p> : null}
          {canShareFile ? (
            <p className="text-[11.5px] leading-snug text-muted">
              Listede Instagram “Hikâye” seçeneği yoksa <strong>Görseli Kaydet</strong>’e dokun, sonra Instagram’da
              hikâyene ekle.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

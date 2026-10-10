"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AdLabel } from "@/components/ad-label";
import { ProductImage } from "@/components/product-image";
import { ShareButton } from "@/components/share-button";
import { cn } from "@/lib/cn";
import { storeName } from "@/lib/stores";
import { primaryImage, type PublicProduct } from "@/lib/types";

export type StoryItem = PublicProduct & { isNew: boolean };

const SEEN_KEY = "vitrin:gorulen-hikayeler";
const SEEN_EVENT = "vitrin:gorulen";
const STORY_MS = 6000;

// Görülen hikâyeler yalnızca bu cihazda tutulur (halka griye döner).
function readSeen(): string {
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function markSeen(id: string) {
  try {
    const seen = new Set<string>(JSON.parse(readSeen()));
    if (seen.has(id)) return;
    seen.add(id);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {
    // Depolama kapalıysa halka renkli kalır; sorun değil.
  }
}

function subscribeSeen(callback: () => void) {
  window.addEventListener(SEEN_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SEEN_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} g`;
  return `${Math.round(days / 7)} hf`;
}

/** Instagram'daki gibi hikâye halkaları; dokununca tam ekran hikâye açılır. */
export function Stories({
  items,
  siteName,
  avatarUrl = null,
}: {
  items: StoryItem[];
  /** Vitrin sahibinin adı (hikâye başlığında). */
  siteName: string;
  avatarUrl?: string | null;
}) {
  const seenRaw = useSyncExternalStore(subscribeSeen, readSeen, () => "[]");
  const seen = useMemo(() => {
    try {
      return new Set<string>(JSON.parse(seenRaw));
    } catch {
      return new Set<string>();
    }
  }, [seenRaw]);
  const [open, setOpen] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section aria-label="Hikâyeler" className="pb-4">
      <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-1 pb-1">
        {items.map((item, i) => {
          const image = primaryImage(item);
          const highlighted = item.isNew && !seen.has(item.id);
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="flex w-[76px] flex-col items-center gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`${item.title} hikâyesini aç${item.isNew ? " (yeni)" : ""}`}
              >
                <span className={cn("relative rounded-full p-[2.5px]", highlighted ? "story-ring" : "bg-line")}>
                  <span className="block rounded-full bg-paper p-[2.5px]">
                    <span className="relative block size-[64px] overflow-hidden rounded-full bg-paper-2">
                      {image ? (
                        <ProductImage
                          src={image}
                          alt=""
                          sizes="72px"
                          priority={i < 5}
                          blurDataURL={item.image_url ? item.image_blur : null}
                        />
                      ) : null}
                    </span>
                  </span>
                  {item.isNew ? (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-paper bg-accent px-1.5 text-[9px] leading-[14px] font-extrabold tracking-wide text-accent-ink uppercase">
                      Yeni
                    </span>
                  ) : null}
                </span>
                <span className="w-full truncate text-center text-[11px] text-ink">{item.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open !== null ? (
        <StoryViewer
          items={items}
          start={open}
          siteName={siteName}
          avatarUrl={avatarUrl}
          onSeen={markSeen}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}

type ViewerProps = {
  items: StoryItem[];
  start: number;
  siteName: string;
  avatarUrl: string | null;
  onSeen: (id: string) => void;
  onClose: () => void;
};

/**
 * Tam ekran hikâye: üstte ilerleme çubukları, solda/sağda dokunuşla geçiş,
 * ortaya ya da "Ürüne git"e dokununca mağaza açılır. Basılı tutunca durur,
 * aşağı kaydırınca kapanır. Geri tuşu da kapatır.
 */
function StoryViewer({ items, start, siteName, avatarUrl, onSeen, onClose }: ViewerProps) {
  const [index, setIndex] = useState(start);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const closing = useRef(false);
  const item = items[index];
  const image = primaryImage(item);
  const next = items[index + 1];
  const nextImage = next ? primaryImage(next) : null;

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    // Açarken eklenen geçmiş kaydını geri al (Android geri tuşu da aynı yoldan gelir).
    if (window.history.state?.vitrinStory) window.history.back();
    else onClose();
  }, [onClose]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) setIndex(index + 1);
    else close();
  }, [close, index, items.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    onSeen(item.id);
  }, [item.id, onSeen]);

  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    window.history.pushState({ ...window.history.state, vitrinStory: true }, "");
    const onPop = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [close, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const goHref = `/go/${item.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${siteName} hikâyeleri`}
      className={cn("fixed inset-0 z-[60] bg-black text-white", paused && "story-paused")}
      style={{ ["--story-duration" as string]: `${STORY_MS}ms` }}
    >
      <div className="relative mx-auto flex h-full max-w-[480px] flex-col">
        {/* Üst: ilerleme çubukları + profil + kapat */}
        <div className="relative px-3 pt-[max(env(safe-area-inset-top),0.6rem)] pb-2">
          <div className="flex gap-1">
            {items.map((s, i) => (
              <span key={s.id} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/35">
                {i < index ? <span className="block h-full w-full bg-white" /> : null}
                {i === index ? (
                  <span key={`${s.id}-${index}`} className="story-progress block h-full bg-white" onAnimationEnd={goNext} />
                ) : null}
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 32 px profil fotoğrafı
              <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" />
            ) : (
              <span className="grid size-8 place-items-center rounded-full bg-accent font-serif text-[15px] text-accent-ink">
                {siteName.charAt(0).toLocaleUpperCase("tr")}
              </span>
            )}
            <span className="text-[13.5px] font-bold">{siteName}</span>
            <span className="text-[12.5px] text-white/70">{timeAgo(item.published_at)}</span>
            <span className="ml-auto flex items-center gap-1">
              <ShareButton path={`/p/${item.slug}`} title={item.title} tone="dark" />
              <button
                type="button"
                onClick={close}
                aria-label="Kapat"
                className="grid size-10 place-items-center rounded-full text-white"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </span>
          </div>
        </div>

        {/* Görsel: hikâyenin tamamı görünür; yazılar ve ürün kesiti kırpılmaz, üstü örtülmez. */}
        <div
          className="relative min-h-0 flex-1"
          onPointerDown={(e) => {
            pointerStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
            setPaused(true);
          }}
          onPointerUp={(e) => {
            setPaused(false);
            const s = pointerStart.current;
            pointerStart.current = null;
            if (s && e.clientY - s.y > 90) close();
          }}
          onPointerCancel={() => setPaused(false)}
        >
          {image ? (
            <ProductImage
              key={item.id}
              src={image}
              alt={item.title}
              sizes="(min-width: 480px) 480px, 100vw"
              priority
              fit="contain"
              blurDataURL={item.image_url ? item.image_blur : null}
            />
          ) : null}
          {nextImage ? (
            <span className="pointer-events-none absolute size-px overflow-hidden opacity-0" aria-hidden="true">
              <ProductImage src={nextImage} alt="" sizes="(min-width: 480px) 480px, 100vw" priority />
            </span>
          ) : null}
          {/* Dokunma alanları: sol = önceki, orta = ürünü aç, sağ = sonraki */}
          <div className="absolute inset-0 grid grid-cols-[30%_40%_30%]">
            <button type="button" aria-label="Önceki hikâye" onClick={goPrev} className="outline-none" />
            <a href={goHref} rel="sponsored nofollow" aria-label={`${item.title} — ürünü aç`} className="outline-none" />
            <button type="button" aria-label="Sonraki hikâye" onClick={goNext} className="outline-none" />
          </div>
        </div>

        {/* Alt: ürün bilgisi, reklam etiketi ve link */}
        <div className="relative px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <p className="text-[15px] leading-snug font-bold">{item.title}</p>
          {item.note ? <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/85">{item.note}</p> : null}
          <AdLabel store={item.store} isGift={item.is_gift} giftBrand={item.gift_brand} tone="dark" className="mt-2" />
          <a
            href={goHref}
            rel="sponsored nofollow"
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-bold text-ink active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
            </svg>
            Ürüne git · {storeName(item.store)}
          </a>
        </div>
      </div>
    </div>
  );
}

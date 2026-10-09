"use client";

import { ArrowRightIcon } from "@/components/icons";
import { useGoHref } from "@/lib/use-source";

/**
 * "Ürüne Git": her zaman /go/:id üzerinden gider (tıklama kaydı + 302).
 * Sayfa hikâye (?s=hikaye) ya da paylaşım (?s=paylasim) linkiyle açıldıysa kaynak korunur.
 */
export function GoButton({ productId, storeName }: { productId: string; storeName: string }) {
  const href = useGoHref(productId);
  return (
    <a
      href={href}
      rel="sponsored nofollow"
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-semibold text-accent-ink shadow-[0_8px_24px_-12px_rgba(166,90,64,0.7)] transition-transform active:scale-[0.98]"
    >
      Ürüne Git
      <ArrowRightIcon size={18} />
      <span className="sr-only"> ({storeName} sayfası açılır)</span>
    </a>
  );
}

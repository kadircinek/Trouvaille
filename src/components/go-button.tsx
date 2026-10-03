"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";

type Props = { productId: string; storeName: string };

function GoLink({ href, storeName }: { href: string; storeName: string }) {
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

function GoLinkWithSource({ productId, storeName }: Props) {
  const params = useSearchParams();
  const source = params.get("s");
  const href = source ? `/go/${productId}?s=${encodeURIComponent(source)}` : `/go/${productId}`;
  return <GoLink href={href} storeName={storeName} />;
}

/**
 * "Ürüne Git": her zaman /go/:id üzerinden gider (tıklama kaydı + 302).
 * Sayfa hikâye (?s=story) ya da paylaşım (?s=paylasim) linkiyle açıldıysa kaynak korunur.
 */
export function GoButton(props: Props) {
  return (
    <Suspense fallback={<GoLink href={`/go/${props.productId}`} storeName={props.storeName} />}>
      <GoLinkWithSource {...props} />
    </Suspense>
  );
}

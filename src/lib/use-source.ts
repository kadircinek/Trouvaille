"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

function readSource(): string | null {
  const value = new URLSearchParams(window.location.search).get("s");
  return value && /^[a-zâ-]{1,20}$/i.test(value) ? value : null;
}

/**
 * Sayfa hikâye (?s=hikaye) ya da paylaşım (?s=paylasim) linkiyle açıldıysa /go
 * linkine aynı kaynağı ekler; tıklama panelde doğru kaynağa yazılır.
 * Sunucuda ve ilk çizimde kaynaksız link döner (sayfa statik kalır).
 */
export function useGoHref(productId: string): string {
  const source = useSyncExternalStore(noop, readSource, () => null);
  return source ? `/go/${productId}?s=${encodeURIComponent(source)}` : `/go/${productId}`;
}

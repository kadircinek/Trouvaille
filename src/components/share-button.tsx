"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/icons";

/** Ürün linkini paylaşır; paylaşılan linkten gelen tıklamalar "paylaşım" olarak sayılır. */
export function ShareButton({ path, title, tone = "light" }: { path: string; title: string; tone?: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}?s=paylasim`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Linki kopyala:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={
        tone === "dark"
          ? "inline-flex size-10 items-center justify-center rounded-full text-white"
          : "inline-flex size-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur"
      }
      aria-label={copied ? "Link kopyalandı" : "Paylaş"}
    >
      {copied ? <CheckIcon size={18} /> : <ShareIcon size={18} />}
    </button>
  );
}

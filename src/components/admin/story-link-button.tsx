"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { displayUrl } from "@/lib/short-links";

/**
 * Hikâyedeki link çıkartması için kısa linki kopyalar. Bu linkten gelenlerin
 * mağaza tıklamaları panelde "Hikâye" olarak ayrı sayılır.
 */
export function StoryLinkButton({
  url,
  variant = "chip",
  label = "Hikâye linkini kopyala",
  copiedLabel = "Kopyalandı — hikâyedeki link çıkartmasına yapıştır",
}: {
  url: string;
  variant?: "chip" | "block";
  /** "block" görünümündeki başlık ve kopyalandıktan sonraki yazı. */
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Hikâye linkini kopyala:", url);
    }
  }

  if (variant === "block") {
    return (
      <button
        type="button"
        onClick={copy}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          {copied ? <CheckIcon size={17} /> : <LinkIcon size={17} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-ink">
            {copied ? copiedLabel : label}
          </span>
          <span className="block truncate text-[12.5px] text-ink-soft">{displayUrl(url)}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-medium",
        copied ? "border-success bg-success/10 text-success" : "border-line bg-white text-ink",
      )}
    >
      {copied ? <CheckIcon size={13} /> : <LinkIcon size={13} />}
      {copied ? "Kopyalandı" : "Hikâye linki"}
    </button>
  );
}

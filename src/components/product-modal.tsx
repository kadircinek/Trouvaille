"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/icons";

/** Akıştan açılan ürün detayı: tam ekran katman, geri tuşu/ESC ile kapanır. */
export function ProductModal({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-sheet-in fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-paper"
    >
      {children}
    </div>
  );
}

export function CloseModalButton({ label = "Vitrin" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex h-10 max-w-[60vw] items-center gap-1.5 rounded-full bg-paper/90 pr-3.5 pl-3 text-[13px] font-medium text-ink shadow-sm backdrop-blur"
    >
      <ArrowLeftIcon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

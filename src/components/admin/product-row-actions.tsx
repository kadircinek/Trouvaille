"use client";

import { useTransition, useState } from "react";
import { moveProduct, setProductPinned, setProductStatus } from "@/app/admin/actions";
import { ArrowDownIcon, ArrowUpIcon, PinIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { ProductStatus } from "@/lib/types";

type Props = { id: string; status: ProductStatus; pinned: boolean; isFirst: boolean; isLast: boolean };

export function ProductRowActions({ id, status, pinned, isFirst, isLast }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "İşlem yapılamadı.");
    });
  }

  const base = "inline-flex h-8 items-center gap-1 rounded-full border text-[12px] font-medium disabled:opacity-50";
  const small = cn(base, "border-line bg-white px-3 text-ink");
  const icon = cn(base, "border-line bg-white px-2 text-ink");

  return (
    <div className={cn("mt-2", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-1.5">
        {status === "published" ? (
          <>
            <button
              type="button"
              disabled={pending || isFirst}
              onClick={() => run(() => moveProduct(id, "up"))}
              className={icon}
              aria-label="Yukarı taşı"
            >
              <ArrowUpIcon size={15} />
            </button>
            <button
              type="button"
              disabled={pending || isLast}
              onClick={() => run(() => moveProduct(id, "down"))}
              className={icon}
              aria-label="Aşağı taşı"
            >
              <ArrowDownIcon size={15} />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setProductPinned(id, !pinned))}
              className={pinned ? cn(base, "border-ink bg-ink px-3 text-paper") : small}
            >
              <PinIcon size={13} /> {pinned ? "Sabit" : "Sabitle"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setProductStatus(id, "archived"))}
              className={small}
            >
              Arşivle
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setProductStatus(id, "published"))}
            className={cn(base, "border-accent bg-white px-3 text-accent")}
          >
            Yayına al
          </button>
        )}
      </div>
      {error ? <p className="mt-1 text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}

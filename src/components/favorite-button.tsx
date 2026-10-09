"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useFavorites } from "@/lib/favorites";

/** Kalp: ürünü bu cihazdaki favorilere ekler (üyelik gerekmez). */
export function FavoriteButton({
  productId,
  title,
  variant = "overlay",
  className,
}: {
  productId: string;
  title: string;
  /** overlay: ızgaradaki görselin üstünde · light: ürün sayfasının üst köşesinde */
  variant?: "overlay" | "light";
  className?: string;
}) {
  const { has, toggle } = useFavorites();
  const active = has(productId);
  const [pop, setPop] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `${title} favorilerden çıkar` : `${title} favorilere ekle`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (toggle(productId)) setPop((n) => n + 1);
      }}
      className={cn(
        "grid place-items-center rounded-full backdrop-blur-sm transition-colors",
        variant === "overlay" ? "size-8" : "size-10 shadow-sm",
        variant === "overlay" && !active && "bg-black/30 text-white",
        variant === "light" && !active && "bg-paper/90 text-ink",
        active && "bg-white/95 text-accent",
        className,
      )}
    >
      <HeartIcon
        key={pop}
        size={variant === "overlay" ? 16 : 19}
        filled={active}
        className={pop > 0 && active ? "animate-heart-pop" : undefined}
      />
    </button>
  );
}

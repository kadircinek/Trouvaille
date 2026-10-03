"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/cn";

export type GalleryImage = { src: string; blur?: string | null };

/**
 * Ürün görselleri: ablanın paylaştığı görsel + (varsa) mağazanın ürün fotoğrafı.
 * Birden fazla görselde parmakla kaydırılır.
 */
export function Gallery({ images, alt, aspect }: { images: GalleryImage[]; alt: string; aspect: number }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  if (images.length === 0) return <div className="w-full bg-paper-2" style={{ aspectRatio: aspect }} />;

  return (
    <div className="relative">
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== index) setIndex(i);
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((img, i) => (
          <div
            key={img.src}
            className="relative max-h-[72svh] w-full shrink-0 snap-center overflow-hidden bg-paper-2 sm:rounded-2xl"
            style={{ aspectRatio: aspect }}
          >
            <ProductImage
              src={img.src}
              alt={i === 0 ? alt : `${alt} — ürün fotoğrafı`}
              sizes="(min-width: 640px) 512px, 100vw"
              priority={i === 0}
              blurDataURL={img.blur}
              fit={i === 0 ? "cover" : "contain"}
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((img, i) => (
            <span
              key={img.src}
              className={cn(
                "h-1.5 rounded-full bg-paper shadow transition-all",
                i === index ? "w-4 opacity-100" : "w-1.5 opacity-60",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

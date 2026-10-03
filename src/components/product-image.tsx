import Image from "next/image";
import { isOptimizable } from "@/lib/image-hosts";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  blurDataURL?: string | null;
  fit?: "cover" | "contain";
  className?: string;
};

/**
 * Ürün görseli: next/image ile AVIF/WebP, otomatik boyut ve tembel yükleme.
 * Yüklenen görsellerde bulanık önizleme (blur placeholder) gösterilir.
 */
export function ProductImage({ src, alt, sizes, priority, blurDataURL, fit = "cover", className }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      unoptimized={!isOptimizable(src)}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL ?? undefined}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}

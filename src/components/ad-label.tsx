import { storeName } from "@/lib/stores";
import { cn } from "@/lib/cn";

type Props = {
  store: string;
  isGift?: boolean;
  giftBrand?: string | null;
  /** xs: 3 sütunlu ızgara, sm: varsayılan, md: detayda butonun hemen üstü. */
  size?: "xs" | "sm" | "md";
  /** Koyu zemin (hikâye görüntüleyici) üzerinde açık renk. */
  tone?: "light" | "dark";
  className?: string;
};

/**
 * Yasal reklam etiketi (Ticaret Bakanlığı Sosyal Medya Etkileyicileri Kılavuzu).
 * Her kartta, hikâyede ve ürün detayında gösterilir; admin tarafından kapatılamaz.
 */
export function AdLabel({ store, isGift, giftBrand, size = "sm", tone = "light", className }: Props) {
  const gift = isGift && giftBrand ? giftBrand.replace(/^@/, "") : null;
  const onDark = tone === "dark";
  return (
    <div
      className={cn(
        "leading-snug",
        onDark ? "text-white/85" : "text-ink-soft",
        size === "md" ? "text-[12px]" : size === "xs" ? "text-[10.5px]" : "text-[11px]",
        className,
      )}
    >
      <p>
        <span
          className={cn(
            "mr-1 inline-block rounded-[4px] border px-1 font-bold",
            onDark ? "border-white/80 text-white" : "border-ink/70 text-ink",
          )}
        >
          #Reklam
        </span>
        <span>{storeName(store)} ortaklık linki</span>
      </p>
      {gift ? <p className="mt-0.5">@{gift} tarafından hediye olarak alındı</p> : null}
    </div>
  );
}

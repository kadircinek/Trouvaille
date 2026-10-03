import { storeName } from "@/lib/stores";
import { cn } from "@/lib/cn";

type Props = {
  store: string;
  isGift?: boolean;
  giftBrand?: string | null;
  /** Ürün detayında, butonun hemen üstünde biraz daha büyük. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Yasal reklam etiketi (Ticaret Bakanlığı Sosyal Medya Etkileyicileri Kılavuzu).
 * Her kartta ve ürün detayında gösterilir; admin tarafından kapatılamaz.
 */
export function AdLabel({ store, isGift, giftBrand, size = "sm", className }: Props) {
  const gift = isGift && giftBrand ? giftBrand.replace(/^@/, "") : null;
  return (
    <div className={cn("leading-snug text-ink-soft", size === "md" ? "text-[12px]" : "text-[11px]", className)}>
      <p>
        <span className="mr-1 inline-block rounded-[4px] border border-ink/70 px-1 font-semibold text-ink">
          #Reklam
        </span>
        <span>{storeName(store)} ortaklık linki</span>
      </p>
      {gift ? <p className="mt-0.5">@{gift} tarafından hediye olarak alındı</p> : null}
    </div>
  );
}

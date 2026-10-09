import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { LinkStatus } from "@/lib/types";

const LABELS: Partial<Record<LinkStatus, string>> = {
  kirik: "Link kırık",
  stokta_yok: "Stokta yok",
};

/** Ürün listesinde günlük link kontrolünün uyarısı (yalnızca sorun varsa görünür). */
export function LinkStatusBadge({ status, note }: { status: LinkStatus | null; note: string | null }) {
  const label = status ? LABELS[status] : undefined;
  if (!label) return null;
  return (
    <span
      title={note ?? undefined}
      className={cn(
        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
        status === "kirik" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning",
      )}
    >
      <AlertIcon size={12} /> {label}
    </span>
  );
}

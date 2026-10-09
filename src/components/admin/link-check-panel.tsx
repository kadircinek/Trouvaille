"use client";

import { useState, useTransition } from "react";
import { recheckProductLink } from "@/app/admin/actions";
import { AlertIcon, CheckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { LinkStatus } from "@/lib/types";

const TEXT: Record<LinkStatus, string> = {
  ok: "Link çalışıyor",
  kirik: "Link kırık",
  stokta_yok: "Ürün stokta yok",
  bilinmiyor: "Kontrol edilemedi",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(iso));
}

type Props = { id: string; status: LinkStatus | null; note: string | null; checkedAt: string | null };

/** Ürün düzenleme sayfasında günlük link kontrolünün son sonucu + elle kontrol. */
export function LinkCheckPanel(props: Props) {
  const [state, setState] = useState({ status: props.status, note: props.note, checkedAt: props.checkedAt });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function recheck() {
    setError(null);
    startTransition(async () => {
      const result = await recheckProductLink(props.id);
      if (result.ok) setState(result.data);
      else setError(result.error);
    });
  }

  const problem = state.status === "kirik" || state.status === "stokta_yok";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3",
        problem ? "border-danger/30 bg-danger/5" : "border-line bg-white",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", problem ? "text-danger" : state.status === "ok" ? "text-success" : "text-muted")}>
        {state.status === "ok" ? <CheckIcon size={17} /> : <AlertIcon size={17} />}
      </span>
      <div className="min-w-0 flex-1 text-[13px]">
        <p className="font-semibold text-ink">{state.status ? TEXT[state.status] : "Link henüz kontrol edilmedi"}</p>
        {state.note ? <p className="text-ink-soft">{state.note}</p> : null}
        <p className="text-[12px] text-muted">
          {state.checkedAt ? `Son kontrol: ${formatDate(state.checkedAt)}` : "Her gün otomatik kontrol edilir."}
        </p>
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={recheck}
        disabled={pending}
        className="h-8 shrink-0 rounded-full border border-line bg-white px-3 text-[12px] font-medium text-ink disabled:opacity-60"
      >
        {pending ? "Bakılıyor…" : "Şimdi kontrol et"}
      </button>
    </div>
  );
}

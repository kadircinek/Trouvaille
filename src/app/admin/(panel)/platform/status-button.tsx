"use client";

import { useState, useTransition } from "react";
import { setCreatorStatus } from "./actions";

export function CreatorStatusButton({ id, status, name }: { id: string; status: "active" | "suspended"; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suspend = status === "active";

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (suspend && !window.confirm(`${name} vitrini askıya alınsın mı? Vitrin ve ürünleri herkesten gizlenir.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await setCreatorStatus(id, suspend ? "suspended" : "active");
            if (!result.ok) setError(result.error);
          });
        }}
        className={
          suspend
            ? "h-8 rounded-full border border-danger/40 bg-white px-3 text-[12px] font-medium text-danger disabled:opacity-50"
            : "h-8 rounded-full border border-success/40 bg-white px-3 text-[12px] font-medium text-success disabled:opacity-50"
        }
      >
        {pending ? "…" : suspend ? "Askıya al" : "Yeniden aç"}
      </button>
      {error ? <p className="mt-1 text-[11.5px] text-danger">{error}</p> : null}
    </div>
  );
}

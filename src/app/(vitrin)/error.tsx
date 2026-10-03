"use client";

import Link from "next/link";

export default function VitrinError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-2xl">Vitrin şu an açılamadı</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Birkaç saniye sonra tekrar dener misin?</p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-accent-ink"
        >
          Tekrar dene
        </button>
        <Link href="/" className="inline-flex h-12 items-center rounded-full border border-ink px-6 text-[15px] text-ink">
          Vitrin
        </Link>
      </div>
    </main>
  );
}

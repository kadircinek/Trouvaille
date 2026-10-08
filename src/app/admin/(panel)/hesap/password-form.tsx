"use client";

import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin-users";
import { changePassword, type PasswordChangeState } from "./actions";

const field =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink outline-none transition-colors focus:border-ink";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordChangeState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-3" key={state.ok ? "kaydedildi" : "form"}>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Yeni şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          className={field}
        />
        <p className="mt-1 text-[11.5px] text-muted">En az {MIN_PASSWORD_LENGTH} karakter.</p>
      </div>
      <div>
        <label htmlFor="repeat" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Yeni şifre (tekrar)
        </label>
        <input
          id="repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          className={field}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-[13px] text-danger">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-[13px] text-success">
          Şifren değiştirildi. Bir sonraki girişte yeni şifreni kullan.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-ink text-[15px] font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Şifreyi değiştir"}
      </button>
    </form>
  );
}

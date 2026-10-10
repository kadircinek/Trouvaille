"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin-users";
import { normalizeUsername } from "@/lib/usernames";
import { registerCreator, type RegisterState } from "./actions";

const field =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink outline-none transition-colors focus:border-ink";
const label = "mb-1.5 block text-[13px] font-semibold text-ink";

export function RegisterForm({ siteHost }: { siteHost: string }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerCreator, {});
  const [username, setUsername] = useState(state.values?.username ?? "");
  const preview = normalizeUsername(username) || "kullaniciadi";

  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="username" className={label}>
          Instagram kullanıcı adın
        </label>
        <input
          id="username"
          name="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="username"
          spellCheck={false}
          placeholder="@kullaniciadi"
          className={field}
        />
        <p className="mt-1.5 text-[12px] text-ink-soft">
          Vitrin adresin: <strong className="text-ink">{siteHost}/{preview}</strong>
        </p>
      </div>
      <div>
        <label htmlFor="display_name" className={label}>
          Vitrinde görünecek ad
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={state.values?.display_name}
          maxLength={60}
          placeholder="Ör. Shopbysac"
          className={field}
        />
      </div>
      <div>
        <label htmlFor="email" className={label}>
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
          className={field}
        />
        <p className="mt-1.5 text-[12px] text-muted">Vitrinde görünmez; yalnızca giriş ve şifre sıfırlama için.</p>
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={field}
        />
        <p className="mt-1.5 text-[12px] text-muted">En az {MIN_PASSWORD_LENGTH} karakter.</p>
      </div>
      <div>
        <label htmlFor="repeat" className={label}>
          Şifre (tekrar)
        </label>
        <input
          id="repeat"
          name="repeat"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={field}
        />
      </div>

      {/* Botlar için görünmez alan */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="website">Web sitesi</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-paper-2 px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
        <input type="checkbox" name="onay" required className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]" />
        <span>
          Vitrinime eklediğim linklerin satış ortaklığı (affiliate) linki olduğunu ve her üründe kapatılamayan{" "}
          <strong className="text-ink">#Reklam</strong> etiketi gösterileceğini kabul ediyorum.{" "}
          <Link href="/gizlilik" target="_blank" className="text-accent underline underline-offset-4">
            Gizlilik ve Aydınlatma Metni
          </Link>
          ’ni okudum.
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="text-[13.5px] text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-accent text-[15px] font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Vitrinin açılıyor…" : "Vitrinimi aç"}
      </button>
    </form>
  );
}

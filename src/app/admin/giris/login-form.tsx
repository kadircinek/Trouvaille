"use client";

import { useActionState, useState } from "react";
import { sendLoginCode, verifyLoginCode, type LoginState } from "./actions";

const inputBase =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-muted focus:border-ink";
const inputClass = `${inputBase} text-[16px]`;
const buttonClass =
  "h-12 w-full rounded-xl bg-ink text-[15px] font-semibold text-paper transition-opacity disabled:opacity-60";

export function LoginForm({ initialError }: { initialError?: string }) {
  // "Farklı e-posta" denince akışı baştan başlatmak için yeniden bağlanır.
  const [attempt, setAttempt] = useState(0);
  return (
    <LoginFlow
      key={attempt}
      initialError={attempt === 0 ? initialError : undefined}
      onRestart={() => setAttempt((n) => n + 1)}
    />
  );
}

function LoginFlow({ initialError, onRestart }: { initialError?: string; onRestart: () => void }) {
  const [sendState, sendAction, sending] = useActionState<LoginState, FormData>(sendLoginCode, {
    step: "email",
    error: initialError,
  });
  const [verifyState, verifyAction, verifying] = useActionState<LoginState, FormData>(verifyLoginCode, {
    step: "email",
  });

  if (sendState.step === "email") {
    return (
      <form action={sendAction} className="space-y-3">
        <label className="block text-[13px] font-medium text-ink-soft" htmlFor="email">
          E-posta adresin
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="ornek@mail.com"
          className={inputClass}
        />
        {sendState.error ? (
          <p role="alert" className="text-[13px] text-danger">
            {sendState.error}
          </p>
        ) : null}
        <button type="submit" disabled={sending} className={buttonClass}>
          {sending ? "Gönderiliyor…" : "Giriş kodu gönder"}
        </button>
      </form>
    );
  }

  const error = verifyState.error;

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-accent-soft/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink">
        {sendState.info} E-postadaki <strong>linke dokunabilir</strong> ya da <strong>kodu</strong> aşağıya
        yazabilirsin.
      </p>
      <form action={verifyAction} className="space-y-3">
        <input type="hidden" name="email" value={sendState.email} />
        <label className="block text-[13px] font-medium text-ink-soft" htmlFor="code">
          Giriş kodu ({sendState.email})
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={12}
          required
          autoFocus
          placeholder="123456"
          className={`${inputBase} text-center font-mono text-[22px] tracking-[0.3em]`}
        />
        {error ? (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={verifying} className={buttonClass}>
          {verifying ? "Kontrol ediliyor…" : "Giriş yap"}
        </button>
      </form>
      <button
        type="button"
        onClick={onRestart}
        className="w-full text-center text-[13px] text-ink-soft underline underline-offset-4"
      >
        Farklı e-posta / yeni kod iste
      </button>
    </div>
  );
}

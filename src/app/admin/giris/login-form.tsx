"use client";

import { useActionState, useState } from "react";
import {
  sendLoginCode,
  signInWithPassword,
  verifyLoginCode,
  type LoginState,
  type PasswordState,
} from "./actions";

const inputBase =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-muted focus:border-ink";
const inputClass = `${inputBase} text-[16px]`;
const buttonClass =
  "h-12 w-full rounded-xl bg-ink text-[15px] font-semibold text-paper transition-opacity disabled:opacity-60";

const linkButton = "w-full text-center text-[13px] text-ink-soft underline underline-offset-4";

/** Varsayılan: kullanıcı adı + şifre. Şifre unutulursa e-postaya gelen kodla giriş. */
export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  // "Farklı e-posta" denince kod akışı baştan başlasın diye yeniden bağlanır.
  const [attempt, setAttempt] = useState(0);

  if (mode === "password") {
    return <PasswordForm initialError={initialError} onForgot={() => setMode("code")} />;
  }
  return (
    <div className="space-y-5">
      <LoginFlow key={attempt} onRestart={() => setAttempt((n) => n + 1)} />
      <button type="button" onClick={() => setMode("password")} className={linkButton}>
        Kullanıcı adı ve şifreyle giriş
      </button>
    </div>
  );
}

function PasswordForm({ initialError, onForgot }: { initialError?: string; onForgot: () => void }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(signInWithPassword, {
    error: initialError,
  });
  return (
    <div className="space-y-5">
      <form action={action} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink-soft" htmlFor="identifier">
            Kullanıcı adı
          </label>
          <input
            id="identifier"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            defaultValue={state.identifier}
            placeholder="kullanıcı adı ya da e-posta"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink-soft" htmlFor="password">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
      <button type="button" onClick={onForgot} className={linkButton}>
        Şifremi unuttum · e-postaya kod gönder
      </button>
    </div>
  );
}

function LoginFlow({ onRestart }: { onRestart: () => void }) {
  const [sendState, sendAction, sending] = useActionState<LoginState, FormData>(sendLoginCode, {
    step: "email",
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

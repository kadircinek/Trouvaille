"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Platform = "unknown" | "standalone" | "ios" | "inapp" | "other";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function getPlatform(): Platform {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) return "standalone";
  const ua = nav.userAgent;
  if (/instagram|FBAN|FBAV|FB_IAB/i.test(ua)) return "inapp";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

const subscribeNoop = () => () => {};

/** PWA: ana ekrana ekleme ipucu (Android'de buton, iPhone'da kısa tarif). */
export function InstallHint() {
  const platform = useSyncExternalStore<Platform>(subscribeNoop, getPlatform, () => "unknown");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (platform === "unknown" || platform === "standalone" || installed) return null;

  if (deferred) {
    return (
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          setDeferred(null);
        }}
        className="mt-5 rounded-full border border-ink px-4 py-2 text-[13px] font-medium text-ink"
      >
        Vitrini ana ekrana ekle
      </button>
    );
  }

  if (platform === "ios") {
    return (
      <p className="mx-auto mt-5 max-w-xs text-[12px] text-muted">
        Vitrini uygulama gibi kullanmak için Safari’de <strong className="text-ink-soft">Paylaş</strong> →{" "}
        <strong className="text-ink-soft">Ana Ekrana Ekle</strong>’ye dokun.
      </p>
    );
  }

  if (platform === "inapp") {
    return (
      <p className="mx-auto mt-5 max-w-xs text-[12px] text-muted">
        Vitrini ana ekrana eklemek için sağ üstteki menüden <strong className="text-ink-soft">tarayıcıda aç</strong>.
      </p>
    );
  }

  return null;
}

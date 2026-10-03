"use client";

import { useEffect } from "react";

/** PWA servis çalışanını yalnızca üretimde kaydeder (bağlantı yokken çevrimdışı sayfası). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

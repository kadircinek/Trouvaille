"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Favoriler üyelik olmadan yalnızca bu cihazda (localStorage) tutulur.
const KEY = "vitrin:favoriler";
const EVENT = "vitrin:favoriler";
const MAX = 100;

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Favoriye ekler/çıkarır; eklenen en başa gelir. Eklendiyse true döner. */
export function toggleFavorite(id: string): boolean {
  const ids = parse(read());
  const has = ids.includes(id);
  const next = has ? ids.filter((x) => x !== id) : [id, ...ids].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Gizli sekme vb.: depolama yoksa favori bu oturumda tutulamaz.
  }
  window.dispatchEvent(new Event(EVENT));
  return !has;
}

/** Cihazdaki favoriler (en son eklenen önce). Sunucuda ve ilk çizimde boş. */
export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const ids = useMemo(() => parse(raw), [raw]);
  const set = useMemo(() => new Set(ids), [ids]);
  const has = useCallback((id: string) => set.has(id), [set]);
  return { ids, has, toggle: toggleFavorite };
}

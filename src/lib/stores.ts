export type Store = {
  id: string;
  name: string;
  /** Bu alan adları (ve alt alan adları) mağazaya aittir. */
  hosts: readonly string[];
};

// Yeni bir mağaza eklemek için bu listeye eklemek yeterli; veritabanı
// mağazayı serbest metin (ör. "trendyol") olarak saklar.
export const STORES: readonly Store[] = [
  { id: "trendyol", name: "Trendyol", hosts: ["trendyol.com", "ty.gl"] },
  { id: "hepsiburada", name: "Hepsiburada", hosts: ["hepsiburada.com"] },
];

export function getStore(id: string | null | undefined): Store | null {
  if (!id) return null;
  return STORES.find((s) => s.id === id) ?? null;
}

export function isStoreId(id: unknown): id is string {
  return typeof id === "string" && STORES.some((s) => s.id === id);
}

export function storeName(id: string): string {
  return getStore(id)?.name ?? id.charAt(0).toLocaleUpperCase("tr") + id.slice(1);
}

function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === domain || host.endsWith(`.${domain}`);
}

/** Linkin alan adından mağazayı bulur; tanınmazsa null. */
export function detectStoreFromUrl(url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  for (const store of STORES) {
    if (store.hosts.some((h) => hostMatches(hostname, h))) return store.id;
  }
  return null;
}

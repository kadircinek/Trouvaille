export type Category = { id: string; name: string };

// Kategori kimlikleri veritabanında saklanır; ad değişse bile kimlik sabit kalmalı.
export const CATEGORIES: readonly Category[] = [
  { id: "giyim", name: "Giyim" },
  { id: "ayakkabi", name: "Ayakkabı" },
  { id: "canta-aksesuar", name: "Çanta & Aksesuar" },
  { id: "kozmetik-bakim", name: "Kozmetik & Bakım" },
  { id: "ev", name: "Ev" },
];

export function getCategory(id: string | null | undefined): Category | null {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

export function isCategoryId(id: unknown): id is string {
  return typeof id === "string" && CATEGORIES.some((c) => c.id === id);
}

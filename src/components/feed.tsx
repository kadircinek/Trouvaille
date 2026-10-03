"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES, isCategoryId } from "@/lib/categories";
import { STORES, isStoreId } from "@/lib/stores";
import { cn } from "@/lib/cn";
import type { FeedPage, PublicProduct } from "@/lib/types";

type Filter = { category: string | null; store: string | null };
type Status = "idle" | "loading" | "error";

const NO_FILTER: Filter = { category: null, store: null };

function filterFromLocation(): Filter {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("kategori");
  const store = params.get("magaza");
  return {
    category: isCategoryId(category) ? category : null,
    store: isStoreId(store) ? store : null,
  };
}

function writeFilterToUrl(filter: Filter) {
  const url = new URL(window.location.href);
  url.searchParams.delete("kategori");
  url.searchParams.delete("magaza");
  if (filter.category) url.searchParams.set("kategori", filter.category);
  if (filter.store) url.searchParams.set("magaza", filter.store);
  window.history.replaceState(window.history.state, "", url);
}

function mergeUnique(a: PublicProduct[], b: PublicProduct[]): PublicProduct[] {
  const seen = new Set(a.map((p) => p.id));
  return [...a, ...b.filter((p) => !seen.has(p.id))];
}

/**
 * Vitrin akışı. İlk sayfa sunucuda hazırlanır (hızlı açılış); filtreler ve
 * sonsuz kaydırma /api/urunler üzerinden (CDN önbellekli) yüklenir.
 */
export function Feed({ initial }: { initial: FeedPage }) {
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [items, setItems] = useState<PublicProduct[]>(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [status, setStatus] = useState<Status>("idle");
  const requestId = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (f: Filter, offset: number) => {
    const id = ++requestId.current;
    setStatus("loading");
    const params = new URLSearchParams({ offset: String(offset) });
    if (f.category) params.set("kategori", f.category);
    if (f.store) params.set("magaza", f.store);
    try {
      const res = await fetch(`/api/urunler?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const page = (await res.json()) as FeedPage;
      if (id !== requestId.current) return;
      setItems((prev) => (offset === 0 ? page.items : mergeUnique(prev, page.items)));
      setHasMore(page.hasMore);
      setStatus("idle");
    } catch {
      if (id === requestId.current) setStatus("error");
    }
  }, []);

  const applyFilter = useCallback(
    (next: Filter) => {
      setFilter(next);
      writeFilterToUrl(next);
      if (!next.category && !next.store) {
        requestId.current++;
        setItems(initial.items);
        setHasMore(initial.hasMore);
        setStatus("idle");
        return;
      }
      setItems([]);
      setHasMore(false);
      void load(next, 0);
    },
    [initial, load],
  );

  // Paylaşılan filtreli link (ör. /?kategori=giyim) ile gelindiyse uygula.
  useEffect(() => {
    const fromUrl = filterFromLocation();
    if (fromUrl.category || fromUrl.store) {
      queueMicrotask(() => applyFilter(fromUrl));
    }
  }, [applyFilter]);

  // Sonsuz kaydırma: listenin sonu görünmeden ~1 ekran önce sonraki sayfayı iste.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || status !== "idle") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void load(filter, items.length);
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filter, hasMore, items.length, load, status]);

  const isFiltered = Boolean(filter.category || filter.store);

  return (
    <section aria-label="Ürünler">
      <div className="sticky top-0 z-20 -mx-px border-b border-line/70 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <nav aria-label="Kategoriler" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-2">
          <Chip active={!filter.category} onClick={() => applyFilter({ ...filter, category: null })}>
            Tümü
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={filter.category === c.id}
              onClick={() => applyFilter({ ...filter, category: filter.category === c.id ? null : c.id })}
            >
              {c.name}
            </Chip>
          ))}
        </nav>
        <div role="group" aria-label="Mağaza" className="flex items-center gap-4 px-4 pb-2.5 text-[12.5px]">
          <span className="text-muted">Mağaza:</span>
          {[{ id: null, name: "Hepsi" }, ...STORES].map((s) => {
            const active = filter.store === s.id;
            return (
              <button
                key={s.id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => applyFilter({ ...filter, store: s.id })}
                className={cn(
                  "underline-offset-4 transition-colors",
                  active ? "font-semibold text-ink underline decoration-accent decoration-2" : "text-ink-soft",
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4">
        {items.length > 0 ? <ProductGrid products={items} priorityCount={isFiltered ? 0 : 4} /> : null}

        {items.length === 0 && status === "loading" ? <GridSkeleton /> : null}

        {items.length === 0 && status === "idle" ? (
          <p className="py-16 text-center text-sm text-ink-soft">
            {isFiltered ? "Bu seçimde henüz ürün yok." : "Vitrin çok yakında dolacak."}
          </p>
        ) : null}

        {status === "error" ? (
          <div className="py-8 text-center text-sm text-ink-soft">
            Ürünler yüklenemedi.{" "}
            <button
              type="button"
              className="font-semibold text-accent underline underline-offset-4"
              onClick={() => void load(filter, items.length)}
            >
              Tekrar dene
            </button>
          </div>
        ) : null}

        {items.length > 0 && status === "loading" ? (
          <p className="py-6 text-center text-xs text-muted">Yükleniyor…</p>
        ) : null}

        <div ref={sentinel} aria-hidden="true" className="h-px" />
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors",
        active ? "border-ink bg-ink text-paper" : "border-line bg-transparent text-ink hover:border-ink/40",
      )}
    >
      {children}
    </button>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[9/16] animate-pulse rounded-xl bg-paper-2" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-paper-2" />
          <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-paper-2" />
        </li>
      ))}
    </ul>
  );
}

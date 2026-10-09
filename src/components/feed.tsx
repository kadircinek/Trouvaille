"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, HeartIcon, SearchIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES, isCategoryId } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useFavorites } from "@/lib/favorites";
import { MAX_QUERY_LENGTH } from "@/lib/search";
import { STORES, isStoreId } from "@/lib/stores";
import type { FeedPage, PublicProduct } from "@/lib/types";

type Filter = { category: string | null; store: string | null; q: string | null; favorites: boolean };
type Status = "idle" | "loading" | "error";

const NO_FILTER: Filter = { category: null, store: null, q: null, favorites: false };
const SEARCH_DELAY_MS = 300;

function filterFromLocation(): Filter {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("kategori");
  const store = params.get("magaza");
  const q = params.get("ara")?.trim().slice(0, MAX_QUERY_LENGTH) || null;
  return {
    category: isCategoryId(category) ? category : null,
    store: isStoreId(store) ? store : null,
    q,
    favorites: false,
  };
}

// Favoriler cihaza özel olduğu için adrese yazılmaz; kategori, mağaza ve arama paylaşılabilir.
function writeFilterToUrl(filter: Filter) {
  const url = new URL(window.location.href);
  for (const key of ["kategori", "magaza", "ara"]) url.searchParams.delete(key);
  if (filter.category) url.searchParams.set("kategori", filter.category);
  if (filter.store) url.searchParams.set("magaza", filter.store);
  if (filter.q) url.searchParams.set("ara", filter.q);
  window.history.replaceState(window.history.state, "", url);
}

function isDefault(f: Filter): boolean {
  return !f.category && !f.store && !f.q && !f.favorites;
}

function mergeUnique(a: PublicProduct[], b: PublicProduct[]): PublicProduct[] {
  const seen = new Set(a.map((p) => p.id));
  return [...a, ...b.filter((p) => !seen.has(p.id))];
}

/**
 * Vitrin akışı. İlk sayfa sunucuda hazırlanır (hızlı açılış); filtreler, arama,
 * favoriler ve sonsuz kaydırma /api/urunler üzerinden (CDN önbellekli) yüklenir.
 */
export function Feed({
  initial,
  categories,
  stores,
}: {
  initial: FeedPage;
  /** Yalnızca ürünü olan kategoriler ve mağazalar gösterilir. */
  categories: string[];
  stores: string[];
}) {
  const favorites = useFavorites();
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [items, setItems] = useState<PublicProduct[]>(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [status, setStatus] = useState<Status>("idle");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const requestId = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (f: Filter, offset: number) => {
      const id = ++requestId.current;
      setStatus("loading");
      const params = new URLSearchParams({ offset: String(offset) });
      if (f.favorites) {
        params.set("ids", favorites.ids.join(","));
      } else {
        if (f.category) params.set("kategori", f.category);
        if (f.store) params.set("magaza", f.store);
        if (f.q) params.set("ara", f.q);
      }
      try {
        const res = await fetch(`/api/urunler?${params}`);
        if (!res.ok) throw new Error(String(res.status));
        const page = (await res.json()) as FeedPage;
        if (id !== requestId.current) return;
        if (f.favorites) {
          // Favoriler eklenme sırasıyla (en son beğenilen önce).
          const order = new Map(favorites.ids.map((fid, i) => [fid, i]));
          page.items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
          page.hasMore = false;
        }
        setItems((prev) => (offset === 0 ? page.items : mergeUnique(prev, page.items)));
        setHasMore(page.hasMore);
        setStatus("idle");
      } catch {
        if (id === requestId.current) setStatus("error");
      }
    },
    [favorites.ids],
  );

  const applyFilter = useCallback(
    (next: Filter) => {
      setFilter(next);
      writeFilterToUrl(next);
      if (isDefault(next)) {
        requestId.current++;
        setItems(initial.items);
        setHasMore(initial.hasMore);
        setStatus("idle");
        return;
      }
      setItems([]);
      setHasMore(false);
      if (next.favorites && favorites.ids.length === 0) {
        requestId.current++;
        setStatus("idle");
        return;
      }
      void load(next, 0);
    },
    [favorites.ids.length, initial, load],
  );

  // Paylaşılan filtreli link (ör. /?kategori=giyim, /?ara=elbise) ile gelindiyse uygula.
  useEffect(() => {
    const fromUrl = filterFromLocation();
    if (isDefault(fromUrl)) return;
    queueMicrotask(() => {
      if (fromUrl.q) {
        setSearchOpen(true);
        setSearchText(fromUrl.q);
      }
      applyFilter(fromUrl);
    });
    // Yalnızca ilk açılışta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Yazarken kısa bir bekleme sonrası ara.
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchText.trim().slice(0, MAX_QUERY_LENGTH) || null;
    if (q === filter.q) return;
    const timer = setTimeout(() => applyFilter({ ...filter, q, favorites: false }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [applyFilter, filter, searchOpen, searchText]);

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

  function openSearch() {
    setSearchOpen(true);
    if (filter.favorites) applyFilter({ ...filter, favorites: false });
    requestAnimationFrame(() => searchInput.current?.focus());
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchText("");
    if (filter.q) applyFilter({ ...filter, q: null });
  }

  // Favoriler aramadan ve filtrelerden bağımsız bir görünüm.
  function toggleFavoritesView() {
    if (filter.favorites) {
      applyFilter(NO_FILTER);
      return;
    }
    setSearchOpen(false);
    setSearchText("");
    applyFilter({ ...NO_FILTER, favorites: true });
  }

  // Favorilerdeyken kalbi kaldırılan ürün listeden hemen çıkar.
  const visible = useMemo(
    () => (filter.favorites ? items.filter((p) => favorites.has(p.id)) : items),
    [favorites, filter.favorites, items],
  );
  const isFiltered = !isDefault(filter);

  return (
    <section aria-label="Ürünler">
      <div className="sticky top-0 z-20 border-y border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        {searchOpen ? (
          <div className="flex items-center gap-2 px-4 pt-2.5">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-paper-2 px-3.5 text-ink-soft">
              <SearchIcon size={16} className="shrink-0" />
              <span className="sr-only">Ürün ya da marka ara</span>
              <input
                ref={searchInput}
                type="search"
                enterKeyHint="search"
                value={searchText}
                maxLength={MAX_QUERY_LENGTH}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") closeSearch();
                }}
                placeholder="Ürün ya da marka ara"
                className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
              />
            </label>
            <button
              type="button"
              onClick={closeSearch}
              className="inline-flex h-9 shrink-0 items-center gap-1 px-1 text-[13px] font-semibold text-ink"
            >
              <CloseIcon size={15} /> Kapat
            </button>
          </div>
        ) : null}

        <nav aria-label="Kategoriler" className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5">
          {!searchOpen ? (
            <button
              type="button"
              onClick={openSearch}
              aria-label="Ara"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-2 text-ink hover:bg-line"
            >
              <SearchIcon size={16} />
            </button>
          ) : null}
          <Chip active={filter.favorites} onClick={toggleFavoritesView}>
            <HeartIcon size={13} filled={filter.favorites} className="-ml-0.5" />
            Favoriler{favorites.ids.length > 0 ? ` ${favorites.ids.length}` : ""}
          </Chip>
          <Chip
            active={!filter.category && !filter.favorites}
            onClick={() => applyFilter({ ...filter, category: null, favorites: false })}
          >
            Tümü
          </Chip>
          {CATEGORIES.filter((c) => categories.includes(c.id) || filter.category === c.id).map((c) => (
            <Chip
              key={c.id}
              active={filter.category === c.id && !filter.favorites}
              onClick={() =>
                applyFilter({ ...filter, favorites: false, category: filter.category === c.id ? null : c.id })
              }
            >
              {c.name}
            </Chip>
          ))}
        </nav>
        {stores.length > 1 && !filter.favorites ? (
          <div role="group" aria-label="Mağaza" className="flex items-center gap-4 px-4 pb-2.5 text-[12.5px]">
            <span className="text-muted">Mağaza:</span>
            {[{ id: null, name: "Hepsi" }, ...STORES.filter((st) => stores.includes(st.id))].map((s) => {
              const active = filter.store === s.id;
              return (
                <button
                  key={s.id ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyFilter({ ...filter, store: s.id })}
                  className={cn(
                    "underline-offset-4 transition-colors",
                    active ? "font-bold text-ink underline decoration-accent decoration-2" : "text-ink-soft",
                  )}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="pt-0.5">
        {visible.length > 0 ? <ProductGrid products={visible} priorityCount={isFiltered ? 0 : 6} /> : null}

        {visible.length === 0 && status === "loading" ? <GridSkeleton /> : null}

        {visible.length === 0 && status === "idle" ? <EmptyState filter={filter} /> : null}

        {status === "error" ? (
          <div className="px-4 py-8 text-center text-sm text-ink-soft">
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

        {visible.length > 0 && status === "loading" ? (
          <p className="py-6 text-center text-xs text-muted">Yükleniyor…</p>
        ) : null}

        <div ref={sentinel} aria-hidden="true" className="h-px" />
      </div>
    </section>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  if (filter.favorites) {
    return (
      <div className="px-8 py-16 text-center">
        <HeartIcon size={28} className="mx-auto text-accent" />
        <p className="mt-3 font-serif text-xl text-ink">Henüz favorin yok</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
          Beğendiğin ürünlerdeki kalbe dokun, burada saklansın. Favoriler yalnızca bu telefonda tutulur.
        </p>
      </div>
    );
  }
  return (
    <p className="px-4 py-16 text-center text-sm text-ink-soft">
      {filter.q
        ? `“${filter.q}” için ürün bulunamadı.`
        : isDefault(filter)
          ? "Vitrin çok yakında dolacak."
          : "Bu seçimde henüz ürün yok."}
    </p>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
        active ? "bg-ink text-paper" : "bg-paper-2 text-ink hover:bg-line",
      )}
    >
      {children}
    </button>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-3 gap-x-0.5 gap-y-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[9/16] animate-pulse bg-paper-2" />
          <div className="mx-1.5 mt-1.5 h-2.5 w-3/4 animate-pulse rounded bg-paper-2" />
        </li>
      ))}
    </ul>
  );
}

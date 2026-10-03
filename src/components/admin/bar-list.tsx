const NUM = new Intl.NumberFormat("tr-TR");

export type BarItem = { key: string; label: string; value: number };

/** Kırılım listesi: yatay çubuklar, değer çubuğun ucunda, metin her zaman metin renginde. */
export function BarList({ items, total }: { items: BarItem[]; total: number }) {
  if (items.length === 0) return <p className="text-[13px] text-muted">Bu dönemde tıklama yok.</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.key}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate text-ink">{item.label}</span>
              <span className="shrink-0 text-ink-soft tabular-nums">
                <span className="font-semibold text-ink">{NUM.format(item.value)}</span> · %{share}
              </span>
            </div>
            <div className="mt-1.5 h-2">
              <div
                className="h-full rounded-r-[4px] bg-accent/80"
                style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

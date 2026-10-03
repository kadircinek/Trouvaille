"use client";

import { useState } from "react";

type Point = { day: string; clicks: number };

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const NUM = new Intl.NumberFormat("tr-TR");

function label(day: string) {
  return DATE.format(new Date(`${day}T00:00:00Z`));
}

/** Son 30 günün günlük tıklamaları: tek seri sütun grafik, sütun başına ipucu. */
export function DailyChart({ data }: { data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const peak = data.reduce((best, d, i) => (d.clicks > data[best].clicks ? i : best), 0);
  const shown = active ?? null;

  return (
    <figure className="m-0">
      <div className="relative h-36" onPointerLeave={() => setActive(null)}>
        {/* İpucu: değer önde, tarih arkada */}
        {shown !== null ? (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-center whitespace-nowrap text-paper shadow-lg"
            style={{ left: `${((shown + 0.5) / data.length) * 100}%` }}
          >
            <span className="block text-[13px] font-semibold">{NUM.format(data[shown].clicks)} tıklama</span>
            <span className="block text-[11px] opacity-75">{label(data[shown].day)}</span>
          </div>
        ) : null}

        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-line" role="list">
          {data.map((d, i) => {
            const height = d.clicks === 0 ? 0 : Math.max(3, (d.clicks / max) * 100);
            const isPeak = i === peak && d.clicks > 0;
            return (
              <button
                key={d.day}
                type="button"
                role="listitem"
                aria-label={`${label(d.day)}: ${d.clicks} tıklama`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(i)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                {isPeak ? (
                  <span
                    className="absolute text-[10.5px] font-semibold text-ink-soft tabular-nums"
                    style={{ bottom: `calc(${height}% + 3px)` }}
                  >
                    {NUM.format(d.clicks)}
                  </span>
                ) : null}
                <span
                  className={`block w-full max-w-6 rounded-t-[4px] transition-opacity ${
                    active === null || active === i ? "opacity-100" : "opacity-45"
                  } ${i === data.length - 1 ? "bg-accent" : "bg-accent/75"} group-focus-visible:outline-2 group-focus-visible:outline-ink`}
                  style={{ height: `${height}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <figcaption className="mt-1.5 flex justify-between text-[11px] text-muted tabular-nums">
        <span>{data[0] ? label(data[0].day) : ""}</span>
        <span>Bugün</span>
      </figcaption>
      <details className="mt-3 text-[12.5px] text-ink-soft">
        <summary className="cursor-pointer select-none">Tablo olarak gör</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-medium">Gün</th>
              <th className="py-1 text-right font-medium">Tıklama</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <tr key={d.day} className="border-t border-line/70">
                <td className="py-1">{label(d.day)}</td>
                <td className="py-1 text-right text-ink">{NUM.format(d.clicks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

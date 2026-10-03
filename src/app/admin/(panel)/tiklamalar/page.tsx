import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/admin/bar-list";
import { DailyChart } from "@/components/admin/daily-chart";
import { requireAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { getDashboard } from "@/lib/data/admin";
import { storeName } from "@/lib/stores";

export const metadata: Metadata = { title: "Tıklamalar" };

const PERIODS = [
  { days: 1, label: "Bugün" },
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  vitrin: "Vitrin",
  hikaye: "Instagram hikâyesi",
  paylasim: "Paylaşılan link",
};

const NUM = new Intl.NumberFormat("tr-TR");

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3.5 py-3">
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p className="mt-1 text-[24px] leading-none font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-4", className)}>
      <h2 className="mb-3 text-[14px] font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default async function ClicksPage({ searchParams }: PageProps<"/admin/tiklamalar">) {
  const params = await searchParams;
  const days = PERIODS.find((p) => String(p.days) === params.gun)?.days ?? 30;
  const admin = await requireAdmin();
  const { summary, period, daily } = await getDashboard(admin, days);
  const periodLabel = PERIODS.find((p) => p.days === days)!.label.toLocaleLowerCase("tr");

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-[26px]">Tıklamalar</h1>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Bugün" value={NUM.format(summary.today)} />
        <StatTile label="7 gün" value={NUM.format(summary.week)} />
        <StatTile label="30 gün" value={NUM.format(summary.month)} />
      </div>

      <Card title="Son 30 gün, günlük">
        <DailyChart data={daily} />
        <p className="mt-3 text-[11.5px] text-muted">
          30 günde {NUM.format(summary.visitors_month)} tekil ziyaretçi tıkladı. Bot ve link önizleme istekleri (
          {NUM.format(summary.bots_month)}) sayılara dahil değil.
        </p>
      </Card>

      {/* Dönem filtresi: altındaki her şeyi kapsar */}
      <nav aria-label="Dönem" className="flex gap-2 pt-2">
        {PERIODS.map((p) => (
          <Link
            key={p.days}
            href={`/admin/tiklamalar?gun=${p.days}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[13px] font-medium",
              p.days === days ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label={`Tıklama (${periodLabel})`}
          value={NUM.format(period.clicks)}
          hint={`${NUM.format(period.visitors)} tekil ziyaretçi`}
        />
        <StatTile
          label="24 saatten eski ürünlere"
          value={period.old_share === null ? "—" : `%${NUM.format(period.old_share)}`}
          hint="Hikâye kaybolduktan sonra gelen tıklamaların payı"
        />
      </div>

      <Card title={`En çok tıklanan 10 ürün (${periodLabel})`}>
        {period.top.length === 0 ? (
          <p className="text-[13px] text-muted">Bu dönemde tıklama yok.</p>
        ) : (
          <ol className="space-y-3">
            {period.top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-right text-[12px] text-muted tabular-nums">{i + 1}</span>
                <Link href={`/admin/urun/${p.id}`} className="relative h-14 w-8 shrink-0 overflow-hidden rounded-md bg-paper-2">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- küçük önizleme
                    <img src={p.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/admin/urun/${p.id}`} className="truncate text-[13px] text-ink">
                      {p.title}
                    </Link>
                    <span className="shrink-0 text-[13px] font-semibold text-ink tabular-nums">{NUM.format(p.clicks)}</span>
                  </div>
                  <div className="mt-1 h-1.5">
                    <div
                      className="h-full rounded-r-[4px] bg-accent/80"
                      style={{ width: `${Math.max(3, (p.clicks / period.top[0].clicks) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {storeName(p.store)}
                    {p.status === "archived" ? " · arşivde" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="Mağazaya göre">
        <BarList
          total={period.clicks}
          items={period.by_store.map((r) => ({ key: r.key ?? "-", label: storeName(r.key ?? "-"), value: r.clicks }))}
        />
      </Card>

      <Card title="Kategoriye göre">
        <BarList
          total={period.clicks}
          items={period.by_category.map((r) => ({
            key: r.key ?? "yok",
            label: getCategory(r.key)?.name ?? "Kategorisiz",
            value: r.clicks,
          }))}
        />
      </Card>

      <Card title="Kaynağa göre">
        <BarList
          total={period.clicks}
          items={period.by_source.map((r) => ({
            key: r.key ?? "-",
            label: SOURCE_LABELS[r.key ?? ""] ?? r.key ?? "-",
            value: r.clicks,
          }))}
        />
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePanel } from "@/lib/auth";
import { listPlatformCreators } from "@/lib/data/admin";
import { CreatorStatusButton } from "./status-button";

export const metadata: Metadata = { title: "Platform" };

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Istanbul" });

/** Platform yöneticisi: kayıtlı vitrinler; uygunsuz içerikte askıya alma. */
export default async function PlatformPage() {
  const session = await requirePanel();
  if (!session.isAdmin) redirect("/admin");
  const creators = await listPlatformCreators(session);
  const active = creators.filter((c) => c.status === "active").length;

  return (
    <div>
      <h1 className="font-serif text-[26px]">Platform</h1>
      <p className="mt-1 mb-5 text-[13px] text-ink-soft">
        {creators.length} vitrin · {active} aktif. Askıya alınan vitrin ve ürünleri herkesten gizlenir; sahibi panele
        giremez.
      </p>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {creators.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3">
            {c.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- küçük profil fotoğrafı
              <img src={c.avatar_url} alt="" className="size-10 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-serif text-[18px] text-accent-ink">
                {c.display_name.charAt(0).toLocaleUpperCase("tr")}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">
                {c.display_name}
                {c.status === "suspended" ? (
                  <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                    Askıda
                  </span>
                ) : null}
              </p>
              <p className="truncate text-[12px] text-ink-soft">
                <Link href={`/${c.username}`} target="_blank" className="underline underline-offset-2">
                  /{c.username}
                </Link>
                {c.instagram ? ` · @${c.instagram}` : ""} · {c.published} ürün · {DATE.format(new Date(c.created_at))}
              </p>
            </div>
            {c.id === session.creator?.id ? (
              <span className="shrink-0 text-[12px] text-muted">Senin vitrinin</span>
            ) : (
              <CreatorStatusButton id={c.id} status={c.status} name={c.display_name} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

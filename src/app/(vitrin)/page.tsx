import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { SiteFooter } from "@/components/site-footer";
import { CreatorAvatar } from "@/components/site-header";
import { site } from "@/config/site";
import { listCreatorCards, type CreatorCard } from "@/lib/data/creators";

// Platform ana sayfası: vitrinler ve influencerlara davet. 60 sn'de bir tazelenir.
export const revalidate = 60;

const STEPS = [
  {
    title: "Hikâyendeki ürünü ekle",
    text: "Paylaştığın görseli seç, Trendyol ya da Hepsiburada linkini yapıştır. Ürün adı kendiliğinden gelir.",
  },
  {
    title: "Vitrinin hemen hazır",
    text: "Hikâyen 24 saatte kaybolur, vitrinin kalır. Adresini Instagram biyografine koy.",
  },
  {
    title: "Neyin tıklandığını gör",
    text: "Hangi ürüne kaç kişi dokundu, hikâyeden mi vitrinden mi geldi; hepsi panelinde.",
  },
];

export default async function PlatformHomePage() {
  const cards = await listCreatorCards();

  return (
    <>
      <main className="mx-auto max-w-[935px]">
        <header className="px-5 pt-10 pb-8 text-center">
          <p className="font-serif text-[44px] leading-none tracking-tight text-ink">{site.name}</p>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ink-soft">{site.tagline}</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href="/kayit"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-accent-ink shadow-[0_8px_24px_-12px_rgba(166,90,64,0.7)]"
            >
              Ücretsiz vitrinini aç <ArrowRightIcon size={17} />
            </Link>
            <Link href="/admin/giris" className="text-[13px] text-ink-soft underline underline-offset-4">
              Zaten vitrinin var mı? Giriş yap
            </Link>
          </div>
        </header>

        <section aria-labelledby="vitrinler" className="border-t border-line px-4 pt-7">
          <h2 id="vitrinler" className="mb-4 px-1 font-serif text-[24px] text-ink">
            Vitrinler
          </h2>
          {cards.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <li key={card.creator.id}>
                  <CreatorCardView card={card} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-[14px] text-ink-soft">
              İlk vitrin seninki olsun.
            </p>
          )}
        </section>

        <section aria-labelledby="nasil" className="mt-12 px-5">
          <h2 id="nasil" className="font-serif text-[24px] text-ink">
            Influencer mısın?
          </h2>
          <p className="mt-1.5 text-[14px] text-ink-soft">Hikâyelerinde paylaştığın linkler kaybolmasın.</p>
          <ol className="mt-5 space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-serif text-[16px] text-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/kayit"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-paper"
          >
            Vitrinini aç <ArrowRightIcon size={17} />
          </Link>
        </section>
      </main>
      <SiteFooter disclosure={false} />
    </>
  );
}

function CreatorCardView({ card }: { card: CreatorCard }) {
  const { creator } = card;
  return (
    <Link
      href={`/${creator.username}`}
      className="block overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center gap-3 p-3.5">
        <CreatorAvatar src={creator.avatar_url} name={creator.display_name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[19px] leading-tight text-ink">{creator.display_name}</p>
          <p className="truncate text-[12.5px] text-ink-soft">
            {creator.instagram ? `@${creator.instagram} · ` : ""}
            {card.productCount} ürün
          </p>
        </div>
        <ArrowRightIcon size={18} className="shrink-0 text-muted" />
      </div>
      {card.previews.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5">
          {card.previews.map((p) => (
            <div key={p.id} className="relative aspect-[9/16] bg-paper-2">
              <ProductImage src={p.image} alt="" sizes="(min-width: 640px) 150px, 33vw" blurDataURL={p.blur} />
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

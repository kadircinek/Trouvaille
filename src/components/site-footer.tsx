import Link from "next/link";
import { InstallHint } from "@/components/install-hint";
import { DISCLOSURE_TEXT, instagramUrl, site } from "@/config/site";
import type { PublicCreator } from "@/lib/types";

/**
 * Sayfa altı. Vitrin ve ürün sayfalarında reklam notu + o influencer'ın Instagram'ı;
 * her sayfada platform adı ve "Sen de vitrinini aç" daveti.
 */
export function SiteFooter({ creator, disclosure = true }: { creator?: PublicCreator | null; disclosure?: boolean }) {
  const ig = instagramUrl(creator?.instagram);
  return (
    <footer className="mt-12 border-t border-line px-6 pt-8 pb-10 text-center text-[12px] leading-relaxed text-ink-soft">
      {disclosure ? (
        <p className="mx-auto max-w-sm">
          <span className="font-semibold text-ink">#Reklam</span> · {DISCLOSURE_TEXT}
        </p>
      ) : null}
      {creator ? <InstallHint /> : null}
      <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-ink">
        <Link href="/gizlilik" className="underline-offset-4 hover:underline">
          Gizlilik ve Aydınlatma Metni
        </Link>
        {ig ? (
          <a href={ig} className="underline-offset-4 hover:underline">
            Instagram
          </a>
        ) : null}
        <Link href="/kayit" className="underline-offset-4 hover:underline">
          Sen de vitrinini aç
        </Link>
      </nav>
      <p className="mt-4 font-serif text-[15px] text-ink">
        <Link href="/">{site.name}</Link>
      </p>
    </footer>
  );
}

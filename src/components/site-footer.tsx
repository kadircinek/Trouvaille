import Link from "next/link";
import { InstallHint } from "@/components/install-hint";
import { DISCLOSURE_TEXT, instagramUrl, site } from "@/config/site";

export function SiteFooter() {
  const ig = instagramUrl();
  return (
    <footer className="mt-12 border-t border-line px-6 pt-8 pb-10 text-center text-[12px] leading-relaxed text-ink-soft">
      <p className="mx-auto max-w-sm">
        <span className="font-semibold text-ink">#Reklam</span> · {DISCLOSURE_TEXT}
      </p>
      <InstallHint />
      <nav className="mt-5 flex items-center justify-center gap-4 text-ink">
        <Link href="/gizlilik" className="underline-offset-4 hover:underline">
          Gizlilik ve Aydınlatma Metni
        </Link>
        {ig ? (
          <a href={ig} className="underline-offset-4 hover:underline">
            Instagram
          </a>
        ) : null}
      </nav>
      <p className="mt-4 font-serif text-[15px] text-ink">{site.name}</p>
    </footer>
  );
}

import Image from "next/image";
import { InstagramIcon } from "@/components/icons";
import { DISCLOSURE_TEXT, instagramUrl, site } from "@/config/site";

export function DisclosureBar() {
  return (
    <p className="bg-paper-2 px-4 py-2 text-center text-[11.5px] leading-snug text-ink-soft">
      <span className="font-semibold text-ink">#Reklam</span> · {DISCLOSURE_TEXT}
    </p>
  );
}

function Avatar() {
  if (site.avatar) {
    return (
      <Image
        src={site.avatar}
        alt={site.name}
        width={76}
        height={76}
        preload
        unoptimized={!site.avatar.startsWith("/")}
        className="size-[76px] shrink-0 rounded-full object-cover ring-1 ring-line ring-offset-[3px] ring-offset-paper"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-[76px] shrink-0 place-items-center rounded-full bg-accent font-serif text-[34px] text-accent-ink ring-1 ring-line ring-offset-[3px] ring-offset-paper"
    >
      {site.name.charAt(0).toLocaleUpperCase("tr")}
    </span>
  );
}

/** Sayfanın üstü: Instagram profili gibi; ablanın kişisel butiği hissi. */
export function SiteHeader() {
  const ig = instagramUrl();
  return (
    <header className="flex items-center gap-4 px-5 pt-6 pb-5 sm:justify-center">
      <Avatar />
      <div className="min-w-0">
        <h1 className="font-serif text-[27px] leading-tight text-ink">{site.name}</h1>
        <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">{site.tagline}</p>
        {ig ? (
          <a
            href={ig}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12.5px] text-ink transition-colors hover:border-ink/40"
          >
            <InstagramIcon size={14} />@{site.instagram}
          </a>
        ) : null}
      </div>
    </header>
  );
}

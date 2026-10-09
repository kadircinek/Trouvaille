import Image from "next/image";
import { InstagramIcon } from "@/components/icons";
import { DISCLOSURE_TEXT, instagramUrl, site } from "@/config/site";
import { isOptimizable } from "@/lib/image-hosts";

export function DisclosureBar() {
  return (
    <p className="bg-ink px-4 py-1.5 text-center text-[11px] leading-snug text-paper/85">
      <span className="font-bold text-paper">#Reklam</span> · {DISCLOSURE_TEXT}
    </p>
  );
}

function Avatar({ src }: { src: string | null }) {
  return (
    <span className="story-ring shrink-0 rounded-full p-[3px]">
      <span className="block rounded-full bg-paper p-[3px]">
        {src ? (
          <Image
            src={src}
            alt={site.name}
            width={84}
            height={84}
            preload
            unoptimized={!isOptimizable(src)}
            className="size-[84px] rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-[84px] place-items-center rounded-full bg-accent font-serif text-[40px] text-accent-ink"
          >
            {site.name.charAt(0).toLocaleUpperCase("tr")}
          </span>
        )}
      </span>
    </span>
  );
}

/** Sayfanın üstü: Instagram profili gibi; takipçi tanıdık bir yere geldiğini hisseder. */
export function SiteHeader({
  productCount,
  categoryCount,
  avatarUrl,
}: {
  productCount: number;
  categoryCount: number;
  /** Panelden yüklenen profil fotoğrafı; yoksa adın baş harfi. */
  avatarUrl: string | null;
}) {
  const ig = instagramUrl();
  return (
    <header className="px-4 pt-5 pb-4">
      <div className="flex items-center gap-5">
        <Avatar src={avatarUrl} />
        <div className="min-w-0">
          <h1 className="font-serif text-[30px] leading-[1.05] font-medium tracking-tight text-ink">{site.name}</h1>
          <dl className="mt-2 flex gap-5 text-[12.5px] text-ink-soft">
            <div>
              <dt className="sr-only">Ürün</dt>
              <dd>
                <strong className="text-[15px] font-extrabold text-ink">{productCount}</strong> ürün
              </dd>
            </div>
            <div>
              <dt className="sr-only">Kategori</dt>
              <dd>
                <strong className="text-[15px] font-extrabold text-ink">{categoryCount}</strong> kategori
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="mt-3.5 text-[14px] leading-relaxed text-ink-soft">{site.tagline}</p>
      {ig ? (
        <a
          href={ig}
          className="mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-paper-2 text-[13.5px] font-bold text-ink transition-colors hover:bg-line"
        >
          <InstagramIcon size={17} /> Instagram’da takip et · @{site.instagram}
        </a>
      ) : null}
    </header>
  );
}

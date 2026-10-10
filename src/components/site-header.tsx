import Image from "next/image";
import { InstagramIcon } from "@/components/icons";
import { DISCLOSURE_TEXT, instagramUrl } from "@/config/site";
import { isOptimizable } from "@/lib/image-hosts";
import type { PublicCreator } from "@/lib/types";

export function DisclosureBar() {
  return (
    <p className="bg-ink px-4 py-1.5 text-center text-[11px] leading-snug text-paper/85">
      <span className="font-bold text-paper">#Reklam</span> · {DISCLOSURE_TEXT}
    </p>
  );
}

export function CreatorAvatar({
  src,
  name,
  size = 84,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  return (
    <span className="story-ring shrink-0 rounded-full p-[3px]">
      <span className="block rounded-full bg-paper p-[3px]">
        {src ? (
          <Image
            src={src}
            alt={name}
            width={size}
            height={size}
            preload={size >= 84}
            unoptimized={!isOptimizable(src)}
            className="rounded-full object-cover"
            style={{ width: size, height: size }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid place-items-center rounded-full bg-accent font-serif text-accent-ink"
            style={{ width: size, height: size, fontSize: Math.round(size * 0.48) }}
          >
            {name.charAt(0).toLocaleUpperCase("tr")}
          </span>
        )}
      </span>
    </span>
  );
}

/** Vitrinin üstü: Instagram profili gibi; takipçi tanıdık bir yere geldiğini hisseder. */
export function SiteHeader({
  creator,
  productCount,
  categoryCount,
}: {
  creator: PublicCreator;
  productCount: number;
  categoryCount: number;
}) {
  const ig = instagramUrl(creator.instagram);
  return (
    <header className="px-4 pt-5 pb-4">
      <div className="flex items-center gap-5">
        <CreatorAvatar src={creator.avatar_url} name={creator.display_name} />
        <div className="min-w-0">
          <h1 className="font-serif text-[30px] leading-[1.05] font-medium tracking-tight break-words text-ink">
            {creator.display_name}
          </h1>
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
      {creator.bio ? <p className="mt-3.5 text-[14px] leading-relaxed whitespace-pre-line text-ink-soft">{creator.bio}</p> : null}
      {ig ? (
        <a
          href={ig}
          className="mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-paper-2 text-[13.5px] font-bold text-ink transition-colors hover:bg-line"
        >
          <InstagramIcon size={17} /> Instagram’da takip et · @{creator.instagram}
        </a>
      ) : null}
    </header>
  );
}

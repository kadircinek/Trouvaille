import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InstagramShareButton } from "@/components/admin/instagram-share";
import { LinkCheckPanel } from "@/components/admin/link-check-panel";
import { ProductForm } from "@/components/admin/product-form";
import { StoryLinkButton } from "@/components/admin/story-link-button";
import { ArrowLeftIcon } from "@/components/icons";
import { requireCreator } from "@/lib/auth";
import { getProduct } from "@/lib/data/admin";
import { shortLinkUrl } from "@/lib/short-links";
import { primaryImage } from "@/lib/types";

export const metadata: Metadata = { title: "Ürünü düzenle" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({ params }: PageProps<"/admin/urun/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const session = await requireCreator();
  const product = await getProduct(session, id);
  // Platform yöneticisi de başkasının ürününü görebilir (RLS); düzenleme yalnızca kendi vitrininden.
  if (!product || product.creator_id !== session.creator.id) notFound();

  return (
    <div>
      <Link href={`/admin?durum=${product.status}`} className="inline-flex items-center gap-1 text-[13px] text-ink-soft">
        <ArrowLeftIcon size={16} /> Ürünler
      </Link>
      <h1 className="mt-2 mb-5 font-serif text-[26px]">Ürünü düzenle</h1>
      {product.status === "published" ? (
        <div className="mb-5 space-y-2.5">
          <StoryLinkButton url={shortLinkUrl(product.short_code)} variant="block" />
          {primaryImage(product) ? (
            <InstagramShareButton
              image={primaryImage(product)!}
              title={product.title}
              slug={product.slug}
              storyUrl={shortLinkUrl(product.short_code)}
              variant="block"
            />
          ) : null}
          <LinkCheckPanel
            id={product.id}
            status={product.link_status}
            note={product.link_check_note}
            checkedAt={product.link_checked_at}
          />
        </div>
      ) : null}
      <ProductForm product={product} creatorId={session.creator.id} />
    </div>
  );
}

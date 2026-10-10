import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "@/components/feed";
import { SiteFooter } from "@/components/site-footer";
import { DisclosureBar, SiteHeader } from "@/components/site-header";
import { Stories } from "@/components/stories";
import { site } from "@/config/site";
import { getFeedPage, getStoryProducts, getVitrinFacets } from "@/lib/data/catalog";
import { getCreatorByUsername } from "@/lib/data/creators";

// Vitrinler ilk ziyarette üretilip önbelleğe alınır, en geç 60 sn'de bir tazelenir;
// influencer ürün eklediğinde/düzenlediğinde ayrıca anında yenilenir (revalidatePath).
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[kullanici]">): Promise<Metadata> {
  const { kullanici } = await params;
  const creator = await getCreatorByUsername(kullanici);
  if (!creator) return { title: "Vitrin bulunamadı" };
  const description = creator.bio ?? `${creator.display_name} hikâyelerinde paylaştığı ürünler.`;
  return {
    title: { absolute: `${creator.display_name} · ${site.name}` },
    description,
    alternates: { canonical: `/${creator.username}` },
    openGraph: {
      type: "profile",
      url: `/${creator.username}`,
      title: creator.display_name,
      description,
      images: creator.avatar_url ? [{ url: creator.avatar_url, alt: creator.display_name }] : undefined,
    },
  };
}

export default async function CreatorPage({ params }: PageProps<"/[kullanici]">) {
  const { kullanici } = await params;
  const creator = await getCreatorByUsername(kullanici);
  if (!creator) notFound();

  const [feed, stories, facets] = await Promise.all([
    getFeedPage({ creatorId: creator.id }),
    getStoryProducts(creator.id),
    getVitrinFacets(creator.id),
  ]);
  return (
    <>
      <DisclosureBar />
      <main className="mx-auto max-w-[935px]">
        <SiteHeader creator={creator} productCount={facets.total} categoryCount={facets.categories.length} />
        <Stories items={stories} siteName={creator.display_name} avatarUrl={creator.avatar_url} />
        <Feed creatorId={creator.id} initial={feed} categories={facets.categories} stores={facets.stores} />
      </main>
      <SiteFooter creator={creator} />
    </>
  );
}

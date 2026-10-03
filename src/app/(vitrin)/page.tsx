import { Feed } from "@/components/feed";
import { SiteFooter } from "@/components/site-footer";
import { DisclosureBar, SiteHeader } from "@/components/site-header";
import { Stories } from "@/components/stories";
import { site } from "@/config/site";
import { getFeedPage, getStoryProducts, getVitrinFacets } from "@/lib/data/catalog";

// Sayfa statik üretilir ve en geç 60 sn'de bir tazelenir; admin ürün
// eklediğinde/düzenlediğinde ayrıca anında yenilenir (revalidatePath).
export const revalidate = 60;

export default async function HomePage() {
  const [feed, stories, facets] = await Promise.all([getFeedPage(), getStoryProducts(), getVitrinFacets()]);
  return (
    <>
      <DisclosureBar />
      <main className="mx-auto max-w-[935px]">
        <SiteHeader productCount={facets.total} categoryCount={facets.categories.length} />
        <Stories items={stories} siteName={site.name} />
        <Feed initial={feed} categories={facets.categories} stores={facets.stores} />
      </main>
      <SiteFooter />
    </>
  );
}

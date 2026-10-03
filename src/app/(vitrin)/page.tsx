import { Feed } from "@/components/feed";
import { NewStrip } from "@/components/new-strip";
import { SiteFooter } from "@/components/site-footer";
import { DisclosureBar, SiteHeader } from "@/components/site-header";
import { getFeedPage, getNewProducts } from "@/lib/data/catalog";

// Sayfa statik üretilir ve en geç 60 sn'de bir tazelenir; admin ürün
// eklediğinde/düzenlediğinde ayrıca anında yenilenir (revalidatePath).
export const revalidate = 60;

export default async function HomePage() {
  const [feed, fresh] = await Promise.all([getFeedPage(), getNewProducts()]);
  return (
    <>
      <DisclosureBar />
      <main className="mx-auto max-w-5xl">
        <SiteHeader />
        <NewStrip products={fresh} />
        <Feed initial={feed} />
      </main>
      <SiteFooter />
    </>
  );
}

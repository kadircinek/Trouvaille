import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { instagramUrl, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Gizlilik ve Aydınlatma Metni",
  description: `${site.name} vitrininin gizlilik ve KVKK aydınlatma metni.`,
};

const UPDATED_AT = "4 Ekim 2026";

export default function PrivacyPage() {
  const ig = instagramUrl();
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <>
      <main className="mx-auto max-w-2xl px-5 pt-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
          <ArrowLeftIcon size={16} /> Vitrine dön
        </Link>
        <h1 className="mt-5 font-serif text-[30px] leading-tight">Gizlilik ve Aydınlatma Metni</h1>
        <p className="mt-1 text-[12px] text-muted">Son güncelleme: {UPDATED_AT}</p>

        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-ink [&_strong]:text-ink">
          <p>
            Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında, <strong>{site.name}</strong>{" "}
            vitrinini ziyaret ettiğinizde hangi bilgilerin nasıl işlendiğini açıklar. Vitrinde üyelik yoktur ve sizden
            ad, e-posta, telefon gibi hiçbir kişisel bilgi istenmez.
          </p>

          <h2>Reklam ve satış ortaklığı</h2>
          <p>
            Bu sayfadaki ürün linkleri Trendyol ve Hepsiburada satış ortaklığı (affiliate) linkleridir. Bir linke
            tıklayıp alışveriş yaptığınızda <strong>{site.name}</strong> komisyon kazanabilir; ödediğiniz fiyat
            değişmez. Bu nedenle tüm ürünler <strong>#Reklam</strong> olarak işaretlenmiştir. Bir markanın hediye
            ettiği ürünlerde bu ayrıca belirtilir. Satış, ödeme ve teslimat tamamen ilgili mağaza tarafından
            yürütülür.
          </p>

          <h2>Hangi bilgiler kaydediliyor?</h2>
          <p>Yalnızca “Ürüne Git” butonuna dokunduğunuzda, hangi ürünlerin ilgi gördüğünü ölçmek için şu bilgiler kaydedilir:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>tıklanan ürün ve tıklama zamanı,</li>
            <li>tıklamanın kaynağı (vitrin, Instagram hikâyesi veya paylaşılan link),</li>
            <li>cihaz türü (iPhone, Android, bilgisayar) ve uygulama içi tarayıcı adı (ör. Instagram),</li>
            <li>barındırma sağlayıcısının bildirdiği ülke kodu (ör. TR),</li>
            <li>
              IP adresiniz ve tarayıcı bilginizden üretilen, geri çevrilemeyen <strong>tuzlanmış bir özet</strong>{" "}
              (hash). <strong>IP adresiniz saklanmaz;</strong> özet yalnızca tekil ziyaretçi sayısını hesaplamak için
              kullanılır.
            </li>
          </ul>
          <p>
            Ayrıca sayfa görüntülenme sayıları, çerez kullanmayan ve kişiyi tanımlamayan Vercel Web Analytics ile
            toplu olarak ölçülür.
          </p>

          <h2>Çerezler</h2>
          <p>
            Vitrin, ziyaretçileri izlemek için çerez kullanmaz; bu yüzden çerez onayı istenmez. Bir ürün linkine
            tıkladığınızda açılan Trendyol veya Hepsiburada sayfası, satış ortaklığı komisyonunu takip etmek için kendi
            çerezlerini kullanabilir; bu çerezler ilgili mağazanın gizlilik politikasına tabidir.
          </p>

          <h2>Amaç ve hukuki sebep</h2>
          <p>
            Bilgiler, vitrinin ve satış ortaklığı linklerinin performansını ölçmek ve içeriği iyileştirmek amacıyla,
            KVKK madde 5/2-f uyarınca veri sorumlusunun meşru menfaati kapsamında işlenir. Bu bilgiler satılmaz ve
            reklam amacıyla üçüncü kişilerle paylaşılmaz.
          </p>

          <h2>Saklama ve aktarım</h2>
          <p>
            Kayıtlar, hizmet sağlayıcılarımız Supabase (veritabanı) ve Vercel (barındırma) altyapısında, yurt dışında
            bulunabilen sunucularda en fazla 2 yıl saklanır, ardından silinir veya anonim hale getirilir.
          </p>

          <h2>Haklarınız</h2>
          <p>
            KVKK’nın 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya
            silinmesini isteme gibi haklara sahipsiniz. Talepleriniz için{" "}
            {contactEmail ? (
              <a className="text-accent underline underline-offset-4" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            ) : ig ? (
              <a className="text-accent underline underline-offset-4" href={ig}>
                Instagram üzerinden
              </a>
            ) : (
              "Instagram üzerinden"
            )}{" "}
            bize ulaşabilirsiniz.
          </p>

          <h2>Veri sorumlusu</h2>
          <p>
            <strong>{site.name}</strong>
            {ig ? (
              <>
                {" "}
                (<a className="text-accent underline underline-offset-4" href={ig}>@{site.instagram}</a>)
              </>
            ) : null}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

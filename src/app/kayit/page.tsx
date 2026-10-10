import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { getPanelSession } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Vitrinini aç",
  description: `${site.name}'da ücretsiz vitrinini aç: hikâyelerinde paylaştığın ürünler kaybolmasın.`,
};

export default async function RegisterPage() {
  const session = await getPanelSession();
  if (session?.creator) redirect("/admin");

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <Link href="/" className="font-serif text-[22px] text-ink">
        {site.name}
      </Link>
      <h1 className="mt-6 font-serif text-[32px] leading-tight">Vitrinini aç</h1>
      <p className="mt-2 mb-7 text-[14px] leading-relaxed text-ink-soft">
        Hikâyelerinde paylaştığın Trendyol ve Hepsiburada linkleri 24 saatte kaybolmasın. Ücretsiz; vitrinin hemen
        yayında.
      </p>
      <RegisterForm siteHost={site.url.replace(/^https?:\/\//, "")} />
      <p className="mt-8 text-center text-[13.5px] text-ink-soft">
        Zaten vitrinin var mı?{" "}
        <Link href="/admin/giris" className="font-semibold text-accent underline underline-offset-4">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import Link from "next/link";
import { getPanelSession } from "@/lib/auth";
import { signOut } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  link: "Link geçersiz ya da süresi dolmuş. Yeni bir kod iste.",
  yetki: "Bu hesapla açılmış bir vitrin yok.",
  askida: "Bu vitrin askıya alındı. Bilgi için platform yöneticisine yaz.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/giris">) {
  const params = await searchParams;
  const errorKey = typeof params.hata === "string" ? params.hata : undefined;

  const session = await getPanelSession();
  if (session) redirect(session.creator ? "/admin" : "/admin/platform");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Vitrin paneli</p>
      <h1 className="mt-1 font-serif text-[32px] leading-tight">
        <Link href="/">{site.name}</Link>
      </h1>
      <p className="mt-2 mb-8 text-[14px] text-ink-soft">Kullanıcı adın ve şifrenle giriş yap.</p>
      <LoginForm initialError={errorKey ? ERRORS[errorKey] : undefined} />
      <p className="mt-8 text-center text-[13.5px] text-ink-soft">
        Vitrinin yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-accent underline underline-offset-4">
          Ücretsiz vitrinini aç
        </Link>
      </p>
      {errorKey === "yetki" || errorKey === "askida" ? (
        <form action={signOut} className="mt-6 text-center">
          <button type="submit" className="text-[13px] text-ink-soft underline underline-offset-4">
            Oturumu kapat
          </button>
        </form>
      ) : null}
    </main>
  );
}

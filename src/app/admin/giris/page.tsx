import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { getAdmin } from "@/lib/auth";
import { signOut } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Yönetim girişi",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  link: "Link geçersiz ya da süresi dolmuş. Yeni bir kod iste.",
  yetki: "Bu hesabın yönetim yetkisi yok.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/giris">) {
  const params = await searchParams;
  const errorKey = typeof params.hata === "string" ? params.hata : undefined;

  const admin = await getAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Yönetim</p>
      <h1 className="mt-1 font-serif text-[32px] leading-tight">{site.name}</h1>
      <p className="mt-2 mb-8 text-[14px] text-ink-soft">
        E-postana gelen kodla ya da linkle giriş yap. Şifre yok.
      </p>
      <LoginForm initialError={errorKey ? ERRORS[errorKey] : undefined} />
      {errorKey === "yetki" ? (
        <form action={signOut} className="mt-6 text-center">
          <button type="submit" className="text-[13px] text-ink-soft underline underline-offset-4">
            Oturumu kapat
          </button>
        </form>
      ) : null}
    </main>
  );
}

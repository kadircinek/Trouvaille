import type { Metadata } from "next";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { signOut } from "../../giris/actions";
import { AvatarForm } from "./avatar-form";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Hesabım" };

export default async function AccountPage({ searchParams }: PageProps<"/admin/hesap">) {
  const { sifre } = await searchParams;
  const admin = await requireAdmin();
  const [{ data }, { data: settings }] = await Promise.all([
    createServiceClient().from("admins").select("username").eq("email", admin.email).maybeSingle(),
    admin.supabase.from("site_settings").select("avatar_url").maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-[26px]">Hesabım</h1>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Vitrindeki profil fotoğrafı</h2>
        <AvatarForm
          current={(settings?.avatar_url as string | null | undefined) ?? null}
          initial={site.name.charAt(0).toLocaleUpperCase("tr")}
        />
      </section>

      <dl className="divide-y divide-line rounded-2xl border border-line bg-white text-[14px]">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">Kullanıcı adı</dt>
          <dd className="font-semibold text-ink">{data?.username ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">E-posta</dt>
          <dd className="min-w-0 truncate text-ink">{admin.email}</dd>
        </div>
      </dl>

      <section id="sifre" className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Şifreyi değiştir</h2>
        {sifre === "yeni" ? (
          <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2.5 text-[13px] text-ink">
            E-postadaki kodla giriş yaptın. Şifreni unuttuysan buradan yeni bir şifre belirle.
          </p>
        ) : null}
        <PasswordForm />
      </section>

      <form action={signOut}>
        <button type="submit" className="w-full text-center text-[13px] text-ink-soft underline underline-offset-4">
          Çıkış yap
        </button>
      </form>
    </div>
  );
}

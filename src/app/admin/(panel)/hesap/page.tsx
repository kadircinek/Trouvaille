import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { signOut } from "../../giris/actions";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Hesabım" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  const { data } = await createServiceClient()
    .from("admins")
    .select("username")
    .eq("email", admin.email)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-[26px]">Hesabım</h1>

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

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Şifreyi değiştir</h2>
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

import type { Metadata } from "next";
import { StoryLinkButton } from "@/components/admin/story-link-button";
import { site } from "@/config/site";
import { requirePanel } from "@/lib/auth";
import { signOut } from "../../giris/actions";
import { AvatarForm } from "./avatar-form";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Hesabım" };

export default async function AccountPage({ searchParams }: PageProps<"/admin/hesap">) {
  const { sifre } = await searchParams;
  const { creator, email } = await requirePanel();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-[26px]">Hesabım</h1>

      {creator ? (
        <>
          <section className="space-y-3">
            <StoryLinkButton
              url={`${site.url}/${creator.username}`}
              variant="block"
              label="Vitrin adresin"
              copiedLabel="Kopyalandı — Instagram biyografine yapıştır"
            />
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-ink">Profil fotoğrafı</h2>
            <AvatarForm
              creatorId={creator.id}
              current={creator.avatar_url}
              initial={creator.display_name.charAt(0).toLocaleUpperCase("tr")}
            />
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-ink">Vitrin bilgileri</h2>
            <ProfileForm displayName={creator.display_name} bio={creator.bio} instagram={creator.instagram} />
          </section>
        </>
      ) : null}

      <dl className="divide-y divide-line rounded-2xl border border-line bg-white text-[14px]">
        {creator ? (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-ink-soft">Kullanıcı adı</dt>
            <dd className="font-semibold text-ink">{creator.username}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">E-posta</dt>
          <dd className="min-w-0 truncate text-ink">{email}</dd>
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

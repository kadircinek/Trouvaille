"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

const field =
  "w-full rounded-xl border border-line bg-white px-4 text-[16px] text-ink outline-none transition-colors focus:border-ink";

/** Vitrinin üstünde görünen ad, açıklama ve Instagram. */
export function ProfileForm({
  displayName,
  bio,
  instagram,
}: {
  displayName: string;
  bio: string | null;
  instagram: string | null;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="display_name" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Vitrinde görünecek ad
        </label>
        <input id="display_name" name="display_name" defaultValue={displayName} maxLength={60} required className={`${field} h-12`} />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Kısa açıklama
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={300}
          rows={3}
          placeholder="Ör. Hikâyelerimde paylaştığım parçalar kaybolmasın diye hepsi burada."
          className={`${field} py-3 leading-relaxed`}
        />
      </div>
      <div>
        <label htmlFor="instagram" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Instagram kullanıcı adı
        </label>
        <input
          id="instagram"
          name="instagram"
          defaultValue={instagram ?? ""}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="@kullaniciadi"
          className={`${field} h-12`}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-[13px] text-danger">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-[13px] text-success">
          Kaydedildi, vitrinde görünüyor.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-ink text-[15px] font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

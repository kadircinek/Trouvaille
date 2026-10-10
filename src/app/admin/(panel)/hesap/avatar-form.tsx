"use client";

import { useRef, useState, useTransition } from "react";
import { newAvatarPath, prepareAvatar } from "@/lib/image-client";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/browser";
import { saveAvatar } from "./actions";

/** Vitrindeki halkalı profil fotoğrafı: telefondan seçilir, kare kırpılıp yüklenir. */
export function AvatarForm({
  creatorId,
  current,
  initial,
}: {
  creatorId: string;
  current: string | null;
  initial: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = uploading || pending;

  async function onFile(file: File) {
    setError(null);
    setSaved(false);
    setUploading(true);
    try {
      const blob = await prepareAvatar(file);
      const supabase = createClient();
      const path = newAvatarPath(creatorId);
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      save(data.publicUrl, URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message.startsWith("Lütfen") ? err.message : "Fotoğraf yüklenemedi, tekrar dene.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function save(url: string | null, localPreview: string | null = null) {
    startTransition(async () => {
      const result = await saveAvatar(url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(localPreview);
      setSaved(true);
    });
  }

  return (
    <div className="flex items-center gap-4">
      <span className="story-ring shrink-0 rounded-full p-[3px]">
        <span className="block rounded-full bg-paper p-[2px]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- yerel önizleme (blob:) ya da küçük profil fotoğrafı
            <img src={preview} alt="Profil fotoğrafı" className="size-[64px] rounded-full object-cover" />
          ) : (
            <span className="grid size-[64px] place-items-center rounded-full bg-accent font-serif text-[30px] text-accent-ink">
              {initial}
            </span>
          )}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          id="avatar"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor="avatar"
            className={`inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-4 text-[13.5px] font-semibold text-paper ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            {busy ? "Yükleniyor…" : preview ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
          </label>
          {preview && !busy ? (
            <button
              type="button"
              onClick={() => save(null)}
              className="inline-flex h-10 items-center rounded-full border border-line px-4 text-[13.5px] text-ink-soft"
            >
              Kaldır
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-1.5 text-[12.5px] text-danger">
            {error}
          </p>
        ) : saved ? (
          <p role="status" className="mt-1.5 text-[12.5px] text-success">
            Kaydedildi, vitrinde görünüyor.
          </p>
        ) : (
          <p className="mt-1.5 text-[12px] text-muted">Ortadan kare kırpılır. Instagram profil fotoğrafın olabilir.</p>
        )}
      </div>
    </div>
  );
}

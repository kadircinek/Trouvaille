// Tarayıcıda (admin panelinde) görseli küçültüp sıkıştırır: telefondan
// seçilen 5–10 MB'lık fotoğraf ~200–400 KB JPEG olur, hızlı yüklenir.
// Ziyaretçiye ayrıca next/image ile AVIF/WebP olarak sunulur.

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 2000;
const QUALITY = 0.82;

export type PreparedImage = {
  blob: Blob;
  width: number;
  height: number;
  /** Bulanık önizleme için küçük base64 JPEG (≈ 0,5 KB). */
  blur: string;
};

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Görsel işlenemedi"))), type, quality),
  );
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("Lütfen bir fotoğraf seç.");
  }
  let source: Awaited<ReturnType<typeof decode>>;
  try {
    source = await decode(file);
  } catch {
    throw new Error("Bu görsel açılamadı. JPEG veya PNG bir fotoğraf dene.");
  }

  const scale = Math.min(1, MAX_WIDTH / source.width, MAX_HEIGHT / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source && typeof source.close === "function") source.close();

  const blob = await toBlob(canvas, "image/jpeg", QUALITY);

  const tiny = document.createElement("canvas");
  tiny.width = 12;
  tiny.height = Math.max(1, Math.round((12 * height) / width));
  tiny.getContext("2d")?.drawImage(canvas, 0, 0, tiny.width, tiny.height);
  const blur = tiny.toDataURL("image/jpeg", 0.6);

  return { blob, width, height, blur };
}

const AVATAR_SIZE = 480;

/** Profil fotoğrafı: ortadan kare kırpılır, 480×480 JPEG olur. */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("Lütfen bir fotoğraf seç.");
  }
  let source: Awaited<ReturnType<typeof decode>>;
  try {
    source = await decode(file);
  } catch {
    throw new Error("Bu görsel açılamadı. JPEG veya PNG bir fotoğraf dene.");
  }
  const side = Math.min(source.width, source.height);
  const size = Math.min(AVATAR_SIZE, side);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, size, size);
  if ("close" in source && typeof source.close === "function") source.close();
  return toBlob(canvas, "image/jpeg", 0.85);
}

export function newAvatarPath(): string {
  return `profil/${crypto.randomUUID()}.jpg`;
}

export function newImagePath(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}/${month}/${crypto.randomUUID()}.jpg`;
}

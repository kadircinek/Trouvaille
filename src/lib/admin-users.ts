// Yönetici kullanıcı adları: küçük harf, rakam, nokta, alt çizgi, tire; 3–32 karakter.
// Veritabanındaki admins_username_format kuralıyla aynı.
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export const MIN_PASSWORD_LENGTH = 8;

export type LoginIdentifier = { kind: "email"; email: string } | { kind: "username"; username: string };

/** Giriş kutusuna yazılanı e-posta ya da kullanıcı adı olarak ayırır (baştaki @ yok sayılır). */
export function parseLoginIdentifier(input: string): LoginIdentifier | null {
  const value = input.trim().toLocaleLowerCase("tr").replace(/^@+/, "");
  if (!value) return null;
  if (value.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? { kind: "email", email: value } : null;
  }
  // Türkçe büyük İ → i dönüşümünden sonra kalan noktalı karakterleri sadeleştir.
  const username = value.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  return USERNAME_PATTERN.test(username) ? { kind: "username", username } : null;
}

export function passwordProblem(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  if (password.length > 72) return "Şifre en fazla 72 karakter olabilir.";
  if (password !== repeat) return "Şifreler birbirini tutmuyor.";
  return null;
}

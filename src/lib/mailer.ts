import "server-only";
import nodemailer from "nodemailer";

// Giriş / şifre sıfırlama e-postaları uygulamanın kendi SMTP ayarıyla gider
// (iCloud, Gmail, Resend …). Ayar yoksa Supabase'in kendi e-posta servisi kullanılır.
//   SMTP_HOST, SMTP_PORT (587 ya da 465), SMTP_USER, SMTP_PASSWORD, SMTP_FROM

/** Kullanıcı adı verildiyse şifresi de girilmiş olmalı; yarım ayarla Supabase'e düşülür. */
export function mailerConfigured(): boolean {
  const { SMTP_HOST, SMTP_FROM, SMTP_USER, SMTP_PASSWORD } = process.env;
  return Boolean(SMTP_HOST && SMTP_FROM && (!SMTP_USER || SMTP_PASSWORD));
}

export async function sendMail(message: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, ...message });
}

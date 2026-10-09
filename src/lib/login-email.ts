function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

/** "Şifremi unuttum" e-postası: 6 haneli kod + tek dokunuşla giriş linki. */
export function loginEmail({ siteName, code, link }: { siteName: string; code: string; link: string }) {
  const subject = `${siteName} yönetim paneli giriş kodun: ${code}`;
  const text = [
    `${siteName} yönetim paneline giriş kodun: ${code}`,
    "",
    `Ya da bu linke dokun: ${link}`,
    "",
    "Girdikten sonra Hesabım sayfasından yeni şifreni belirleyebilirsin.",
    "Kod 1 saat geçerlidir. Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.",
  ].join("\n");
  const name = escapeHtml(siteName);
  const html = `<!doctype html>
<html lang="tr"><body style="margin:0;background:#fbf8f4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1f1a17">
  <div style="max-width:440px;margin:0 auto;padding:32px 24px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a7f78">Yönetim paneli</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:normal;font-size:28px">${name}</h1>
    <p style="margin:0 0 8px;font-size:15px">Giriş kodun:</p>
    <p style="margin:0 0 24px;font-size:34px;font-weight:700;letter-spacing:.18em">${escapeHtml(code)}</p>
    <p style="margin:0 0 24px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#a84b63;color:#fff;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:999px">Panele gir</a></p>
    <p style="margin:0 0 6px;font-size:13px;color:#574e48">Girdikten sonra <strong>Hesabım</strong> sayfasından yeni şifreni belirleyebilirsin.</p>
    <p style="margin:0;font-size:12px;color:#8a7f78">Kod 1 saat geçerlidir. Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.</p>
  </div>
</body></html>`;
  return { subject, text, html };
}

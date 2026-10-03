import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

function safeNext(value: string | null): string {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

/**
 * E-postadaki sihirli link buraya gelir.
 *  - token_hash: önerilen e-posta şablonu (her tarayıcıda çalışır)
 *  - code: Supabase'in varsayılan şablonu (linki isteyen tarayıcıda açılmalı)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const next = safeNext(params.get("next"));

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const target = new URL(ok ? next : "/admin/giris?hata=link", request.url);
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

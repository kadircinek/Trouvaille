import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Yalnızca /admin altında çalışır: Supabase oturumunu tazeler, girişsiz
 * ziyaretçiyi giriş sayfasına yollar. Herkese açık vitrin sayfaları bu
 * katmandan hiç geçmez (hızlı ve önbelleklenebilir kalırlar).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isLoginPage = request.nextUrl.pathname.startsWith("/admin/giris");

  if (!data?.claims && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/giris";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

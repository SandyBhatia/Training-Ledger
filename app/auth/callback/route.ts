import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

type CookieItem = { name: string; value: string; options?: CookieOptions };

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errParam = searchParams.get("error_description") || searchParams.get("error");

  const fail = (msg: string) =>
    NextResponse.redirect(`${origin}/login?err=${encodeURIComponent(msg)}`);

  if (errParam) return fail(errParam);

  // Build the redirect FIRST, then let Supabase write session cookies onto it.
  // (Cookies set on a different object are dropped by the redirect response.)
  const response = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ? request.headers.get("cookie")!.split(";").map((c) => {
                const idx = c.indexOf("=");
                return { name: c.slice(0, idx).trim(), value: decodeURIComponent(c.slice(idx + 1)) };
              })
            : [];
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(error.message);
    return response;
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) return fail(error.message);
    return response;
  }

  return fail("The sign-in link didn't include a valid token. Request a fresh link.");
}

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/recommendations";

  if (code) {
    let cookiesToForward: { name: string; value: string; options?: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToForward = cookiesToSet;
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Only steer a normal sign-in (no explicit deep-link `next`) toward onboarding --
      // an explicit next target is respected as-is.
      let target = next;
      if (next === "/recommendations" && data.user) {
        const { data: profile } = await createAdminClient()
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (!profile?.onboarding_completed) target = "/onboarding";
      }

      const redirectResponse = NextResponse.redirect(`${origin}${target}`);
      cookiesToForward.forEach(({ name, value, options }) =>
        redirectResponse.cookies.set(name, value, options)
      );
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}

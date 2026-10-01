import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDING_PATH, pendingOnboardingStep } from "@/lib/auth/onboarding";

const PROTECTED_PREFIX = "/dashboard";
const AUTH_PAGE = "/login";
/** Pages a signed-in user has no business seeing again. */
const AUTH_PAGES = ["/login", "/signup"];

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
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isOnboarding = pathname.startsWith(ONBOARDING_PATH);

  if (!user && (pathname.startsWith(PROTECTED_PREFIX) || isOnboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_PAGE;
    url.search = "";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (!user) {
    return response;
  }

  // Signed up but not through the flow yet: the dashboard and the auth pages
  // both hand back to onboarding, so backing out of a step and signing in
  // again lands on the step still owed rather than skipping it.
  const pendingStep = pendingOnboardingStep(user.user_metadata);

  if (
    pendingStep &&
    !isOnboarding &&
    (pathname.startsWith(PROTECTED_PREFIX) || AUTH_PAGES.includes(pathname))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ONBOARDING_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!pendingStep && (isOnboarding || AUTH_PAGES.includes(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};

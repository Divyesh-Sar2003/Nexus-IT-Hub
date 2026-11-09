import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isDatabaseConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const publicPaths = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/access-pending",
];

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const isConfigured = isSupabaseConfigured() && isDatabaseConfigured();

  if (!isConfigured && process.env.NODE_ENV === "development") {
    return NextResponse.next({ request });
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  if (!isConfigured) {
    return NextResponse.redirect(new URL("/login?reason=setup", request.url));
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    if (
      error.name !== "AuthSessionMissingError" &&
      error.name !== "AuthInvalidJwtError" &&
      error.name !== "AuthInvalidTokenResponseError"
    ) {
      throw new Error("Unable to verify the Supabase session.", { cause: error });
    }
  }

  if (!data?.claims.sub) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(header);
      if (value) {
        redirectResponse.headers.set(header, value);
      }
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|forgot-password|reset-password|auth/callback|access-pending).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes handle their own auth and always return JSON. Redirecting
  // them to the sign-in page here breaks every fetch().then(r => r.json())
  // call for a signed-out visitor, since the response becomes the sign-in
  // page's HTML instead of JSON -- this silently broke public-profile
  // viewing (and anything else fetched from a public page) for anyone not
  // logged in. Every route under app/api/ already checks auth internally
  // and returns a proper 401 or a graceful anonymous response, so this
  // middleware has nothing to add for them.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isPublic =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/recommendations" ||
    pathname.startsWith("/restaurant/") ||
    pathname.startsWith("/list/") ||
    pathname.startsWith("/u/") ||
    pathname === "/favorites" ||
    pathname === "/visited" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/auth/");

  if (!isPublic) {
    const hasSession = req.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-komriwzkkknrsirifgqg-auth-token"));

    if (!hasSession) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

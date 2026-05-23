import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname === "/about" ||
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

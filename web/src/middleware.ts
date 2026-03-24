import { NextRequest, NextResponse } from "next/server";

const AUTH_DISABLED = true;

const protectedPaths = [
  "/drills",
  "/sessions",
  "/session-planner",
  "/teams",
  "/builder",
];

export function middleware(request: NextRequest) {
  if (AUTH_DISABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  const isLoginPage = pathname === "/login";

  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL("/teams", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/drills/:path*",
    "/sessions/:path*",
    "/session-planner/:path*",
    "/teams/:path*",
    "/builder/:path*",
  ],
};
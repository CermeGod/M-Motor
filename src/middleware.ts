import { NextRequest, NextResponse } from "next/server";

// Routes accessible without a session
const PUBLIC_PATHS = ["/login", "/register"];
// Auth API routes that don't require a token
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/captcha"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow Next.js internals and static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Allow public pages (login, register)
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // Allow public API routes (login, register endpoints)
  if (PUBLIC_API_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // For all other routes, require the auth cookie
  const token = req.cookies.get("mmf_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

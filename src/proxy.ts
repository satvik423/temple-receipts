import { NextResponse, type NextRequest } from "next/server";

import { ensureBootstrapAdmin } from "@/lib/bootstrap";
import { SESSION_COOKIE_NAME, decodeSessionToken } from "@/lib/session";

const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
]);

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/api/auth/setup",
];

const ADMIN_PATHS = [
  "/sevas",
  "/history",
  "/settings",
];

const ADMIN_API_PREFIXES = [
  "/api/sevas",
  "/api/users",
  "/api/settings",
  "/api/receipts/report",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Logout must work whether or not the user has a session. Otherwise a logged-in
// user clicking "Log out" gets redirected away from the endpoint, and the
// cookie never gets cleared.
function isAlwaysAllowed(pathname: string): boolean {
  return pathname === "/api/auth/logout" || pathname.startsWith("/api/auth/logout/");
}

function isAdminPath(pathname: string): boolean {
  if (ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  return ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // First-touch bootstrap: seed the initial admin if needed. This is a no-op
  // after the first successful run within a process, and is safe to call on
  // every request because it's gated by a cached Promise.
  await ensureBootstrapAdmin();

  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decodeSessionToken(token);

  if (session) {
    // Logout must always reach the endpoint, even when the user is logged in.
    if (isAlwaysAllowed(pathname)) {
      return NextResponse.next();
    }

    // Logged in: bounce away from auth pages.
    if (isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      const next = request.nextUrl.searchParams.get("next");
      // Reject protocol-relative and backslash-escaped "same-origin" tricks.
      const isSafeInternal =
        typeof next === "string" &&
        next.startsWith("/") &&
        !next.startsWith("//") &&
        !next.startsWith("/\\");
      url.pathname = isSafeInternal ? next : "/sell";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Role enforcement for admin-only paths.
    if (isAdminPath(pathname) && session.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return forbiddenResponse();
      }
      const url = request.nextUrl.clone();
      url.pathname = "/sell";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // No session.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  return redirectToLogin(request);
}

export const config = {
  // Run on every path except Next internals and root static files.
  matcher: [
    "/((?!_next/|favicon.ico|apple-icon.png|icon.png|manifest.webmanifest|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.webmanifest$).*)",
  ],
};

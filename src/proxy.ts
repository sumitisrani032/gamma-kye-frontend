import { NextRequest, NextResponse } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "lvh.me";

function extractSubdomain(hostname: string): string | null {
  const suffix = `.${BASE_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.replace(suffix, "");
  if (sub.includes(".") || sub.length === 0) return null;
  return sub;
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] || "";
  const subdomain = extractSubdomain(hostname);
  const { pathname } = request.nextUrl;

  const headers = new Headers(request.headers);
  headers.set("x-subdomain", subdomain || "");
  headers.set("x-hostname", hostname);

  // Main domain (no subdomain) — only allow marketing routes
  if (!subdomain) {
    // If someone on root domain tries to access tenant routes, redirect to workspace finder
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next({ request: { headers } });
  }

  // Tenant subdomain — redirect root to dashboard or login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

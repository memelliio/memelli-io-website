import { NextRequest, NextResponse } from "next/server";

/**
 * Memelli OS Middleware — Subdomain Routing
 *
 * Product subdomains (phone, video, crm, etc.) → redirect to dashboard section
 * Affiliate/tenant subdomains → rewrite to internal _tenant route
 */

// Product subdomains → dashboard route mapping
const PRODUCT_ROUTES: Record<string, string> = {
  phone: "/dashboard/communications/phone-system",
  calls: "/dashboard/communications/calls",
  video: "/dashboard/communications/meeting",
  sms: "/dashboard/communications/messaging-center",
  email: "/dashboard/communications/email",
  voicemail: "/dashboard/communications/voicemail",
  crm: "/dashboard/crm",
  leads: "/dashboard/leads",
  commerce: "/dashboard/commerce",
  coaching: "/dashboard/coaching",
  seo: "/dashboard/seo",
  credit: "/dashboard/credit",
  funding: "/dashboard/credit/funding-pipeline",
  analytics: "/dashboard/analytics",
  revenue: "/dashboard/analytics/revenue-engines",
  agents: "/dashboard/ai-company",
  workflows: "/dashboard/workflows",
  tasks: "/dashboard/tasks",
  contacts: "/dashboard/contacts",
  portal: "/dashboard/portal",
};

// Subdomains that rewrite to a specific internal page (URL stays unchanged)
const SUBDOMAIN_REWRITES: Record<string, string> = {};

// Subdomains that pass through untouched (not product routes, not tenant routes)
const RESERVED = new Set([
  "www",
  "api",
  "app",
  "admin",
  "deploy",
  "docs",
  "universe",
  "staging",
  "preview",
  "dev",
]);

function deriveRootDomain(host: string): string {
  const hostname = host.split(':')[0].toLowerCase();
  if (!hostname || hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return '';
  }

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length < 2) {
    return hostname;
  }

  return parts.slice(-2).join('.');
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const rootDomain = deriveRootDomain(host);

  // ── Subdomain detection ─────────────────────────────────────────────
  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.replace(`.${rootDomain}`, "").toLowerCase();

    if (subdomain && !RESERVED.has(subdomain)) {
      // Subdomain rewrite → serve internal page without changing URL
      const rewriteBase = SUBDOMAIN_REWRITES[subdomain];
      if (rewriteBase) {
        const url = req.nextUrl.clone();
        const suffix = url.pathname === "/" ? "" : url.pathname;
        url.pathname = `${rewriteBase}${suffix}`;
        return NextResponse.rewrite(url);
      }

      // Product subdomain → redirect to dashboard section
      const productPath = PRODUCT_ROUTES[subdomain];
      if (productPath) {
        const url = req.nextUrl.clone();
        if (!url.pathname.startsWith(productPath)) {
          url.pathname = productPath;
          return NextResponse.redirect(url, { status: 302 });
        }
        return NextResponse.next();
      }

      // Affiliate/tenant subdomain → rewrite to internal _tenant route
      const url = req.nextUrl.clone();
      url.pathname = `/_tenant/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Localhost subdomain detection (dev mode) ────────────────────────
  const localhostMatch = host.match(/^([a-z0-9-]+)\.localhost/);
  if (localhostMatch) {
    const subdomain = localhostMatch[1];
    if (subdomain && !RESERVED.has(subdomain)) {
      const rewriteBase = SUBDOMAIN_REWRITES[subdomain];
      if (rewriteBase) {
        const url = req.nextUrl.clone();
        const suffix = url.pathname === "/" ? "" : url.pathname;
        url.pathname = `${rewriteBase}${suffix}`;
        return NextResponse.rewrite(url);
      }
      const productPath = PRODUCT_ROUTES[subdomain];
      if (productPath) {
        const url = req.nextUrl.clone();
        if (!url.pathname.startsWith(productPath)) {
          url.pathname = productPath;
          return NextResponse.redirect(url, { status: 302 });
        }
        return NextResponse.next();
      }
      const url = req.nextUrl.clone();
      url.pathname = `/_tenant/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};

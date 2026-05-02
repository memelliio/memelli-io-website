import { NextRequest, NextResponse } from 'next/server';

/**
 * Memelli OS — White-label partner detection middleware
 *
 * Three triggers (priority order):
 *   1. Path slug   — memelli.io/key2debtfree   → cookie + redirect to /
 *   2. Query ref   — memelli.io/?ref=key2debtfree → cookie + redirect to /
 *   3. Cookie      — memelli.io/  with cookie partner_slug=key2debtfree
 *   4. Login       — handled client-side by PartnerProvider via useAuth()
 *
 * The OS desktop is the same for everyone; only the Logo + brand color swap.
 */

const RESERVED_PATHS = new Set([
  '_next', 'api', 'favicon.ico', 'os', 'admin', 'auth', 'login', 'signup',
  'static', 'public', 'health', 'robots.txt', 'sitemap.xml',
]);

function looksLikePartnerSlug(seg: string): boolean {
  if (!seg) return false;
  if (seg.length < 2 || seg.length > 40) return false;
  if (RESERVED_PATHS.has(seg)) return false;
  return /^[a-z0-9][a-z0-9_-]*$/.test(seg);
}

const PARTNER_COOKIE = 'partner_slug';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathSeg = (url.pathname.split('/').filter(Boolean)[0] ?? '').toLowerCase();
  const refParam = (url.searchParams.get('ref') ?? '').toLowerCase();
  const existingCookie = req.cookies.get(PARTNER_COOKIE)?.value ?? '';

  if (looksLikePartnerSlug(refParam)) {
    const cleanUrl = url.clone();
    cleanUrl.searchParams.delete('ref');
    cleanUrl.pathname = '/';
    const res = NextResponse.redirect(cleanUrl, 302);
    res.cookies.set(PARTNER_COOKIE, refParam, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' });
    return res;
  }

  if (looksLikePartnerSlug(pathSeg)) {
    const rewritten = url.clone();
    rewritten.pathname = '/';
    const res = NextResponse.redirect(rewritten, 302);
    res.cookies.set(PARTNER_COOKIE, pathSeg, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' });
    return res;
  }

  if (existingCookie && looksLikePartnerSlug(existingCookie)) {
    const res = NextResponse.next();
    res.headers.set('x-partner-slug', existingCookie);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

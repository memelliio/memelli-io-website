import { NextRequest, NextResponse } from 'next/server';

/**
 * Memelli OS — White-label partner detection middleware (subdomain mode)
 *
 * Triggers (priority):
 *   1. Subdomain     — key2debtfree.memelli.io  → host header detection
 *   2. Query ?ref=   — memelli.io/?ref=key2debtfree → cookie + redirect /
 *   3. Cookie        — memelli.io/ with cookie partner_slug=key2debtfree
 *   4. Login (client)— PartnerProvider via useAuth()
 *
 * Same OS desktop for everyone; only the Logo + brand color swap.
 */

// Subdomains that route to OTHER services (not partner white-labels)
// Anything in this set bypasses partner detection entirely.
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'api-dev', 'admin', 'app', 'auth', 'docs', 'staging', 'preview',
  'dev', 'os-dev', 'universe',
  // Service subdomains routed to other Railway services
  'agents', 'agent-runner', 'analytics', 'affiliates', 'billing', 'business',
  'calendar', 'campaigns', 'chat', 'claude', 'coaching', 'code', 'commerce',
  'contact', 'credit', 'crm', 'data', 'design', 'documents', 'email', 'forum',
  'groq', 'health', 'infinity', 'leads', 'meet', 'music', 'notes',
  'notifications', 'onboarding', 'partner', 'partners', 'phone', 'portal',
  'prequal', 'revenue', 'search', 'seo', 'sms', 'social', 'status', 'tools',
  'trading', 'tv', 'ugc', 'vendors', 'video', 'voicemail', 'vpn', 'webhooks',
  'workers', 'workflow',
]);

const PARTNER_COOKIE = 'partner_slug';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function deriveRoot(host: string): { root: string; sub: string } {
  const hostname = host.split(':')[0].toLowerCase();
  if (!hostname) return { root: '', sub: '' };
  // Localhost dev: <slug>.localhost
  const localMatch = hostname.match(/^([a-z0-9][a-z0-9_-]*)\.localhost$/);
  if (localMatch) return { root: 'localhost', sub: localMatch[1] };
  // Production: <slug>.memelli.io | memelli.io
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length < 2) return { root: hostname, sub: '' };
  const root = parts.slice(-2).join('.');
  const sub = parts.length >= 3 ? parts.slice(0, parts.length - 2).join('.') : '';
  return { root, sub };
}

function looksLikePartnerSlug(s: string): boolean {
  if (!s) return false;
  if (s.length < 2 || s.length > 40) return false;
  if (RESERVED_SUBDOMAINS.has(s)) return false;
  return /^[a-z0-9][a-z0-9_-]*$/.test(s);
}

// Force every HTML response to bypass browser cache so clients always get the
// latest JS chunk references after a deploy. /_next/static/* (hashed filenames)
// and /api/* are excluded by the matcher below — they keep their own cache headers.
function noStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  res.headers.set('Pragma', 'no-cache');
  return res;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') ?? '';
  const { sub } = deriveRoot(host);
  const refParam = (url.searchParams.get('ref') ?? '').toLowerCase();
  const existingCookie = req.cookies.get(PARTNER_COOKIE)?.value ?? '';

  // Trigger 1 — subdomain present and is a valid partner slug
  if (looksLikePartnerSlug(sub)) {
    const res = NextResponse.next();
    res.headers.set('x-partner-slug', sub);
    // Persist cookie so partner sticks if the user navigates to apex memelli.io
    if (existingCookie !== sub) {
      res.cookies.set(PARTNER_COOKIE, sub, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax', domain: '.memelli.io' });
    }
    return noStore(res);
  }

  // Trigger 2 — ?ref=<slug> on apex
  if (looksLikePartnerSlug(refParam)) {
    const cleanUrl = url.clone();
    cleanUrl.searchParams.delete('ref');
    const res = NextResponse.redirect(cleanUrl, 302);
    res.cookies.set(PARTNER_COOKIE, refParam, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax', domain: '.memelli.io' });
    return noStore(res);
  }

  // Trigger 3 — cookie present (apex visit, returning visitor)
  if (existingCookie && looksLikePartnerSlug(existingCookie)) {
    const res = NextResponse.next();
    res.headers.set('x-partner-slug', existingCookie);
    return noStore(res);
  }

  // No partner detected — generic Memelli
  return noStore(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

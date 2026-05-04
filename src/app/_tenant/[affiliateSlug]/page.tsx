"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Tenant/Subdomain Affiliate Landing Page
 *
 * This page is served when a user visits [slug].memelli.com
 * The middleware rewrites [slug].memelli.com → /_tenant/[slug]/
 *
 * Behavior:
 * 1. Resolves the affiliate via API
 * 2. Sets attribution cookies (90-day window)
 * 3. Tracks the visit as "subdomain" landing type
 * 4. Displays the affiliate's branded landing page
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-production-057c.up.railway.app";
const COOKIE_DURATION_DAYS = 90;

interface AffiliateData {
  id: string;
  affiliateId: string;
  slug: string;
  displayName: string;
  status: string;
  allowCustomBranding: boolean;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function TenantAffiliatePage() {
  const params = useParams();
  const affiliateSlug = params.affiliateSlug as string;
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!affiliateSlug) return;

    async function resolveAndTrack() {
      try {
        const res = await fetch(`${API_URL}/api/affiliate/resolve?slug=${affiliateSlug}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const json = await res.json();
        const aff = json.data as AffiliateData;
        setAffiliate(aff);

        // Set attribution cookies
        setCookie("aff_id", aff.affiliateId, COOKIE_DURATION_DAYS);
        setCookie("aff_slug", aff.slug, COOKIE_DURATION_DAYS);
        setCookie("aff_ts", new Date().toISOString(), COOKIE_DURATION_DAYS);

        const urlParams = new URLSearchParams(window.location.search);
        const campaign = urlParams.get("campaign") || urlParams.get("c");
        if (campaign) {
          setCookie("aff_campaign", campaign, COOKIE_DURATION_DAYS);
        }

        let visitorCookieId = getCookie("memelli_visitor");
        if (!visitorCookieId) {
          visitorCookieId = crypto.randomUUID();
          setCookie("memelli_visitor", visitorCookieId, 365);
        }

        // Track visit as subdomain type
        await fetch(`${API_URL}/api/affiliate/track-visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateId: aff.affiliateId,
            slug: aff.slug,
            campaign: campaign || null,
            source: document.referrer || null,
            landingType: "subdomain",
            host: window.location.host,
            path: window.location.pathname,
            ip: "client",
            userAgent: navigator.userAgent,
            visitorCookieId,
          }),
        }).catch(() => {});
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    resolveAndTrack();
  }, [affiliateSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <h1 className="text-2xl font-semibold">Page Not Found</h1>
        <p className="mt-3 text-zinc-500">This subdomain is not active.</p>
        <Link href="https://memelli.com" className="mt-8 rounded-xl bg-red-600 px-8 py-3 text-white hover:bg-red-500">
          Go to Memelli
        </Link>
      </div>
    );
  }

  const displayName = affiliate?.displayName || affiliateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Premium subdomain header */}
      <header className="border-b border-white/[0.04] bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
              {displayName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-white/80">{displayName}</span>
            <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] text-red-300">
              Memelli Partner
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/register?ref=${affiliateSlug}`}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-red-600/[0.04] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-white/90">
            Build Your{" "}
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-violet-500 bg-clip-text text-transparent">
              AI-Powered Business
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg text-zinc-500 font-light">
            {displayName} recommends Memelli OS -- the operating system that gives you
            an entire AI workforce running your business 24/7. No technical skills needed.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/register?ref=${affiliateSlug}`}
              className="w-full rounded-xl bg-red-600 px-10 py-4 text-lg font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500 sm:w-auto"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl px-10 py-4 text-lg font-medium text-zinc-100 transition-all duration-200 hover:bg-zinc-800/60 hover:border-white/[0.1] sm:w-auto"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-white/90">
            Everything You Need,{" "}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              One Platform
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "AI Workforce", desc: "50+ specialized agents handling every business function" },
              { title: "CRM & Pipeline", desc: "Manage contacts, deals, and revenue in one place" },
              { title: "Commerce Engine", desc: "Stores, products, subscriptions, and payments" },
              { title: "SEO & Content", desc: "AI-generated articles, keyword tracking, IndexNow" },
              { title: "Coaching Platform", desc: "Programs, courses, enrollments, certificates" },
              { title: "Communication Hub", desc: "SMS, email, voice, chat -- all channels unified" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 backdrop-blur-xl p-7 transition-all duration-250 hover:border-red-500/15 hover:bg-zinc-900/60"
              >
                <h3 className="mb-2 text-sm font-semibold text-white/90">{f.title}</h3>
                <p className="text-sm text-zinc-500 font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-red-500/10 bg-zinc-900/40 backdrop-blur-xl p-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
              <div>
                <div className="text-3xl font-semibold bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">100x</div>
                <div className="mt-2 text-sm text-zinc-500 font-light">Faster than hiring</div>
              </div>
              <div>
                <div className="text-3xl font-semibold bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">$0</div>
                <div className="mt-2 text-sm text-zinc-500 font-light">Employee costs</div>
              </div>
              <div>
                <div className="text-3xl font-semibold bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">24/7</div>
                <div className="mt-2 text-sm text-zinc-500 font-light">Always operating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-28 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white/90">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-zinc-500 font-light">
            Join through {displayName}&apos;s link and start building your AI company today.
          </p>
          <Link
            href={`/register?ref=${affiliateSlug}`}
            className="mt-10 inline-block w-full rounded-xl bg-red-600 px-10 py-4 text-lg font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500 sm:w-auto"
          >
            Start Your AI Company Free
          </Link>
        </div>
      </section>
    </div>
  );
}

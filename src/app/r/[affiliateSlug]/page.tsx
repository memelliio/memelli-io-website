"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-production-057c.up.railway.app";

const COOKIE_DURATION_DAYS = 90;

interface AffiliateData {
  id: string;
  affiliateId: string;
  slug: string;
  displayName: string;
  status: string;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const highlights = [
  { stat: "10+", label: "AI Products" },
  { stat: "50+", label: "AI Agents" },
  { stat: "24/7", label: "Always Working" },
];

const features = [
  {
    title: "Full AI Workforce",
    desc: "Get an entire team of AI agents that handle sales, marketing, operations, and support -- all working together.",
  },
  {
    title: "No Technical Skills Needed",
    desc: "Just tell your AI company what you need in plain English. No coding, no complex setup.",
  },
  {
    title: "Scale Instantly",
    desc: "Add new AI agents, products, and capabilities on demand. Your company grows as fast as you do.",
  },
  {
    title: "Works While You Sleep",
    desc: "Your AI workforce operates 24/7. Wake up to completed tasks, new leads, and growing revenue.",
  },
];

export default function AffiliateReferralPage() {
  const params = useParams();
  const affiliateSlug = params.affiliateSlug as string;
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!affiliateSlug) return;

    async function resolveAndTrack() {
      try {
        // Resolve affiliate
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

        // Check URL for campaign parameter
        const urlParams = new URLSearchParams(window.location.search);
        const campaign = urlParams.get("campaign") || urlParams.get("c");
        if (campaign) {
          setCookie("aff_campaign", campaign, COOKIE_DURATION_DAYS);
        }

        // Get or create visitor cookie ID
        let visitorCookieId = getCookie("memelli_visitor");
        if (!visitorCookieId) {
          visitorCookieId = crypto.randomUUID();
          setCookie("memelli_visitor", visitorCookieId, 365);
        }

        // Track visit
        await fetch(`${API_URL}/api/affiliate/track-visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateId: aff.affiliateId,
            slug: aff.slug,
            campaign: campaign || null,
            source: document.referrer || null,
            landingType: "referral",
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
        <h1 className="text-2xl font-semibold">Referral Not Found</h1>
        <p className="mt-3 text-zinc-500">This referral link is not active.</p>
        <Link href="/" className="mt-8 rounded-xl bg-red-600 px-8 py-3 text-white hover:bg-red-500">
          Go to Memelli
        </Link>
      </div>
    );
  }

  const displayName = affiliate?.displayName || affiliateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-red-600/[0.04] blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-violet-600/[0.03] blur-[120px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-red-500/15 bg-red-500/5 px-5 py-2 text-sm text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            Referred by {displayName}
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-white/90">
            Your AI Company,
            <br />
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-violet-500 bg-clip-text text-transparent">
              Ready to Work
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg text-zinc-500 font-light">
            {displayName} thinks you&apos;d love Memelli OS -- the operating system that gives you
            an entire AI workforce running your business 24/7.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/register?ref=${affiliateSlug}`}
              className="w-full rounded-xl bg-red-600 px-10 py-4 text-lg font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500 sm:w-auto"
            >
              Start Your AI Company Free
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl px-10 py-4 text-lg font-medium text-zinc-100 transition-all duration-200 hover:bg-zinc-800/60 hover:border-white/[0.1] sm:w-auto"
            >
              View Pricing
            </Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-md grid-cols-3 gap-6">
            {highlights.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-semibold bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                  {s.stat}
                </div>
                <div className="mt-1.5 text-xs text-zinc-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-white/90">
            Why Entrepreneurs Choose{" "}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Memelli
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
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

      {/* Social Proof */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-red-500/10 bg-zinc-900/40 backdrop-blur-xl p-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white/90">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
                Forward-Thinking Entrepreneurs
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-zinc-500 font-light">
              Businesses are replacing entire teams with Memelli OS. One platform,
              50+ AI agents, zero employees to manage.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 backdrop-blur-xl p-7">
                <div className="mb-3 text-2xl font-semibold text-red-400">100x</div>
                <p className="text-sm text-zinc-500 font-light">Faster than building a team</p>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 backdrop-blur-xl p-7">
                <div className="mb-3 text-2xl font-semibold text-red-400">$0</div>
                <p className="text-sm text-zinc-500 font-light">Salaries or benefits required</p>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/40 backdrop-blur-xl p-7">
                <div className="mb-3 text-2xl font-semibold text-red-400">24/7</div>
                <p className="text-sm text-zinc-500 font-light">Your AI company never stops</p>
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
            {displayName} invited you for a reason. Start your free trial today --
            no credit card required.
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

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  BannerLeaderboard,
  BannerMediumRect,
  BannerSkyscraper,
  BannerLargeRect,
  BannerBillboard,
} from '../../../../components/banners';

/* ── Banner metadata ─────────────────────────────────────────────── */

const banners = [
  { id: 'leaderboard', label: 'Leaderboard', size: '728 x 90', Component: BannerLeaderboard },
  { id: 'medium-rect', label: 'Medium Rectangle', size: '300 x 250', Component: BannerMediumRect },
  { id: 'skyscraper', label: 'Wide Skyscraper', size: '160 x 600', Component: BannerSkyscraper },
  { id: 'large-rect', label: 'Large Rectangle', size: '336 x 280', Component: BannerLargeRect },
  { id: 'billboard', label: 'Billboard', size: '970 x 250', Component: BannerBillboard },
] as const;

/* ── Page ─────────────────────────────────────────────────────────── */

export default function BannersPage() {
  const [darkBg, setDarkBg] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bannerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCopy = async (id: string) => {
    const el = bannerRefs.current[id];
    if (!el) return;
    const html = el.innerHTML;
    try {
      await navigator.clipboard.writeText(html);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Web Banner Collection
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Animated HTML5 banners — ready to deploy
        </p>

        {/* Background toggle */}
        <div className="mt-8 inline-flex items-center gap-3 bg-card border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setDarkBg(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              darkBg
                ? 'bg-muted text-white'
                : 'text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            Dark Background
          </button>
          <button
            onClick={() => setDarkBg(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !darkBg
                ? 'bg-muted text-white'
                : 'text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            Light Background
          </button>
        </div>
      </div>

      {/* ── Banner showcase ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-20 space-y-16">
        {banners.map(({ id, label, size, Component }) => (
          <div key={id}>
            {/* Label row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{label}</h2>
                <span className="text-sm text-muted-foreground font-mono">{size} px</span>
              </div>
              <button
                onClick={() => handleCopy(id)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-zinc-800 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-white transition-colors"
              >
                {copiedId === id ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Copy HTML
                  </>
                )}
              </button>
            </div>

            {/* Banner container */}
            <div
              className={`rounded-xl border p-8 flex items-center justify-center overflow-x-auto transition-colors ${
                darkBg
                  ? 'bg-card border-zinc-800'
                  : 'bg-card border-zinc-300'
              }`}
            >
              <div ref={(el) => { bannerRefs.current[id] = el; }}>
                <Component />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <div className="border-t border-zinc-800 bg-card">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Need Custom Banners?
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Get AI-generated animated banners tailored to your brand, any size,
            any style. Ready in minutes.
          </p>
          <Link
            href="/services/ai-build"
            className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-[#E11D2E] hover:bg-[#c41928] text-white font-bold rounded-lg text-lg transition-colors"
          >
            Order Custom Banners — $49
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

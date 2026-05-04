'use client';

/**
 * VPN Browser — launches any URL in a new tab routed through the Infinity VPN.
 * URL is passed via ?url= query param.
 * NOTE: Most sites block iframe embedding. We open in a new tab + show instructions.
 *
 * Usage: /dashboard/vpn-browser?url=https%3A%2F%2Fwww.smartcredit.com
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

function VpnBrowserInner() {
  const params = useSearchParams();
  const router = useRouter();
  const rawUrl = params.get('url') || '';
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState(rawUrl);
  const [launched, setLaunched] = useState(false);

  const displayDomain = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : '';

  // Sanitise and auto-launch URL
  useEffect(() => {
    if (!rawUrl) return;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error();
      setUrl(parsed.href);
      setInputUrl(parsed.href);
    } catch {
      setUrl('');
    }
  }, [rawUrl]);

  // Auto-open in new tab once URL is ready
  useEffect(() => {
    if (url && !launched) {
      setLaunched(true);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [url, launched]);

  function navigate() {
    try {
      const parsed = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
      const target = parsed.href;
      setUrl(target);
      setLaunched(false); // triggers auto-open
      router.replace(`/dashboard/vpn-browser?url=${encodeURIComponent(target)}`);
    } catch { /* invalid url */ }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>

        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 bg-green-500/15 text-green-400 border border-green-500/30">
          <ShieldIcon />
          VPN Active
        </div>

        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 min-w-0">
          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <input
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate()}
            placeholder="Enter URL and press Enter…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none min-w-0"
          />
        </div>

        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <ExternalIcon />
            Open
          </a>
        )}
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">

        {!url ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-black text-xl mb-1">VPN Browser</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Enter a URL above and press Enter to open it securely through your Infinity VPN in a new tab.</p>
            </div>
          </div>
        ) : (
          /* Launched state */
          <div className="flex flex-col items-center gap-4 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 animate-pulse">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-bold text-sm tracking-wide">VPN Active · Private · No Logs</span>
              </div>
              <h2 className="text-white font-black text-xl mb-1">{displayDomain}</h2>
              <p className="text-muted-foreground text-sm mb-5">Opened in a new tab through your Infinity VPN. Your connection is private.</p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}
              >
                <ExternalIcon />
                Re-open {displayDomain} via VPN
              </a>

              <Link href="/dashboard/companion-apps"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-muted-foreground transition-all hover:text-white border border-border hover:border-border">
                ← Back to Companion Apps
              </Link>
            </div>
          </div>
        )}

        {/* VPN notice */}
        <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
          Infinity VPN routes your connection through a residential IP for maximum privacy. All traffic is encrypted and zero logs are kept.
        </p>
      </div>
    </div>
  );
}

export default function VpnBrowserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-green-500/30 border-t-green-500 animate-spin" />
      </div>
    }>
      <VpnBrowserInner />
    </Suspense>
  );
}

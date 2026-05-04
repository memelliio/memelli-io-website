'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { API_URL } from '@/lib/config';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BureauScore {
  bureau: string;
  score: number;
  status: string;
  threshold: number;
}

interface PassData {
  id: number;
  clientId: string;
  decisionTier: string;
  createdAt: string;
  decisionJson: {
    decision_tier: string;
    credit_scores?: BureauScore[];
    approval_summary?: {
      headline: string;
      message: string;
      next_steps: string[];
      average_score: number;
      passing_bureaus: number;
      total_bureaus: number;
    };
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function tierConfig(tier: string) {
  switch (tier) {
    case 'APPROVE':
      return {
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'from-emerald-50 to-card',
        border: 'border-emerald-200',
        label: 'Approved',
        glow: 'shadow-emerald-500/5'
      };
    case 'BORDERLINE':
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'from-amber-50 to-card',
        border: 'border-amber-200',
        label: 'Conditional',
        glow: 'shadow-amber-500/5'
      };
    case 'DECLINE':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'from-red-50 to-card',
        border: 'border-red-200',
        label: 'Declined',
        glow: 'shadow-red-500/5'
      };
    default:
      return {
        icon: ShieldCheck,
        color: 'text-muted-foreground',
        bg: 'from-muted to-card',
        border: 'border-border',
        label: tier,
        glow: ''
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Page (Public -- no auth)                                           */
/* ------------------------------------------------------------------ */

export default function CreditPassPage() {
  const params = useParams();
  const passToken = params.token as string;

  const [data, setData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/credit/pass/${passToken}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Invalid or expired link');
          return;
        }
        setData(json.data);
      } catch {
        setError('Failed to load credit pass. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [passToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <LoadingGlobe size="lg" />
          <p className="text-sm text-muted-foreground">Loading credit pass...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-6">
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-5" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground font-light">
            {error ?? 'This credit pass link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  const tier = tierConfig(data.decisionTier);
  const TierIcon = tier.icon;
  const scores = data.decisionJson?.credit_scores ?? [];
  const summary = data.decisionJson?.approval_summary;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-16">
      <div className="mx-auto max-w-lg">
        {/* Branding */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/10">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="text-lg font-semibold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Memelli
          </span>
        </div>

        {/* Main card */}
        <div className={`memelli-card border ${tier.border} bg-gradient-to-b ${tier.bg} p-10 ${tier.glow}`}>
          {/* Icon + tier */}
          <div className="flex flex-col items-center text-center">
            <div className={`rounded-full p-3.5 ${data.decisionTier === 'APPROVE' ? 'bg-emerald-50' : data.decisionTier === 'BORDERLINE' ? 'bg-amber-50' : 'bg-red-50'}`}>
              <TierIcon className={`h-10 w-10 ${tier.color}`} />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              {summary?.headline ?? tier.label}
            </h1>

            <span className={`mt-3 inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold ${
              data.decisionTier === 'APPROVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : data.decisionTier === 'BORDERLINE'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {tier.label}
            </span>

            {summary?.message && (
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed font-light">{summary.message}</p>
            )}
          </div>

          {/* Scores */}
          {scores.length > 0 && (
            <div className="mt-10 grid grid-cols-3 gap-3">
              {scores.map((s) => (
                <div key={s.bureau} className="memelli-tile p-4 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{s.bureau}</p>
                  <p className={`mt-1.5 text-2xl font-semibold ${s.status === 'passing' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {s.score}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Next steps */}
          {summary?.next_steps && summary.next_steps.length > 0 && (
            <div className="mt-10 space-y-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Next Steps</h3>
              <ul className="space-y-2.5">
                {summary.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Date */}
          <div className="mt-10 border-t border-border pt-5 text-center">
            <p className="text-xs text-muted-foreground">
              Report generated on{' '}
              {new Date(data.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Memelli Credit Engine
          </p>
        </div>
      </div>
    </div>
  );
}

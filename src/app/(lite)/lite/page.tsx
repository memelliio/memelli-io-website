'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MousePointerClick,
  UserPlus,
  ArrowRightLeft,
  Percent,
  DollarSign,
  CheckCircle2,
  Copy,
  QrCode,
  Download,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { useApi } from '../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LiteStats {
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  conversionRate: number;
  pendingEarnings: number;
  paidEarnings: number;
}

interface LiteProfile {
  id: string;
  referralCode: string;
  referralLink: string;
  tier: string;
  firstName?: string;
}

interface ActivityEvent {
  id: string;
  type: 'click' | 'signup' | 'conversion' | 'earning' | 'payout';
  description: string;
  amount?: number;
  createdAt: string;
}

interface TopLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
}

interface Suggestion {
  id: string;
  title: string;
  body: string;
  type: 'tip' | 'action' | 'promo';
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number): string {
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const eventIcons: Record<string, React.ComponentType<any>> = {
  click: MousePointerClick,
  signup: UserPlus,
  conversion: ArrowRightLeft,
  earning: DollarSign,
  payout: CheckCircle2,
};

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
        <div className="rounded-xl bg-white/[0.04] p-1.5">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function LiteOverviewPage() {
  const api = useApi();
  const router = useRouter();

  // Fetch profile
  const { data: profile } = useQuery<LiteProfile>({
    queryKey: ['lite-profile'],
    queryFn: async () => {
      const res = await api.get<LiteProfile>('/api/lite/me');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load profile');
      return res.data;
    },
    staleTime: 120_000,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<LiteStats>({
    queryKey: ['lite-stats'],
    queryFn: async () => {
      const res = await api.get<LiteStats>('/api/lite/stats');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load stats');
      return res.data;
    },
    staleTime: 60_000,
  });

  // Fetch recent activity
  const { data: activity } = useQuery<ActivityEvent[]>({
    queryKey: ['lite-activity'],
    queryFn: async () => {
      const res = await api.get<ActivityEvent[]>('/api/lite/activity?limit=10');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load activity');
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Fetch top links
  const { data: topLinks } = useQuery<TopLink[]>({
    queryKey: ['lite-top-links'],
    queryFn: async () => {
      const res = await api.get<TopLink[]>('/api/lite/links?sort=clicks&limit=5');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Fetch suggestions
  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ['lite-suggestions'],
    queryFn: async () => {
      const res = await api.get<Suggestion[]>('/api/lite/suggestions');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 300_000,
  });

  const events = activity ?? [];
  const links = topLinks ?? [];
  const tips = suggestions ?? [];

  function copyReferralLink() {
    if (profile?.referralLink) {
      navigator.clipboard.writeText(profile.referralLink);
      toast.success('Referral link copied!');
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Partner Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
          Track your referrals, earnings, and performance at a glance.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))
        ) : (
          <>
            <StatCard label="Total Clicks" value={fmtNum(stats?.totalClicks ?? 0)} icon={MousePointerClick} />
            <StatCard label="Total Signups" value={fmtNum(stats?.totalSignups ?? 0)} icon={UserPlus} />
            <StatCard label="Conversions" value={fmtNum(stats?.totalConversions ?? 0)} icon={ArrowRightLeft} />
            <StatCard label="Conv. Rate" value={fmtPercent(stats?.conversionRate ?? 0)} icon={Percent} />
            <StatCard label="Pending Earnings" value={fmtCurrency(stats?.pendingEarnings ?? 0)} icon={DollarSign} />
            <StatCard label="Paid Earnings" value={fmtCurrency(stats?.paidEarnings ?? 0)} icon={CheckCircle2} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/20">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={copyReferralLink}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]"
          >
            <div className="rounded-xl bg-white/[0.04] p-3">
              <Copy className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-zinc-400">Copy Referral Link</span>
          </button>
          <button
            onClick={() => router.push('/lite/qr')}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]"
          >
            <div className="rounded-xl bg-white/[0.04] p-3">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-zinc-400">Generate QR Code</span>
          </button>
          <button
            onClick={() => router.push('/lite/marketing')}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]"
          >
            <div className="rounded-xl bg-white/[0.04] p-3">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-zinc-400">Download Assets</span>
          </button>
          <button
            onClick={() => router.push('/lite/analytics')}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]"
          >
            <div className="rounded-xl bg-white/[0.04] p-3">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-zinc-400">View Analytics</span>
          </button>
        </div>
      </div>

      {/* Activity Feed + Top Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Recent Activity</h3>
            <button
              onClick={() => router.push('/lite/referrals')}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-primary transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {events.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No recent activity yet. Share your link to get started!</p>
            ) : (
              events.map((ev) => {
                const Icon = eventIcons[ev.type] ?? MousePointerClick;
                return (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                    <div className="rounded-xl bg-white/[0.04] p-1.5">
                      <Icon className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-400">{ev.description}</p>
                    </div>
                    {ev.amount != null && (
                      <span className="text-xs font-medium text-emerald-400/80">
                        +{fmtCurrency(ev.amount)}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-white/20">{timeAgo(ev.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Performing Links */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Top Performing Links</h3>
            <button
              onClick={() => router.push('/lite/links')}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-primary transition-colors"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {links.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No links yet. Create your first referral link!</p>
            ) : (
              links.map((link, i) => (
                <div key={link.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-bold text-zinc-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/70">{link.name}</p>
                    <p className="truncate text-xs text-zinc-400">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <MousePointerClick className="h-3 w-3" />
                    {fmtNum(link.clicks)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MUA Lite Help Panel */}
      {tips.length > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <Lightbulb className="h-4 w-4 text-amber-400/70" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Tips &amp; Suggestions</h3>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="rounded-xl border border-white/[0.04] bg-zinc-900/60 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  {tip.type === 'action' ? (
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  ) : tip.type === 'promo' ? (
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-400/70" />
                  ) : (
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400/70" />
                  )}
                  <span className="text-xs font-semibold text-zinc-100">{tip.title}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

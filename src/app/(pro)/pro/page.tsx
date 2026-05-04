'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  GitMerge,
  DollarSign,
  ClipboardCheck,
  Percent,
  ArrowRight,
  Plus,
  BarChart3,
  Package,
  Lightbulb,
  TrendingUp,
  ExternalLink,
  MousePointerClick,
} from 'lucide-react';
import { useApi } from '../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ProStats {
  totalClients: number;
  activeClients: number;
  pipelineConversions: number;
  revenue: number;
  pendingOnboarding: number;
  conversionRate: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

interface ClientActivity {
  id: string;
  clientName: string;
  action: string;
  timestamp: string;
}

interface ReferralLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
}

interface Suggestion {
  id: string;
  title: string;
  body: string;
  type: 'tip' | 'action' | 'insight';
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtNum(n: number): string {
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
    <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <div className="rounded-xl bg-white/[0.04] p-1.5">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-zinc-100">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Action                                                        */
/* ------------------------------------------------------------------ */

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-4 text-center backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.04]"
    >
      <div className="rounded-xl bg-white/[0.04] p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-medium text-zinc-400">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline Funnel Bar                                                 */
/* ------------------------------------------------------------------ */

function PipelineFunnel({ stages }: { stages: PipelineStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-2">
      {stages.map((stage) => (
        <div key={stage.stage} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs font-medium text-white/40">{stage.stage}</span>
          <div className="flex-1">
            <div
              className="h-6 rounded-lg transition-all duration-300"
              style={{
                width: `${Math.max((stage.count / maxCount) * 100, 4)}%`,
                backgroundColor: stage.color,
              }}
            />
          </div>
          <span className="w-8 text-right text-xs font-bold text-white/60">{stage.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProDashboardPage() {
  const api = useApi();
  const router = useRouter();

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery<ProStats>({
    queryKey: ['pro-stats'],
    queryFn: async () => {
      const res = await api.get<ProStats>('/api/pro/me');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load stats');
      return res.data;
    },
    staleTime: 60_000,
  });

  // Pipeline stages
  const { data: pipeline } = useQuery<PipelineStage[]>({
    queryKey: ['pro-pipeline-overview'],
    queryFn: async () => {
      const res = await api.get<PipelineStage[]>('/api/pro/clients/pipeline');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Recent activity
  const { data: activity } = useQuery<ClientActivity[]>({
    queryKey: ['pro-recent-activity'],
    queryFn: async () => {
      const res = await api.get<ClientActivity[]>('/api/pro/clients/activity?limit=8');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Top referral links
  const { data: referralLinks } = useQuery<ReferralLink[]>({
    queryKey: ['pro-top-referrals'],
    queryFn: async () => {
      const res = await api.get<ReferralLink[]>('/api/pro/referrals?sort=conversions&limit=5');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // MUA Suggestions
  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ['pro-suggestions'],
    queryFn: async () => {
      const res = await api.get<Suggestion[]>('/api/pro/mua/suggestions');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 300_000,
  });

  const stages = pipeline ?? [];
  const events = activity ?? [];
  const links = referralLinks ?? [];
  const tips = suggestions ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Pro Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
          Manage your clients, pipeline, and partner business at a glance.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))
        ) : (
          <>
            <StatCard label="Total Clients" value={fmtNum(stats?.totalClients ?? 0)} icon={Users} />
            <StatCard label="Active Clients" value={fmtNum(stats?.activeClients ?? 0)} icon={UserCheck} />
            <StatCard label="Conversions" value={fmtNum(stats?.pipelineConversions ?? 0)} icon={GitMerge} />
            <StatCard label="Revenue" value={fmtCurrency(stats?.revenue ?? 0)} icon={DollarSign} />
            <StatCard label="Pending Onboarding" value={fmtNum(stats?.pendingOnboarding ?? 0)} icon={ClipboardCheck} />
            <StatCard label="Conversion Rate" value={fmtPercent(stats?.conversionRate ?? 0)} icon={Percent} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction icon={Plus} label="Onboard New Client" onClick={() => router.push('/pro/clients?action=onboard')} />
          <QuickAction icon={GitMerge} label="View Pipeline" onClick={() => router.push('/pro/pipeline')} />
          <QuickAction icon={Package} label="Create Package" onClick={() => router.push('/pro/pricing?action=create')} />
          <QuickAction icon={BarChart3} label="View Analytics" onClick={() => router.push('/pro/analytics')} />
        </div>
      </div>

      {/* Pipeline funnel + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline mini-view */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Client Pipeline</h3>
            <button
              onClick={() => router.push('/pro/pipeline')}
              className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
            >
              Full view <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-5">
            {stages.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No pipeline data yet.</p>
            ) : (
              <PipelineFunnel stages={stages} />
            )}
          </div>
        </div>

        {/* Recent client activity */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Recent Client Activity</h3>
            <button
              onClick={() => router.push('/pro/clients')}
              className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {events.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No recent activity.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/70">
                      <span className="font-medium text-white/80">{ev.clientName}</span>{' '}
                      <span className="text-zinc-400">{ev.action}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400/60">{timeAgo(ev.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Referral links + MUA Suggestions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top referral links */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Top Referral Links</h3>
            <button
              onClick={() => router.push('/pro/referrals')}
              className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-primary"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {links.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No referral links yet.</p>
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
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {fmtNum(link.clicks)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitMerge className="h-3 w-3" />
                      {link.conversions}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MUA Pro Suggestions */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">MUA Pro Suggestions</h3>
          </div>
          <div className="space-y-3 p-5">
            {tips.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No suggestions right now.</p>
            ) : (
              tips.map((tip) => (
                <div key={tip.id} className="rounded-xl border border-white/[0.04] bg-zinc-900/60 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {tip.type === 'action' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    ) : tip.type === 'insight' ? (
                      <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    )}
                    <span className="text-xs font-semibold text-zinc-100">{tip.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-400">{tip.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

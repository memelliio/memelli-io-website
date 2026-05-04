'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CrmStats {
  totalContacts: number;
  newContactsToday: number;
  activeDeals: number;
  pipelineValue: number;
  followUpsDueToday: number;
  winRate: number;
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  tenant: string;
  score: 'hot' | 'warm' | 'cold';
  status: string;
  createdAt: string;
}

interface Deal {
  id: string;
  name: string;
  tenant: string;
  contact: string;
  stage: string;
  value: number;
  probability: number;
  closeDate: string;
}

interface FollowUp {
  id: string;
  contactName: string;
  type: string;
  tenant: string;
  dueDate: string;
  status: 'overdue' | 'due_today' | 'upcoming';
}

interface TopTenant {
  id: string;
  name: string;
  dealsClosed: number;
  revenue: number;
  conversionRate: number;
}

interface CrmData {
  stats: CrmStats;
  pipeline: PipelineStage[];
  recentLeads: Lead[];
  recentDeals: Deal[];
  followUps: FollowUp[];
  topTenants: TopTenant[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

function val(v: number | undefined | null): string {
  return v != null ? v.toLocaleString() : '\u2014';
}

const SCORE_COLORS: Record<Lead['score'], string> = {
  hot: 'bg-red-500/15 text-red-400 border-red-500/30',
  warm: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  cold: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
};

const STAGE_COLORS: Record<string, string> = {
  Prospect: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  Qualified: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Proposal: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Negotiation: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Closed Won': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Closed Lost': 'bg-red-500/15 text-red-400 border-red-500/30'
};

const PIPELINE_COLORS: Record<string, string> = {
  Prospect: 'bg-[hsl(var(--muted-foreground))]',
  Qualified: 'bg-blue-500',
  Proposal: 'bg-violet-500',
  Negotiation: 'bg-amber-500',
  'Closed Won': 'bg-emerald-500',
  'Closed Lost': 'bg-red-500'
};

const FOLLOWUP_STYLES: Record<FollowUp['status'], { border: string; text: string; label: string }> = {
  overdue: { border: 'border-red-500/30', text: 'text-red-400', label: 'Overdue' },
  due_today: { border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Due Today' },
  upcoming: { border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Upcoming' }
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CrmOverviewPage() {
  const api = useApi();

  const [data, setData] = useState<CrmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<CrmData>('/api/admin/crm/stats');
    if (res.error) {
      setError(res.error);
    } else {
      setData(res.data);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Derived ---- */
  const stats = data?.stats;
  const pipeline = data?.pipeline ?? [];
  const leads = data?.recentLeads ?? [];
  const deals = data?.recentDeals ?? [];
  const followUps = data?.followUps ?? [];
  const topTenants = data?.topTenants ?? [];

  const maxPipelineCount = Math.max(...pipeline.map((s) => s.count), 1);

  /* ---------------------------------------------------------------- */
  /*  Stat Card                                                        */
  /* ---------------------------------------------------------------- */

  function StatCard({
    label,
    value,
    icon: Icon,
    format = 'number'
  }: {
    label: string;
    value: number | undefined | null;
    icon: React.ComponentType<any>;
    format?: 'number' | 'currency' | 'percent';
  }) {
    let display: string;
    if (value == null) {
      display = '\u2014';
    } else if (format === 'currency') {
      display = formatCurrency(value);
    } else if (format === 'percent') {
      display = `${value}%`;
    } else {
      display = value.toLocaleString();
    }

    return (
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">{label}</span>
          <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{display}</p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ---- Header ---- */}
        <div className="mb-8 flex items-center gap-3">
          <Target className="h-7 w-7 text-red-400" />
          <h1 className="text-2xl font-bold tracking-tight">CRM &amp; Client Activity</h1>
        </div>

        {/* ---- Loading ---- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
            <LoadingGlobe size="lg" />
            <p className="mt-3 text-sm">Loading CRM data...</p>
          </div>
        )}

        {/* ---- Error ---- */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="mt-4 rounded-xl bg-[hsl(var(--muted))] px-5 py-2.5 text-sm text-[hsl(var(--foreground))] hover:bg-white/[0.1] transition-all duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* ---- Content ---- */}
        {!loading && !error && data && (
          <>
            {/* -- Stats Row -- */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total Contacts" value={stats?.totalContacts} icon={Users} />
              <StatCard label="New Contacts Today" value={stats?.newContactsToday} icon={UserPlus} />
              <StatCard label="Active Deals" value={stats?.activeDeals} icon={Handshake} />
              <StatCard label="Pipeline Value" value={stats?.pipelineValue} icon={DollarSign} format="currency" />
              <StatCard label="Follow-ups Due" value={stats?.followUpsDueToday} icon={Clock} />
              <StatCard label="Win Rate" value={stats?.winRate} icon={TrendingUp} format="percent" />
            </div>

            {/* -- Pipeline Overview -- */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-red-400" />
                Pipeline Overview
              </h2>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
                <div className="space-y-4">
                  {pipeline.map((stage) => {
                    const barWidth = Math.max((stage.count / maxPipelineCount) * 100, 4);
                    const barColor = PIPELINE_COLORS[stage.name] ?? 'bg-blue-500';
                    return (
                      <div key={stage.name} className="flex items-center gap-4">
                        <span className="w-32 shrink-0 text-sm font-medium text-[hsl(var(--foreground))]">{stage.name}</span>
                        <div className="flex-1">
                          <div className="h-7 rounded-xl bg-[hsl(var(--muted))] overflow-hidden">
                            <div
                              className={`h-full rounded-xl ${barColor} flex items-center pl-3 transition-all`}
                              style={{ width: `${barWidth}%` }}
                            >
                              <span className="text-xs font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">
                                {stage.count} deals
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="w-28 shrink-0 text-right text-sm font-medium text-[hsl(var(--muted-foreground))]">
                          {formatCurrency(stage.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* -- Recent Leads Table -- */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-red-400" />
                Recent Leads
              </h2>
              <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
                          No recent leads
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                        >
                          <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{lead.name}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                              {lead.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{lead.source}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{lead.tenant}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${SCORE_COLORS[lead.score]}`}
                            >
                              {lead.score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{lead.status}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(lead.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -- Recent Deals Table -- */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                <Handshake className="h-5 w-5 text-red-400" />
                Recent Deals
              </h2>
              <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Deal Name</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Stage</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Value</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">Probability</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Close Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
                          No recent deals
                        </td>
                      </tr>
                    ) : (
                      deals.map((deal) => (
                        <tr
                          key={deal.id}
                          className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                        >
                          <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{deal.name}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{deal.tenant}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{deal.contact}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                STAGE_COLORS[deal.stage] ?? 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'
                              }`}
                            >
                              {deal.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[hsl(var(--foreground))]">
                            {formatCurrency(deal.value)}
                          </td>
                          <td className="px-4 py-3 text-center text-[hsl(var(--muted-foreground))]">{deal.probability}%</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(deal.closeDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -- Follow-up Queue -- */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-400" />
                Follow-up Queue
              </h2>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
                {followUps.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">No follow-ups scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((fu) => {
                      const style = FOLLOWUP_STYLES[fu.status];
                      return (
                        <div
                          key={fu.id}
                          className={`flex items-center justify-between rounded-xl border ${style.border} bg-[hsl(var(--muted))] px-4 py-3`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`inline-block rounded-full border ${style.border} px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.text}`}
                            >
                              {style.label}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{fu.contactName}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  {fu.type.toLowerCase() === 'call' ? (
                                    <Phone className="h-3 w-3" />
                                  ) : (
                                    <Mail className="h-3 w-3" />
                                  )}
                                  {fu.type}
                                </span>
                                <span className="mx-1.5">&middot;</span>
                                {fu.tenant}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(fu.dueDate)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* -- Top Performing Tenants -- */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-400" />
                Top Performing Tenants
              </h2>
              <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">Deals Closed</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Revenue</th>
                      <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTenants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
                          No tenant data
                        </td>
                      </tr>
                    ) : (
                      topTenants.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                        >
                          <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{t.name}</td>
                          <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{val(t.dealsClosed)}</td>
                          <td className="px-4 py-3 text-right font-medium text-[hsl(var(--foreground))]">
                            {formatCurrency(t.revenue)}
                          </td>
                          <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{t.conversionRate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

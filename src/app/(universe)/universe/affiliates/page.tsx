'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Users,
  Globe,
  DollarSign,
  TrendingUp,
  Store,
  Package,
  Award,
  ExternalLink,
  Handshake,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AffiliateStatsOverview {
  activeAffiliates: number;
  activeResellers: number;
  whiteLabelSitesLive: number;
  pendingCommissions: number;
  totalPartnerRevenue: number;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referrals: number;
  conversions: number;
  commissionEarned: number;
  status: 'Active' | 'Pending' | 'Suspended';
}

interface Reseller {
  id: string;
  companyName: string;
  contact: string;
  sitesProvisioned: number;
  activeClients: number;
  revenueShare: number;
  status: 'Active' | 'Pending' | 'Suspended';
  packageTier: string;
}

interface WhiteLabelBuild {
  id: string;
  domain: string;
  partnerName: string;
  brandingStatus: string;
  status: 'Queued' | 'Building' | 'Live' | 'Failed';
  createdAt: string;
}

interface CommissionSummary {
  pendingPayouts: number;
  paidThisMonth: number;
  topEarners: { name: string; amount: number }[];
}

interface PartnerStorefront {
  id: string;
  partnerName: string;
  storeUrl: string;
  revenue: number;
  status: 'Live' | 'Inactive';
}

interface AffiliateStats {
  overview: AffiliateStatsOverview;
  affiliates: Affiliate[];
  resellers: Reseller[];
  whiteLabelQueue: WhiteLabelBuild[];
  commissionSummary: CommissionSummary;
  partnerStorefronts: PartnerStorefront[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Queued: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Building: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
    Failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    Inactive: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  };
  const cls = map[status] ?? 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}

function tierBadge(tier: string) {
  const map: Record<string, string> = {
    Gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Silver: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    Platinum: 'bg-red-500/20 text-red-400 border-red-500/30',
    Bronze: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  const cls = map[tier] ?? 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      <Package className="h-3 w-3" />
      {tier}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<any>;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">{label}</span>
        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{value}</p>
      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{sub}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AffiliatesWhiteLabelPage() {
  const api = useApi();

  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await api.get<AffiliateStats>('/api/admin/affiliates/stats');
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ---- Derived ---- */
  const val = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '\u2014');
  const cur = (v: number | undefined | null) => (v != null ? formatCurrency(v) : '\u2014');

  const overview = data?.overview;

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-red-500" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading affiliate data...</p>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error && !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center max-w-md">
          <p className="text-red-400 font-semibold mb-2">Failed to load affiliate data</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="mt-4 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-white/15 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* -- Header -- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Affiliates &amp; White-Label
          </h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            All affiliate, reseller, and white-label activity across the Memelli Universe
          </p>
        </div>

        {/* -- Stats Row (5 cards) -- */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Active Affiliates"
            value={val(overview?.activeAffiliates)}
            sub="Earning commissions"
            icon={Users}
          />
          <StatCard
            label="Active Resellers"
            value={val(overview?.activeResellers)}
            sub="Partner accounts"
            icon={Handshake}
          />
          <StatCard
            label="White-Label Sites Live"
            value={val(overview?.whiteLabelSitesLive)}
            sub="Deployed domains"
            icon={Globe}
          />
          <StatCard
            label="Pending Commissions"
            value={cur(overview?.pendingCommissions)}
            sub="Awaiting payout"
            icon={DollarSign}
          />
          <StatCard
            label="Total Partner Revenue"
            value={cur(overview?.totalPartnerRevenue)}
            sub="All time"
            icon={TrendingUp}
          />
        </div>

        {/* -- Affiliate Table -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <Users className="h-5 w-5 text-red-400" />
            Affiliates
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Referral Code</th>
                  <th className="px-4 py-3 text-right font-medium">Referrals</th>
                  <th className="px-4 py-3 text-right font-medium">Conversions</th>
                  <th className="px-4 py-3 text-right font-medium">Commission Earned</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.affiliates || data.affiliates.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      No affiliates found
                    </td>
                  </tr>
                ) : (
                  data.affiliates.map((a) => (
                    <tr key={a.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{a.name}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{a.email}</td>
                      <td className="px-4 py-3">
                        <code className="rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1 text-xs text-red-400 font-mono">
                          {a.referralCode}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">{a.referrals.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">{a.conversions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">{formatCurrency(a.commissionEarned)}</td>
                      <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -- Reseller Table -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <Handshake className="h-5 w-5 text-red-400" />
            Resellers
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 text-right font-medium">Sites Provisioned</th>
                  <th className="px-4 py-3 text-right font-medium">Active Clients</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue Share</th>
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.resellers || data.resellers.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      No resellers found
                    </td>
                  </tr>
                ) : (
                  data.resellers.map((r) => (
                    <tr key={r.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{r.companyName}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{r.contact}</td>
                      <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">{r.sitesProvisioned}</td>
                      <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">{r.activeClients}</td>
                      <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">{r.revenueShare}%</td>
                      <td className="px-4 py-3">{tierBadge(r.packageTier)}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -- White-Label Provisioning Queue -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <Globe className="h-5 w-5 text-red-400" />
            White-Label Provisioning Queue
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Partner</th>
                  <th className="px-4 py-3 font-medium">Branding Status</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.whiteLabelQueue || data.whiteLabelQueue.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      No pending white-label builds
                    </td>
                  </tr>
                ) : (
                  data.whiteLabelQueue.map((wl) => (
                    <tr key={wl.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        {wl.domain}
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{wl.partnerName}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{wl.brandingStatus}</td>
                      <td className="px-4 py-3">{statusBadge(wl.status)}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs">
                        {new Date(wl.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -- Commission Summary + Partner Storefronts -- */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Commission Summary */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-400" />
              Commission Summary
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-1">Pending Payouts</p>
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                    {cur(data?.commissionSummary?.pendingPayouts)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-1">Paid This Month</p>
                  <p className="text-xl font-bold tracking-tight text-emerald-400">
                    {cur(data?.commissionSummary?.paidThisMonth)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  Top Earners
                </p>
                {(!data?.commissionSummary?.topEarners || data.commissionSummary.topEarners.length === 0) ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No data yet</p>
                ) : (
                  <ul className="space-y-2">
                    {data.commissionSummary.topEarners.map((earner, i) => (
                      <li
                        key={earner.name}
                        className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                            {i + 1}
                          </span>
                          <span className="text-sm text-[hsl(var(--foreground))]">{earner.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {formatCurrency(earner.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Partner Storefronts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Store className="h-5 w-5 text-red-400" />
              Partner Storefronts
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
              {(!data?.partnerStorefronts || data.partnerStorefronts.length === 0) ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No partner storefronts</p>
              ) : (
                <ul className="space-y-3">
                  {data.partnerStorefronts.map((ps) => (
                    <li
                      key={ps.id}
                      className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{ps.partnerName}</span>
                        <a
                          href={ps.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {ps.storeUrl}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {formatCurrency(ps.revenue)}
                        </span>
                        {statusBadge(ps.status)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

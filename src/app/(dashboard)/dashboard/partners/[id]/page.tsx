'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Percent,
  Activity,
  CreditCard,
  UserPlus,
  UsersRound,
  BarChart3,
  Palette,
  Clock,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge, type BadgeVariant } from '../../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { MetricTile } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PartnerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tier: string;
  mode: string;
  status: string;
  commissionRate: number;
  totalEarned: number;
  pendingBalance: number;
  referralCount: number;
  conversionRate: number;
  code?: string;
  createdAt: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    customDomain?: string;
  };
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  orderId?: string;
  description?: string;
  createdAt: string;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: string;
  revenue: number;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tierVariant: Record<string, BadgeVariant> = {
  STARTER: 'muted',
  SILVER: 'default',
  GOLD: 'warning',
  PLATINUM: 'primary',
  DIAMOND: 'primary',
};

const statusVariant: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'destructive',
  INACTIVE: 'muted',
  PAID: 'success',
  UNPAID: 'warning',
  CONVERTED: 'success',
  LEAD: 'primary',
};

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'commissions', label: 'Commissions', icon: CreditCard },
  { key: 'referrals', label: 'Referrals', icon: UserPlus },
  { key: 'team', label: 'Team', icon: UsersRound },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'branding', label: 'Branding', icon: Palette },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PartnerDetailPage() {
  const params = useParams();
  const partnerId = params.id as string;
  const api = useApi();

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Tab data
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<any>(`/api/partners/${partnerId}/dashboard`);
    if (res.data) {
      const d = res.data.data ?? res.data;
      setPartner(d.partner ?? d);
      setRecentActivity(d.recentActivity ?? []);
      setCommissions(d.commissions ?? []);
      setReferrals(d.referrals ?? []);
      setTeam(d.team ?? []);
    }
    setLoading(false);
  }, [partnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadTabData = useCallback(
    async (tab: TabKey) => {
      if (tab === 'overview') return;
      setTabLoading(true);
      try {
        if (tab === 'commissions' && commissions.length === 0) {
          const res = await api.get<any>(`/api/partners/${partnerId}/commissions`);
          if (res.data) setCommissions(res.data.data ?? res.data ?? []);
        } else if (tab === 'referrals' && referrals.length === 0) {
          const res = await api.get<any>(`/api/partners/${partnerId}/referrals`);
          if (res.data) setReferrals(res.data.data ?? res.data ?? []);
        } else if (tab === 'team' && team.length === 0) {
          const res = await api.get<any>(`/api/partners/${partnerId}/team`);
          if (res.data) setTeam(res.data.data ?? res.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setTabLoading(false);
      }
    },
    [partnerId, commissions.length, referrals.length, team.length]
  );

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Partner not found</p>
        <Link href="/dashboard/partners" className="mt-3 text-sm text-red-400 hover:underline">
          Back to Partners
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-6 p-8">
        {/* Back + Header */}
        <div>
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partners
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{partner.name}</h1>
                <Badge variant={tierVariant[partner.tier] ?? 'muted'}>{partner.tier}</Badge>
                <Badge variant={statusVariant[partner.status] ?? 'muted'} className="capitalize">
                  {partner.status.toLowerCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{partner.email}</p>
              {partner.company && (
                <p className="text-sm text-muted-foreground mt-0.5">{partner.company}</p>
              )}
            </div>
            {partner.code && (
              <span className="font-mono text-red-300 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-2 text-sm">
                {partner.code}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.04]">
          <div className="flex items-center gap-1 -mb-px">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === key
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/[0.08]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {tabLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Tiles */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricTile
                    label="Total Earned"
                    value={fmtCurrency(Number(partner.totalEarned) || 0)}
                    icon={<DollarSign className="h-4 w-4" />}
                    trend={partner.totalEarned > 0 ? 'up' : 'flat'}
                  />
                  <MetricTile
                    label="Pending Balance"
                    value={fmtCurrency(Number(partner.pendingBalance) || 0)}
                    icon={<CreditCard className="h-4 w-4" />}
                    trend={partner.pendingBalance > 0 ? 'flat' : 'flat'}
                  />
                  <MetricTile
                    label="Referrals"
                    value={partner.referralCount ?? 0}
                    icon={<UserPlus className="h-4 w-4" />}
                    trend={partner.referralCount > 0 ? 'up' : 'flat'}
                  />
                  <MetricTile
                    label="Conversion Rate"
                    value={`${partner.conversionRate ?? 0}%`}
                    icon={<Percent className="h-4 w-4" />}
                    trend={
                      partner.conversionRate >= 50
                        ? 'up'
                        : partner.conversionRate > 0
                          ? 'flat'
                          : 'down'
                    }
                  />
                </div>

                {/* Recent Activity */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                  <div className="p-6 border-b border-white/[0.04]">
                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Recent Activity</h2>
                  </div>
                  <div className="p-0">
                    {recentActivity.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Activity className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {recentActivity.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.04] transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-muted p-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {item.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.type}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Commissions Tab */}
            {activeTab === 'commissions' && (
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Commission History</h2>
                </div>
                {commissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <CreditCard className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No commissions recorded</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-left">
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Description</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {commissions.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.04] transition-all duration-200">
                            <td className="px-6 py-4 text-foreground">{c.description ?? 'Commission'}</td>
                            <td className="px-6 py-4 font-medium text-emerald-400">{fmtCurrency(c.amount)}</td>
                            <td className="px-6 py-4">
                              <Badge variant={statusVariant[c.status] ?? 'muted'} className="capitalize">
                                {c.status.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Referrals</h2>
                </div>
                {referrals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <UserPlus className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No referrals yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-left">
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Email</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Revenue</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {referrals.map((r) => (
                          <tr key={r.id} className="hover:bg-white/[0.04] transition-all duration-200">
                            <td className="px-6 py-4 font-medium text-foreground">{r.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{r.email}</td>
                            <td className="px-6 py-4">
                              <Badge variant={statusVariant[r.status] ?? 'muted'} className="capitalize">
                                {r.status.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-emerald-400 font-medium">{fmtCurrency(r.revenue)}</td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
                  <UsersRound className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Team Members</h2>
                </div>
                {team.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <UsersRound className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No team members</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-left">
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Email</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Role</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {team.map((m) => (
                          <tr key={m.id} className="hover:bg-white/[0.04] transition-all duration-200">
                            <td className="px-6 py-4 font-medium text-foreground">{m.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{m.email}</td>
                            <td className="px-6 py-4 text-foreground capitalize">{m.role.toLowerCase()}</td>
                            <td className="px-6 py-4">
                              <Badge variant={statusVariant[m.status] ?? 'muted'} className="capitalize">
                                {m.status.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">
                              {new Date(m.joinedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Commission Rate</p>
                    <p className="text-3xl font-semibold tracking-tight text-foreground">{partner.commissionRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Lifetime Earnings</p>
                    <p className="text-3xl font-semibold tracking-tight text-emerald-400">{fmtCurrency(Number(partner.totalEarned) || 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Avg. Revenue per Referral</p>
                    <p className="text-3xl font-semibold tracking-tight text-foreground">
                      {partner.referralCount > 0
                        ? fmtCurrency((Number(partner.totalEarned) || 0) / partner.referralCount)
                        : '$0.00'}
                    </p>
                  </div>
                </div>
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Detailed analytics charts coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                  <div className="p-6 border-b border-white/[0.04]">
                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Branding Settings</h2>
                  </div>
                  <div className="p-6">
                    {partner.branding ? (
                      <div className="space-y-6">
                        {partner.branding.logoUrl && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Logo</p>
                            <img
                              src={partner.branding.logoUrl}
                              alt="Partner logo"
                              className="h-16 w-auto rounded-xl border border-border"
                            />
                          </div>
                        )}
                        {partner.branding.primaryColor && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Primary Color</p>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-xl border border-border"
                                style={{ backgroundColor: partner.branding.primaryColor }}
                              />
                              <span className="font-mono text-sm text-foreground">
                                {partner.branding.primaryColor}
                              </span>
                            </div>
                          </div>
                        )}
                        {partner.branding.customDomain && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Custom Domain</p>
                            <p className="text-sm text-foreground font-mono">{partner.branding.customDomain}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Palette className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No branding configured</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Custom branding options will appear here when available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
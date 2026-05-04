'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  CreditCard,
  Zap,
  BarChart3,
  Search,
  Video,
  Gift,
  Palette,
  ExternalLink,
  Play,
  TrendingUp,
  Users,
  Package,
  ArrowUpRight,
} from 'lucide-react';
import { PageHeader, Card, CardContent, Badge, Button, Skeleton } from '@memelli/ui';
import { API_URL } from '@/lib/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueDashboard {
  totalLtv: number;
  activeUsers: number;
  freeProductsIssued: number;
  conversions: number;
}

type EngineStatus = 'LIVE' | 'ACTIVE' | 'BUILDING';

interface Engine {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  status: EngineStatus;
  href?: string;
  taskName: string;
  accentColor: string;
}

// ─── Engine Definitions ───────────────────────────────────────────────────────

const ENGINES: Engine[] = [
  {
    id: 'corp-builder',
    icon: <Building2 className="h-6 w-6" />,
    name: 'Corporation Builder',
    description:
      'Voice-guided Secretary of State registration across all 50 states. Screen recording captures navigation paths — system learns and automates each state\'s flow. Free to users; generates session intelligence.',
    status: 'LIVE',
    taskName: 'Run Corporation Builder',
    accentColor: 'text-red-400',
  },
  {
    id: 'ein-walkthrough',
    icon: <FileText className="h-6 w-6" />,
    name: 'EIN Walkthrough',
    description:
      'IRS EIN automation guide. Records and learns every IRS portal path. Builds Playwright playbooks from sessions. Free product that converts users into long-term customers while growing system intelligence.',
    status: 'LIVE',
    taskName: 'Run EIN Walkthrough',
    accentColor: 'text-red-400',
  },
  {
    id: 'business-credit',
    icon: <CreditCard className="h-6 w-6" />,
    name: 'Business Credit Builder',
    description:
      'Dun & Bradstreet research, Net 30 account signups, and NAV API integration. Screen records every credit portal to learn and automate flows. Premium features monetize the automation layer.',
    status: 'ACTIVE',
    href: '/dashboard/credit/business-credit',
    taskName: 'Run Business Credit Builder',
    accentColor: 'text-orange-400',
  },
  {
    id: 'auto-funder',
    icon: <Zap className="h-6 w-6" />,
    name: 'Auto Funder',
    description:
      'Soft-pull bank and credit union matching with simultaneous multi-bank applications. Tracks approvals and denials across all institutions. Session recordings become training data. Backend fee or subscription model.',
    status: 'LIVE',
    href: '/dashboard/credit/auto-funder',
    taskName: 'Run Auto Funder',
    accentColor: 'text-red-400',
  },
  {
    id: 'sba-builder',
    icon: <BarChart3 className="h-6 w-6" />,
    name: 'SBA Builder',
    description:
      'SBA guidelines research, document requirement automation, and application prep. Proprietary SBS simulator scoring model — an independent alternative to NAV. Patent-worthy scoring engine.',
    status: 'ACTIVE',
    href: '/dashboard/credit/sbs-simulator',
    taskName: 'Run SBA Builder',
    accentColor: 'text-orange-400',
  },
  {
    id: 'soft-pull',
    icon: <Search className="h-6 w-6" />,
    name: 'Soft Pull Engine',
    description:
      'Zero-cost credit pull technology we fully own. Handles connection, form submission, and data retrieval. Customer sees live results instantly. Charge backend or upfront — pure margin.',
    status: 'LIVE',
    href: '/dashboard/credit/pull',
    taskName: 'Run Soft Pull Engine',
    accentColor: 'text-red-400',
  },
  {
    id: 'video-learning',
    icon: <Video className="h-6 w-6" />,
    name: 'Video Learning Engine',
    description:
      'Every customer session becomes training data. Screen recordings generate Playwright automation paths. Voice recordings feed conversation datasets. Customers train the system for free — more users equals a smarter system.',
    status: 'ACTIVE',
    taskName: 'Run Video Learning Engine',
    accentColor: 'text-orange-400',
  },
  {
    id: 'incentive-factory',
    icon: <Gift className="h-6 w-6" />,
    name: 'Incentive Product Factory',
    description:
      'Free corp setup → free EIN → free credit check → free soft pulls. Zero customer acquisition cost. Upsell chain: credit repair ($497) → funding ($697) → full service ($997). Target LTV: $5K–$50K per customer.',
    status: 'ACTIVE',
    taskName: 'Run Incentive Product Factory',
    accentColor: 'text-orange-400',
  },
  {
    id: 'brand-site-generator',
    icon: <Palette className="h-6 w-6" />,
    name: 'Brand & Site Generator',
    description:
      'Generate complete brand packages ($1,997), website packages ($997–$4,997), marketing kits, and SEO bundles in seconds. Each product is a ready-to-sell deliverable. $6,432 per client selling the full stack.',
    status: 'LIVE',
    href: '/dashboard/brand-engine',
    taskName: 'Run Brand and Site Generator',
    accentColor: 'text-primary',
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusVariant(status: EngineStatus): 'success' | 'warning' | 'info' {
  if (status === 'LIVE') return 'success';
  if (status === 'ACTIVE') return 'info';
  return 'warning';
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Metric Strip ─────────────────────────────────────────────────────────────

interface MetricStripProps {
  data: RevenueDashboard | null;
  loading: boolean;
}

function MetricStrip({ data, loading }: MetricStripProps) {
  const metrics = [
    {
      label: 'Total LTV Generated',
      value: data ? formatCurrency(data.totalLtv) : '—',
      icon: <TrendingUp className="h-5 w-5 text-red-400" />,
    },
    {
      label: 'Active Users',
      value: data ? formatNumber(data.activeUsers) : '—',
      icon: <Users className="h-5 w-5 text-red-400" />,
    },
    {
      label: 'Free Products Issued',
      value: data ? formatNumber(data.freeProductsIssued) : '—',
      icon: <Package className="h-5 w-5 text-red-400" />,
    },
    {
      label: 'Conversions',
      value: data ? formatNumber(data.conversions) : '—',
      icon: <ArrowUpRight className="h-5 w-5 text-red-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-white/[0.06] bg-card px-5 py-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">{m.icon}</div>
          {loading ? (
            <Skeleton variant="line" width="60%" height={28} />
          ) : (
            <p className="text-2xl font-bold text-foreground tracking-tight">{m.value}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Engine Card ──────────────────────────────────────────────────────────────

interface EngineCardProps {
  engine: Engine;
  onDispatch: (engine: Engine) => void;
  dispatching: boolean;
}

function EngineCard({ engine, onDispatch, dispatching }: EngineCardProps) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-card backdrop-blur-sm p-5 flex flex-col gap-4 hover:border-red-500/20 hover:bg-card transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/[0.08] border border-red-500/10 ${engine.accentColor}`}
          >
            {engine.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">{engine.name}</h3>
            <Badge variant={statusVariant(engine.status)} className="mt-1">
              {engine.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{engine.description}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {engine.href && (
          <Link href={engine.href}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Open Engine
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Play className="h-3.5 w-3.5" />}
          isLoading={dispatching}
          onClick={() => onDispatch(engine)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/[0.08]"
        >
          Dispatch Task
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RevenueEnginesPage() {
  const [dashboard, setDashboard] = useState<RevenueDashboard | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getToken = () =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('memelli_token') : null;

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/revenue-dashboard`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        setDashboard(json);
      }
    } catch {
      // Silently fail — metrics will show placeholder dashes
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleDispatch = useCallback(
    async (engine: Engine) => {
      if (dispatchingId) return;
      setDispatchingId(engine.id);
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/admin/command-center/dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            task: engine.taskName,
            source: 'revenue-engine',
          }),
        });
        if (res.ok) {
          setToastMessage(`Dispatched: ${engine.name}`);
        } else {
          setToastMessage(`Dispatch failed for ${engine.name}`);
        }
      } catch {
        setToastMessage(`Error dispatching ${engine.name}`);
      } finally {
        setDispatchingId(null);
        setTimeout(() => setToastMessage(null), 3500);
      }
    },
    [dispatchingId],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 sm:px-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-red-500/20 bg-card px-4 py-3 text-sm text-foreground shadow-xl shadow-black/40 transition-all duration-300">
          {toastMessage}
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <PageHeader
          title="Revenue Empire Engines"
          subtitle="8 autonomous revenue engines — from free product acquisition to multi-thousand-dollar LTV upsell chains."
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics', href: '/dashboard/analytics' },
            { label: 'Revenue Engines' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              isLoading={loadingMetrics}
            >
              Refresh Metrics
            </Button>
          }
        />

        {/* Revenue Metrics Strip */}
        <section aria-label="Revenue metrics">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Empire Totals
          </h2>
          <MetricStrip data={dashboard} loading={loadingMetrics} />
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Active Engines
          </span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        {/* Engine Grid */}
        <section
          aria-label="Revenue engines"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {ENGINES.map((engine) => (
            <EngineCard
              key={engine.id}
              engine={engine}
              onDispatch={handleDispatch}
              dispatching={dispatchingId === engine.id}
            />
          ))}
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Every engine spawns continuously. Free products &#8594; customers &#8594; recordings &#8594; automation &#8594; infinite loop.
        </p>
      </div>
    </div>
  );
}

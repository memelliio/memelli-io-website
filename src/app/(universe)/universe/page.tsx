'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../contexts/auth';
import {
  Building2,
  Globe,
  DollarSign,
  Bot,
  TicketCheck,
  HeartPulse,
  Users,
  ShoppingCart,
  GraduationCap,
  MessageSquare,
  Zap,
  CreditCard,
  CheckCircle2,
  Landmark,
  Search,
  Paintbrush,
  Link2,
  BrainCircuit,
  AlertTriangle,
  AlertOctagon,
  Info,
  Activity,
  Clock,
  HelpCircle,
  Layers,
  ShoppingBag,
  UserPlus,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminStats {
  totalTenants: number;
  activeSites: number;
  totalRevenue: number;
  activeAiAgents: number;
  openTickets: number;
  systemHealth: number;
}

interface EngineStatus {
  name: string;
  status: 'green' | 'yellow' | 'red';
  activeJobs: number;
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface QuickStats {
  questionsDiscovered: number;
  threadsCreated: number;
  ordersToday: number;
  newLeadsToday: number;
}

/* ------------------------------------------------------------------ */
/*  Engine definitions                                                 */
/* ------------------------------------------------------------------ */

const ENGINE_DEFS: { key: string; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'crm', label: 'CRM', icon: Users },
  { key: 'commerce', label: 'Commerce', icon: ShoppingCart },
  { key: 'coaching', label: 'Coaching', icon: GraduationCap },
  { key: 'communications', label: 'Communications', icon: MessageSquare },
  { key: 'leadpulse', label: 'LeadPulse', icon: Zap },
  { key: 'credit_prequal', label: 'Credit/Prequal', icon: CreditCard },
  { key: 'approval', label: 'Approval', icon: CheckCircle2 },
  { key: 'funding', label: 'Funding', icon: Landmark },
  { key: 'forum_seo', label: 'Forum SEO', icon: Search },
  { key: 'website_builder', label: 'Website Builder', icon: Paintbrush },
  { key: 'affiliate', label: 'Affiliate/Reseller', icon: Link2 },
  { key: 'ai_workforce', label: 'AI Workforce', icon: BrainCircuit },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusDot(status: 'green' | 'yellow' | 'red') {
  const colors = {
    green: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    yellow: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]',
    red: 'bg-primary/70 shadow-[0_0_6px_rgba(192,132,252,0.5)]',
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

function severityBadge(severity: 'critical' | 'warning' | 'info') {
  const map = {
    critical: { bg: 'bg-primary/20 text-primary border-primary/30', Icon: AlertOctagon },
    warning: { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', Icon: AlertTriangle },
    info: { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', Icon: Info },
  };
  const { bg, Icon } = map[severity];
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase ${bg}`}>
      <Icon className="h-3 w-3" />
      {severity}
    </span>
  );
}

function typeBadge(type: string) {
  return (
    <span className="inline-block rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-400 backdrop-blur-sm">
      {type}
    </span>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function UniverseCommandCenter() {
  const api = useApi();
  const { user } = useAuth();

  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch data
  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, enginesRes, activityRes, alertsRes, quickRes] = await Promise.all([
        api.get<AdminStats>('/api/admin/stats'),
        api.get<EngineStatus[]>('/api/admin/engines'),
        api.get<ActivityEvent[]>('/api/admin/activity'),
        api.get<Alert[]>('/api/admin/alerts'),
        api.get<QuickStats>('/api/admin/quick-stats'),
      ]);

      const anyData = statsRes.data || enginesRes.data || activityRes.data || alertsRes.data || quickRes.data;
      if (anyData) {
        setFetchError(false);
      } else {
        setStats((prev) => { if (!prev) setFetchError(true); return prev; });
      }

      if (statsRes.data) setStats(statsRes.data);
      if (enginesRes.data) setEngines(enginesRes.data);
      if (activityRes.data) setActivity(activityRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (quickRes.data) setQuickStats(quickRes.data);
    } catch {
      setStats((prev) => { if (!prev) setFetchError(true); return prev; });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  /* ---- derived values with graceful degradation ---- */
  const val = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '\u2014');
  const pct = (v: number | undefined | null) => (v != null ? `${v}%` : '\u2014');
  const cur = (v: number | undefined | null) => (v != null ? formatCurrency(v) : '\u2014');

  /* ---- engine map for lookup ---- */
  const engineMap = new Map(engines.map((e) => [e.name, e]));

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-primary" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading Universe Command Center...</p>
        </div>
      </div>
    );
  }

  if (fetchError && !stats) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <AlertTriangle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Unable to load</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Could not connect to the Universe API. This may be a temporary issue.
          </p>
          <button
            onClick={fetchAll}
            className="mt-4 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-5 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* -- Header ------------------------------------------------ */}
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">Universe Command Center</h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              {user?.email ? `Signed in as ${user.email}` : 'Master admin overview'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] font-mono">
            <Clock className="h-4 w-4" />
            <span>
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' \u00b7 '}
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* -- Top KPI Row ------------------------------------------- */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Total Tenants */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Total Tenants</span>
              <Building2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(stats?.totalTenants)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">All organizations</p>
          </div>

          {/* Active Sites */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Active Sites</span>
              <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(stats?.activeSites)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Deployed domains</p>
          </div>

          {/* Total Revenue */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{cur(stats?.totalRevenue)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">This month</p>
          </div>

          {/* Active AI Agents */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Active AI Agents</span>
              <Bot className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(stats?.activeAiAgents)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Running now</p>
          </div>

          {/* Open Tickets */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Open Tickets</span>
              <TicketCheck className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(stats?.openTickets)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Awaiting resolution</p>
          </div>

          {/* System Health */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">System Health</span>
              <HeartPulse className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{pct(stats?.systemHealth)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">All services</p>
          </div>
        </div>

        {/* -- Engine Status Grid + Activity Feed -------------------- */}
        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {/* Engine Status -- spans 2 cols */}
          <div className="lg:col-span-2">
            <h2 className="mb-5 text-lg font-semibold text-[hsl(var(--muted-foreground))] tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Engine Status
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {ENGINE_DEFS.map(({ key, label, icon: Icon }) => {
                const eng = engineMap.get(key);
                const status = eng?.status ?? 'red';
                const jobs = eng?.activeJobs;
                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
                      </div>
                      {statusDot(status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                      <Activity className="h-3 w-3" />
                      <span>{jobs != null ? `${jobs} active jobs` : '\u2014'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Feed -- right column */}
          <div>
            <h2 className="mb-5 text-lg font-semibold text-[hsl(var(--muted-foreground))] tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
              {activity.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No recent activity</p>
              ) : (
                <ul className="space-y-4">
                  {activity.map((evt) => (
                    <li key={evt.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {typeBadge(evt.type)}
                        <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(evt.timestamp)}</span>
                      </div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{evt.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* -- Critical Alerts --------------------------------------- */}
        <div className="mb-10">
          <h2 className="mb-5 text-lg font-semibold text-[hsl(var(--muted-foreground))] tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            Critical Alerts
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">No active alerts</p>
            ) : (
              <ul className="space-y-3">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                    {severityBadge(a.severity)}
                    <div className="flex-1">
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{a.message}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{formatTime(a.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* -- Quick Stats Row --------------------------------------- */}
        <div>
          <h2 className="mb-5 text-lg font-semibold text-[hsl(var(--muted-foreground))] tracking-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Today at a Glance
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Questions Discovered</span>
                <HelpCircle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(quickStats?.questionsDiscovered)}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Today</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Threads Created</span>
                <MessageSquare className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(quickStats?.threadsCreated)}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Today</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">Orders</span>
                <ShoppingBag className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(quickStats?.ordersToday)}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Today</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">New Leads</span>
                <UserPlus className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-3 tracking-tight">{val(quickStats?.newLeadsToday)}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Today</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

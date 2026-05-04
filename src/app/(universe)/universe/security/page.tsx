'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  Unlock,
  AlertTriangle,
  AlertCircle,
  Activity,
  Eye,
  Globe,
  Server,
  User,
  Clock,
  RefreshCw,
  XCircle,
  CheckCircle,
  Ban,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  X,
  Filter,
  Loader2
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SecuritySummary {
  eventsToday: number;
  failedLogins: number;
  blockedIPs: number;
  activeAlerts: number;
  apiRequestsToday: number;
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  timestamp: string;
  dismissed: boolean;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'auth' | 'admin' | 'data' | 'api' | 'system' | 'ai' | 'security';
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  details?: string;
}

interface BlockedIP {
  ip: string;
  reason: 'brute_force' | 'manual' | 'suspicious';
  blockedSince: string;
  expires: string | null;
}

interface LoginActivity {
  hour: string;
  successful: number;
  failed: number;
}

interface FailedSource {
  ip: string;
  attempts: number;
  lastAttempt: string;
}

interface RateLimitStatus {
  tier: string;
  limit: number;
  used: number;
  remaining: number;
}

interface ApiConsumer {
  identity: string;
  requests: number;
  lastRequest: string;
}

interface Recent429 {
  timestamp: string;
  ip: string;
  endpoint: string;
  identity: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data generators (used when API endpoints are not yet live)    */
/* ------------------------------------------------------------------ */

function mockSummary(): SecuritySummary {
  return {
    eventsToday: 2847,
    failedLogins: 12,
    blockedIPs: 3,
    activeAlerts: 2,
    apiRequestsToday: 18432,
    securityScore: 87,
  };
}

function mockAlerts(): SecurityAlert[] {
  return [
    {
      id: 'alert-1',
      severity: 'critical',
      description: 'Multiple failed login attempts from 192.168.1.105 — possible brute force attack',
      source: 'Auth Monitor',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      dismissed: false,
    },
    {
      id: 'alert-2',
      severity: 'high',
      description: 'API rate limit exceeded by key sk_live_...3f8a — throttled',
      source: 'Rate Limiter',
      timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
      dismissed: false,
    },
    {
      id: 'alert-3',
      severity: 'medium',
      description: 'Unusual data export volume detected from admin@memelli.com',
      source: 'Data Monitor',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      dismissed: false,
    },
    {
      id: 'alert-4',
      severity: 'low',
      description: 'JWT token refresh rate above normal threshold for user session',
      source: 'Auth Monitor',
      timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      dismissed: false,
    },
  ];
}

function mockAuditLog(): AuditEvent[] {
  const categories: AuditEvent['category'][] = ['auth', 'admin', 'data', 'api', 'system', 'ai', 'security'];
  const outcomes: AuditEvent['outcome'][] = ['success', 'success', 'success', 'failure', 'blocked'];
  const actions = [
    { action: 'login', resource: 'auth/session', category: 'auth' as const, actor: 'admin@memelli.com' },
    { action: 'login_failed', resource: 'auth/session', category: 'auth' as const, actor: '192.168.1.105' },
    { action: 'update_settings', resource: 'tenant/config', category: 'admin' as const, actor: 'admin@memelli.com' },
    { action: 'export_contacts', resource: 'crm/contacts', category: 'data' as const, actor: 'admin@memelli.com' },
    { action: 'api_call', resource: 'api/v1/leads', category: 'api' as const, actor: 'sk_live_...3f8a' },
    { action: 'agent_spawn', resource: 'agents/pool-deploy', category: 'system' as const, actor: 'Melli' },
    { action: 'claude_request', resource: 'ai/claude-lane-1', category: 'ai' as const, actor: 'MUA' },
    { action: 'ip_blocked', resource: 'security/firewall', category: 'security' as const, actor: 'System' },
    { action: 'password_reset', resource: 'auth/password', category: 'auth' as const, actor: 'user@test.com' },
    { action: 'role_change', resource: 'admin/users', category: 'admin' as const, actor: 'admin@memelli.com' },
    { action: 'query_execute', resource: 'data/prisma', category: 'data' as const, actor: 'API Worker' },
    { action: 'rate_limit_hit', resource: 'api/throttle', category: 'api' as const, actor: '10.0.0.55' },
    { action: 'deploy_trigger', resource: 'system/deploy', category: 'system' as const, actor: 'DeployOps' },
    { action: 'model_switch', resource: 'ai/lane-pool', category: 'ai' as const, actor: 'Lane Monitor' },
    { action: 'threat_detected', resource: 'security/scanner', category: 'security' as const, actor: 'Patrol Grid' },
  ];

  return Array.from({ length: 30 }, (_, i) => {
    const entry = actions[i % actions.length];
    const outcome = i < 3 ? 'success' : outcomes[Math.floor(Math.random() * outcomes.length)];
    return {
      id: `audit-${i}`,
      timestamp: new Date(Date.now() - 1000 * 60 * i * 3).toISOString(),
      category: entry.category,
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource,
      outcome,
    };
  });
}

function mockBlockedIPs(): BlockedIP[] {
  return [
    { ip: '192.168.1.105', reason: 'brute_force', blockedSince: new Date(Date.now() - 1000 * 60 * 30).toISOString(), expires: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString() },
    { ip: '10.0.0.88', reason: 'suspicious', blockedSince: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), expires: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString() },
    { ip: '203.0.113.42', reason: 'manual', blockedSince: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), expires: null },
  ];
}

function mockLoginActivity(): LoginActivity[] {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(Date.now() - 1000 * 60 * 60 * (23 - i));
    return {
      hour: hour.toISOString(),
      successful: Math.floor(Math.random() * 30) + 5,
      failed: Math.floor(Math.random() * 8),
    };
  });
}

function mockFailedSources(): FailedSource[] {
  return [
    { ip: '192.168.1.105', attempts: 47, lastAttempt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    { ip: '10.0.0.88', attempts: 23, lastAttempt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { ip: '172.16.0.99', attempts: 11, lastAttempt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { ip: '198.51.100.14', attempts: 8, lastAttempt: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
    { ip: '203.0.113.42', attempts: 5, lastAttempt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  ];
}

function mockRateLimits(): RateLimitStatus[] {
  return [
    { tier: 'Free', limit: 100, used: 78, remaining: 22 },
    { tier: 'Starter', limit: 1000, used: 342, remaining: 658 },
    { tier: 'Pro', limit: 10000, used: 4821, remaining: 5179 },
    { tier: 'Enterprise', limit: 100000, used: 12340, remaining: 87660 },
  ];
}

function mockApiConsumers(): ApiConsumer[] {
  return [
    { identity: 'sk_live_...3f8a', requests: 4821, lastRequest: new Date(Date.now() - 1000 * 30).toISOString() },
    { identity: 'sk_live_...9b2c', requests: 2104, lastRequest: new Date(Date.now() - 1000 * 120).toISOString() },
    { identity: 'admin@memelli.com', requests: 1876, lastRequest: new Date(Date.now() - 1000 * 10).toISOString() },
    { identity: 'sk_live_...1e7d', requests: 987, lastRequest: new Date(Date.now() - 1000 * 300).toISOString() },
    { identity: 'webhook-service', requests: 643, lastRequest: new Date(Date.now() - 1000 * 60).toISOString() },
  ];
}

function mockRecent429s(): Recent429[] {
  return [
    { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), ip: '10.0.0.55', endpoint: '/api/v1/leads', identity: 'sk_live_...3f8a' },
    { timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(), ip: '10.0.0.55', endpoint: '/api/v1/contacts', identity: 'sk_live_...3f8a' },
    { timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), ip: '172.16.0.99', endpoint: '/api/v1/deals', identity: 'sk_live_...9b2c' },
  ];
}

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  low: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  auth: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  admin: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  data: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  api: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  system: { bg: 'bg-[hsl(var(--muted))]/$1', text: 'text-[hsl(var(--muted-foreground))]' },
  ai: { bg: 'bg-primary/80/15', text: 'text-primary' },
  security: { bg: 'bg-red-500/15', text: 'text-red-400' },
};

const OUTCOME_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: CheckCircle },
  failure: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
  blocked: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Ban },
};

const REASON_LABELS: Record<string, string> = {
  brute_force: 'Brute Force',
  manual: 'Manual Block',
  suspicious: 'Suspicious Activity',
};

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = value;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return <>{value.toLocaleString()}</>;
}

/* ------------------------------------------------------------------ */
/*  Score Ring                                                         */
/* ------------------------------------------------------------------ */

function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="#27272a" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={radius} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        className="transition-all duration-700"
      />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
        className="fill-white text-sm font-bold" fontSize="16">
        {score}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Bar Chart (Login Activity)                                    */
/* ------------------------------------------------------------------ */

function LoginChart({ data }: { data: LoginActivity[] }) {
  const maxVal = Math.max(...data.map(d => d.successful + d.failed), 1);

  return (
    <div className="flex items-end gap-[3px] h-32 w-full">
      {data.map((d, i) => {
        const successH = (d.successful / maxVal) * 100;
        const failH = (d.failed / maxVal) * 100;
        const hour = new Date(d.hour).getHours();
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative">
            <div className="flex flex-col-reverse w-full gap-[1px]">
              <div
                className="bg-emerald-500/70 rounded-t-sm w-full transition-all hover:bg-emerald-400"
                style={{ height: `${Math.max(successH, 2)}%` }}
              />
              {d.failed > 0 && (
                <div
                  className="bg-red-500/70 rounded-t-sm w-full"
                  style={{ height: `${Math.max(failH, 2)}%` }}
                />
              )}
            </div>
            {i % 4 === 0 && (
              <span className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">{hour}:00</span>
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                <span className="text-emerald-400">{d.successful} ok</span>
                {' / '}
                <span className="text-red-400">{d.failed} fail</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rate Limit Bar                                                     */
/* ------------------------------------------------------------------ */

function RateLimitBar({ status }: { status: RateLimitStatus }) {
  const pct = (status.used / status.limit) * 100;
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--muted-foreground))] font-medium">{status.tier}</span>
        <span className="text-[hsl(var(--muted-foreground))]">
          {status.used.toLocaleString()} / {status.limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Glass Card wrapper                                                 */
/* ------------------------------------------------------------------ */

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Tabs                                                        */
/* ------------------------------------------------------------------ */

const AUDIT_FILTERS = ['All', 'Auth', 'Admin', 'Data', 'API', 'System', 'AI', 'Security'] as const;
type AuditFilter = typeof AUDIT_FILTERS[number];

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function SecurityDashboardPage() {
  const api = useApi();

  /* State */
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SecuritySummary>(mockSummary());
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockAlerts());
  const [auditLog, setAuditLog] = useState<AuditEvent[]>(mockAuditLog());
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>(mockBlockedIPs());
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>(mockLoginActivity());
  const [failedSources, setFailedSources] = useState<FailedSource[]>(mockFailedSources());
  const [rateLimits, setRateLimits] = useState<RateLimitStatus[]>(mockRateLimits());
  const [apiConsumers, setApiConsumers] = useState<ApiConsumer[]>(mockApiConsumers());
  const [recent429s, setRecent429s] = useState<Recent429[]>(mockRecent429s());

  const [auditFilter, setAuditFilter] = useState<AuditFilter>('All');
  const [auditPage, setAuditPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* Data fetchers */
  const fetchSummary = useCallback(async () => {
    const { data } = await api.get<SecuritySummary>('/api/admin/security/summary');
    if (data) setSummary(data);
  }, [api]);

  const fetchAlerts = useCallback(async () => {
    const { data } = await api.get<SecurityAlert[]>('/api/admin/security/alerts');
    if (data) setAlerts(data);
  }, [api]);

  const fetchAuditLog = useCallback(async (page = 1) => {
    const { data } = await api.get<AuditEvent[]>(`/api/admin/security/audit-log?page=${page}&limit=30`);
    if (data) {
      if (page === 1) setAuditLog(data);
      else setAuditLog(prev => [...prev, ...data]);
    }
  }, [api]);

  /* Initial load */
  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([fetchSummary(), fetchAlerts(), fetchAuditLog()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Polling */
  useEffect(() => {
    const auditInterval = setInterval(() => fetchAuditLog(), 10000);
    const alertInterval = setInterval(() => fetchAlerts(), 15000);
    const summaryInterval = setInterval(() => fetchSummary(), 15000);
    return () => {
      clearInterval(auditInterval);
      clearInterval(alertInterval);
      clearInterval(summaryInterval);
    };
  }, [fetchAuditLog, fetchAlerts, fetchSummary]);

  /* Actions */
  const dismissAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await api.post(`/api/admin/security/alerts/${id}/dismiss`, {});
  }, [api]);

  const unblockIP = useCallback(async (ip: string) => {
    setBlockedIPs(prev => prev.filter(b => b.ip !== ip));
    await api.post('/api/admin/security/unblock-ip', { ip });
  }, [api]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const next = auditPage + 1;
    await fetchAuditLog(next);
    setAuditPage(next);
    setLoadingMore(false);
  }, [auditPage, fetchAuditLog]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchSummary(), fetchAlerts(), fetchAuditLog()]);
    setRefreshing(false);
  }, [fetchSummary, fetchAlerts, fetchAuditLog]);

  /* Derived */
  const activeAlerts = alerts.filter(a => !a.dismissed);
  const filteredAudit = auditFilter === 'All'
    ? auditLog
    : auditLog.filter(e => e.category === auditFilter.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingGlobe />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Security Dashboard</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">System integrity and threat monitoring</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ============================================================ */}
      {/*  Top Stats Bar                                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Events today */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Events Today</span>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            <AnimatedCounter target={summary.eventsToday} />
          </p>
        </GlassCard>

        {/* Failed Logins */}
        <GlassCard className={`p-4 ${summary.failedLogins > 0 ? 'border-red-500/30' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldX className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Failed Logins</span>
          </div>
          <p className={`text-2xl font-bold ${summary.failedLogins > 0 ? 'text-red-400' : 'text-[hsl(var(--foreground))]'}`}>
            <AnimatedCounter target={summary.failedLogins} />
          </p>
        </GlassCard>

        {/* Blocked IPs */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Blocked IPs</span>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            <AnimatedCounter target={summary.blockedIPs} />
          </p>
        </GlassCard>

        {/* Active Alerts */}
        <GlassCard className={`p-4 ${summary.activeAlerts > 0 ? 'border-red-500/30' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Active Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
              <AnimatedCounter target={summary.activeAlerts} />
            </p>
            {summary.activeAlerts > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-[hsl(var(--foreground))] rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
        </GlassCard>

        {/* API Requests Today */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">API Requests</span>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            <AnimatedCounter target={summary.apiRequestsToday} />
          </p>
        </GlassCard>

        {/* Security Score */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Score</span>
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing score={summary.securityScore} />
          </div>
        </GlassCard>
      </div>

      {/* ============================================================ */}
      {/*  Section 1 — Active Alerts                                    */}
      {/* ============================================================ */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Active Alerts
            {activeAlerts.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                {activeAlerts.length}
              </span>
            )}
          </h2>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
            <ShieldCheck className="w-12 h-12 text-emerald-500/40 mb-3" />
            <p className="text-sm font-medium text-emerald-400">No active alerts</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map(alert => {
              const sev = SEVERITY_STYLES[alert.severity];
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${sev.border} ${sev.bg} transition-all`}
                >
                  <ShieldAlert className={`w-5 h-5 mt-0.5 shrink-0 ${sev.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${sev.bg} ${sev.text} border ${sev.border}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{alert.source}</span>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))] ml-auto shrink-0">{timeAgo(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{alert.description}</p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded transition-colors shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* ============================================================ */}
      {/*  Section 2 — Audit Log                                        */}
      {/* ============================================================ */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            Audit Log
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-normal ml-1">auto-refreshes every 10s</span>
          </h2>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {AUDIT_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setAuditFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                auditFilter === f
                  ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide py-2 px-2 font-medium">Time</th>
                <th className="text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide py-2 px-2 font-medium">Category</th>
                <th className="text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide py-2 px-2 font-medium">Actor</th>
                <th className="text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide py-2 px-2 font-medium">Action</th>
                <th className="text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide py-2 px-2 font-medium">Resource</th>
                <th className="text-left text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide py-2 px-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map(event => {
                const cat = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.system;
                const out = OUTCOME_STYLES[event.outcome] || OUTCOME_STYLES.success;
                const OutIcon = out.icon;
                return (
                  <tr key={event.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors">
                    <td className="py-2 px-2 text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap font-mono">
                      {formatTime(event.timestamp)}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${cat.bg} ${cat.text} uppercase`}>
                        {event.category}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-[hsl(var(--foreground))] text-xs truncate max-w-[160px]">{event.actor}</td>
                    <td className="py-2 px-2 text-[hsl(var(--muted-foreground))] text-xs font-mono">{event.action}</td>
                    <td className="py-2 px-2 text-[hsl(var(--muted-foreground))] text-xs font-mono truncate max-w-[180px]">{event.resource}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded ${out.bg} ${out.text}`}>
                        <OutIcon className="w-3 h-3" />
                        {event.outcome}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg transition-all"
          >
            {loadingMore ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            Load more
          </button>
        </div>
      </GlassCard>

      {/* ============================================================ */}
      {/*  Section 3 — Blocked IPs                                      */}
      {/* ============================================================ */}
      <GlassCard className="p-5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-4">
          <Ban className="w-4 h-4 text-amber-400" />
          Blocked IPs
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full">
            {blockedIPs.length}
          </span>
        </h2>

        {blockedIPs.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">No blocked IPs</div>
        ) : (
          <div className="space-y-2">
            {blockedIPs.map(entry => (
              <div
                key={entry.ip}
                className="flex items-center gap-4 p-3 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg hover:border-[hsl(var(--border))] transition-colors"
              >
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Lock className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-[hsl(var(--foreground))] font-medium">{entry.ip}</span>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] uppercase">
                      {REASON_LABELS[entry.reason] || entry.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                    <span>Blocked {timeAgo(entry.blockedSince)}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">|</span>
                    <span>{entry.expires ? `Expires ${formatDate(entry.expires)}` : 'Permanent'}</span>
                  </div>
                </div>
                <button
                  onClick={() => unblockIP(entry.ip)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-emerald-400 bg-[hsl(var(--muted))] hover:bg-emerald-500/10 border border-[hsl(var(--border))] hover:border-emerald-500/30 rounded-lg transition-all"
                >
                  <Unlock className="w-3 h-3" />
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ============================================================ */}
      {/*  Section 4 — Login Activity                                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-violet-400" />
            Login Activity (24h)
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Successful
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
              <span className="w-2 h-2 bg-red-500 rounded-full" /> Failed
            </span>
          </div>
          <LoginChart data={loginActivity} />
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-4">
            <ShieldX className="w-4 h-4 text-red-400" />
            Top Failed Login Sources
          </h2>
          <div className="space-y-2">
            {failedSources.map((src, i) => (
              <div key={src.ip} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded">
                  {i + 1}
                </span>
                <span className="text-sm font-mono text-[hsl(var(--foreground))] flex-1">{src.ip}</span>
                <span className="text-xs font-bold text-red-400">{src.attempts} attempts</span>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{timeAgo(src.lastAttempt)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ============================================================ */}
      {/*  Section 5 — API Usage                                        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rate Limits */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            Rate Limit Status
          </h2>
          <div className="space-y-4">
            {rateLimits.map(rl => (
              <RateLimitBar key={rl.tier} status={rl} />
            ))}
          </div>
        </GlassCard>

        {/* Top API Consumers */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Top API Consumers
          </h2>
          <div className="space-y-2">
            {apiConsumers.map((consumer, i) => (
              <div key={consumer.identity} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-[hsl(var(--foreground))] block truncate">{consumer.identity}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{timeAgo(consumer.lastRequest)}</span>
                </div>
                <span className="text-xs font-bold text-blue-400">{consumer.requests.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent 429s */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Recent 429 Responses
          </h2>
          {recent429s.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">No recent 429s</div>
          ) : (
            <div className="space-y-2">
              {recent429s.map((r, i) => (
                <div key={i} className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-red-400">{r.endpoint}</span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{timeAgo(r.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                    <span>{r.ip}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">|</span>
                    <span className="truncate">{r.identity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

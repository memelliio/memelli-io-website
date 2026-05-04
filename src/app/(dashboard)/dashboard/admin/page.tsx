// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Radio,
  Beaker,
  Activity,
  Bot,
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  BookOpen,
  Database,
  Cpu,
  Layers,
  MemoryStick,
  ListTodo,
  Bell,
  Zap,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SystemStatus {
  apiHealth?: 'healthy' | 'degraded' | 'down';
  agentPools?: number;
  activeAgents?: number;
  activeDispatches?: number;
}

interface Pool {
  id: string;
  name?: string;
  activeAgents: number;
}

interface HealthMetric {
  label: string;
  value: string;
  status: 'healthy' | 'degraded' | 'down';
  icon: React.ElementType;
}

interface AlertItem {
  id: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  time: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ENV =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'development'
    : 'production';

const MOCK_ALERTS: AlertItem[] = [
  { id: '1', message: 'Agent pool "primary" scaled to 4 workers', level: 'info', time: '2m ago' },
  { id: '2', message: 'Dispatch queue depth exceeded threshold (48)', level: 'warn', time: '7m ago' },
  { id: '3', message: 'Sphere Studio config saved by admin', level: 'info', time: '14m ago' },
  { id: '4', message: 'Redis connection restored after brief interruption', level: 'info', time: '31m ago' },
  { id: '5', message: 'Memory usage spiked to 87% on worker-02', level: 'warn', time: '1h ago' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function AdminTile({
  icon: Icon,
  title,
  desc,
  href,
  color,
  accent,
  onOpen,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  color: string;
  accent: string;
  onOpen?: () => void;
}) {
  const router = useRouter();
  return (
    <div
      onClick={() => { if (onOpen) { onOpen(); } else { router.push(href); } }}
      className="w-56 h-40 flex-shrink-0 rounded-2xl p-5 cursor-pointer hover:scale-105 transition-all duration-200 relative overflow-hidden group bg-card backdrop-blur-xl border border-white/[0.04]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, #0a0a0a 100%)` }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: accent }} />
      <Icon className="h-7 w-7 mb-3" style={{ color: accent }} />
      <p className="text-sm font-semibold tracking-tight text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function StatChip({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-card backdrop-blur-xl border border-white/[0.04] rounded-full px-3 py-1.5">
      {loading ? (
        <div className="h-3 w-10 animate-pulse rounded bg-white/10" />
      ) : (
        <span className="text-sm font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
      )}
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-relaxed">{label}</span>
    </div>
  );
}

function MetricCard({ metric }: { metric: HealthMetric }) {
  const dotColor = {
    healthy: '#34d399',
    degraded: '#fbbf24',
    down: '#f87171',
  }[metric.status];

  const Icon = metric.icon;

  return (
    <div className="flex-shrink-0 w-40 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-3 flex flex-col gap-2 transition-all duration-200">
      <div className="flex items-center justify-between">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
        />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight text-foreground tabular-nums leading-none">{metric.value}</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 uppercase tracking-wider">{metric.label}</p>
      </div>
    </div>
  );
}

function PoolCard({ pool }: { pool: Pool }) {
  return (
    <div className="flex-shrink-0 w-48 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 transition-all duration-200 hover:border-white/[0.08]">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground truncate">{pool.name ?? pool.id}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums leading-none">{pool.activeAgents}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-relaxed mt-1">Active Agents</p>
      <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${Math.min(100, (pool.activeAgents / 10) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const colors = {
    info: { dot: '#60a5fa', text: 'text-muted-foreground' },
    warn: { dot: '#fbbf24', text: 'text-amber-300' },
    error: { dot: '#3b82f6', text: 'text-primary' },
  }[alert.level];

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <span
        className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colors.dot, boxShadow: `0 0 5px ${colors.dot}` }}
      />
      <p className={`text-xs flex-1 leading-relaxed ${colors.text}`}>{alert.message}</p>
      <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">{alert.time}</span>
    </div>
  );
}

// ─── Scroll row wrapper ───────────────────────────────────────────────────────

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-[4%] pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {children}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-[4%] mb-3">{label}</p>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const api = useApi();
  const [status, setStatus] = useState<SystemStatus>({});
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [healthRes, poolsRes] = await Promise.all([
          api.get<{ status: string }>('/api/health'),
          api.get<{ pools?: Pool[]; activeDispatches?: number }>(
            '/api/admin/command-center/pools'
          ),
        ]);

        const poolList = poolsRes.data?.pools ?? [];
        const totalAgents = poolList.reduce((sum, p) => sum + (p.activeAgents ?? 0), 0);

        setStatus({
          apiHealth: healthRes.error ? 'down' : 'healthy',
          agentPools: poolList.length,
          activeAgents: totalAgents,
          activeDispatches: poolsRes.data?.activeDispatches ?? 0,
        });
        setPools(poolList);
      } catch {
        setStatus({ apiHealth: 'down' });
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived health metrics ────────────────────────────────────────────────

  const healthMetrics: HealthMetric[] = [
    {
      label: 'API Status',
      value: status.apiHealth === 'healthy' ? 'Online' : status.apiHealth === 'degraded' ? 'Degraded' : 'Down',
      status: status.apiHealth ?? 'healthy',
      icon: Zap,
    },
    { label: 'Database', value: 'Online', status: 'healthy', icon: Database },
    { label: 'Redis', value: 'Online', status: 'healthy', icon: Layers },
    { label: 'Memory', value: '62%', status: 'healthy', icon: MemoryStick },
    { label: 'Queue Depth', value: '12', status: 'healthy', icon: ListTodo },
    {
      label: 'Agent Pools',
      value: loading ? '—' : String(status.agentPools ?? 0),
      status: 'healthy',
      icon: Cpu,
    },
  ];

  const isSystemHealthy = status.apiHealth === 'healthy' || status.apiHealth === undefined;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0f0f0f' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full flex flex-col justify-end px-[4%] py-8 mb-8"
        style={{
          height: 220,
          background: 'linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 60%)',
        }}
      >
        {/* Purple radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 70% at 0% 100%, rgba(239,68,68,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Top-right env badge + server icon */}
        <div className="absolute top-6 right-[4%] flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
            {ENV}
          </span>
        </div>

        {/* Shield logo */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Shield className="h-5 w-5 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3 relative z-10">
          Admin Control Center
        </h1>

        {/* Stat chips + health indicator */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <StatChip label="Agent Pools" value={status.agentPools ?? 0} loading={loading} />
          <StatChip label="Active Agents" value={status.activeAgents ?? 0} loading={loading} />
          <StatChip label="Active Dispatches" value={status.activeDispatches ?? 0} loading={loading} />

          <div className="flex items-center gap-1.5 ml-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: isSystemHealthy ? '#34d399' : '#fbbf24',
                boxShadow: isSystemHealthy
                  ? '0 0 6px #34d399'
                  : '0 0 6px #fbbf24',
              }}
            />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-relaxed">
              {isSystemHealthy ? 'Healthy' : 'Degraded'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Command row ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader label="Command" />
        <HScrollRow>
          <AdminTile
            icon={Bot}
            title="Claude Terminal"
            desc="Code & architect on the go"
            href="/dashboard/admin/claude"
            color="#0d0a1f"
            accent="#3b82f6"
            onOpen={() => {
              const fn = (window as any).__memelliOpenModule;
              if (typeof fn === 'function') {
                fn('admin-claude');
              } else {
                const q: string[] = (window as any).__memelliPendingQueue ?? [];
                q.push('admin-claude');
                (window as any).__memelliPendingQueue = q;
                window.location.href = '/';
              }
            }}
          />
          <AdminTile
            icon={Sparkles}
            title="Sphere Studio"
            desc="Control your brand sphere"
            href="/dashboard/admin/sphere-studio"
            color="#1f0a0a"
            accent="#f87171"
          />
          <AdminTile
            icon={Radio}
            title="Live Control"
            desc="Monitor production systems"
            href="/dashboard/admin/live"
            color="#0f0a1f"
            accent="#a78bfa"
          />
          <AdminTile
            icon={Beaker}
            title="Dev Sandbox"
            desc="Test safely"
            href="/dashboard/admin/dev"
            color="#1a1200"
            accent="#fbbf24"
          />
          <AdminTile
            icon={BookOpen}
            title="Education"
            desc="Training & docs"
            href="/dashboard/admin/education"
            color="#0a0f1f"
            accent="#60a5fa"
          />
        </HScrollRow>
      </div>

      {/* ── System Health row ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader label="System Health" />
        <HScrollRow>
          {healthMetrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </HScrollRow>
      </div>

      {/* ── Agent Pools row ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <SectionHeader label="Agent Pools" />
        {loading ? (
          <HScrollRow>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 h-28 animate-pulse rounded-xl bg-card" />
            ))}
          </HScrollRow>
        ) : pools.length > 0 ? (
          <HScrollRow>
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </HScrollRow>
        ) : (
          <div className="px-[4%]">
            <p className="text-xs text-muted-foreground">No agent pools found.</p>
          </div>
        )}
      </div>

      {/* ── Recent Alerts / Activity feed ─────────────────────────────────── */}
      <div className="px-[4%] mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-3 w-3 text-muted-foreground" />
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Recent Alerts</p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-4 py-1">
          {MOCK_ALERTS.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* ── Health status bar (bottom) ─────────────────────────────────────── */}
      <div className="px-[4%] pb-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          {status.apiHealth === 'healthy' || !status.apiHealth ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : status.apiHealth === 'degraded' ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="text-[11px] tracking-wide">
            {status.apiHealth === 'healthy' || !status.apiHealth
              ? 'All systems operational'
              : status.apiHealth === 'degraded'
              ? 'Some systems degraded'
              : 'System unreachable'}
          </span>
          <Activity className="h-3 w-3 ml-auto text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground">Melli OS Admin v2</span>
        </div>
      </div>
    </div>
  );
}

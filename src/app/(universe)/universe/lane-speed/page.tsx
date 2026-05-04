'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Activity,
  Gauge,
  Zap,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

interface RateLimits {
  requestsLimit: number;
  requestsRemaining: number;
  requestsReset: string;
  inputTokensLimit: number;
  inputTokensRemaining: number;
  inputTokensReset: string;
  outputTokensLimit: number;
  outputTokensRemaining: number;
  outputTokensReset: string;
  totalTokensLimit: number;
  totalTokensRemaining: number;
  totalTokensReset: string;
}

interface TierInfo {
  tier: number;
  label: string;
  nextTier: number | null;
  nextTierLabel: string | null;
  nextTierInputTokensMin: number | null;
  inputTokensGap: number | null;
  spendToNextTier: string | null;
}

interface LaneData {
  laneId: string;
  laneName: string;
  accountLabel: string;
  status: string;
  apiKeyEnvVar: string;
  probeSuccess: boolean;
  probeError?: string;
  tier: TierInfo | null;
  rateLimits?: RateLimits;
  capacityPercent?: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
  };
  serviceTier?: string;
  organizationId?: string;
}

interface FleetData {
  totalLanes: number;
  activeLanes: number;
  combinedRequestsLimit: number;
  combinedInputTokensLimit: number;
  combinedOutputTokensLimit: number;
}

interface TierStatusResponse {
  lanes: LaneData[];
  fleet: FleetData;
  tierUpgradeAlerts: Array<{
    laneId: string;
    laneName: string;
    currentTier: number;
    nextTier: number;
    message: string;
  }>;
  probedAt: string;
}

interface ResourceLane {
  id: string;
  laneName: string;
  accountLabel: string;
  status: string;
  jobsCompletedToday: number;
  rateLimitRequests: number | null;
  rateLimitRequestsRemaining: number | null;
  rateLimitInputTokens: number | null;
  rateLimitOutputTokens: number | null;
  rateLimitTokensRemaining: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
  priorityOrder: number;
}

interface DashboardMetrics {
  availableLanes: number;
  exhaustedLanes: number;
  nextResetTime: string | null;
  queuedTasks: number;
  completedToday: number;
  avgRunTime: number;
  laneSuccessRates: Record<string, number>;
  exhaustionCount: number;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function statusToHeat(status: string): 'hot' | 'warm' | 'cool' | 'offline' {
  const s = status.toLowerCase();
  if (s === 'available' || s === 'busy') return 'hot';
  if (s === 'cooling_down' || s === 'waiting_reset') return 'warm';
  if (s === 'paused') return 'cool';
  return 'offline';
}

const HEAT_CONFIG = {
  hot: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', label: 'HOT', Icon: Flame },
  warm: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'WARM', Icon: Thermometer },
  cool: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', label: 'COOL', Icon: Snowflake },
  offline: { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'OFFLINE', Icon: XCircle },
};

function tierColor(tier: number): string {
  if (tier >= 4) return '#3b82f6';
  if (tier === 3) return '#f59e0b';
  if (tier === 2) return '#3b82f6';
  return '#6b7280';
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function fmtMs(ms: number): string {
  if (ms < 1000) return ms.toFixed(0) + 'ms';
  return (ms / 1000).toFixed(1) + 's';
}

function fmtCost(tokens: number): string {
  // Rough Claude cost estimate: ~$3/M input, ~$15/M output, blended ~$6/M
  const cost = (tokens / 1_000_000) * 6;
  if (cost < 0.01) return '$0.00';
  return '$' + cost.toFixed(2);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Animated Bar                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function AnimatedBar({
  used,
  limit,
  color,
  label,
  showValues = true,
}: {
  used: number;
  limit: number;
  color: string;
  label: string;
  showValues?: boolean;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : color;

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
        <span>{label}</span>
        {showValues && <span>{fmtNum(used)} / {fmtNum(limit)}</span>}
      </div>
      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 4,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${barColor}40`,
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Lane Card                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function LaneCard({
  lane,
  laneBase,
  dashboard,
}: {
  lane: LaneData;
  laneBase: ResourceLane | undefined;
  dashboard: DashboardMetrics | null;
}) {
  const heat = statusToHeat(lane.status);
  const cfg = HEAT_CONFIG[heat];
  const HeatIcon = cfg.Icon;

  const rpmUsed = lane.rateLimits
    ? lane.rateLimits.requestsLimit - lane.rateLimits.requestsRemaining
    : 0;
  const rpmLimit = lane.rateLimits?.requestsLimit ?? 0;

  const tokensUsed = lane.rateLimits
    ? lane.rateLimits.inputTokensLimit - lane.rateLimits.inputTokensRemaining +
      (lane.rateLimits.outputTokensLimit - lane.rateLimits.outputTokensRemaining)
    : 0;
  const tokensLimit = lane.rateLimits
    ? lane.rateLimits.inputTokensLimit + lane.rateLimits.outputTokensLimit
    : 0;

  const activeTasks = laneBase?.jobsCompletedToday ?? 0;
  const successRate = dashboard?.laneSuccessRates?.[lane.laneId];
  const avgTime = dashboard?.avgRunTime ?? 0;

  return (
    <div
      style={{
        background: 'rgba(15,15,20,0.8)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 12,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{lane.laneName}</span>
            {lane.tier && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: tierColor(lane.tier.tier),
                  background: `${tierColor(lane.tier.tier)}18`,
                  border: `1px solid ${tierColor(lane.tier.tier)}40`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {lane.tier.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{lane.accountLabel}</div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
          }}
        >
          <HeatIcon size={12} color={cfg.color} />
          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* Bars */}
      {lane.probeSuccess && lane.rateLimits ? (
        <div style={{ marginBottom: 14 }}>
          <AnimatedBar
            used={rpmUsed}
            limit={rpmLimit}
            color="#3b82f6"
            label="RPM"
          />
          <AnimatedBar
            used={tokensUsed}
            limit={tokensLimit}
            color="#10b981"
            label="Tokens"
          />
        </div>
      ) : (
        <div
          style={{
            padding: '12px 0',
            marginBottom: 14,
            fontSize: 12,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertTriangle size={13} color="#f59e0b" />
          {lane.probeError || 'No rate data available'}
        </div>
      )}

      {/* Metrics row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{activeTasks}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Tasks Today</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{fmtMs(avgTime)}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Avg Response</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: successRate != null ? (successRate > 90 ? '#22c55e' : '#f59e0b') : '#6b7280' }}>
            {successRate != null ? `${successRate}%` : '--'}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Success</div>
        </div>
      </div>

      {/* Capacity footer */}
      {lane.capacityPercent && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: 16,
            fontSize: 10,
            color: '#9ca3af',
          }}
        >
          <span>Req: {lane.capacityPercent.requests}% free</span>
          <span>In: {lane.capacityPercent.inputTokens}% free</span>
          <span>Out: {lane.capacityPercent.outputTokens}% free</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Page Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function LaneSpeedPage() {
  const api = useApi();
  const [tierData, setTierData] = useState<TierStatusResponse | null>(null);
  const [lanes, setLanes] = useState<ResourceLane[]>([]);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tierRes, lanesRes, dashRes] = await Promise.all([
        api.get<TierStatusResponse>('/api/admin/claude-lanes/tier-status'),
        api.get<ResourceLane[]>('/api/admin/claude-lanes/lanes'),
        api.get<DashboardMetrics>('/api/admin/claude-lanes/dashboard'),
      ]);

      if (tierRes.data) setTierData(tierRes.data);
      if (lanesRes.data) setLanes(Array.isArray(lanesRes.data) ? lanesRes.data : []);
      if (dashRes.data) setDashboard(dashRes.data);
      setError(null);
      setLastPoll(new Date());
      setPollCount((c) => c + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lane data');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  /* ── Computed totals ─────────────────────────────────────────────── */

  const totalRpmUsed = tierData?.lanes.reduce((sum, l) => {
    if (!l.rateLimits) return sum;
    return sum + (l.rateLimits.requestsLimit - l.rateLimits.requestsRemaining);
  }, 0) ?? 0;

  const totalRpmLimit = tierData?.fleet.combinedRequestsLimit ?? 0;

  const totalTokensUsed = tierData?.lanes.reduce((sum, l) => {
    if (!l.rateLimits) return sum;
    return sum + (l.rateLimits.inputTokensLimit - l.rateLimits.inputTokensRemaining) +
      (l.rateLimits.outputTokensLimit - l.rateLimits.outputTokensRemaining);
  }, 0) ?? 0;

  const totalTokensLimit = tierData
    ? tierData.fleet.combinedInputTokensLimit + tierData.fleet.combinedOutputTokensLimit
    : 0;

  const totalCompleted = dashboard?.completedToday ?? 0;
  const totalQueued = dashboard?.queuedTasks ?? 0;
  const estimatedCost = fmtCost(totalTokensUsed);

  /* ── Render ─────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0f' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#6b7280', marginTop: 12, fontSize: 13 }}>Loading lane telemetry...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#e2e8f0',
        padding: '24px 32px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Gauge size={22} color="#3b82f6" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Lane Speed Monitor</h1>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Real-time Claude API lane throughput and capacity
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#6b7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 2s infinite',
              }}
            />
            Live
          </div>
          <span>Poll #{pollCount}</span>
          {lastPoll && <span>{lastPoll.toLocaleTimeString()}</span>}
          <button
            onClick={fetchData}
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 6,
              padding: '5px 10px',
              color: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 20,
            fontSize: 12,
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={14} color="#ef4444" />
          {error}
        </div>
      )}

      {/* ── Top metrics strip ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Total Throughput',
            value: `${fmtNum(totalRpmUsed)} / ${fmtNum(totalRpmLimit)}`,
            sub: 'RPM across all lanes',
            Icon: Activity,
            color: '#3b82f6',
          },
          {
            label: 'Tokens Used',
            value: fmtNum(totalTokensUsed),
            sub: `of ${fmtNum(totalTokensLimit)} capacity`,
            Icon: Cpu,
            color: '#10b981',
          },
          {
            label: 'Est. Cost',
            value: estimatedCost,
            sub: 'this billing window',
            Icon: DollarSign,
            color: '#f59e0b',
          },
          {
            label: 'Tasks Completed',
            value: totalCompleted.toString(),
            sub: `${totalQueued} queued`,
            Icon: CheckCircle2,
            color: '#22c55e',
          },
          {
            label: 'Active Lanes',
            value: `${tierData?.fleet.activeLanes ?? 0} / ${tierData?.fleet.totalLanes ?? 0}`,
            sub: `${dashboard?.exhaustedLanes ?? 0} exhausted`,
            Icon: Zap,
            color: '#06b6d4',
          },
        ].map(({ label, value, sub, Icon, color }) => (
          <div
            key={label}
            style={{
              background: 'rgba(15,15,20,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Combined throughput bars ─────────────────────────────── */}
      <div
        style={{
          background: 'rgba(15,15,20,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Fleet Capacity
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <AnimatedBar
            used={totalRpmUsed}
            limit={totalRpmLimit}
            color="#3b82f6"
            label="Combined RPM"
          />
          <AnimatedBar
            used={totalTokensUsed}
            limit={totalTokensLimit}
            color="#10b981"
            label="Combined Tokens"
          />
        </div>
      </div>

      {/* ── Tier upgrade alerts ──────────────────────────────────── */}
      {tierData?.tierUpgradeAlerts && tierData.tierUpgradeAlerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {tierData.tierUpgradeAlerts.map((alert) => (
            <div
              key={alert.laneId}
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 8,
                padding: '10px 16px',
                marginBottom: 8,
                fontSize: 12,
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Zap size={13} color="#f59e0b" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Lane Cards Grid ──────────────────────────────────────── */}
      {tierData && tierData.lanes.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {tierData.lanes.map((lane) => {
            const laneBase = lanes.find((l) => l.id === lane.laneId);
            return (
              <LaneCard
                key={lane.laneId}
                lane={lane}
                laneBase={laneBase}
                dashboard={dashboard}
              />
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          <Gauge size={40} color="#374151" style={{ marginBottom: 12 }} />
          <div>No lanes registered. Add lanes via the Claude Resource Manager.</div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#4b5563',
        }}
      >
        <span>Memelli Universe Lane Speed Monitor</span>
        <span>Polling every 5s | {tierData?.probedAt ? new Date(tierData.probedAt).toLocaleString() : '--'}</span>
      </div>
    </div>
  );
}

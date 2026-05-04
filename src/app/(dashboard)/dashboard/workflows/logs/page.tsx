'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Clock,
  Zap,
  TrendingUp,
  Timer,
  Filter,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../../../../components/ui/card';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RunStatus = 'success' | 'failed' | 'running';

interface StepTrace {
  id: string;
  nodeName: string;
  nodeType: string;
  status: RunStatus;
  durationMs: number;
  startedAt: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerEvent: string;
  status: RunStatus;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  steps: StepTrace[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_RUNS: WorkflowRun[] = [
  {
    id: 'run-001',
    workflowId: 'wf-1',
    workflowName: 'New Lead Onboarding',
    triggerEvent: 'contact.created',
    status: 'success',
    durationMs: 3420,
    startedAt: new Date(Date.now() - 180000).toISOString(),
    completedAt: new Date(Date.now() - 176580).toISOString(),
    steps: [
      { id: 's1', nodeName: 'Validate Contact', nodeType: 'condition', status: 'success', durationMs: 120, startedAt: new Date(Date.now() - 180000).toISOString(), input: { email: 'jane@example.com' }, output: { valid: true } },
      { id: 's2', nodeName: 'Enrich Data', nodeType: 'action', status: 'success', durationMs: 1800, startedAt: new Date(Date.now() - 179880).toISOString(), input: { contactId: 'ct-42' }, output: { company: 'Acme Inc', phone: '+1234567890' } },
      { id: 's3', nodeName: 'Send Welcome Email', nodeType: 'action', status: 'success', durationMs: 950, startedAt: new Date(Date.now() - 178080).toISOString(), input: { template: 'welcome-v2' }, output: { messageId: 'msg-abc' } },
      { id: 's4', nodeName: 'Assign to Sales Rep', nodeType: 'action', status: 'success', durationMs: 550, startedAt: new Date(Date.now() - 177130).toISOString(), input: { pool: 'sales-team-a' }, output: { assignedTo: 'rep-007' } },
    ],
  },
  {
    id: 'run-002',
    workflowId: 'wf-2',
    workflowName: 'Deal Stage Notification',
    triggerEvent: 'deal.stage_changed',
    status: 'failed',
    durationMs: 1250,
    startedAt: new Date(Date.now() - 600000).toISOString(),
    completedAt: new Date(Date.now() - 598750).toISOString(),
    steps: [
      { id: 's5', nodeName: 'Load Deal Data', nodeType: 'action', status: 'success', durationMs: 340, startedAt: new Date(Date.now() - 600000).toISOString(), input: { dealId: 'deal-99' }, output: { stage: 'negotiation', value: 25000 } },
      { id: 's6', nodeName: 'Send Slack Alert', nodeType: 'integration', status: 'failed', durationMs: 910, startedAt: new Date(Date.now() - 599660).toISOString(), input: { channel: '#deals' }, error: 'Slack API: channel_not_found — channel #deals has been archived' },
    ],
  },
  {
    id: 'run-003',
    workflowId: 'wf-3',
    workflowName: 'Daily Analytics Digest',
    triggerEvent: 'schedule.daily',
    status: 'running',
    durationMs: 4200,
    startedAt: new Date(Date.now() - 4200).toISOString(),
    steps: [
      { id: 's7', nodeName: 'Aggregate Metrics', nodeType: 'action', status: 'success', durationMs: 2100, startedAt: new Date(Date.now() - 4200).toISOString(), input: { period: '24h' }, output: { leads: 47, deals: 12, revenue: 8400 } },
      { id: 's8', nodeName: 'Generate Report', nodeType: 'action', status: 'success', durationMs: 1500, startedAt: new Date(Date.now() - 2100).toISOString(), input: { format: 'html' }, output: { reportId: 'rpt-daily-0315' } },
      { id: 's9', nodeName: 'Send Email Digest', nodeType: 'action', status: 'running', durationMs: 600, startedAt: new Date(Date.now() - 600).toISOString() },
    ],
  },
  {
    id: 'run-004',
    workflowId: 'wf-1',
    workflowName: 'New Lead Onboarding',
    triggerEvent: 'contact.created',
    status: 'success',
    durationMs: 2890,
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: new Date(Date.now() - 1797110).toISOString(),
    steps: [
      { id: 's10', nodeName: 'Validate Contact', nodeType: 'condition', status: 'success', durationMs: 95, startedAt: new Date(Date.now() - 1800000).toISOString(), input: { email: 'bob@corp.io' }, output: { valid: true } },
      { id: 's11', nodeName: 'Enrich Data', nodeType: 'action', status: 'success', durationMs: 1600, startedAt: new Date(Date.now() - 1799905).toISOString(), input: { contactId: 'ct-43' }, output: { company: 'Corp IO', phone: '+19876543210' } },
      { id: 's12', nodeName: 'Send Welcome Email', nodeType: 'action', status: 'success', durationMs: 780, startedAt: new Date(Date.now() - 1798305).toISOString(), input: { template: 'welcome-v2' }, output: { messageId: 'msg-def' } },
      { id: 's13', nodeName: 'Assign to Sales Rep', nodeType: 'action', status: 'success', durationMs: 415, startedAt: new Date(Date.now() - 1797525).toISOString(), input: { pool: 'sales-team-a' }, output: { assignedTo: 'rep-003' } },
    ],
  },
  {
    id: 'run-005',
    workflowId: 'wf-4',
    workflowName: 'Order Confirmation Flow',
    triggerEvent: 'order.created',
    status: 'success',
    durationMs: 1580,
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3598420).toISOString(),
    steps: [
      { id: 's14', nodeName: 'Validate Order', nodeType: 'condition', status: 'success', durationMs: 200, startedAt: new Date(Date.now() - 3600000).toISOString(), input: { orderId: 'ord-88' }, output: { valid: true, total: 149.99 } },
      { id: 's15', nodeName: 'Send Confirmation', nodeType: 'action', status: 'success', durationMs: 1380, startedAt: new Date(Date.now() - 3599800).toISOString(), input: { template: 'order-confirm' }, output: { sent: true } },
    ],
  },
  {
    id: 'run-006',
    workflowId: 'wf-2',
    workflowName: 'Deal Stage Notification',
    triggerEvent: 'deal.stage_changed',
    status: 'failed',
    durationMs: 890,
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7199110).toISOString(),
    steps: [
      { id: 's16', nodeName: 'Load Deal Data', nodeType: 'action', status: 'success', durationMs: 280, startedAt: new Date(Date.now() - 7200000).toISOString(), input: { dealId: 'deal-77' }, output: { stage: 'closed-won', value: 42000 } },
      { id: 's17', nodeName: 'Send Slack Alert', nodeType: 'integration', status: 'failed', durationMs: 610, startedAt: new Date(Date.now() - 7199720).toISOString(), input: { channel: '#deals' }, error: 'Slack API: rate_limited — too many requests' },
    ],
  },
  {
    id: 'run-007',
    workflowId: 'wf-5',
    workflowName: 'Lesson Completion Reward',
    triggerEvent: 'lesson.completed',
    status: 'success',
    durationMs: 2100,
    startedAt: new Date(Date.now() - 5400000).toISOString(),
    completedAt: new Date(Date.now() - 5397900).toISOString(),
    steps: [
      { id: 's18', nodeName: 'Check Progress', nodeType: 'condition', status: 'success', durationMs: 300, startedAt: new Date(Date.now() - 5400000).toISOString(), input: { enrollmentId: 'enr-12' }, output: { progress: 100, lessonCount: 8 } },
      { id: 's19', nodeName: 'Issue Certificate', nodeType: 'action', status: 'success', durationMs: 1200, startedAt: new Date(Date.now() - 5399700).toISOString(), input: { template: 'completion-cert' }, output: { certId: 'cert-056' } },
      { id: 's20', nodeName: 'Send Congrats Email', nodeType: 'action', status: 'success', durationMs: 600, startedAt: new Date(Date.now() - 5398500).toISOString(), input: { template: 'congrats' }, output: { messageId: 'msg-ghi' } },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TRIGGER_LABELS: Record<string, string> = {
  'contact.created': 'Contact Created',
  'deal.stage_changed': 'Deal Stage Changed',
  'order.created': 'Order Created',
  'lesson.completed': 'Lesson Completed',
  'ticket.created': 'Ticket Created',
  'schedule.daily': 'Daily Schedule',
  'schedule.weekly': 'Weekly Schedule',
  'schedule.hourly': 'Hourly Schedule',
  manual: 'Manual',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(0);
  return `${m}m ${rem}s`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `Today ${formatTime(dateStr)}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${formatTime(dateStr)}`;
  return `${d.toLocaleDateString()} ${formatTime(dateStr)}`;
}

/* ------------------------------------------------------------------ */
/*  Status components                                                  */
/* ------------------------------------------------------------------ */

function StatusIcon({ status, size = 16 }: { status: RunStatus; size?: number }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={size} className="text-emerald-400" />;
    case 'failed':
      return <XCircle size={size} className="text-red-400" />;
    case 'running':
      return <Loader2 size={size} className="text-amber-400 animate-spin" />;
  }
}

function StatusBadge({ status }: { status: RunStatus }) {
  const styles: Record<RunStatus, string> = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    running: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      <StatusIcon status={status} size={12} />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Step trace (expanded row)                                          */
/* ------------------------------------------------------------------ */

function StepTracePanel({ steps, onRetry }: { steps: StepTrace[]; onRetry?: () => void }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="border-t border-white/[0.04] bg-background px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Execution Trace ({steps.length} steps)
        </h4>
        {steps.some((s) => s.status === 'failed') && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/40"
          >
            <RotateCcw size={12} />
            Retry Failed
          </button>
        )}
      </div>

      <div className="space-y-1">
        {steps.map((step, idx) => {
          const isExpanded = expandedStep === step.id;
          const isFailed = step.status === 'failed';

          return (
            <div key={step.id}>
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isFailed
                    ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/10'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {/* Step number */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-mono text-white/40">
                  {idx + 1}
                </span>

                {/* Status */}
                <StatusIcon status={step.status} size={14} />

                {/* Name + type */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${isFailed ? 'text-red-300' : 'text-white/80'}`}>
                    {step.nodeName}
                  </span>
                  <span className="ml-2 text-xs text-white/25">{step.nodeType}</span>
                </div>

                {/* Duration */}
                <span className="shrink-0 text-xs font-mono text-white/30">
                  {formatDuration(step.durationMs)}
                </span>

                {/* Expand indicator */}
                {isExpanded ? (
                  <ChevronDown size={14} className="text-white/20" />
                ) : (
                  <ChevronRight size={14} className="text-white/20" />
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="ml-9 mr-3 mb-2 mt-1 space-y-2">
                  <div className="text-xs text-white/30">
                    Started: {formatTime(step.startedAt)}
                  </div>

                  {step.error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400/60 mb-1">Error</div>
                      <p className="text-xs text-red-300 font-mono">{step.error}</p>
                    </div>
                  )}

                  {step.input && (
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">Input</div>
                      <pre className="text-xs text-white/50 font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.output && (
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">Output</div>
                      <pre className="text-xs text-emerald-400/60 font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-white/40">{label}</p>
          <p className="text-xl font-semibold text-white/90 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

type DateFilter = 'today' | 'yesterday' | '7d' | '30d' | 'all';

export default function WorkflowLogsPage() {
  const router = useRouter();
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [retrying, setRetrying] = useState<string | null>(null);

  /* -- Unique workflow names for filter ───────────────────────────── */
  const workflowNames = useMemo(() => {
    const names = Array.from(new Set(MOCK_RUNS.map((r) => r.workflowName)));
    return names.sort();
  }, []);

  /* -- Filter runs ───────────────────────────────────────────────── */
  const filteredRuns = useMemo(() => {
    let runs = MOCK_RUNS;

    if (statusFilter !== 'all') {
      runs = runs.filter((r) => r.status === statusFilter);
    }
    if (workflowFilter !== 'all') {
      runs = runs.filter((r) => r.workflowName === workflowFilter);
    }
    if (dateFilter !== 'all') {
      const now = Date.now();
      const cutoffs: Record<DateFilter, number> = {
        today: now - 24 * 60 * 60 * 1000,
        yesterday: now - 48 * 60 * 60 * 1000,
        '7d': now - 7 * 24 * 60 * 60 * 1000,
        '30d': now - 30 * 24 * 60 * 60 * 1000,
        all: 0,
      };
      runs = runs.filter((r) => new Date(r.startedAt).getTime() >= cutoffs[dateFilter]);
    }

    return runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [statusFilter, workflowFilter, dateFilter]);

  /* -- Stats ─────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const todayCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const todayRuns = MOCK_RUNS.filter((r) => new Date(r.startedAt).getTime() >= todayCutoff);
    const successRuns = todayRuns.filter((r) => r.status === 'success');
    const completedRuns = todayRuns.filter((r) => r.status !== 'running');
    const successRate = completedRuns.length > 0
      ? Math.round((successRuns.length / completedRuns.length) * 100)
      : 0;
    const avgDuration = completedRuns.length > 0
      ? Math.round(completedRuns.reduce((sum, r) => sum + r.durationMs, 0) / completedRuns.length)
      : 0;

    return {
      totalToday: todayRuns.length,
      successRate,
      avgDuration,
      failedToday: todayRuns.filter((r) => r.status === 'failed').length,
    };
  }, []);

  /* -- Retry handler ─────────────────────────────────────────────── */
  const handleRetry = useCallback((runId: string) => {
    setRetrying(runId);
    setTimeout(() => setRetrying(null), 2000);
  }, []);

  /* -- Render ─────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push('/dashboard/workflows')}
            className="flex items-center justify-center rounded-lg h-8 w-8 border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Execution Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredRuns.length} run{filteredRuns.length !== 1 ? 's' : ''} -- Workflow automation execution history
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Runs Today"
          value={stats.totalToday}
          icon={Zap}
          accent="bg-red-500/10 text-red-400"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          accent="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(stats.avgDuration)}
          icon={Timer}
          accent="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Failed Today"
          value={stats.failedToday}
          icon={XCircle}
          accent="bg-red-500/10 text-red-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <Filter size={12} />
          Filters
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RunStatus | 'all')}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 outline-none focus:border-red-500/30 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
        </select>

        {/* Workflow filter */}
        <select
          value={workflowFilter}
          onChange={(e) => setWorkflowFilter(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 outline-none focus:border-red-500/30 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Workflows</option>
          {workflowNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {/* Date filter */}
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-white/30" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 outline-none focus:border-red-500/30 transition-colors appearance-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="yesterday">Last 48h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {(statusFilter !== 'all' || workflowFilter !== 'all' || dateFilter !== 'today') && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setWorkflowFilter('all');
              setDateFilter('today');
            }}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Runs table */}
      <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_160px_100px_90px_160px] gap-4 border-b border-white/[0.06] px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Workflow</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Trigger</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Status</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Duration</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Started</span>
          </div>

          {filteredRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <Activity size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No execution logs found</p>
              <p className="text-xs text-white/20 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredRuns.map((run) => {
              const isExpanded = expandedRun === run.id;
              const isRetrying = retrying === run.id;

              return (
                <div key={run.id} className={`border-b border-white/[0.03] last:border-b-0 ${run.status === 'failed' ? 'bg-red-500/[0.02]' : ''}`}>
                  {/* Row */}
                  <button
                    onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                    className="w-full grid grid-cols-[1fr_160px_100px_90px_160px] gap-4 items-center px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Workflow name */}
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown size={14} className="shrink-0 text-white/20" />
                      ) : (
                        <ChevronRight size={14} className="shrink-0 text-white/20" />
                      )}
                      <span className="text-sm font-medium text-white/80 truncate">
                        {run.workflowName}
                      </span>
                    </div>

                    {/* Trigger */}
                    <span className="text-xs text-white/40">
                      {TRIGGER_LABELS[run.triggerEvent] ?? run.triggerEvent}
                    </span>

                    {/* Status */}
                    <div>
                      <StatusBadge status={run.status} />
                    </div>

                    {/* Duration */}
                    <span className="text-xs font-mono text-white/40">
                      {formatDuration(run.durationMs)}
                    </span>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <Clock size={12} />
                      {formatDate(run.startedAt)}
                    </div>
                  </button>

                  {/* Expanded trace */}
                  {isExpanded && (
                    <>
                      {isRetrying && (
                        <div className="flex items-center gap-2 px-6 py-2 bg-amber-500/5 border-t border-amber-500/10">
                          <Loader2 size={14} className="text-amber-400 animate-spin" />
                          <span className="text-xs text-amber-400">Retrying workflow execution...</span>
                        </div>
                      )}
                      <StepTracePanel
                        steps={run.steps}
                        onRetry={run.status === 'failed' ? () => handleRetry(run.id) : undefined}
                      />
                    </>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

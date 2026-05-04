'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  X,
  AlertTriangle,
  Building2,
  CreditCard,
  MessageSquare,
  UserCheck,
  Ban,
  Briefcase,
  Activity,
  BarChart3,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { API_URL } from '@/lib/config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PipelineStage =
  | 'application'
  | 'credit_pull'
  | 'bank_matching'
  | 'applied'
  | 'under_review'
  | 'approved'
  | 'denied';

interface FundingApplication {
  id: string;
  applicantName: string;
  tenant: string;
  businessType: string;
  requestedAmount: number;
  creditScore: number;
  matchedBanks: string[];
  stage: PipelineStage;
  date: string;
  /* extras populated from mock when API has no real data */
  notes?: string;
}

interface ApiStats {
  activeRequests: number;
  approvedThisMonth: number;
  totalFunded: number;
  pendingUnderwriting: number;
  declineRate: number;
  pipeline: { name: string; count: number; totalValue: number; color: string }[];
  recentApplications: {
    id: string;
    applicantName: string;
    tenant: string;
    businessType: string;
    requestedAmount: number;
    creditScore: number;
    stage: string;
    date: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Pipeline column config (6 stages per spec)                         */
/* ------------------------------------------------------------------ */

const PIPELINE_COLUMNS: {
  key: PipelineStage;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { key: 'application',  label: 'Application',   color: '#f59e0b', bgColor: 'bg-indigo-500/10',  borderColor: 'border-indigo-500/30' },
  { key: 'credit_pull',  label: 'Credit Pull',   color: '#10b981', bgColor: 'bg-violet-500/10',  borderColor: 'border-violet-500/30' },
  { key: 'bank_matching',label: 'Bank Matching', color: '#f59e0b', bgColor: 'bg-amber-500/10',   borderColor: 'border-amber-500/30'  },
  { key: 'applied',      label: 'Applied',       color: '#f97316', bgColor: 'bg-orange-500/10',  borderColor: 'border-orange-500/30' },
  { key: 'under_review', label: 'Under Review',  color: '#3b82f6', bgColor: 'bg-blue-500/10',    borderColor: 'border-blue-500/30'   },
  { key: 'approved',     label: 'Approved',      color: '#10b981', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30'},
  { key: 'denied',       label: 'Denied',        color: '#ef4444', bgColor: 'bg-red-500/10',     borderColor: 'border-red-500/30'    },
];

/* ------------------------------------------------------------------ */
/*  API status → pipeline stage map                                    */
/* ------------------------------------------------------------------ */

const STATUS_TO_STAGE: Record<string, PipelineStage> = {
  Application:    'application',
  'Under Review': 'under_review',
  Underwriting:   'under_review',
  Approved:       'approved',
  Funded:         'approved',
  Declined:       'denied',
  draft:          'application',
  submitted:      'credit_pull',
  in_progress:    'bank_matching',
  approved:       'approved',
  completed:      'approved',
  denied:         'denied',
};

/* ------------------------------------------------------------------ */
/*  Mock applications — shown when API returns empty list              */
/* ------------------------------------------------------------------ */

const MOCK_APPLICATIONS: FundingApplication[] = [
  {
    id: 'FA-001', applicantName: 'Marcus Williams', tenant: 'Williams Construction LLC',
    businessType: 'Construction', requestedAmount: 250000, creditScore: 720,
    matchedBanks: ['Chase', 'Wells Fargo'], stage: 'application',
    date: '2026-03-15', notes: 'Inbound lead — high-value construction company.',
  },
  {
    id: 'FA-002', applicantName: 'Sarah Chen', tenant: 'Chen Digital Marketing',
    businessType: 'Marketing', requestedAmount: 75000, creditScore: 680,
    matchedBanks: ['Bank of America'], stage: 'credit_pull',
    date: '2026-03-12', notes: 'Application submitted. Awaiting business license.',
  },
  {
    id: 'FA-003', applicantName: 'David Rodriguez', tenant: 'Rodriguez Auto Body',
    businessType: 'Auto Services', requestedAmount: 150000, creditScore: 695,
    matchedBanks: ['Citibank', 'US Bank', 'Chase'], stage: 'bank_matching',
    date: '2026-03-10', notes: 'All docs received. Ready for underwriting.',
  },
  {
    id: 'FA-004', applicantName: 'Jennifer Park', tenant: 'Park & Associates Law',
    businessType: 'Legal', requestedAmount: 500000, creditScore: 780,
    matchedBanks: ['JP Morgan', 'Goldman Sachs'], stage: 'applied',
    date: '2026-03-08', notes: 'Risk score 92/100. Recommend approval.',
  },
  {
    id: 'FA-005', applicantName: 'Robert Johnson', tenant: 'Johnson Plumbing',
    businessType: 'Plumbing', requestedAmount: 85000, creditScore: 640,
    matchedBanks: ['Local Credit Union'], stage: 'under_review',
    date: '2026-03-10', notes: 'Tax returns pending.',
  },
  {
    id: 'FA-006', applicantName: 'Amanda Foster', tenant: 'Foster Catering Co',
    businessType: 'Food & Bev', requestedAmount: 120000, creditScore: 710,
    matchedBanks: ['Chase', 'TD Bank'], stage: 'approved',
    date: '2026-03-05', notes: 'Approved at $120,000.',
  },
  {
    id: 'FA-007', applicantName: 'Michael Torres', tenant: 'Torres Freight LLC',
    businessType: 'Logistics', requestedAmount: 200000, creditScore: 590,
    matchedBanks: [], stage: 'denied',
    date: '2026-03-03', notes: 'Credit score below threshold.',
  },
];

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label, value, prefix, suffix, icon: Icon, color, subtext,
}: {
  label: string; value: number; prefix?: string; suffix?: string;
  icon: React.ComponentType<any>; color: string; subtext?: string;
}) {
  const animated = useAnimatedCounter(value);
  const fmt = value >= 1000000
    ? `${(animated / 1000000).toFixed(1)}M`
    : value >= 1000
      ? `${(animated / 1000).toFixed(1)}k`
      : animated.toString();

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="absolute right-3 top-3 rounded-lg p-2" style={{ backgroundColor: `${color}18` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">
        {prefix}{fmt}{suffix}
      </p>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Credit score badge                                                 */
/* ------------------------------------------------------------------ */

function CreditBadge({ score }: { score: number }) {
  if (!score) return null;
  const color = score >= 720 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : score >= 660 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-red-400 border-red-500/30 bg-red-500/10';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      <CreditCard className="h-2.5 w-2.5" />
      {score}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Kanban card                                                        */
/* ------------------------------------------------------------------ */

function KanbanCard({
  app, onSelect, onDragStart,
}: {
  app: FundingApplication;
  onSelect: (app: FundingApplication) => void;
  onDragStart: (e: React.DragEvent, app: FundingApplication) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app)}
      onClick={() => onSelect(app)}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-border hover:bg-muted active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground group-hover:text-foreground leading-tight">
          {app.applicantName}
        </p>
        {app.creditScore > 0 && <CreditBadge score={app.creditScore} />}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground truncate">{app.tenant}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-400">
          ${app.requestedAmount.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground">{app.id}</span>
      </div>

      {app.matchedBanks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {app.matchedBanks.slice(0, 2).map((bank) => (
            <span key={bank} className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-300/70 border border-blue-500/20">
              {bank}
            </span>
          ))}
          {app.matchedBanks.length > 2 && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
              +{app.matchedBanks.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="mt-2">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {app.businessType}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kanban column                                                      */
/* ------------------------------------------------------------------ */

function KanbanColumn({
  column, apps, onSelect, onDragStart, onDrop, onDragOver, isDragOver,
}: {
  column: (typeof PIPELINE_COLUMNS)[number];
  apps: FundingApplication[];
  onSelect: (app: FundingApplication) => void;
  onDragStart: (e: React.DragEvent, app: FundingApplication) => void;
  onDrop: (e: React.DragEvent, stage: PipelineStage) => void;
  onDragOver: (e: React.DragEvent) => void;
  isDragOver: boolean;
}) {
  const totalAmount = apps.reduce((sum, a) => sum + a.requestedAmount, 0);

  return (
    <div
      className={`flex min-w-[250px] max-w-[270px] flex-shrink-0 flex-col rounded-xl border transition-colors ${
        isDragOver ? 'border-border bg-muted' : 'border-border bg-card'
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.key)}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <span className="text-sm font-medium text-foreground flex-1 truncate">{column.label}</span>
        <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          {apps.length}
        </span>
      </div>
      {totalAmount > 0 && (
        <div className="border-b border-border px-4 py-1.5">
          <p className="text-[10px] text-muted-foreground">${(totalAmount / 1000).toFixed(0)}k total</p>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" style={{ maxHeight: '460px' }}>
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} onSelect={onSelect} onDragStart={onDragStart} />
        ))}
        {apps.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-10">
            <p className="text-xs text-muted-foreground">No applications</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Side panel                                                         */
/* ------------------------------------------------------------------ */

function SidePanel({
  app, onClose, onMove,
}: {
  app: FundingApplication;
  onClose: () => void;
  onMove: (appId: string, stage: PipelineStage) => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{app.applicantName}</h2>
          <p className="text-xs text-muted-foreground">{app.id} &middot; {app.tenant}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <div className="border-b border-border px-6 py-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> Application Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ProfileField label="Business Type" value={app.businessType} />
            <ProfileField label="Requested Amount" value={`$${app.requestedAmount.toLocaleString()}`} highlight />
            {app.creditScore > 0 && (
              <ProfileField label="Credit Score" value={app.creditScore.toString()} highlight={app.creditScore >= 700} />
            )}
            <ProfileField label="Current Stage" value={PIPELINE_COLUMNS.find(c => c.key === app.stage)?.label ?? app.stage} />
            <ProfileField label="Date" value={new Date(app.date).toLocaleDateString()} />
          </div>
        </div>

        {/* Matched Banks */}
        <div className="border-b border-border px-6 py-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> Matched Banks
          </h3>
          {app.matchedBanks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {app.matchedBanks.map((bank) => (
                <span key={bank} className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-300">
                  {bank}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No banks matched yet</p>
          )}
        </div>

        {/* Notes */}
        {app.notes && (
          <div className="border-b border-border px-6 py-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" /> Notes
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{app.notes}</p>
          </div>
        )}

        {/* Move to Stage */}
        <div className="px-6 py-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Move to Stage
          </h3>
          <div className="space-y-1.5">
            {PIPELINE_COLUMNS.filter(c => c.key !== app.stage).map((col) => (
              <button
                key={col.key}
                onClick={() => { onMove(app.id, col.key); onClose(); }}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              >
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                {col.label}
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="border-t border-border px-6 py-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton icon={CheckCircle2} label="Approve" color="emerald" onClick={() => { onMove(app.id, 'approved'); onClose(); }} />
            <ActionButton icon={Ban} label="Deny" color="red" onClick={() => { onMove(app.id, 'denied'); onClose(); }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${highlight ? 'text-emerald-400' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon, label, color, onClick,
}: { icon: React.ComponentType<any>; label: string; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
    red: 'border-red-500/30 text-red-400 hover:bg-red-500/10',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${colorMap[color] ?? ''}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline summary bar                                               */
/* ------------------------------------------------------------------ */

function PipelineSummaryBar({ counts }: { counts: Record<PipelineStage, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full gap-0.5">
      {PIPELINE_COLUMNS.map((col) => {
        const pct = (counts[col.key] / total) * 100;
        if (pct === 0) return null;
        return (
          <div
            key={col.key}
            title={`${col.label}: ${counts[col.key]}`}
            className="h-full rounded-sm transition-all"
            style={{ width: `${pct}%`, backgroundColor: col.color, opacity: 0.75 }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function FundingPipelinePage() {
  const [applications, setApplications] = useState<FundingApplication[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const [selectedApp, setSelectedApp] = useState<FundingApplication | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  /* ---- Fetch stats + applications ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
      const res = await fetch(`${API_URL}/api/admin/funding/stats`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: ApiStats = json.data;
      setStats(data);

      if (data.recentApplications && data.recentApplications.length > 0) {
        const mapped: FundingApplication[] = data.recentApplications.map((a) => ({
          id: a.id,
          applicantName: a.applicantName,
          tenant: a.tenant,
          businessType: a.businessType,
          requestedAmount: a.requestedAmount,
          creditScore: a.creditScore,
          matchedBanks: [],
          stage: STATUS_TO_STAGE[a.stage] ?? 'application',
          date: a.date,
        }));
        setApplications(mapped);
        setUsingMock(false);
      } else {
        /* API has no apps yet — use mock pipeline cards */
        setApplications(MOCK_APPLICATIONS);
        setUsingMock(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
      setApplications(MOCK_APPLICATIONS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- Computed stats (prefer API stats, fall back to local) ---- */
  const pendingApps = stats?.activeRequests ??
    applications.filter((a) => !['approved', 'denied'].includes(a.stage)).length;
  const approvedThisMonth = stats?.approvedThisMonth ?? applications.filter((a) => a.stage === 'approved').length;
  const declineRate = stats?.declineRate ?? 0;
  const pendingUnderwriting = stats?.pendingUnderwriting ??
    applications.filter((a) => ['bank_matching', 'under_review'].includes(a.stage)).length;
  const totalApprovedAmt = applications
    .filter((a) => a.stage === 'approved')
    .reduce((s, a) => s + a.requestedAmount, 0);

  /* ---- Drag handlers ---- */
  const handleDragStart = useCallback((e: React.DragEvent, app: FundingApplication) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', app.id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, stage: targetStage } : a))
    );
    setDragOverStage(null);
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  }, []);

  const handleMove = useCallback((appId: string, stage: PipelineStage) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, stage } : a)));
  }, []);

  /* ---- Group apps by stage ---- */
  const appsByStage = PIPELINE_COLUMNS.reduce((acc, col) => {
    acc[col.key] = applications.filter((a) => a.stage === col.key);
    return acc;
  }, {} as Record<PipelineStage, FundingApplication[]>);

  const stageCounts = PIPELINE_COLUMNS.reduce((acc, col) => {
    acc[col.key] = appsByStage[col.key].length;
    return acc;
  }, {} as Record<PipelineStage, number>);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <DollarSign className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funding Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Application → Credit Pull → Bank Matching → Applied → Under Review → Approved/Denied
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {usingMock && !loading && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Demo data — no live applications yet
            </span>
          )}
          {error && !loading && (
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Pending Applications" value={pendingApps} icon={Briefcase} color="#ef4444" />
        <StatCard label="Approved This Month" value={approvedThisMonth} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Approved Amount" value={totalApprovedAmt} prefix="$" icon={DollarSign} color="#22c55e" subtext="pipeline total" />
        <StatCard label="Denial Rate" value={declineRate} suffix="%" icon={BarChart3} color="#f97316" />
        <StatCard label="Under Review" value={pendingUnderwriting} icon={Clock} color="#3b82f6" />
      </div>

      {/* Pipeline progress bar */}
      <div className="mb-4 rounded-xl border border-border bg-card px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Distribution</p>
          <p className="text-xs text-muted-foreground">{applications.length} total applications</p>
        </div>
        <PipelineSummaryBar counts={stageCounts} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {PIPELINE_COLUMNS.map((col) => (
            <div key={col.key} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-[10px] text-muted-foreground">{col.label} ({stageCounts[col.key]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="mb-6 flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading pipeline...</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-xl border border-border bg-card p-4">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {PIPELINE_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key}
                column={col}
                apps={appsByStage[col.key]}
                onSelect={setSelectedApp}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={(e) => handleColumnDragOver(e, col.key)}
                isDragOver={dragOverStage === col.key}
              />
            ))}
          </div>
        </div>
      )}

      {/* API pipeline stats from backend */}
      {stats && stats.pipeline.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Live Database Counts</h2>
            <span className="ml-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              Real-time
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {stats.pipeline.map((stage) => (
              <div key={stage.name} className="rounded-lg border border-border bg-muted px-3 py-3 text-center">
                <p className="text-xl font-bold text-foreground">{stage.count}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{stage.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Panel */}
      {selectedApp && (
        <>
          <div className="fixed inset-0 z-40 bg-background backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <SidePanel
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onMove={(appId, stage) => {
              handleMove(appId, stage);
              setSelectedApp(null);
            }}
          />
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Clock,
  RefreshCw,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Badge,
  FilterBar,
  EmptyState,
  type FilterConfig,
  type FilterValues,
  type BadgeVariant,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Bureau = 'Equifax' | 'Experian' | 'TransUnion';
type DisputeStatus = 'pending' | 'verified' | 'deleted' | 'updated';
type AccountType = 'credit_card' | 'auto_loan' | 'mortgage' | 'student_loan' | 'collection' | 'medical' | 'personal_loan' | 'charge_off';

interface TimelineEvent {
  id: string;
  date: string;
  action: string;
  detail: string;
  result?: DisputeStatus;
}

interface Dispute {
  id: string;
  creditorName: string;
  accountType: AccountType;
  amount: number;
  bureau: Bureau;
  status: DisputeStatus;
  round: number;
  strategy: string;
  openedDate: string;
  lastUpdated: string;
  accountNumber: string;
  timeline: TimelineEvent[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BUREAUS: Bureau[] = ['Equifax', 'Experian', 'TransUnion'];
const STATUSES: DisputeStatus[] = ['pending', 'verified', 'deleted', 'updated'];

const STRATEGIES = [
  'Validation of Debt',
  'Method of Verification',
  'Factual Dispute',
  'Goodwill Letter',
  'Pay for Delete',
  'FCRA Section 611',
  'FDCPA Violation',
  'Identity Theft',
  'Not Mine',
  'Balance Incorrect',
];

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  credit_card: 'Credit Card',
  auto_loan: 'Auto Loan',
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  collection: 'Collection',
  medical: 'Medical',
  personal_loan: 'Personal Loan',
  charge_off: 'Charge-Off',
};

const STATUS_CONFIG: Record<DisputeStatus, { variant: BadgeVariant; icon: typeof Clock; label: string }> = {
  pending: { variant: 'warning', icon: Clock, label: 'Pending' },
  verified: { variant: 'default', icon: AlertTriangle, label: 'Verified' },
  deleted: { variant: 'success', icon: CheckCircle2, label: 'Deleted' },
  updated: { variant: 'info', icon: RefreshCw, label: 'Updated' },
};

const BUREAU_COLORS: Record<Bureau, string> = {
  Equifax: 'text-red-400',
  Experian: 'text-blue-400',
  TransUnion: 'text-emerald-400',
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

function generateMockData(): Dispute[] {
  const creditors = [
    'Capital One', 'Chase Bank', 'Bank of America', 'Discover Financial',
    'Wells Fargo', 'Synchrony Bank', 'Citi Bank', 'American Express',
    'Midland Credit', 'Portfolio Recovery', 'LVNV Funding', 'Cavalry SPV',
    'Enhanced Recovery', 'National Collegiate Trust', 'Navient',
  ];

  const disputes: Dispute[] = [];
  let id = 1;

  for (const creditor of creditors.slice(0, 12)) {
    const bureauCount = Math.floor(Math.random() * 3) + 1;
    const selectedBureaus = BUREAUS.slice(0, bureauCount);
    const accountType = Object.keys(ACCOUNT_TYPE_LABELS)[Math.floor(Math.random() * 8)] as AccountType;
    const amount = Math.floor(Math.random() * 15000) + 250;
    const round = Math.floor(Math.random() * 4) + 1;
    const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];

    for (const bureau of selectedBureaus) {
      const statusIdx = Math.floor(Math.random() * 4);
      const status = STATUSES[statusIdx];
      const daysAgo = Math.floor(Math.random() * 120) + 5;
      const openedDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const lastUpdated = new Date(Date.now() - Math.floor(Math.random() * daysAgo) * 86400000).toISOString();

      const timeline: TimelineEvent[] = [];
      for (let r = 1; r <= round; r++) {
        const eventDate = new Date(Date.now() - (daysAgo - r * 15) * 86400000).toISOString();
        timeline.push({
          id: `evt-${id}-${r}-sent`,
          date: eventDate,
          action: `Round ${r} Dispute Sent`,
          detail: `${strategy} letter sent to ${bureau}`,
        });
        if (r < round || status !== 'pending') {
          const responseDate = new Date(Date.now() - (daysAgo - r * 15 - 12) * 86400000).toISOString();
          const result = r === round ? status : (Math.random() > 0.5 ? 'verified' : 'updated');
          timeline.push({
            id: `evt-${id}-${r}-resp`,
            date: responseDate,
            action: `Round ${r} Response`,
            detail: result === 'deleted'
              ? `Account removed from ${bureau}`
              : result === 'updated'
                ? `Account information updated by ${bureau}`
                : `${bureau} verified account as accurate`,
            result: result as DisputeStatus,
          });
        }
      }

      disputes.push({
        id: `disp-${id++}`,
        creditorName: creditor,
        accountType,
        amount,
        bureau,
        status,
        round,
        strategy,
        openedDate,
        lastUpdated,
        accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
        timeline: timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      });
    }
  }

  return disputes;
}

const MOCK_DISPUTES = generateMockData();

/* ------------------------------------------------------------------ */
/*  Filter config                                                      */
/* ------------------------------------------------------------------ */

const FILTERS: FilterConfig[] = [
  {
    key: 'bureau',
    label: 'Bureau',
    type: 'select',
    options: BUREAUS.map((b) => ({ value: b, label: b })),
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  },
  {
    key: 'strategy',
    label: 'Strategy',
    type: 'select',
    options: STRATEGIES.map((s) => ({ value: s, label: s })),
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Stats Bar                                                          */
/* ------------------------------------------------------------------ */

function StatsBar({ disputes }: { disputes: Dispute[] }) {
  const total = disputes.length;
  const pending = disputes.filter((d) => d.status === 'pending').length;
  const deleted = disputes.filter((d) => d.status === 'deleted').length;
  const successRate = total > 0 ? Math.round((deleted / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricTile
        label="Total Disputes"
        value={total}
        icon={<Shield className="h-4 w-4" />}
      />
      <MetricTile
        label="Pending"
        value={pending}
        icon={<Clock className="h-4 w-4" />}
      />
      <MetricTile
        label="Deleted"
        value={deleted}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <MetricTile
        label="Success Rate"
        value={`${successRate}%`}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="py-3 text-xs text-muted-foreground">No history available</p>;
  }

  return (
    <div className="relative ml-3 border-l border-border pl-5 py-2">
      {events.map((evt, i) => {
        const isLast = i === events.length - 1;
        const dotColor = evt.result === 'deleted'
          ? 'bg-emerald-400'
          : evt.result === 'verified'
            ? 'bg-yellow-400'
            : evt.result === 'updated'
              ? 'bg-blue-400'
              : 'bg-muted';

        return (
          <div key={evt.id} className={`relative pb-4 ${isLast ? 'pb-0' : ''}`}>
            <div className={`absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full ${dotColor} ring-2 ring-zinc-900`} />
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{formatShortDate(evt.date)}</span>
              <span className="text-xs font-medium text-foreground">{evt.action}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{evt.detail}</p>
            {evt.result && (
              <Badge
                variant={STATUS_CONFIG[evt.result].variant}
                className="mt-1"
              >
                {STATUS_CONFIG[evt.result].label}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dispute Row                                                        */
/* ------------------------------------------------------------------ */

function DisputeRow({
  dispute,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
}: {
  dispute: Dispute;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const statusCfg = STATUS_CONFIG[dispute.status];
  const StatusIcon = statusCfg.icon;

  return (
    <>
      <tr
        className={`border-b border-border transition-colors duration-150 hover:bg-muted ${
          isExpanded ? 'bg-muted' : ''
        }`}
      >
        {/* Checkbox */}
        <td className="w-10 py-3 pl-4 pr-2">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
              isSelected
                ? 'border-red-500 bg-red-500'
                : 'border-border bg-muted hover:border-border'
            }`}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </button>
        </td>

        {/* Expand toggle */}
        <td className="w-8 py-3 pr-2">
          <button
            onClick={onToggle}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </td>

        {/* Creditor */}
        <td className="py-3 pr-4">
          <div>
            <p className="text-sm font-medium tracking-tight text-foreground">{dispute.creditorName}</p>
            <p className="text-[10px] text-muted-foreground">{dispute.accountNumber}</p>
          </div>
        </td>

        {/* Account Type */}
        <td className="py-3 pr-4">
          <span className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[dispute.accountType]}</span>
        </td>

        {/* Amount */}
        <td className="py-3 pr-4">
          <span className="font-mono text-sm font-medium text-foreground">{formatCurrency(dispute.amount)}</span>
        </td>

        {/* Bureau */}
        <td className="py-3 pr-4">
          <span className={`text-xs font-medium ${BUREAU_COLORS[dispute.bureau]}`}>{dispute.bureau}</span>
        </td>

        {/* Status */}
        <td className="py-3 pr-4">
          <Badge variant={statusCfg.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </Badge>
        </td>

        {/* Round */}
        <td className="py-3 pr-4">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {dispute.round}
          </span>
        </td>

        {/* Strategy */}
        <td className="py-3 pr-4">
          <span className="text-xs text-muted-foreground">{dispute.strategy}</span>
        </td>

        {/* Last Updated */}
        <td className="py-3 pr-4">
          <span className="text-xs text-muted-foreground">{formatDate(dispute.lastUpdated)}</span>
        </td>
      </tr>

      {/* Expanded timeline */}
      {isExpanded && (
        <tr className="bg-muted">
          <td colSpan={10} className="px-6 py-4">
            <div className="max-w-2xl">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Dispute History
              </h4>
              <Timeline events={dispute.timeline} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DisputeTrackerPage() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  /* ---- Filtered data ---- */
  const disputes = useMemo(() => {
    let list = MOCK_DISPUTES;
    if (filters.bureau) list = list.filter((d) => d.bureau === filters.bureau);
    if (filters.status) list = list.filter((d) => d.status === filters.status);
    if (filters.strategy) list = list.filter((d) => d.strategy === filters.strategy);
    return list;
  }, [filters]);

  /* ---- Selection ---- */
  const allSelected = disputes.length > 0 && selected.size === disputes.length;

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(disputes.map((d) => d.id)));
    }
  }, [allSelected, disputes]);

  /* ---- Expand ---- */
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ---- Bulk actions ---- */
  const handleBulkAction = useCallback((action: string) => {
    // In production this would dispatch to the API
    setBulkMenuOpen(false);
    setSelected(new Set());
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Dispute Tracker"
        subtitle={`${disputes.length} dispute${disputes.length !== 1 ? 's' : ''} across all bureaus`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Credit', href: '/dashboard/credit' },
          { label: 'Disputes' },
        ]}
      />

      {/* Stats bar */}
      <StatsBar disputes={disputes} />

      {/* Filters */}
      <FilterBar
        filters={FILTERS}
        values={filters}
        onChange={(v) => setFilters(v)}
        onClear={() => setFilters({})}
      />

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <div className="h-4 w-px bg-muted" />
          <div className="relative">
            <button
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Actions
              <ChevronDown className="h-3 w-3" />
            </button>
            {bulkMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-card py-1 shadow-xl">
                <button
                  onClick={() => handleBulkAction('escalate')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Escalate to Next Round
                </button>
                <button
                  onClick={() => handleBulkAction('resend')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Resend Dispute Letter
                </button>
                <button
                  onClick={() => handleBulkAction('change-strategy')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Change Strategy
                </button>
                <div className="my-1 h-px bg-muted" />
                <button
                  onClick={() => handleBulkAction('mark-deleted')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-emerald-400/80 transition-colors hover:bg-emerald-500/[0.04]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Deleted
                </button>
                <button
                  onClick={() => handleBulkAction('remove')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400/80 transition-colors hover:bg-red-500/[0.04]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove from Tracker
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted backdrop-blur-xl p-6">
          <EmptyState
            icon={<Shield className="h-6 w-6" />}
            title="No disputes found"
            description="Adjust your filters or start a new dispute round."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="w-10 py-3 pl-4 pr-2">
                    <button
                      onClick={toggleSelectAll}
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        allSelected
                          ? 'border-red-500 bg-red-500'
                          : 'border-border bg-muted hover:border-border'
                      }`}
                    >
                      {allSelected && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </th>
                  <th className="w-8 py-3 pr-2" />
                  <th className="py-3 pr-4">Creditor</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Bureau</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Round</th>
                  <th className="py-3 pr-4">Strategy</th>
                  <th className="py-3 pr-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <DisputeRow
                    key={dispute.id}
                    dispute={dispute}
                    isSelected={selected.has(dispute.id)}
                    isExpanded={expanded.has(dispute.id)}
                    onSelect={() => toggleSelect(dispute.id)}
                    onToggle={() => toggleExpand(dispute.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom summary */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {disputes.length} dispute{disputes.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                {disputes.filter((d) => d.status === 'pending').length} pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {disputes.filter((d) => d.status === 'deleted').length} deleted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted" />
                {disputes.filter((d) => d.status === 'verified').length} verified
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                {disputes.filter((d) => d.status === 'updated').length} updated
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

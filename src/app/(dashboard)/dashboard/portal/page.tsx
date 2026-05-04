'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
  Sparkles,
  ArrowUpRight,
  Bell,
  XCircle,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreditScore {
  bureau: string;
  score: number;
  status: string;
}

interface DisputeItem {
  id: string;
  creditorName: string;
  bureau: string;
  status: string; // 'disputed' | 'removed' | 'verified' | 'pending' | 'in_progress'
  createdAt: string;
}

interface DocumentItem {
  id: string;
  docType: string;
  fileName: string;
  status: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

interface PortalData {
  creditScores?: CreditScore[];
  disputes?: DisputeItem[];
  documents?: DocumentItem[];
  activity?: ActivityItem[];
  nextSteps?: { id: string; title: string; description: string; action?: string; href?: string }[];
  requiredDocuments?: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 720) return '#34d399';
  if (score >= 680) return '#facc15';
  if (score >= 620) return '#fb923c';
  return '#f87171';
}

function scoreLabel(score: number): string {
  if (score >= 720) return 'Excellent';
  if (score >= 680) return 'Good';
  if (score >= 620) return 'Fair';
  return 'Needs Work';
}

function scoreTextClass(score: number): string {
  if (score >= 720) return 'text-emerald-400';
  if (score >= 680) return 'text-yellow-400';
  if (score >= 620) return 'text-orange-400';
  return 'text-red-400';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function activityIcon(type: string) {
  switch (type) {
    case 'dispute_sent':
    case 'dispute_update':
      return <Shield className="h-4 w-4 text-blue-400" />;
    case 'document_uploaded':
      return <Upload className="h-4 w-4 text-emerald-400" />;
    case 'score_update':
      return <Sparkles className="h-4 w-4 text-yellow-400" />;
    case 'message':
      return <MessageCircle className="h-4 w-4 text-primary" />;
    case 'item_removed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    default:
      return <Bell className="h-4 w-4 text-white/40" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Credit Score Gauge (SVG Circle)                                    */
/* ------------------------------------------------------------------ */

function CreditScoreGauge({ score, label }: { score: number; label?: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Score range: 300-850
  const pct = Math.max(0, Math.min(1, (score - 300) / 550));
  const strokeDashoffset = circumference * (1 - pct);
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36 sm:h-40 sm:w-40">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          {/* Background track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold tracking-tighter sm:text-5xl"
            style={{ color }}
          >
            {score}
          </span>
          <span
            className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest opacity-80"
            style={{ color }}
          >
            {scoreLabel(score)}
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2 text-xs text-white/30">{label}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dispute Progress Bar                                               */
/* ------------------------------------------------------------------ */

function DisputeProgress({
  total,
  disputed,
  removed,
}: {
  total: number;
  disputed: number;
  removed: number;
}) {
  const pctDisputed = total > 0 ? (disputed / total) * 100 : 0;
  const pctRemoved = total > 0 ? (removed / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-white/90">Dispute Progress</h3>
        <span className="text-xs text-white/40">
          {removed} of {total} items resolved
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="flex h-full">
          <div
            className="h-full rounded-l-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pctRemoved}%` }}
          />
          <div
            className="h-full bg-blue-500 transition-all duration-700"
            style={{ width: `${pctDisputed}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-white/50">Removed ({removed})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-white/50">In Progress ({disputed})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="text-white/50">Remaining ({Math.max(0, total - disputed - removed)})</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Document Status Card                                               */
/* ------------------------------------------------------------------ */

function DocumentStatus({
  documents,
  requiredTypes,
}: {
  documents: DocumentItem[];
  requiredTypes: string[];
}) {
  const uploadedTypes = new Set(documents.map((d) => d.docType?.toLowerCase()));
  const uploaded = documents.length;
  const needed = requiredTypes.filter((t) => !uploadedTypes.has(t.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-white/90">Your Documents</h3>
        <span className="text-xs text-white/40">
          {uploaded} uploaded
          {needed.length > 0 && <> &middot; {needed.length} still needed</>}
        </span>
      </div>

      <div className="space-y-2">
        {/* Uploaded docs */}
        {documents.slice(0, 4).map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
          >
            <FileText className="h-4 w-4 shrink-0 text-white/30" />
            <span className="min-w-0 flex-1 truncate text-sm text-white/70">
              {doc.fileName}
            </span>
            {doc.status?.toLowerCase() === 'verified' || doc.status?.toLowerCase() === 'approved' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : doc.status?.toLowerCase() === 'rejected' ? (
              <XCircle className="h-4 w-4 shrink-0 text-red-400" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
            )}
          </div>
        ))}

        {/* Needed docs */}
        {needed.slice(0, 3).map((docType) => (
          <div
            key={docType}
            className="flex items-center gap-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-3 py-2.5"
          >
            <Upload className="h-4 w-4 shrink-0 text-white/20" />
            <span className="min-w-0 flex-1 text-sm text-white/40">
              {docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-orange-400">
              Needed
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Next Step Card                                                     */
/* ------------------------------------------------------------------ */

function NextStepCard({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xs font-bold text-red-400">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white/90">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/40">{description}</p>
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/10 transition-colors group-hover:text-white/30" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message Melli Button                                                */
/* ------------------------------------------------------------------ */

function MessageMelliButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-red-500/30 transition-all duration-200 hover:scale-105 hover:shadow-red-500/40 active:scale-95 sm:bottom-8 sm:right-8"
    >
      <MessageCircle className="h-5 w-5" />
      <span>Message Melli</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo data (used when API returns empty)                            */
/* ------------------------------------------------------------------ */

const DEMO_DATA: PortalData = {
  creditScores: [
    { bureau: 'Equifax', score: 648, status: 'Active' },
    { bureau: 'Experian', score: 662, status: 'Active' },
    { bureau: 'TransUnion', score: 639, status: 'Active' },
  ],
  disputes: [
    { id: '1', creditorName: 'Capital One', bureau: 'Equifax', status: 'removed', createdAt: '2026-03-10T12:00:00Z' },
    { id: '2', creditorName: 'Midland Credit', bureau: 'Experian', status: 'removed', createdAt: '2026-03-08T12:00:00Z' },
    { id: '3', creditorName: 'Portfolio Recovery', bureau: 'TransUnion', status: 'in_progress', createdAt: '2026-03-12T12:00:00Z' },
    { id: '4', creditorName: 'LVNV Funding', bureau: 'Equifax', status: 'in_progress', createdAt: '2026-03-14T12:00:00Z' },
    { id: '5', creditorName: 'Cavalry SPV', bureau: 'Experian', status: 'pending', createdAt: '2026-03-15T12:00:00Z' },
    { id: '6', creditorName: 'Encore Capital', bureau: 'TransUnion', status: 'pending', createdAt: '2026-03-15T12:00:00Z' },
  ],
  documents: [
    { id: '1', docType: 'id', fileName: 'Drivers_License.pdf', status: 'verified', createdAt: '2026-03-05T12:00:00Z' },
    { id: '2', docType: 'pay_stub', fileName: 'PayStub_March.pdf', status: 'pending', createdAt: '2026-03-12T12:00:00Z' },
    { id: '3', docType: 'utility_bill', fileName: 'Electric_Bill.pdf', status: 'verified', createdAt: '2026-03-06T12:00:00Z' },
  ],
  requiredDocuments: ['id', 'pay_stub', 'bank_statement', 'utility_bill', 'ssn_card'],
  nextSteps: [
    { id: '1', title: 'Upload your bank statement', description: 'We need a recent bank statement to continue your application. Any statement from the last 60 days works.' },
    { id: '2', title: 'Upload your Social Security card', description: 'A clear photo of the front of your card is all we need.' },
    { id: '3', title: 'Wait for dispute results', description: 'We sent disputes to all three bureaus. You should see updates within 30-45 days.' },
  ],
  activity: [
    { id: '1', type: 'dispute_sent', title: 'Disputes sent to Experian', description: '2 items disputed', createdAt: '2026-03-15T14:00:00Z' },
    { id: '2', type: 'document_uploaded', title: 'Pay stub uploaded', description: 'PayStub_March.pdf is under review', createdAt: '2026-03-12T10:30:00Z' },
    { id: '3', type: 'item_removed', title: 'Capital One removed', description: 'Removed from Equifax report', createdAt: '2026-03-10T09:15:00Z' },
    { id: '4', type: 'item_removed', title: 'Midland Credit removed', description: 'Removed from Experian report', createdAt: '2026-03-08T16:45:00Z' },
    { id: '5', type: 'score_update', title: 'Score updated', description: 'Your Equifax score went up 12 points', createdAt: '2026-03-07T08:00:00Z' },
    { id: '6', type: 'message', title: 'Message from your team', description: 'Welcome! We are getting started on your file.', createdAt: '2026-03-05T11:00:00Z' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ClientPortalDashboard() {
  const api = useApi();
  const [showMessageSent, setShowMessageSent] = useState(false);

  /* Fetch portal data — falls back to demo data for now */
  const { data: portalData, isLoading } = useQuery<PortalData>({
    queryKey: ['client-portal'],
    queryFn: async () => {
      try {
        const res = await api.get<PortalData>('/api/portal/dashboard');
        if (res.error || !res.data) return DEMO_DATA;
        return res.data;
      } catch {
        return DEMO_DATA;
      }
    },
    staleTime: 60_000,
    placeholderData: DEMO_DATA,
  });

  const data = portalData ?? DEMO_DATA;

  /* Derived values */
  const scores = data.creditScores ?? [];
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length)
      : null;

  const disputes = data.disputes ?? [];
  const totalDisputes = disputes.length;
  const removedCount = disputes.filter((d) => d.status === 'removed').length;
  const inProgressCount = disputes.filter(
    (d) => d.status === 'disputed' || d.status === 'in_progress',
  ).length;

  const documents = data.documents ?? [];
  const requiredDocs = data.requiredDocuments ?? ['id', 'pay_stub', 'bank_statement', 'utility_bill'];
  const nextSteps = data.nextSteps ?? [];
  const activity = data.activity ?? [];

  function handleMessageMelli() {
    setShowMessageSent(true);
    setTimeout(() => setShowMessageSent(false), 3000);
  }

  /* ---------------------------------------------------------------- */
  /*  Skeleton loader                                                  */
  /* ---------------------------------------------------------------- */

  if (isLoading && !portalData) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="flex justify-center py-8">
          <div className="h-40 w-40 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Your Dashboard
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Here is where things stand with your file.
        </p>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Credit Score Gauge                                           */}
      {/* ------------------------------------------------------------ */}
      {avgScore !== null && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="flex justify-center">
            <CreditScoreGauge score={avgScore} label="Average across all bureaus" />
          </div>

          {/* Individual bureau scores */}
          {scores.length > 1 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {scores.map((s) => (
                <div
                  key={s.bureau}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center"
                >
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                    {s.bureau}
                  </p>
                  <p className={`mt-1 text-xl font-bold tracking-tighter ${scoreTextClass(s.score)}`}>
                    {s.score}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Dispute Progress                                             */}
      {/* ------------------------------------------------------------ */}
      {totalDisputes > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 backdrop-blur-xl">
          <DisputeProgress
            total={totalDisputes}
            disputed={inProgressCount}
            removed={removedCount}
          />

          {/* Recent dispute items */}
          <div className="mt-4 space-y-2">
            {disputes.slice(0, 4).map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm"
              >
                {d.status === 'removed' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : d.status === 'in_progress' || d.status === 'disputed' ? (
                  <Clock className="h-4 w-4 shrink-0 text-blue-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-white/20" />
                )}
                <span className="min-w-0 flex-1 text-white/70">{d.creditorName}</span>
                <span className="shrink-0 text-xs text-white/30">{d.bureau}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Document Status                                              */}
      {/* ------------------------------------------------------------ */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 backdrop-blur-xl">
        <DocumentStatus documents={documents} requiredTypes={requiredDocs} />
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Next Steps                                                   */}
      {/* ------------------------------------------------------------ */}
      {nextSteps.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <ArrowUpRight className="h-4 w-4 text-red-400" />
            What You Need to Do
          </h2>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <NextStepCard
                key={step.id}
                title={step.title}
                description={step.description}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Recent Activity Timeline                                     */}
      {/* ------------------------------------------------------------ */}
      {activity.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/90">Recent Activity</h2>
          <div className="space-y-0">
            {activity.map((item, i) => (
              <div key={item.id} className="relative flex gap-3 pb-4">
                {/* Vertical connector line */}
                {i < activity.length - 1 && (
                  <div className="absolute left-[11px] top-7 h-full w-px bg-white/[0.06]" />
                )}
                {/* Icon */}
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                  {activityIcon(item.type)}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm text-white/80">{item.title}</p>
                  <p className="text-xs text-white/35">{item.description}</p>
                  <p className="mt-0.5 text-[11px] text-white/20">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Message Sent Toast                                           */}
      {/* ------------------------------------------------------------ */}
      {showMessageSent && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-400 shadow-xl backdrop-blur-xl">
          Message sent to your team!
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Floating Message Melli Button                                 */}
      {/* ------------------------------------------------------------ */}
      <MessageMelliButton onClick={handleMessageMelli} />
    </div>
  );
}

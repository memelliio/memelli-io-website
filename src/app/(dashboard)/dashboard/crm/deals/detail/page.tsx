'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Percent,
  User,
  Link2,
  MessageSquare,
  Phone,
  Mail,
  Users,
  FileText,
  CheckSquare,
  Paperclip,
  Clock,
  Pencil,
  Check,
  X,
  Plus,
  ChevronDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge, type BadgeVariant } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  probability?: number;
  stageName?: string;
  stageId?: string;
  stage?: { id: string; name: string; order?: number };
  pipelineName?: string;
  pipelineId?: string;
  pipeline?: { id: string; name: string };
  contactName?: string;
  contactId?: string;
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
  companyName?: string;
  assignedToId?: string;
  assignedToName?: string;
  notes?: string;
  expectedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Stage {
  id: string;
  name: string;
  order?: number;
}

interface StageHistoryEntry {
  id: string;
  stageId: string;
  stage?: { name: string };
  fromStageName?: string;
  toStageName?: string;
  movedAt?: string;
  createdAt?: string;
}

interface Communication {
  id: string;
  type: string;
  body?: string;
  subject?: string;
  occurredAt?: string;
  createdAt: string;
  userName?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  dueAt?: string;
  createdAt: string;
  assignedToName?: string;
}

interface DealFile {
  id: string;
  name: string;
  url?: string;
  size?: number;
  createdAt: string;
  uploadedByName?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type CommType = 'EMAIL' | 'CALL' | 'SMS' | 'MEETING' | 'NOTE';

const COMM_TYPES: CommType[] = ['EMAIL', 'CALL', 'SMS', 'MEETING', 'NOTE'];

const commIcon: Record<string, typeof Mail> = {
  EMAIL: Mail,
  CALL: Phone,
  SMS: MessageSquare,
  MEETING: Users,
  NOTE: FileText,
};

const commColors: Record<string, string> = {
  EMAIL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CALL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SMS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEETING: 'bg-red-500/10 text-red-400 border-red-500/20',
  NOTE: 'bg-white/[0.04] text-muted-foreground border-white/[0.04]',
};

const statusVariant: Record<string, BadgeVariant> = {
  OPEN: 'primary',
  WON: 'success',
  LOST: 'error',
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function getContactDisplay(d: Deal): string {
  if (d.contactName) return d.contactName;
  if (d.contact)
    return (
      [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ') ||
      d.contact.email ||
      ''
    );
  return '';
}

function getStageName(d: Deal): string {
  return d.stageName ?? d.stage?.name ?? '';
}

function getPipelineName(d: Deal): string {
  return d.pipelineName ?? d.pipeline?.name ?? '';
}

function fmtDate(s?: string) {
  if (!s) return '\u2014';
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? [];
}

/* ------------------------------------------------------------------ */
/*  Stage Progress Bar                                                 */
/* ------------------------------------------------------------------ */

function StageProgressBar({
  stages,
  currentStageId,
  onMoveStage,
  disabled,
}: {
  stages: Stage[];
  currentStageId?: string;
  onMoveStage: (stageId: string) => void;
  disabled: boolean;
}) {
  const sorted = [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIdx = sorted.findIndex((s) => s.id === currentStageId);

  return (
    <div className="flex items-center gap-1 w-full">
      {sorted.map((stage, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <button
            key={stage.id}
            disabled={disabled || isCurrent}
            onClick={() => onMoveStage(stage.id)}
            title={stage.name}
            className={`
              group relative flex-1 h-9 flex items-center justify-center text-xs font-medium
              transition-all duration-200 first:rounded-l-xl last:rounded-r-xl
              ${isPast ? 'bg-red-600/30 text-red-300 hover:bg-red-600/50' : ''}
              ${isCurrent ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : ''}
              ${isFuture ? 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground' : ''}
              ${disabled ? 'cursor-not-allowed opacity-60' : isCurrent ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className="truncate px-2">{stage.name}</span>
            {/* Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-muted border border-white/[0.06] px-2.5 py-1 text-[10px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {stage.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Editable Field                                              */
/* ------------------------------------------------------------------ */

function InlineField({
  label,
  value,
  icon: Icon,
  type = 'text',
  onSave,
  renderValue,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  type?: string;
  onSave: (val: string) => Promise<void>;
  renderValue?: (val: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.02] transition-all duration-200">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/[0.08] border border-red-500/10">
        <Icon className="h-4 w-4 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type={type}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-muted border border-white/[0.06] rounded-lg px-2 py-1 text-sm text-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setDraft(value);
                setEditing(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-foreground font-medium">
              {renderValue ? renderValue(value) : value || '\u2014'}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DealDetailView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = useApi();

  const dealId = searchParams.get('id');

  const [deal, setDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<DealFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movingStage, setMovingStage] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'activity' | 'notes' | 'tasks' | 'files'>('activity');

  // Log communication modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<CommType>('NOTE');
  const [logSubject, setLogSubject] = useState('');
  const [logBody, setLogBody] = useState('');
  const [logging, setLogging] = useState(false);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  /* ---- Load ---- */

  const loadDeal = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError(null);
    try {
      const [dealRes, commsRes, historyRes] = await Promise.all([
        api.get<any>(`/api/crm/deals/${dealId}`),
        api.get<any>(`/api/crm/communications?dealId=${dealId}`),
        api.get<any>(`/api/crm/deals/${dealId}/stage-history`),
      ]);

      const d: Deal = dealRes.data?.data ?? dealRes.data;
      setDeal(d);
      setCommunications(extractList<Communication>(commsRes.data));
      setStageHistory(extractList<StageHistoryEntry>(historyRes.data));
      setNotesDraft(d?.notes ?? '');

      // Load pipeline stages
      const plId = d?.pipelineId ?? d?.pipeline?.id;
      if (plId) {
        const stagesRes = await api.get<any>(`/api/crm/pipelines/${plId}`);
        const plData = stagesRes.data?.data ?? stagesRes.data;
        setStages(plData?.stages ?? []);
      }

      // Try loading tasks and files (may not exist)
      try {
        const tasksRes = await api.get<any>(`/api/crm/deals/${dealId}/tasks`);
        setTasks(extractList<Task>(tasksRes.data));
      } catch {
        setTasks([]);
      }

      try {
        const filesRes = await api.get<any>(`/api/crm/deals/${dealId}/files`);
        setFiles(extractList<DealFile>(filesRes.data));
      } catch {
        setFiles([]);
      }

      setLoading(false);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load deal');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  /* ---- Actions ---- */

  async function handleMoveStage(stageId: string) {
    setMovingStage(true);
    try {
      await api.patch(`/api/crm/deals/${dealId}`, { stageId });
      const res = await api.get<any>(`/api/crm/deals/${dealId}`);
      setDeal(res.data?.data ?? res.data);
      // Refresh history
      const histRes = await api.get<any>(`/api/crm/deals/${dealId}/stage-history`);
      setStageHistory(extractList<StageHistoryEntry>(histRes.data));
    } finally {
      setMovingStage(false);
    }
  }

  async function handleUpdateField(field: string, value: any) {
    await api.patch(`/api/crm/deals/${dealId}`, { [field]: value });
    const res = await api.get<any>(`/api/crm/deals/${dealId}`);
    setDeal(res.data?.data ?? res.data);
  }

  async function handleLogComm(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    await api.post('/api/crm/communications', {
      dealId,
      type: logType,
      subject: logSubject,
      body: logBody,
    });
    setShowLogModal(false);
    setLogBody('');
    setLogSubject('');
    setLogType('NOTE');
    setLogging(false);
    const res = await api.get<any>(`/api/crm/communications?dealId=${dealId}`);
    setCommunications(extractList<Communication>(res.data));
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await handleUpdateField('notes', notesDraft);
    setSavingNotes(false);
    setEditingNotes(false);
  }

  /* ---- Render ---- */

  if (!dealId) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-muted-foreground text-sm">No deal ID provided</p>
          <Link href="/dashboard/crm/deals" className="text-red-400 hover:text-red-300 text-sm underline">
            Back to deals
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-red-500" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-card p-8">
        <div className="rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-xl p-6 text-sm text-red-300 max-w-lg mx-auto">
          {error ?? 'Deal not found'}
        </div>
      </div>
    );
  }

  const contact = getContactDisplay(deal);
  const contactId = deal.contactId ?? deal.contact?.id;
  const dealStage = getStageName(deal);
  const dealPipeline = getPipelineName(deal);
  const currentStageId = deal.stageId ?? deal.stage?.id;

  // Compute stage progress percentage
  const sortedStages = [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const stageIdx = sortedStages.findIndex((s) => s.id === currentStageId);
  const stageProgress = sortedStages.length > 0 ? Math.round(((stageIdx + 1) / sortedStages.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-card p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ---- Header ---- */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
                {deal.title}
              </h1>
              <Badge variant={statusVariant[deal.status] ?? 'default'} className="capitalize">
                {deal.status.toLowerCase()}
              </Badge>
              {deal.probability != null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {deal.probability}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap text-sm text-muted-foreground">
              {dealPipeline && <span>Pipeline: {dealPipeline}</span>}
              {dealStage && <span>Stage: {dealStage}</span>}
              {deal.assignedToName && <span>Agent: {deal.assignedToName}</span>}
            </div>
          </div>

          {deal.value != null && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-red-400 tabular-nums">
                {fmtCurrency(deal.value)}
              </p>
              {deal.probability != null && deal.value != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Weighted: {fmtCurrency(deal.value * (deal.probability / 100))}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ---- Stage Progress Bar ---- */}
        {stages.length > 0 && (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Stage Progress
                </p>
                <span className="text-xs text-red-400 font-medium tabular-nums">{stageProgress}%</span>
              </div>
              <StageProgressBar
                stages={stages}
                currentStageId={currentStageId}
                onMoveStage={handleMoveStage}
                disabled={movingStage}
              />
            </CardContent>
          </Card>
        )}

        {/* ---- Main Grid ---- */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ---- Left: Details + Tabs ---- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Fields (inline editable) */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardContent className="p-2 divide-y divide-white/[0.03]">
                <InlineField
                  label="Deal Name"
                  value={deal.title}
                  icon={FileText}
                  onSave={(v) => handleUpdateField('title', v)}
                />
                <InlineField
                  label="Value"
                  value={deal.value != null ? String(deal.value) : ''}
                  icon={DollarSign}
                  type="number"
                  onSave={(v) => handleUpdateField('value', v ? parseFloat(v) : null)}
                  renderValue={(v) => (v ? fmtCurrency(parseFloat(v)) : '\u2014')}
                />
                <InlineField
                  label="Probability"
                  value={deal.probability != null ? String(deal.probability) : ''}
                  icon={Percent}
                  type="number"
                  onSave={(v) => handleUpdateField('probability', v ? parseInt(v, 10) : null)}
                  renderValue={(v) => (v ? `${v}%` : '\u2014')}
                />
                <InlineField
                  label="Close Date"
                  value={deal.expectedAt ? deal.expectedAt.split('T')[0] : ''}
                  icon={Calendar}
                  type="date"
                  onSave={(v) => handleUpdateField('expectedAt', v || null)}
                  renderValue={(v) => fmtDate(v || undefined)}
                />
                <InlineField
                  label="Assigned Agent"
                  value={deal.assignedToName ?? ''}
                  icon={User}
                  onSave={(v) => handleUpdateField('assignedToName', v || null)}
                />

                {/* Contact link (not editable, just links) */}
                <div className="flex items-center gap-3 rounded-xl px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/[0.08] border border-red-500/10">
                    <Link2 className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Contact</p>
                    {contact ? (
                      contactId ? (
                        <Link
                          href={`/dashboard/crm/contacts/${contactId}`}
                          className="text-sm text-red-400 hover:text-red-300 hover:underline transition-all duration-200 mt-0.5 inline-block"
                        >
                          {contact}
                        </Link>
                      ) : (
                        <p className="text-sm text-foreground font-medium mt-0.5">{contact}</p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">{'\u2014'}</p>
                    )}
                    {deal.contact?.email && (
                      <p className="text-xs text-muted-foreground mt-0.5">{deal.contact.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ---- Tabs ---- */}
            <div className="border-b border-white/[0.04]">
              <div className="flex gap-1">
                {(
                  [
                    { key: 'activity', label: 'Activity Timeline', icon: Clock },
                    { key: 'notes', label: 'Notes', icon: FileText },
                    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { key: 'files', label: 'Files', icon: Paperclip },
                  ] as const
                ).map(({ key, label, icon: TabIcon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-200 border-b-2 ${
                      activeTab === key
                        ? 'border-red-500 text-red-400'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ---- Activity Timeline Tab ---- */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setShowLogModal(true)}
                    className="rounded-xl bg-red-600 hover:bg-red-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Log Communication
                  </Button>
                </div>

                {communications.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="relative ml-4">
                    <div className="absolute left-0 top-2 bottom-2 w-px bg-red-500/20" />
                    <div className="space-y-1">
                      {communications.map((comm) => {
                        const Icon = commIcon[comm.type] ?? FileText;
                        const colorClass = commColors[comm.type] ?? commColors.NOTE;
                        return (
                          <div
                            key={comm.id}
                            className="relative flex items-start gap-4 pl-6 py-3 rounded-xl hover:bg-white/[0.02] transition-all duration-200"
                          >
                            <div className="absolute left-[-4px] top-5 h-2 w-2 rounded-full bg-red-500 ring-4 ring-zinc-950" />
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {comm.type}
                                </span>
                                {comm.userName && (
                                  <span className="text-xs text-muted-foreground">by {comm.userName}</span>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                  {fmtDateTime(comm.occurredAt ?? comm.createdAt)}
                                </span>
                              </div>
                              {comm.subject && (
                                <p className="text-sm font-medium text-foreground mt-1">{comm.subject}</p>
                              )}
                              {comm.body && (
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{comm.body}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---- Notes Tab ---- */}
            {activeTab === 'notes' && (
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardContent className="p-6">
                  {editingNotes ? (
                    <div className="space-y-3">
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={8}
                        autoFocus
                        className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none resize-none transition-all duration-200"
                        placeholder="Write deal notes..."
                      />
                      <div className="flex justify-end gap-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setNotesDraft(deal.notes ?? '');
                            setEditingNotes(false);
                          }}
                          className="rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          isLoading={savingNotes}
                          onClick={handleSaveNotes}
                          className="rounded-xl bg-red-600 hover:bg-red-500 text-white"
                        >
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {deal.notes ? (
                        <div
                          onClick={() => setEditingNotes(true)}
                          className="text-sm text-foreground leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-white/[0.02] rounded-xl p-3 -m-3 transition-all duration-200"
                        >
                          {deal.notes}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-3">No notes yet</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingNotes(true)}
                            className="rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Notes
                          </Button>
                        </div>
                      )}
                      {deal.notes && (
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={() => setEditingNotes(true)}
                            className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-all duration-200"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ---- Tasks Tab ---- */}
            {activeTab === 'tasks' && (
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardContent className="p-0">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No tasks linked to this deal</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.03]">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-all duration-200">
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              task.status === 'DONE' || task.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-amber-500'
                                : 'bg-muted'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{task.title}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              {task.assignedToName && <span>{task.assignedToName}</span>}
                              {task.dueAt && <span>Due {fmtDate(task.dueAt)}</span>}
                            </div>
                          </div>
                          <Badge
                            variant={
                              task.status === 'DONE' || task.status === 'COMPLETED'
                                ? 'success'
                                : task.status === 'IN_PROGRESS'
                                ? 'warning'
                                : 'muted'
                            }
                            className="capitalize text-[10px]"
                          >
                            {task.status.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ---- Files Tab ---- */}
            {activeTab === 'files' && (
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardContent className="p-0">
                  {files.length === 0 ? (
                    <div className="text-center py-12">
                      <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No files attached</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.03]">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-all duration-200">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-white/[0.04]">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {file.url ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-400 hover:text-red-300 hover:underline font-medium truncate block"
                              >
                                {file.name}
                              </a>
                            ) : (
                              <p className="text-sm text-foreground font-medium truncate">{file.name}</p>
                            )}
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              {file.size != null && <span>{fmtFileSize(file.size)}</span>}
                              {file.uploadedByName && <span>{file.uploadedByName}</span>}
                              <span>{fmtDate(file.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ---- Right Sidebar ---- */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Deal Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted border border-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Value</p>
                    <p className="text-lg font-bold text-red-400 tabular-nums mt-1">
                      {deal.value != null ? fmtCurrency(deal.value) : '\u2014'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted border border-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Probability</p>
                    <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                      {deal.probability != null ? `${deal.probability}%` : '\u2014'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  {[
                    { label: 'Stage', value: dealStage },
                    { label: 'Pipeline', value: dealPipeline },
                    { label: 'Close Date', value: fmtDate(deal.expectedAt) },
                    { label: 'Created', value: fmtDate(deal.createdAt) },
                    { label: 'Updated', value: fmtDate(deal.updatedAt) },
                    { label: 'Agent', value: deal.assignedToName ?? '\u2014' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium text-right">{value || '\u2014'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stage History */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Stage History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {stageHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No stage changes yet</p>
                ) : (
                  <div className="relative space-y-0">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-red-500/20" />
                    {stageHistory.map((h) => (
                      <div key={h.id} className="relative flex items-start gap-3 py-2.5 pl-7">
                        <div className="absolute left-1.5 top-4 h-3 w-3 rounded-full border-2 border-red-500 bg-card" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {h.toStageName ?? h.stage?.name ?? 'Unknown'}
                          </p>
                          {h.fromStageName && (
                            <p className="text-xs text-muted-foreground mt-0.5">from {h.fromStageName}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fmtDate(h.movedAt ?? h.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ---- Log Communication Modal ---- */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 mx-4 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Log Communication
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogComm} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMM_TYPES.map((t) => {
                    const TIcon = commIcon[t] ?? FileText;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLogType(t)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                          logType === t
                            ? commColors[t]
                            : 'border-white/[0.04] bg-muted text-muted-foreground hover:border-white/[0.08] hover:bg-white/[0.04]'
                        }`}
                      >
                        <TIcon className="h-3.5 w-3.5" /> {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={logSubject}
                  onChange={(e) => setLogSubject(e.target.value)}
                  placeholder="Optional subject line"
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Body / Notes
                </label>
                <textarea
                  value={logBody}
                  onChange={(e) => setLogBody(e.target.value)}
                  rows={4}
                  placeholder="Add details..."
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none resize-none transition-all duration-200"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground"
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={logging}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white"
                >
                  Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

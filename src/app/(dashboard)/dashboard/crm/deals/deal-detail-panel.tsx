'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Phone,
  Mail,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Pencil,
  ChevronDown,
  Clock,
  X,
  Plus,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge, type BadgeVariant } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

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
  stage?: { id: string; name: string };
  pipelineName?: string;
  pipelineId?: string;
  pipeline?: { id: string; name: string };
  contactName?: string;
  contactId?: string;
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
  companyName?: string;
  notes?: string;
  expectedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Stage {
  id: string;
  name: string;
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
  occurredAt?: string;
  createdAt: string;
  userName?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const COMM_TYPES = ['EMAIL', 'CALL', 'SMS', 'MEETING', 'NOTE'] as const;

const commIcon: Record<string, typeof Mail> = {
  EMAIL: Mail,
  CALL: Phone,
  SMS: MessageSquare,
  MEETING: Users,
  NOTE: FileText,
};

const statusVariant: Record<string, BadgeVariant> = {
  OPEN: 'primary',
  WON: 'success',
  LOST: 'error',
};

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function getContactDisplay(d: Deal): string {
  if (d.contactName) return d.contactName;
  if (d.contact) return [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ') || d.contact.email || '';
  return '';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DealDetailPanelProps {
  dealId: string;
}

export default function DealDetailPanel({ dealId }: DealDetailPanelProps) {
  const api = useApi();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comms' | 'notes' | 'history'>('comms');

  /* Quick action state */
  const [movingStage, setMovingStage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  /* Log comm modal */
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<string>('NOTE');
  const [logBody, setLogBody] = useState('');
  const [logging, setLogging] = useState(false);

  /* ---- Load ---- */

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    async function load() {
      const [dealRes, commsRes, historyRes] = await Promise.all([
        api.get<any>(`/api/crm/deals/${dealId}`),
        api.get<any>(`/api/crm/communications?dealId=${dealId}`),
        api.get<any>(`/api/crm/deals/${dealId}/stage-history`),
      ]);

      const d = dealRes.data?.data ?? dealRes.data;
      setDeal(d);
      setCommunications(
        Array.isArray(commsRes.data) ? commsRes.data : (commsRes.data?.data ?? commsRes.data?.items ?? []),
      );
      setStageHistory(
        Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.data ?? historyRes.data?.items ?? []),
      );

      const plId = d?.pipelineId ?? d?.pipeline?.id;
      if (plId) {
        const stagesRes = await api.get<any>(`/api/crm/pipelines/${plId}`);
        const plData = stagesRes.data?.data ?? stagesRes.data;
        setStages(plData?.stages ?? []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  /* ---- Actions ---- */

  async function handleMoveStage(stageId: string) {
    setMovingStage(true);
    await api.patch(`/api/crm/deals/${dealId}`, { stageId });
    const res = await api.get<any>(`/api/crm/deals/${dealId}`);
    setDeal(res.data?.data ?? res.data);
    setMovingStage(false);
  }

  async function handleSetStatus(status: 'WON' | 'LOST') {
    setUpdatingStatus(true);
    await api.patch(`/api/crm/deals/${dealId}`, { status });
    const res = await api.get<any>(`/api/crm/deals/${dealId}`);
    setDeal(res.data?.data ?? res.data);
    setUpdatingStatus(false);
  }

  async function handleLogComm(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    await api.post('/api/crm/communications', { dealId, type: logType, body: logBody });
    setShowLogModal(false);
    setLogBody('');
    setLogType('NOTE');
    setLogging(false);
    // Refresh comms
    const res = await api.get<any>(`/api/crm/communications?dealId=${dealId}`);
    setCommunications(Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.items ?? []));
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!deal) {
    return <div className="text-center text-zinc-500 py-8">Deal not found</div>;
  }

  const contact = getContactDisplay(deal);
  const dealStage = deal.stageName ?? deal.stage?.name ?? '';
  const dealPipeline = deal.pipelineName ?? deal.pipeline?.name ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 truncate">{deal.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={statusVariant[deal.status] ?? 'default'}>
                {deal.status.toLowerCase()}
              </Badge>
              {deal.probability != null && (
                <span className="text-xs text-zinc-500">{deal.probability}% probability</span>
              )}
            </div>
          </div>
          {deal.value != null && (
            <p className="text-xl font-bold text-red-400 tabular-nums shrink-0">
              {fmtCurrency(deal.value)}
            </p>
          )}
        </div>

        {dealStage && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Stage:</span>
            <Badge variant="primary">{dealStage}</Badge>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Move Stage */}
        {stages.length > 0 && (
          <div className="relative">
            <select
              value={deal.stageId ?? deal.stage?.id ?? ''}
              onChange={(e) => handleMoveStage(e.target.value)}
              disabled={movingStage}
              className="appearance-none rounded-md border border-zinc-700 bg-zinc-800 pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
          </div>
        )}

        <Button
          size="sm"
          variant="secondary"
          disabled={updatingStatus || deal.status === 'WON'}
          onClick={() => handleSetStatus('WON')}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Won
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={updatingStatus || deal.status === 'LOST'}
          onClick={() => handleSetStatus('LOST')}
        >
          <XCircle className="h-3.5 w-3.5 text-red-400" /> Lost
        </Button>
        <Link href={`/dashboard/crm/deals/${deal.id}`}>
          <Button size="sm" variant="ghost">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </Link>
      </div>

      {/* Contact link */}
      {contact && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
          <p className="text-xs text-zinc-500 mb-0.5">Contact</p>
          {deal.contactId ?? deal.contact?.id ? (
            <Link
              href={`/dashboard/crm/contacts/${deal.contactId ?? deal.contact?.id}`}
              className="text-sm text-red-400 hover:underline"
            >
              {contact}
            </Link>
          ) : (
            <p className="text-sm text-zinc-200">{contact}</p>
          )}
          {deal.contact?.email && (
            <p className="text-xs text-zinc-500 mt-0.5">{deal.contact.email}</p>
          )}
        </div>
      )}

      {/* Details */}
      <div className="space-y-2">
        {[
          { label: 'Pipeline', value: dealPipeline },
          { label: 'Close Date', value: deal.expectedAt ? new Date(deal.expectedAt).toLocaleDateString() : '' },
          { label: 'Created', value: new Date(deal.createdAt).toLocaleDateString() },
        ]
          .filter((r) => r.value)
          .map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-200 font-medium">{value}</span>
            </div>
          ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-700">
        <div className="flex gap-4">
          {(['comms', 'notes', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'comms' ? 'Communications' : tab === 'notes' ? 'Notes' : 'Stage History'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'comms' && (
        <div className="space-y-3">
          <Button size="sm" variant="secondary" onClick={() => setShowLogModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Log Communication
          </Button>
          {communications.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No communications yet</p>
          ) : (
            <div className="space-y-2">
              {communications.map((comm) => {
                const Icon = commIcon[comm.type] ?? FileText;
                return (
                  <div key={comm.id} className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-600/15">
                      <Icon className="h-3.5 w-3.5 text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{comm.type}</span>
                        <span className="ml-auto text-xs text-zinc-600">
                          {new Date(comm.occurredAt ?? comm.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {comm.body && <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{comm.body}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          {deal.notes ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {deal.notes}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">No notes</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {stageHistory.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No history yet</p>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-700" />
              {stageHistory.map((h) => (
                <div key={h.id} className="relative flex items-start gap-3 py-2 pl-7">
                  <div className="absolute left-1.5 top-3 h-3 w-3 rounded-full border-2 border-red-500 bg-zinc-900" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {h.toStageName ?? h.stage?.name ?? 'Unknown'}
                    </p>
                    {h.fromStageName && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> from {h.fromStageName}
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(h.movedAt ?? h.createdAt ?? '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Communication Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-100">Log Communication</h3>
              <button onClick={() => setShowLogModal(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogComm} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {COMM_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLogType(t)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        logType === t
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Note / Body</label>
                <textarea
                  value={logBody}
                  onChange={(e) => setLogBody(e.target.value)}
                  rows={4}
                  placeholder="Add details..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={logging}>
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


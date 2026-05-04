'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Phone, Mail, Users, FileText, X, ChevronDown } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  stageName?: string;
  stageId?: string;
  pipelineName?: string;
  pipelineId?: string;
  contactName?: string;
  contactId?: string;
  companyName?: string;
  createdAt: string;
}

interface Stage { id: string; name: string; }

interface Communication {
  id: string;
  type: string;
  body?: string;
  createdAt: string;
  userName?: string;
}

interface StageHistory {
  id: string;
  fromStageName?: string;
  toStageName: string;
  createdAt: string;
}

const COMM_TYPES = ['EMAIL', 'CALL', 'SMS', 'MEETING', 'NOTE'];

const commIcon: Record<string, typeof Mail> = {
  EMAIL: Mail, CALL: Phone, SMS: MessageSquare, MEETING: Users, NOTE: FileText,
};

const statusVariant: Record<string, 'success' | 'destructive' | 'primary' | 'muted'> = {
  OPEN: 'primary', WON: 'success', LOST: 'destructive',
};

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const api = useApi();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState('NOTE');
  const [logBody, setLogBody] = useState('');
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [movingStage, setMovingStage] = useState(false);

  const loadComms = async () => {
    const res = await api.get<any>(`/api/crm/communications?dealId=${dealId}`);
    const list: Communication[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.items ?? []);
    setCommunications(list);
  };

  useEffect(() => {
    if (!dealId) return;
    async function load() {
      const [dealRes, commsRes, historyRes] = await Promise.all([
        api.get<any>(`/api/crm/deals/${dealId}`),
        api.get<any>(`/api/crm/communications?dealId=${dealId}`),
        api.get<any>(`/api/crm/deals/${dealId}/stage-history`),
      ]);
      const d: Deal = dealRes.data?.data ?? dealRes.data;
      setDeal(d);
      setCommunications(Array.isArray(commsRes.data) ? commsRes.data : (commsRes.data?.data ?? commsRes.data?.items ?? []));
      setStageHistory(Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.data ?? historyRes.data?.items ?? []));

      if (d?.pipelineId) {
        const stagesRes = await api.get<any>(`/api/crm/pipelines/${d.pipelineId}/stages`);
        setStages(Array.isArray(stagesRes.data) ? stagesRes.data : (stagesRes.data?.data ?? stagesRes.data?.items ?? []));
      }
      setLoading(false);
    }
    load().catch((e: Error) => { setError(e.message); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const handleMoveStage = async (stageId: string) => {
    setMovingStage(true);
    await api.patch(`/api/crm/deals/${dealId}/stage`, { stageId });
    const res = await api.get<any>(`/api/crm/deals/${dealId}`);
    setDeal(res.data?.data ?? res.data);
    setMovingStage(false);
  };

  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    setLogError(null);
    const res = await api.post<any>('/api/crm/communications', { dealId, type: logType, body: logBody });
    if (res.error) { setLogError(res.error); setLogging(false); return; }
    setShowLogModal(false);
    setLogBody('');
    setLogType('NOTE');
    setLogging(false);
    await loadComms();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-primary/80/5 border border-primary/20 backdrop-blur-xl p-4 text-sm text-primary/80">
          {error ?? 'Deal not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/crm/deals" className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">{deal.title}</h1>
            <Badge variant={statusVariant[deal.status] ?? 'muted'} className="capitalize">
              {deal.status.toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap text-sm text-muted-foreground">
            {deal.contactName && <span>{deal.contactName}</span>}
            {deal.companyName && <span>{deal.companyName}</span>}
            {deal.pipelineName && <span>Pipeline: {deal.pipelineName}</span>}
            {deal.stageName && <span>Stage: {deal.stageName}</span>}
          </div>
        </div>
        {deal.value != null && (
          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              ${deal.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Move Stage */}
          {stages.length > 0 && (
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader><CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Move to Stage</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <select
                      value={deal.stageId ?? ''}
                      onChange={(e) => handleMoveStage(e.target.value)}
                      disabled={movingStage}
                      className="w-full appearance-none rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl pl-3 pr-8 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200"
                    >
                      <option value="">Select stage...</option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {movingStage && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Communications */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Communications</CardTitle>
              <Button size="sm" onClick={() => setShowLogModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                Log Communication
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {communications.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No communications logged yet
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {communications.map((comm) => {
                    const Icon = commIcon[comm.type] ?? FileText;
                    return (
                      <div key={comm.id} className="flex items-start gap-4 px-6 py-5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{comm.type}</span>
                            {comm.userName && <span className="text-xs text-muted-foreground">· {comm.userName}</span>}
                            <span className="ml-auto text-xs text-muted-foreground">{new Date(comm.createdAt).toLocaleString()}</span>
                          </div>
                          {comm.body && <p className="text-sm mt-1 text-muted-foreground leading-relaxed">{comm.body}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Stage History */}
        <div className="space-y-6">
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader><CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Stage History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {stageHistory.length === 0 ? (
                <div className="px-6 py-6 text-center text-sm text-muted-foreground">No history yet</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {stageHistory.map((h) => (
                    <div key={h.id} className="px-5 py-4">
                      <p className="text-sm font-medium text-foreground">{h.toStageName}</p>
                      {h.fromStageName && (
                        <p className="text-xs text-muted-foreground mt-0.5">from {h.fromStageName}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader><CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {[
                  { label: 'Created', value: new Date(deal.createdAt).toLocaleDateString() },
                  { label: 'Pipeline', value: deal.pipelineName ?? '\u2014' },
                  { label: 'Stage', value: deal.stageName ?? '\u2014' },
                  { label: 'Contact', value: deal.contactName ?? '\u2014' },
                  { label: 'Company', value: deal.companyName ?? '\u2014' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Communication Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 mx-4 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">Log Communication</h3>
              <button onClick={() => setShowLogModal(false)} className="text-muted-foreground hover:text-foreground transition-all duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            {logError && (
              <div className="mb-4 rounded-2xl bg-primary/80/5 border border-primary/20 p-3 text-sm text-primary/80">{logError}</div>
            )}
            <form onSubmit={handleLogComm} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {COMM_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setLogType(t)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${logType === t ? 'bg-primary/80/[0.08] text-primary/80 border border-primary/50' : 'bg-muted text-muted-foreground border border-white/[0.06] hover:bg-muted'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Note / Body</label>
                <textarea value={logBody} onChange={(e) => setLogBody(e.target.value)} rows={4} placeholder="Add details..."
                  className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowLogModal(false)} className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-muted-foreground transition-all duration-200">Cancel</button>
                <Button type="submit" isLoading={logging} className="bg-primary hover:bg-primary/90 text-white rounded-xl">Log</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Settings, X } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { KanbanBoard, type KanbanColumn, type KanbanItem } from '@memelli/ui';
import { Button } from '../../../../../../components/ui/button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
  contactName?: string;
  companyName?: string;
  daysInStage?: number;
  stageId?: string;
  createdAt?: string;
}

interface Stage {
  id: string;
  name: string;
  color?: string;
  order: number;
  deals?: Deal[];
}

interface PipelineData {
  id: string;
  name: string;
  stages: Stage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getContactDisplay(d: Deal): string {
  if (d.contactName) return d.contactName;
  if (d.contact) return [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ') || d.contact.email || '';
  return '';
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PipelineKanbanPage() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const api = useApi();
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* add deal modal state */
  const [addDealStageId, setAddDealStageId] = useState<string | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!pipelineId) return;
    setLoading(true);
    api.get<any>(`/api/crm/pipelines/${pipelineId}`).then((res) => {
      const data = res.data?.data ?? res.data;
      setPipeline(data);
      setLoading(false);
    }).catch((e: Error) => {
      setError(e.message);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId]);

  useEffect(() => { load(); }, [load]);

  /* ---- Kanban data ---- */
  const stages = useMemo(
    () => [...(pipeline?.stages ?? [])].sort((a, b) => a.order - b.order),
    [pipeline],
  );

  const kanbanColumns: KanbanColumn[] = useMemo(
    () => stages.map((s) => ({
      id: s.id,
      title: s.name,
      color: s.color,
      items: (s.deals ?? []).map((d) => ({ ...d, columnId: s.id })),
    })),
    [stages],
  );

  /* ---- Drag handler: move deal to new stage ---- */
  const handleMove = useCallback(
    async (itemId: string, _fromColumnId: string, toColumnId: string) => {
      // Optimistic update
      setPipeline((prev) => {
        if (!prev) return prev;
        let movedDeal: Deal | undefined;
        const newStages = prev.stages.map((s) => {
          const filtered = (s.deals ?? []).filter((d) => {
            if (d.id === itemId) { movedDeal = d; return false; }
            return true;
          });
          return { ...s, deals: filtered };
        });
        if (movedDeal) {
          return {
            ...prev,
            stages: newStages.map((s) =>
              s.id === toColumnId ? { ...s, deals: [...(s.deals ?? []), movedDeal!] } : s,
            ),
          };
        }
        return prev;
      });

      await api.patch(`/api/crm/deals/${itemId}`, { stageId: toColumnId });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ---- Add deal ---- */
  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const res = await api.post<any>('/api/crm/deals', {
      pipelineId,
      stageId: addDealStageId,
      title: dealTitle,
      value: dealValue ? parseFloat(dealValue) : undefined,
    });
    if (res.error) { setCreateError(res.error); setCreating(false); return; }
    setAddDealStageId(null);
    setDealTitle('');
    setDealValue('');
    setCreating(false);
    load();
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-card min-h-screen p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/crm/pipelines"
              className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pipeline?.name ?? 'Pipeline'}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Kanban board</p>
            </div>
          </div>
          <Link href={`/dashboard/crm/pipelines/${pipelineId}/settings`}>
            <Button variant="outline" size="sm" className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground">
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-4 py-3 text-sm text-primary/80">{error}</div>
        )}

        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">No stages configured for this pipeline</p>
            <Link href={`/dashboard/crm/pipelines/${pipelineId}/settings`} className="mt-3 text-sm text-primary hover:text-primary/80 transition-all duration-200">
              Add stages
            </Link>
          </div>
        ) : (
          <>
            <KanbanBoard
              columns={kanbanColumns}
              onDragEnd={handleMove}
              renderCard={(item) => {
                const deal = item as KanbanItem & Deal;
                const contact = getContactDisplay(deal);
                return (
                  <Link href={`/dashboard/crm/deals/${deal.id}`} className="block">
                    <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-3 hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200">
                      <p className="text-sm font-medium text-foreground leading-snug">{deal.title}</p>
                      {contact && <p className="text-xs text-muted-foreground mt-1">{contact}</p>}
                      <div className="flex items-center justify-between mt-2">
                        {deal.value != null ? (
                          <span className="text-sm font-bold text-primary tabular-nums">
                            {fmtCurrency(deal.value)}
                          </span>
                        ) : <span />}
                        {deal.daysInStage != null && (
                          <span className="text-xs text-muted-foreground">{deal.daysInStage}d</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              }}
            />

            {/* Add Deal buttons per column */}
            <div className="flex gap-6 overflow-x-auto pb-2">
              {stages.map((stage) => (
                <div key={stage.id} className="w-72 min-w-[18rem] shrink-0">
                  <button
                    onClick={() => setAddDealStageId(stage.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.04] px-3 py-2 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Deal
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add Deal Modal */}
        {addDealStageId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
            <div className="w-full max-w-md bg-card backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 mx-4 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">Add Deal</h3>
                <button onClick={() => setAddDealStageId(null)} className="text-muted-foreground hover:text-foreground transition-all duration-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {createError && (
                <div className="mb-4 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-3 text-sm text-primary/80">{createError}</div>
              )}
              <form onSubmit={handleAddDeal} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Deal Title</label>
                  <input
                    required
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder="e.g. Acme Corp Renewal"
                    className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Value (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl pl-7 pr-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAddDealStageId(null)}
                    className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-muted-foreground transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <Button type="submit" isLoading={creating} disabled={!dealTitle} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                    Add Deal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
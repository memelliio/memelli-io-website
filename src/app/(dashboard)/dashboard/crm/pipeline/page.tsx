'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { GitMerge, DollarSign, ChevronDown, Plus, Users } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { KanbanBoard, type KanbanColumn } from '@memelli/ui';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Pipeline {
  id: string;
  name: string;
  stages?: PipelineStage[];
}

interface PipelineStage {
  id: string;
  name: string;
  color?: string;
  order: number;
  deals?: Deal[];
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  contactName?: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
  companyName?: string;
  stageName?: string;
  stage?: { name: string };
  daysInStage?: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getContactName(d: Deal): string {
  if (d.contactName) return d.contactName;
  if (d.contact) return [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ') || d.contact.email || '';
  return '';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PipelinePage() {
  const api = useApi();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movingDeal, setMovingDeal] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [plRes, dlRes] = await Promise.all([
        api.get<any>('/api/crm/pipelines'),
        api.get<any>('/api/crm/deals'),
      ]);

      if (plRes.error && dlRes.error) {
        setError(plRes.error ?? dlRes.error);
        setLoading(false);
        return;
      }

      const pipelineList: Pipeline[] = Array.isArray(plRes.data)
        ? plRes.data
        : (plRes.data?.data ?? plRes.data?.items ?? []);

      const dealList: Deal[] = Array.isArray(dlRes.data)
        ? dlRes.data
        : (dlRes.data?.data ?? dlRes.data?.items ?? []);

      // If pipelines come with stages but without deals nested, attach deals by stageId
      const enriched = pipelineList.map((pl) => ({
        ...pl,
        stages: (pl.stages ?? []).map((st) => ({
          ...st,
          deals: st.deals?.length
            ? st.deals
            : dealList.filter((d) => {
                const dealStageId = (d as any).stageId ?? d.stage?.name;
                return dealStageId === st.id || dealStageId === st.name;
              }),
        })),
      }));

      setPipelines(enriched);
      if (enriched.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(enriched[0].id);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId],
  );

  /* Build KanbanBoard columns from pipeline stages */
  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    if (!activePipeline?.stages) return [];
    return [...activePipeline.stages]
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        id: stage.id,
        title: stage.name,
        color: stage.color ?? '#f59e0b',
        items: (stage.deals ?? []).map((deal) => ({
          id: deal.id,
          title: deal.title,
          value: deal.value,
          status: deal.status,
          contactName: getContactName(deal),
          companyName: deal.companyName,
          daysInStage: deal.daysInStage,
        })),
      }));
  }, [activePipeline]);

  /* Total pipeline value */
  const totalValue = useMemo(() => {
    return kanbanColumns.reduce(
      (sum, col) => sum + col.items.reduce((s, item) => s + ((item as any).value ?? 0), 0),
      0,
    );
  }, [kanbanColumns]);

  const totalDeals = useMemo(
    () => kanbanColumns.reduce((sum, col) => sum + col.items.length, 0),
    [kanbanColumns],
  );

  /* Drag handler: move deal to a new stage */
  const handleDragEnd = useCallback(
    async (itemId: string, _fromColumnId: string, toColumnId: string) => {
      setMovingDeal(itemId);

      // Optimistic update: move the deal in local state
      setPipelines((prev) =>
        prev.map((pl) => {
          if (pl.id !== selectedPipelineId) return pl;
          let movedDeal: Deal | undefined;
          const updatedStages = (pl.stages ?? []).map((st) => {
            const dealIdx = (st.deals ?? []).findIndex((d) => d.id === itemId);
            if (dealIdx >= 0) {
              movedDeal = (st.deals ?? [])[dealIdx];
              return { ...st, deals: (st.deals ?? []).filter((d) => d.id !== itemId) };
            }
            return st;
          });

          if (movedDeal) {
            return {
              ...pl,
              stages: updatedStages.map((st) =>
                st.id === toColumnId
                  ? { ...st, deals: [...(st.deals ?? []), movedDeal!] }
                  : st,
              ),
            };
          }
          return pl;
        }),
      );

      // Persist to API
      await api.patch(`/api/crm/deals/${itemId}`, { stageId: toColumnId });
      setMovingDeal(null);
    },
    [api, selectedPipelineId],
  );

  /* ---- render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-card">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Deal Pipeline</h1>
          <p className="text-muted-foreground leading-relaxed">Drag deals between stages to update progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/crm/deals/create">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200">
              <Plus className="h-4 w-4" /> New Deal
            </Button>
          </Link>
          <Link href="/dashboard/crm">
            <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200">
              <GitMerge className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-4 py-3 text-sm text-primary">{error}</div>
      )}

      {/* Pipeline selector + summary bar */}
      <div className="flex items-center justify-between bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Pipeline dropdown */}
          {pipelines.length > 1 ? (
            <div className="relative">
              <select
                value={selectedPipelineId ?? ''}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="appearance-none rounded-xl border border-white/[0.06] bg-muted backdrop-blur-xl pl-3 pr-8 py-1.5 text-sm font-medium text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                {pipelines.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          ) : (
            <span className="text-sm font-medium text-foreground">
              {activePipeline?.name ?? 'Pipeline'}
            </span>
          )}
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GitMerge className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{totalDeals}</span> deals
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-primary">{fmtCurrency(totalValue)}</span> value
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{kanbanColumns.length}</span> stages
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {kanbanColumns.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl py-20">
          <GitMerge className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No pipeline stages found</p>
          <Link href="/dashboard/crm/pipelines/create" className="mt-3">
            <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200">
              <Plus className="h-3.5 w-3.5" /> Create Pipeline
            </Button>
          </Link>
        </div>
      ) : (
        <KanbanBoard
          columns={kanbanColumns}
          onDragEnd={handleDragEnd}
          renderCard={(item) => {
            const deal = item as any;
            return (
              <Link
                href={`/dashboard/crm/deals/${deal.id}`}
                className="block"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-2 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-200">
                  <p className="text-sm font-medium text-foreground leading-relaxed">{deal.title}</p>

                  <div className="flex items-center justify-between">
                    {deal.value != null && (
                      <span className="text-xs font-semibold text-primary tabular-nums">
                        {fmtCurrency(deal.value)}
                      </span>
                    )}
                    <Badge
                      variant={
                        deal.status === 'WON' ? 'success' : deal.status === 'LOST' ? 'error' : 'primary'
                      }
                    >
                      {deal.status?.toLowerCase()}
                    </Badge>
                  </div>

                  {deal.contactName && (
                    <p className="text-xs text-muted-foreground truncate">{deal.contactName}</p>
                  )}

                  {deal.companyName && (
                    <p className="text-xs text-muted-foreground truncate">{deal.companyName}</p>
                  )}

                  {deal.daysInStage != null && deal.daysInStage > 0 && (
                    <p className="text-xs text-muted-foreground">{deal.daysInStage}d in stage</p>
                  )}
                </div>
                {movingDeal === deal.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card backdrop-blur-2xl">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </Link>
            );
          }}
        />
      )}
    </div>
  );
}
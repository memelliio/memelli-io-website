'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  FileX,
  GripVertical,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface PipelineCard {
  id: string;
  clientName: string;
  email: string;
  stage: string;
  daysInStage: number;
  documentsComplete: boolean;
  documentsTotal: number;
  documentsSubmitted: number;
}

interface PipelineMetrics {
  avgTimePerStage: number;
  conversionRate: number;
  bottleneckStage: string;
}

interface StageColumn {
  name: string;
  color: string;
  cards: PipelineCard[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const stageColors: Record<string, string> = {
  Registration: '#3b82f6',
  Documents: '#f59e0b',
  Review: '#f97316',
  Underwriting: '#06b6d4',
  Approved: '#22c55e',
  Active: '#10b981',
  Converted: '#ef4444',
};

const defaultStages = ['Registration', 'Documents', 'Review', 'Underwriting', 'Approved', 'Active', 'Converted'];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProPipelinePage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [draggedCard, setDraggedCard] = useState<PipelineCard | null>(null);

  // Fetch pipeline data
  const { data: pipelineData, isLoading } = useQuery<PipelineCard[]>({
    queryKey: ['pro-pipeline-board'],
    queryFn: async () => {
      const res = await api.get<PipelineCard[]>('/api/pro/clients/pipeline/board');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Fetch metrics
  const { data: metrics } = useQuery<PipelineMetrics>({
    queryKey: ['pro-pipeline-metrics'],
    queryFn: async () => {
      const res = await api.get<PipelineMetrics>('/api/pro/clients/pipeline/metrics');
      if (res.error || !res.data) return { avgTimePerStage: 0, conversionRate: 0, bottleneckStage: '-' };
      return res.data;
    },
    staleTime: 60_000,
  });

  // Move card mutation
  const moveMutation = useMutation({
    mutationFn: async ({ clientId, newStage }: { clientId: string; newStage: string }) => {
      const res = await api.patch(`/api/pro/clients/${clientId}/stage`, { stage: newStage });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Client stage updated');
      queryClient.invalidateQueries({ queryKey: ['pro-pipeline-board'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update stage');
    },
  });

  // Organize cards into columns
  const cards = pipelineData ?? [];
  const columns: StageColumn[] = defaultStages.map((stage) => ({
    name: stage,
    color: stageColors[stage] ?? '#71717a',
    cards: cards.filter((c) => c.stage === stage),
  }));

  function handleDragStart(card: PipelineCard) {
    setDraggedCard(card);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(stageName: string) {
    if (draggedCard && draggedCard.stage !== stageName) {
      moveMutation.mutate({ clientId: draggedCard.id, newStage: stageName });
    }
    setDraggedCard(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
          Drag and drop clients between stages to manage your pipeline.
        </p>
      </div>

      {/* Metrics bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-zinc-900/60 px-4 py-3 backdrop-blur-xl">
          <div className="rounded-xl bg-blue-500/10 p-2">
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Avg Time/Stage</p>
            <p className="text-sm font-bold tracking-tight text-zinc-100">{metrics?.avgTimePerStage ?? 0} days</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-zinc-900/60 px-4 py-3 backdrop-blur-xl">
          <div className="rounded-xl bg-emerald-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Conversion Rate</p>
            <p className="text-sm font-bold tracking-tight text-zinc-100">{(metrics?.conversionRate ?? 0).toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-zinc-900/60 px-4 py-3 backdrop-blur-xl">
          <div className="rounded-xl bg-amber-500/10 p-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Bottleneck</p>
            <p className="text-sm font-bold tracking-tight text-zinc-100">{metrics?.bottleneckStage ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${columns.length * 280}px` }}>
          {columns.map((col) => (
            <div
              key={col.name}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.name)}
              className="w-64 shrink-0 rounded-2xl border border-white/[0.04] bg-zinc-900/40 backdrop-blur-xl"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-semibold tracking-tight text-white/70">{col.name}</span>
                </div>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.04] px-1.5 text-[10px] font-bold text-white/30">
                  {col.cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 p-3" style={{ minHeight: '120px' }}>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />
                  ))
                ) : col.cards.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
                    <p className="text-xs text-white/15">No clients</p>
                  </div>
                ) : (
                  col.cards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card)}
                      className="cursor-grab rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.04] active:cursor-grabbing"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <p className="text-sm font-medium text-white/70">{card.clientName}</p>
                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/15" />
                      </div>
                      <p className="mb-2 truncate text-xs text-white/30">{card.email}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-white/30">
                          <Clock className="h-3 w-3" />
                          {card.daysInStage}d
                        </span>
                        <span className="flex items-center gap-1 text-[10px]">
                          {card.documentsComplete ? (
                            <FileCheck className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <FileX className="h-3 w-3 text-amber-400" />
                          )}
                          <span className={card.documentsComplete ? 'text-emerald-400' : 'text-amber-400'}>
                            {card.documentsSubmitted}/{card.documentsTotal}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

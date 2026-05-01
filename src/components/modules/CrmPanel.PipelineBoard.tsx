/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — Pipeline Kanban board                                            */
/*  Extracted from CrmPanel.tsx (refactor 2026-04-30).                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { Loader2 } from 'lucide-react';
import {
  card,
  dealContactName,
  fmtCurrency,
  type Deal,
  type Pipeline,
  type Stage,
} from './CrmPanel.utils';
import { RowSkeleton, SectionHeader, StageBadge } from './CrmPanel.primitives';

interface PipelineBoardProps {
  activePipeline: Pipeline | null;
  stages: Stage[];
  dealsByStage: (stageId: string) => Deal[];
  loadingPipelines: boolean;
  loadingDeals: boolean;
}

export function PipelineBoard({
  activePipeline,
  stages,
  dealsByStage,
  loadingPipelines,
  loadingDeals,
}: PipelineBoardProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <SectionHeader>
          {activePipeline ? activePipeline.name : 'Pipeline'}
        </SectionHeader>
        {loadingPipelines && (
          <Loader2 size={12} className="text-zinc-600 animate-spin" />
        )}
      </div>

      {loadingDeals || loadingPipelines ? (
        <div className="px-3 pb-3">
          <RowSkeleton count={3} />
        </div>
      ) : stages.length === 0 ? (
        <p className="text-[11px] text-zinc-600 py-6 text-center font-mono px-3">
          No pipeline stages found.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto px-3 pb-3 min-h-[120px]">
          {stages
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((stage) => {
              const stageDeals = dealsByStage(stage.id);
              return (
                <div
                  key={stage.id}
                  className="flex flex-col gap-1.5 min-w-[160px] max-w-[200px] flex-shrink-0"
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider truncate">
                      {stage.name}
                    </span>
                    <span
                      className="text-[10px] font-mono text-zinc-600 rounded-full px-1.5 py-0.5"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Deal cards */}
                  {stageDeals.length === 0 ? (
                    <div
                      className="rounded-lg p-2 text-center text-[10px] text-zinc-700 font-mono"
                      style={{ border: '1px dashed rgba(255,255,255,0.06)' }}
                    >
                      empty
                    </div>
                  ) : (
                    stageDeals.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-lg p-2 flex flex-col gap-1"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <span className="text-[11px] text-zinc-200 font-medium leading-snug truncate">
                          {d.title}
                        </span>
                        {d.value != null && (
                          <span className="text-[10px] text-white font-bold font-mono">
                            {fmtCurrency(d.value)}
                          </span>
                        )}
                        {dealContactName(d) !== '—' && (
                          <span className="text-[10px] text-zinc-500 truncate">
                            {dealContactName(d)}
                          </span>
                        )}
                        <StageBadge label={stage.name} />
                      </div>
                    ))
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

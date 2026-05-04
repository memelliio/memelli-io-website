'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GitMerge, DollarSign, Layers, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stageCount?: number;
  stages?: { id: string }[];
  _count?: { deals: number; stages: number };
  totalDeals?: number;
  totalValue?: number;
  createdAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function extractPipelines(res: any): Pipeline[] {
  const d = res?.data ?? res;
  return Array.isArray(d) ? d : d?.data ?? d?.items ?? [];
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function PipelineGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="card" className="h-44 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function PipelinesPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');

  /* ---- Fetch pipelines ---- */
  const { data: pipelines = [], isLoading, isError, error } = useQuery<Pipeline[]>({
    queryKey: ['crm', 'pipelines'],
    queryFn: async () => {
      const res = await api.get<any>('/api/crm/pipelines');
      if (res.error) throw new Error(res.error);
      return extractPipelines(res);
    },
  });

  /* ---- Create pipeline mutation ---- */
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post<Pipeline>('/api/crm/pipelines', { name });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (pipeline) => {
      toast.success('Pipeline created');
      queryClient.invalidateQueries({ queryKey: ['crm', 'pipelines'] });
      setShowCreateModal(false);
      setNewName('');
      if (pipeline?.id) {
        router.push(`/dashboard/crm/pipelines/${pipeline.id}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create pipeline');
    },
  });

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Pipeline name is required');
      return;
    }
    createMutation.mutate(trimmed);
  }

  /* ---- Derived stats per pipeline ---- */
  function getStageCount(p: Pipeline): number {
    return p.stageCount ?? p._count?.stages ?? p.stages?.length ?? 0;
  }

  function getDealCount(p: Pipeline): number {
    return p.totalDeals ?? p._count?.deals ?? 0;
  }

  function getTotalValue(p: Pipeline): number {
    return p.totalValue ?? 0;
  }

  /* ---- Render ---- */
  return (
    <div className="bg-card min-h-screen">
      <div className="space-y-8 p-8">
        <PageHeader
          title="Pipelines"
          subtitle="Manage your sales pipelines and deal flow"
          breadcrumb={[
            { label: 'CRM', href: '/dashboard/crm' },
            { label: 'Pipelines' },
          ]}
          actions={
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200">
              <Plus className="h-4 w-4" /> Create Pipeline
            </Button>
          }
        />

        {/* Error state */}
        {isError && (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4 text-sm text-muted-foreground leading-relaxed">
            {(error as Error)?.message ?? 'Failed to load pipelines'}
          </div>
        )}

        {/* Loading state */}
        {isLoading && <PipelineGridSkeleton />}

        {/* Empty state */}
        {!isLoading && !isError && pipelines.length === 0 && (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <GitMerge className="h-12 w-12 text-muted-foreground mb-6" />
              <p className="text-muted-foreground leading-relaxed text-sm mb-2">No pipelines yet</p>
              <p className="text-muted-foreground text-xs mb-6">
                Create your first pipeline to start tracking deals
              </p>
              <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200">
                <Plus className="h-4 w-4" /> Create Pipeline
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pipeline grid */}
        {!isLoading && pipelines.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => {
              const stages = getStageCount(pipeline);
              const deals = getDealCount(pipeline);
              const value = getTotalValue(pipeline);

              return (
                <Card
                  key={pipeline.id}
                  className="cursor-pointer bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.08] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/5"
                  onClick={() => router.push(`/dashboard/crm/pipelines/${pipeline.id}`)}
                >
                  <CardHeader className="pb-3 p-6">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-2xl font-semibold tracking-tight text-foreground truncate">
                        {pipeline.name}
                      </CardTitle>
                      <Badge variant="default" className="shrink-0 ml-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-muted border-white/[0.04]">
                        {stages} {stages === 1 ? 'stage' : 'stages'}
                      </Badge>
                    </div>
                    {pipeline.description && (
                      <p className="text-muted-foreground leading-relaxed text-sm mt-2 line-clamp-2">
                        {pipeline.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 p-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Stages</span>
                        </div>
                        <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                          {stages}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Deals</span>
                        </div>
                        <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                          {deals}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Value</span>
                        </div>
                        <span className="text-2xl font-semibold tracking-tight text-primary tabular-nums">
                          {fmtCurrency(value)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Pipeline Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewName('');
          }}
          title="Create Pipeline"
          className="bg-card backdrop-blur-2xl border-white/[0.06] rounded-xl"
        >
          <div className="space-y-6 p-6">
            <div>
              <label htmlFor="pipeline-name" className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Pipeline Name
              </label>
              <Input
                id="pipeline-name"
                placeholder="e.g. Sales Pipeline, Recruitment..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                autoFocus
                className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                }}
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createMutation.isPending || !newName.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Pipeline'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Layers,
  MessageSquare,
  Shield,
  BarChart3,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  ProgressBar,
  Skeleton,
  EmptyState,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Cluster {
  id: string;
  name: string;
  seedKeyword?: string;
  description?: string;
  status: string;
  createdAt: string;
  _count?: { questions: number; articles: number };
  // Optional enriched fields
  threadCount?: number;
  authority?: number;
  coverage?: number;
  gapCount?: number;
  topKeywords?: string[];
}

type ClustersResponse = Cluster[];

interface CreateClusterPayload {
  name: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusColor: Record<string, 'success' | 'warning' | 'muted' | 'primary'> = {
  complete: 'success',
  growing: 'primary',
  'needs-content': 'warning',
  new: 'muted',
};

function coverageColor(pct: number): 'green' | 'yellow' | 'primary' {
  if (pct >= 80) return 'green';
  if (pct >= 50) return 'yellow';
  return 'primary';
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ClustersPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  /* ----- data ------------------------------------------------------ */

  const { data, isLoading } = useQuery<ClustersResponse>({
    queryKey: ['seo-clusters'],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the clusters array)
      const res = await api.get<ClustersResponse>('/api/seo/clusters');
      if (res.error) throw new Error(res.error);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const clusters = data ?? [];

  /* ----- create modal state --------------------------------------- */

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async (payload: CreateClusterPayload) => {
      // Backend requires seedKeyword — use name as the seed keyword
      const res = await api.post<Cluster>(
        '/api/seo/clusters',
        { ...payload, seedKeyword: payload.name },
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-clusters'] });
      setModalOpen(false);
      setName('');
      setDescription('');
    },
  });

  function handleCreate() {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  }

  /* ----- render --------------------------------------------------- */

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
      <PageHeader
        title="Topic Clusters"
        subtitle={`${clusters.length} cluster${clusters.length !== 1 ? 's' : ''}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Clusters' },
        ]}
        className="mb-8"
      />

      {/* Action bar */}
      <div className="flex justify-end mb-5">
        <Button onClick={() => setModalOpen(true)} className="gap-1.5 bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200">
          <Plus className="h-4 w-4" />
          Create Cluster
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="No topic clusters"
          description="Clusters group related threads to build topical authority. Create your first cluster to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster) => (
            <Card
              key={cluster.id}
              className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:border-white/[0.08] hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/dashboard/seo/clusters/${cluster.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground leading-snug tracking-tight font-semibold">
                    {cluster.name}
                  </CardTitle>
                  <Badge variant="muted">
                    {cluster.seedKeyword ?? 'cluster'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                {cluster.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {cluster.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCell
                    icon={<MessageSquare className="h-3 w-3" />}
                    value={cluster._count?.questions ?? cluster.threadCount ?? 0}
                    label="Questions"
                  />
                  <StatCell
                    icon={<BarChart3 className="h-3 w-3" />}
                    value={cluster._count?.articles ?? 0}
                    label="Articles"
                  />
                  <StatCell
                    icon={<Shield className="h-3 w-3" />}
                    value={cluster.authority ?? '—'}
                    label="Authority"
                  />
                </div>

                {/* Coverage bar (only if enriched data exists) */}
                {typeof cluster.coverage === 'number' && (
                  <ProgressBar
                    value={cluster.coverage}
                    max={100}
                    size="sm"
                    color={coverageColor(cluster.coverage)}
                  />
                )}

                {/* Seed keyword badge */}
                {cluster.seedKeyword && (
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="default">{cluster.seedKeyword}</Badge>
                    {cluster.topKeywords?.slice(0, 3).map((kw) => (
                      <Badge key={kw} variant="default">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Create Cluster Modal ---- */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Cluster">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <Input
              placeholder="e.g. Credit Score Improvement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <Textarea
              placeholder="Describe the cluster topic and goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {createMutation.error && (
            <p className="text-sm text-primary">
              {(createMutation.error as Error).message}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createMutation.isPending}
              className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat cell sub-component                                            */
/* ------------------------------------------------------------------ */

function StatCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="text-center rounded-xl bg-card backdrop-blur-xl border border-white/[0.04] p-2 transition-all duration-200">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
      </div>
      <p className="text-lg font-semibold tracking-tight text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

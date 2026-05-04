'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  XCircle,
  Users,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  StatusBadge,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SearchInput,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface StageLead {
  id: string;
  name: string;
  email?: string;
  score: number;
  source: string;
  createdAt: string;
  status: string;
}

interface StageData {
  stage: string;
  stageLabel: string;
  nextStage?: string;
  leads: StageLead[];
  total: number;
}

const PAGE_SIZE = 25;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export default function StageDetailPage() {
  const params = useParams();
  const stage = params.stage as string;
  const api = useApi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: stageData, isLoading } = useQuery<StageData>({
    queryKey: ['pipeline-stage', stage, { search, page }],
    queryFn: async () => {
      const p = new URLSearchParams({
        page: String(page),
        perPage: String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res = await api.get<StageData>(
        `/api/leads/pipeline/stage/${stage}?${p}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const leads = stageData?.leads ?? [];
  const total = stageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stageLabel = stageData?.stageLabel ?? stage.charAt(0).toUpperCase() + stage.slice(1);

  const advanceMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post(`/api/leads/pipeline/${leadId}/advance`, {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Lead advanced to next stage');
      queryClient.invalidateQueries({ queryKey: ['pipeline-stage', stage] });
      queryClient.invalidateQueries({ queryKey: ['lead-pipeline'] });
    },
    onError: () => toast.error('Failed to advance lead'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post(`/api/leads/pipeline/${leadId}/reject`, {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Lead rejected');
      queryClient.invalidateQueries({ queryKey: ['pipeline-stage', stage] });
      queryClient.invalidateQueries({ queryKey: ['lead-pipeline'] });
    },
    onError: () => toast.error('Failed to reject lead'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title={stageLabel}
        subtitle={`${total} lead${total !== 1 ? 's' : ''} at this stage`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Pipeline', href: '/dashboard/leads/pipeline' },
          { label: stageLabel },
        ]}
        className="mb-8"
      />

      <div className="max-w-sm mb-6">
        <SearchInput
          placeholder="Search leads..."
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}

        />
      </div>

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-lg shadow-black/10">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No leads at this stage"
            description={
              search
                ? 'Try adjusting your search.'
                : 'Leads will appear here as they enter this stage.'
            }
            className="border-0 bg-transparent"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-white/[0.03] transition-colors duration-150">
                    <TableCell>
                      <a
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-medium tracking-tight text-foreground hover:text-red-400 transition-colors duration-150"
                      >
                        {lead.name}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.email ?? '\u2014'}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="capitalize">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold tabular-nums ${scoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {stageData?.nextStage && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<ArrowRight className="h-3.5 w-3.5" />}
                            onClick={() => advanceMutation.mutate(lead.id)}
                            isLoading={advanceMutation.isPending}
                          >
                            Advance
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<XCircle className="h-3.5 w-3.5 text-red-400" />}
                          onClick={() => rejectMutation.mutate(lead.id)}
                          isLoading={rejectMutation.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

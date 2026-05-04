'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelpCircle, Plus } from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  FilterBar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@memelli/ui';
import type { FilterConfig, FilterValues } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';
import { WorkspaceLayout } from '../../../../../components/layout/WorkspaceLayout';
import { QuestionDetailPanel } from './question-detail-panel';

interface Question {
  id: string;
  question: string;
  text?: string;
  keyword?: string;
  source?: string;
  score?: number;
  status: string;
  createdAt: string;
}

interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
  perPage: number;
}

const PAGE_SIZE = 25;

const filters: FilterConfig[] = [
  {
    key: 'source',
    label: 'Source',
    type: 'select',
    options: [
      { value: 'google', label: 'Google PAA' },
      { value: 'reddit', label: 'Reddit' },
      { value: 'quora', label: 'Quora' },
      { value: 'manual', label: 'Manual' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'used', label: 'Used' },
    ],
  },
  { key: 'search', label: 'Search', type: 'text' },
];

const statusColor: Record<string, 'success' | 'warning' | 'muted' | 'destructive' | 'primary'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'destructive',
  used: 'primary',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-primary';
}

export default function QuestionsPage() {
  const api = useApi();
  const { openRecord } = useWorkspacePanel();
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const { data, isLoading } = useQuery<QuestionsResponse>({
    queryKey: ['questions', { page, ...filterValues }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PAGE_SIZE),
      });
      if (filterValues.search) params.set('search', filterValues.search);
      if (filterValues.source) params.set('source', filterValues.source);
      if (filterValues.status) params.set('status', filterValues.status);
      // useApi auto-unwraps { success, data } -> data
      // Backend returns { success, data: { items, total, page, perPage } }
      const res = await api.get<any>(`/api/seo/questions?${params}`);
      if (res.error) throw new Error(res.error);
      const d = res.data ?? {};
      const items = d.items ?? (Array.isArray(d) ? d : []);
      return { questions: items, total: d.total ?? items.length, page, perPage: PAGE_SIZE };
    },
  });

  const questions = data?.questions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRowClick = useCallback(
    (question: Question) => {
      openRecord(question.id, 'question', question);
    },
    [openRecord],
  );

  return (
    <WorkspaceLayout
      panelContent={<QuestionDetailPanel />}
      panelWidth="lg"
      panelTitle="Question Details"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Question Discovery"
          subtitle={`${total} question${total !== 1 ? 's' : ''} discovered`}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'SEO', href: '/dashboard/seo' },
            { label: 'Questions' },
          ]}
          actions={
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Import Questions
            </Button>
          }
          className="mb-6"
        />

        <FilterBar
          filters={filters}
          values={filterValues}
          onChange={(v) => { setFilterValues(v); setPage(1); }}
          onClear={() => { setFilterValues({}); setPage(1); }}
          className="mb-5"
        />

        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6" />}
              title="No questions found"
              description="Discover questions from Google PAA, Reddit, and more to build forum threads."
              className="border-0 bg-transparent"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-24">Source</TableHead>
                    <TableHead className="w-20 text-right">Score</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-28">Discovered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer hover:bg-white/[0.04] transition-all duration-200"
                      onClick={() => handleRowClick(q)}
                    >
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{q.text ?? q.question}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{q.source ?? q.keyword ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-semibold tabular-nums ${scoreColor(q.score ?? 0)}`}>
                          {q.score ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[q.status] ?? 'muted'}>
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-3">
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
    </WorkspaceLayout>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  Search,
  Globe,
  Zap,
} from 'lucide-react';
import { Button, Badge, Skeleton, ProgressBar } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';

interface ScoreBreakdown {
  searchVolume: number;
  competition: number;
  relevance: number;
  intentMatch: number;
  freshness: number;
}

interface QuestionDetail {
  id: string;
  question: string;
  text?: string;
  keyword?: string;
  source?: string;
  score?: number;
  status: string;
  breakdown?: ScoreBreakdown;
  relatedKeywords?: string[];
  suggestedCategory?: string;
  estimatedTraffic?: number;
  difficulty?: string;
  createdAt: string;
  cluster?: { id: string; name: string } | null;
}

const breakdownItems: { key: keyof ScoreBreakdown; label: string; icon: React.ReactNode }[] = [
  { key: 'searchVolume', label: 'Search Volume', icon: <Search className="h-3.5 w-3.5" /> },
  { key: 'competition', label: 'Competition', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { key: 'relevance', label: 'Relevance', icon: <Zap className="h-3.5 w-3.5" /> },
  { key: 'intentMatch', label: 'Intent Match', icon: <Globe className="h-3.5 w-3.5" /> },
  { key: 'freshness', label: 'Freshness', icon: <MessageSquare className="h-3.5 w-3.5" /> },
];

function scoreBarColor(value: number): 'primary' | 'green' | 'yellow' | 'red' {
  if (value >= 80) return 'green';
  if (value >= 50) return 'yellow';
  if (value >= 30) return 'red';
  return 'primary';
}

export function QuestionDetailPanel() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedRecord, closeRecord } = useWorkspacePanel();

  const questionId = selectedRecord?.id;

  const { data, isLoading } = useQuery<QuestionDetail | null>({
    queryKey: ['question-detail', questionId],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the question object)
      const res = await api.get<QuestionDetail>(`/api/seo/questions/${questionId}`);
      if (res.error) throw new Error(res.error);
      return res.data ?? null;
    },
    enabled: !!questionId,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/seo/questions/${questionId}/status`, { status: 'approved' });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question-detail', questionId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/seo/questions/${questionId}/status`, { status: 'rejected' });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question-detail', questionId] });
    },
  });

  if (!questionId) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  const q = data;
  if (!q) return <p className="text-sm text-zinc-500">Question not found.</p>;

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 leading-snug">{q.text ?? q.question}</h3>
        <div className="flex items-center gap-2 mt-2">
          {q.source && <Badge variant="primary">{q.source}</Badge>}
          {q.keyword && <Badge variant="default">{q.keyword}</Badge>}
          <Badge variant={q.status === 'approved' || q.status === 'APPROVED' ? 'success' : q.status === 'rejected' || q.status === 'REJECTED' ? 'destructive' : 'default'}>
            {q.status}
          </Badge>
        </div>
      </div>

      {/* Overall score (only if score data exists) */}
      {typeof q.score === 'number' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Overall Score</span>
            <span className={`text-2xl font-bold tabular-nums ${q.score >= 80 ? 'text-emerald-400' : q.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {q.score}
            </span>
          </div>
          <ProgressBar value={q.score} max={100} color={scoreBarColor(q.score)} size="md" />
        </div>
      )}

      {/* Score breakdown (only if breakdown data exists) */}
      {q.breakdown && (
        <div>
          <h4 className="text-sm font-medium text-zinc-300 mb-3">Score Breakdown</h4>
          <div className="space-y-3">
            {breakdownItems.map((item) => {
              const val = q.breakdown?.[item.key] ?? 0;
              return (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-zinc-500">{item.icon}</span>
                  <span className="text-sm text-zinc-400 w-28">{item.label}</span>
                  <div className="flex-1">
                    <ProgressBar value={val} max={100} color={scoreBarColor(val)} size="sm" />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 tabular-nums w-8 text-right">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3">
        {q.cluster && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-500">Cluster</p>
            <p className="text-sm font-semibold text-zinc-100">{q.cluster.name}</p>
          </div>
        )}
        {typeof q.estimatedTraffic === 'number' && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-500">Est. Traffic</p>
            <p className="text-sm font-semibold text-zinc-100">{q.estimatedTraffic}/mo</p>
          </div>
        )}
        {q.difficulty && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-500">Difficulty</p>
            <p className="text-sm font-semibold text-zinc-100">{q.difficulty}</p>
          </div>
        )}
        {q.suggestedCategory && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-500">Category</p>
            <p className="text-sm font-semibold text-zinc-100">{q.suggestedCategory}</p>
          </div>
        )}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-xs text-zinc-500">Discovered</p>
          <p className="text-sm font-semibold text-zinc-100">
            {new Date(q.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Related keywords */}
      {(q.relatedKeywords?.length ?? 0) > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Related Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {q.relatedKeywords!.map((kw) => (
              <Badge key={kw} variant="default">{kw}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending || q.status === 'approved'}
        >
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<XCircle className="h-3.5 w-3.5" />}
          onClick={() => rejectMutation.mutate()}
          disabled={rejectMutation.isPending || q.status === 'rejected'}
        >
          Reject
        </Button>
        <div className="flex-1" />
        <a href={`/dashboard/seo/threads/create?questionId=${q.id}`}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
          >
            Create Thread
          </Button>
        </a>
      </div>
    </div>
  );
}

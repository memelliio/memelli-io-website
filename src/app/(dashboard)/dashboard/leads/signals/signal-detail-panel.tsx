'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Globe,
  Instagram,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Code,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Button,
  StatusBadge,
  Skeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';

interface SignalDetail {
  id: string;
  title: string;
  source: string;
  author: string;
  status: string;
  score: number;
  detectedAt: string;
  rawData?: string;
  enrichmentData?: Record<string, unknown>;
  scoreBreakdown?: { factor: string; weight: number; score: number }[];
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5 text-pink-400" />,
  web: <Globe className="h-5 w-5 text-blue-400" />,
  email: <Mail className="h-5 w-5 text-amber-400" />,
  phone: <Phone className="h-5 w-5 text-emerald-400" />,
  chat: <MessageSquare className="h-5 w-5 text-red-400" />,
};

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function SignalDetailPanel() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedRecord, closeRecord } = useWorkspacePanel();

  const signalId = selectedRecord?.id;

  const { data, isLoading } = useQuery<SignalDetail | null>({
    queryKey: ['signal', signalId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/leads/signals/${signalId}`);
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (!raw) return null;
      // Transform backend LeadSignal shape to frontend SignalDetail shape
      return {
        id: raw.id,
        title: raw.title || raw.content?.slice(0, 60) || 'Signal',
        source: raw.source?.type ?? 'unknown',
        author: raw.authorName ?? 'Unknown',
        status: raw.status,
        score: raw.profile?.score?.totalScore ?? 0,
        detectedAt: raw.detectedAt,
        rawData: typeof raw.rawData === 'string' ? raw.rawData : JSON.stringify(raw.rawData, null, 2),
        enrichmentData: raw.profile?.enrichmentData ?? undefined,
        scoreBreakdown: raw.profile?.score?.factors
          ? Object.entries(raw.profile.score.factors).map(([factor, val]: [string, any]) => ({
              factor,
              weight: 1,
              score: typeof val === 'number' ? val : 0,
            }))
          : undefined,
      } as SignalDetail;
    },
    enabled: !!signalId,
  });

  const qualifyMutation = useMutation({
    mutationFn: async (action: 'qualify' | 'reject') => {
      if (action === 'qualify') {
        // No dedicated qualify endpoint; use PATCH to update status to QUALIFIED
        const res = await api.patch(`/api/leads/signals/${signalId}`, { status: 'QUALIFIED' });
        if (res.error) throw new Error(res.error);
      } else {
        const res = await api.post(`/api/leads/signals/${signalId}/reject`, {});
        if (res.error) throw new Error(res.error);
      }
    },
    onSuccess: (_, action) => {
      toast.success(action === 'qualify' ? 'Signal qualified' : 'Signal rejected');
      queryClient.invalidateQueries({ queryKey: ['signal', signalId] });
      queryClient.invalidateQueries({ queryKey: ['lead-signals'] });
    },
    onError: () => {
      toast.error('Action failed');
    },
  });

  if (!signalId) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const signal = data;
  if (!signal) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        Signal not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
          {SOURCE_ICONS[signal.source.toLowerCase()] ?? <Globe className="h-5 w-5 text-zinc-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-100 truncate">{signal.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="capitalize">{signal.source}</Badge>
            <StatusBadge status={signal.status} />
            <span className={`text-sm font-semibold tabular-nums ${scoreColor(signal.score)}`}>
              Score: {signal.score}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            By {signal.author} &middot; Detected {new Date(signal.detectedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
          onClick={() => qualifyMutation.mutate('qualify')}
          isLoading={qualifyMutation.isPending}
          disabled={signal.status === 'qualified'}
        >
          Qualify
        </Button>
        <Button
          variant="destructive"
          size="sm"
          leftIcon={<XCircle className="h-3.5 w-3.5" />}
          onClick={() => qualifyMutation.mutate('reject')}
          isLoading={qualifyMutation.isPending}
          disabled={signal.status === 'rejected'}
        >
          Reject
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="details">
        <TabList>
          <Tab id="details">Details</Tab>
          <Tab id="raw">Raw Data</Tab>
          <Tab id="scoring">Scoring</Tab>
        </TabList>

        <TabPanels>
          {/* Details */}
          <TabPanel id="details">
            <div className="space-y-4 mt-3">
              {/* Source Attribution */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <h4 className="text-sm font-semibold text-zinc-100 mb-3">Source Attribution</h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Source</span>
                    <span className="text-zinc-100 capitalize">{signal.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Author</span>
                    <span className="text-zinc-100">{signal.author}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Detected</span>
                    <span className="text-zinc-100">
                      {new Date(signal.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enrichment Data */}
              {signal.enrichmentData && Object.keys(signal.enrichmentData).length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h4 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-red-400" />
                    Enrichment Data
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    {Object.entries(signal.enrichmentData).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-zinc-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-100">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Raw Data */}
          <TabPanel id="raw">
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-zinc-500" />
                <h4 className="text-sm font-semibold text-zinc-100">Raw Signal Data</h4>
              </div>
              <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {signal.rawData ?? 'No raw data available.'}
              </pre>
            </div>
          </TabPanel>

          {/* Scoring */}
          <TabPanel id="scoring">
            <div className="mt-3">
              {signal.scoreBreakdown && signal.scoreBreakdown.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-zinc-500" />
                    <h4 className="text-sm font-semibold text-zinc-100">Score Breakdown</h4>
                  </div>
                  {signal.scoreBreakdown.map((item) => (
                    <div
                      key={item.factor}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-100">{item.factor}</span>
                        <span className={`text-sm font-semibold tabular-nums ${scoreColor(item.score)}`}>
                          {item.score}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${Math.min(item.score, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Weight: {item.weight}x</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 py-8 text-center">No score breakdown available.</p>
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

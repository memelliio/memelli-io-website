'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Save,
  Eye,
  Link2,
  Code,
  Clock,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Textarea,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface AiResponse {
  id: string;
  content: string;
  model: string;
  createdAt: string;
}

interface ExpansionEntry {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

interface InternalLink {
  id: string;
  targetThreadId: string;
  targetTitle: string;
  anchorText: string;
}

interface ThreadDetail {
  id: string;
  title: string;
  question: string;
  category: string;
  status: string;
  content: string;
  directAnswer: string;
  views: number;
  ranking: number | null;
  schemaMarkup: string;
  aiResponses: AiResponse[];
  expansionHistory: ExpansionEntry[];
  internalLinks: InternalLink[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  const api = useApi();
  const queryClient = useQueryClient();

  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [editedAnswer, setEditedAnswer] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ThreadDetail>({
    queryKey: ['thread-detail', threadId],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the ThreadDetail object)
      const res = await api.get<ThreadDetail>(`/api/seo/threads/${threadId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = {};
      if (editedContent !== null) body.content = editedContent;
      if (editedAnswer !== null) body.directAnswer = editedAnswer;
      const res = await api.patch(`/api/seo/threads/${threadId}`, body);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] });
      setEditedContent(null);
      setEditedAnswer(null);
    },
  });

  const expandMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/seo/threads/${threadId}/expand`, {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] });
    },
  });

  const thread = data;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-6 w-1/3 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-muted-foreground">Thread not found.</p>
      </div>
    );
  }

  const hasChanges = editedContent !== null || editedAnswer !== null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        title={thread.title}
        subtitle={thread.question}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Threads', href: '/dashboard/seo/threads' },
          { label: thread.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => expandMutation.mutate()}
              disabled={expandMutation.isPending}
            >
              AI Expand
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="h-3.5 w-3.5" />}
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
            >
              Save
            </Button>
          </div>
        }
        className="mb-6"
      />

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Badge variant={thread.status === 'published' ? 'success' : thread.status === 'indexed' ? 'info' : 'muted'}>
          {thread.status}
        </Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> {thread.views} views
        </div>
        {thread.ranking && (
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            Ranking #{thread.ranking}
          </div>
        )}
        <Badge variant="default">{thread.category}</Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Updated {new Date(thread.updatedAt).toLocaleDateString()}
        </div>
      </div>

      <Tabs defaultTab="content">
        <TabList>
          <Tab id="content">Content</Tab>
          <Tab id="ai-responses">AI Responses ({thread.aiResponses.length})</Tab>
          <Tab id="expansion-history">Expansion History ({thread.expansionHistory.length})</Tab>
          <Tab id="internal-links">Internal Links ({thread.internalLinks.length})</Tab>
          <Tab id="schema">Schema</Tab>
        </TabList>
        <TabPanels>
          {/* Content tab */}
          <TabPanel id="content">
            <div className="space-y-6 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Direct Answer</label>
                <Textarea
                  value={editedAnswer ?? thread.directAnswer}
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Thread Content</label>
                <Textarea
                  value={editedContent ?? thread.content}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={16}
                  className="w-full font-mono text-sm"
                />
              </div>
            </div>
          </TabPanel>

          {/* AI Responses */}
          <TabPanel id="ai-responses">
            <div className="space-y-4 mt-4">
              {thread.aiResponses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No AI responses yet.</p>
              ) : (
                thread.aiResponses.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="primary">{r.model}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{r.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabPanel>

          {/* Expansion History */}
          <TabPanel id="expansion-history">
            <div className="space-y-3 mt-4">
              {thread.expansionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No expansions yet.</p>
              ) : (
                thread.expansionHistory.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">{entry.type}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabPanel>

          {/* Internal Links */}
          <TabPanel id="internal-links">
            <div className="space-y-2 mt-4">
              {thread.internalLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No internal links yet.</p>
              ) : (
                thread.internalLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{link.anchorText}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.targetTitle}</p>
                    </div>
                    <Link href={`/dashboard/seo/threads/${link.targetThreadId}`}>
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-red-400 transition-colors duration-150" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </TabPanel>

          {/* Schema */}
          <TabPanel id="schema">
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Schema.org Markup (QAPage)</h3>
              </div>
              <pre className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-xs text-foreground overflow-x-auto font-mono">
                {thread.schemaMarkup || JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'QAPage',
                  mainEntity: {
                    '@type': 'Question',
                    name: thread.question,
                    text: thread.question,
                    answerCount: thread.aiResponses.length,
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: thread.directAnswer,
                    },
                  },
                }, null, 2)}
              </pre>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

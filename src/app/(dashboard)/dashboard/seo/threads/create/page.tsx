'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreateThreadPage() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId');

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [directAnswer, setDirectAnswer] = useState('');
  const [content, setContent] = useState('');

  // Load question data if linked
  useQuery({
    queryKey: ['question-prefill', questionId],
    queryFn: async () => {
      if (!questionId) return null;
      const res = await api.get<{ question: string; keyword?: string; clusterId?: string }>(
        `/api/seo/questions/${questionId}`
      );
      if (res.error) throw new Error(res.error);
      const q = res.data;
      if (q) {
        setQuestion(q.question);
        setTitle(q.question);
        if (q.clusterId) setCategory(q.clusterId);
      }
      return q;
    },
    enabled: !!questionId,
  });

  // Load clusters (used as categories)
  const { data: clustersData } = useQuery<Category[]>({
    queryKey: ['seo-clusters-list'],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the clusters array)
      const res = await api.get<Category[]>('/api/seo/clusters');
      if (res.error) throw new Error(res.error);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const categories = clustersData ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      // Backend expects: title, slug?, keyword?, platform?, clusterId?, articleId?, generate?
      const res = await api.post('/api/seo/threads', {
        title,
        keyword: question || undefined,
        clusterId: category || undefined,
        platform: 'reddit',
        generate: false,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      router.push('/dashboard/seo/threads');
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Use the thread creation endpoint with generate=true
      const res = await api.post<any>('/api/seo/threads', {
        title: title || question,
        keyword: question || undefined,
        clusterId: category || undefined,
        platform: 'reddit',
        generate: true,
      });
      if (res.error) throw new Error(res.error);
      // Backend returns the created thread with introBody and replies
      const thread = res.data;
      if (thread?.introBody) {
        setContent(thread.introBody);
      }
      if (thread?.replies && Array.isArray(thread.replies)) {
        setDirectAnswer(thread.replies.map((r: any) => r.body).join('\n\n'));
      }
    },
  });

  const canSubmit = title.trim() && question.trim() && category;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <PageHeader
        title="Create Thread"
        subtitle="Build a new forum thread from a question"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Threads', href: '/dashboard/seo/threads' },
          { label: 'Create' },
        ]}
        actions={
          <Link href="/dashboard/seo/threads">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Back
            </Button>
          </Link>
        }
        className="mb-6"
      />

      <div className="space-y-6">
        {/* Question + Meta */}
        <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="tracking-tight">Thread Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Question</label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What question does this thread answer?"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Thread Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="SEO-optimized thread title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <Select
                value={category}
                onChange={(v) => setCategory(v)}
                options={[
                  { value: '', label: 'Select category...' },
                  ...categories.map((c) => ({ value: c.slug, label: c.name })),
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Direct Answer */}
        <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="tracking-tight">Direct Answer</CardTitle>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => generateMutation.mutate()}
              disabled={!question.trim() || generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Generating...' : 'AI Generate'}
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              value={directAnswer}
              onChange={(e) => setDirectAnswer(e.target.value)}
              placeholder="Concise, direct answer to the question (appears in featured snippets)"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Extended Content */}
        <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="tracking-tight">Extended Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Full thread content with detailed explanation, examples, and supporting information..."
              rows={12}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/seo/threads">
            <Button variant="secondary" size="md">Cancel</Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Thread'}
          </Button>
        </div>
      </div>
    </div>
  );
}

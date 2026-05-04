'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

interface Article {
  id: string;
  title: string;
  status: string;
  word_count?: number;
  wordCount?: number;
  content?: string;
}

interface Question {
  id: string;
  question: string;
  keyword?: string;
  cluster_name?: string;
  status: string;
  article?: Article;
  article_id?: string;
}

const statusVariant: Record<string, 'muted' | 'warning' | 'primary' | 'success'> = {
  PENDING: 'muted',
  GENERATING: 'warning',
  ARTICLE_DRAFTED: 'primary',
  PUBLISHED: 'success',
};

export default function QuestionDetailPage() {
  const params = useParams();
  const questionId = params.questionId as string;
  const api = useApi();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadQuestion() {
    // useApi auto-unwraps { success, data } -> data (the Question object)
    const res = await api.get<Question>(`/api/seo/questions/${questionId}`);
    if (res.error) { setError(res.error); return null; }
    const q = res.data as Question;
    setQuestion(q);
    return q;
  }

  useEffect(() => {
    loadQuestion().finally(() => setIsLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  useEffect(() => {
    if (question?.status === 'GENERATING') {
      pollRef.current = setInterval(async () => {
        const q = await loadQuestion();
        if (q?.status !== 'GENERATING') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.status]);

  async function generateArticle() {
    setGenerating(true);
    const res = await api.post(`/api/seo/questions/${questionId}/generate`, {});
    if (!res.error) {
      await loadQuestion();
    }
    setGenerating(false);
  }

  if (isLoading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /></div>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!question) return null;

  const article = question.article;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/seo/questions" className="text-sm text-muted-foreground hover:text-foreground block transition-colors duration-150">← Questions</Link>

      <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg leading-snug tracking-tight">{question.question}</CardTitle>
            <Badge variant={statusVariant[question.status] ?? 'muted'} className="shrink-0 capitalize">
              {question.status === 'GENERATING' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
              {question.status.replace('_', ' ').toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Keyword</span>
            <p className="mt-0.5 text-foreground">{question.keyword || '—'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cluster</span>
            <p className="mt-0.5 text-foreground">{question.cluster_name || '—'}</p>
          </div>
        </CardContent>
      </Card>

      {question.status === 'GENERATING' && (
        <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <span className="text-sm text-muted-foreground">Generating article... this may take a minute.</span>
          </CardContent>
        </Card>
      )}

      {!article && question.status !== 'GENERATING' && (
        <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
          <CardContent className="flex items-center justify-between py-6">
            <p className="text-sm text-muted-foreground">No article generated yet.</p>
            <Button onClick={generateArticle} isLoading={generating}>
              {generating ? 'Generating...' : 'Generate Article'}
            </Button>
          </CardContent>
        </Card>
      )}

      {article && (
        <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base tracking-tight">{article.title}</CardTitle>
              <Badge variant={statusVariant[article.status] ?? 'muted'} className="shrink-0 capitalize">
                {article.status.toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{article.wordCount ?? article.word_count ?? 0} words</span>
            </div>
            {article.content && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 max-h-48 overflow-y-auto">
                <p className="text-sm text-foreground line-clamp-6">{article.content.replace(/<[^>]+>/g, '').substring(0, 400)}...</p>
              </div>
            )}
            <Link href={`/dashboard/seo/articles/${article.id}`} className="inline-flex">
              <Button variant="secondary" size="sm">View Full Article</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

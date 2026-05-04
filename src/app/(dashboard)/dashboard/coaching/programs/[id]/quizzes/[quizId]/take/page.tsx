'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useApi } from '../../../../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../../components/ui/button';
import { ProgressBar } from '../../../../../../../../../components/ui/progress-bar';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passMark: number;
}

interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  feedback: {
    question: string;
    yourAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
  }[];
}

export default function QuizTakePage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const api = useApi();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['coaching', 'quiz', quizId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/quizzes/${quizId}`);
      if (res.error) throw new Error(res.error);
      const q = (res.data?.data ?? res.data) as Quiz;
      setAnswers(new Array(q.questions.length).fill(null));
      return q;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<any>(`/api/coaching/quizzes/${quizId}/submit`, {
        enrollmentId: '00000000-0000-0000-0000-000000000000', // preview mode
        answers: answers.map((a) => a ?? 0),
      });
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as QuizResult;
    },
    onSuccess: (data) => setResult(data),
  });

  if (isLoading || !quiz) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const progress = ((currentQ + 1) / quiz.questions.length) * 100;
  const allAnswered = answers.every((a) => a !== null);

  // Result Screen
  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/coaching/programs/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">Quiz Results</h1>
        </div>

        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl py-8 text-center">
          <Trophy
            className={`mx-auto h-16 w-16 ${result.passed ? 'text-primary' : 'text-amber-400'}`}
          />
          <h2 className="mt-4 text-3xl tracking-tight font-semibold text-foreground">{result.score}%</h2>
          <p className={`mt-1 text-sm leading-relaxed ${result.passed ? 'text-primary' : 'text-primary/80'}`}>
            {result.passed ? 'Passed!' : 'Did not pass'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {result.correctCount} of {result.totalQuestions} correct (pass mark: {quiz.passMark}%)
          </p>
        </div>

        {/* Feedback */}
        <div className="space-y-3">
          {result.feedback.map((fb, idx) => (
            <div key={idx} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
              <div className="flex items-start gap-3">
                {fb.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary/80" />
                )}
                <div className="space-y-1">
                  <p className="text-sm tracking-tight font-semibold text-foreground">{fb.question}</p>
                  {!fb.isCorrect && fb.yourAnswer && (
                    <p className="text-xs text-primary/80">Your answer: {fb.yourAnswer}</p>
                  )}
                  <p className="text-xs text-primary">Correct: {fb.correctAnswer}</p>
                  {fb.explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{fb.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200"
            onClick={() => {
              setResult(null);
              setCurrentQ(0);
              setAnswers(new Array(quiz.questions.length).fill(null));
            }}
          >
            Retake Quiz
          </Button>
          <Link href={`/dashboard/coaching/programs/${id}`}>
            <Button variant="outline">Back to Program</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Quiz Taking
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/coaching/programs/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl tracking-tight font-semibold text-foreground">{quiz.title}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Question {currentQ + 1} of {quiz.questions.length}
          </p>
        </div>
      </div>

      <ProgressBar value={progress} color="green" size="sm" />

      <div className="space-y-4 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
        <p className="text-base tracking-tight font-semibold text-foreground">{question.question}</p>

        <div className="space-y-2">
          {question.options.map((opt, oIdx) => (
            <button
              key={oIdx}
              onClick={() => {
                const next = [...answers];
                next[currentQ] = oIdx;
                setAnswers(next);
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                answers[currentQ] === oIdx
                  ? 'border-primary/50 bg-primary/10 text-primary/80'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <span className="mr-2 font-medium text-white/30">
                {String.fromCharCode(65 + oIdx)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
          disabled={currentQ === 0}
        >
          Previous
        </Button>

        <div className="flex gap-1">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQ(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                idx === currentQ
                  ? 'bg-primary/70'
                  : answers[idx] !== null
                  ? 'bg-primary/70/40'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {currentQ < quiz.questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentQ((c) => Math.min(quiz.questions.length - 1, c + 1))}
          >
            Next
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => submitMutation.mutate()}
            disabled={!allAnswered || submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
}

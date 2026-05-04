'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Eye,
  Pencil,
  Copy,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  Toggle,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../../../../../hooks/useApi';

/* ---------- Types ---------- */

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: AnswerOption[];
  correctAnswer: string;
  points: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  passMark: number;
  lessonId?: string;
  shuffleQuestions?: boolean;
  timeLimit?: number | null;
}

/* ---------- Helpers ---------- */

function genId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function optId(): string {
  return `o_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function questionTypeLabel(type: QuestionType): string {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'true_false':
      return 'True / False';
    case 'short_answer':
      return 'Short Answer';
  }
}

function questionTypeBadgeVariant(type: QuestionType) {
  switch (type) {
    case 'multiple_choice':
      return 'default' as const;
    case 'true_false':
      return 'info' as const;
    case 'short_answer':
      return 'warning' as const;
  }
}

function createBlankQuestion(type: QuestionType): Question {
  const id = genId();
  switch (type) {
    case 'multiple_choice':
      return {
        id,
        type,
        text: '',
        options: [
          { id: optId(), text: '', isCorrect: true },
          { id: optId(), text: '', isCorrect: false },
          { id: optId(), text: '', isCorrect: false },
          { id: optId(), text: '', isCorrect: false },
        ],
        correctAnswer: '',
        points: 1,
        explanation: '',
      };
    case 'true_false':
      return {
        id,
        type,
        text: '',
        options: [
          { id: optId(), text: 'True', isCorrect: true },
          { id: optId(), text: 'False', isCorrect: false },
        ],
        correctAnswer: 'True',
        points: 1,
        explanation: '',
      };
    case 'short_answer':
      return {
        id,
        type,
        text: '',
        options: [],
        correctAnswer: '',
        points: 1,
        explanation: '',
      };
  }
}

function totalPoints(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

/* ---------- Normaliser (legacy format -> new format) ---------- */

function normaliseQuiz(raw: any): Quiz {
  const questions: Question[] = (raw.questions ?? []).map((q: any, idx: number) => {
    // Already in new format
    if (q.type && q.options?.[0]?.id) return q as Question;

    // Legacy: { question, options: string[], correctIndex }
    const type: QuestionType =
      q.type ??
      (q.options?.length === 2 &&
        q.options[0] === 'True' &&
        q.options[1] === 'False'
        ? 'true_false'
        : q.options?.[0] === '(Open response)'
          ? 'short_answer'
          : 'multiple_choice');

    const options: AnswerOption[] = (q.options ?? [])
      .filter((o: any) => o !== '(Open response)')
      .map((text: any, oi: number) => ({
        id: optId(),
        text: typeof text === 'string' ? text : text?.text ?? '',
        isCorrect: q.correctIndex != null ? oi === q.correctIndex : text?.isCorrect ?? false,
      }));

    const correctIdx = q.correctIndex ?? options.findIndex((o: AnswerOption) => o.isCorrect);
    const correctAnswer =
      type === 'short_answer'
        ? (q.correctAnswer ?? '')
        : options[correctIdx >= 0 ? correctIdx : 0]?.text ?? '';

    return {
      id: q.id ?? genId(),
      type,
      text: q.text ?? q.question ?? '',
      options,
      correctAnswer,
      points: q.points ?? 1,
      explanation: q.explanation ?? '',
    };
  });

  return {
    id: raw.id,
    title: raw.title ?? '',
    description: raw.description ?? '',
    questions,
    passMark: raw.passMark ?? 70,
    lessonId: raw.lessonId,
    shuffleQuestions: raw.shuffleQuestions ?? false,
    timeLimit: raw.timeLimit ?? null,
  };
}

/* ---------- Serialiser (new format -> API) ---------- */

function serialiseForApi(quiz: {
  title: string;
  description: string;
  passMark: number;
  shuffleQuestions: boolean;
  timeLimit: number | null;
  questions: Question[];
}) {
  return {
    title: quiz.title,
    description: quiz.description,
    passMark: quiz.passMark,
    shuffleQuestions: quiz.shuffleQuestions,
    timeLimit: quiz.timeLimit,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      question: q.text, // backward compat
      options: q.type === 'short_answer' ? ['(Open response)'] : q.options.map((o) => o.text),
      correctIndex: q.options.findIndex((o) => o.isCorrect),
      correctAnswer: q.correctAnswer,
      points: q.points,
      explanation: q.explanation,
    })),
  };
}

/* ================================================================
   PREVIEW MODE COMPONENT
   ================================================================ */

function QuizPreview({
  questions,
  passMark,
  title,
  onExit,
}: {
  questions: Question[];
  passMark: number;
  title: string;
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalPts = totalPoints(questions);

  const results = useMemo(() => {
    if (!submitted) return null;
    let earned = 0;
    const feedback = questions.map((q) => {
      const userAnswer = answers[q.id] ?? '';
      let isCorrect = false;
      if (q.type === 'short_answer') {
        isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      } else {
        const correctOpt = q.options.find((o) => o.isCorrect);
        isCorrect = userAnswer === correctOpt?.text;
      }
      if (isCorrect) earned += q.points;
      return { question: q, userAnswer, isCorrect };
    });
    const pct = totalPts > 0 ? Math.round((earned / totalPts) * 100) : 0;
    return { feedback, earned, totalPts, pct, passed: pct >= passMark };
  }, [submitted, answers, questions, passMark, totalPts]);

  const allAnswered = questions.every((q) => (answers[q.id] ?? '').trim() !== '');

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // Results view
  if (results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Preview Results</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retake
            </Button>
            <Button size="sm" variant="secondary" onClick={onExit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Back to Editor
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-card py-8 text-center backdrop-blur-xl">
          <Trophy
            className={`mx-auto h-14 w-14 ${results.passed ? 'text-primary' : 'text-amber-400'}`}
          />
          <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{results.pct}%</p>
          <Badge variant={results.passed ? 'success' : 'error'} className="mt-2">
            {results.passed ? 'Passed' : 'Did not pass'}
          </Badge>
          <p className="mt-3 text-sm text-white/40">
            {results.earned} / {results.totalPts} points (pass mark: {passMark}%)
          </p>
        </div>

        <div className="space-y-3">
          {results.feedback.map((fb, idx) => (
            <div key={fb.question.id} className="rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
              <div className="flex items-start gap-3">
                {fb.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-white/80">
                    {idx + 1}. {fb.question.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={questionTypeBadgeVariant(fb.question.type)} className="text-[10px]">
                      {questionTypeLabel(fb.question.type)}
                    </Badge>
                    <span className="text-xs text-white/30">{fb.question.points} pt{fb.question.points !== 1 ? 's' : ''}</span>
                  </div>
                  {!fb.isCorrect && fb.userAnswer && (
                    <p className="text-xs text-muted-foreground leading-relaxed">Your answer: {fb.userAnswer}</p>
                  )}
                  <p className="text-xs text-primary">
                    Correct: {fb.question.type === 'short_answer' ? fb.question.correctAnswer : fb.question.options.find((o) => o.isCorrect)?.text}
                  </p>
                  {fb.question.explanation && (
                    <p className="text-xs italic text-white/30">{fb.question.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title} — Preview</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {questions.length} question{questions.length !== 1 ? 's' : ''} &middot; {totalPts} point{totalPts !== 1 ? 's' : ''} &middot; Pass mark: {passMark}%
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={onExit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Back to Editor
        </Button>
      </div>

      {questions.length === 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-card py-12 text-center backdrop-blur-xl">
          <AlertCircle className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">No questions to preview. Add questions first.</p>
        </div>
      )}

      {questions.map((q, idx) => (
        <div key={q.id} className="space-y-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-white/90">
              {idx + 1}. {q.text || '(No question text)'}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={questionTypeBadgeVariant(q.type)} className="text-[10px]">
                {questionTypeLabel(q.type)}
              </Badge>
              <span className="text-xs text-white/30">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {q.type === 'short_answer' ? (
            <Input
              placeholder="Type your answer..."
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          ) : (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.text }))}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    answers[q.id] === opt.text
                      ? 'border-primary/50 bg-primary/10 text-primary/80'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/[0.1]'
                  }`}
                >
                  {opt.text || '(Empty option)'}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
          >
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   QUESTION EDITOR COMPONENT
   ================================================================ */

function QuestionEditor({
  question,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  question: Question;
  index: number;
  onUpdate: (q: Question) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const updateField = <K extends keyof Question>(key: K, value: Question[K]) => {
    onUpdate({ ...question, [key]: value });
  };

  const updateOption = (optionId: string, text: string) => {
    const opts = question.options.map((o) =>
      o.id === optionId ? { ...o, text } : o,
    );
    onUpdate({ ...question, options: opts });
  };

  const setCorrectOption = (optionId: string) => {
    const opts = question.options.map((o) => ({
      ...o,
      isCorrect: o.id === optionId,
    }));
    const correct = opts.find((o) => o.isCorrect);
    onUpdate({ ...question, options: opts, correctAnswer: correct?.text ?? '' });
  };

  const addOption = () => {
    const opts = [...question.options, { id: optId(), text: '', isCorrect: false }];
    onUpdate({ ...question, options: opts });
  };

  const removeOption = (optionId: string) => {
    if (question.options.length <= 2) return;
    const removing = question.options.find((o) => o.id === optionId);
    let opts = question.options.filter((o) => o.id !== optionId);
    // If removing the correct answer, mark the first remaining as correct
    if (removing?.isCorrect && opts.length > 0) {
      opts = opts.map((o, i) => ({ ...o, isCorrect: i === 0 }));
    }
    const correct = opts.find((o) => o.isCorrect);
    onUpdate({ ...question, options: opts, correctAnswer: correct?.text ?? '' });
  };

  const changeType = (newType: string) => {
    const type = newType as QuestionType;
    if (type === question.type) return;
    const blank = createBlankQuestion(type);
    onUpdate({
      ...blank,
      id: question.id,
      text: question.text,
      points: question.points,
      explanation: question.explanation,
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl transition-all duration-200">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <GripVertical className="h-4 w-4 text-white/20" />
          <span className="text-sm font-semibold text-white/60">Question {index + 1}</span>
          <Badge variant={questionTypeBadgeVariant(question.type)} className="text-[10px]">
            {questionTypeLabel(question.type)}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDuplicate}
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-primary/80" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Type + Points row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Select
              label="Question Type"
              size="sm"
              options={[
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'true_false', label: 'True / False' },
                { value: 'short_answer', label: 'Short Answer' },
              ]}
              value={question.type}
              onChange={changeType}
            />
          </div>
          <Input
            label="Points"
            type="number"
            min={0}
            max={100}
            value={String(question.points)}
            onChange={(e) => updateField('points', Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>

        {/* Question text */}
        <Textarea
          label="Question Text"
          placeholder="Enter your question..."
          rows={2}
          autoResize
          maxRows={6}
          value={question.text}
          onChange={(e) => updateField('text', e.target.value)}
        />

        {/* Answer options -- multiple choice */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/40">Answer Options (select the correct one)</p>
            {question.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectOption(opt.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    opt.isCorrect
                      ? 'border-primary bg-primary/80'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                  title={opt.isCorrect ? 'Correct answer' : 'Mark as correct'}
                >
                  {opt.isCorrect && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </button>
                <Input
                  className="flex-1"
                  placeholder="Option text..."
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                />
                {question.options.length > 2 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(opt.id)}
                    title="Remove option"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white/30 hover:text-primary/80" />
                  </Button>
                )}
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={addOption}>
              <Plus className="mr-1 h-3 w-3" /> Add Option
            </Button>
          </div>
        )}

        {/* Answer options -- true / false */}
        {question.type === 'true_false' && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/40">Correct Answer</p>
            {question.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCorrectOption(opt.id)}
                className={`w-full rounded-2xl border px-4 py-2.5 text-left text-sm transition-all ${
                  opt.isCorrect
                    ? 'border-primary/50 bg-primary/10 font-medium text-primary/80'
                    : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/[0.1]'
                }`}
              >
                {opt.isCorrect && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Answer -- short answer */}
        {question.type === 'short_answer' && (
          <Input
            label="Correct Answer"
            placeholder="Expected answer..."
            value={question.correctAnswer}
            onChange={(e) => updateField('correctAnswer', e.target.value)}
            hint="Case-insensitive match when grading"
          />
        )}

        {/* Explanation */}
        <Textarea
          label="Explanation (optional)"
          placeholder="Explain why this is the correct answer..."
          rows={2}
          autoResize
          maxRows={4}
          value={question.explanation}
          onChange={(e) => updateField('explanation', e.target.value)}
        />
      </div>
    </div>
  );
}

/* ================================================================
   LOADING SKELETON
   ================================================================ */

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Skeleton variant="line" width="300px" height="32px" />
      <Skeleton variant="line" width="200px" height="16px" />
      <div className="space-y-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function QuizEditPage() {
  const { id: programId, quizId } = useParams<{ id: string; quizId: string }>();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();

  // Editor state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passMark, setPassMark] = useState(70);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // Fetch quiz
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['coaching', 'quiz', quizId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/quizzes/${quizId}`);
      if (res.error) throw new Error(res.error);
      const raw = res.data?.data ?? res.data;
      return normaliseQuiz(raw);
    },
  });

  // Hydrate form from fetched data
  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description ?? '');
      setPassMark(quiz.passMark);
      setShuffleQuestions(quiz.shuffleQuestions ?? false);
      setQuestions(quiz.questions);
      setHasUnsaved(false);
    }
  }, [quiz]);

  // Mark unsaved on any change after initial load
  const markDirty = useCallback(() => setHasUnsaved(true), []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = serialiseForApi({
        title,
        description,
        passMark,
        shuffleQuestions,
        timeLimit: null,
        questions,
      });
      const res = await api.patch<any>(`/api/coaching/quizzes/${quizId}`, payload);
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      setHasUnsaved(false);
      queryClient.invalidateQueries({ queryKey: ['coaching', 'quiz', quizId] });
    },
  });

  // Question operations
  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, createBlankQuestion(type)]);
    markDirty();
  };

  const updateQuestion = (idx: number, updated: Question) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? updated : q)));
    markDirty();
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  const duplicateQuestion = (idx: number) => {
    setQuestions((prev) => {
      const copy = {
        ...prev[idx]!,
        id: genId(),
        options: prev[idx]!.options.map((o) => ({ ...o, id: optId() })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    markDirty();
  };

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx]!, next[idx]!];
      return next;
    });
    markDirty();
  };

  if (isLoading) {
    return <EditorSkeleton />;
  }

  const total = totalPoints(questions);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Quiz Editor"
        subtitle={title || 'Untitled Quiz'}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaching', href: '/dashboard/coaching' },
          { label: 'Programs', href: '/dashboard/coaching/programs' },
          { label: 'Program', href: `/dashboard/coaching/programs/${programId}` },
          { label: 'Edit Quiz' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {hasUnsaved && (
              <Badge variant="warning" className="mr-1 text-[10px]">Unsaved changes</Badge>
            )}
            <Button
              size="sm"
              variant={mode === 'preview' ? 'secondary' : 'outline'}
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            >
              {mode === 'edit' ? (
                <>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editor
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save Quiz
                </>
              )}
            </Button>
          </div>
        }
      />

      {saveMutation.isError && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-muted-foreground leading-relaxed backdrop-blur-xl">
          Failed to save: {(saveMutation.error as Error)?.message ?? 'Unknown error'}
        </div>
      )}

      {saveMutation.isSuccess && !hasUnsaved && (
        <div className="rounded-2xl border border-primary/20 bg-primary/80/5 px-4 py-3 text-sm text-muted-foreground leading-relaxed backdrop-blur-xl">
          Quiz saved successfully.
        </div>
      )}

      {/* ---------- PREVIEW MODE ---------- */}
      {mode === 'preview' && (
        <QuizPreview
          questions={questions}
          passMark={passMark}
          title={title}
          onExit={() => setMode('edit')}
        />
      )}

      {/* ---------- EDIT MODE ---------- */}
      {mode === 'edit' && (
        <>
          {/* Quiz Settings */}
          <div className="space-y-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl">
            <p className="text-sm font-semibold tracking-tight text-foreground">Quiz Settings</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Quiz Title"
                placeholder="e.g. Module 1 Assessment"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
              />
              <Input
                label="Pass Mark (%)"
                type="number"
                min={0}
                max={100}
                value={String(passMark)}
                onChange={(e) => {
                  setPassMark(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)));
                  markDirty();
                }}
              />
            </div>
            <Textarea
              label="Description (optional)"
              placeholder="Brief instructions or context for this quiz..."
              rows={2}
              autoResize
              maxRows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
            />
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
              <Toggle
                label="Shuffle questions"
                description="Randomise question order for each attempt"
                size="sm"
                checked={shuffleQuestions}
                onChange={(v) => {
                  setShuffleQuestions(v);
                  markDirty();
                }}
              />
              <div className="text-right">
                <p className="text-sm font-medium text-white/80">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-white/30">{total} total point{total !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, idx) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={idx}
              onUpdate={(updated) => updateQuestion(idx, updated)}
              onRemove={() => removeQuestion(idx)}
              onDuplicate={() => duplicateQuestion(idx)}
              onMoveUp={() => moveQuestion(idx, -1)}
              onMoveDown={() => moveQuestion(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === questions.length - 1}
            />
          ))}

          {/* Add Question Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => addQuestion('multiple_choice')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Multiple Choice
            </Button>
            <Button size="sm" variant="secondary" onClick={() => addQuestion('true_false')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> True / False
            </Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion('short_answer')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Short Answer
            </Button>
          </div>

          {questions.length === 0 && (
            <div className="rounded-2xl border border-white/[0.04] bg-card py-12 text-center backdrop-blur-xl">
              <AlertCircle className="mx-auto h-10 w-10 text-white/20" />
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                No questions yet. Use the buttons above to add your first question.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

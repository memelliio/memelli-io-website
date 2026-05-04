'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Sparkles,
  Send,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  Cpu,
  Layers,
  Play,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Clock,
  Zap,
  ImagePlus,
  X,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { useVoiceSession } from '../../../../providers/voice-session';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface Question {
  id: string;
  question: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  options?: string[];
  default?: string;
  department: string;
}

interface TaskIntelligence {
  taskType: string;
  confidence: number;
  departments: string[];
  requiredQuestions: Question[];
  optionalSuggestions: Question[];
  estimatedAgents: number;
  summary: string;
  screenshot_context?: string;
}

interface ExecutionStep {
  id: string;
  order: number;
  department: string;
  action: string;
  description: string;
  agentsNeeded: number;
  estimatedDurationMs: number;
  dependsOn: string[];
}

interface ExecutionPlan {
  id: string;
  command: string;
  taskType: string;
  departments: string[];
  totalAgents: number;
  steps: ExecutionStep[];
  estimatedTotalDurationMs: number;
  createdAt: string;
}

interface DispatchedStep {
  department: string;
  stepId: string;
  action: string;
  eventId?: string;
  assignedAgent?: string | null;
  error?: string;
}

interface ExecuteResult {
  plan: ExecutionPlan;
  dispatched: DispatchedStep[];
  summary: {
    totalSteps: number;
    succeeded: number;
    failed: number;
    totalAgents: number;
    estimatedDurationMs: number;
  };
}

type Phase = 'input' | 'analyzing' | 'questions' | 'planning' | 'plan_review' | 'executing' | 'complete' | 'error';

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const TASK_TYPE_LABELS: Record<string, string> = {
  page_build: 'Page Build',
  api_endpoint: 'API Endpoint',
  ecommerce_site: 'Ecommerce Store',
  crm_operation: 'CRM Operation',
  call: 'Voice Call',
  report: 'Report Generation',
  automation: 'Automation Workflow',
  seo_campaign: 'SEO Campaign',
  coaching_program: 'Coaching Program',
  email_campaign: 'Email Campaign',
  integration: 'Integration Setup',
  data_migration: 'Data Migration'
};

const TASK_TYPE_COLORS: Record<string, string> = {
  page_build: 'text-blue-400',
  api_endpoint: 'text-emerald-400',
  ecommerce_site: 'text-amber-400',
  crm_operation: 'text-red-400',
  call: 'text-cyan-400',
  report: 'text-pink-400',
  automation: 'text-orange-400',
  seo_campaign: 'text-lime-400',
  coaching_program: 'text-indigo-400',
  email_campaign: 'text-rose-400',
  integration: 'text-teal-400',
  data_migration: 'text-yellow-400'
};

const DEPT_COLORS: Record<string, string> = {
  frontend: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  api: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  database: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  commerce: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  crm: 'bg-red-500/20 text-red-300 border-red-500/30',
  voice: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  ai: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  seo: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  coaching: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  auth: 'bg-red-500/20 text-red-300 border-red-500/30',
  navigation: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  queues: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  infra: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
  security: 'bg-red-500/20 text-red-300 border-red-500/30',
  monitoring: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'client-ops': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  deployment: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
};

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] || 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function TaskDialog() {
  const api = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const voiceSession = useVoiceSession();

  // State
  const [command, setCommand] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [intelligence, setIntelligence] = useState<TaskIntelligence | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState(false);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Track whether we should auto-analyze on next render
  const autoAnalyzeRef = useRef(false);

  // Listen for voice commands from the voice session provider
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.command && (phase === 'input' || phase === 'error')) {
        autoAnalyzeRef.current = true;
        setCommand(detail.command);
      }
    };
    window.addEventListener('voice-command', handler);
    return () => window.removeEventListener('voice-command', handler);
  }, [phase]);

  // Send voice response when execution completes
  useEffect(() => {
    if (phase === 'complete' && executeResult) {
      const summary = `Done. ${executeResult.summary.succeeded} of ${executeResult.summary.totalSteps} steps succeeded using ${executeResult.summary.totalAgents} agents.`;
      window.dispatchEvent(
        new CustomEvent('voice-response', { detail: { response: summary } })
      );
    }
  }, [phase, executeResult]);

  // Convert a File (image) to a base64 data URL and store it
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      setScreenshotName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  // Paste handler — detect image content on clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (phase !== 'input' && phase !== 'error') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [phase, handleImageFile]);

  // Drag and drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (phase !== 'input' && phase !== 'error') return;
      setIsDragging(true);
    },
    [phase],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (phase !== 'input' && phase !== 'error') return;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageFile(files[0]);
      }
    },
    [phase, handleImageFile],
  );

  const removeScreenshot = useCallback(() => {
    setScreenshot(null);
    setScreenshotName(null);
  }, []);

  // Pre-fill defaults when intelligence arrives
  useEffect(() => {
    if (!intelligence) return;
    const defaults: Record<string, string> = {};
    for (const q of [...intelligence.requiredQuestions, ...intelligence.optionalSuggestions]) {
      if (q.default) defaults[q.id] = q.default;
    }
    setAnswers(defaults);
  }, [intelligence]);

  /* ---- Actions ---- */

  const handleAnalyze = useCallback(async () => {
    if (!command.trim()) return;
    setPhase('analyzing');
    setError(null);
    setIntelligence(null);
    setPlan(null);
    setExecuteResult(null);

    const body: Record<string, string> = { command: command.trim() };
    if (screenshot) {
      body.screenshot = screenshot;
    }
    const res = await api.post<TaskIntelligence>('/api/admin/agent-tasks/analyze', body);
    if (res.error || !res.data) {
      setError(res.error || 'Failed to analyze command');
      setPhase('error');
      return;
    }
    setIntelligence(res.data);
    setPhase('questions');
  }, [command, api, screenshot]);

  // Auto-analyze when a voice command has been set
  useEffect(() => {
    if (autoAnalyzeRef.current && command.trim()) {
      autoAnalyzeRef.current = false;
      handleAnalyze();
    }
  }, [command, handleAnalyze]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze();
  };

  const handlePlan = useCallback(async () => {
    if (!intelligence) return;

    // Validate required questions
    const unanswered = intelligence.requiredQuestions.filter(
      (q) => !answers[q.id] || answers[q.id].trim() === '',
    );
    if (unanswered.length > 0) {
      setError(`Please answer all required questions (${unanswered.length} remaining)`);
      return;
    }

    setPhase('planning');
    setError(null);

    const res = await api.post<ExecutionPlan>('/api/admin/agent-tasks/plan', {
      command: command.trim(),
      answers
    });
    if (res.error || !res.data) {
      setError(res.error || 'Failed to generate plan');
      setPhase('error');
      return;
    }
    setPlan(res.data);
    setPhase('plan_review');
  }, [intelligence, answers, command, api]);

  const handleExecute = useCallback(async () => {
    setPhase('executing');
    setError(null);

    const res = await api.post<ExecuteResult>('/api/admin/agent-tasks/execute', {
      command: command.trim(),
      answers
    });
    if (res.error || !res.data) {
      setError(res.error || 'Failed to execute');
      setPhase('error');
      return;
    }
    setExecuteResult(res.data);
    setPhase('complete');
  }, [command, answers, api]);

  const handleReset = () => {
    setCommand('');
    setPhase('input');
    setIntelligence(null);
    setAnswers({});
    setShowOptional(false);
    setPlan(null);
    setExecuteResult(null);
    setError(null);
    setScreenshot(null);
    setScreenshotName(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  /* ---- Render helpers ---- */

  const renderQuestion = (q: Question, isRequired: boolean) => (
    <div key={q.id} className="group">
      <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-colors hover:border-[hsl(var(--border))]">
        <div className="mt-0.5 shrink-0">
          <MessageSquare className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-[hsl(var(--foreground))]">{q.question}</p>
            {isRequired && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
                Required
              </span>
            )}
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${getDeptColor(q.department)}`}>
              {q.department}
            </span>
          </div>

          {q.type === 'text' && (
            <input
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          )}

          {q.type === 'select' && q.options && (
            <select
              value={answers[q.id] || ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            >
              <option value="">Select...</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {q.type === 'boolean' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateAnswer(q.id, 'true')}
                className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
                  answers[q.id] === 'true'
                    ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => updateAnswer(q.id, 'false')}
                className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
                  answers[q.id] === 'false'
                    ? 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
              >
                No
              </button>
            </div>
          )}

          {q.type === 'number' && (
            <input
              type="number"
              value={answers[q.id] || ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              placeholder="Enter a number..."
              className="w-full max-w-[200px] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          )}
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  Main Render                                                      */
  /* ================================================================ */

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 overflow-hidden">
      {/* ---- Header Bar ---- */}
      <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 to-red-600/30 border border-blue-500/20">
          <Sparkles className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Agent Intelligence</h2>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Tell the sphere what you need. Agents will ask before they build.</p>
        </div>
        {phase !== 'input' && (
          <button
            onClick={handleReset}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))] transition-colors"
          >
            New Command
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* ---- Phase: Input ---- */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-xl transition-colors ${isDragging ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
        >
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Tell the agents what to do... e.g. &quot;Build me a registration page&quot;"
                disabled={phase !== 'input' && phase !== 'error'}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] pl-4 pr-20 py-3.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50 transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {phase === 'analyzing' && (
                  <LoadingGlobe size="sm" />
                )}
                {/* Voice session status indicator */}
                {voiceSession.isSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      if (voiceSession.sessionState === 'inactive') {
                        voiceSession.activate();
                      } else {
                        voiceSession.deactivate();
                      }
                    }}
                    title={
                      voiceSession.sessionState === 'inactive'
                        ? 'Activate voice session'
                        : voiceSession.sessionState === 'listening'
                          ? 'Voice active - listening'
                          : voiceSession.sessionState === 'processing'
                            ? 'Processing voice command'
                            : 'Voice session active'
                    }
                    className={`rounded-lg p-1 transition-all duration-200 ${
                      voiceSession.sessionState === 'listening'
                        ? 'text-blue-400 bg-blue-500/10 animate-pulse'
                        : voiceSession.sessionState === 'processing'
                          ? 'text-red-400 bg-red-500/10'
                          : voiceSession.isSpeaking
                            ? 'text-green-400 bg-green-500/10'
                            : voiceSession.sessionState !== 'inactive'
                              ? 'text-blue-400 bg-blue-500/10'
                              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    }`}
                  >
                    {voiceSession.sessionState === 'processing' ? (
                      <LoadingGlobe size="sm" />
                    ) : voiceSession.isSpeaking ? (
                      <Volume2 className="h-4 w-4" />
                    ) : voiceSession.sessionState === 'listening' ? (
                      <Mic className="h-4 w-4" />
                    ) : voiceSession.sessionState !== 'inactive' ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
                // Reset so the same file can be re-selected
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={phase !== 'input' && phase !== 'error'}
              title="Attach screenshot or image"
              className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!command.trim() || (phase !== 'input' && phase !== 'error')}
              className="flex h-[50px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 px-5 text-sm font-medium text-[hsl(var(--foreground))] shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
              Analyze
            </button>
          </form>

          {/* Drag overlay hint */}
          {isDragging && (
            <div className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-500/40 bg-blue-500/5 py-6">
              <p className="text-sm text-blue-400">Drop image here</p>
            </div>
          )}

          {/* Screenshot thumbnail preview */}
          {screenshot && (
            <div className="mt-3 flex items-start gap-3">
              <div className="relative group">
                <img
                  src={screenshot}
                  alt={screenshotName || 'Screenshot'}
                  className="h-20 w-auto max-w-[160px] rounded-lg border border-[hsl(var(--border))] object-cover"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:border-red-500/50 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[200px]">{screenshotName || 'Pasted image'}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Will be sent with your command for visual context</p>
              </div>
            </div>
          )}
        </div>

        {/* ---- Phase: Analyzing ---- */}
        {phase === 'analyzing' && (
          <div className="flex items-center justify-center gap-3 py-8 text-[hsl(var(--muted-foreground))]">
            <LoadingGlobe size="sm" />
            <p className="text-sm">Agents are analyzing your command...</p>
          </div>
        )}

        {/* ---- Phase: Error ---- */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ---- Phase: Questions ---- */}
        {(phase === 'questions' || phase === 'planning') && intelligence && (
          <div className="space-y-5">
            {/* Intelligence Summary */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`text-lg font-bold ${TASK_TYPE_COLORS[intelligence.taskType] || 'text-[hsl(var(--foreground))]'}`}>
                  {TASK_TYPE_LABELS[intelligence.taskType] || intelligence.taskType}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded-md">
                  {Math.round(intelligence.confidence * 100)}% confidence
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {intelligence.departments.map((dept) => (
                  <span key={dept} className={`text-[11px] px-2 py-1 rounded border ${getDeptColor(dept)}`}>
                    {dept}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>~{intelligence.estimatedAgents} agents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{intelligence.departments.length} departments</span>
                </div>
              </div>
            </div>

            {/* Required Questions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Required Information ({intelligence.requiredQuestions.length})
              </h3>
              {intelligence.requiredQuestions.map((q) => renderQuestion(q, true))}
            </div>

            {/* Optional Suggestions */}
            {intelligence.optionalSuggestions.length > 0 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {showOptional ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  Optional Enhancements ({intelligence.optionalSuggestions.length})
                </button>
                {showOptional && (
                  <div className="space-y-3">
                    {intelligence.optionalSuggestions.map((q) => renderQuestion(q, false))}
                  </div>
                )}
              </div>
            )}

            {/* Generate Plan Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handlePlan}
                disabled={phase === 'planning'}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 px-6 py-3 text-sm font-medium text-[hsl(var(--foreground))] shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-red-500 disabled:opacity-50 transition-all"
              >
                {phase === 'planning' ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Generate Execution Plan
              </button>
            </div>
          </div>
        )}

        {/* ---- Phase: Plan Review ---- */}
        {(phase === 'plan_review' || phase === 'executing') && plan && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Execution Plan</h3>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    {plan.steps.length} steps across {plan.departments.length} departments
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-semibold text-blue-300">{plan.totalAgents} agents</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-semibold text-amber-300">~{formatDuration(plan.estimatedTotalDurationMs)}</span>
                  </div>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="space-y-2">
                {plan.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded border ${getDeptColor(step.department)}`}>
                          {step.department}
                        </span>
                        <span className="text-xs font-medium text-[hsl(var(--foreground))]">{step.action}</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{step.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                        <span>{step.agentsNeeded} agent{step.agentsNeeded !== 1 ? 's' : ''}</span>
                        <span>~{formatDuration(step.estimatedDurationMs)}</span>
                        {step.dependsOn.length > 0 && (
                          <span>depends on step {plan.steps.findIndex((s) => s.id === step.dependsOn[0]) + 1}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            {phase === 'plan_review' && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setPhase('questions'); setPlan(null); }}
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Back to questions
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  <Play className="h-4 w-4" />
                  Execute — Deploy {plan.totalAgents} Agents
                </button>
              </div>
            )}

            {phase === 'executing' && (
              <div className="flex items-center justify-center gap-3 py-4 text-[hsl(var(--muted-foreground))]">
                <LoadingGlobe size="sm" />
                <p className="text-sm">Dispatching agents to departments...</p>
              </div>
            )}
          </div>
        )}

        {/* ---- Phase: Complete ---- */}
        {phase === 'complete' && executeResult && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-300">Agents Deployed</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-[hsl(var(--background))] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Steps</p>
                  <p className="text-lg font-bold text-[hsl(var(--foreground))]">{executeResult.summary.totalSteps}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--background))] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Succeeded</p>
                  <p className="text-lg font-bold text-emerald-400">{executeResult.summary.succeeded}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--background))] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Agents</p>
                  <p className="text-lg font-bold text-blue-400">{executeResult.summary.totalAgents}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--background))] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Est. Time</p>
                  <p className="text-lg font-bold text-amber-400">{formatDuration(executeResult.summary.estimatedDurationMs)}</p>
                </div>
              </div>
            </div>

            {/* Dispatch results */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Dispatch Log</h3>
              {executeResult.dispatched.map((d, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                    d.error
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                  }`}
                >
                  {d.error ? (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded border ${getDeptColor(d.department)}`}>
                    {d.department}
                  </span>
                  <span className="text-xs text-[hsl(var(--foreground))]">{d.action}</span>
                  {d.assignedAgent && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto font-mono">{d.assignedAgent}</span>
                  )}
                  {d.error && (
                    <span className="text-xs text-red-400 ml-auto">{d.error}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Reset */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-6 py-3 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                New Command
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  FlaskConical,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TestStatus = 'idle' | 'running' | 'pass' | 'fail' | 'error';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  durationMs: number | null;
  details: string | null;
}

interface TestRunResult {
  tests: TestResult[];
  totalDurationMs: number;
  passed: number;
  failed: number;
  errors: number;
}

interface HistoryEntry {
  timestamp: Date;
  result: TestRunResult;
}

/* ------------------------------------------------------------------ */
/*  Test Definitions                                                   */
/* ------------------------------------------------------------------ */

const TEST_DEFINITIONS: { id: string; name: string; description: string }[] = [
  {
    id: 'contact-retrieval',
    name: 'Local Contact Retrieval',
    description: 'Can the system find a known contact in DB and API?',
  },
  {
    id: 'local-vs-production',
    name: 'Local vs Production Comparison',
    description: 'Can the system detect differences automatically?',
  },
  {
    id: 'schema-verification',
    name: 'Schema Verification',
    description: 'Are all required tables present?',
  },
  {
    id: 'self-healing',
    name: 'Self-Healing Detection',
    description: 'Is the health engine active and reporting?',
  },
  {
    id: 'frontend-truth',
    name: 'Frontend Truth',
    description: 'Does the API response match the DB record?',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusIcon(status: TestStatus, className = 'h-5 w-5') {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className={`${className} text-emerald-400`} />;
    case 'fail':
      return <XCircle className={`${className} text-red-400`} />;
    case 'error':
      return <AlertTriangle className={`${className} text-yellow-400`} />;
    case 'running':
      return <Loader2 className={`${className} text-blue-400 animate-spin`} />;
    case 'idle':
    default:
      return <div className={`${className} rounded-full border-2 border-[hsl(var(--border))]`} />;
  }
}

function statusBadge(status: TestStatus) {
  const map: Record<TestStatus, string> = {
    pass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    fail: 'bg-red-500/15 text-red-400 border-red-500/30',
    error: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    idle: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  };
  const labels: Record<TestStatus, string> = {
    pass: 'PASS',
    fail: 'FAIL',
    error: 'ERROR',
    running: 'RUNNING',
    idle: 'PENDING',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${map[status]}`}
    >
      {statusIcon(status, 'h-3.5 w-3.5')}
      {labels[status]}
    </span>
  );
}

type OverallVerdict = 'all-pass' | 'some-fail' | 'critical';

function getVerdict(result: TestRunResult): OverallVerdict {
  if (result.passed === result.tests.length) return 'all-pass';
  if (result.failed >= 3 || result.errors >= 2) return 'critical';
  return 'some-fail';
}

function verdictConfig(verdict: OverallVerdict) {
  switch (verdict) {
    case 'all-pass':
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'ALL TESTS PASS',
        icon: <CheckCircle2 className="h-8 w-8 text-emerald-400" />,
      };
    case 'some-fail':
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        text: 'text-yellow-400',
        label: 'SOME FAILURES',
        icon: <AlertTriangle className="h-8 w-8 text-yellow-400" />,
      };
    case 'critical':
      return {
        bg: 'bg-red-500/10 border-red-500/30',
        text: 'text-red-400',
        label: 'CRITICAL FAILURES',
        icon: <XCircle className="h-8 w-8 text-red-400" />,
      };
  }
}

function formatTimestamp(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AcceptanceTestsPage() {
  const api = useApi();

  const [tests, setTests] = useState<TestResult[]>(
    TEST_DEFINITIONS.map((t) => ({
      ...t,
      status: 'idle' as TestStatus,
      durationMs: null,
      details: null,
    }))
  );
  const [runningAll, setRunningAll] = useState(false);
  const [runningIndividual, setRunningIndividual] = useState<Set<string>>(new Set());
  const [lastRun, setLastRun] = useState<TestRunResult | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [expandedHistory, setExpandedHistory] = useState(false);

  /* ---- Run All Tests ---- */
  const runAllTests = useCallback(async () => {
    setRunningAll(true);
    setTests((prev) =>
      prev.map((t) => ({ ...t, status: 'running' as TestStatus, durationMs: null, details: null }))
    );

    const start = performance.now();
    const res = await api.get<TestRunResult>('/api/admin/acceptance-tests/run');
    const elapsed = Math.round(performance.now() - start);

    if (res.error) {
      // API unreachable — mark all as error
      setTests((prev) =>
        prev.map((t) => ({
          ...t,
          status: 'error' as TestStatus,
          durationMs: null,
          details: res.error,
        }))
      );
      const errorResult: TestRunResult = {
        tests: tests.map((t) => ({ ...t, status: 'error' as TestStatus, details: res.error })),
        totalDurationMs: elapsed,
        passed: 0,
        failed: 0,
        errors: tests.length,
      };
      setLastRun(errorResult);
      setTotalDuration(elapsed);
      setHistory((prev) => [{ timestamp: new Date(), result: errorResult }, ...prev].slice(0, 3));
    } else if (res.data) {
      const data = res.data;
      // Map returned tests to our state, preserving order
      const mapped = TEST_DEFINITIONS.map((def) => {
        const found = data.tests.find((t) => t.id === def.id);
        return found ?? { ...def, status: 'error' as TestStatus, durationMs: null, details: 'Not returned by API' };
      });
      setTests(mapped);
      setLastRun(data);
      setTotalDuration(data.totalDurationMs);
      setHistory((prev) => [{ timestamp: new Date(), result: data }, ...prev].slice(0, 3));
    }

    setRunningAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Run Individual Test ---- */
  const runSingleTest = useCallback(
    async (testId: string) => {
      setRunningIndividual((prev) => new Set(prev).add(testId));
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId ? { ...t, status: 'running' as TestStatus, durationMs: null, details: null } : t
        )
      );

      const res = await api.get<TestResult>(`/api/admin/acceptance-tests/run/${testId}`);

      if (res.error) {
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? { ...t, status: 'error' as TestStatus, durationMs: null, details: res.error }
              : t
          )
        );
      } else if (res.data) {
        setTests((prev) => prev.map((t) => (t.id === testId ? res.data! : t)));
      }

      setRunningIndividual((prev) => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ---- Toggle details ---- */
  const toggleDetails = (testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  /* ---- Auto-run on mount ---- */
  useEffect(() => {
    runAllTests();
  }, [runAllTests]);

  /* ---- Computed ---- */
  const passedCount = tests.filter((t) => t.status === 'pass').length;
  const anyRunning = runningAll || runningIndividual.size > 0;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1200px] px-6 py-8">

        {/* ---- Header ---- */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <FlaskConical className="h-7 w-7 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Acceptance Tests</h1>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                5 mandatory system validation checks
              </p>
            </div>
          </div>

          <button
            onClick={() => runAllTests()}
            disabled={anyRunning}
            className="flex h-11 items-center gap-2.5 rounded-xl bg-red-600 px-6 text-sm font-semibold text-[hsl(var(--foreground))] shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runningAll ? (
              <LoadingGlobe size="sm" />
            ) : (
              <Play className="h-4.5 w-4.5" />
            )}
            {runningAll ? 'Running...' : 'Run All Tests'}
          </button>
        </div>

        {/* ---- Overall Status Banner ---- */}
        {lastRun && !runningAll && (
          <div
            className={`mb-8 flex items-center gap-5 rounded-xl border p-5 ${verdictConfig(getVerdict(lastRun)).bg}`}
          >
            {verdictConfig(getVerdict(lastRun)).icon}
            <div className="flex-1">
              <p className={`text-lg font-bold tracking-wide ${verdictConfig(getVerdict(lastRun)).text}`}>
                {verdictConfig(getVerdict(lastRun)).label}
              </p>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                {lastRun.passed}/{lastRun.tests.length} passed
                {totalDuration !== null && (
                  <span className="ml-3 text-[hsl(var(--muted-foreground))]">
                    <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                    {totalDuration}ms
                  </span>
                )}
              </p>
            </div>
            <Shield className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
          </div>
        )}

        {/* ---- Running Banner ---- */}
        {runningAll && (
          <div className="mb-8 flex items-center gap-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
            <LoadingGlobe size="lg" />
            <div>
              <p className="text-lg font-bold text-blue-400">Running Tests...</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Executing all 5 acceptance tests</p>
            </div>
          </div>
        )}

        {/* ---- Test Cards ---- */}
        <div className="space-y-3 mb-10">
          {tests.map((test, idx) => {
            const isExpanded = expandedTests.has(test.id);
            const isRunning = test.status === 'running';
            const isIndividualRunning = runningIndividual.has(test.id);

            return (
              <div
                key={test.id}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden transition-all"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 p-4">
                  {/* Number */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-xs font-bold text-[hsl(var(--muted-foreground))]">
                    {idx + 1}
                  </span>

                  {/* Status Icon */}
                  <div className="shrink-0">
                    {statusIcon(test.status, 'h-6 w-6')}
                  </div>

                  {/* Name & Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{test.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{test.description}</p>
                  </div>

                  {/* Duration */}
                  {test.durationMs !== null && (
                    <span className="shrink-0 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                      {test.durationMs}ms
                    </span>
                  )}

                  {/* Status Badge */}
                  <div className="shrink-0">{statusBadge(test.status)}</div>

                  {/* Run Individual */}
                  <button
                    onClick={() => runSingleTest(test.id)}
                    disabled={anyRunning}
                    className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={`Run ${test.name}`}
                  >
                    {isIndividualRunning ? (
                      <LoadingGlobe size="sm" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Expand Details */}
                  {test.details && (
                    <button
                      onClick={() => toggleDetails(test.id)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Collapsible Details */}
                {isExpanded && test.details && (
                  <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur px-4 py-3">
                    <pre className="text-xs text-[hsl(var(--muted-foreground))] whitespace-pre-wrap font-mono leading-relaxed">
                      {test.details}
                    </pre>
                  </div>
                )}

                {/* Progress bar for running tests */}
                {isRunning && (
                  <div className="h-0.5 w-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-500 animate-pulse rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- History Section ---- */}
        {history.length > 0 && (
          <section>
            <button
              onClick={() => setExpandedHistory(!expandedHistory)}
              className="flex items-center gap-2 mb-4 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              {expandedHistory ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Clock className="h-4 w-4" />
              Run History ({history.length})
            </button>

            {expandedHistory && (
              <div className="space-y-2">
                {history.map((entry, idx) => {
                  const v = getVerdict(entry.result);
                  const cfg = verdictConfig(v);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3"
                    >
                      <div className="shrink-0">{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {entry.result.passed}/{entry.result.tests.length} passed
                          <span className="ml-2">{entry.result.totalDurationMs}ms</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

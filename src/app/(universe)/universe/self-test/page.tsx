'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Video,
  Activity,
  Zap,
  BarChart3,
  List,
  Eye,
  Loader2,
} from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface TestStepResult {
  stepNumber: number;
  route: string;
  action: string;
  status: 'pass' | 'fail' | 'error' | 'skipped';
  responseTimeMs: number;
  errorMessage: string | null;
  screenshotDescription: string;
  expected: string;
  actual: string;
}

interface FlowTestResult {
  flowName: string;
  status: 'pass' | 'fail' | 'error' | 'skipped';
  steps: TestStepResult[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
  errorCount: number;
}

interface ReportSummary {
  totalFlows: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  totalSteps: number;
  avgResponseMs: number;
}

interface TestReport {
  id: string;
  type: 'full_tour' | 'flow_test' | 'video_tour';
  status: 'pass' | 'fail' | 'error' | 'skipped';
  flows: FlowTestResult[];
  summary: ReportSummary;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

interface HistoryItem {
  id: string;
  type: string;
  status: string;
  summary: ReportSummary;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

interface VideoTourStep {
  stepNumber: number;
  route: string;
  screenTitle: string;
  screenshotDescription: string;
  keyElements: string[];
  interactions: string[];
  expectedState: string;
  notes: string;
}

interface VideoTourDocument {
  id: string;
  section: string;
  generatedAt: string;
  steps: VideoTourStep[];
  summary: string;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('memelli_token') || '';
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

function statusIcon(status: string) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'fail':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    default:
      return <Clock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />;
  }
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    fail: 'bg-red-500/20 text-red-300 border-red-500/30',
    error: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    skipped: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  };
  return (
    <span
      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${colors[status] || colors.skipped}`}
    >
      {status}
    </span>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function SelfTestPage() {
  const [report, setReport] = useState<TestReport | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [availableFlows, setAvailableFlows] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [videoTour, setVideoTour] = useState<VideoTourDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFlow, setLoadingFlow] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [tab, setTab] = useState<'results' | 'history' | 'video'>('results');

  // ── Fetch initial data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [statusData, historyData] = await Promise.all([
        apiFetch('/api/admin/self-test/available'),
        apiFetch('/api/admin/self-test/history'),
      ]);
      if (statusData.flows) setAvailableFlows(statusData.flows);
      if (statusData.sections) setAvailableSections(statusData.sections);
      if (historyData.history) setHistory(historyData.history);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ─────────────────────────────────────────────────────────
  const runFullTour = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/self-test/run', { method: 'POST' });
      if (data.report) {
        setReport(data.report);
        setTab('results');
      }
      await fetchData();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const runFlow = async (name: string) => {
    setLoadingFlow(true);
    try {
      const data = await apiFetch(`/api/admin/self-test/flow/${name}`, { method: 'POST' });
      if (data.report) {
        setReport(data.report);
        setTab('results');
      }
      await fetchData();
    } catch {
      // silent
    } finally {
      setLoadingFlow(false);
    }
  };

  const generateVideoTour = async (section: string) => {
    setLoadingVideo(true);
    try {
      const data = await apiFetch(`/api/admin/self-test/video-tour/${section}`, {
        method: 'POST',
      });
      if (data.tour) {
        setVideoTour(data.tour);
        setTab('video');
      }
    } catch {
      // silent
    } finally {
      setLoadingVideo(false);
    }
  };

  const loadReport = async (id: string) => {
    try {
      const data = await apiFetch(`/api/admin/self-test/report/${id}`);
      if (data.report) {
        setReport(data.report);
        setTab('results');
      }
    } catch {
      // silent
    }
  };

  const toggleFlow = (name: string) => {
    setExpandedFlows((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleStep = (key: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Self-Test Dashboard
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            Automated platform test tours and video walkthroughs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </button>
          <button
            onClick={runFullTour}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition font-medium text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {loading ? 'Running Full Tour...' : 'Run Full Tour'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <SummaryCard
            label="Status"
            value={report.status.toUpperCase()}
            color={report.status === 'pass' ? 'emerald' : report.status === 'fail' ? 'red' : 'amber'}
          />
          <SummaryCard label="Flows" value={report.summary.totalFlows} color="cyan" />
          <SummaryCard label="Passed" value={report.summary.passed} color="emerald" />
          <SummaryCard label="Failed" value={report.summary.failed} color="red" />
          <SummaryCard label="Steps" value={report.summary.totalSteps} color="violet" />
          <SummaryCard
            label="Avg Response"
            value={`${report.summary.avgResponseMs}ms`}
            color="amber"
          />
        </div>
      )}

      {/* Flow Selector + Video Tour Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Run Specific Flow */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Run Specific Flow
          </h3>
          <div className="flex gap-2">
            <select
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
              className="flex-1 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded px-3 py-2 text-sm text-[hsl(var(--foreground))]"
            >
              <option value="">Select a flow...</option>
              {availableFlows.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedFlow && runFlow(selectedFlow)}
              disabled={!selectedFlow || loadingFlow}
              className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
            >
              {loadingFlow ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run
            </button>
          </div>
        </div>

        {/* Generate Video Tour */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
            <Video className="w-4 h-4 text-pink-400" />
            Generate Video Tour
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableSections.map((section) => (
              <button
                key={section}
                onClick={() => generateVideoTour(section)}
                disabled={loadingVideo}
                className="px-3 py-1.5 rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] hover:border-pink-500/50 hover:bg-[hsl(var(--muted))] transition text-xs font-medium text-[hsl(var(--foreground))] capitalize"
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-[hsl(var(--border))]">
        {[
          { key: 'results' as const, label: 'Test Results', icon: BarChart3 },
          { key: 'history' as const, label: 'History', icon: List },
          { key: 'video' as const, label: 'Video Tour', icon: Eye },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === key
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'results' && (
        <div className="space-y-3">
          {!report && (
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-12 text-center">
              <Activity className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
              <p className="text-[hsl(var(--muted-foreground))]">No test results yet. Run a full tour or specific flow to begin.</p>
            </div>
          )}
          {report?.flows.map((flow) => (
            <div key={flow.flowName} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg overflow-hidden">
              {/* Flow Header */}
              <button
                onClick={() => toggleFlow(flow.flowName)}
                className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted))] transition"
              >
                <div className="flex items-center gap-3">
                  {expandedFlows.has(flow.flowName) ? (
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  )}
                  {statusIcon(flow.status)}
                  <span className="font-medium text-sm">{flow.flowName.replace(/_/g, ' ')}</span>
                  {statusBadge(flow.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                  <span>{flow.steps.length} steps</span>
                  <span>{formatDuration(flow.durationMs)}</span>
                  {flow.errorCount > 0 && (
                    <span className="text-red-400">{flow.errorCount} errors</span>
                  )}
                </div>
              </button>

              {/* Flow Steps */}
              {expandedFlows.has(flow.flowName) && (
                <div className="border-t border-[hsl(var(--border))]">
                  {flow.steps.map((step) => {
                    const stepKey = `${flow.flowName}-${step.stepNumber}`;
                    return (
                      <div key={stepKey} className="border-b border-[hsl(var(--border))] last:border-0">
                        <button
                          onClick={() => toggleStep(stepKey)}
                          className="w-full flex items-center justify-between px-6 py-3 hover:bg-[hsl(var(--muted))] transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] w-5">
                              {step.stepNumber}
                            </span>
                            {statusIcon(step.status)}
                            <span className="text-sm text-[hsl(var(--foreground))]">{step.action}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <code className="text-[hsl(var(--muted-foreground))] font-mono">{step.route}</code>
                            <span className="text-[hsl(var(--muted-foreground))]">{step.responseTimeMs}ms</span>
                          </div>
                        </button>

                        {/* Step Details */}
                        {expandedSteps.has(stepKey) && (
                          <div className="px-6 pb-4 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-[hsl(var(--muted))] rounded p-3">
                                <div className="text-[hsl(var(--muted-foreground))] mb-1">Expected</div>
                                <div className="text-[hsl(var(--foreground))]">{step.expected}</div>
                              </div>
                              <div className="bg-[hsl(var(--muted))] rounded p-3">
                                <div className="text-[hsl(var(--muted-foreground))] mb-1">Actual</div>
                                <div className="text-[hsl(var(--foreground))]">{step.actual}</div>
                              </div>
                            </div>
                            {step.errorMessage && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-300">
                                <span className="font-semibold">Error: </span>
                                {step.errorMessage}
                              </div>
                            )}
                            <div className="bg-[hsl(var(--muted))] rounded p-3 text-xs">
                              <div className="text-[hsl(var(--muted-foreground))] mb-1">Screenshot Description</div>
                              <div className="text-[hsl(var(--muted-foreground))] italic">
                                {step.screenshotDescription}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && (
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-12 text-center">
              <List className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
              <p className="text-[hsl(var(--muted-foreground))]">No test history yet.</p>
            </div>
          )}
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => loadReport(item.id)}
              className="w-full flex items-center justify-between bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 hover:bg-[hsl(var(--muted))] transition text-left"
            >
              <div className="flex items-center gap-3">
                {statusIcon(item.status)}
                <div>
                  <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {item.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{relativeTime(item.startedAt)}</div>
                </div>
                {statusBadge(item.status)}
              </div>
              <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span>
                  {item.summary.passed}/{item.summary.totalFlows} passed
                </span>
                <span>{item.summary.totalSteps} steps</span>
                <span>{formatDuration(item.durationMs)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'video' && (
        <div>
          {!videoTour && (
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-12 text-center">
              <Video className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
              <p className="text-[hsl(var(--muted-foreground))]">
                Select a section above to generate a video tour walkthrough.
              </p>
            </div>
          )}
          {videoTour && (
            <div className="space-y-4">
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
                <h3 className="text-lg font-semibold capitalize mb-1">
                  {videoTour.section} Tour
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{videoTour.summary}</p>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  Generated {relativeTime(videoTour.generatedAt)}
                </div>
              </div>

              {videoTour.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-sm font-bold flex-shrink-0">
                      {step.stepNumber}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))]">{step.screenTitle}</h4>
                      <code className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{step.route}</code>
                    </div>
                  </div>

                  {/* Screenshot Description */}
                  <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg p-4 mb-4">
                    <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                      Visual Description
                    </div>
                    <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">
                      {step.screenshotDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Key Elements */}
                    <div className="bg-[hsl(var(--muted))] rounded p-3">
                      <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                        Key Elements
                      </div>
                      <ul className="space-y-1">
                        {step.keyElements.map((el, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                            <div className="w-1 h-1 rounded-full bg-cyan-500" />
                            {el}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Interactions */}
                    <div className="bg-[hsl(var(--muted))] rounded p-3">
                      <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                        Interactions
                      </div>
                      {step.interactions.length > 0 ? (
                        <ul className="space-y-1">
                          {step.interactions.map((int, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                              <div className="w-1 h-1 rounded-full bg-violet-500" />
                              {int}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No interactions for this step</p>
                      )}
                    </div>
                  </div>

                  {/* Expected State + Notes */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Expected State: </span>
                      <span className="text-[hsl(var(--muted-foreground))]">{step.expectedState}</span>
                    </div>
                    {step.notes && (
                      <div className="text-xs">
                        <span className="text-[hsl(var(--muted-foreground))]">Notes: </span>
                        <span className="text-[hsl(var(--muted-foreground))]">{step.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Sub-Components                                                     */
/* ================================================================== */

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-500/30 text-emerald-300',
    red: 'border-red-500/30 text-red-300',
    amber: 'border-amber-500/30 text-amber-300',
    cyan: 'border-cyan-500/30 text-cyan-300',
    violet: 'border-violet-500/30 text-violet-300',
  };
  return (
    <div className={`bg-[hsl(var(--card))] border rounded-lg p-3 ${colorMap[color] || colorMap.cyan}`}>
      <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

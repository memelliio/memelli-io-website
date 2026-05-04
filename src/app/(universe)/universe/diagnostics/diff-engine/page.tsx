'use client';

import { useState, useCallback } from 'react';
import { useApi } from '../../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  GitCompareArrows,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Search,
  Database,
  Globe,
  Server,
  Shield,
  Eye,
  Layers,
  Play,
  FlaskConical,
  PenLine,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SyncStatus = 'IN SYNC' | 'DRIFTED' | 'ERROR';

interface DiffSummary {
  status: SyncStatus;
  environmentMatch: boolean;
  schemaMatch: boolean;
  recordCountsMatch: boolean;
  apiContractsMatch: boolean;
  lastChecked: string;
}

interface EnvComparison {
  key: string;
  local: string;
  production: string;
  match: boolean;
}

interface SchemaTable {
  name: string;
  localStatus: 'present' | 'missing';
  productionStatus: 'present' | 'missing';
}

interface SchemaComparison {
  tables: SchemaTable[];
  summary: { inBoth: number; missingInLocal: number; missingInProduction: number };
}

interface RecordCount {
  table: string;
  localCount: number;
  productionCount: number;
  match: boolean;
}

interface VisibilityLayer {
  name: string;
  status: 'pass' | 'fail';
  responseTime?: number;
  detail?: string;
}

interface CrossReferences {
  dealCount: number;
  activityCount: number;
  enrollmentCount: number;
  smsThreads: number;
  emailThreads: number;
}

interface VisibilityResult {
  contactId: string;
  email: string;
  layers: VisibilityLayer[];
  crossReferences: CrossReferences;
  allPass: boolean;
}

interface SampleResult {
  contactId: string;
  email: string;
  layers: VisibilityLayer[];
  allPass: boolean;
}

interface WriteVerifyStep {
  step: string;
  status: 'pass' | 'fail' | 'pending';
  latency?: number;
}

interface WriteVerifyResult {
  steps: WriteVerifyStep[];
  totalLatency: number;
  allPass: boolean;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

type TabId = 'overview' | 'environment' | 'schema' | 'records' | 'visibility' | 'sample' | 'write-verify';

const TABS: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'overview', label: 'Overview', icon: GitCompareArrows },
  { id: 'environment', label: 'Environment', icon: Globe },
  { id: 'schema', label: 'Schema', icon: Database },
  { id: 'records', label: 'Record Counts', icon: Layers },
  { id: 'visibility', label: 'Visibility Test', icon: Eye },
  { id: 'sample', label: 'Sample Test', icon: FlaskConical },
  { id: 'write-verify', label: 'Write & Verify', icon: PenLine },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusBadge(status: SyncStatus) {
  switch (status) {
    case 'IN SYNC':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'DRIFTED':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'ERROR':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
}

function boolIcon(value: boolean) {
  return value ? (
    <CheckCircle className="h-5 w-5 text-emerald-400" />
  ) : (
    <XCircle className="h-5 w-5 text-red-400" />
  );
}

function layerStatusBadge(status: 'pass' | 'fail') {
  return status === 'pass'
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DiffEnginePage() {
  const api = useApi();

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Overview
  const [summary, setSummary] = useState<DiffSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Environment
  const [envData, setEnvData] = useState<EnvComparison[] | null>(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);

  // Schema
  const [schemaData, setSchemaData] = useState<SchemaComparison | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Record Counts
  const [recordData, setRecordData] = useState<RecordCount[] | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Visibility
  const [visibilityQuery, setVisibilityQuery] = useState('');
  const [visibilityData, setVisibilityData] = useState<VisibilityResult | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  // Sample
  const [sampleData, setSampleData] = useState<SampleResult[] | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  // Write & Verify
  const [writeVerifyData, setWriteVerifyData] = useState<WriteVerifyResult | null>(null);
  const [writeVerifyLoading, setWriteVerifyLoading] = useState(false);
  const [writeVerifyError, setWriteVerifyError] = useState<string | null>(null);

  /* ---- Fetch handlers ---- */

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    const res = await api.get<DiffSummary>('/api/admin/diff/summary');
    if (res.error) setSummaryError(res.error);
    else if (res.data) setSummary(res.data);
    setSummaryLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEnvironment = useCallback(async () => {
    setEnvLoading(true);
    setEnvError(null);
    const res = await api.get<EnvComparison[]>('/api/admin/diff/environment');
    if (res.error) setEnvError(res.error);
    else if (res.data) setEnvData(res.data);
    setEnvLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchema = useCallback(async () => {
    setSchemaLoading(true);
    setSchemaError(null);
    const res = await api.get<SchemaComparison>('/api/admin/diff/schema');
    if (res.error) setSchemaError(res.error);
    else if (res.data) setSchemaData(res.data);
    setSchemaLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecordCounts = useCallback(async () => {
    setRecordLoading(true);
    setRecordError(null);
    const res = await api.get<RecordCount[]>('/api/admin/diff/record-counts');
    if (res.error) setRecordError(res.error);
    else if (res.data) setRecordData(res.data);
    setRecordLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runVisibilityCheck = useCallback(async () => {
    if (!visibilityQuery.trim()) return;
    setVisibilityLoading(true);
    setVisibilityError(null);
    const isEmail = visibilityQuery.includes('@');
    const param = isEmail
      ? `email=${encodeURIComponent(visibilityQuery.trim())}`
      : `contactId=${encodeURIComponent(visibilityQuery.trim())}`;
    const res = await api.get<VisibilityResult>(`/api/admin/visibility/check?${param}`);
    if (res.error) setVisibilityError(res.error);
    else if (res.data) setVisibilityData(res.data);
    setVisibilityLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibilityQuery]);

  const runSampleTest = useCallback(async () => {
    setSampleLoading(true);
    setSampleError(null);
    const res = await api.get<SampleResult[]>('/api/admin/visibility/sample');
    if (res.error) setSampleError(res.error);
    else if (res.data) setSampleData(res.data);
    setSampleLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runWriteVerify = useCallback(async () => {
    setWriteVerifyLoading(true);
    setWriteVerifyError(null);
    const res = await api.post<WriteVerifyResult>('/api/admin/visibility/write-and-verify', {});
    if (res.error) setWriteVerifyError(res.error);
    else if (res.data) setWriteVerifyData(res.data);
    setWriteVerifyLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Shared UI pieces ---- */

  function renderError(error: string, retry: () => void) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={retry}
          className="mt-4 rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  function renderLoading(message: string) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
        <LoadingGlobe size="lg" />
        <p className="mt-3 text-sm">{message}</p>
      </div>
    );
  }

  function renderEmpty(message: string, action: string, onClick: () => void) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
        <GitCompareArrows className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
        <p className="mt-3 text-sm">{message}</p>
        <button
          onClick={onClick}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors"
        >
          <Play className="h-4 w-4" />
          {action}
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ---- Header ---- */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30">
              <GitCompareArrows className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Difference Engine</h1>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">Environment drift detection & visibility verification</p>
            </div>
          </div>
          {summary && (
            <div
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${statusBadge(summary.status)}`}
            >
              {summary.status === 'IN SYNC' && <CheckCircle className="h-4 w-4" />}
              {summary.status === 'DRIFTED' && <AlertTriangle className="h-4 w-4" />}
              {summary.status === 'ERROR' && <XCircle className="h-4 w-4" />}
              {summary.status}
            </div>
          )}
        </div>

        {/* ---- Tab Navigation ---- */}
        <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/*  TAB: Overview                                                    */}
        {/* ================================================================ */}
        {activeTab === 'overview' && (
          <section>
            {summaryLoading && renderLoading('Running diff analysis...')}
            {!summaryLoading && summaryError && renderError(summaryError, fetchSummary)}
            {!summaryLoading && !summaryError && !summary &&
              renderEmpty('No diff analysis has been run yet.', 'Run Diff Analysis', fetchSummary)}
            {!summaryLoading && summary && (
              <div>
                {/* Large status banner */}
                <div
                  className={`mb-6 flex items-center justify-between rounded-xl border p-6 ${
                    summary.status === 'IN SYNC'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : summary.status === 'DRIFTED'
                        ? 'border-yellow-500/30 bg-yellow-500/5'
                        : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {summary.status === 'IN SYNC' && <CheckCircle className="h-10 w-10 text-emerald-400" />}
                    {summary.status === 'DRIFTED' && <AlertTriangle className="h-10 w-10 text-yellow-400" />}
                    {summary.status === 'ERROR' && <XCircle className="h-10 w-10 text-red-400" />}
                    <div>
                      <h2 className="text-xl font-bold">{summary.status}</h2>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {summary.status === 'IN SYNC'
                          ? 'All environments are synchronized.'
                          : summary.status === 'DRIFTED'
                            ? 'One or more environments have drifted.'
                            : 'An error occurred during diff analysis.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fetchSummary}
                    className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Re-run
                  </button>
                </div>

                {/* Match grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Environment Match', value: summary.environmentMatch, icon: Globe },
                    { label: 'Schema Match', value: summary.schemaMatch, icon: Database },
                    { label: 'Record Counts Match', value: summary.recordCountsMatch, icon: Layers },
                    { label: 'API Contracts Match', value: summary.apiContractsMatch, icon: Server },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`rounded-xl border p-5 ${
                          item.value
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-red-500/20 bg-red-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                          {boolIcon(item.value)}
                        </div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{item.label}</p>
                        <p className={`mt-1 text-xs font-medium ${item.value ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.value ? 'PASS' : 'FAIL'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {summary.lastChecked && (
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Clock className="h-3 w-3" />
                    Last checked: {new Date(summary.lastChecked).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/*  TAB: Environment Comparison                                      */}
        {/* ================================================================ */}
        {activeTab === 'environment' && (
          <section>
            {envLoading && renderLoading('Comparing environments...')}
            {!envLoading && envError && renderError(envError, fetchEnvironment)}
            {!envLoading && !envError && !envData &&
              renderEmpty('Environment comparison has not been run.', 'Compare Environments', fetchEnvironment)}
            {!envLoading && envData && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Environment Comparison
                  </h2>
                  <button
                    onClick={fetchEnvironment}
                    className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Variable</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Local</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Production</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {envData.map((row) => (
                        <tr
                          key={row.key}
                          className={`border-b border-[hsl(var(--border))] transition-colors ${
                            row.match ? 'hover:bg-[hsl(var(--muted))]' : 'bg-red-500/5 hover:bg-red-500/10'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium text-[hsl(var(--foreground))]">{row.key}</td>
                          <td className={`px-4 py-3 font-mono text-xs ${row.match ? 'text-[hsl(var(--muted-foreground))]' : 'text-red-400'}`}>
                            {row.local || <span className="text-[hsl(var(--muted-foreground))]">--</span>}
                          </td>
                          <td className={`px-4 py-3 font-mono text-xs ${row.match ? 'text-[hsl(var(--muted-foreground))]' : 'text-red-400'}`}>
                            {row.production || <span className="text-[hsl(var(--muted-foreground))]">--</span>}
                          </td>
                          <td className="px-4 py-3 text-center">{boolIcon(row.match)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    {envData.filter((e) => e.match).length} matched
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-400" />
                    {envData.filter((e) => !e.match).length} mismatched
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/*  TAB: Schema Comparison                                           */}
        {/* ================================================================ */}
        {activeTab === 'schema' && (
          <section>
            {schemaLoading && renderLoading('Comparing schemas...')}
            {!schemaLoading && schemaError && renderError(schemaError, fetchSchema)}
            {!schemaLoading && !schemaError && !schemaData &&
              renderEmpty('Schema comparison has not been run.', 'Compare Schemas', fetchSchema)}
            {!schemaLoading && schemaData && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    Schema Comparison
                  </h2>
                  <button
                    onClick={fetchSchema}
                    className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-compare
                  </button>
                </div>

                {/* Summary cards */}
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{schemaData.summary.inBoth}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Tables in Both</p>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{schemaData.summary.missingInLocal}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Missing in Local</p>
                  </div>
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{schemaData.summary.missingInProduction}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Missing in Production</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Table Name</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Local</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Production</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemaData.tables.map((t) => {
                        const isLocalMissing = t.localStatus === 'missing';
                        const isProdMissing = t.productionStatus === 'missing';
                        return (
                          <tr
                            key={t.name}
                            className={`border-b border-[hsl(var(--border))] transition-colors ${
                              isLocalMissing
                                ? 'bg-red-500/5'
                                : isProdMissing
                                  ? 'bg-yellow-500/5'
                                  : 'hover:bg-[hsl(var(--muted))]'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-xs font-medium text-[hsl(var(--foreground))]">{t.name}</td>
                            <td className="px-4 py-3 text-center">
                              {t.localStatus === 'present' ? (
                                <CheckCircle className="mx-auto h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="mx-auto h-4 w-4 text-red-400" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {t.productionStatus === 'present' ? (
                                <CheckCircle className="mx-auto h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="mx-auto h-4 w-4 text-yellow-400" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/*  TAB: Record Counts                                               */}
        {/* ================================================================ */}
        {activeTab === 'records' && (
          <section>
            {recordLoading && renderLoading('Comparing record counts...')}
            {!recordLoading && recordError && renderError(recordError, fetchRecordCounts)}
            {!recordLoading && !recordError && !recordData &&
              renderEmpty('Record count comparison has not been run.', 'Compare Record Counts', fetchRecordCounts)}
            {!recordLoading && recordData && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-400" />
                    Record Count Comparison
                  </h2>
                  <button
                    onClick={fetchRecordCounts}
                    className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5 text-xs text-blue-300">
                  <AlertCircle className="mr-1.5 inline h-3.5 w-3.5" />
                  Since all environments share the same database, counts should always match.
                </div>

                <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Table</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-right">Local Count</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-right">Production Count</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordData.map((r) => (
                        <tr
                          key={r.table}
                          className={`border-b border-[hsl(var(--border))] transition-colors ${
                            r.match ? 'hover:bg-[hsl(var(--muted))]' : 'bg-red-500/5 hover:bg-red-500/10'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium text-[hsl(var(--foreground))]">{r.table}</td>
                          <td className="px-4 py-3 text-right text-sm text-[hsl(var(--foreground))]">
                            {r.localCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-[hsl(var(--foreground))]">
                            {r.productionCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">{boolIcon(r.match)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    {recordData.filter((r) => r.match).length} matched
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-400" />
                    {recordData.filter((r) => !r.match).length} mismatched
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/*  TAB: Visibility Test                                             */}
        {/* ================================================================ */}
        {activeTab === 'visibility' && (
          <section>
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                Client Visibility Test
              </h2>
              <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
                Verify a contact is visible across all 5 layers of the system.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    placeholder="Contact ID or email address..."
                    value={visibilityQuery}
                    onChange={(e) => setVisibilityQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runVisibilityCheck()}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-colors"
                  />
                </div>
                <button
                  onClick={runVisibilityCheck}
                  disabled={visibilityLoading || !visibilityQuery.trim()}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {visibilityLoading ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Run Visibility Check
                </button>
              </div>
            </div>

            {visibilityLoading && renderLoading('Running 5-layer visibility check...')}
            {!visibilityLoading && visibilityError && renderError(visibilityError, runVisibilityCheck)}
            {!visibilityLoading && visibilityData && (
              <div>
                {/* Overall result */}
                <div
                  className={`mb-6 rounded-xl border p-5 ${
                    visibilityData.allPass
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {visibilityData.allPass ? (
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold">
                        {visibilityData.allPass ? 'ALL LAYERS PASS' : 'VISIBILITY FAILURE'}
                      </h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Contact: {visibilityData.email || visibilityData.contactId}
                      </p>
                      {!visibilityData.allPass && (
                        <p className="mt-1 text-xs text-red-400">
                          Failed layers:{' '}
                          {visibilityData.layers
                            .filter((l) => l.status === 'fail')
                            .map((l) => l.name)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Layer results */}
                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibilityData.layers.map((layer) => (
                    <div
                      key={layer.name}
                      className={`rounded-xl border p-4 ${
                        layer.status === 'pass'
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-red-500/20 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{layer.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${layerStatusBadge(layer.status)}`}
                        >
                          {layer.status === 'pass' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {layer.status.toUpperCase()}
                        </span>
                      </div>
                      {layer.responseTime !== undefined && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Response time: <span className="text-[hsl(var(--foreground))]">{layer.responseTime}ms</span>
                        </p>
                      )}
                      {layer.detail && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{layer.detail}</p>}
                    </div>
                  ))}
                </div>

                {/* Cross-references */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-400" />
                    Cross-References
                  </h3>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                    {[
                      { label: 'Deals', value: visibilityData.crossReferences.dealCount },
                      { label: 'Activities', value: visibilityData.crossReferences.activityCount },
                      { label: 'Enrollments', value: visibilityData.crossReferences.enrollmentCount },
                      { label: 'SMS Threads', value: visibilityData.crossReferences.smsThreads },
                      { label: 'Email Threads', value: visibilityData.crossReferences.emailThreads },
                    ].map((ref) => (
                      <div
                        key={ref.label}
                        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-center"
                      >
                        <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{ref.value}</p>
                        <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mt-1">{ref.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/*  TAB: Sample Visibility Test                                      */}
        {/* ================================================================ */}
        {activeTab === 'sample' && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-blue-400" />
                  Sample Visibility Test
                </h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Test visibility across 5 random contacts from the database.
                </p>
              </div>
              <button
                onClick={runSampleTest}
                disabled={sampleLoading}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {sampleLoading ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Test 5 Random Contacts
              </button>
            </div>

            {sampleLoading && renderLoading('Testing 5 random contacts...')}
            {!sampleLoading && sampleError && renderError(sampleError, runSampleTest)}
            {!sampleLoading && sampleData && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sampleData.map((contact) => (
                  <div
                    key={contact.contactId}
                    className={`rounded-xl border p-5 ${
                      contact.allPass
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{contact.email}</p>
                        <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] truncate">{contact.contactId}</p>
                      </div>
                      {contact.allPass ? (
                        <CheckCircle className="h-6 w-6 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-6 w-6 shrink-0 text-red-400" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {contact.layers.map((layer) => (
                        <div
                          key={layer.name}
                          className="flex items-center justify-between rounded-lg bg-[hsl(var(--background))] px-3 py-1.5"
                        >
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{layer.name}</span>
                          <span
                            className={`text-xs font-medium ${
                              layer.status === 'pass' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {layer.status === 'pass' ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!sampleLoading && !sampleError && !sampleData && (
              <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                <FlaskConical className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                <p className="mt-3 text-sm">Click the button above to test 5 random contacts.</p>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/*  TAB: Write & Verify                                              */}
        {/* ================================================================ */}
        {activeTab === 'write-verify' && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-blue-400" />
                  Write-and-Verify Test
                </h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Write a test record, read it back, verify across all layers, then clean up.
                </p>
              </div>
              <button
                onClick={runWriteVerify}
                disabled={writeVerifyLoading}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {writeVerifyLoading ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Write + Verify Test
              </button>
            </div>

            {writeVerifyLoading && renderLoading('Running write-and-verify test...')}
            {!writeVerifyLoading && writeVerifyError && renderError(writeVerifyError, runWriteVerify)}
            {!writeVerifyLoading && writeVerifyData && (
              <div>
                {/* Overall result */}
                <div
                  className={`mb-6 rounded-xl border p-5 ${
                    writeVerifyData.allPass
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {writeVerifyData.allPass ? (
                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-bold">
                          {writeVerifyData.allPass ? 'ALL STEPS PASSED' : 'TEST FAILED'}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Total latency: <span className="font-medium text-[hsl(var(--foreground))]">{writeVerifyData.totalLatency}ms</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={runWriteVerify}
                      className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Re-run
                    </button>
                  </div>
                </div>

                {/* Step-by-step timeline */}
                <div className="space-y-0">
                  {writeVerifyData.steps.map((step, idx) => (
                    <div key={step.step} className="flex items-start gap-4">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                            step.status === 'pass'
                              ? 'border-emerald-500/30 bg-emerald-500/15'
                              : step.status === 'fail'
                                ? 'border-red-500/30 bg-red-500/15'
                                : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]'
                          }`}
                        >
                          {step.status === 'pass' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                          {step.status === 'fail' && <XCircle className="h-4 w-4 text-red-400" />}
                          {step.status === 'pending' && <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                        </div>
                        {idx < writeVerifyData.steps.length - 1 && (
                          <div className="h-8 w-px bg-[hsl(var(--muted))]" />
                        )}
                      </div>
                      {/* Step content */}
                      <div className="pt-1 pb-4">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{step.step}</p>
                        {step.latency !== undefined && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{step.latency}ms</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!writeVerifyLoading && !writeVerifyError && !writeVerifyData && (
              <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                <PenLine className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                <p className="mt-3 text-sm">Click the button above to run the write-and-verify test.</p>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Terminal,
  Activity,
  Database,
  Server,
  Shield,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Play,
  Hash,
  Globe,
  ArrowUpDown,
  Layers,
  Crosshair,
  FileCheck,
  Pencil,
  Navigation,
  MapPin,
  Mic
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvironmentInfo {
  appName: string;
  environment: string;
  apiTarget: string;
  dbTarget: string;
  schemaVersion: string;
  deploymentId: string;
  commitHash: string;
  uptime: string;
  lastCheck: string;
}

interface DbTruthResult {
  name: string;
  email: string | null;
  phone: string | null;
  table: string;
  lastUpdated: string;
  relatedCounts: Record<string, number>;
}

interface DbTruthResponse {
  results: DbTruthResult[];
  tableCounts: Record<string, number>;
}

interface SchemaIssue {
  type: 'missing_table' | 'extra_table' | 'missing_column';
  table: string;
  column?: string;
}

interface SchemaCheckResult {
  tablesFound: number;
  tablesExpected: number;
  issues: SchemaIssue[];
  tableCounts: { name: string; rows: number }[];
}

interface EndpointHealth {
  path: string;
  status: 'up' | 'down';
  responseTimeMs: number;
  statusCode: number;
}

interface ApiHealthResult {
  endpoints: EndpointHealth[];
  checkedAt: string;
}

interface WriteTestResult {
  writeSuccess: boolean;
  readSuccess: boolean;
  deleteSuccess: boolean;
  totalLatencyMs: number;
}

type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

interface HealthCheck {
  name: string;
  ok: boolean;
}

interface HealthSummary {
  status: HealthStatus;
  checks: HealthCheck[];
  checkedAt: string;
}

interface CrossSurfaceCheck {
  layer: string;
  found: boolean;
  detail: string;
}

interface NavFailureReport {
  route: string;
  menuItem: string;
  httpStatus: number;
  errorType: 'page_not_found' | 'api_error' | 'auth_blocked' | 'render_error';
  timestamp: string;
  userAgent: string;
  environment: 'local' | 'production';
}

interface NavHealthStatus {
  totalFailures: number;
  recentFailures: NavFailureReport[];
  failuresByType: Record<string, number>;
  failuresByRoute: Record<string, number>;
  lastFailureAt: string | null;
}

interface VoiceFailureReport {
  failurePoint: string;
  error: string;
  micPermission: string;
  browserSupport: boolean;
  sessionActive: boolean;
  timestamp: string;
  environment: string;
}

interface VoiceHealthStatus {
  totalFailures: number;
  recentFailures: VoiceFailureReport[];
  failuresByPoint: Record<string, number>;
  lastFailureAt: string | null;
  sttEndpointReachable: boolean;
  ttsEndpointReachable: boolean;
}

interface VoiceDiagnosisCheck {
  name: string;
  ok: boolean;
  detail: string;
}

interface VoiceDiagnosis {
  status: string;
  checks: VoiceDiagnosisCheck[];
  recentFailureCount: number;
  topFailurePoint: string | null;
  diagnosedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return iso;
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        ok ? 'bg-emerald-400' : 'bg-red-400'
      }`}
    />
  );
}

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle className="h-5 w-5 text-emerald-400" />
  ) : (
    <XCircle className="h-5 w-5 text-red-400" />
  );
}

function Panel({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  actions
}: {
  icon: React.ComponentType<any>;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-blue-400" />
        {title}
      </h2>
      {actions}
    </div>
  );
}

function Spinner() {
  return <LoadingGlobe size="sm" />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DiagnosticsPage() {
  const api = useApi();

  /* ---- Health Summary (Section 6 — rendered at top) ---- */
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const fetchHealthSummary = useCallback(async () => {
    const res = await api.get<HealthSummary>('/api/admin/diagnostics/health-summary');
    if (res.data) setHealthSummary(res.data);
    setHealthLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHealthSummary();
    const iv = setInterval(fetchHealthSummary, 30_000);
    return () => clearInterval(iv);
  }, [fetchHealthSummary]);

  /* ---- 1. Environment Identity ---- */
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [envLoading, setEnvLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get<EnvironmentInfo>('/api/admin/diagnostics/environment');
      if (res.data) setEnvInfo(res.data);
      setEnvLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- 2. DB Truth Search ---- */
  const [dbSearch, setDbSearch] = useState('');
  const [dbResults, setDbResults] = useState<DbTruthResponse | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  const searchDbTruth = async () => {
    if (!dbSearch.trim()) return;
    setDbLoading(true);
    const res = await api.get<DbTruthResponse>(
      `/api/admin/diagnostics/db-truth?search=${encodeURIComponent(dbSearch.trim())}`
    );
    if (res.data) setDbResults(res.data);
    setDbLoading(false);
  };

  /* ---- 3. Schema Check ---- */
  const [schemaResult, setSchemaResult] = useState<SchemaCheckResult | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaSortAsc, setSchemaSortAsc] = useState(true);

  const runSchemaCheck = async () => {
    setSchemaLoading(true);
    const res = await api.get<SchemaCheckResult>('/api/admin/diagnostics/schema-check');
    if (res.data) setSchemaResult(res.data);
    setSchemaLoading(false);
  };

  /* ---- 4. API Health ---- */
  const [apiHealth, setApiHealth] = useState<ApiHealthResult | null>(null);
  const [apiHealthLoading, setApiHealthLoading] = useState(true);

  const fetchApiHealth = useCallback(async () => {
    const res = await api.get<ApiHealthResult>('/api/admin/diagnostics/api-health');
    if (res.data) setApiHealth(res.data);
    setApiHealthLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchApiHealth();
  }, [fetchApiHealth]);

  /* ---- 5. Write Test ---- */
  const [writeResult, setWriteResult] = useState<WriteTestResult | null>(null);
  const [writeLoading, setWriteLoading] = useState(false);

  const runWriteTest = async () => {
    setWriteLoading(true);
    const res = await api.post<WriteTestResult>('/api/admin/diagnostics/write-test', {});
    if (res.data) setWriteResult(res.data);
    setWriteLoading(false);
  };

  /* ---- 7. Cross-Surface Verification ---- */
  const [crossInput, setCrossInput] = useState('');
  const [crossResults, setCrossResults] = useState<CrossSurfaceCheck[] | null>(null);
  const [crossLoading, setCrossLoading] = useState(false);

  const runCrossSurface = async () => {
    if (!crossInput.trim()) return;
    setCrossLoading(true);
    const res = await api.get<CrossSurfaceCheck[]>(
      `/api/admin/diagnostics/cross-surface?query=${encodeURIComponent(crossInput.trim())}`
    );
    if (res.data) setCrossResults(res.data);
    setCrossLoading(false);
  };

  /* ---- 8. Navigation Health ---- */
  const [navHealth, setNavHealth] = useState<NavHealthStatus | null>(null);
  const [navHealthLoading, setNavHealthLoading] = useState(true);

  const fetchNavHealth = useCallback(async () => {
    const res = await api.get<NavHealthStatus>('/api/admin/nav-health/status');
    if (res.data) setNavHealth(res.data);
    setNavHealthLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNavHealth();
    const iv = setInterval(fetchNavHealth, 30_000);
    return () => clearInterval(iv);
  }, [fetchNavHealth]);

  /* ---- 9. Voice Health ---- */
  const [voiceHealth, setVoiceHealth] = useState<VoiceHealthStatus | null>(null);
  const [voiceHealthLoading, setVoiceHealthLoading] = useState(true);
  const [voiceDiagnosis, setVoiceDiagnosis] = useState<VoiceDiagnosis | null>(null);
  const [voiceDiagLoading, setVoiceDiagLoading] = useState(false);

  const fetchVoiceHealth = useCallback(async () => {
    const res = await api.get<VoiceHealthStatus>('/api/admin/voice-health/status');
    if (res.data) setVoiceHealth(res.data);
    setVoiceHealthLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runVoiceDiagnosis = async () => {
    setVoiceDiagLoading(true);
    const res = await api.get<VoiceDiagnosis>('/api/admin/voice-health/diagnose');
    if (res.data) setVoiceDiagnosis(res.data);
    setVoiceDiagLoading(false);
  };

  useEffect(() => {
    fetchVoiceHealth();
    const iv = setInterval(fetchVoiceHealth, 30_000);
    return () => clearInterval(iv);
  }, [fetchVoiceHealth]);

  /* ---- Sorted table counts for schema section ---- */
  const sortedTableCounts = schemaResult
    ? [...schemaResult.tableCounts].sort((a, b) =>
        schemaSortAsc ? a.rows - b.rows : b.rows - a.rows
      )
    : [];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const healthStatusColor: Record<HealthStatus, string> = {
    HEALTHY: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    DEGRADED: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/30'
  };

  const healthDotColor: Record<HealthStatus, string> = {
    HEALTHY: 'bg-emerald-400',
    DEGRADED: 'bg-yellow-400',
    CRITICAL: 'bg-red-400'
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* ====== Page Header ====== */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30">
              <Terminal className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Diagnostic Terminal
              </h1>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                Verify system truth across all layers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <Clock className="h-3.5 w-3.5" />
            Auto-refresh every 30s
          </div>
        </div>

        {/* ====== 6. Health Summary (top) ====== */}
        <section className="mb-8">
          <Panel>
            {healthLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : healthSummary ? (
              <>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className={`h-5 w-5 rounded-full animate-pulse ${
                        healthDotColor[healthSummary.status]
                      }`}
                    />
                    <span
                      className={`rounded-lg border px-4 py-2 text-xl font-bold tracking-wider ${
                        healthStatusColor[healthSummary.status]
                      }`}
                    >
                      {healthSummary.status}
                    </span>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Checked: {formatTime(healthSummary.checkedAt)}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {healthSummary.checks.map((c) => (
                    <span
                      key={c.name}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        c.ok
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-red-500/10 text-red-400 border-red-500/25'
                      }`}
                    >
                      <StatusDot ok={c.ok} />
                      {c.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState text="Unable to fetch health summary" />
            )}
          </Panel>
        </section>

        {/* ====== Two-Column Grid ====== */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ---- 1. Environment Identity ---- */}
          <Panel>
            <PanelHeader icon={Globe} title="Environment Identity" />
            {envLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : envInfo ? (
              <div className="space-y-2">
                {[
                  ['App Name', envInfo.appName],
                  ['Environment', envInfo.environment],
                  ['API Target', envInfo.apiTarget],
                  ['DB Target', envInfo.dbTarget],
                  ['Schema Version', envInfo.schemaVersion],
                  ['Deployment ID', envInfo.deploymentId],
                  ['Commit Hash', envInfo.commitHash],
                  ['Uptime', envInfo.uptime],
                  ['Last Check', formatTime(envInfo.lastCheck)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      {label}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        label === 'Environment'
                          ? value === 'production'
                            ? 'text-emerald-400'
                            : 'text-yellow-400'
                          : 'text-[hsl(var(--foreground))]'
                      } ${
                        label === 'Commit Hash' || label === 'Deployment ID'
                          ? 'font-mono'
                          : ''
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Unable to fetch environment info" />
            )}
          </Panel>

          {/* ---- 4. API Health ---- */}
          <Panel>
            <PanelHeader
              icon={Activity}
              title="API Health"
              actions={
                <button
                  onClick={() => {
                    setApiHealthLoading(true);
                    fetchApiHealth();
                  }}
                  disabled={apiHealthLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${apiHealthLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              }
            />
            {apiHealthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : apiHealth ? (
              <div className="space-y-2">
                {apiHealth.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          ep.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-xs font-mono text-[hsl(var(--foreground))]">
                        {ep.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {ep.responseTimeMs}ms
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          ep.status === 'up'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {ep.statusCode}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-1 text-right text-[11px] text-[hsl(var(--muted-foreground))]">
                  Checked: {formatTime(apiHealth.checkedAt)}
                </div>
              </div>
            ) : (
              <EmptyState text="Unable to fetch API health" />
            )}
          </Panel>
        </div>

        {/* ====== 2. Database Truth Search (full width) ====== */}
        <section className="mt-6">
          <Panel>
            <PanelHeader icon={Database} title="Database Truth Search" />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchDbTruth()}
                  placeholder="Search by name, email, phone, or ID..."
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                />
              </div>
              <button
                onClick={searchDbTruth}
                disabled={dbLoading || !dbSearch.trim()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dbLoading ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </div>

            {dbResults && (
              <div className="mt-5">
                {/* Table Counts Grid */}
                {dbResults.tableCounts &&
                  Object.keys(dbResults.tableCounts).length > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Table Counts
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {Object.entries(dbResults.tableCounts).map(
                          ([table, count]) => (
                            <div
                              key={table}
                              className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-center"
                            >
                              <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                {table}
                              </p>
                              <p className="mt-1 text-lg font-bold text-[hsl(var(--foreground))]">
                                {(count as number).toLocaleString()}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Result Cards */}
                {dbResults.results.length === 0 ? (
                  <EmptyState text="No records found" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dbResults.results.map((r, i) => (
                      <div
                        key={`${r.table}-${i}`}
                        className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                            {r.name}
                          </p>
                          <span className="rounded-md bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                            {r.table}
                          </span>
                        </div>
                        {r.email && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.email}</p>
                        )}
                        {r.phone && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.phone}</p>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                          <Clock className="h-3 w-3" />
                          {formatTime(r.lastUpdated)}
                        </div>
                        {Object.keys(r.relatedCounts).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(r.relatedCounts).map(
                              ([rel, cnt]) => (
                                <span
                                  key={rel}
                                  className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
                                >
                                  {rel}: {cnt}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </section>

        {/* ====== Two-column: Schema + Write Test ====== */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* ---- 3. Schema Verification ---- */}
          <Panel>
            <PanelHeader
              icon={Layers}
              title="Schema Verification"
              actions={
                <button
                  onClick={runSchemaCheck}
                  disabled={schemaLoading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {schemaLoading ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <FileCheck className="h-3.5 w-3.5" />
                  )}
                  Run Schema Check
                </button>
              }
            />

            {schemaResult ? (
              <>
                {/* Summary */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Found
                    </p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">
                      {schemaResult.tablesFound}
                    </p>
                  </div>
                  <span className="text-[hsl(var(--muted-foreground))]">/</span>
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Expected
                    </p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">
                      {schemaResult.tablesExpected}
                    </p>
                  </div>
                  {schemaResult.tablesFound === schemaResult.tablesExpected && (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  )}
                </div>

                {/* Issues */}
                {schemaResult.issues.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {schemaResult.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                          issue.type === 'extra_table'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {issue.type === 'extra_table' ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                          {issue.type === 'missing_table' &&
                            `Missing table: ${issue.table}`}
                          {issue.type === 'extra_table' &&
                            `Extra table: ${issue.table}`}
                          {issue.type === 'missing_column' &&
                            `Missing column: ${issue.table}.${issue.column}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {schemaResult.issues.length === 0 && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Schema is intact -- no issues detected
                  </div>
                )}

                {/* Table row counts */}
                {sortedTableCounts.length > 0 && (
                  <div>
                    <button
                      onClick={() => setSchemaSortAsc(!schemaSortAsc)}
                      className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      <ArrowUpDown className="h-3 w-3" />
                      Table Row Counts (
                      {schemaSortAsc ? 'asc' : 'desc'})
                    </button>
                    <div className="max-h-[240px] overflow-y-auto space-y-1 scrollbar-thin">
                      {sortedTableCounts.map((t) => (
                        <div
                          key={t.name}
                          className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-1.5"
                        >
                          <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                            {t.name}
                          </span>
                          <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                            {t.rows.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState text="Click 'Run Schema Check' to verify" />
            )}
          </Panel>

          {/* ---- 5. Write Test ---- */}
          <Panel>
            <PanelHeader
              icon={Pencil}
              title="Write Test"
              actions={
                <button
                  onClick={runWriteTest}
                  disabled={writeLoading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {writeLoading ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Run Write Test
                </button>
              }
            />

            {writeResult ? (
              <div className="space-y-3">
                {[
                  { label: 'Write', ok: writeResult.writeSuccess },
                  { label: 'Read-back', ok: writeResult.readSuccess },
                  { label: 'Delete', ok: writeResult.deleteSuccess },
                ].map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <BoolIcon value={step.ok} />
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {step.label}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        step.ok ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {step.ok ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                      Total Latency
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                    {writeResult.totalLatencyMs}ms
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState text="Click 'Run Write Test' to verify write path" />
            )}
          </Panel>
        </div>

        {/* ====== 7. Cross-Surface Verification (full width) ====== */}
        <section className="mt-6">
          <Panel>
            <PanelHeader icon={Crosshair} title="Cross-Surface Verification" />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={crossInput}
                  onChange={(e) => setCrossInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runCrossSurface()}
                  placeholder="Enter a contact ID or email..."
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                />
              </div>
              <button
                onClick={runCrossSurface}
                disabled={crossLoading || !crossInput.trim()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {crossLoading ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Verify
              </button>
            </div>

            {crossResults && (
              <div className="mt-5 space-y-2">
                {crossResults.map((c) => (
                  <div
                    key={c.layer}
                    className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <BoolIcon value={c.found} />
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {c.layer}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.detail}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                        c.found
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {c.found ? 'FOUND' : 'NOT FOUND'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>

        {/* ====== 8. Navigation Health Monitor (full width) ====== */}
        <section className="mt-6">
          <Panel>
            <PanelHeader
              icon={Navigation}
              title="Navigation Health"
              actions={
                <button
                  onClick={() => {
                    setNavHealthLoading(true);
                    fetchNavHealth();
                  }}
                  disabled={navHealthLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${navHealthLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              }
            />

            {navHealthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : navHealth ? (
              <>
                {/* Summary stats */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Total Failures
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        navHealth.totalFailures === 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {navHealth.totalFailures}
                    </p>
                  </div>
                  {Object.entries(navHealth.failuresByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          {type.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-yellow-400">
                          {count}
                        </p>
                      </div>
                    ),
                  )}
                </div>

                {/* Failures by route */}
                {Object.keys(navHealth.failuresByRoute).length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Failures by Route
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(navHealth.failuresByRoute)
                        .sort(([, a], [, b]) => b - a)
                        .map(([route, count]) => (
                          <div
                            key={route}
                            className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-red-400" />
                              <span className="text-xs font-mono text-[hsl(var(--foreground))]">
                                {route}
                              </span>
                            </div>
                            <span className="rounded-md bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                              {count} failure{count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent failures list */}
                {navHealth.recentFailures.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Recent Failures (last 20)
                    </p>
                    <div className="max-h-[300px] overflow-y-auto space-y-1.5 scrollbar-thin">
                      {navHealth.recentFailures.map((f, idx) => (
                        <div
                          key={`${f.route}-${f.timestamp}-${idx}`}
                          className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                f.errorType === 'page_not_found'
                                  ? 'bg-yellow-400'
                                  : f.errorType === 'render_error'
                                    ? 'bg-red-400'
                                    : f.errorType === 'auth_blocked'
                                      ? 'bg-orange-400'
                                      : 'bg-blue-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="block text-xs font-mono text-[hsl(var(--foreground))] truncate">
                                {f.route}
                              </span>
                              <span className="block text-[10px] text-[hsl(var(--muted-foreground))]">
                                {f.menuItem} &middot;{' '}
                                {formatTime(f.timestamp)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                f.httpStatus === 404
                                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                  : f.httpStatus >= 500
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                    : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {f.httpStatus}
                            </span>
                            <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                              {f.errorType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    No navigation failures detected
                  </div>
                )}

                {navHealth.lastFailureAt && (
                  <div className="pt-2 text-right text-[11px] text-[hsl(var(--muted-foreground))]">
                    Last failure: {formatTime(navHealth.lastFailureAt)}
                  </div>
                )}
              </>
            ) : (
              <EmptyState text="Unable to fetch navigation health data" />
            )}
          </Panel>
        </section>

        {/* ====== 9. Voice Health Monitor (full width) ====== */}
        <section className="mt-6">
          <Panel>
            <PanelHeader
              icon={Mic}
              title="Voice Health"
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={runVoiceDiagnosis}
                    disabled={voiceDiagLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {voiceDiagLoading ? (
                      <LoadingGlobe size="sm" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    Diagnose
                  </button>
                  <button
                    onClick={() => {
                      setVoiceHealthLoading(true);
                      fetchVoiceHealth();
                    }}
                    disabled={voiceHealthLoading}
                    className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${voiceHealthLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </button>
                </div>
              }
            />

            {voiceHealthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : voiceHealth ? (
              <>
                {/* Endpoint status + summary stats */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      STT Endpoint
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <StatusDot ok={voiceHealth.sttEndpointReachable} />
                      <span
                        className={`text-xs font-semibold ${
                          voiceHealth.sttEndpointReachable
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {voiceHealth.sttEndpointReachable ? 'REACHABLE' : 'UNREACHABLE'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      TTS Endpoint
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <StatusDot ok={voiceHealth.ttsEndpointReachable} />
                      <span
                        className={`text-xs font-semibold ${
                          voiceHealth.ttsEndpointReachable
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {voiceHealth.ttsEndpointReachable ? 'REACHABLE' : 'UNREACHABLE'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Total Failures
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        voiceHealth.totalFailures === 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {voiceHealth.totalFailures}
                    </p>
                  </div>
                  {Object.entries(voiceHealth.failuresByPoint).map(
                    ([point, count]) => (
                      <div
                        key={point}
                        className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-center"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          {point.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-yellow-400">
                          {count}
                        </p>
                      </div>
                    ),
                  )}
                </div>

                {/* Diagnosis results (if run) */}
                {voiceDiagnosis && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Diagnosis
                    </p>
                    <div className="space-y-1.5">
                      {voiceDiagnosis.checks.map((c) => (
                        <div
                          key={c.name}
                          className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <BoolIcon value={c.ok} />
                            <div>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                {c.name}
                              </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.detail}</p>
                            </div>
                          </div>
                          <span
                            className={`rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                              c.ok
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}
                          >
                            {c.ok ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {voiceDiagnosis.topFailurePoint && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Top failure point: {voiceDiagnosis.topFailurePoint.replace(/_/g, ' ')}
                      </div>
                    )}
                    <div className="pt-1 text-right text-[11px] text-[hsl(var(--muted-foreground))]">
                      Diagnosed: {formatTime(voiceDiagnosis.diagnosedAt)}
                    </div>
                  </div>
                )}

                {/* Recent failures list */}
                {voiceHealth.recentFailures.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Recent Voice Failures (last 10)
                    </p>
                    <div className="max-h-[300px] overflow-y-auto space-y-1.5 scrollbar-thin">
                      {voiceHealth.recentFailures.map((f, idx) => (
                        <div
                          key={`${f.failurePoint}-${f.timestamp}-${idx}`}
                          className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                f.failurePoint.includes('mic')
                                  ? 'bg-orange-400'
                                  : f.failurePoint.includes('stt')
                                    ? 'bg-blue-400'
                                    : f.failurePoint.includes('tts')
                                      ? 'bg-red-400'
                                      : 'bg-red-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="block text-xs font-mono text-[hsl(var(--foreground))] truncate">
                                {f.failurePoint.replace(/_/g, ' ')}
                              </span>
                              <span className="block text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                                {f.error}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                              mic: {f.micPermission}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {formatTime(f.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    No voice failures detected
                  </div>
                )}

                {voiceHealth.lastFailureAt && (
                  <div className="pt-2 text-right text-[11px] text-[hsl(var(--muted-foreground))]">
                    Last failure: {formatTime(voiceHealth.lastFailureAt)}
                  </div>
                )}
              </>
            ) : (
              <EmptyState text="Unable to fetch voice health data" />
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}

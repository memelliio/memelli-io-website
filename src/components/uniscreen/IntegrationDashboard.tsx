"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Wifi,
  WifiOff,
  X,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IntegrationType = "DATA" | "COMMUNICATION" | "DOCUMENT" | "FINANCIAL" | "PLATFORM";
type AuthMethod = "API_KEY" | "OAUTH" | "SERVICE_ACCOUNT" | "BASIC_AUTH";
type IntegrationStatus = "ACTIVE" | "INACTIVE" | "ERROR" | "RATE_LIMITED";

interface RateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
}

interface Integration {
  integrationId: string;
  tenantId: string;
  integrationType: IntegrationType;
  providerName: string;
  authMethod: AuthMethod;
  config: Record<string, any>;
  status: IntegrationStatus;
  rateLimits: RateLimits;
  lastUsedAt: string | null;
  errorCount: number;
  createdAt: string;
}

interface IntegrationHealth {
  integrationId: string;
  avgResponseTimeMs: number;
  errorRate: number;
  totalRequests: number;
  uptimePercent: number;
  lastErrorAt: string | null;
}

interface RequestLogEntry {
  request: {
    requestId: string;
    integrationId: string;
    method: string;
    endpoint: string;
    timestamp: string;
  };
  response: {
    requestId: string;
    statusCode: number;
    responseTimeMs: number;
    error?: string;
  };
}

interface RateLimitInfo {
  limited: boolean;
  remainingMinute: number;
  remainingHour: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("memelli_token") || "";
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(opts?.headers || {})
    }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "API error");
  return json.data as T;
}

function statusColor(status: IntegrationStatus): string {
  switch (status) {
    case "ACTIVE": return "text-emerald-400";
    case "INACTIVE": return "text-zinc-500";
    case "ERROR": return "text-red-400";
    case "RATE_LIMITED": return "text-amber-400";
  }
}

function statusBg(status: IntegrationStatus): string {
  switch (status) {
    case "ACTIVE": return "bg-emerald-500/20 border-emerald-500/30";
    case "INACTIVE": return "bg-zinc-500/20 border-zinc-500/30";
    case "ERROR": return "bg-red-500/20 border-red-500/30";
    case "RATE_LIMITED": return "bg-amber-500/20 border-amber-500/30";
  }
}

function typeBadgeColor(type: IntegrationType): string {
  const map: Record<IntegrationType, string> = {
    DATA: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    COMMUNICATION: "bg-red-500/20 text-red-300 border-red-500/30",
    DOCUMENT: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    FINANCIAL: "bg-green-500/20 text-green-300 border-green-500/30",
    PLATFORM: "bg-orange-500/20 text-orange-300 border-orange-500/30"
  };
  return map[type];
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: IntegrationStatus }) {
  const color =
    status === "ACTIVE" ? "bg-emerald-400" :
    status === "ERROR" ? "bg-red-400" :
    status === "RATE_LIMITED" ? "bg-amber-400" :
    "bg-zinc-500";

  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "ACTIVE" && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function RateLimitBar({
  label,
  used,
  total
}: {
  label: string;
  used: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const barColor = pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>{used}/{total}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-700">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function IntegrationDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [healthMap, setHealthMap] = useState<Record<string, IntegrationHealth>>({});
  const [rateLimitMap, setRateLimitMap] = useState<Record<string, RateLimitInfo>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [formProvider, setFormProvider] = useState("");
  const [formType, setFormType] = useState<IntegrationType>("DATA");
  const [formAuth, setFormAuth] = useState<AuthMethod>("API_KEY");
  const [formApiKey, setFormApiKey] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formRpmLimit, setFormRpmLimit] = useState("60");
  const [formRphLimit, setFormRphLimit] = useState("1000");

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await apiFetch<Integration[]>("/api/admin/integrations");
      setIntegrations(data || []);
    } catch {
      // Silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async (id: string) => {
    try {
      const health = await apiFetch<IntegrationHealth>(`/api/admin/integrations/${id}/health`);
      setHealthMap((prev) => ({ ...prev, [id]: health }));
    } catch {
      // Health fetch is non-critical
    }
  }, []);

  const fetchLogs = useCallback(async (id: string) => {
    try {
      const data = await apiFetch<RequestLogEntry[]>(`/api/admin/integrations/${id}/logs?limit=50`);
      setLogs(data || []);
    } catch {
      setLogs([]);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchIntegrations();
    const interval = setInterval(fetchIntegrations, 10_000);
    return () => clearInterval(interval);
  }, [fetchIntegrations]);

  // Fetch health for all integrations
  useEffect(() => {
    for (const i of integrations) {
      fetchHealth(i.integrationId);
    }
  }, [integrations, fetchHealth]);

  // Fetch logs when selection changes
  useEffect(() => {
    if (selectedId) fetchLogs(selectedId);
  }, [selectedId, fetchLogs]);

  const handleAdd = async () => {
    try {
      await apiFetch<Integration>("/api/admin/integrations", {
        method: "POST",
        body: JSON.stringify({
          type: formType,
          provider: formProvider,
          authMethod: formAuth,
          config: { apiKey: formApiKey, baseUrl: formBaseUrl },
          rateLimits: {
            requestsPerMinute: parseInt(formRpmLimit) || 60,
            requestsPerHour: parseInt(formRphLimit) || 1000
          }
        })
      });
      setShowAddForm(false);
      setFormProvider("");
      setFormApiKey("");
      setFormBaseUrl("");
      await fetchIntegrations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await apiFetch(`/api/admin/integrations/${id}`, { method: "DELETE" });
      await fetchIntegrations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const integration = integrations.find((i) => i.integrationId === id);
      const baseUrl = integration?.config?.baseUrl || "";
      if (!baseUrl) {
        alert("No base URL configured for this integration");
        return;
      }
      await apiFetch(`/api/admin/integrations/${id}/request`, {
        method: "POST",
        body: JSON.stringify({
          method: "GET",
          endpoint: baseUrl
        })
      });
      await fetchHealth(id);
      await fetchIntegrations();
    } catch (err: any) {
      alert(`Connection test failed: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleRetry = async (integrationId: string, requestId: string) => {
    try {
      await apiFetch(`/api/admin/integrations/${integrationId}/retry/${requestId}`, {
        method: "POST"
      });
      if (selectedId) await fetchLogs(selectedId);
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingGlobe size="md" />
      </div>
    );
  }

  const selected = integrations.find((i) => i.integrationId === selectedId);
  const selectedHealth = selectedId ? healthMap[selectedId] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Integration Gateway</h2>
          <p className="text-sm text-zinc-400">
            {integrations.length} integration{integrations.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      {/* Add Integration Form */}
      {showAddForm && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">New Integration</h3>
            <button onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Provider Name</label>
              <input
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
                placeholder="e.g. Stripe, Twilio, SendGrid"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as IntegrationType)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="DATA">Data</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="DOCUMENT">Document</option>
                <option value="FINANCIAL">Financial</option>
                <option value="PLATFORM">Platform</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Auth Method</label>
              <select
                value={formAuth}
                onChange={(e) => setFormAuth(e.target.value as AuthMethod)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="API_KEY">API Key</option>
                <option value="OAUTH">OAuth</option>
                <option value="SERVICE_ACCOUNT">Service Account</option>
                <option value="BASIC_AUTH">Basic Auth</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Base URL</label>
              <input
                value={formBaseUrl}
                onChange={(e) => setFormBaseUrl(e.target.value)}
                placeholder="https://api.provider.com"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">API Key / Token</label>
              <input
                type="password"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Req/min</label>
                <input
                  value={formRpmLimit}
                  onChange={(e) => setFormRpmLimit(e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Req/hr</label>
                <input
                  value={formRphLimit}
                  onChange={(e) => setFormRphLimit(e.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!formProvider}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              Register Integration
            </button>
          </div>
        </div>
      )}

      {/* Integration Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const health = healthMap[integration.integrationId];
          return (
            <div
              key={integration.integrationId}
              onClick={() => setSelectedId(integration.integrationId)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-zinc-500 ${
                selectedId === integration.integrationId
                  ? "border-blue-500 bg-zinc-800/80"
                  : "border-zinc-700 bg-zinc-800/40"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={integration.status} />
                  <h3 className="font-medium text-white">{integration.providerName}</h3>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeBadgeColor(integration.integrationType)}`}>
                  {integration.integrationType}
                </span>
              </div>

              {/* Status Row */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBg(integration.status)} ${statusColor(integration.status)}`}>
                  {integration.status}
                </span>
                <span className="text-xs text-zinc-500">
                  <Clock className="mr-1 inline h-3 w-3" />
                  {timeAgo(integration.lastUsedAt)}
                </span>
              </div>

              {/* Health Metrics */}
              {health && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
                    <div className="text-xs text-zinc-500">Avg</div>
                    <div className="text-sm font-medium text-white">{health.avgResponseTimeMs}ms</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
                    <div className="text-xs text-zinc-500">Errors</div>
                    <div className={`text-sm font-medium ${health.errorRate > 5 ? "text-red-400" : "text-white"}`}>
                      {health.errorRate}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
                    <div className="text-xs text-zinc-500">Reqs</div>
                    <div className="text-sm font-medium text-white">{health.totalRequests}</div>
                  </div>
                </div>
              )}

              {/* Error Count */}
              {integration.errorCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {integration.errorCount} error{integration.errorCount !== 1 ? "s" : ""}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-3 flex gap-2 border-t border-zinc-700/50 pt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestConnection(integration.integrationId);
                  }}
                  className="flex items-center gap-1 rounded-md bg-zinc-700/50 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600 transition-colors"
                >
                  {testingId === integration.integrationId ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  Test
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(integration.integrationId);
                  }}
                  className="flex items-center gap-1 rounded-md bg-zinc-700/50 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600 transition-colors"
                >
                  <Activity className="h-3 w-3" />
                  Logs
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate(integration.integrationId);
                  }}
                  className="flex items-center gap-1 rounded-md bg-zinc-700/50 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 transition-colors ml-auto"
                >
                  {integration.status === "ACTIVE" ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  Deactivate
                </button>
              </div>
            </div>
          );
        })}

        {integrations.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 p-12 text-center">
            <Wifi className="mb-3 h-10 w-10 text-zinc-600" />
            <h3 className="text-lg font-medium text-zinc-300">No Integrations</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Connect external systems to extend your cockpit.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Add First Integration
            </button>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusDot status={selected.status} />
              <h3 className="text-lg font-medium text-white">{selected.providerName}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${typeBadgeColor(selected.integrationType)}`}>
                {selected.integrationType}
              </span>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Health & Rate Limits */}
          <div className="grid grid-cols-2 gap-6">
            {/* Health */}
            {selectedHealth && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-1">
                  <Activity className="h-4 w-4" /> Health Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-zinc-900/50 border border-zinc-700/50 p-3">
                    <div className="text-xs text-zinc-500">Avg Response</div>
                    <div className="text-lg font-semibold text-white">{selectedHealth.avgResponseTimeMs}ms</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/50 border border-zinc-700/50 p-3">
                    <div className="text-xs text-zinc-500">Error Rate</div>
                    <div className={`text-lg font-semibold ${selectedHealth.errorRate > 5 ? "text-red-400" : "text-emerald-400"}`}>
                      {selectedHealth.errorRate}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/50 border border-zinc-700/50 p-3">
                    <div className="text-xs text-zinc-500">Uptime</div>
                    <div className="text-lg font-semibold text-white">{selectedHealth.uptimePercent}%</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/50 border border-zinc-700/50 p-3">
                    <div className="text-xs text-zinc-500">Total Requests</div>
                    <div className="text-lg font-semibold text-white">{selectedHealth.totalRequests}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limits */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-1">
                <Shield className="h-4 w-4" /> Rate Limits
              </h4>
              <div className="space-y-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50 p-4">
                <RateLimitBar
                  label="Per Minute"
                  used={selected.rateLimits.requestsPerMinute - (rateLimitMap[selected.integrationId]?.remainingMinute ?? selected.rateLimits.requestsPerMinute)}
                  total={selected.rateLimits.requestsPerMinute}
                />
                <RateLimitBar
                  label="Per Hour"
                  used={selected.rateLimits.requestsPerHour - (rateLimitMap[selected.integrationId]?.remainingHour ?? selected.rateLimits.requestsPerHour)}
                  total={selected.rateLimits.requestsPerHour}
                />
              </div>
              <div className="text-xs text-zinc-500">
                Auth: {selected.authMethod.replace("_", " ")} | Created: {new Date(selected.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Request Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-1">
                <ExternalLink className="h-4 w-4" /> Recent Requests
              </h4>
              <button
                onClick={() => selectedId && fetchLogs(selectedId)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Time</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Endpoint</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Time</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                        No request logs yet
                      </td>
                    </tr>
                  )}
                  {logs.slice(0, 20).map((log) => {
                    const isError = log.response.error || log.response.statusCode >= 400;
                    return (
                      <tr key={log.request.requestId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="px-3 py-2 text-xs text-zinc-400">
                          {timeAgo(log.request.timestamp)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs font-mono text-zinc-300">
                            {log.request.method}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-300 max-w-[200px] truncate" title={log.request.endpoint}>
                          {log.request.endpoint}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-medium ${isError ? "text-red-400" : "text-emerald-400"}`}>
                            {log.response.statusCode || "ERR"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-400">
                          {log.response.responseTimeMs}ms
                        </td>
                        <td className="px-3 py-2">
                          {isError && (
                            <button
                              onClick={() => handleRetry(selected.integrationId, log.request.requestId)}
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

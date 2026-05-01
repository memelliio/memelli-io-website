"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Lock,
  Unlock,
  UserX,
  Plug,
  FileWarning,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  Ban,
  Activity,
  Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SecuritySummary {
  systemMode: string;
  activeAlerts: number;
  criticalAlerts: number;
  recentAuthFailures: number;
  recentAuthzFailures: number;
  recentExports: number;
  bruteForceDetections: number;
  lastUpdated: string;
}

interface SecurityAlert {
  alertId: string;
  eventType: string;
  severity: "info" | "warning" | "alert" | "critical";
  message: string;
  details: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

interface PendingApproval {
  approvalId: string;
  action: string;
  requesterId: string;
  targetResource: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  approvedBy?: string;
  createdAt: string;
  expiresAt: string;
}

interface ExportHistoryEntry {
  exportId: string;
  userId: string;
  exportType: string;
  entityType: string;
  classification: string;
  status: string;
  reason?: string;
  createdAt: string;
}

interface ClassificationRule {
  fieldPath: string;
  entityType: string;
  classification: string;
  maskingRule?: string;
  encryptionRequired?: boolean;
}

interface ContainmentHistoryEntry {
  id: string;
  action: string;
  targetId?: string;
  reason: string;
  userId: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
}

type Tab = "overview" | "alerts" | "approvals" | "exports" | "containment" | "classification";

// ─── API helpers ────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("memelli_token") : null;
  const res = await fetch(`${API_BASE}/api/admin/security${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data as T;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PostureIndicator({ mode, alerts }: { mode: string; alerts: number }) {
  const getColor = () => {
    if (mode === "LOCKDOWN") return "text-red-500 bg-red-500/10 border-red-500/30";
    if (mode === "READ_ONLY") return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    if (alerts > 5) return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    if (alerts > 0) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  };

  const getIcon = () => {
    if (mode === "LOCKDOWN") return <ShieldOff className="w-5 h-5" />;
    if (mode === "READ_ONLY") return <ShieldAlert className="w-5 h-5" />;
    if (alerts > 0) return <Shield className="w-5 h-5" />;
    return <ShieldCheck className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (mode === "LOCKDOWN") return "LOCKDOWN";
    if (mode === "READ_ONLY") return "READ-ONLY";
    if (mode === "ELEVATED") return "ELEVATED";
    if (alerts > 5) return "AT RISK";
    if (alerts > 0) return "MONITORING";
    return "SECURE";
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${getColor()}`}>
      {getIcon()}
      {getLabel()}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    alert: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[severity] || colors.info}`}>
      {severity.toUpperCase()}
    </span>
  );
}

function ClassificationBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    CROWN_JEWEL: "bg-red-500/20 text-red-400",
    RESTRICTED: "bg-red-500/20 text-red-400",
    CONFIDENTIAL: "bg-orange-500/20 text-orange-400",
    INTERNAL: "bg-blue-500/20 text-blue-400",
    PUBLIC: "bg-green-500/20 text-green-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || "bg-gray-500/20 text-gray-400"}`}>
      {level.replace("_", " ")}
    </span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3">
      <div className="text-zinc-500">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 text-sm font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [exports, setExports] = useState<ExportHistoryEntry[]>([]);
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [containmentHistory, setContainmentHistory] = useState<ContainmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // ── Data fetching ───────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [s, a, ap, ex, r, ch] = await Promise.allSettled([
        apiFetch<SecuritySummary>("/summary"),
        apiFetch<SecurityAlert[]>("/alerts"),
        apiFetch<PendingApproval[]>("/approvals"),
        apiFetch<ExportHistoryEntry[]>("/exports"),
        apiFetch<ClassificationRule[]>("/classification-rules"),
        apiFetch<ContainmentHistoryEntry[]>("/containment/history"),
      ]);

      if (s.status === "fulfilled") setSummary(s.value);
      if (a.status === "fulfilled") setAlerts(a.value);
      if (ap.status === "fulfilled") setApprovals(ap.value);
      if (ex.status === "fulfilled") setExports(ex.value);
      if (r.status === "fulfilled") setRules(r.value);
      if (ch.status === "fulfilled") setContainmentHistory(ch.value);
    } catch {
      // Partial failures are ok
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const acknowledgeAlert = async (alertId: string) => {
    await apiFetch(`/alerts/${alertId}/acknowledge`, { method: "POST" });
    fetchData();
  };

  const approveRequest = async (id: string) => {
    await apiFetch(`/approvals/${id}/approve`, { method: "POST" });
    fetchData();
  };

  const denyRequest = async (id: string) => {
    await apiFetch(`/approvals/${id}/deny`, {
      method: "POST",
      body: JSON.stringify({ reason: "Denied by admin" }),
    });
    fetchData();
  };

  const changeSystemMode = async (mode: string) => {
    setConfirmAction({
      title: `Switch to ${mode} mode?`,
      message: `This will change the system mode to ${mode}. ${mode === "LOCKDOWN" ? "All write operations, deployments, and exports will be blocked." : mode === "READ_ONLY" ? "All write operations will be blocked." : "Normal operations will resume."}`,
      action: async () => {
        await apiFetch("/system-mode", {
          method: "POST",
          body: JSON.stringify({ mode, reason: `Manual mode change to ${mode}` }),
        });
        fetchData();
      },
    });
  };

  const lockdownExports = async () => {
    setConfirmAction({
      title: "Lockdown Exports?",
      message: "This will block all data exports until manually unlocked.",
      action: async () => {
        await apiFetch("/containment/lockdown-exports", {
          method: "POST",
          body: JSON.stringify({ reason: "Manual export lockdown" }),
        });
        fetchData();
      },
    });
  };

  const revokeSessions = async () => {
    setConfirmAction({
      title: "Revoke All Sessions?",
      message: "This will force all users to re-authenticate. Active sessions will be terminated.",
      action: async () => {
        await apiFetch("/containment/revoke-sessions", {
          method: "POST",
          body: JSON.stringify({ reason: "Manual session revocation" }),
        });
        fetchData();
      },
    });
  };

  // ── Tabs ────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
    { id: "alerts", label: "Alerts", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "approvals", label: "Approvals", icon: <CheckCircle className="w-4 h-4" /> },
    { id: "exports", label: "Exports", icon: <Download className="w-4 h-4" /> },
    { id: "containment", label: "Containment", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "classification", label: "Classification", icon: <Eye className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading security data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Security Command Center</h2>
          {summary && (
            <PostureIndicator mode={summary.systemMode} alerts={summary.activeAlerts} />
          )}
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 pb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-zinc-800 text-white border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "alerts" && alerts.filter((a) => !a.acknowledged).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400">
                {alerts.filter((a) => !a.acknowledged).length}
              </span>
            )}
            {tab.id === "approvals" && approvals.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-yellow-500/20 text-yellow-400">
                {approvals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* ── Overview ──────────────────────────────────────────────── */}
        {activeTab === "overview" && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Auth Failures (1h)"
                value={summary.recentAuthFailures}
                icon={<UserX className="w-5 h-5" />}
              />
              <StatCard
                label="Authz Failures (1h)"
                value={summary.recentAuthzFailures}
                icon={<Ban className="w-5 h-5" />}
              />
              <StatCard
                label="Active Alerts"
                value={summary.activeAlerts}
                icon={<AlertTriangle className="w-5 h-5" />}
              />
              <StatCard
                label="System Mode"
                value={summary.systemMode}
                icon={<Shield className="w-5 h-5" />}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Critical Alerts"
                value={summary.criticalAlerts}
                icon={<Zap className="w-5 h-5" />}
              />
              <StatCard
                label="Recent Exports"
                value={summary.recentExports}
                icon={<Download className="w-5 h-5" />}
              />
              <StatCard
                label="Brute Force Detections"
                value={summary.bruteForceDetections}
                icon={<ShieldAlert className="w-5 h-5" />}
              />
            </div>

            {/* Recent security events */}
            {alerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Recent Security Events</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.alertId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        alert.acknowledged
                          ? "bg-zinc-900/50 border-zinc-800/50 opacity-60"
                          : "bg-zinc-900 border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-sm text-zinc-300 truncate">{alert.message}</span>
                      </div>
                      <span className="text-xs text-zinc-600 whitespace-nowrap ml-2">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Alerts ───────────────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
                No security alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className={`p-4 rounded-lg border ${
                    alert.acknowledged
                      ? "bg-zinc-900/50 border-zinc-800/50"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-xs text-zinc-500 font-mono">{alert.eventType}</span>
                      </div>
                      <p className="text-sm text-zinc-300 mt-1">{alert.message}</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.alertId)}
                        className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 whitespace-nowrap"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.acknowledged && (
                      <span className="text-xs text-zinc-600">
                        Ack by {alert.acknowledgedBy?.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Approvals ────────────────────────────────────────────── */}
        {activeTab === "approvals" && (
          <div className="space-y-3">
            {approvals.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                No pending approvals
              </div>
            ) : (
              approvals.map((approval) => (
                <div
                  key={approval.approvalId}
                  className="p-4 rounded-lg border bg-zinc-900 border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          {approval.action}
                        </span>
                        <span className="text-xs text-zinc-500">
                          by {approval.requesterId.slice(0, 8)}...
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 mt-1">
                        Target: <span className="font-mono text-zinc-400">{approval.targetResource}</span>
                      </p>
                      <p className="text-sm text-zinc-400 mt-1">Reason: {approval.reason}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-zinc-600">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(approval.expiresAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveRequest(approval.approvalId)}
                        className="px-3 py-1.5 text-xs rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => denyRequest(approval.approvalId)}
                        className="px-3 py-1.5 text-xs rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 font-medium"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Exports ──────────────────────────────────────────────── */}
        {activeTab === "exports" && (
          <div>
            {exports.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <FileWarning className="w-8 h-8 mx-auto mb-2" />
                No export history
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                      <th className="pb-2 pr-4">User</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Entity</th>
                      <th className="pb-2 pr-4">Classification</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exports.map((exp) => (
                      <tr key={exp.exportId} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-4 text-zinc-300 font-mono text-xs">
                          {exp.userId.slice(0, 8)}...
                        </td>
                        <td className="py-2 pr-4 text-zinc-400">{exp.exportType}</td>
                        <td className="py-2 pr-4 text-zinc-400">{exp.entityType}</td>
                        <td className="py-2 pr-4">
                          <ClassificationBadge level={exp.classification} />
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`text-xs ${
                              exp.status === "denied"
                                ? "text-red-400"
                                : exp.status === "downloaded"
                                  ? "text-emerald-400"
                                  : "text-zinc-400"
                            }`}
                          >
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-2 text-zinc-600 text-xs">
                          {new Date(exp.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Containment ──────────────────────────────────────────── */}
        {activeTab === "containment" && (
          <div className="space-y-6">
            {/* System Mode Selector */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">System Mode</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["NORMAL", "ELEVATED", "READ_ONLY", "LOCKDOWN"] as const).map((mode) => {
                  const isActive = summary?.systemMode === mode;
                  const colors: Record<string, string> = {
                    NORMAL: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                    ELEVATED: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                    READ_ONLY: "border-orange-500/30 bg-orange-500/10 text-orange-400",
                    LOCKDOWN: "border-red-500/30 bg-red-500/10 text-red-400",
                  };
                  return (
                    <button
                      key={mode}
                      onClick={() => changeSystemMode(mode)}
                      disabled={isActive}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        isActive
                          ? `${colors[mode]} ring-2 ring-offset-2 ring-offset-zinc-950 ring-current`
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {mode.replace("_", " ")}
                      {isActive && <span className="block text-[10px] mt-0.5 opacity-70">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kill Switches */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Emergency Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={lockdownExports}
                  className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-red-500/30 hover:bg-red-500/5 transition-colors text-left"
                >
                  <Lock className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Lockdown Exports</p>
                    <p className="text-xs text-zinc-500">Block all data exports</p>
                  </div>
                </button>

                <button
                  onClick={revokeSessions}
                  className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-red-500/30 hover:bg-red-500/5 transition-colors text-left"
                >
                  <UserX className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Revoke All Sessions</p>
                    <p className="text-xs text-zinc-500">Force all users to re-authenticate</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Containment History */}
            {containmentHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Containment History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {containmentHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400">
                          {entry.action}
                        </span>
                        <span className="text-sm text-zinc-400 truncate">{entry.reason}</span>
                      </div>
                      <span className="text-xs text-zinc-600 whitespace-nowrap ml-2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Classification ───────────────────────────────────────── */}
        {activeTab === "classification" && (
          <div>
            {rules.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Eye className="w-8 h-8 mx-auto mb-2" />
                No classification rules loaded
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                      <th className="pb-2 pr-4">Entity Type</th>
                      <th className="pb-2 pr-4">Field</th>
                      <th className="pb-2 pr-4">Classification</th>
                      <th className="pb-2 pr-4">Masking</th>
                      <th className="pb-2">Encrypted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, idx) => (
                      <tr key={`${rule.entityType}-${rule.fieldPath}-${idx}`} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-4 text-zinc-300 font-medium">{rule.entityType}</td>
                        <td className="py-2 pr-4 text-zinc-400 font-mono text-xs">{rule.fieldPath}</td>
                        <td className="py-2 pr-4">
                          <ClassificationBadge level={rule.classification} />
                        </td>
                        <td className="py-2 pr-4 text-zinc-500 text-xs">
                          {rule.maskingRule || "-"}
                        </td>
                        <td className="py-2">
                          {rule.encryptionRequired ? (
                            <Lock className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Unlock className="w-4 h-4 text-zinc-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={async () => {
            await confirmAction.action();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock,
  Gauge,
  Lightbulb,
  Play,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

interface DecisionResult {
  decisionId: string;
  type: "RULE_BASED" | "AI_ASSISTED" | "HYBRID";
  input: Record<string, any>;
  output: Record<string, any>;
  explanation: string;
  confidence: number;
  timestamp: string;
  executionTimeMs: number;
}

interface Recommendation {
  id: string;
  type: "NEXT_ACTION" | "FOLLOW_UP" | "STALLED_ITEM" | "OPTIMIZATION" | "RISK_ALERT";
  tenantId: string;
  targetEntityId?: string;
  title: string;
  description: string;
  action?: string;
  confidence: number;
  priority: number;
  createdAt: string;
  expiresAt?: string;
}

interface RuleSet {
  ruleSetId: string;
  name: string;
  domain: string;
  rules: Array<{
    ruleId: string;
    name: string;
    condition: string;
    action: string;
    priority: number;
  }>;
}

type Tab = "recommendations" | "decisions" | "stalled" | "rules";

// ─── Helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memelli_token");
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/decisions${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers
    }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return "text-emerald-400";
  if (c >= 0.5) return "text-amber-400";
  return "text-red-400";
}

function confidenceBg(c: number): string {
  if (c >= 0.8) return "bg-emerald-500/20";
  if (c >= 0.5) return "bg-amber-500/20";
  return "bg-red-500/20";
}

function typeIcon(type: Recommendation["type"]) {
  switch (type) {
    case "NEXT_ACTION":
      return <ArrowRight className="h-4 w-4 text-blue-400" />;
    case "FOLLOW_UP":
      return <Clock className="h-4 w-4 text-amber-400" />;
    case "STALLED_ITEM":
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    case "OPTIMIZATION":
      return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    case "RISK_ALERT":
      return <Shield className="h-4 w-4 text-red-400" />;
  }
}

function decisionTypeIcon(type: DecisionResult["type"]) {
  switch (type) {
    case "RULE_BASED":
      return <Scale className="h-4 w-4 text-blue-400" />;
    case "AI_ASSISTED":
      return <Brain className="h-4 w-4 text-red-400" />;
    case "HYBRID":
      return <Sparkles className="h-4 w-4 text-amber-400" />;
  }
}

function typeBadge(type: string): string {
  switch (type) {
    case "RULE_BASED":
      return "bg-blue-500/20 text-blue-300";
    case "AI_ASSISTED":
      return "bg-red-500/20 text-red-300";
    case "HYBRID":
      return "bg-amber-500/20 text-amber-300";
    case "NEXT_ACTION":
      return "bg-blue-500/20 text-blue-300";
    case "FOLLOW_UP":
      return "bg-amber-500/20 text-amber-300";
    case "STALLED_ITEM":
      return "bg-orange-500/20 text-orange-300";
    case "OPTIMIZATION":
      return "bg-emerald-500/20 text-emerald-300";
    case "RISK_ALERT":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-zinc-500/20 text-zinc-300";
  }
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function DecisionInsights() {
  const [tab, setTab] = useState<Tab>("recommendations");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [decisions, setDecisions] = useState<DecisionResult[]>([]);
  const [stalledItems, setStalledItems] = useState<Recommendation[]>([]);
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      const data = await apiFetch<Recommendation[]>("/recommendations");
      setRecommendations(data);
    } catch {
      // silent
    }
  }, []);

  const fetchDecisions = useCallback(async () => {
    try {
      const data = await apiFetch<DecisionResult[]>("/history?limit=20");
      setDecisions(data);
    } catch {
      // silent
    }
  }, []);

  const fetchStalled = useCallback(async () => {
    try {
      const data = await apiFetch<Recommendation[]>("/recommendations/stalled");
      setStalledItems(data);
    } catch {
      // silent
    }
  }, []);

  const fetchRules = useCallback(async () => {
    try {
      const data = await apiFetch<RuleSet[]>("/rules");
      setRuleSets(data);
    } catch {
      // silent
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchRecommendations(),
      fetchDecisions(),
      fetchStalled(),
      fetchRules(),
    ]);
    setLoading(false);
  }, [fetchRecommendations, fetchDecisions, fetchStalled, fetchRules]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const executeRec = async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/recommendations/${id}/execute`, { method: "POST" });
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silent
    }
    setActionLoading(null);
  };

  const dismissRec = async (id: string) => {
    setActionLoading(id);
    try {
      await apiFetch(`/recommendations/${id}/dismiss`, { method: "POST" });
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silent
    }
    setActionLoading(null);
  };

  const TAB_ITEMS: Array<{ key: Tab; label: string; icon: typeof Brain; count?: number }> = [
    { key: "recommendations", label: "Recommendations", icon: Lightbulb, count: recommendations.length },
    { key: "decisions", label: "Recent Decisions", icon: Brain, count: decisions.length },
    { key: "stalled", label: "Stalled Items", icon: AlertTriangle, count: stalledItems.length },
    { key: "rules", label: "Rule Sets", icon: BookOpen, count: ruleSets.length },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-semibold">Decision Intelligence</h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 px-3 pt-2 border-b border-zinc-800">
        {TAB_ITEMS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors ${
              tab === t.key
                ? "bg-zinc-800 text-zinc-100 border-b-2 border-amber-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-zinc-700 text-zinc-300">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingGlobe size="sm" />
          </div>
        )}

        {!loading && tab === "recommendations" && (
          <>
            {recommendations.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No active recommendations. Everything looks good.
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-zinc-900 rounded-lg border border-zinc-800 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {typeIcon(rec.type)}
                      <span className="text-sm font-medium">{rec.title}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeBadge(rec.type)}`}>
                      {rec.type.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{rec.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Confidence */}
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-zinc-500" />
                        <div className={`text-[10px] px-1.5 py-0.5 rounded ${confidenceBg(rec.confidence)}`}>
                          <span className={confidenceColor(rec.confidence)}>
                            {Math.round(rec.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      {/* Time */}
                      <span className="text-[10px] text-zinc-600">{timeAgo(rec.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {rec.action && (
                        <button
                          onClick={() => executeRec(rec.id)}
                          disabled={actionLoading === rec.id}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === rec.id ? (
                            <LoadingGlobe size="sm" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Execute
                        </button>
                      )}
                      <button
                        onClick={() => dismissRec(rec.id)}
                        disabled={actionLoading === rec.id}
                        className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {!loading && tab === "decisions" && (
          <>
            {decisions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No recent decisions recorded.
              </div>
            ) : (
              decisions.map((d) => (
                <div
                  key={d.decisionId}
                  className="bg-zinc-900 rounded-lg border border-zinc-800 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {decisionTypeIcon(d.type)}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeBadge(d.type)}`}>
                        {d.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-[10px] px-1.5 py-0.5 rounded ${confidenceBg(d.confidence)}`}>
                        <span className={confidenceColor(d.confidence)}>
                          {Math.round(d.confidence * 100)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600">{d.executionTimeMs}ms</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{d.explanation}</p>

                  {d.output.finalAction && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <Check className="h-3 w-3" />
                      Action: {d.output.finalAction}
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-600">{timeAgo(d.timestamp)}</div>
                </div>
              ))
            )}
          </>
        )}

        {!loading && tab === "stalled" && (
          <>
            {stalledItems.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No stalled items detected. Pipelines are flowing.
              </div>
            ) : (
              stalledItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900 rounded-lg border border-orange-500/20 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded ${confidenceBg(item.confidence)}`}>
                      <span className={confidenceColor(item.confidence)}>
                        {Math.round(item.confidence * 100)}% stale
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">Priority: {item.priority}</span>
                    {item.action && (
                      <button
                        onClick={() => executeRec(item.id)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === item.id ? (
                          <LoadingGlobe size="sm" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        Follow Up
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {!loading && tab === "rules" && (
          <>
            {ruleSets.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No rule sets loaded.
              </div>
            ) : (
              ruleSets.map((rs) => (
                <div
                  key={rs.ruleSetId}
                  className="bg-zinc-900 rounded-lg border border-zinc-800 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium">{rs.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                      {rs.domain}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {rs.rules.map((rule) => (
                      <div
                        key={rule.ruleId}
                        className="flex items-center justify-between py-1 px-2 bg-zinc-800/50 rounded text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 w-4 text-right">{rule.priority}</span>
                          <span className="text-zinc-300">{rule.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] text-zinc-500 max-w-[200px] truncate">
                            {rule.condition}
                          </code>
                          <ChevronRight className="h-3 w-3 text-zinc-600" />
                          <span className="text-emerald-400 text-[10px]">{rule.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

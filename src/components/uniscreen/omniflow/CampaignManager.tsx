"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  Mail,
  MessageSquare,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  Target,
  Users,
  X,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "active" | "paused" | "completed";
type CampaignType = "email" | "sms";

interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  type: CampaignType;
  templateId?: string;
  templateName?: string;
  audienceId?: string;
  audienceName?: string;
  stats: CampaignStats;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface CreateCampaignForm {
  name: string;
  description: string;
  type: CampaignType;
  templateId: string;
  audienceId: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CampaignStatus, { color: string; bg: string; dot: string }> = {
  draft: { color: "text-zinc-400", bg: "bg-zinc-500/10", dot: "bg-zinc-500" },
  active: { color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  paused: { color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  completed: { color: "text-blue-400", bg: "bg-blue-500/10", dot: "bg-blue-500" }
};

const STATUS_TABS: Array<{ key: string; label: string; value: CampaignStatus | "all" }> = [
  { key: "all", label: "All", value: "all" },
  { key: "draft", label: "Drafts", value: "draft" },
  { key: "active", label: "Active", value: "active" },
  { key: "paused", label: "Paused", value: "paused" },
  { key: "completed", label: "Completed", value: "completed" },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ─── API ────────────────────────────────────────────────────────────────

async function fetchCampaigns(status?: string): Promise<Campaign[]> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`${API_URL}/api/admin/omniflow/campaigns?${params}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || json.campaigns || [];
}

async function apiCreateCampaign(form: CreateCampaignForm): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(form)
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.id || json.campaign?.id || null;
}

async function apiUpdateCampaignStatus(id: string, status: CampaignStatus): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/campaigns/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ status })
  });
  return res.ok;
}

async function apiDuplicateCampaign(id: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/campaigns/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() }
  });
  return res.ok;
}

// ─── Stats Bar ──────────────────────────────────────────────────────────

function CampaignStatsBar({ stats }: { stats: CampaignStats }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
      {[
        { label: "Recipients", value: stats.totalRecipients, icon: Users, color: "text-zinc-400" },
        { label: "Sent", value: stats.sent, icon: Send, color: "text-red-400" },
        { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-400" },
        { label: "Opened", value: stats.opened, icon: Eye, color: "text-blue-400" },
        { label: "Clicked", value: stats.clicked, icon: Target, color: "text-amber-400" },
        { label: "Bounced", value: stats.bounced, icon: ArrowRight, color: "text-red-400" },
        { label: "Unsub", value: stats.unsubscribed, icon: X, color: "text-zinc-500" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 rounded-lg bg-zinc-800/40 px-2 py-1.5">
          <item.icon className={`h-3 w-3 ${item.color}`} />
          <div>
            <p className="text-xs font-bold text-zinc-200">{formatNumber(item.value)}</p>
            <p className="text-[9px] text-zinc-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Campaign Card ──────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onAction
}: {
  campaign: Campaign;
  onAction: (action: string, id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const style = STATUS_STYLES[campaign.status];
  const TypeIcon = campaign.type === "email" ? Mail : Smartphone;

  // Send progress
  const sendProgress =
    campaign.stats.totalRecipients > 0
      ? Math.round((campaign.stats.sent / campaign.stats.totalRecipients) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/60">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 shrink-0 text-red-400" />
            <h3 className="truncate text-sm font-semibold text-zinc-200">
              {campaign.name}
            </h3>
          </div>
          {campaign.description && (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {campaign.description}
            </p>
          )}
        </div>
        <span
          className={`ml-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style.bg} ${style.color}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-3">
        <CampaignStatsBar stats={campaign.stats} />
      </div>

      {/* Send progress timeline */}
      {campaign.status === "active" && campaign.stats.totalRecipients > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Send Progress</span>
            <span>{sendProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-500"
              style={{ width: `${sendProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1 uppercase">
          <TypeIcon className="h-3 w-3" />
          {campaign.type}
        </span>
        {campaign.templateName && (
          <span className="truncate">Template: {campaign.templateName}</span>
        )}
        {campaign.audienceName && (
          <span className="truncate">Audience: {campaign.audienceName}</span>
        )}
        {campaign.startedAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(campaign.startedAt)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-800/60 pt-3">
        {campaign.status === "draft" && (
          <button
            onClick={() => onAction("start", campaign.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-emerald-400"
          >
            <Play className="h-3 w-3" />
            Start
          </button>
        )}
        {campaign.status === "active" && (
          <button
            onClick={() => onAction("pause", campaign.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-amber-400"
          >
            <Pause className="h-3 w-3" />
            Pause
          </button>
        )}
        {campaign.status === "paused" && (
          <button
            onClick={() => onAction("resume", campaign.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-emerald-400"
          >
            <Play className="h-3 w-3" />
            Resume
          </button>
        )}
        <button
          onClick={() => onAction("duplicate", campaign.id)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <Copy className="h-3 w-3" />
          Duplicate
        </button>
        <button
          onClick={() => onAction("view", campaign.id)}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400"
        >
          <BarChart3 className="h-3 w-3" />
          Analytics
        </button>
      </div>
    </div>
  );
}

// ─── Create Campaign Modal ──────────────────────────────────────────────

function CreateCampaignModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateCampaignForm>({
    name: "",
    description: "",
    type: "email",
    templateId: "",
    audienceId: ""
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const id = await apiCreateCampaign(form);
      if (!id) throw new Error("Failed to create campaign");
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-200">Create Campaign</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Campaign Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. March Newsletter"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief campaign description..."
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Type
            </label>
            <div className="flex overflow-hidden rounded-lg border border-zinc-700">
              <button
                onClick={() => setForm((f) => ({ ...f, type: "email" }))}
                className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium transition-all ${
                  form.type === "email"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, type: "sms" }))}
                className={`flex flex-1 items-center justify-center gap-1.5 border-l border-zinc-700 px-4 py-2 text-sm font-medium transition-all ${
                  form.type === "sms"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                SMS
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Template ID
            </label>
            <input
              type="text"
              value={form.templateId}
              onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
              placeholder="Enter template ID or leave blank..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Target Audience ID
            </label>
            <input
              type="text"
              value={form.audienceId}
              onChange={(e) => setForm((f) => ({ ...f, audienceId: e.target.value }))}
              placeholder="Enter audience segment ID..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating || !form.name.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {creating ? (
              <LoadingGlobe size="sm" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {creating ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const openTab = useWorkspaceTabStore((s) => s.openTab);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns(activeTab);
      setCampaigns(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = useCallback(
    async (action: string, id: string) => {
      switch (action) {
        case "start":
          await apiUpdateCampaignStatus(id, "active");
          loadData();
          break;
        case "pause":
          await apiUpdateCampaignStatus(id, "paused");
          loadData();
          break;
        case "resume":
          await apiUpdateCampaignStatus(id, "active");
          loadData();
          break;
        case "duplicate":
          await apiDuplicateCampaign(id);
          loadData();
          break;
        case "view":
          openTab({
            type: "campaign-analytics",
            title: "Campaign Analytics",
            icon: "bar-chart",
            entityId: id,
            entityType: "campaign",
            source: "user"
          });
          break;
      }
    },
    [loadData, openTab],
  );

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Campaigns</h2>
          {campaigns.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {campaigns.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-zinc-800/50 px-4 py-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-red-500/20 text-red-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Campaign List ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80">
              <MessageSquare className="h-7 w-7 text-zinc-500" />
            </div>
            <h3 className="text-sm font-medium text-zinc-300">No campaigns</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Create your first campaign to start reaching your audience.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Modal ───────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}

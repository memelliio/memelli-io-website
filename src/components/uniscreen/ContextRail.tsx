"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Brain,
  FileText,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useWorkspaceStore, type Tab } from "@/stores/workspace-store";

// ─── Sub-Components (placeholders — will be wired to real data later) ────

function ClientContext({ entityId }: { entityId?: string }) {
  return (
    <div className="space-y-2 text-sm text-zinc-400">
      <p className="text-zinc-300 font-medium">
        Client: {entityId ?? "Unknown"}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>Active</span>
      </div>
      <p className="text-xs text-zinc-500">
        Full profile data will appear here when connected.
      </p>
    </div>
  );
}

function CreditContext() {
  return (
    <div className="space-y-2 text-sm text-zinc-400">
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Credit Score</span>
        <span className="text-lg font-bold text-emerald-400">---</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800">
        <div className="h-2 w-0 rounded-full bg-emerald-500 transition-all" />
      </div>
      <p className="text-xs text-zinc-500">
        Score data will populate when connected to credit engine.
      </p>
    </div>
  );
}

function PipelineContext() {
  return (
    <div className="space-y-2 text-sm text-zinc-400">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-zinc-800/50 p-2 text-center">
          <p className="text-lg font-bold text-zinc-200">--</p>
          <p className="text-xs text-zinc-500">Open Deals</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-2 text-center">
          <p className="text-lg font-bold text-zinc-200">--</p>
          <p className="text-xs text-zinc-500">Won This Month</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Pipeline metrics will populate when connected.
      </p>
    </div>
  );
}

function AgentContext() {
  return (
    <div className="space-y-2 text-sm text-zinc-400">
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Active Agents</span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          --
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Idle Reserve</span>
        <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400">
          --
        </span>
      </div>
      <p className="text-xs text-zinc-500">
        Agent pool status will populate when connected.
      </p>
    </div>
  );
}

function TasksContext() {
  return (
    <div className="space-y-2 text-sm text-zinc-400">
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Open Tasks</span>
        <span className="text-sm font-bold text-zinc-200">--</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Due Today</span>
        <span className="text-sm font-bold text-amber-400">--</span>
      </div>
      <p className="text-xs text-zinc-500">
        Task data will populate when connected.
      </p>
    </div>
  );
}

function AISuggestionsContext({ tabTitle }: { tabTitle: string }) {
  return (
    <div className="space-y-2 text-sm text-zinc-400">
      <p className="text-zinc-300">
        MUA can help with{" "}
        <span className="font-medium text-violet-400">{tabTitle}</span>
      </p>
      <ul className="space-y-1 text-xs text-zinc-500">
        <li className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-violet-400" />
          Ask a question about this view
        </li>
        <li className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-violet-400" />
          Run an automated analysis
        </li>
        <li className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-violet-400" />
          Generate a report
        </li>
      </ul>
    </div>
  );
}

function PlaceholderContext({ text }: { text: string }) {
  return (
    <p className="text-xs text-zinc-500">{text}</p>
  );
}

// ─── Context Section Definition ─────────────────────────────────────────

interface ContextSection {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

function getContextSections(
  tab: Tab | null,
): ContextSection[] {
  if (!tab) return [];

  switch (tab.type) {
    case "client_profile":
    case "contacts":
      return [
        {
          title: "Client Summary",
          icon: <Users className="h-4 w-4" />,
          content: <ClientContext entityId={tab.entityId} />,
        },
        {
          title: "Active Tasks",
          icon: <CheckCircle className="h-4 w-4" />,
          content: <TasksContext />,
        },
        {
          title: "Related Docs",
          icon: <FileText className="h-4 w-4" />,
          content: <PlaceholderContext text="No documents linked" />,
        },
      ];

    case "credit_report":
    case "credit":
      return [
        {
          title: "Credit Summary",
          icon: <Activity className="h-4 w-4" />,
          content: <CreditContext />,
        },
        {
          title: "Funding Readiness",
          icon: <Zap className="h-4 w-4" />,
          content: <PlaceholderContext text="Run funding analysis" />,
        },
        {
          title: "Recent Notes",
          icon: <FileText className="h-4 w-4" />,
          content: <PlaceholderContext text="No recent notes" />,
        },
      ];

    case "pipeline":
    case "deals":
    case "crm":
      return [
        {
          title: "Pipeline Stats",
          icon: <Activity className="h-4 w-4" />,
          content: <PipelineContext />,
        },
        {
          title: "Recent Activity",
          icon: <Clock className="h-4 w-4" />,
          content: <PlaceholderContext text="No recent activity" />,
        },
      ];

    case "deployment_log":
      return [
        {
          title: "Agent Activity",
          icon: <Zap className="h-4 w-4" />,
          content: <AgentContext />,
        },
        {
          title: "Recent Errors",
          icon: <AlertTriangle className="h-4 w-4" />,
          content: <PlaceholderContext text="No recent errors" />,
        },
        {
          title: "Build Status",
          icon: <CheckCircle className="h-4 w-4" />,
          content: <PlaceholderContext text="Last build: healthy" />,
        },
      ];

    case "report":
    case "analytics_dashboard":
      return [
        {
          title: "Filters",
          icon: <Activity className="h-4 w-4" />,
          content: <PlaceholderContext text="No active filters" />,
        },
        {
          title: "Export",
          icon: <FileText className="h-4 w-4" />,
          content: <PlaceholderContext text="Export as PDF, CSV" />,
        },
      ];

    default:
      return [
        {
          title: "AI Suggestions",
          icon: <Brain className="h-4 w-4" />,
          content: <AISuggestionsContext tabTitle={tab.title} />,
        },
        {
          title: "Recent Activity",
          icon: <Clock className="h-4 w-4" />,
          content: <PlaceholderContext text="No recent activity" />,
        },
      ];
  }
}

// ─── Accordion Section ──────────────────────────────────────────────────

function AccordionSection({ section }: { section: ContextSection }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100"
      >
        {section.icon}
        <span className="flex-1">{section.title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-3">{section.content}</div>
      </div>
    </div>
  );
}

// ─── ContextRail ────────────────────────────────────────────────────────

export function ContextRail() {
  const [expanded, setExpanded] = useState(false);
  const getActiveTab = useWorkspaceStore((s) => s.getActiveTab);
  const activeTab = getActiveTab();
  const sections = getContextSections(activeTab);

  return (
    <div className="relative flex h-full">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -left-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-lg transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        aria-label={expanded ? "Collapse context panel" : "Expand context panel"}
      >
        {expanded ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`h-full overflow-hidden border-l border-zinc-800 bg-zinc-900 transition-all duration-300 ease-in-out ${
          expanded ? "w-72" : "w-0"
        }`}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Context
            </h3>
            {activeTab && (
              <span className="max-w-[140px] truncate text-xs text-zinc-600">
                {activeTab.title}
              </span>
            )}
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto">
            {sections.length > 0 ? (
              sections.map((section, i) => (
                <AccordionSection key={`${section.title}-${i}`} section={section} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Brain className="mb-3 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">No active tab</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Open a tab to see contextual information
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

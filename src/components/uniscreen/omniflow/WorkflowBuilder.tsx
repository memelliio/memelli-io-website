"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Code,
  FileText,
  GitBranch,
  GripVertical,
  Layers,
  MessageSquare,
  Play,
  Plus,
  Redo2,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  Workflow,
  X,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

type NodeType =
  | "trigger"
  | "action"
  | "condition"
  | "delay"
  | "agent"
  | "branch"
  | "approval"
  | "notification"
  | "report"
  | "integration";

interface NodePosition {
  x: number;
  y: number;
}

interface NodeConfig {
  [key: string]: unknown;
}

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  config: NodeConfig;
  position: NodePosition;
  status?: "idle" | "running" | "completed" | "failed";
}

interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
}

interface WorkflowData {
  id?: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  triggerType: string;
  status: string;
}

interface ActionDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  configFields: Array<{
    key: string;
    label: string;
    type: "text" | "select" | "number" | "boolean" | "textarea";
    options?: string[];
    required?: boolean;
  }>;
}

interface HistoryEntry {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

// ─── Constants ──────────────────────────────────────────────────────────

const NODE_PALETTE: Array<{ type: NodeType; label: string; description: string }> = [
  { type: "trigger", label: "Trigger", description: "Start the workflow" },
  { type: "action", label: "Action", description: "Execute a task" },
  { type: "condition", label: "Condition", description: "If/then logic" },
  { type: "delay", label: "Delay", description: "Wait for a duration" },
  { type: "agent", label: "Agent", description: "Dispatch to agent pool" },
  { type: "branch", label: "Branch", description: "Split into paths" },
  { type: "approval", label: "Approval", description: "Require approval" },
  { type: "notification", label: "Notification", description: "Send alert" },
  { type: "report", label: "Report", description: "Generate report" },
  { type: "integration", label: "Integration", description: "External API call" },
];

const NODE_ICONS: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  trigger: Zap,
  action: Play,
  condition: GitBranch,
  delay: Clock,
  agent: Brain,
  branch: GitBranch,
  approval: ShieldCheck,
  notification: Bell,
  report: FileText,
  integration: Code
};

const NODE_COLORS: Record<NodeType, { border: string; bg: string; icon: string }> = {
  trigger: { border: "border-amber-500/50", bg: "bg-amber-500/10", icon: "text-amber-400" },
  action: { border: "border-red-500/50", bg: "bg-red-500/10", icon: "text-red-400" },
  condition: { border: "border-blue-500/50", bg: "bg-blue-500/10", icon: "text-blue-400" },
  delay: { border: "border-zinc-500/50", bg: "bg-zinc-500/10", icon: "text-zinc-400" },
  agent: { border: "border-emerald-500/50", bg: "bg-emerald-500/10", icon: "text-emerald-400" },
  branch: { border: "border-cyan-500/50", bg: "bg-cyan-500/10", icon: "text-cyan-400" },
  approval: { border: "border-orange-500/50", bg: "bg-orange-500/10", icon: "text-orange-400" },
  notification: { border: "border-pink-500/50", bg: "bg-pink-500/10", icon: "text-pink-400" },
  report: { border: "border-indigo-500/50", bg: "bg-indigo-500/10", icon: "text-indigo-400" },
  integration: { border: "border-teal-500/50", bg: "bg-teal-500/10", icon: "text-teal-400" }
};

const DEFAULT_CONFIG_FIELDS: Record<
  NodeType,
  Array<{ key: string; label: string; type: "text" | "select" | "number" | "boolean" | "textarea"; options?: string[] }>
> = {
  trigger: [
    { key: "triggerType", label: "Trigger Type", type: "select", options: ["manual", "schedule", "webhook", "event"] },
    { key: "schedule", label: "Schedule (cron)", type: "text" },
    { key: "webhookPath", label: "Webhook Path", type: "text" },
  ],
  action: [
    { key: "actionType", label: "Action Type", type: "select", options: ["api_call", "database", "transform", "email", "sms"] },
    { key: "endpoint", label: "Endpoint / Target", type: "text" },
    { key: "payload", label: "Payload Template", type: "textarea" },
  ],
  condition: [
    { key: "field", label: "Field", type: "text" },
    { key: "operator", label: "Operator", type: "select", options: ["equals", "not_equals", "contains", "gt", "lt", "exists"] },
    { key: "value", label: "Value", type: "text" },
  ],
  delay: [
    { key: "duration", label: "Duration (seconds)", type: "number" },
    { key: "delayType", label: "Type", type: "select", options: ["fixed", "until_time", "until_event"] },
  ],
  agent: [
    { key: "pool", label: "Agent Pool", type: "select", options: ["general", "crm", "commerce", "support", "marketing", "engineering"] },
    { key: "task", label: "Task Description", type: "textarea" },
    { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "critical"] },
  ],
  branch: [
    { key: "branchType", label: "Branch Type", type: "select", options: ["conditional", "parallel", "percentage"] },
    { key: "paths", label: "Number of Paths", type: "number" },
  ],
  approval: [
    { key: "approver", label: "Approver Role", type: "select", options: ["admin", "manager", "owner", "custom"] },
    { key: "timeout", label: "Timeout (hours)", type: "number" },
    { key: "message", label: "Approval Message", type: "textarea" },
  ],
  notification: [
    { key: "channel", label: "Channel", type: "select", options: ["email", "sms", "push", "slack", "in_app"] },
    { key: "template", label: "Template", type: "text" },
    { key: "recipients", label: "Recipients", type: "text" },
  ],
  report: [
    { key: "reportType", label: "Report Type", type: "select", options: ["summary", "detailed", "analytics", "compliance"] },
    { key: "format", label: "Format", type: "select", options: ["pdf", "csv", "json", "dashboard"] },
    { key: "module", label: "Module", type: "select", options: ["commerce", "crm", "coaching", "seo", "agents"] },
  ],
  integration: [
    { key: "service", label: "Service", type: "select", options: ["stripe", "twilio", "sendgrid", "slack", "zapier", "custom"] },
    { key: "method", label: "HTTP Method", type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
    { key: "url", label: "URL", type: "text" },
    { key: "body", label: "Request Body", type: "textarea" },
  ]
};

// ─── Helpers ────────────────────────────────────────────────────────────

function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── SVG Connection Line ────────────────────────────────────────────────

function ConnectionLine({
  from,
  to,
  onDelete
}: {
  from: NodePosition;
  to: NodePosition;
  onDelete: () => void;
}) {
  const fromX = from.x + 140;
  const fromY = from.y + 40;
  const toX = to.x + 140;
  const toY = to.y;
  const midY = (fromY + toY) / 2;

  const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

  return (
    <g className="group/conn cursor-pointer" onClick={onDelete}>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
      />
      <path
        d={path}
        fill="none"
        stroke="rgb(113 113 122)"
        strokeWidth={2}
        strokeDasharray="6 4"
        className="transition-colors group-hover/conn:stroke-red-400"
      />
      <circle
        cx={(fromX + toX) / 2}
        cy={midY}
        r={6}
        fill="rgb(39 39 42)"
        stroke="rgb(113 113 122)"
        strokeWidth={1.5}
        className="opacity-0 transition-opacity group-hover/conn:opacity-100"
      />
      <text
        x={(fromX + toX) / 2}
        y={midY + 3.5}
        textAnchor="middle"
        fontSize={8}
        fill="rgb(161 161 170)"
        className="pointer-events-none opacity-0 transition-opacity group-hover/conn:opacity-100"
      >
        x
      </text>
    </g>
  );
}

// ─── Canvas Node ────────────────────────────────────────────────────────

function CanvasNode({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDelete
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDelete: () => void;
}) {
  const colors = NODE_COLORS[node.type];
  const Icon = NODE_ICONS[node.type];

  return (
    <div
      className={`absolute w-[280px] cursor-grab rounded-xl border ${colors.border} ${
        isSelected ? "ring-2 ring-red-500/50" : ""
      } bg-zinc-900/95 shadow-lg transition-shadow duration-200 hover:shadow-xl active:cursor-grabbing`}
      style={{ left: node.position.x, top: node.position.y }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseDown={onDragStart}
    >
      <div className={`flex items-center gap-2 rounded-t-xl border-b border-zinc-800 ${colors.bg} px-3 py-2`}>
        <GripVertical className="h-3 w-3 text-zinc-500" />
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        <span className="flex-1 truncate text-xs font-semibold text-zinc-200">{node.label}</span>
        {node.status === "running" && (
          <LoadingGlobe size="sm" />
        )}
        {node.status === "completed" && (
          <Check className="h-3 w-3 text-emerald-400" />
        )}
        {node.status === "failed" && (
          <AlertTriangle className="h-3 w-3 text-red-400" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-700 hover:text-red-400"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {node.description && (
        <div className="px-3 py-2">
          <p className="truncate text-[11px] text-zinc-500">{node.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Node Config Panel ──────────────────────────────────────────────────

function NodeConfigPanel({
  node,
  onUpdate,
  onClose
}: {
  node: WorkflowNode;
  onUpdate: (patch: Partial<WorkflowNode>) => void;
  onClose: () => void;
}) {
  const fields = DEFAULT_CONFIG_FIELDS[node.type] || [];

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-900/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200">Configure Node</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Node label */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Label
            </label>
            <input
              type="text"
              value={node.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>

          {/* Node description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </label>
            <input
              type="text"
              value={node.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Optional description..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>

          {/* Type badge */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Type
            </label>
            <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${NODE_COLORS[node.type].bg} ${NODE_COLORS[node.type].icon}`}>
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </div>
          </div>

          {/* Config fields */}
          <div className="border-t border-zinc-800 pt-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Parameters
            </h4>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-500">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <div className="relative">
                      <select
                        value={(node.config[field.key] as string) || ""}
                        onChange={(e) =>
                          onUpdate({
                            config: { ...node.config, [field.key]: e.target.value }
                          })
                        }
                        className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800/80 py-2 pl-3 pr-8 text-sm text-zinc-200 outline-none transition-colors focus:border-red-500/50"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={(node.config[field.key] as string) || ""}
                      onChange={(e) =>
                        onUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })
                      }
                      rows={3}
                      className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={(node.config[field.key] as number) || ""}
                      onChange={(e) =>
                        onUpdate({
                          config: { ...node.config, [field.key]: Number(e.target.value) }
                        })
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-red-500/50"
                    />
                  ) : (
                    <input
                      type="text"
                      value={(node.config[field.key] as string) || ""}
                      onChange={(e) =>
                        onUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (id: string) => void;
}

// ─── Main Component ─────────────────────────────────────────────────────

export function WorkflowBuilder({ workflowId, onSave }: WorkflowBuilderProps) {
  const [name, setName] = useState("Untitled Workflow");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!workflowId && workflowId !== "new");
  const [muaInput, setMuaInput] = useState("");
  const [muaSending, setMuaSending] = useState(false);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // History (undo/redo)
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const openTab = useWorkspaceTabStore((s) => s.openTab);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // ── Push history ──────────────────────────────────────────────────────
  const pushHistory = useCallback(
    (newNodes: WorkflowNode[], newConnections: NodeConnection[]) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        return [...truncated, { nodes: newNodes, connections: newConnections }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setNodes(prev.nodes);
    setConnections(prev.connections);
    setHistoryIndex((i) => i - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setNodes(next.nodes);
    setConnections(next.connections);
    setHistoryIndex((i) => i + 1);
  }, [history, historyIndex]);

  // ── Load workflow ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!workflowId || workflowId === "new") return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/${workflowId}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Failed to load workflow");
        const json = await res.json();
        const data = json.data || json.workflow || json;
        setName(data.name || "Untitled Workflow");
        setDescription(data.description || "");
        setNodes(data.nodes || []);
        setConnections(data.connections || []);
        pushHistory(data.nodes || [], data.connections || []);
      } catch {
        // Continue with empty workflow
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add node ──────────────────────────────────────────────────────────
  const addNode = useCallback(
    (type: NodeType) => {
      const palette = NODE_PALETTE.find((p) => p.type === type);
      const newNode: WorkflowNode = {
        id: generateId(),
        type,
        label: palette?.label || type,
        description: palette?.description,
        config: {},
        position: {
          x: 100 + Math.random() * 200,
          y: 60 + nodes.length * 100
        },
        status: "idle"
      };
      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      setSelectedNodeId(newNode.id);
      pushHistory(newNodes, connections);
    },
    [nodes, connections, pushHistory],
  );

  // ── Delete node ───────────────────────────────────────────────────────
  const deleteNode = useCallback(
    (id: string) => {
      const newNodes = nodes.filter((n) => n.id !== id);
      const newConns = connections.filter((c) => c.fromNodeId !== id && c.toNodeId !== id);
      setNodes(newNodes);
      setConnections(newConns);
      if (selectedNodeId === id) setSelectedNodeId(null);
      pushHistory(newNodes, newConns);
    },
    [nodes, connections, selectedNodeId, pushHistory],
  );

  // ── Update node ───────────────────────────────────────────────────────
  const updateNode = useCallback(
    (id: string, patch: Partial<WorkflowNode>) => {
      const newNodes = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
      setNodes(newNodes);
      pushHistory(newNodes, connections);
    },
    [nodes, connections, pushHistory],
  );

  // ── Delete connection ─────────────────────────────────────────────────
  const deleteConnection = useCallback(
    (connId: string) => {
      const newConns = connections.filter((c) => c.id !== connId);
      setConnections(newConns);
      pushHistory(nodes, newConns);
    },
    [nodes, connections, pushHistory],
  );

  // ── Drag handling ─────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      e.preventDefault();
      setDraggingNodeId(nodeId);
      dragOffset.current = {
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      };
    },
    [nodes],
  );

  useEffect(() => {
    if (!draggingNodeId) return;

    const handleMove = (e: MouseEvent) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? {
                ...n,
                position: {
                  x: e.clientX - dragOffset.current.x,
                  y: e.clientY - dragOffset.current.y
                }
              }
            : n,
        ),
      );
    };

    const handleUp = () => {
      setDraggingNodeId(null);
      setNodes((current) => {
        pushHistory(current, connections);
        return current;
      });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggingNodeId, connections, pushHistory]);

  // ── Canvas click to connect or deselect ───────────────────────────────
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement) === canvasRef.current) {
        setSelectedNodeId(null);
        setConnectingFrom(null);
      }
    },
    [],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (connectingFrom && connectingFrom !== nodeId) {
        // Create connection
        const existing = connections.find(
          (c) => c.fromNodeId === connectingFrom && c.toNodeId === nodeId,
        );
        if (!existing) {
          const newConn: NodeConnection = {
            id: `conn-${Date.now()}`,
            fromNodeId: connectingFrom,
            toNodeId: nodeId
          };
          const newConns = [...connections, newConn];
          setConnections(newConns);
          pushHistory(nodes, newConns);
        }
        setConnectingFrom(null);
      }
      setSelectedNodeId(nodeId);
    },
    [connectingFrom, connections, nodes, pushHistory],
  );

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload: WorkflowData = {
        name,
        description,
        nodes,
        connections,
        triggerType: nodes.find((n) => n.type === "trigger")?.config?.triggerType as string || "manual",
        status: "draft"
      };

      const isNew = !workflowId || workflowId === "new";
      const url = isNew
        ? `${API_URL}/api/admin/omniflow/workflows`
        : `${API_URL}/api/admin/omniflow/workflows/${workflowId}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const json = await res.json();
      const id = json.id || json.workflow?.id || workflowId;
      onSave?.(id);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [name, description, nodes, connections, workflowId, onSave]);

  // ── Activate ──────────────────────────────────────────────────────────
  const handleActivate = useCallback(async () => {
    if (!workflowId || workflowId === "new") {
      await handleSave();
      return;
    }
    const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/${workflowId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ status: "active" })
    });
    if (!res.ok) setSaveError("Failed to activate");
  }, [workflowId, handleSave]);

  // ── Test run ──────────────────────────────────────────────────────────
  const handleTestRun = useCallback(async () => {
    if (!workflowId || workflowId === "new") return;
    await fetch(`${API_URL}/api/admin/omniflow/workflows/${workflowId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ testMode: true })
    });
  }, [workflowId]);

  // ── MUA conversational input ──────────────────────────────────────────
  const handleMuaSend = useCallback(async () => {
    if (!muaInput.trim()) return;
    setMuaSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/mua-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          prompt: muaInput,
          currentNodes: nodes,
          currentConnections: connections
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.nodes) {
          setNodes(json.nodes);
          setConnections(json.connections || connections);
          pushHistory(json.nodes, json.connections || connections);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setMuaSending(false);
      setMuaInput("");
    }
  }, [muaInput, nodes, connections, pushHistory]);

  // ── Load from pack ────────────────────────────────────────────────────
  const handleLoadPack = useCallback(async () => {
    openTab({
      type: "omniflow-dashboard",
      title: "OmniFlow Packs",
      icon: "workflow",
      entityType: "workflow",
      source: "user"
    });
  }, [openTab]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <Workflow className="h-4 w-4 text-red-400" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-zinc-200 outline-none placeholder-zinc-500"
            placeholder="Workflow name..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-4 w-px bg-zinc-700" />
          <button
            onClick={handleLoadPack}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Upload className="h-3 w-3" />
            Load Pack
          </button>
          <button
            onClick={handleTestRun}
            className="flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <Play className="h-3 w-3" />
            Test Run
          </button>
          <button
            onClick={handleActivate}
            className="flex items-center gap-1 rounded-md border border-emerald-700 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <Zap className="h-3 w-3" />
            Activate
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {saving ? <LoadingGlobe size="sm" /> : <Save className="h-3 w-3" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {saveError}
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: Node palette ─────────────────────────────────── */}
        <div className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-900/80">
          <div className="border-b border-zinc-800 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Layers className="mr-1.5 inline h-3 w-3" />
              Nodes
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {NODE_PALETTE.map((item) => {
                const Icon = NODE_ICONS[item.type];
                const colors = NODE_COLORS[item.type];
                return (
                  <button
                    key={item.type}
                    onClick={() => addNode(item.type)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-800/60"
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colors.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-300">{item.label}</p>
                      <p className="text-[10px] text-zinc-600">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Connect mode indicator */}
          {connectingFrom && (
            <div className="border-t border-zinc-800 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              Click a target node to connect...
              <button
                onClick={() => setConnectingFrom(null)}
                className="ml-1 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ── Center: Canvas ───────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col">
          <div
            ref={canvasRef}
            className="relative flex-1 overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgb(63_63_70/0.3)_1px,transparent_0)] [background-size:24px_24px]"
            onClick={handleCanvasClick}
          >
            {/* SVG connections layer */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {connections.map((conn) => {
                const fromNode = nodes.find((n) => n.id === conn.fromNodeId);
                const toNode = nodes.find((n) => n.id === conn.toNodeId);
                if (!fromNode || !toNode) return null;
                return (
                  <ConnectionLine
                    key={conn.id}
                    from={fromNode.position}
                    to={toNode.position}
                    onDelete={() => deleteConnection(conn.id)}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => handleNodeSelect(node.id)}
                onDragStart={(e) => handleDragStart(node.id, e)}
                onDelete={() => deleteNode(node.id)}
              />
            ))}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Workflow className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                  <p className="text-sm text-zinc-500">Click a node from the palette to add it</p>
                  <p className="mt-1 text-xs text-zinc-600">Or use the MUA input below to describe your workflow</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom: MUA conversation input ─────────────────────────── */}
          <div className="border-t border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-red-400" />
              <input
                type="text"
                value={muaInput}
                onChange={(e) => setMuaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMuaSend()}
                placeholder="Describe a step to add... (e.g. 'add an email notification after the trigger')"
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              />
              <button
                onClick={handleMuaSend}
                disabled={muaSending || !muaInput.trim()}
                className="flex items-center gap-1 rounded-md bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-40"
              >
                {muaSending ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>

        {/* ── Right panel: Node configuration ──────────────────────────── */}
        {selectedNode && (
          <div className="w-72">
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={(patch) => updateNode(selectedNode.id, patch)}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

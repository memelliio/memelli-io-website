'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Phone, Plus, Trash2, Save, Play, Pause, Download, Upload,
  Volume2, Users, ArrowRight, Voicemail, Music, Bot, Settings,
  GripVertical, X, Copy, ChevronDown, Eye, PhoneCall,
  Hash, GitBranch, PhoneForwarded, Headphones, Mic,
  Zap, RotateCcw, Check, AlertCircle, RefreshCw, Loader2,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardContent,
  Modal,
  Input,
  Select,
} from '@memelli/ui';
import { toast } from 'sonner';
import { API_URL } from '@/lib/config';

/* ════════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════ */

type NodeType = 'greeting' | 'menu' | 'transfer' | 'voicemail' | 'ai_agent' | 'hold_music' | 'hangup' | 'condition';

interface IvrConnection {
  fromNodeId: string;
  fromPort: string;
  toNodeId: string;
}

interface MenuOption {
  key: string;
  label: string;
  targetNodeId: string | null;
}

interface IvrNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
}

interface IvrConfig {
  id: string;
  name: string;
  description: string;
  nodes: IvrNode[];
  connections: IvrConnection[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/* ════════════════════════════════════════════════════════════════════════
   API helpers
   ════════════════════════════════════════════════════════════════════ */

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Encode the full IvrConfig (minus id/createdAt) into the API body shape */
function toApiBody(name: string, description: string, nodes: IvrNode[], connections: IvrConnection[]) {
  // We store nodes + connections as a single serialized item in the options array
  // greetingText holds the description, options holds the flow data
  return {
    name,
    greetingText: description,
    options: [{ __flow: true, nodes, connections }],
  };
}

/** Decode an API response item back to IvrConfig */
function fromApiItem(item: any): IvrConfig {
  const options: any[] = Array.isArray(item.items) ? item.items : [];
  const flowItem = options.find((o: any) => o.__flow === true);
  return {
    id: item.id,
    name: item.name ?? 'Untitled',
    description: item.greetingText ?? '',
    nodes: flowItem?.nodes ?? [],
    connections: flowItem?.connections ?? [],
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
    isActive: item.enabled ?? false,
  };
}

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/comms/ivr${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json;
}

/* ════════════════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════════════ */

const NODE_WIDTH = 240;
const NODE_HEIGHT_BASE = 56;

const NODE_META: Record<NodeType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
}> = {
  greeting: {
    label: 'Greeting',
    icon: <Volume2 className="h-4 w-4" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/[0.06]',
    description: 'Play welcome message',
  },
  menu: {
    label: 'Menu',
    icon: <Hash className="h-4 w-4" />,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/[0.06]',
    description: 'Press 1 for Sales, 2 for Support...',
  },
  transfer: {
    label: 'Transfer',
    icon: <PhoneForwarded className="h-4 w-4" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/[0.06]',
    description: 'Transfer to agent or number',
  },
  voicemail: {
    label: 'Voicemail',
    icon: <Voicemail className="h-4 w-4" />,
    color: 'text-primary',
    borderColor: 'border-primary/30',
    bgColor: 'bg-primary/80/[0.06]',
    description: 'Send to voicemail box',
  },
  ai_agent: {
    label: 'AI Agent',
    icon: <Bot className="h-4 w-4" />,
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/[0.06]',
    description: 'AI-powered voice agent',
  },
  hold_music: {
    label: 'Hold Music',
    icon: <Music className="h-4 w-4" />,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/[0.06]',
    description: 'Play hold music or message',
  },
  hangup: {
    label: 'Hang Up',
    icon: <Phone className="h-4 w-4" />,
    color: 'text-muted-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/[0.06]',
    description: 'End the call',
  },
  condition: {
    label: 'Condition',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/[0.06]',
    description: 'Branch on business hours, etc.',
  },
};

const PALETTE_ITEMS: { type: NodeType; group: string }[] = [
  { type: 'greeting', group: 'Input' },
  { type: 'menu', group: 'Routing' },
  { type: 'condition', group: 'Routing' },
  { type: 'transfer', group: 'Actions' },
  { type: 'voicemail', group: 'Actions' },
  { type: 'ai_agent', group: 'Actions' },
  { type: 'hold_music', group: 'Actions' },
  { type: 'hangup', group: 'Actions' },
];

function genId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ════════════════════════════════════════════════════════════════════════
   Default configs
   ════════════════════════════════════════════════════════════════════ */

function defaultNodeConfig(type: NodeType): Record<string, unknown> {
  switch (type) {
    case 'greeting':
      return { message: 'Thank you for calling. Your call is important to us.', voice: 'jessica', timeout: 5 };
    case 'menu':
      return {
        prompt: 'Press 1 for Sales, 2 for Support, 0 for Main Menu.',
        options: [
          { key: '1', label: 'Sales', targetNodeId: null },
          { key: '2', label: 'Support', targetNodeId: null },
          { key: '0', label: 'Main Menu', targetNodeId: null },
        ] as MenuOption[],
        timeout: 10,
        maxRetries: 3,
      };
    case 'transfer':
      return { target: '', department: 'Sales', ringTimeout: 30, announceTransfer: true };
    case 'voicemail':
      return { greeting: 'Please leave a message after the tone.', maxDuration: 120, transcribe: true, notifyEmail: '' };
    case 'ai_agent':
      return { agentName: 'Melli', personality: 'friendly', systemPrompt: '', maxDuration: 300, escalateOn: 'request' };
    case 'hold_music':
      return { track: 'default', message: 'Please hold. An agent will be with you shortly.', estimateWait: true, maxHold: 300 };
    case 'hangup':
      return { message: 'Thank you for calling. Goodbye.', playMessage: true };
    case 'condition':
      return { type: 'business_hours', trueLabel: 'Open', falseLabel: 'Closed', schedule: '9am-5pm Mon-Fri' };
    default:
      return {};
  }
}

/* ════════════════════════════════════════════════════════════════════════
   SVG Connection Line
   ════════════════════════════════════════════════════════════════════ */

function ConnectionLine({
  x1, y1, x2, y2, color = 'rgba(255,255,255,0.12)', animated = false,
}: { x1: number; y1: number; x2: number; y2: number; color?: string; animated?: boolean }) {
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  return (
    <>
      <path d={d} stroke={color} strokeWidth={2} fill="none" opacity={0.6} />
      {animated && (
        <circle r={3} fill={color} opacity={0.9}>
          <animateMotion dur="2s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Flow Node Component
   ════════════════════════════════════════════════════════════════════ */

function FlowNode({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDelete,
  onStartConnect,
  isConnecting,
  onConnectTarget,
}: {
  node: IvrNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onStartConnect: (port: string) => void;
  isConnecting: boolean;
  onConnectTarget: () => void;
}) {
  const meta = NODE_META[node.type];
  const menuOptions = node.type === 'menu' ? (node.config.options as MenuOption[] || []) : [];
  const nodeHeight = node.type === 'menu'
    ? NODE_HEIGHT_BASE + 24 + menuOptions.length * 28
    : NODE_HEIGHT_BASE + 24;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className="cursor-grab active:cursor-grabbing"
    >
      {/* Drop target for connections */}
      {isConnecting && (
        <rect
          x={-4}
          y={-4}
          width={NODE_WIDTH + 8}
          height={nodeHeight + 8}
          rx={18}
          fill="transparent"
          stroke="rgba(239,68,68,0.4)"
          strokeWidth={2}
          strokeDasharray="6 3"
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onConnectTarget(); }}
        />
      )}

      {/* Node body */}
      <rect
        width={NODE_WIDTH}
        height={nodeHeight}
        rx={14}
        fill={isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,27,0.9)'}
        stroke={isSelected ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)'}
        strokeWidth={isSelected ? 2 : 1}
        className="transition-all duration-150"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }}
      />

      {/* Header bar */}
      <rect
        x={1}
        y={1}
        width={NODE_WIDTH - 2}
        height={36}
        rx={13}
        fill="rgba(255,255,255,0.03)"
        className="pointer-events-none"
      />

      {/* Icon */}
      <foreignObject x={12} y={8} width={20} height={20} className="pointer-events-none">
        <div className={meta.color}>{meta.icon}</div>
      </foreignObject>

      {/* Label */}
      <text x={38} y={23} fill="rgba(244,244,245,0.9)" fontSize={13} fontWeight={600} className="pointer-events-none">
        {node.label.length > 22 ? node.label.slice(0, 22) + '...' : node.label}
      </text>

      {/* Type badge */}
      <text x={NODE_WIDTH - 12} y={23} fill="rgba(161,161,170,0.5)" fontSize={10} fontWeight={500} textAnchor="end" className="pointer-events-none">
        {meta.label}
      </text>

      {/* Sub-info */}
      {node.type === 'greeting' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          {((node.config.message as string) || '').slice(0, 30)}...
        </text>
      )}
      {node.type === 'transfer' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          Dept: {(node.config.department as string) || 'Unset'}
        </text>
      )}
      {node.type === 'ai_agent' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          Agent: {(node.config.agentName as string) || 'Melli'}
        </text>
      )}
      {node.type === 'voicemail' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          Max: {node.config.maxDuration as number}s | Transcribe: {node.config.transcribe ? 'On' : 'Off'}
        </text>
      )}
      {node.type === 'hold_music' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          Track: {(node.config.track as string) || 'default'}
        </text>
      )}
      {node.type === 'condition' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          {(node.config.schedule as string) || 'Always'}
        </text>
      )}
      {node.type === 'hangup' && (
        <text x={12} y={56} fill="rgba(161,161,170,0.6)" fontSize={11} className="pointer-events-none">
          {node.config.playMessage ? 'With goodbye msg' : 'Silent'}
        </text>
      )}

      {/* Menu options list */}
      {node.type === 'menu' && menuOptions.map((opt, i) => (
        <g key={opt.key} transform={`translate(0, ${NODE_HEIGHT_BASE + 8 + i * 28})`}>
          <rect x={12} y={0} width={NODE_WIDTH - 24} height={24} rx={6} fill="rgba(255,255,255,0.03)" className="pointer-events-none" />
          <text x={24} y={16} fill="rgba(59,130,246,0.8)" fontSize={12} fontWeight={700} className="pointer-events-none">
            {opt.key}
          </text>
          <text x={42} y={16} fill="rgba(161,161,170,0.7)" fontSize={11} className="pointer-events-none">
            {opt.label}
          </text>
          {/* Output port for each menu option */}
          <circle
            cx={NODE_WIDTH - 12}
            cy={12}
            r={6}
            fill="rgba(59,130,246,0.15)"
            stroke="rgba(59,130,246,0.4)"
            strokeWidth={1.5}
            className="cursor-pointer hover:fill-blue-500/30 transition-all"
            onClick={(e) => { e.stopPropagation(); onStartConnect(opt.key); }}
          />
        </g>
      ))}

      {/* Input port (top center) */}
      {node.type !== 'greeting' && (
        <circle
          cx={NODE_WIDTH / 2}
          cy={0}
          r={6}
          fill={isConnecting ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}
          stroke={isConnecting ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.15)'}
          strokeWidth={1.5}
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onConnectTarget(); }}
        />
      )}

      {/* Output port (bottom center) — for non-menu nodes */}
      {node.type !== 'hangup' && node.type !== 'menu' && (
        <circle
          cx={NODE_WIDTH / 2}
          cy={nodeHeight}
          r={6}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
          className="cursor-pointer hover:fill-red-500/30 transition-all"
          onClick={(e) => { e.stopPropagation(); onStartConnect('out'); }}
        />
      )}

      {/* Condition true/false ports */}
      {node.type === 'condition' && (
        <>
          <circle
            cx={NODE_WIDTH * 0.25}
            cy={nodeHeight}
            r={6}
            fill="rgba(34,197,94,0.15)"
            stroke="rgba(34,197,94,0.4)"
            strokeWidth={1.5}
            className="cursor-pointer hover:fill-green-500/30 transition-all"
            onClick={(e) => { e.stopPropagation(); onStartConnect('true'); }}
          />
          <text x={NODE_WIDTH * 0.25} y={nodeHeight + 16} fill="rgba(34,197,94,0.6)" fontSize={9} textAnchor="middle" className="pointer-events-none">
            Yes
          </text>
          <circle
            cx={NODE_WIDTH * 0.75}
            cy={nodeHeight}
            r={6}
            fill="rgba(239,68,68,0.15)"
            stroke="rgba(239,68,68,0.4)"
            strokeWidth={1.5}
            className="cursor-pointer hover:fill-red-500/30 transition-all"
            onClick={(e) => { e.stopPropagation(); onStartConnect('false'); }}
          />
          <text x={NODE_WIDTH * 0.75} y={nodeHeight + 16} fill="rgba(239,68,68,0.6)" fontSize={9} textAnchor="middle" className="pointer-events-none">
            No
          </text>
        </>
      )}

      {/* Delete button */}
      {isSelected && (
        <foreignObject x={NODE_WIDTH - 28} y={-10} width={22} height={22}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-[22px] w-[22px] rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all duration-150"
          >
            <X className="h-3 w-3 text-white" />
          </button>
        </foreignObject>
      )}
    </g>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════════════════ */

export default function IvrFlowBuilderPage() {
  /* ── State ── */
  const [configs, setConfigs] = useState<IvrConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<IvrNode[]>([]);
  const [connections, setConnections] = useState<IvrConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; port: string } | null>(null);
  const [configName, setConfigName] = useState('');
  const [configDesc, setConfigDesc] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [testCallActive, setTestCallActive] = useState(false);
  const [testCallStep, setTestCallStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  /* ── API loading state ── */
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Fetch IVR configs from API on mount ── */
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const json = await apiFetch('/');
      const data: IvrConfig[] = (json.data ?? []).map(fromApiItem);
      setConfigs(data);
    } catch (err: any) {
      toast.error(`Failed to load IVR configs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  /* ── Active config ── */
  const activeConfig = configs.find(c => c.id === activeConfigId);

  /* ── Selected node ── */
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  /* ── Get node output port position ── */
  const getOutputPos = useCallback((nodeId: string, port: string): { x: number; y: number } => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const menuOptions = node.type === 'menu' ? (node.config.options as MenuOption[] || []) : [];
    const nodeHeight = node.type === 'menu'
      ? NODE_HEIGHT_BASE + 24 + menuOptions.length * 28
      : NODE_HEIGHT_BASE + 24;

    if (node.type === 'menu') {
      const optIndex = menuOptions.findIndex(o => o.key === port);
      if (optIndex >= 0) {
        return {
          x: node.x + NODE_WIDTH - 12,
          y: node.y + NODE_HEIGHT_BASE + 8 + optIndex * 28 + 12,
        };
      }
    }
    if (node.type === 'condition') {
      if (port === 'true') return { x: node.x + NODE_WIDTH * 0.25, y: node.y + nodeHeight };
      if (port === 'false') return { x: node.x + NODE_WIDTH * 0.75, y: node.y + nodeHeight };
    }
    return { x: node.x + NODE_WIDTH / 2, y: node.y + nodeHeight };
  }, [nodes]);

  /* ── Get node input port position ── */
  const getInputPos = useCallback((nodeId: string): { x: number; y: number } => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + NODE_WIDTH / 2, y: node.y };
  }, [nodes]);

  /* ── Drag handling ── */
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const mouseX = (e.clientX - rect.left - panOffset.x) / zoom;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoom;
    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
    setSelectedNodeId(nodeId);
    setIsDragging(true);
  }, [nodes, panOffset, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - panOffset.x) / zoom;
      const mouseY = (e.clientY - rect.top - panOffset.y) / zoom;
      setNodes(prev => prev.map(n =>
        n.id === selectedNodeId
          ? { ...n, x: Math.round((mouseX - dragOffset.x) / 20) * 20, y: Math.round((mouseY - dragOffset.y) / 20) * 20 }
          : n
      ));
    }
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isDragging, selectedNodeId, dragOffset, panOffset, zoom, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as SVGElement).tagName === 'rect' && (e.target as SVGElement).getAttribute('data-canvas') === 'true') {
      setSelectedNodeId(null);
      setConnectingFrom(null);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setIsPanning(true);
    }
  }, [panOffset]);

  /* ── Zoom ── */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(2, prev - e.deltaY * 0.001)));
  }, []);

  /* ── Add node from palette ── */
  const addNode = useCallback((type: NodeType) => {
    const id = genId();
    const meta = NODE_META[type];
    const existingOfType = nodes.filter(n => n.type === type).length;
    const label = existingOfType > 0 ? `${meta.label} ${existingOfType + 1}` : meta.label;

    // Place in center of visible area
    const centerX = (-panOffset.x / zoom) + 300;
    const centerY = (-panOffset.y / zoom) + 200 + nodes.length * 40;

    const newNode: IvrNode = {
      id,
      type,
      label,
      x: Math.round(centerX / 20) * 20,
      y: Math.round(centerY / 20) * 20,
      config: defaultNodeConfig(type),
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
    toast.success(`Added ${meta.label} node`);
  }, [nodes, panOffset, zoom]);

  /* ── Connect nodes ── */
  const startConnect = useCallback((nodeId: string, port: string) => {
    setConnectingFrom({ nodeId, port });
  }, []);

  const completeConnect = useCallback((targetNodeId: string) => {
    if (!connectingFrom) return;
    if (connectingFrom.nodeId === targetNodeId) return;
    // Check for duplicate
    const exists = connections.some(
      c => c.fromNodeId === connectingFrom.nodeId && c.fromPort === connectingFrom.port && c.toNodeId === targetNodeId
    );
    if (exists) {
      toast.error('Connection already exists');
      setConnectingFrom(null);
      return;
    }
    setConnections(prev => [...prev, {
      fromNodeId: connectingFrom.nodeId,
      fromPort: connectingFrom.port,
      toNodeId: targetNodeId,
    }]);
    setConnectingFrom(null);
    toast.success('Connected');
  }, [connectingFrom, connections]);

  /* ── Delete node ── */
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    toast.success('Node removed');
  }, [selectedNodeId]);

  /* ── Update node config ── */
  const updateNodeConfig = useCallback((nodeId: string, key: string, value: unknown) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n
    ));
  }, []);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, label } : n
    ));
  }, []);

  /* ── Save to API ── */
  const handleSave = useCallback(async () => {
    if (!configName.trim()) return;
    setIsSaving(true);
    try {
      const body = toApiBody(configName.trim(), configDesc.trim(), nodes, connections);
      let saved: any;

      if (activeConfigId) {
        // PATCH existing
        const json = await apiFetch(`/${activeConfigId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        saved = fromApiItem(json.data);
        setConfigs(prev => prev.map(c => c.id === activeConfigId ? saved : c));
      } else {
        // POST new
        const json = await apiFetch('/', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        saved = fromApiItem(json.data);
        setConfigs(prev => [...prev, saved]);
        setActiveConfigId(saved.id);
      }

      setSaveModalOpen(false);
      toast.success('IVR configuration saved');
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [configName, configDesc, nodes, connections, activeConfigId]);

  /* ── Load config into canvas ── */
  const handleLoad = useCallback((config: IvrConfig) => {
    setNodes(config.nodes);
    setConnections(config.connections);
    setActiveConfigId(config.id);
    setConfigName(config.name);
    setConfigDesc(config.description);
    setLoadModalOpen(false);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    toast.success(`Loaded: ${config.name}`);
  }, []);

  /* ── Delete config via API ── */
  const handleDeleteConfig = useCallback(async (configId: string) => {
    setIsDeleting(configId);
    try {
      await apiFetch(`/${configId}`, { method: 'DELETE' });
      setConfigs(prev => prev.filter(c => c.id !== configId));
      if (activeConfigId === configId) {
        setActiveConfigId(null);
        setNodes([]);
        setConnections([]);
        setConfigName('');
        setConfigDesc('');
      }
      toast.success('Configuration deleted');
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  }, [activeConfigId]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ nodes, connections, name: configName, description: configDesc }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ivr-flow-${configName || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported IVR flow');
  }, [nodes, connections, configName, configDesc]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.connections) {
            setNodes(data.nodes);
            setConnections(data.connections);
            setConfigName(data.name || 'Imported Flow');
            setConfigDesc(data.description || '');
            setPanOffset({ x: 0, y: 0 });
            setZoom(1);
            setActiveConfigId(null); // treat as new unsaved flow
            toast.success('Imported IVR flow');
          }
        } catch {
          toast.error('Invalid IVR flow file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  /* ── New flow ── */
  const handleNewFlow = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setActiveConfigId(null);
    setConfigName('');
    setConfigDesc('');
    setSelectedNodeId(null);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    toast.success('New flow created');
  }, []);

  /* ── Test call simulation ── */
  const simulateTestCall = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add nodes before testing');
      return;
    }
    setTestCallActive(true);
    setTestCallStep(0);
    setPreviewMode(true);

    // Walk through greeting -> first menu -> done
    const greetingNode = nodes.find(n => n.type === 'greeting');
    if (!greetingNode) {
      toast.error('Add a Greeting node to start the flow');
      setTestCallActive(false);
      setPreviewMode(false);
      return;
    }

    let step = 0;
    const walkSteps = [greetingNode.id];

    // Find what's connected to greeting
    const nextConn = connections.find(c => c.fromNodeId === greetingNode.id);
    if (nextConn) walkSteps.push(nextConn.toNodeId);

    const interval = setInterval(() => {
      step++;
      if (step >= walkSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setTestCallActive(false);
          setPreviewMode(false);
          toast.success('Test call complete');
        }, 2000);
        return;
      }
      setTestCallStep(step);
      setSelectedNodeId(walkSteps[step]);
    }, 3000);

    setSelectedNodeId(walkSteps[0]);
    return () => clearInterval(interval);
  }, [nodes, connections]);

  /* ── Flow validation ── */
  const flowErrors = useMemo(() => {
    const errs: string[] = [];
    const hasGreeting = nodes.some(n => n.type === 'greeting');
    if (!hasGreeting && nodes.length > 0) errs.push('Missing Greeting node');
    // Check for disconnected nodes
    nodes.forEach(n => {
      if (n.type === 'greeting') return;
      const hasIncoming = connections.some(c => c.toNodeId === n.id);
      if (!hasIncoming) errs.push(`${n.label} has no incoming connection`);
    });
    return errs;
  }, [nodes, connections]);

  /* ── Node count stats ── */
  const nodeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });
    return counts;
  }, [nodes]);

  /* ════════════════════════════════════════════════════════════════════
     Render
     ════════════════════════════════════════════════════════════════ */

  return (
    <div className="bg-card min-h-screen">
      <div className="p-8 space-y-6">
        <PageHeader
          title="IVR Flow Builder"
          subtitle="Visual drag-and-drop interactive voice response designer"
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'IVR Flow Builder' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {flowErrors.length > 0 && (
                <Badge className="text-[11px] bg-amber-500/[0.08] text-amber-300 border-amber-400/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {flowErrors.length} issue{flowErrors.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                size="sm"
                onClick={fetchConfigs}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                {!isLoading && 'Refresh'}
              </Button>
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                size="sm"
                onClick={handleNewFlow}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" /> New
              </Button>
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                size="sm"
                onClick={() => setLoadModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-1.5" /> Load
              </Button>
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                size="sm"
                onClick={() => {
                  if (!configName) setConfigName(activeConfig?.name || 'New IVR Flow');
                  setSaveModalOpen(true);
                }}
              >
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-1.5" /> Export
              </Button>
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                size="sm"
                onClick={handleImport}
              >
                <Upload className="h-4 w-4 mr-1.5" /> Import
              </Button>
              <Button
                className={`rounded-xl transition-all duration-200 ${
                  testCallActive
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                size="sm"
                onClick={simulateTestCall}
                disabled={testCallActive}
              >
                {testCallActive ? (
                  <><Pause className="h-4 w-4 mr-1.5" /> Testing...</>
                ) : (
                  <><PhoneCall className="h-4 w-4 mr-1.5" /> Test Call</>
                )}
              </Button>
            </div>
          }
        />

        {/* ── Main Layout: Palette + Canvas + Properties ── */}
        <div className="flex gap-4 h-[calc(100vh-220px)]">

          {/* ── Left: Node Palette ── */}
          <div className="w-[220px] shrink-0 space-y-3">
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Nodes</p>
                <div className="space-y-2">
                  {PALETTE_ITEMS.map(({ type }) => {
                    const meta = NODE_META[type];
                    return (
                      <button
                        key={type}
                        onClick={() => addNode(type)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border ${meta.borderColor} ${meta.bgColor} hover:bg-white/[0.06] transition-all duration-150 group text-left`}
                      >
                        <div className={meta.color}>{meta.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{meta.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{meta.description}</p>
                        </div>
                        <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Flow Stats</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Nodes</span>
                    <span className="text-foreground font-medium">{nodes.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Connections</span>
                    <span className="text-foreground font-medium">{connections.length}</span>
                  </div>
                  {Object.entries(nodeStats).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className={NODE_META[type as NodeType]?.color || 'text-muted-foreground'}>
                        {NODE_META[type as NodeType]?.label || type}
                      </span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Validation Errors */}
                {flowErrors.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <p className="text-[11px] uppercase tracking-wider text-amber-500 font-medium mb-2">Issues</p>
                    {flowErrors.map((err, i) => (
                      <p key={i} className="text-[10px] text-amber-400/70 mb-1 flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Active config indicator */}
                {activeConfig && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <p className="text-[10px] text-muted-foreground">Editing:</p>
                    <p className="text-[11px] text-blue-400 font-medium truncate">{activeConfig.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Center: Canvas ── */}
          <div
            ref={containerRef}
            className="flex-1 relative rounded-2xl border border-white/[0.04] bg-card overflow-hidden"
          >
            {/* Canvas toolbar */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className="flex items-center gap-1 bg-card backdrop-blur-xl rounded-xl border border-white/[0.06] px-2 py-1">
                <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="text-muted-foreground hover:text-foreground px-1.5 py-0.5 text-xs font-medium transition-colors">+</button>
                <span className="text-muted-foreground text-[10px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))} className="text-muted-foreground hover:text-foreground px-1.5 py-0.5 text-xs font-medium transition-colors">-</button>
                <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="text-muted-foreground hover:text-foreground px-1.5 py-0.5 text-[10px] transition-colors border-l border-white/[0.06] ml-1">Reset</button>
              </div>
              {connectingFrom && (
                <div className="bg-red-600/20 backdrop-blur-xl rounded-xl border border-red-500/30 px-3 py-1.5">
                  <p className="text-[10px] text-red-300 font-medium">Click a target node to connect</p>
                </div>
              )}
              {testCallActive && (
                <div className="bg-amber-600/20 backdrop-blur-xl rounded-xl border border-amber-500/30 px-3 py-1.5 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] text-amber-300 font-medium">Test call in progress...</p>
                </div>
              )}
            </div>

            {/* Grid pattern */}
            <svg
              ref={canvasRef}
              className="w-full h-full"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
              style={{ cursor: isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : 'default' }}
            >
              <defs>
                <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom})`}>
                  <circle cx={1} cy={1} r={0.5} fill="rgba(255,255,255,0.04)" />
                </pattern>
                <pattern id="grid-large" width={100} height={100} patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom})`}>
                  <circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.06)" />
                </pattern>
              </defs>

              {/* Background canvas target */}
              <rect data-canvas="true" width="100%" height="100%" fill="url(#grid)" />
              <rect data-canvas="true" width="100%" height="100%" fill="url(#grid-large)" />

              <g transform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom})`}>
                {/* Connections */}
                {connections.map((conn, i) => {
                  const from = getOutputPos(conn.fromNodeId, conn.fromPort);
                  const to = getInputPos(conn.toNodeId);
                  const fromNode = nodes.find(n => n.id === conn.fromNodeId);
                  let color = 'rgba(255,255,255,0.12)';
                  if (fromNode?.type === 'condition') {
                    color = conn.fromPort === 'true' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)';
                  } else if (fromNode?.type === 'menu') {
                    color = 'rgba(59,130,246,0.4)';
                  }
                  return (
                    <g key={i}>
                      <ConnectionLine
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        color={color}
                        animated={previewMode}
                      />
                      {/* Delete connection on click */}
                      <line
                        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="transparent" strokeWidth={12}
                        className="cursor-pointer"
                        onClick={() => {
                          setConnections(prev => prev.filter((_, ci) => ci !== i));
                          toast.success('Connection removed');
                        }}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map(node => (
                  <FlowNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onSelect={() => setSelectedNodeId(node.id)}
                    onDragStart={(e) => handleNodeDragStart(node.id, e)}
                    onDelete={() => deleteNode(node.id)}
                    onStartConnect={(port) => startConnect(node.id, port)}
                    isConnecting={!!connectingFrom && connectingFrom.nodeId !== node.id}
                    onConnectTarget={() => completeConnect(node.id)}
                  />
                ))}
              </g>
            </svg>

            {/* Empty state */}
            {nodes.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <GitBranch className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">No nodes yet</p>
                  <p className="text-muted-foreground text-xs">Click nodes from the palette or Load a saved IVR flow</p>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            )}
          </div>

          {/* ── Right: Properties Panel ── */}
          <div className="w-[280px] shrink-0">
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl h-full overflow-y-auto">
              <CardContent className="p-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/[0.04]">
                      <div className={`h-8 w-8 rounded-xl ${NODE_META[selectedNode.type].bgColor} ${NODE_META[selectedNode.type].borderColor} border flex items-center justify-center`}>
                        <span className={NODE_META[selectedNode.type].color}>{NODE_META[selectedNode.type].icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{NODE_META[selectedNode.type].label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{selectedNode.id}</p>
                      </div>
                    </div>

                    {/* Node label */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Label</label>
                      <input
                        type="text"
                        value={selectedNode.label}
                        onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                        className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                      />
                    </div>

                    {/* Type-specific config */}
                    {selectedNode.type === 'greeting' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Message</label>
                          <textarea
                            value={(selectedNode.config.message as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'message', e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Voice</label>
                          <select
                            value={(selectedNode.config.voice as string) || 'melli'}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'voice', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                          >
                            <option value="melli">Melli (Aurora)</option>
                            <option value="default">System Default</option>
                            <option value="male">Male Voice</option>
                            <option value="female">Female Voice</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Timeout (sec)</label>
                          <input
                            type="number"
                            value={(selectedNode.config.timeout as number) || 5}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'timeout', parseInt(e.target.value))}
                            min={1}
                            max={30}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                          />
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'menu' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Prompt</label>
                          <textarea
                            value={(selectedNode.config.prompt as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'prompt', e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Menu Options</label>
                          <div className="space-y-2">
                            {((selectedNode.config.options as MenuOption[]) || []).map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-mono text-blue-400 font-semibold shrink-0">
                                  {opt.key}
                                </span>
                                <input
                                  type="text"
                                  value={opt.label}
                                  onChange={(e) => {
                                    const opts = [...(selectedNode.config.options as MenuOption[])];
                                    opts[i] = { ...opts[i], label: e.target.value };
                                    updateNodeConfig(selectedNode.id, 'options', opts);
                                  }}
                                  className="flex-1 rounded-lg border border-white/[0.04] bg-card px-2 py-1.5 text-xs text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                                />
                                <button
                                  onClick={() => {
                                    const opts = (selectedNode.config.options as MenuOption[]).filter((_, j) => j !== i);
                                    updateNodeConfig(selectedNode.id, 'options', opts);
                                  }}
                                  className="text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const opts = [...(selectedNode.config.options as MenuOption[])];
                                const nextKey = String(opts.length + 1);
                                opts.push({ key: nextKey, label: `Option ${nextKey}`, targetNodeId: null });
                                updateNodeConfig(selectedNode.id, 'options', opts);
                              }}
                              className="w-full rounded-lg border border-dashed border-white/[0.08] px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-all"
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Timeout</label>
                            <input
                              type="number"
                              value={(selectedNode.config.timeout as number) || 10}
                              onChange={(e) => updateNodeConfig(selectedNode.id, 'timeout', parseInt(e.target.value))}
                              min={1}
                              max={60}
                              className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Retries</label>
                            <input
                              type="number"
                              value={(selectedNode.config.maxRetries as number) || 3}
                              onChange={(e) => updateNodeConfig(selectedNode.id, 'maxRetries', parseInt(e.target.value))}
                              min={0}
                              max={5}
                              className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'transfer' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Department</label>
                          <select
                            value={(selectedNode.config.department as string) || 'Sales'}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'department', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          >
                            <option value="Sales">Sales</option>
                            <option value="Support">Support</option>
                            <option value="Billing">Billing</option>
                            <option value="Technical">Technical</option>
                            <option value="Custom">Custom Number</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Target Number</label>
                          <input
                            type="text"
                            value={(selectedNode.config.target as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'target', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Ring Timeout (sec)</label>
                          <input
                            type="number"
                            value={(selectedNode.config.ringTimeout as number) || 30}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'ringTimeout', parseInt(e.target.value))}
                            min={5}
                            max={120}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedNode.config.announceTransfer as boolean) ?? true}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'announceTransfer', e.target.checked)}
                            className="rounded border-white/[0.1] bg-muted text-red-500 focus:ring-red-500/20"
                          />
                          <span className="text-xs text-muted-foreground">Announce transfer to caller</span>
                        </label>
                      </>
                    )}

                    {selectedNode.type === 'voicemail' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Greeting</label>
                          <textarea
                            value={(selectedNode.config.greeting as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'greeting', e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Max Duration (sec)</label>
                          <input
                            type="number"
                            value={(selectedNode.config.maxDuration as number) || 120}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'maxDuration', parseInt(e.target.value))}
                            min={10}
                            max={600}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Notify Email</label>
                          <input
                            type="email"
                            value={(selectedNode.config.notifyEmail as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'notifyEmail', e.target.value)}
                            placeholder="team@company.com"
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedNode.config.transcribe as boolean) ?? true}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'transcribe', e.target.checked)}
                            className="rounded border-white/[0.1] bg-muted text-red-500 focus:ring-red-500/20"
                          />
                          <span className="text-xs text-muted-foreground">Auto-transcribe messages</span>
                        </label>
                      </>
                    )}

                    {selectedNode.type === 'ai_agent' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Agent Name</label>
                          <input
                            type="text"
                            value={(selectedNode.config.agentName as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'agentName', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Personality</label>
                          <select
                            value={(selectedNode.config.personality as string) || 'friendly'}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'personality', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          >
                            <option value="friendly">Friendly</option>
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="empathetic">Empathetic</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">System Prompt</label>
                          <textarea
                            value={(selectedNode.config.systemPrompt as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'systemPrompt', e.target.value)}
                            rows={3}
                            placeholder="You are a helpful voice agent..."
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Max Duration (sec)</label>
                          <input
                            type="number"
                            value={(selectedNode.config.maxDuration as number) || 300}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'maxDuration', parseInt(e.target.value))}
                            min={30}
                            max={1800}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Escalate On</label>
                          <select
                            value={(selectedNode.config.escalateOn as string) || 'request'}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'escalateOn', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          >
                            <option value="request">Caller Request</option>
                            <option value="frustration">Frustration Detected</option>
                            <option value="timeout">Timeout</option>
                            <option value="never">Never</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'hold_music' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Track</label>
                          <select
                            value={(selectedNode.config.track as string) || 'default'}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'track', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          >
                            <option value="default">Default</option>
                            <option value="classical">Classical</option>
                            <option value="jazz">Jazz</option>
                            <option value="ambient">Ambient</option>
                            <option value="custom">Custom Upload</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Hold Message</label>
                          <textarea
                            value={(selectedNode.config.message as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'message', e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Max Hold (sec)</label>
                          <input
                            type="number"
                            value={(selectedNode.config.maxHold as number) || 300}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'maxHold', parseInt(e.target.value))}
                            min={30}
                            max={1800}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedNode.config.estimateWait as boolean) ?? true}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'estimateWait', e.target.checked)}
                            className="rounded border-white/[0.1] bg-muted text-red-500 focus:ring-red-500/20"
                          />
                          <span className="text-xs text-muted-foreground">Announce estimated wait time</span>
                        </label>
                      </>
                    )}

                    {selectedNode.type === 'hangup' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Goodbye Message</label>
                          <textarea
                            value={(selectedNode.config.message as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'message', e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all resize-none"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedNode.config.playMessage as boolean) ?? true}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'playMessage', e.target.checked)}
                            className="rounded border-white/[0.1] bg-muted text-red-500 focus:ring-red-500/20"
                          />
                          <span className="text-xs text-muted-foreground">Play goodbye message</span>
                        </label>
                      </>
                    )}

                    {selectedNode.type === 'condition' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Condition Type</label>
                          <select
                            value={(selectedNode.config.type as string) || 'business_hours'}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'type', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          >
                            <option value="business_hours">Business Hours</option>
                            <option value="holiday">Holiday</option>
                            <option value="queue_length">Queue Length</option>
                            <option value="time_of_day">Time of Day</option>
                            <option value="caller_id">Caller ID Match</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Schedule / Value</label>
                          <input
                            type="text"
                            value={(selectedNode.config.schedule as string) || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, 'schedule', e.target.value)}
                            placeholder="9am-5pm Mon-Fri"
                            className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">True Label</label>
                            <input
                              type="text"
                              value={(selectedNode.config.trueLabel as string) || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, 'trueLabel', e.target.value)}
                              className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">False Label</label>
                            <input
                              type="text"
                              value={(selectedNode.config.falseLabel as string) || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, 'falseLabel', e.target.value)}
                              className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Position */}
                    <div className="pt-3 border-t border-white/[0.04]">
                      <p className="text-[10px] text-muted-foreground">
                        Position: {selectedNode.x}, {selectedNode.y}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Settings className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Node Properties</p>
                    <p className="text-xs text-muted-foreground mt-1">Select a node to edit its configuration</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ Save Modal ═══ */}
        <Modal
          isOpen={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          title={activeConfigId ? 'Update IVR Configuration' : 'Save IVR Configuration'}
        >
          <div className="space-y-6">
            <Input
              label="Configuration Name"
              placeholder="e.g. Main Office IVR"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Description</label>
              <textarea
                value={configDesc}
                onChange={(e) => setConfigDesc(e.target.value)}
                rows={2}
                placeholder="Brief description of this IVR flow..."
                className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none backdrop-blur-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200" onClick={() => setSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200"
                onClick={handleSave}
                disabled={!configName.trim() || isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" /> {activeConfigId ? 'Update' : 'Save'}</>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ═══ Load Modal ═══ */}
        <Modal
          isOpen={loadModalOpen}
          onClose={() => setLoadModalOpen(false)}
          title="Load IVR Configuration"
        >
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No saved configurations</p>
                <p className="text-muted-foreground text-xs mt-1">Build a flow and save it first</p>
              </div>
            ) : (
              configs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/[0.04] bg-card hover:border-white/[0.08] transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{cfg.name}</p>
                      {cfg.isActive && (
                        <Badge className="text-[10px] bg-emerald-500/[0.08] text-emerald-300 border-emerald-400/20">Active</Badge>
                      )}
                      {cfg.id === activeConfigId && (
                        <Badge className="text-[10px] bg-blue-500/[0.08] text-blue-300 border-blue-400/20">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cfg.nodes.length} nodes, {cfg.connections.length} connections
                    </p>
                    {cfg.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{cfg.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                      size="sm"
                      onClick={() => handleLoad(cfg)}
                    >
                      Load
                    </Button>
                    <button
                      onClick={() => handleDeleteConfig(cfg.id)}
                      disabled={isDeleting === cfg.id}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                    >
                      {isDeleting === cfg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}

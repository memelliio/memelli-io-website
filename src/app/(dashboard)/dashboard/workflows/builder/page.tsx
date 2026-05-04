'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';
import {
  ArrowLeft, Save, Play, Power, PowerOff, Trash2, Settings, X,
  Zap, Phone, ShoppingCart, UserPlus, Calendar, Webhook,
  GitBranch, Clock, Timer, Filter,
  Mail, MessageSquare, ListTodo, Database, Users, FileText, Bell,
  ChevronDown, ChevronRight, History, CheckCircle2, XCircle, Loader2,
  GripVertical, Plus, Copy, LayoutTemplate,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NodeCategory = 'trigger' | 'condition' | 'action';

interface NodeType {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  category: NodeCategory;
  color: string;
  fields: FieldDef[];
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface WorkflowNode {
  id: string;
  type: string;
  x: number;
  y: number;
  config: Record<string, string>;
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

interface ExecutionRun {
  id: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  duration: string;
  nodesExecuted: number;
}

interface Template {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
}

/* ------------------------------------------------------------------ */
/*  Node type definitions                                              */
/* ------------------------------------------------------------------ */

const NODE_TYPES: NodeType[] = [
  // Triggers
  {
    type: 'form_submitted', label: 'Form Submitted', icon: FileText, category: 'trigger',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    fields: [
      { key: 'formId', label: 'Form', type: 'select', options: [
        { value: 'contact', label: 'Contact Form' }, { value: 'signup', label: 'Signup Form' },
        { value: 'application', label: 'Application Form' },
      ]},
    ],
  },
  {
    type: 'call_completed', label: 'Call Completed', icon: Phone, category: 'trigger',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    fields: [
      { key: 'callType', label: 'Call Type', type: 'select', options: [
        { value: 'inbound', label: 'Inbound' }, { value: 'outbound', label: 'Outbound' }, { value: 'any', label: 'Any' },
      ]},
    ],
  },
  {
    type: 'order_placed', label: 'Order Placed', icon: ShoppingCart, category: 'trigger',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    fields: [
      { key: 'minAmount', label: 'Min Amount ($)', type: 'number', placeholder: '0' },
    ],
  },
  {
    type: 'user_signup', label: 'User Signup', icon: UserPlus, category: 'trigger',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    fields: [
      { key: 'source', label: 'Source', type: 'select', options: [
        { value: 'any', label: 'Any' }, { value: 'website', label: 'Website' }, { value: 'referral', label: 'Referral' },
      ]},
    ],
  },
  {
    type: 'scheduled', label: 'Scheduled', icon: Calendar, category: 'trigger',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    fields: [
      { key: 'schedule', label: 'Schedule', type: 'select', options: [
        { value: 'hourly', label: 'Every Hour' }, { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' },
      ]},
      { key: 'time', label: 'Time', type: 'text', placeholder: '09:00' },
    ],
  },
  {
    type: 'webhook', label: 'Webhook', icon: Webhook, category: 'trigger',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    fields: [
      { key: 'url', label: 'Webhook URL', type: 'text', placeholder: 'Auto-generated on save' },
    ],
  },
  // Conditions
  {
    type: 'if_else', label: 'If / Else', icon: GitBranch, category: 'condition',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    fields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: 'e.g. contact.email' },
      { key: 'operator', label: 'Operator', type: 'select', options: [
        { value: 'equals', label: 'Equals' }, { value: 'not_equals', label: 'Not Equals' },
        { value: 'contains', label: 'Contains' }, { value: 'exists', label: 'Exists' },
        { value: 'gt', label: 'Greater Than' }, { value: 'lt', label: 'Less Than' },
      ]},
      { key: 'value', label: 'Value', type: 'text', placeholder: 'Compare value' },
    ],
  },
  {
    type: 'wait', label: 'Wait', icon: Clock, category: 'condition',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    fields: [
      { key: 'event', label: 'Wait For', type: 'select', options: [
        { value: 'email_opened', label: 'Email Opened' }, { value: 'link_clicked', label: 'Link Clicked' },
        { value: 'form_submitted', label: 'Form Submitted' }, { value: 'reply_received', label: 'Reply Received' },
      ]},
      { key: 'timeout', label: 'Timeout (hours)', type: 'number', placeholder: '24' },
    ],
  },
  {
    type: 'delay', label: 'Delay', icon: Timer, category: 'condition',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    fields: [
      { key: 'duration', label: 'Duration', type: 'number', placeholder: '5' },
      { key: 'unit', label: 'Unit', type: 'select', options: [
        { value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' },
      ]},
    ],
  },
  {
    type: 'filter', label: 'Filter', icon: Filter, category: 'condition',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    fields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: 'e.g. contact.tags' },
      { key: 'condition', label: 'Condition', type: 'select', options: [
        { value: 'includes', label: 'Includes' }, { value: 'excludes', label: 'Excludes' },
        { value: 'is_empty', label: 'Is Empty' }, { value: 'is_not_empty', label: 'Is Not Empty' },
      ]},
      { key: 'value', label: 'Value', type: 'text', placeholder: 'Filter value' },
    ],
  },
  // Actions
  {
    type: 'send_email', label: 'Send Email', icon: Mail, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'to', label: 'To', type: 'text', placeholder: '{{contact.email}}' },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
      { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email body content...' },
    ],
  },
  {
    type: 'send_sms', label: 'Send SMS', icon: MessageSquare, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'to', label: 'To', type: 'text', placeholder: '{{contact.phone}}' },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'SMS message...' },
    ],
  },
  {
    type: 'create_task', label: 'Create Task', icon: ListTodo, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'title', label: 'Task Title', type: 'text', placeholder: 'Follow up with {{contact.name}}' },
      { key: 'assignee', label: 'Assign To', type: 'select', options: [
        { value: 'auto', label: 'Auto-assign' }, { value: 'owner', label: 'Contact Owner' }, { value: 'agent', label: 'AI Agent' },
      ]},
      { key: 'dueIn', label: 'Due In (hours)', type: 'number', placeholder: '24' },
    ],
  },
  {
    type: 'update_crm', label: 'Update CRM', icon: Database, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'entity', label: 'Entity', type: 'select', options: [
        { value: 'contact', label: 'Contact' }, { value: 'deal', label: 'Deal' }, { value: 'company', label: 'Company' },
      ]},
      { key: 'field', label: 'Field', type: 'text', placeholder: 'e.g. status' },
      { key: 'value', label: 'Value', type: 'text', placeholder: 'New value' },
    ],
  },
  {
    type: 'assign_agent', label: 'Assign Agent', icon: Users, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'agentType', label: 'Agent Type', type: 'select', options: [
        { value: 'sales', label: 'Sales Agent' }, { value: 'support', label: 'Support Agent' },
        { value: 'onboarding', label: 'Onboarding Agent' }, { value: 'ai', label: 'AI Agent' },
      ]},
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Agent instructions...' },
    ],
  },
  {
    type: 'generate_content', label: 'Generate Content', icon: Zap, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'contentType', label: 'Content Type', type: 'select', options: [
        { value: 'email', label: 'Email Draft' }, { value: 'sms', label: 'SMS Message' },
        { value: 'summary', label: 'Summary' }, { value: 'report', label: 'Report' },
      ]},
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Describe what to generate...' },
    ],
  },
  {
    type: 'notify', label: 'Notify', icon: Bell, category: 'action',
    color: 'bg-red-500/15 border-red-500/30 text-red-400',
    fields: [
      { key: 'channel', label: 'Channel', type: 'select', options: [
        { value: 'dashboard', label: 'Dashboard' }, { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' }, { value: 'slack', label: 'Slack' },
      ]},
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Notification message...' },
    ],
  },
];

const CATEGORY_META: Record<NodeCategory, { label: string; icon: React.ComponentType<any> }> = {
  trigger: { label: 'Triggers', icon: Zap },
  condition: { label: 'Conditions', icon: GitBranch },
  action: { label: 'Actions', icon: Play },
};

/* ------------------------------------------------------------------ */
/*  Templates                                                          */
/* ------------------------------------------------------------------ */

function makeId() {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeConnId() {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const TEMPLATES: Template[] = [
  {
    name: 'Lead Nurture',
    description: 'Capture form leads, send welcome email, wait for engagement, follow up',
    nodes: [
      { id: 'tpl1_1', type: 'form_submitted', x: 400, y: 60, config: { formId: 'contact' } },
      { id: 'tpl1_2', type: 'send_email', x: 400, y: 200, config: { to: '{{contact.email}}', subject: 'Welcome!', body: 'Thanks for reaching out...' } },
      { id: 'tpl1_3', type: 'delay', x: 400, y: 340, config: { duration: '24', unit: 'hours' } },
      { id: 'tpl1_4', type: 'if_else', x: 400, y: 480, config: { field: 'email.opened', operator: 'equals', value: 'true' } },
      { id: 'tpl1_5', type: 'send_email', x: 400, y: 620, config: { to: '{{contact.email}}', subject: 'Follow up', body: 'Just checking in...' } },
    ],
    connections: [
      { id: 'tc1_1', fromId: 'tpl1_1', toId: 'tpl1_2' },
      { id: 'tc1_2', fromId: 'tpl1_2', toId: 'tpl1_3' },
      { id: 'tc1_3', fromId: 'tpl1_3', toId: 'tpl1_4' },
      { id: 'tc1_4', fromId: 'tpl1_4', toId: 'tpl1_5', label: 'Yes' },
    ],
  },
  {
    name: 'New Customer Onboarding',
    description: 'Welcome new customers, assign agent, create onboarding tasks',
    nodes: [
      { id: 'tpl2_1', type: 'user_signup', x: 400, y: 60, config: { source: 'any' } },
      { id: 'tpl2_2', type: 'send_email', x: 400, y: 200, config: { to: '{{contact.email}}', subject: 'Welcome aboard!', body: 'Your account is ready...' } },
      { id: 'tpl2_3', type: 'assign_agent', x: 400, y: 340, config: { agentType: 'onboarding', instructions: 'Guide through setup' } },
      { id: 'tpl2_4', type: 'create_task', x: 400, y: 480, config: { title: 'Onboard {{contact.name}}', assignee: 'owner', dueIn: '48' } },
      { id: 'tpl2_5', type: 'notify', x: 400, y: 620, config: { channel: 'dashboard', message: 'New customer signed up: {{contact.name}}' } },
    ],
    connections: [
      { id: 'tc2_1', fromId: 'tpl2_1', toId: 'tpl2_2' },
      { id: 'tc2_2', fromId: 'tpl2_2', toId: 'tpl2_3' },
      { id: 'tc2_3', fromId: 'tpl2_3', toId: 'tpl2_4' },
      { id: 'tc2_4', fromId: 'tpl2_4', toId: 'tpl2_5' },
    ],
  },
  {
    name: 'Order Follow-up',
    description: 'After order, send confirmation, delay, then request review',
    nodes: [
      { id: 'tpl3_1', type: 'order_placed', x: 400, y: 60, config: { minAmount: '0' } },
      { id: 'tpl3_2', type: 'send_email', x: 400, y: 200, config: { to: '{{contact.email}}', subject: 'Order Confirmed', body: 'Your order #{{order.id}} is confirmed.' } },
      { id: 'tpl3_3', type: 'update_crm', x: 400, y: 340, config: { entity: 'contact', field: 'lastOrderDate', value: '{{now}}' } },
      { id: 'tpl3_4', type: 'delay', x: 400, y: 480, config: { duration: '7', unit: 'days' } },
      { id: 'tpl3_5', type: 'send_sms', x: 400, y: 620, config: { to: '{{contact.phone}}', message: 'How was your order? Leave a review!' } },
    ],
    connections: [
      { id: 'tc3_1', fromId: 'tpl3_1', toId: 'tpl3_2' },
      { id: 'tc3_2', fromId: 'tpl3_2', toId: 'tpl3_3' },
      { id: 'tc3_3', fromId: 'tpl3_3', toId: 'tpl3_4' },
      { id: 'tc3_4', fromId: 'tpl3_4', toId: 'tpl3_5' },
    ],
  },
  {
    name: 'Appointment Reminder',
    description: 'Scheduled reminder flow with SMS and email before appointment',
    nodes: [
      { id: 'tpl4_1', type: 'scheduled', x: 400, y: 60, config: { schedule: 'daily', time: '08:00' } },
      { id: 'tpl4_2', type: 'filter', x: 400, y: 200, config: { field: 'appointment.date', condition: 'is_not_empty', value: '' } },
      { id: 'tpl4_3', type: 'send_email', x: 400, y: 340, config: { to: '{{contact.email}}', subject: 'Appointment Reminder', body: 'You have an appointment tomorrow...' } },
      { id: 'tpl4_4', type: 'delay', x: 400, y: 480, config: { duration: '12', unit: 'hours' } },
      { id: 'tpl4_5', type: 'send_sms', x: 400, y: 620, config: { to: '{{contact.phone}}', message: 'Reminder: Your appointment is in 1 hour.' } },
    ],
    connections: [
      { id: 'tc4_1', fromId: 'tpl4_1', toId: 'tpl4_2' },
      { id: 'tc4_2', fromId: 'tpl4_2', toId: 'tpl4_3' },
      { id: 'tc4_3', fromId: 'tpl4_3', toId: 'tpl4_4' },
      { id: 'tc4_4', fromId: 'tpl4_4', toId: 'tpl4_5' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Mock execution history                                             */
/* ------------------------------------------------------------------ */

const MOCK_RUNS: ExecutionRun[] = [
  { id: 'r1', status: 'success', startedAt: '2026-03-15T14:32:00Z', duration: '1.2s', nodesExecuted: 5 },
  { id: 'r2', status: 'success', startedAt: '2026-03-15T13:15:00Z', duration: '0.8s', nodesExecuted: 4 },
  { id: 'r3', status: 'failed', startedAt: '2026-03-15T12:01:00Z', duration: '2.1s', nodesExecuted: 3 },
  { id: 'r4', status: 'success', startedAt: '2026-03-15T10:45:00Z', duration: '1.5s', nodesExecuted: 5 },
  { id: 'r5', status: 'running', startedAt: '2026-03-15T09:30:00Z', duration: '--', nodesExecuted: 2 },
  { id: 'r6', status: 'success', startedAt: '2026-03-14T22:00:00Z', duration: '0.9s', nodesExecuted: 5 },
  { id: 'r7', status: 'success', startedAt: '2026-03-14T18:15:00Z', duration: '1.1s', nodesExecuted: 4 },
  { id: 'r8', status: 'failed', startedAt: '2026-03-14T15:30:00Z', duration: '3.2s', nodesExecuted: 2 },
  { id: 'r9', status: 'success', startedAt: '2026-03-14T12:00:00Z', duration: '0.7s', nodesExecuted: 5 },
  { id: 'r10', status: 'success', startedAt: '2026-03-14T08:00:00Z', duration: '1.0s', nodesExecuted: 5 },
];

/* ------------------------------------------------------------------ */
/*  SVG Connection Lines                                               */
/* ------------------------------------------------------------------ */

const NODE_WIDTH = 220;
const NODE_HEIGHT = 72;

function ConnectionLines({
  connections,
  nodes,
}: {
  connections: Connection[];
  nodes: WorkflowNode[];
}) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, WorkflowNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="rgba(239,68,68,0.5)" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const from = nodeMap.get(conn.fromId);
        const to = nodeMap.get(conn.toId);
        if (!from || !to) return null;

        const x1 = from.x + NODE_WIDTH / 2;
        const y1 = from.y + NODE_HEIGHT;
        const x2 = to.x + NODE_WIDTH / 2;
        const y2 = to.y;
        const cy1 = y1 + (y2 - y1) * 0.4;
        const cy2 = y1 + (y2 - y1) * 0.6;

        return (
          <g key={conn.id}>
            <path
              d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
              fill="none"
              stroke="rgba(239,68,68,0.3)"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {conn.label && (
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 6}
                textAnchor="middle"
                fill="rgba(239,68,68,0.6)"
                fontSize="11"
                fontWeight="500"
              >
                {conn.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas Node component                                              */
/* ------------------------------------------------------------------ */

function CanvasNode({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDelete,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDelete: () => void;
}) {
  const typeDef = NODE_TYPES.find((t) => t.type === node.type);
  if (!typeDef) return null;
  const Icon = typeDef.icon;

  return (
    <div
      className={`absolute select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isSelected ? 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/10' : ''
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        zIndex: isSelected ? 10 : 2,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseDown={onDragStart}
    >
      <div className={`rounded-xl border px-3 py-3 backdrop-blur-xl ${typeDef.color}`}>
        <div className="flex items-center gap-2">
          <div className="shrink-0 rounded-lg bg-white/[0.06] p-1.5">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{typeDef.label}</p>
            <p className="text-[10px] opacity-50 capitalize">{typeDef.category}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
            style={{ opacity: isSelected ? 1 : undefined }}
          >
            <Trash2 className="h-3 w-3 opacity-50 hover:opacity-100" />
          </button>
        </div>
        {/* Connection dots */}
        {typeDef.category !== 'trigger' && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20 border border-white/10" />
        )}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20 border border-white/10" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main builder component                                             */
/* ------------------------------------------------------------------ */

export default function WorkflowBuilderPage() {
  const router = useRouter();

  /* ---- API Data ---- */
  const { data: apiWorkflows, isError: wfError } = useApiQuery<any>(
    ['workflows'],
    '/api/workflows'
  );
  const isDemo = wfError || !apiWorkflows;

  // Workflow state
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'active' | 'paused'>('draft');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<NodeCategory, boolean>>({
    trigger: false, condition: false, action: false,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  /* Load first API workflow if available */
  useEffect(() => {
    const raw = Array.isArray(apiWorkflows) ? apiWorkflows : (apiWorkflows as any)?.data;
    if (Array.isArray(raw) && raw.length > 0) {
      const wf = raw[0];
      setWorkflowName(wf.name ?? 'Untitled Workflow');
      setWorkflowStatus(
        wf.status === 'ACTIVE' ? 'active' : wf.status === 'INACTIVE' ? 'paused' : 'draft'
      );
      if (wf.stepsJson && typeof wf.stepsJson === 'object') {
        const steps = wf.stepsJson as any;
        if (Array.isArray(steps.nodes)) setNodes(steps.nodes);
        if (Array.isArray(steps.connections)) setConnections(steps.connections);
      }
    }
  }, [apiWorkflows]);

  // Canvas pan state
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const selectedNodeType = useMemo(
    () => (selectedNode ? NODE_TYPES.find((t) => t.type === selectedNode.type) ?? null : null),
    [selectedNode],
  );

  /* -- Node operations ───────────────────────────────────────── */

  const addNode = useCallback((type: string, x: number, y: number) => {
    const id = makeId();
    const newNode: WorkflowNode = { id, type, x, y, config: {} };
    setNodes((prev) => {
      const updated = [...prev, newNode];
      // Auto-connect to last node of compatible type
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        setConnections((c) => [...c, { id: makeConnId(), fromId: last.id, toId: id }]);
      }
      return updated;
    });
    setSelectedNodeId(id);
    setConfigPanelOpen(true);
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
      setConfigPanelOpen(false);
    }
  }, [selectedNodeId]);

  const updateNodeConfig = useCallback((id: string, key: string, value: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n)),
    );
  }, []);

  /* -- Drag handling (node move) ─────────────────────────────── */

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
    setDraggingNodeId(nodeId);
  }, [nodes]);

  useEffect(() => {
    if (!draggingNodeId) return;
    const handleMove = (e: MouseEvent) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }
            : n,
        ),
      );
    };
    const handleUp = () => setDraggingNodeId(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingNodeId]);

  /* -- Canvas pan ─────────────────────────────────────────────── */

  const handleCanvasPanStart = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, ox: canvasOffset.x, oy: canvasOffset.y };
  }, [canvasOffset]);

  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (e: MouseEvent) => {
      setCanvasOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      });
    };
    const handleUp = () => setIsPanning(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isPanning]);

  /* -- Drop from sidebar ─────────────────────────────────────── */

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    if (!type) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - canvasOffset.x - NODE_WIDTH / 2;
    const y = e.clientY - rect.top - canvasOffset.y - NODE_HEIGHT / 2;
    addNode(type, x, y);
  }, [addNode, canvasOffset]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /* -- Template load ─────────────────────────────────────────── */

  const loadTemplate = useCallback((template: Template) => {
    setNodes(template.nodes.map((n) => ({ ...n, id: makeId() + '_' + n.id })));
    // Remap connections
    const idMap = new Map<string, string>();
    const newNodes = template.nodes.map((n) => {
      const newId = makeId() + '_' + n.id;
      idMap.set(n.id, newId);
      return { ...n, id: newId };
    });
    setNodes(newNodes);
    setConnections(
      template.connections.map((c) => ({
        ...c,
        id: makeConnId(),
        fromId: idMap.get(c.fromId) ?? c.fromId,
        toId: idMap.get(c.toId) ?? c.toId,
      })),
    );
    setWorkflowName(template.name);
    setShowTemplates(false);
  }, []);

  /* -- Save / toggle ─────────────────────────────────────────── */

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  }, []);

  const handleToggleActive = useCallback(() => {
    setWorkflowStatus((prev) => {
      if (prev === 'active') return 'paused';
      return 'active';
    });
  }, []);

  const handleTest = useCallback(() => {
    // Simulate test run
    alert('Test run dispatched. Check execution history for results.');
  }, []);

  /* -- Render helpers ────────────────────────────────────────── */

  const statusBadge = useMemo(() => {
    const map = {
      draft: 'bg-white/10 text-white/50 border-white/10',
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
    return map[workflowStatus];
  }, [workflowStatus]);

  function formatRunTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatRunDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden">
      {isDemo && <div className="px-4 pt-2"><DemoBanner reason="No workflows from API" /></div>}
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-background backdrop-blur-xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/workflows')}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-white/[0.08]" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white/90 border-none outline-none placeholder-white/30 w-56"
            placeholder="Workflow name..."
          />
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusBadge}`}>
            {workflowStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              showHistory
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/80'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <div className="h-5 w-px bg-white/[0.08]" />
          <button
            onClick={handleTest}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Test
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white/90 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              workflowStatus === 'active'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
            }`}
          >
            {workflowStatus === 'active' ? (
              <><PowerOff className="h-3.5 w-3.5" /> Deactivate</>
            ) : (
              <><Power className="h-3.5 w-3.5" /> Activate</>
            )}
          </button>
        </div>
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (Node palette) ──────────────────────────── */}
        <div className="w-60 shrink-0 border-r border-white/[0.06] bg-background backdrop-blur-xl overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">
              Drag nodes to canvas
            </p>

            {(['trigger', 'condition', 'action'] as NodeCategory[]).map((category) => {
              const meta = CATEGORY_META[category];
              const CatIcon = meta.icon;
              const collapsed = sidebarCollapsed[category];
              const items = NODE_TYPES.filter((t) => t.category === category);

              return (
                <div key={category} className="mb-3">
                  <button
                    onClick={() =>
                      setSidebarCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
                    }
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    <CatIcon className="h-3.5 w-3.5" />
                    {meta.label}
                    <span className="ml-auto text-white/20">{items.length}</span>
                  </button>

                  {!collapsed && (
                    <div className="mt-1 space-y-1 pl-1">
                      {items.map((nodeType) => {
                        const Icon = nodeType.icon;
                        return (
                          <div
                            key={nodeType.type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('nodeType', nodeType.type);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] ${nodeType.color}`}
                          >
                            <GripVertical className="h-3 w-3 opacity-30" />
                            <Icon className="h-3.5 w-3.5" />
                            <span className="font-medium">{nodeType.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Canvas ──────────────────────────────────────────── */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-[#0a0a0a] cursor-crosshair"
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onMouseDown={handleCanvasPanStart}
          onClick={() => {
            setSelectedNodeId(null);
            setConfigPanelOpen(false);
          }}
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
          }}
        >
          {/* Canvas inner (pan offset) */}
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}
          >
            <ConnectionLines connections={connections} nodes={nodes} />

            {nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => {
                  setSelectedNodeId(node.id);
                  setConfigPanelOpen(true);
                }}
                onDragStart={(e) => handleNodeDragStart(node.id, e)}
                onDelete={() => deleteNode(node.id)}
              />
            ))}
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Plus className="h-6 w-6 text-white/20" />
                </div>
                <div>
                  <p className="text-sm text-white/30 font-medium">Drag nodes from the sidebar</p>
                  <p className="text-xs text-white/15 mt-1">or load a pre-built template</p>
                </div>
              </div>
            </div>
          )}

          {/* Node count indicator */}
          {nodes.length > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-background backdrop-blur-xl px-3 py-1.5 text-[10px] text-white/30">
              <span>{nodes.length} node{nodes.length !== 1 ? 's' : ''}</span>
              <span className="text-white/10">|</span>
              <span>{connections.length} connection{connections.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* ── Config Panel (slide-in) ─────────────────────────── */}
        {configPanelOpen && selectedNode && selectedNodeType && (
          <div className="w-72 shrink-0 border-l border-white/[0.06] bg-background backdrop-blur-xl overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="p-4">
              {/* Panel header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-white/40" />
                  <h3 className="text-sm font-semibold text-white/80">Configure</h3>
                </div>
                <button
                  onClick={() => setConfigPanelOpen(false)}
                  className="rounded-lg p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Node info */}
              <div className={`rounded-xl border px-3 py-2.5 mb-4 ${selectedNodeType.color}`}>
                <div className="flex items-center gap-2">
                  <selectedNodeType.icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{selectedNodeType.label}</span>
                </div>
                <p className="text-[10px] opacity-50 capitalize mt-0.5">{selectedNodeType.category}</p>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {selectedNodeType.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={selectedNode.config[field.key] ?? ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, field.key, e.target.value)}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/80 outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                      >
                        <option value="" className="bg-card">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-card">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={selectedNode.config[field.key] ?? ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 outline-none resize-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={selectedNode.config[field.key] ?? ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Node actions */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
                <button
                  onClick={() => {
                    const clone = { ...selectedNode, id: makeId(), x: selectedNode.x + 30, y: selectedNode.y + 30, config: { ...selectedNode.config } };
                    setNodes((prev) => [...prev, clone]);
                  }}
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate Node
                </button>
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Execution History Panel ─────────────────────────── */}
        {showHistory && (
          <div className="w-72 shrink-0 border-l border-white/[0.06] bg-background backdrop-blur-xl overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-white/40" />
                  <h3 className="text-sm font-semibold text-white/80">Execution History</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {MOCK_RUNS.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {run.status === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {run.status === 'failed' && <XCircle className="h-3 w-3 text-red-400" />}
                        {run.status === 'running' && <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />}
                        <span className={`text-[11px] font-medium capitalize ${
                          run.status === 'success' ? 'text-emerald-400' :
                          run.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/25">{run.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/30">
                        {formatRunDate(run.startedAt)} {formatRunTime(run.startedAt)}
                      </span>
                      <span className="text-[10px] text-white/20">
                        {run.nodesExecuted} nodes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Template Modal ──────────────────────────────────────── */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.06] bg-card backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white/90">Workflow Templates</h2>
                <p className="text-xs text-white/30 mt-0.5">Start with a pre-built automation flow</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => loadTemplate(tpl)}
                  className="text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-red-400/60 group-hover:text-red-400" />
                    <h3 className="text-sm font-semibold text-white/80 group-hover:text-white/95">{tpl.name}</h3>
                  </div>
                  <p className="text-[11px] text-white/30 leading-relaxed">{tpl.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-white/20">
                    <span>{tpl.nodes.length} nodes</span>
                    <span className="text-white/10">|</span>
                    <span>{tpl.connections.length} connections</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

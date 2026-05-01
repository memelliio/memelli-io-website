'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send, Loader2, CheckCircle, XCircle,
  Zap, Activity, Terminal, Cpu, Radio,
  Rocket, CreditCard, Building2, LineChart,
  FileText, Users, Workflow, Search,
  Shield, BarChart3, Bot, Briefcase,
} from 'lucide-react';
import { usePageContext } from '../providers/page-context';
import { useApi } from '../hooks/useApi';
import { handleError, dispatchErrorToAgents, classifyError } from './mua-error-handler';
import { useWorkspaceTabStore } from '../stores/workspace-store';
import { useContextEngine } from '@/providers/context-engine';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ChatAction {
  id: string; type: string; label: string;
  status: 'pending' | 'executing' | 'done' | 'failed'; result?: string;
}
interface ChatMessage {
  id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: Date;
  actions?: ChatAction[];
}
interface ChatApiResponse {
  responseText: string; sessionId?: string;
  actions?: ChatAction[]; suggestions?: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function genId() { return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

const ACTION_NAV: Record<string, string> = {
  list_contacts:  '/dashboard/contacts',
  create_contact: '/dashboard/contacts',
  list_deals:     '/dashboard/crm',
  create_deal:    '/dashboard/crm',
  list_pipelines: '/dashboard/crm',
  list_stores:    '/dashboard/commerce',
  list_orders:    '/dashboard/commerce',
  list_programs:  '/dashboard/coaching',
  list_tasks:     '/dashboard/tasks',
  list_sessions:  '/dashboard/ai',
  list_agents:    '/dashboard/ai',
  show_analytics: '/dashboard/analytics',
};

const KEYWORD_NAV: [RegExp, string][] = [
  [/\bcontacts?\b/i,      '/dashboard/contacts'],
  [/\bleads?\b/i,         '/dashboard/leads'],
  [/\bdeals?\b|pipeline/i,'/dashboard/crm'],
  [/\bcommerce|stores?|orders?|products?\b/i, '/dashboard/commerce'],
  [/\bcoaching|programs?|lessons?\b/i, '/dashboard/coaching'],
  [/\banalytics|stats|metrics\b/i, '/dashboard/analytics'],
  [/\bseo|articles?|keywords?\b/i, '/dashboard/seo'],
  [/\btasks?\b/i,         '/dashboard/tasks'],
  [/\bagents?\b/i,        '/dashboard/ai'],
  [/\bsettings?\b/i,      '/dashboard/settings'],
  [/\bworkflows?\b/i,     '/dashboard/workflows'],
  [/\bcontent\b/i,        '/dashboard/content'],
  [/\bcommunications?|emails?|sms\b/i, '/dashboard/communications'],
  [/\bdocuments?\b/i,     '/dashboard/documents'],
  [/\bnotifications?\b/i, '/dashboard/notifications'],
  [/\bcredit|bureau\b/i,  '/dashboard/credit'],
  [/\bapproval\b/i,       '/dashboard/approval'],
];

/* ── Quick-launch modules ── */
const QUICK_ACTIONS = [
  { icon: Rocket,     label: 'Funding',         command: 'Check my funding eligibility',    route: '/dashboard/credit' },
  { icon: CreditCard, label: 'Credit',           command: 'Improve my credit profile',       route: '/dashboard/credit' },
  { icon: Building2,  label: 'Business Credit',  command: 'Help me build business credit',   route: '/dashboard/credit' },
  { icon: Briefcase,  label: 'Formation',        command: 'Start a new business profile',    route: '/dashboard/workflows' },
  { icon: LineChart,  label: 'Opportunities',    command: 'Show my funding opportunities',   route: '/dashboard/analytics' },
  { icon: Bot,        label: 'Agents',           command: 'Show agent pool status',          route: '/dashboard/ai' },
  { icon: Workflow,   label: 'Workflows',        command: 'Show active workflows',           route: '/dashboard/workflows' },
  { icon: Users,      label: 'CRM',              command: 'Show my pipeline',                route: '/dashboard/crm' },
  { icon: FileText,   label: 'Documents',        command: 'Show document status',            route: '/dashboard/documents' },
  { icon: BarChart3,  label: 'Analytics',        command: 'Show platform analytics',         route: '/dashboard/analytics' },
  { icon: Search,     label: 'SEO',              command: 'Show SEO performance',            route: '/dashboard/seo' },
  { icon: Shield,     label: 'Admin',            command: 'Show system health',              route: '/dashboard/admin' },
];

const GREETING = "Welcome back. I'm your Memelli OS controller.\n\nEvery system, module, and agent is accessible from here. Tell me what to do, or use the quick-launch grid below.";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MUAPanel() {
  const api = useApi();
  const page = usePageContext();
  const router = useRouter();
  const contextEngine = useContextEngine();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showModules, setShowModules] = useState(true);

  // System status
  const [systemStatus, setSystemStatus] = useState<{ pools: number; agents: number; active: number; health: string }>({
    pools: 0, agents: 0, active: 0, health: 'checking',
  });

  // Dispatch tracking
  const [activeDispatches, setActiveDispatches] = useState<Array<{ task: string; domain: string; status: string; dispatchedAt: string }>>([]);
  const reportedTasksRef = useRef<Set<string>>(new Set());
  const trackedTaskIdsRef = useRef<Set<string>>(new Set());
  const trackedWorkOrderIdsRef = useRef<Set<string>>(new Set());
  const reportedWorkOrdersRef = useRef<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-greeting on mount
  useEffect(() => {
    setMessages([{
      id: genId(),
      role: 'system',
      content: GREETING,
      timestamp: new Date(),
    }]);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // Fetch system status
  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await api.get<{ data: { pools: Array<{ activeAgents: number; totalAgents: number }> } }>('/api/admin/command-center/');
        if (!cancelled && res.data?.data?.pools) {
          const pools = res.data.data.pools;
          const total = pools.reduce((s: number, p: any) => s + (p.totalAgents || 0), 0);
          const active = pools.reduce((s: number, p: any) => s + (p.activeAgents || 0), 0);
          setSystemStatus({ pools: pools.length, agents: total, active, health: 'operational' });
        }
      } catch {
        setSystemStatus(s => ({ ...s, health: 'degraded' }));
      }
    };
    fetchStatus();
    // Problem: 15s status polling made active-agent totals lag behind real execution.
    // Solution: tighten status refresh to 2s for fast-moving parallel workloads.
    const interval = setInterval(fetchStatus, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [api]);

  // Track task/work order IDs from actions
  useEffect(() => {
    for (const msg of messages) {
      if (msg.actions) {
        for (const a of msg.actions) {
          if (a.type === 'dispatch_to_pool' && a.result) {
            try {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              if (r?.taskId) trackedTaskIdsRef.current.add(r.taskId);
            } catch { /* ignore */ }
          }
          if (a.type === 'orchestrate_work' && a.result) {
            try {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              if (r?.workOrderId) trackedWorkOrderIdsRef.current.add(r.workOrderId);
            } catch { /* ignore */ }
          }
        }
      }
    }
  }, [messages]);

  // Poll dispatch log + task completions
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get<{ data: { entries: Array<{ task: string; domain: string; layer: string; status: string; dispatchedAt: string }> } }>('/api/admin/command-center/dispatch-log');
        if (!cancelled && res.data?.data?.entries) {
          const cutoff = Date.now() - 10 * 60 * 1000;
          const recent = res.data.data.entries
            .filter((e: any) => new Date(e.dispatchedAt).getTime() > cutoff)
            .slice(0, 8);
          setActiveDispatches(recent);
        }

        if (trackedTaskIdsRef.current.size > 0) {
          const tasksRes = await api.get<{ data: Array<{ id: string; title: string; status: string; completedAt: string | null; metadata: any }> }>('/api/tasks?perPage=20');
          if (!cancelled && tasksRes.data?.data) {
            for (const task of tasksRes.data.data) {
              if (
                trackedTaskIdsRef.current.has(task.id) &&
                task.status === 'COMPLETED' &&
                !reportedTasksRef.current.has(task.id)
              ) {
                reportedTasksRef.current.add(task.id);
                const agentId = task.metadata?.agentId?.slice(0, 8) || 'agent';
                const updateMsg: ChatMessage = {
                  id: genId(),
                  role: 'system',
                  content: `Task complete: "${task.title.slice(0, 80)}" — Agent ${agentId} [${task.metadata?.domain || 'system'}]`,
                  timestamp: new Date(),
                  actions: [{ id: genId(), type: 'task_complete', label: task.title.slice(0, 50), status: 'done', result: 'completed' }],
                };
                setMessages(p => [...p, updateMsg]);
              }
            }
          }
        }

        if (trackedWorkOrderIdsRef.current.size > 0) {
          for (const woId of trackedWorkOrderIdsRef.current) {
            if (reportedWorkOrdersRef.current.has(woId)) continue;
            try {
              const woRes = await api.get<{ data: { status: string; goalSummary: string; completedCount: number; subTaskCount: number; subTasks: Array<{ title: string; status: string; output: any }> } }>(`/api/admin/orchestration/${woId}`);
              if (!cancelled && woRes.data?.data) {
                const wo = woRes.data.data;
                if (wo.status === 'COMPLETED' || wo.status === 'FAILED' || wo.status === 'ESCALATED') {
                  reportedWorkOrdersRef.current.add(woId);
                  const completedTasks = wo.subTasks?.filter((t: any) => t.status === 'COMPLETED') || [];
                  const summary = completedTasks.map((t: any) => t.title).join(', ');
                  const updateMsg: ChatMessage = {
                    id: genId(),
                    role: 'system',
                    content: wo.status === 'COMPLETED'
                      ? `Work order complete: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} tasks done. Results: ${summary || 'all tasks handled'}.`
                      : `Work order ${wo.status.toLowerCase()}: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} completed.`,
                    timestamp: new Date(),
                    actions: [{ id: genId(), type: 'work_order_complete', label: wo.goalSummary?.slice(0, 50), status: wo.status === 'COMPLETED' ? 'done' : 'failed', result: wo.status }],
                  };
                  setMessages(p => [...p, updateMsg]);
                }
              }
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore poll errors */ }
    };
    poll();
    // Problem: dispatch/completion feed lagged at 5s cadence.
    // Solution: 1s polling keeps the hot trail visibly live.
    const interval = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [api]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;
    setShowModules(false);

    setMessages(p => [...p, { id: genId(), role: 'user', content: text.trim(), timestamp: new Date() }]);
    setInputText(''); setIsThinking(true);

    try {
      const res = await api.post<ChatApiResponse>('/api/ai/chat', {
        ...(sessionId ? { sessionId } : {}),
        message: text.trim(),
        context: {
          currentPage: page.currentRoute,
          pageTitle: page.pageTitle,
          section: page.section,
          selectedEntityId: page.selectedEntityId,
          selectedEntityType: page.selectedEntityType,
          environment: typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'development' : 'production') : 'unknown',
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
          ...contextEngine.getSnapshot(),
          contextSummary: contextEngine.getContextForPrompt(),
        },
      });

      contextEngine.recordAction('chat_message', text.slice(0, 50));
      setIsThinking(false);

      if (res.error || !res.data) {
        const errorDetail = res.error || 'Unknown chat error';
        const muaResponse = handleError(errorDetail, `mua-panel:${page.currentRoute}`);
        setMessages(p => [...p, { id: genId(), role: 'assistant', content: muaResponse.clientMessage, timestamp: new Date() }]);
        dispatchErrorToAgents(errorDetail, `mua-panel:${page.currentRoute}`, muaResponse);
        return;
      }

      const { responseText: reply, sessionId: newSid, actions } = res.data;
      if (newSid) setSessionId(newSid);

      const safeActions = actions?.length ? actions.map(a => ({
        ...a,
        result: a.result != null && typeof a.result === 'object' ? JSON.stringify(a.result).slice(0, 120) : a.result,
      })) : undefined;

      const safeReply = typeof reply === 'string' ? reply : (reply != null ? JSON.stringify(reply) : 'Done.');

      setMessages(p => [...p, { id: genId(), role: 'assistant', content: safeReply, timestamp: new Date(), actions: safeActions }]);

      // Check for leaked errors
      const errorType = classifyError(safeReply);
      if (errorType === 'jessica_error') {
        const muaResponse = handleError(safeReply, `mua-panel:${page.currentRoute}`);
        setMessages(p => {
          const updated = [...p];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: muaResponse.clientMessage };
          return updated;
        });
        dispatchErrorToAgents(safeReply, `mua-panel:${page.currentRoute}`, muaResponse);
      }

      // Execute workspace actions
      if (actions?.length) {
        for (const a of actions) {
          if (a.type === 'workspace_action' && a.result) {
            try {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              if (r?.workspaceAction) useWorkspaceTabStore.getState().executeWorkspaceAction(r.workspaceAction);
            } catch { /* ignore */ }
          }
          if (a.type === 'render_visual' && a.result) {
            try {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              if (r?.visualLayout) {
                useWorkspaceTabStore.getState().openTab({
                  type: 'report',
                  title: r.visualLayout.title || 'Visual Report',
                  route: '/dashboard/ai',
                  state: { visualLayout: r.visualLayout },
                });
              }
            } catch { /* ignore */ }
          }
        }
      }

      // Auto-navigate
      let navTarget: string | null = null;
      if (actions?.length) {
        for (const a of actions) {
          if (ACTION_NAV[a.type]) { navTarget = ACTION_NAV[a.type]; break; }
        }
      }
      if (!navTarget) {
        for (const [pattern, route] of KEYWORD_NAV) {
          if (pattern.test(text)) { navTarget = route; break; }
        }
      }
      if (navTarget && page.currentRoute !== navTarget) {
        router.push(navTarget);
      }

    } catch (err: any) {
      setIsThinking(false);
      const errMsg = err?.message || String(err);
      const muaResponse = handleError(errMsg, `mua-panel:${page.currentRoute}`);
      setMessages(p => [...p, { id: genId(), role: 'assistant', content: muaResponse.clientMessage, timestamp: new Date() }]);
      dispatchErrorToAgents(errMsg, `mua-panel:${page.currentRoute}`, muaResponse);
    }
  }, [api, sessionId, isThinking, page, router, contextEngine]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(inputText); };

  // Render action cards
  const renderActions = (actions: ChatAction[]) => (
    <div className="mt-2 space-y-1">
      {actions.map(a => (
        <div key={a.id} className={`flex items-center gap-2 rounded border px-2 py-1 text-[11px] font-mono ${
          a.status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' :
          a.status === 'executing' ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' :
          a.status === 'failed' ? 'border-red-500/30 bg-red-500/5 text-red-400' :
          'border-zinc-700 bg-zinc-900/50 text-zinc-500'
        }`}>
          {a.status === 'executing' ? <Loader2 className="h-3 w-3 animate-spin shrink-0" /> :
           a.status === 'done' ? <CheckCircle className="h-3 w-3 shrink-0" /> :
           a.status === 'failed' ? <XCircle className="h-3 w-3 shrink-0" /> :
           <Zap className="h-3 w-3 shrink-0" />}
          <span>{a.label}</span>
          {a.result && <span className="ml-auto opacity-50 truncate max-w-[100px]">{a.result}</span>}
        </div>
      ))}
    </div>
  );

  /* ── Full panel — always visible, never collapsible ── */
  return (
    <aside className="hidden md:flex flex-col w-80 lg:w-[420px] bg-zinc-950 border-l border-zinc-800/80 shrink-0 overflow-hidden">

      {/* ══ Header: OS Control Identity ══ */}
      <div className="shrink-0 border-b border-zinc-800/80 bg-zinc-950">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center h-7 w-7">
              <Terminal className="h-4 w-4 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100 tracking-wide uppercase">Memelli OS</h2>
              <p className="text-[9px] text-zinc-500 font-mono">COMMAND INTERFACE</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono ${
              systemStatus.health === 'operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              <Radio className="h-2.5 w-2.5" />
              {systemStatus.health === 'operational' ? 'LIVE' : 'DEGRADED'}
            </div>
          </div>
        </div>

        {/* System status strip */}
        <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900/50 border-t border-zinc-800/50">
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <Cpu className="h-2.5 w-2.5" />
            <span className="font-mono">{systemStatus.pools} pools</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <Bot className="h-2.5 w-2.5" />
            <span className="font-mono">{systemStatus.agents.toLocaleString()} agents</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-emerald-500">
            <Activity className="h-2.5 w-2.5" />
            <span className="font-mono">{systemStatus.active} active</span>
          </div>
        </div>
      </div>

      {/* ══ Active Dispatches ══ */}
      {activeDispatches.length > 0 && (
        <div className="shrink-0 border-b border-zinc-800/50 px-3 py-2 bg-zinc-900/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Activity className="h-3 w-3 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-wider">
              Live Dispatches
            </span>
            <span className="ml-auto text-[9px] font-mono text-zinc-600">{activeDispatches.length}</span>
          </div>
          <div className="space-y-0.5">
            {activeDispatches.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  d.status === 'dispatched' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'
                }`} />
                <span className="text-zinc-400 truncate flex-1">{d.task?.slice(0, 45)}</span>
                <span className="text-zinc-600 shrink-0">{d.domain}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Command Log (messages) ══ */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className="group">
            {msg.role === 'user' ? (
              /* User command */
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-primary mt-0.5 shrink-0">&gt;</span>
                <div className="flex-1">
                  <p className="text-[13px] text-zinc-100 font-medium">{msg.content}</p>
                  <span className="text-[9px] font-mono text-zinc-700">{fmtTime(msg.timestamp)}</span>
                </div>
              </div>
            ) : msg.role === 'system' ? (
              /* System message */
              <div className="rounded border border-zinc-800/60 bg-zinc-900/40 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Cpu className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-mono text-primary uppercase tracking-wider">System</span>
                  <span className="ml-auto text-[9px] font-mono text-zinc-700">{fmtTime(msg.timestamp)}</span>
                </div>
                <div className="text-[12px] text-zinc-300 leading-relaxed">
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {msg.actions?.length ? renderActions(msg.actions) : null}
              </div>
            ) : (
              /* Assistant response */
              <div className="rounded border border-zinc-800/60 bg-zinc-900/20 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Terminal className="h-3 w-3 text-blue-400" />
                  <span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider">MUA</span>
                  <span className="ml-auto text-[9px] font-mono text-zinc-700">{fmtTime(msg.timestamp)}</span>
                </div>
                <div className="text-[12px] text-zinc-300 leading-relaxed">
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {msg.actions?.length ? renderActions(msg.actions) : null}
              </div>
            )}
          </div>
        ))}

        {/* Quick-launch module grid — visible until first command */}
        {showModules && messages.length <= 2 && !isThinking && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Zap className="h-3 w-3 text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Quick Launch</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => sendMessage(qa.command)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-2 py-2.5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-zinc-700 transition-all group"
                >
                  <qa.icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-medium">{qa.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isThinking && (
          <div className="flex items-center gap-2 rounded border border-zinc-800/60 bg-zinc-900/30 px-3 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
            <span className="text-[12px] font-mono text-zinc-400">Processing command...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ══ Command Input ══ */}
      <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-900/30 px-3 py-2.5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-primary text-sm font-mono shrink-0">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Command the OS..."
            disabled={isThinking}
            autoComplete="off"
            className="flex-1 h-8 bg-transparent text-[13px] font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded bg-primary/80 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-primary/80"
          >
            {isThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </form>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] font-mono text-zinc-700">
            {page.currentRoute ? `@ ${page.currentRoute.replace('/dashboard/', '')}` : '@ system'}
          </span>
          <span className="text-[9px] font-mono text-zinc-700">
            {messages.filter(m => m.role === 'user').length} commands
          </span>
        </div>
      </div>
    </aside>
  );
}

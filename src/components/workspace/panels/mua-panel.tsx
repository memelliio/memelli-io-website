'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const HomeSphere = dynamic(
  () => import('../../melli-sphere/HomeSphere').then(m => ({ default: m.HomeSphere })),
  { ssr: false }
);
import { useRouter } from 'next/navigation';
import type { IDockviewPanelProps } from 'dockview';
import { motion } from 'framer-motion';
import {
  Send, Loader2, CheckCircle, XCircle,
  Zap, Activity, Terminal, Cpu, Radio,
  Bot,
} from 'lucide-react';
import { usePageContext } from '../../../providers/page-context';
import { useApi } from '../../../hooks/useApi';
import { handleError, dispatchErrorToAgents, classifyError } from '../../mua-error-handler';
import { useWorkspaceTabStore } from '../../../stores/workspace-store';
import { useContextEngine } from '@/providers/context-engine';
import { OS_MODULES } from '../os-workspace';

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
  list_contacts: '/dashboard/contacts', create_contact: '/dashboard/contacts',
  list_deals: '/dashboard/crm', create_deal: '/dashboard/crm',
  list_pipelines: '/dashboard/crm', list_stores: '/dashboard/commerce',
  list_orders: '/dashboard/commerce', list_programs: '/dashboard/coaching',
  list_tasks: '/dashboard/tasks', list_sessions: '/dashboard/ai',
  list_agents: '/dashboard/ai', show_analytics: '/dashboard/analytics',
};

const KEYWORD_NAV: [RegExp, string][] = [
  [/\bcontacts?\b/i, '/dashboard/contacts'],
  [/\bleads?\b/i, '/dashboard/leads'],
  [/\bdeals?\b|pipeline/i, '/dashboard/crm'],
  [/\bcommerce|stores?|orders?|products?\b/i, '/dashboard/commerce'],
  [/\bcoaching|programs?|lessons?\b/i, '/dashboard/coaching'],
  [/\banalytics|stats|metrics\b/i, '/dashboard/analytics'],
  [/\bseo|articles?|keywords?\b/i, '/dashboard/seo'],
  [/\btasks?\b/i, '/dashboard/tasks'],
  [/\bagents?\b/i, '/dashboard/ai'],
  [/\bsettings?\b/i, '/dashboard/settings'],
  [/\bworkflows?\b/i, '/dashboard/workflows'],
];

const GREETING = "Welcome back. I'm your Memelli OS controller.\n\nEvery system, module, and agent is accessible from here.\nType a command, use /open [module], or ask me anything.";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MUA Dock Panel                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function MUADockPanel(_props: IDockviewPanelProps) {
  const api = useApi();
  const page = usePageContext();
  const router = useRouter();
  const contextEngine = useContextEngine();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // System status
  const [systemStatus, setSystemStatus] = useState<{ pools: number; agents: number; active: number; health: string }>({
    pools: 0, agents: 0, active: 0, health: 'checking',
  });

  // Dispatch tracking
  const [activeDispatches, setActiveDispatches] = useState<Array<{ task: string; domain: string; status: string }>>([]);
  const trackedTaskIdsRef = useRef<Set<string>>(new Set());
  const reportedTasksRef = useRef<Set<string>>(new Set());
  const trackedWorkOrderIdsRef = useRef<Set<string>>(new Set());
  const reportedWorkOrdersRef = useRef<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-greeting
  useEffect(() => {
    setMessages([{ id: genId(), role: 'system', content: GREETING, timestamp: new Date() }]);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // Fetch system status
  useEffect(() => {
    let cancelled = false;
    const fetch_ = async () => {
      try {
        const res = await api.get<{ data: { pools: Array<{ activeAgents: number; totalAgents: number }> } }>('/api/admin/command-center/');
        if (!cancelled && res.data?.data?.pools) {
          const pools = res.data.data.pools;
          setSystemStatus({
            pools: pools.length,
            agents: pools.reduce((s: number, p: any) => s + (p.totalAgents || 0), 0),
            active: pools.reduce((s: number, p: any) => s + (p.activeAgents || 0), 0),
            health: 'operational',
          });
        }
      } catch { setSystemStatus(s => ({ ...s, health: 'degraded' })); }
    };
    fetch_();
    // Problem: slow status loop masked real-time agent activity.
    // Solution: 2s cadence shows pool movement fast enough for live cockpit use.
    const i = setInterval(fetch_, 2000);
    return () => { cancelled = true; clearInterval(i); };
  }, [api]);

  // Track IDs from actions
  useEffect(() => {
    for (const msg of messages) {
      if (!msg.actions) continue;
      for (const a of msg.actions) {
        try {
          if (a.type === 'dispatch_to_pool' && a.result) {
            const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
            if (r?.taskId) trackedTaskIdsRef.current.add(r.taskId);
          }
          if (a.type === 'orchestrate_work' && a.result) {
            const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
            if (r?.workOrderId) trackedWorkOrderIdsRef.current.add(r.workOrderId);
          }
        } catch { /* ignore */ }
      }
    }
  }, [messages]);

  // Poll dispatches + completions
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get<{ data: { entries: Array<{ task: string; domain: string; status: string; dispatchedAt: string }> } }>('/api/admin/command-center/dispatch-log');
        if (!cancelled && res.data?.data?.entries) {
          const cutoff = Date.now() - 10 * 60 * 1000;
          setActiveDispatches(
            res.data.data.entries
              .filter((e: any) => new Date(e.dispatchedAt).getTime() > cutoff)
              .slice(0, 8)
          );
        }

        // Check tracked tasks
        if (trackedTaskIdsRef.current.size > 0) {
          const tasksRes = await api.get<{ data: Array<{ id: string; title: string; status: string; metadata: any }> }>('/api/tasks?perPage=20');
          if (!cancelled && tasksRes.data?.data) {
            for (const task of tasksRes.data.data) {
              if (trackedTaskIdsRef.current.has(task.id) && task.status === 'COMPLETED' && !reportedTasksRef.current.has(task.id)) {
                reportedTasksRef.current.add(task.id);
                setMessages(p => [...p, {
                  id: genId(), role: 'system',
                  content: `Task complete: "${task.title.slice(0, 80)}" — Agent ${task.metadata?.agentId?.slice(0, 8) || '?'} [${task.metadata?.domain || 'system'}]`,
                  timestamp: new Date(),
                  actions: [{ id: genId(), type: 'task_complete', label: task.title.slice(0, 50), status: 'done', result: 'completed' }],
                }]);
              }
            }
          }
        }

        // Check tracked work orders
        for (const woId of trackedWorkOrderIdsRef.current) {
          if (reportedWorkOrdersRef.current.has(woId)) continue;
          try {
            const woRes = await api.get<{ data: { status: string; goalSummary: string; completedCount: number; subTaskCount: number; subTasks: Array<{ title: string; status: string }> } }>(`/api/admin/orchestration/${woId}`);
            if (!cancelled && woRes.data?.data) {
              const wo = woRes.data.data;
              if (['COMPLETED', 'FAILED', 'ESCALATED'].includes(wo.status)) {
                reportedWorkOrdersRef.current.add(woId);
                setMessages(p => [...p, {
                  id: genId(), role: 'system',
                  content: wo.status === 'COMPLETED'
                    ? `Work order complete: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} tasks done.`
                    : `Work order ${wo.status.toLowerCase()}: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} completed.`,
                  timestamp: new Date(),
                  actions: [{ id: genId(), type: 'work_order_complete', label: wo.goalSummary?.slice(0, 50), status: wo.status === 'COMPLETED' ? 'done' : 'failed', result: wo.status }],
                }]);
              }
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    };
    poll();
    // Problem: 5s feed refresh made completions appear delayed.
    // Solution: 1s refresh keeps dispatch and complete transitions continuous.
    const i = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(i); };
  }, [api]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);

  // Handle /open commands locally
  const handleSlashCommand = (text: string): boolean => {
    const openMatch = text.match(/^\/(open|launch|show)\s+(.+)/i);
    if (openMatch) {
      const target = openMatch[2].toLowerCase().trim();
      const mod = OS_MODULES.find(m =>
        m.id === target || m.title.toLowerCase() === target || m.title.toLowerCase().includes(target)
      );
      if (mod && (window as any).__memelliOpenModule) {
        (window as any).__memelliOpenModule(mod.id);
        setMessages(p => [...p, {
          id: genId(), role: 'system',
          content: `Opening ${mod.title} panel...`,
          timestamp: new Date(),
        }]);
        return true;
      }
    }
    return false;
  };

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    setMessages(p => [...p, { id: genId(), role: 'user', content: text.trim(), timestamp: new Date() }]);
    setInputText('');

    // Handle slash commands locally
    if (handleSlashCommand(text.trim())) return;

    setIsThinking(true);

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
        const muaResponse = handleError(res.error || 'Unknown error', `mua:${page.currentRoute}`);
        setMessages(p => [...p, { id: genId(), role: 'assistant', content: muaResponse.clientMessage, timestamp: new Date() }]);
        dispatchErrorToAgents(res.error || '', `mua:${page.currentRoute}`, muaResponse);
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
        const muaResponse = handleError(safeReply, `mua:${page.currentRoute}`);
        setMessages(p => {
          const updated = [...p];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: muaResponse.clientMessage };
          return updated;
        });
        dispatchErrorToAgents(safeReply, `mua:${page.currentRoute}`, muaResponse);
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
        }
      }

      // Auto-navigate or open module
      if (actions?.length) {
        for (const a of actions) {
          if (ACTION_NAV[a.type]) {
            const mod = OS_MODULES.find(m => m.route === ACTION_NAV[a.type]);
            if (mod && (window as any).__memelliOpenModule) {
              (window as any).__memelliOpenModule(mod.id);
            }
            break;
          }
        }
      }
    } catch (err: any) {
      setIsThinking(false);
      const muaResponse = handleError(err?.message || String(err), `mua:${page.currentRoute}`);
      setMessages(p => [...p, { id: genId(), role: 'assistant', content: muaResponse.clientMessage, timestamp: new Date() }]);
      dispatchErrorToAgents(err?.message || '', `mua:${page.currentRoute}`, muaResponse);
    }
  }, [api, sessionId, isThinking, page, contextEngine]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(inputText); };

  const renderActions = (actions: ChatAction[]) => (
    <div className="mt-2 space-y-1">
      {actions.map(a => (
        <div key={a.id} className={`flex items-center gap-2 rounded border px-2 py-1 text-[11px] font-mono ${
          a.status === 'done' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' :
          a.status === 'executing' ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' :
          a.status === 'failed' ? 'border-red-500/30 bg-red-500/5 text-red-400' :
          'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
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

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ═══ COMMAND CENTER ═══ */}

      {/* Title bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-bold text-[hsl(var(--foreground))] uppercase tracking-widest">Memelli Command Center</span>
        </div>
        <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono ${
          systemStatus.health === 'operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
        }`}>
          <Radio className="h-2.5 w-2.5" />
          {systemStatus.health === 'operational' ? 'LIVE' : 'DEGRADED'}
        </div>
      </div>

      {/* ─── Orb: centered Melli globe ─── */}
      <div className="shrink-0 flex flex-col items-center justify-center py-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <motion.div
          animate={{ scale: isThinking ? [1, 1.04, 1] : 1 }}
          transition={{ duration: 2, repeat: isThinking ? Infinity : 0, ease: 'easeInOut' }}
        >
          <HomeSphere
            state={isThinking ? 'thinking' : activeDispatches.length > 0 ? 'listening' : 'idle'}
            size={160}
            audioLevel={isThinking ? 0.3 : activeDispatches.length > 0 ? 0.15 : 0}
            config={{ idleBrightness: 0.85, activeBrightness: 1.3, energy: 1.1, coronaEnabled: true, logoOpacity: 1 }}
          />
        </motion.div>
        <p className="mt-2 text-[11px] text-[hsl(var(--muted-foreground))] text-center">
          {isThinking ? 'Processing...' : activeDispatches.length > 0 ? `${activeDispatches.length} active dispatch${activeDispatches.length > 1 ? 'es' : ''}` : 'What are you trying to unlock?'}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]"><Cpu className="inline h-2.5 w-2.5" /> {systemStatus.pools}p</span>
          <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]"><Bot className="inline h-2.5 w-2.5" /> {systemStatus.agents.toLocaleString()}</span>
          <span className="text-[9px] font-mono text-emerald-600"><Activity className="inline h-2.5 w-2.5" /> {systemStatus.active}</span>
        </div>
      </div>

      {/* ─── Command Input ─── */}
      <div className="shrink-0 border-b border-[hsl(var(--border))] px-4 py-2.5 bg-[hsl(var(--muted))]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-primary text-sm font-mono shrink-0">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="/open funding  |  /launch credit  |  ask anything..."
            disabled={isThinking}
            autoComplete="off"
            className="flex-1 h-8 bg-transparent text-[13px] font-mono text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded bg-primary/80 text-white disabled:opacity-20 transition-all hover:bg-primary/80"
          >
            {isThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </form>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">Cmd+K for command palette</span>
          <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{messages.filter(m => m.role === 'user').length} commands</span>
        </div>
      </div>

      {/* ─── Live Dispatches (when active) ─── */}
      {activeDispatches.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="h-2.5 w-2.5 text-blue-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-blue-300 uppercase">Live Dispatches</span>
          </div>
          {activeDispatches.slice(0, 4).map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${d.status === 'dispatched' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[hsl(var(--muted-foreground))] truncate flex-1">{d.task?.slice(0, 40)}</span>
              <span className="text-[hsl(var(--muted-foreground))] shrink-0">{d.domain}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Conversation / Response Log ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {msg.role === 'user' ? (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-primary mt-0.5 shrink-0">&gt;</span>
                <div className="flex-1">
                  <p className="text-[13px] text-[hsl(var(--foreground))] font-medium">{msg.content}</p>
                  <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{fmtTime(msg.timestamp)}</span>
                </div>
              </div>
            ) : msg.role === 'system' ? (
              <div className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Cpu className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-mono text-primary uppercase tracking-wider">System</span>
                  <span className="ml-auto text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{fmtTime(msg.timestamp)}</span>
                </div>
                <div className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-line">{msg.content}</div>
                {msg.actions?.length ? renderActions(msg.actions) : null}
              </div>
            ) : (
              <div className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Terminal className="h-3 w-3 text-blue-400" />
                  <span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider">MUA</span>
                  <span className="ml-auto text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{fmtTime(msg.timestamp)}</span>
                </div>
                <div className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-line">{msg.content}</div>
                {msg.actions?.length ? renderActions(msg.actions) : null}
              </div>
            )}
          </motion.div>
        ))}

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
            <span className="text-[12px] font-mono text-[hsl(var(--muted-foreground))]">Processing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom status bar */}
      <div className="shrink-0 border-t border-[hsl(var(--border))] px-3 py-1.5 flex items-center justify-between bg-[hsl(var(--muted))]">
        <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">
          {page.currentRoute ? `@ ${page.currentRoute.replace('/dashboard/', '')}` : '@ system'}
        </span>
        <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">
          {systemStatus.agents.toLocaleString()} agents online
        </span>
      </div>
    </div>
  );
}

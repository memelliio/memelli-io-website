'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useVoiceSession } from './voice-session';
import { usePageContext } from './page-context';
import { useApi } from '../hooks/useApi';
import { useContextEngine } from './context-engine';
import {
  handleError,
  dispatchErrorToAgents,
  classifyError,
} from '../components/mua-error-handler';
import { useWorkspaceTabStore } from '../stores/workspace-store';
import type { AgentProgressData } from '../components/mua';
import { API_URL } from '../lib/config';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface ChatAction {
  id: string;
  type: string;
  label: string;
  status: 'pending' | 'executing' | 'done' | 'failed';
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  attachments?: { type: 'file' | 'screenshot'; name: string }[];
}

interface ChatApiResponse {
  responseText: string;
  sessionId?: string;
  messageId?: string;
  actions?: Array<{ type: string; params?: Record<string, any>; status: string; result?: any }>;
  suggestions?: string[];
  source?: string;
}

export interface JessicaContext {
  currentModule: string;
  currentRoute: string;
  currentEntity: string | null;
  currentEntityType: string | null;
  userRole: string | null;
  workspaceTab: string | null;
}

export type ChatMode = 'meli' | 'claude';

export interface JessicaState {
  isOpen: boolean;
  messages: ChatMessage[];
  isThinking: boolean;
  sessionId: string | null;
  context: JessicaContext;
  hasInteracted: boolean;
  pendingScreenshot: string | null;
  activeDispatches: Array<{
    task: string;
    domain: string;
    status: string;
    dispatchedAt: string;
  }>;
  agentProgress: AgentProgressData | null;
  systemManagerStatus: any;
  chatMode: ChatMode;
  ready: boolean;
}

// Re-export the canonical type from mua components
export type { AgentProgressData } from '../components/mua';

export interface JessicaActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (text: string) => Promise<void>;
  setContext: (ctx: Partial<JessicaContext>) => void;
  setChatMode: (mode: ChatMode) => void;
  captureScreenshot: () => Promise<void>;
  handleFileUpload: (files: FileList | File[]) => Promise<void>;
  clearScreenshot: () => void;
}

interface JessicaContextValue {
  state: JessicaState;
  actions: JessicaActions;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function genId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Action -> navigation map
const ACTION_NAV: Record<string, string> = {
  list_contacts: '/dashboard/contacts',
  create_contact: '/dashboard/contacts',
  list_deals: '/dashboard/crm',
  create_deal: '/dashboard/crm',
  list_pipelines: '/dashboard/crm',
  list_stores: '/dashboard/commerce',
  list_orders: '/dashboard/commerce',
  list_programs: '/dashboard/coaching',
  list_tasks: '/dashboard/tasks',
  list_sessions: '/dashboard/ai',
  list_agents: '/dashboard/ai',
  show_analytics: '/dashboard/analytics',
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
  [/\bcontent\b/i, '/dashboard/content'],
  [/\bcommunications?|emails?|sms\b/i, '/dashboard/communications'],
  [/\bdocuments?\b/i, '/dashboard/documents'],
  [/\bnotifications?\b/i, '/dashboard/notifications'],
  [/\bcredit|bureau\b/i, '/dashboard/credit'],
  [/\bapproval\b/i, '/dashboard/approval'],
];

function deriveModuleFromPath(pathname: string): string {
  if (pathname.startsWith('/universe')) {
    const segment = pathname.split('/')[2];
    return segment || 'universe-overview';
  }
  if (pathname.startsWith('/dashboard')) {
    const segment = pathname.split('/')[2];
    return segment || 'dashboard-overview';
  }
  return 'general';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Context                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const JessicaCtx = createContext<JessicaContextValue | null>(null);

// Safe no-op fallback when JessicaProvider hasn't mounted yet (e.g. during
// deferred provider initialization). Matches the JessicaContextValue shape
// so consumers render without errors.
const JESSICA_FALLBACK: JessicaContextValue = {
  state: {
    isOpen: false,
    messages: [],
    isThinking: false,
    sessionId: null,
    context: {
      currentModule: 'general',
      currentRoute: '/',
      currentEntity: null,
      currentEntityType: null,
      userRole: null,
      workspaceTab: null,
    },
    hasInteracted: false,
    pendingScreenshot: null,
    activeDispatches: [],
    agentProgress: null,
    systemManagerStatus: null,
    chatMode: 'meli',
    ready: false,
  },
  actions: {
    open: () => {},
    close: () => {},
    toggle: () => {},
    sendMessage: async () => {},
    setContext: () => {},
    setChatMode: () => {},
    captureScreenshot: async () => {},
    handleFileUpload: async () => {},
    clearScreenshot: () => {},
  },
};

export function useJessica(): JessicaContextValue {
  const ctx = useContext(JessicaCtx);
  // Return safe fallback instead of throwing so components can render
  // before the deferred JessicaProvider mounts.
  return ctx ?? JESSICA_FALLBACK;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Provider                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function JessicaProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const voice = useVoiceSession();
  const page = usePageContext();
  const contextEngine = useContextEngine();
  const pathname = usePathname();
  const router = useRouter();

  /* ── Core state ── */
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(
    null
  );
  const [chatMode, setChatModeRaw] = useState<ChatMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('memelli_chat_mode');
      if (saved === 'claude' || saved === 'meli') return saved;
    }
    return 'meli';
  });
  const [ready, setReady] = useState(false);

  /* ── Context state ── */
  const [jessicaContext, setJessicaContext] = useState<JessicaContext>({
    currentModule: 'general',
    currentRoute: pathname,
    currentEntity: null,
    currentEntityType: null,
    userRole: null,
    workspaceTab: null,
  });

  /* ── Dispatch / agent tracking ── */
  const [activeDispatches, setActiveDispatches] = useState<
    Array<{ task: string; domain: string; status: string; dispatchedAt: string }>
  >([]);
  const [agentProgress, setAgentProgress] =
    useState<AgentProgressData | null>(null);
  const [systemManagerStatus, setSystemManagerStatus] = useState<any>(null);
  const trackedTaskIdsRef = useRef<Set<string>>(new Set());
  const reportedTasksRef = useRef<Set<string>>(new Set());
  const trackedWorkOrderIdsRef = useRef<Set<string>>(new Set());
  const reportedWorkOrdersRef = useRef<Set<string>>(new Set());

  /* ── Mark provider as ready after mount ── */
  useEffect(() => {
    setReady(true);
  }, []);

  /* ── Route-based context updates ── */
  useEffect(() => {
    setJessicaContext((prev) => ({
      ...prev,
      currentRoute: pathname,
      currentModule: deriveModuleFromPath(pathname),
    }));
  }, [pathname]);

  /* ── Sync page context entity ── */
  useEffect(() => {
    setJessicaContext((prev) => ({
      ...prev,
      currentEntity: page.selectedEntityId ?? null,
      currentEntityType: page.selectedEntityType ?? null,
    }));
  }, [page.selectedEntityId, page.selectedEntityType]);

  /* ── Track task/work-order IDs from actions ── */
  useEffect(() => {
    for (const msg of messages) {
      if (!msg.actions) continue;
      for (const a of msg.actions) {
        try {
          if (a.type === 'dispatch_to_pool' && a.result) {
            const r =
              typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
            if (r?.taskId) trackedTaskIdsRef.current.add(r.taskId);
          }
          if (a.type === 'orchestrate_work' && a.result) {
            const r =
              typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
            if (r?.workOrderId)
              trackedWorkOrderIdsRef.current.add(r.workOrderId);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }, [messages]);

  /* ── Polling: dispatches, agent progress, task completions ── */
  useEffect(() => {
    // Only poll when Melli is open OR there are tracked tasks
    if (
      !isOpen &&
      trackedTaskIdsRef.current.size === 0 &&
      trackedWorkOrderIdsRef.current.size === 0
    )
      return;

    let cancelled = false;
    const poll = async () => {
      try {
        // Dispatch log
        const res = await api.get<{
          data: {
            entries: Array<{
              task: string;
              domain: string;
              layer: string;
              status: string;
              dispatchedAt: string;
            }>;
          };
        }>('/api/admin/command-center/dispatch-log');
        if (!cancelled && res.data?.data?.entries) {
          const cutoff = Date.now() - 10 * 60 * 1000;
          setActiveDispatches(
            res.data.data.entries
              .filter(
                (e: any) => new Date(e.dispatchedAt).getTime() > cutoff
              )
              .slice(0, 5)
          );
        }

        // Agent progress
        try {
          const progressRes = await api.get<{
            data: AgentProgressData | null;
          }>('/api/admin/command-center/agent-progress');
          if (!cancelled && progressRes.data?.data) {
            setAgentProgress(progressRes.data.data);
          } else if (!cancelled) {
            setAgentProgress(null);
          }
        } catch {
          /* non-fatal */
        }

        // System manager
        try {
          const smRes = await api.get<{ data: any }>(
            '/api/admin/system-manager/status'
          );
          if (!cancelled && smRes.data?.data) {
            setSystemManagerStatus(smRes.data.data);
          }
        } catch {
          /* non-fatal */
        }

        // Task completions
        if (trackedTaskIdsRef.current.size > 0) {
          const tasksRes = await api.get<{
            data: Array<{
              id: string;
              title: string;
              status: string;
              completedAt: string | null;
              metadata: any;
            }>;
          }>('/api/tasks?perPage=20');
          if (!cancelled && tasksRes.data?.data) {
            for (const task of tasksRes.data.data) {
              if (
                trackedTaskIdsRef.current.has(task.id) &&
                task.status === 'COMPLETED' &&
                !reportedTasksRef.current.has(task.id)
              ) {
                reportedTasksRef.current.add(task.id);
                const agentId =
                  task.metadata?.agentId?.slice(0, 8) || 'agent';
                const updateMsg: ChatMessage = {
                  id: genId(),
                  role: 'assistant',
                  content: `Update: "${task.title.slice(0, 80)}" is done. Agent ${agentId} handled it in the ${task.metadata?.domain || 'system'} pool.`,
                  timestamp: new Date(),
                  actions: [
                    {
                      id: genId(),
                      type: 'task_complete',
                      label: task.title.slice(0, 50),
                      status: 'done',
                      result: 'completed',
                    },
                  ],
                };
                setMessages((p) => [...p, updateMsg]);
                voice.speak(
                  `Done. ${task.title.slice(0, 60)} has been handled.`
                );
              }
            }
          }
        }

        // Work order completions
        for (const woId of trackedWorkOrderIdsRef.current) {
          if (reportedWorkOrdersRef.current.has(woId)) continue;
          try {
            const woRes = await api.get<{
              data: {
                status: string;
                goalSummary: string;
                completedCount: number;
                subTaskCount: number;
                subTasks: Array<{
                  title: string;
                  status: string;
                  output: any;
                }>;
              };
            }>(`/api/admin/orchestration/${woId}`);
            if (!cancelled && woRes.data?.data) {
              const wo = woRes.data.data;
              if (
                wo.status === 'COMPLETED' ||
                wo.status === 'FAILED' ||
                wo.status === 'ESCALATED'
              ) {
                reportedWorkOrdersRef.current.add(woId);
                const completedTasks =
                  wo.subTasks?.filter(
                    (t: any) => t.status === 'COMPLETED'
                  ) || [];
                const summary = completedTasks
                  .map((t: any) => t.title)
                  .join(', ');
                const updateMsg: ChatMessage = {
                  id: genId(),
                  role: 'assistant',
                  content:
                    wo.status === 'COMPLETED'
                      ? `Work order complete: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} tasks done. Results: ${summary || 'all tasks handled'}.`
                      : `Work order ${wo.status.toLowerCase()}: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} completed.`,
                  timestamp: new Date(),
                  actions: [
                    {
                      id: genId(),
                      type: 'work_order_complete',
                      label: wo.goalSummary?.slice(0, 50),
                      status: wo.status === 'COMPLETED' ? 'done' : 'failed',
                      result: wo.status,
                    },
                  ],
                };
                setMessages((p) => [...p, updateMsg]);
                voice.speak(
                  wo.status === 'COMPLETED'
                    ? `Done. ${wo.goalSummary?.slice(0, 60)} is complete.`
                    : `Work order ${wo.status.toLowerCase()}.`
                );
              }
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore poll errors */
      }
    };

    poll();
    // Problem: 5s polling made cockpit progress look frozen under heavy parallel dispatch.
    // Solution: 1s cadence keeps hot-trail state visibly moving without waiting a full cycle.
    const interval = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, api, voice]);

  /* ── Legacy event bridge: listen for sphere-chat-toggle ── */
  useEffect(() => {
    const h = () => setIsOpen((p) => !p);
    window.addEventListener('sphere-chat-toggle', h);
    return () => window.removeEventListener('sphere-chat-toggle', h);
  }, []);

  /* ── Broadcast state for legacy consumers ── */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('sphere-chat-state', { detail: { isOpen } })
    );
  }, [isOpen]);

  /* ── Voice command listener ── */
  useEffect(() => {
    const h = (e: Event) => {
      const cmd = (e as CustomEvent).detail?.command;
      if (cmd) {
        if (!isOpen) setIsOpen(true);
        sendMessage(cmd);
      }
    };
    window.addEventListener('voice-command', h);
    return () => window.removeEventListener('voice-command', h);
  }, [isOpen]); // sendMessage is stable via ref pattern below

  /* ── Auto-activate voice when panel opens ── */
  useEffect(() => {
    if (isOpen && voice.sessionState === 'inactive') {
      const t = setTimeout(() => voice.activate(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Send message (the core chat function) ── */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking) return;
      setHasInteracted(true);

      const atts: ChatMessage['attachments'] = [];
      if (pendingScreenshot)
        atts.push({ type: 'screenshot', name: 'Screenshot' });
      for (const f of page.uploadedFiles)
        atts.push({ type: 'file', name: f.name });

      setMessages((p) => [
        ...p,
        {
          id: genId(),
          role: 'user',
          content: text.trim(),
          timestamp: new Date(),
          attachments: atts.length ? atts : undefined,
        },
      ]);
      setIsThinking(true);

      // Safety timeout — never leave the user hanging for more than 45 seconds
      const timeoutId = setTimeout(() => {
        setIsThinking(false);
        setMessages((p) => [
          ...p,
          {
            id: genId(),
            role: 'assistant',
            content:
              "That's taking longer than expected. Give me a moment and try again.",
            timestamp: new Date(),
          },
        ]);
      }, 45_000);

      try {
        // Build context safely — never let context building crash the send
        let chatContext: Record<string, any> = {
          currentPage: page.currentRoute,
          pageTitle: page.pageTitle,
          section: page.section,
          currentModule: jessicaContext.currentModule,
          environment:
            typeof window !== 'undefined'
              ? window.location.hostname === 'localhost'
                ? 'development'
                : 'production'
              : 'unknown',
          hostname:
            typeof window !== 'undefined'
              ? window.location.hostname
              : 'unknown',
        };

        // Add optional fields safely
        if (page.selectedEntityId) chatContext.selectedEntityId = page.selectedEntityId;
        if (page.selectedEntityType) chatContext.selectedEntityType = page.selectedEntityType;
        if (page.uploadedFiles.length) chatContext.uploadedFiles = page.uploadedFiles;
        if (pendingScreenshot) chatContext.screenshot = pendingScreenshot;

        // Context engine snapshot — wrap in try/catch so it never blocks the message
        try {
          const snapshot = contextEngine.getSnapshot();
          chatContext = { ...chatContext, ...snapshot };
          chatContext.contextSummary = contextEngine.getContextForPrompt();
        } catch {
          // Context engine unavailable — send without it
        }

        // Include mode flag so the API routes to the correct persona
        if (chatMode === 'claude') {
          chatContext.mode = 'claude';
        }

        let res = await api.post<ChatApiResponse>('/api/ai/chat', {
          ...(sessionId ? { sessionId } : {}),
          message: text.trim(),
          context: chatContext,
        });

        // Fallback: if authenticated chat fails, try public chat endpoint
        if (res.error || !res.data) {
          try {
            const FALLBACK_API = process.env.NEXT_PUBLIC_API_URL || API_URL || '/';
            const fallbackRes = await fetch(`${FALLBACK_API}/api/ai/public-chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: text.trim() }),
            });
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              if (fallbackJson.success && fallbackJson.data) {
                res = { data: fallbackJson.data as ChatApiResponse, error: null };
              }
            }
          } catch { /* fallback failed too — continue to error handler below */ }
        }

        clearTimeout(timeoutId);

        try { contextEngine.recordAction('chat_message', text.slice(0, 50)); } catch { /* non-fatal */ }
        setPendingScreenshot(null);
        try { page.clearAttachments(); } catch { /* non-fatal */ }
        setIsThinking(false);

        if (res.error || !res.data) {
          const serverMessage = res.errorData?.responseText as
            | string
            | undefined;
          if (serverMessage) {
            setMessages((p) => [
              ...p,
              {
                id: genId(),
                role: 'assistant',
                content: serverMessage,
                timestamp: new Date(),
              },
            ]);
            voice.speak(serverMessage);
          } else {
            const errorDetail = res.error || 'Unknown chat error';
            const muaResponse = handleError(
              errorDetail,
              `chat:${page.currentRoute}`
            );
            setMessages((p) => [
              ...p,
              {
                id: genId(),
                role: 'assistant',
                content: muaResponse.clientMessage,
                timestamp: new Date(),
              },
            ]);
            voice.speak(muaResponse.voiceMessage);
            dispatchErrorToAgents(
              errorDetail,
              `chat:${page.currentRoute}`,
              muaResponse
            );
          }
          return;
        }

        // Defensively extract response — handle potential double-wrapped or unexpected shapes
        const rawData = res.data as any;
        const reply: string | undefined = rawData?.responseText ?? rawData?.data?.responseText;
        const newSid: string | undefined = rawData?.sessionId ?? rawData?.data?.sessionId;
        const rawActions = rawData?.actions ?? rawData?.data?.actions;

        if (newSid) setSessionId(newSid);

        // Map API action shape to ChatAction shape for rendering
        const safeActions: ChatAction[] | undefined = Array.isArray(rawActions) && rawActions.length
          ? rawActions.map((a: any) => ({
              id: a.id || genId(),
              type: a.type ?? 'unknown',
              label: a.label || a.type || 'Action',
              status: a.status === 'completed' ? 'done' as const : a.status === 'failed' ? 'failed' as const : a.status === 'executing' ? 'executing' as const : 'pending' as const,
              result: a.result != null && typeof a.result === 'object'
                ? JSON.stringify(a.result).slice(0, 120)
                : (a.result != null ? String(a.result) : undefined),
            }))
          : undefined;

        const safeReply =
          typeof reply === 'string' && reply.trim()
            ? reply
            : reply != null
              ? JSON.stringify(reply)
              : 'Done.';

        setMessages((p) => [
          ...p,
          {
            id: genId(),
            role: 'assistant',
            content: safeReply,
            timestamp: new Date(),
            actions: safeActions,
          },
        ]);

        // Emit for sphere indicator overlay
        window.dispatchEvent(
          new CustomEvent('mua-response-text', {
            detail: { text: safeReply },
          })
        );

        // Error leak check — only flag responses that look like raw error messages
        // leaked from the backend (stack traces, HTTP codes, connection errors).
        // Skip common false-positive categories like 'jessica_error' which match
        // on normal conversational words ("try again", "rephrase").
        const errorType = classifyError(safeReply);
        const isRealErrorLeak = errorType === 'api_error' || errorType === 'network_error' || errorType === 'auth_error' || errorType === 'render_crash';
        if (isRealErrorLeak) {
          const muaResponse = handleError(
            safeReply,
            `meli:${page.currentRoute}`
          );
          setMessages((p) => {
            const updated = [...p];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: muaResponse.clientMessage,
            };
            return updated;
          });
          voice.speak(muaResponse.voiceMessage);
          dispatchErrorToAgents(
            safeReply,
            `meli:${page.currentRoute}`,
            muaResponse
          );
        } else {
          voice.speak(safeReply);
        }

        // Execute workspace actions
        if (rawActions?.length) {
          for (const a of rawActions) {
            // ── Navigate action: use Next.js router to load the page ──
            if (a.type === 'navigate') {
              try {
                const page = a.params?.page || a.payload?.page;
                if (page && typeof page === 'string') {
                  console.log('[Melli] Executing navigate action:', page);
                  router.push(page);
                  // Dispatch event so the dock panel can show confirmation
                  window.dispatchEvent(
                    new CustomEvent('meli-action-executed', {
                      detail: { type: 'navigate', label: a.label || `Opening ${page}`, page },
                    })
                  );
                }
              } catch (navErr) {
                console.error('[Melli] Navigate action failed:', navErr);
              }
            }

            // ── Workspace action: dispatch custom event for workspace manager ──
            if (a.type === 'workspace_action') {
              try {
                // First try the AI payload directly (from the action block)
                const payload = a.params || a.payload;
                if (payload) {
                  console.log('[Melli] Executing workspace_action:', payload);
                  window.dispatchEvent(
                    new CustomEvent('workspace-action', { detail: payload })
                  );
                  window.dispatchEvent(
                    new CustomEvent('meli-action-executed', {
                      detail: { type: 'workspace_action', label: a.label || 'Workspace action' },
                    })
                  );
                  // Also try to open as a tab if it has route info
                  if (payload.action === 'open_tab' && payload.route) {
                    useWorkspaceTabStore.getState().openTab({
                      type: payload.tabType || 'page',
                      title: payload.title || payload.route,
                      route: payload.route,
                    });
                  }
                }
                // Legacy: executed result from server-side
                if (a.result) {
                  const r =
                    typeof a.result === 'string'
                      ? JSON.parse(a.result)
                      : a.result;
                  if (r?.workspaceAction) {
                    useWorkspaceTabStore
                      .getState()
                      .executeWorkspaceAction(r.workspaceAction);
                  }
                }
              } catch {
                /* ignore */
              }
            }

            // ── Show notification action ──
            if (a.type === 'show_notification') {
              try {
                const message = a.params?.message || a.payload?.message || a.label;
                const notifType = a.params?.type || a.payload?.type || 'info';
                console.log('[Melli] Executing show_notification:', message, notifType);
                window.dispatchEvent(
                  new CustomEvent('meli-action-executed', {
                    detail: { type: 'show_notification', label: message, notifType },
                  })
                );
              } catch {
                /* ignore */
              }
            }

            if (a.type === 'render_visual' && a.result) {
              try {
                const r =
                  typeof a.result === 'string'
                    ? JSON.parse(a.result)
                    : a.result;
                if (r?.visualLayout) {
                  useWorkspaceTabStore.getState().openTab({
                    type: 'report',
                    title: r.visualLayout.title || 'Visual Report',
                    route: '/dashboard/ai',
                    state: { visualLayout: r.visualLayout },
                  });
                }
              } catch {
                /* ignore */
              }
            }
          }
        }

        // Auto-navigate from action types
        let navTarget: string | null = null;
        if (rawActions?.length) {
          for (const a of rawActions) {
            if (ACTION_NAV[a.type]) {
              navTarget = ACTION_NAV[a.type];
              break;
            }
          }
        }
        if (!navTarget) {
          for (const [pattern, route] of KEYWORD_NAV) {
            if (pattern.test(text)) {
              navTarget = route;
              break;
            }
          }
        }
        // Navigation is handled by opening workspace modules
        if (navTarget && (window as any).__memelliOpenModule) {
          const slug = navTarget.replace('/dashboard/', '').split('/')[0];
          (window as any).__memelliOpenModule(slug, navTarget);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        setIsThinking(false);
        const errMsg = err?.message || String(err);
        const muaResponse = handleError(
          errMsg,
          `sphere:${page.currentRoute}`
        );
        setMessages((p) => [
          ...p,
          {
            id: genId(),
            role: 'assistant',
            content: muaResponse.clientMessage,
            timestamp: new Date(),
          },
        ]);
        voice.speak(muaResponse.voiceMessage);
        dispatchErrorToAgents(
          errMsg,
          `sphere:${page.currentRoute}`,
          muaResponse
        );
      }
    },
    [
      api,
      sessionId,
      isThinking,
      page,
      pendingScreenshot,
      voice,
      contextEngine,
      jessicaContext.currentModule,
      chatMode,
      router,
    ]
  );

  /* ── Screenshot capture ── */
  const captureScreenshot = useCallback(async () => {
    try {
      const w = window.innerWidth;
      const h = window.innerHeight;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const c = await html2canvas(document.body, {
          width: w,
          height: h,
          windowWidth: w,
          windowHeight: h,
          scale: 0.5,
          logging: false,
          useCORS: true,
        });
        const url = c.toDataURL('image/jpeg', 0.6);
        setPendingScreenshot(url);
        page.attachScreenshot(url);
      } catch {
        const fb = `[Screenshot: ${w}x${h} on ${page.currentRoute}]`;
        setPendingScreenshot(fb);
        page.attachScreenshot(fb);
      }
    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  }, [page]);

  /* ── File upload ── */
  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) continue;
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.upload<{ id: string; url: string }>(
          '/api/uploads',
          fd
        );
        if (res.data)
          page.attachFile({
            id: res.data.id || genId(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: res.data.url || '',
          });
      }
    },
    [api, page]
  );

  /* ── Actions object ── */
  const actions: JessicaActions = {
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen((p) => !p), []),
    sendMessage,
    setContext: useCallback(
      (ctx: Partial<JessicaContext>) =>
        setJessicaContext((prev) => ({ ...prev, ...ctx })),
      []
    ),
    setChatMode: useCallback((mode: ChatMode) => {
      setChatModeRaw(mode);
      try { localStorage.setItem('memelli_chat_mode', mode); } catch { /* ignore */ }
    }, []),
    captureScreenshot,
    handleFileUpload,
    clearScreenshot: useCallback(() => {
      setPendingScreenshot(null);
      page.attachScreenshot(null);
    }, [page]),
  };

  /* ── State object ── */
  const state: JessicaState = {
    isOpen,
    messages,
    isThinking,
    sessionId,
    context: jessicaContext,
    hasInteracted,
    pendingScreenshot,
    activeDispatches,
    agentProgress,
    systemManagerStatus,
    chatMode,
    ready,
  };

  return (
    <JessicaCtx.Provider value={{ state, actions }}>
      {children}
    </JessicaCtx.Provider>
  );
}

/** Alias for JessicaProvider — used in providers.tsx */
export const MelliProvider = JessicaProvider;

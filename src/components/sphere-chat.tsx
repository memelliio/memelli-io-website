'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceSession } from '../providers/voice-session';
import { usePageContext } from '../providers/page-context';
import { useApi } from '../hooks/useApi';
import { handleError, dispatchErrorToAgents, classifyError } from './mua-error-handler';
import { useWorkspaceTabStore } from '../stores/workspace-store';
import { useContextEngine } from '@/providers/context-engine';
import {
  MUAHeader, MUAMessage, MUAInput, MUASuggestions,
  MUATyping, MUAActivity, MUAWelcome, MUAAttachments, MUAResize,
  MUAAgentProgress, MUASystemManager,
} from './mua';
import type { AgentProgressData } from './mua';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ChatAction {
  id: string; type: string; label: string;
  status: 'pending' | 'executing' | 'done' | 'failed' | 'completed'; result?: string;
}
interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; timestamp: Date;
  actions?: ChatAction[];
  attachments?: { type: 'file' | 'screenshot'; name: string }[];
}
interface ChatApiResponse {
  responseText: string; sessionId?: string;
  actions?: Array<{ type: string; params?: Record<string, any>; status: string; result?: any }>;
  suggestions?: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function genId() { return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

// ── Action → Dashboard navigation map ──────────────────────────────────
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

// ── Keyword → Dashboard navigation (for natural language) ──────────────
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Injected Styles                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STYLES = `
@keyframes mua-panel-in{0%{transform:translateY(16px) scale(0.97);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes mua-fade{0%{opacity:0}100%{opacity:1}}
@keyframes mua-msg-in{0%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes mua-dot{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}
@keyframes mua-breathe{0%,100%{opacity:0.5}50%{opacity:1}}
`;

let stylesIn = false;
function injectStyles() {
  if (stylesIn || typeof document === 'undefined') return;
  stylesIn = true;
  const s = document.createElement('style'); s.textContent = STYLES; document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SphereChat() {
  const api = useApi();
  const voice = useVoiceSession();
  const page = usePageContext();
  const router = useRouter();
  const contextEngine = useContextEngine();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Dispatch tracking
  const [activeDispatches, setActiveDispatches] = useState<Array<{ task: string; domain: string; status: string; dispatchedAt: string }>>([]);
  const [agentProgress, setAgentProgress] = useState<AgentProgressData | null>(null);
  const [systemManagerStatus, setSystemManagerStatus] = useState<any>(null);
  const reportedTasksRef = useRef<Set<string>>(new Set());
  const trackedTaskIdsRef = useRef<Set<string>>(new Set());

  // Track task IDs and work order IDs from actions in messages
  const trackedWorkOrderIdsRef = useRef<Set<string>>(new Set());
  const reportedWorkOrdersRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const msg of messages) {
      if (msg.actions) {
        for (const a of msg.actions) {
          if (a.type === 'dispatch_to_pool' && a.result) {
            try {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              if (r?.taskId) trackedTaskIdsRef.current.add(r.taskId);
            } catch { /* ignore parse errors */ }
          }
          if (a.type === 'orchestrate_work' && a.result) {
            try {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              if (r?.workOrderId) trackedWorkOrderIdsRef.current.add(r.workOrderId);
            } catch { /* ignore parse errors */ }
          }
        }
      }
    }
  }, [messages]);

  // Poll dispatch log + task completions when chat is open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const poll = async () => {
      try {
        // Poll dispatch log for status bar
        const res = await api.get<{ data: { entries: Array<{ task: string; domain: string; layer: string; status: string; dispatchedAt: string }> } }>('/api/admin/command-center/dispatch-log');
        if (!cancelled && res.data?.data?.entries) {
          const cutoff = Date.now() - 10 * 60 * 1000;
          const recent = res.data.data.entries
            .filter((e: any) => new Date(e.dispatchedAt).getTime() > cutoff)
            .slice(0, 5);
          setActiveDispatches(recent);
        }

        // Poll agent progress from dedicated endpoint
        try {
          const progressRes = await api.get<{ data: AgentProgressData | null }>('/api/admin/command-center/agent-progress');
          if (!cancelled && progressRes.data?.data) {
            setAgentProgress(progressRes.data.data);
          } else if (!cancelled) {
            setAgentProgress(null);
          }
        } catch {
          // Non-fatal — progress display is optional
        }

        // Poll system manager status
        try {
          const smRes = await api.get<{ data: any }>('/api/admin/system-manager/status');
          if (!cancelled && smRes.data?.data) {
            setSystemManagerStatus(smRes.data.data);
          }
        } catch {
          // Non-fatal — system manager display is optional
        }

        // Poll for completed tasks and inject Melli updates
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
                  role: 'assistant',
                  content: `Update: "${task.title.slice(0, 80)}" is done. Agent ${agentId} handled it in the ${task.metadata?.domain || 'system'} pool.`,
                  timestamp: new Date(),
                  actions: [{ id: genId(), type: 'task_complete', label: task.title.slice(0, 50), status: 'done', result: 'completed' }],
                };
                setMessages(p => [...p, updateMsg]);
                voice.speak(`Done. ${task.title.slice(0, 60)} has been handled.`);
              }
            }
          }
        }
        // Poll for work order completions
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
                    role: 'assistant',
                    content: wo.status === 'COMPLETED'
                      ? `Work order complete: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} tasks done. Results: ${summary || 'all tasks handled'}.`
                      : `Work order ${wo.status.toLowerCase()}: "${wo.goalSummary}". ${wo.completedCount}/${wo.subTaskCount} completed.`,
                    timestamp: new Date(),
                    actions: [{ id: genId(), type: 'work_order_complete', label: wo.goalSummary?.slice(0, 50), status: wo.status === 'COMPLETED' ? 'done' : 'failed', result: wo.status }],
                  };
                  setMessages(p => [...p, updateMsg]);
                  voice.speak(wo.status === 'COMPLETED' ? `Done. ${wo.goalSummary?.slice(0, 60)} is complete.` : `Work order ${wo.status.toLowerCase()}.`);
                }
              }
            } catch { /* ignore individual work order poll errors */ }
          }
        }
      } catch { /* ignore poll errors */ }
    };
    poll();
    // Problem: delayed feedback loop at 5s made max-parallel execution feel slow.
    // Solution: poll every second so dispatch and completion transitions render immediately.
    const interval = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isOpen, api, voice]);

  // Drag state
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Resize state
  const [panelSize, setPanelSize] = useState<{ w: number; h: number }>({ w: 420, h: 560 });
  const panelRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { injectStyles(); }, []);

  // ── Drag handling ─────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, textarea')) return;
    e.preventDefault();
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const newX = Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.origX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + dy));
      setPanelPos({ x: newX, y: newY });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // Reset position/size when panel closes
  useEffect(() => {
    if (!isOpen) {
      setPanelPos(null);
      setPanelSize({ w: 420, h: 560 });
    }
  }, [isOpen]);

  // Toggle
  useEffect(() => {
    const h = () => setIsOpen(p => !p);
    window.addEventListener('sphere-chat-toggle', h);
    return () => window.removeEventListener('sphere-chat-toggle', h);
  }, []);

  // Broadcast state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sphere-chat-state', { detail: { isOpen } }));
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);

  // Auto-activate voice session when chat opens so TTS plays immediately
  useEffect(() => {
    if (isOpen && voice.sessionState === 'inactive') {
      const t = setTimeout(() => voice.activate(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screenshot
  const captureScreenshot = useCallback(async () => {
    try {
      const w = window.innerWidth, h = window.innerHeight;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const c = await html2canvas(document.body, { width: w, height: h, windowWidth: w, windowHeight: h, scale: 0.5, logging: false, useCORS: true });
        const url = c.toDataURL('image/jpeg', 0.6);
        setPendingScreenshot(url); page.attachScreenshot(url);
      } catch {
        const fb = `[Screenshot: ${w}x${h} on ${page.currentRoute}]`;
        setPendingScreenshot(fb); page.attachScreenshot(fb);
      }
    } catch (e) { console.error('Screenshot failed:', e); }
  }, [page]);

  // File upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) continue;
      const fd = new FormData(); fd.append('file', file);
      const res = await api.upload<{ id: string; url: string }>('/api/uploads', fd);
      if (res.data) page.attachFile({ id: res.data.id || genId(), name: file.name, type: file.type, size: file.size, url: res.data.url || '' });
    }
  }, [api, page]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;
    setHasInteracted(true);

    const atts: ChatMessage['attachments'] = [];
    if (pendingScreenshot) atts.push({ type: 'screenshot', name: 'Screenshot' });
    for (const f of page.uploadedFiles) atts.push({ type: 'file', name: f.name });

    setMessages(p => [...p, { id: genId(), role: 'user', content: text.trim(), timestamp: new Date(), attachments: atts.length ? atts : undefined }]);
    setInputText(''); setIsThinking(true);

    try {
    const res = await api.post<ChatApiResponse>('/api/ai/chat', {
      ...(sessionId ? { sessionId } : {}), message: text.trim(),
      context: { currentPage: page.currentRoute, pageTitle: page.pageTitle, section: page.section, selectedEntityId: page.selectedEntityId, selectedEntityType: page.selectedEntityType, uploadedFiles: page.uploadedFiles.length ? page.uploadedFiles : undefined, screenshot: pendingScreenshot || undefined, environment: typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'development' : 'production') : 'unknown', hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown', ...contextEngine.getSnapshot(), contextSummary: contextEngine.getContextForPrompt() },
    });

    contextEngine.recordAction('chat_message', text.slice(0, 50));

    setPendingScreenshot(null); page.clearAttachments(); setIsThinking(false);

    if (res.error || !res.data) {
      // If the server returned a friendly responseText in the error body, use it directly
      const serverMessage = res.errorData?.responseText as string | undefined;
      if (serverMessage) {
        setMessages(p => [...p, { id: genId(), role: 'assistant', content: serverMessage, timestamp: new Date() }]);
        voice.speak(serverMessage);
      } else {
        const errorDetail = res.error || 'Unknown chat error';
        const muaResponse = handleError(errorDetail, `chat:${page.currentRoute}`);
        setMessages(p => [...p, { id: genId(), role: 'assistant', content: muaResponse.clientMessage, timestamp: new Date() }]);
        voice.speak(muaResponse.voiceMessage);
        dispatchErrorToAgents(errorDetail, `chat:${page.currentRoute}`, muaResponse);
      }
      return;
    }

    // Defensively extract response — handle potential double-wrapped or unexpected shapes
    const rawData = res.data as any;
    const reply: string | undefined = rawData?.responseText ?? rawData?.data?.responseText;
    const newSid: string | undefined = rawData?.sessionId ?? rawData?.data?.sessionId;
    const actions = rawData?.actions ?? rawData?.data?.actions;

    if (newSid) setSessionId(newSid);

    // Map API action shape { type, params, status: "completed"|"failed", result } → ChatAction { id, type, label, status: "done"|"failed" }
    const safeActions: ChatAction[] | undefined = Array.isArray(actions) && actions.length ? actions.map((a: any) => ({
      id: a.id || genId(),
      type: a.type ?? 'unknown',
      label: a.label || a.type || 'Action',
      status: a.status === 'completed' ? 'done' as const : a.status === 'failed' ? 'failed' as const : a.status === 'executing' ? 'executing' as const : 'pending' as const,
      result: a.result != null && typeof a.result === 'object' ? JSON.stringify(a.result).slice(0, 120) : (a.result != null ? String(a.result) : undefined),
    })) : undefined;

    const safeReply = typeof reply === 'string' && reply.trim() ? reply : (reply != null ? JSON.stringify(reply) : 'Done.');

    setMessages(p => [...p, { id: genId(), role: 'assistant', content: safeReply, timestamp: new Date(), actions: safeActions }]);

    // Emit response text for sphere indicator overlay
    window.dispatchEvent(new CustomEvent('mua-response-text', { detail: { text: safeReply } }));

    // Check if Melli's response is actually an error that leaked through
    const errorType = classifyError(safeReply);
    if (errorType === 'meli_error') {
      const muaResponse = handleError(safeReply, `meli:${page.currentRoute}`);
      setMessages(p => {
        const updated = [...p];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: muaResponse.clientMessage };
        return updated;
      });
      voice.speak(muaResponse.voiceMessage);
      dispatchErrorToAgents(safeReply, `meli:${page.currentRoute}`, muaResponse);
    } else {
      voice.speak(safeReply);
    }

    // ── Auto-navigate to relevant dashboard page ────────────────
    let navTarget: string | null = null;

    // Execute workspace actions from Melli (UniScreen tab/workspace control)
    if (actions?.length) {
      for (const a of actions) {
        if (a.type === 'workspace_action' && a.result) {
          try {
            const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
            if (r?.workspaceAction) {
              useWorkspaceTabStore.getState().executeWorkspaceAction(r.workspaceAction);
            }
          } catch { /* ignore parse errors */ }
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

    // Check action types first (most reliable)
    if (actions?.length) {
      for (const a of actions) {
        if (ACTION_NAV[a.type]) { navTarget = ACTION_NAV[a.type]; break; }
      }
    }

    // Fallback: match user message keywords
    if (!navTarget) {
      for (const [pattern, route] of KEYWORD_NAV) {
        if (pattern.test(text)) { navTarget = route; break; }
      }
    }

    // Navigate if we found a target and we're not already there
    if (navTarget && page.currentRoute !== navTarget) {
      router.push(navTarget);
    }

    } catch (err: any) {
      setIsThinking(false);
      const errMsg = err?.message || String(err);
      const muaResponse = handleError(errMsg, `sphere:${page.currentRoute}`);
      setMessages(p => [...p, { id: genId(), role: 'assistant', content: muaResponse.clientMessage, timestamp: new Date() }]);
      voice.speak(muaResponse.voiceMessage);
      dispatchErrorToAgents(errMsg, `sphere:${page.currentRoute}`, muaResponse);
    }
  }, [api, sessionId, isThinking, page, pendingScreenshot, voice, router, contextEngine]);

  // Voice command listener
  useEffect(() => {
    const h = (e: Event) => {
      const cmd = (e as CustomEvent).detail?.command;
      if (!cmd) return;
      if (!isOpen) setIsOpen(true);
      sendMessage(cmd);
    };
    window.addEventListener('voice-command', h);
    return () => window.removeEventListener('voice-command', h);
  }, [isOpen, sendMessage]);

  const toggleVoice = useCallback(() => {
    if (voice.sessionState === 'inactive') voice.activate(); else voice.deactivate();
  }, [voice]);

  const isListening = voice.sessionState === 'listening';
  const isVoiceActive = voice.sessionState !== 'inactive';
  const isSpeaking = voice.isSpeaking;

  // Derive MUA header status
  const headerStatus = (() => {
    if (isThinking) return 'thinking' as const;
    if (isSpeaking) return 'speaking' as const;
    if (isListening) return 'listening' as const;
    return 'idle' as const;
  })();

  const headerSubtitle = (() => {
    if (isThinking) return 'Processing your request...';
    if (isSpeaking) return 'Speaking...';
    if (isListening) return 'Listening...';
    if (isVoiceActive) return 'Ready -- speak or type';
    if (voice.isBackgroundListening) return 'Listening for "Hey Melli"...';
    return 'Say "Hey Melli" or type below';
  })();

  // Show welcome only when zero messages AND user hasn't interacted
  const showWelcome = messages.length === 0 && !isThinking && !hasInteracted;
  const showSuggestions = messages.length === 0 && !isThinking && hasInteracted;

  // Mobile detection
  const [isMobileSphere, setIsMobileSphere] = useState(false);
  useEffect(() => {
    const check = () => setIsMobileSphere(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Touch drag for mobile
  const touchDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const onMobileTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    const touch = e.touches[0];
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    touchDragRef.current = { startX: touch.clientX, startY: touch.clientY, origX: rect.left, origY: rect.top };
  }, []);
  const onMobileTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchDragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchDragRef.current.startX;
    const dy = touch.clientY - touchDragRef.current.startY;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    const newX = Math.max(-20, Math.min(window.innerWidth - 100, touchDragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, touchDragRef.current.origY + dy));
    setPanelPos({ x: newX, y: newY });
  }, []);
  const onMobileTouchEnd = useCallback(() => { touchDragRef.current = null; }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 ${
        isMobileSphere
          ? 'rounded-2xl border border-white/[0.04] bg-zinc-900/95 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
          : 'rounded-2xl border border-white/[0.04] bg-zinc-900/60 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.9)] hover:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.9),0_0_40px_-8px_rgba(239,68,68,0.2)]'
      }`}
      style={isMobileSphere ? {
        width: '85vw',
        maxWidth: '85vw',
        height: '60vh',
        maxHeight: '60vh',
        ...(panelPos
          ? { left: panelPos.x, top: panelPos.y, right: 'auto', bottom: 'auto' }
          : { left: '50%', bottom: 88, transform: 'translateX(-50%)', right: 'auto', top: 'auto' }),
        animation: panelPos ? undefined : 'mua-panel-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      } : {
        width: panelSize.w,
        height: panelSize.h,
        ...(panelPos
          ? { left: panelPos.x, top: panelPos.y, right: 'auto', bottom: 'auto' }
          : { right: 20, bottom: 84 }),
        animation: panelPos ? undefined : 'mua-panel-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Header — draggable on mobile via touch ─────────────────── */}
      {isMobileSphere && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-zinc-600/60 z-10" />
      )}
      <div
        onTouchStart={isMobileSphere ? onMobileTouchStart : undefined}
        onTouchMove={isMobileSphere ? onMobileTouchMove : undefined}
        onTouchEnd={isMobileSphere ? onMobileTouchEnd : undefined}
        style={isMobileSphere ? { touchAction: 'none' } : undefined}
      >
        <MUAHeader
          status={headerStatus}
          title={page.section !== 'general' ? page.section : 'Melli'}
          subtitle={headerSubtitle}
          transcript={voice.transcript && isVoiceActive ? voice.transcript : undefined}
          onClose={() => setIsOpen(false)}
          onDragStart={onDragStart}
        />
      </div>

      {/* ── Agent Progress Tracker ──────────────────────────────────── */}
      {agentProgress && agentProgress.totalAgents > 2 ? (
        <MUAAgentProgress data={agentProgress} />
      ) : (
        <MUAActivity dispatches={activeDispatches} />
      )}

      {/* ── System Manager ──────────────────────────────────────────── */}
      <MUASystemManager status={systemManagerStatus} />

      {/* ── Messages Area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 min-h-0">
        {showWelcome && (
          <MUAWelcome onSuggest={(t) => sendMessage(t)} sphereState={headerStatus === 'thinking' ? 'thinking' : headerStatus === 'speaking' ? 'speaking' : headerStatus === 'listening' ? 'listening' : 'idle'} />
        )}

        {showSuggestions && (
          <MUASuggestions onSelect={(prompt) => sendMessage(prompt)} />
        )}

        {messages.map((msg, i) => (
          <MUAMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            actions={msg.actions}
            attachments={msg.attachments}
            isLatest={i === messages.length - 1}
          />
        ))}

        {isThinking && <MUATyping />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Attachments Bar ─────────────────────────────────────────── */}
      <MUAAttachments
        screenshot={pendingScreenshot}
        files={page.uploadedFiles.map(f => ({ id: f.id, name: f.name }))}
        onRemoveScreenshot={() => { setPendingScreenshot(null); page.attachScreenshot(null); }}
        onRemoveFile={(id) => page.removeFile(id)}
      />

      {/* ── Input ───────────────────────────────────────────────────── */}
      <MUAInput
        value={inputText}
        onChange={setInputText}
        onSend={sendMessage}
        onScreenshot={captureScreenshot}
        onFileUpload={(files) => handleFileUpload(files)}
        isThinking={isThinking}
        isVoiceSupported={voice.isSupported}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isVoiceActive={isVoiceActive}
        onToggleVoice={toggleVoice}
        isBackgroundListening={voice.isBackgroundListening}
      />

      {/* ── Resize Handles ──────────────────────────────────────────── */}
      <MUAResize
        panelSize={panelSize}
        panelPos={panelPos}
        onResize={setPanelSize}
        onMove={setPanelPos}
      />
    </div>
  );
}
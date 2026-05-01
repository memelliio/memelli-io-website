'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageSquare, HelpCircle, Zap, FileText, Phone } from 'lucide-react';
import WidgetLauncher from './WidgetLauncher';
import WidgetShell from './WidgetShell';
import WidgetHeader from './WidgetHeader';
import ConversationThread, { type ChatWidgetMessage } from './ConversationThread';
import SmartComposer from './SmartComposer';
import QuickActionRail, { type QuickAction } from './QuickActionRail';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TenantBranding {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

interface VisitorContext {
  muUid: string;
  isReturning: boolean;
  name?: string;
  email?: string;
  lastPage?: string;
  qualificationProgress?: Record<string, string>;
  conversationId?: string;
}

interface ApiChatResponse {
  message: string;
  conversationId?: string;
  quickActions?: Array<{ label: string; action: string }>;
  suggestions?: string[];
  card?: ChatWidgetMessage;
  stage?: 'greeting' | 'qualifying' | 'helping' | 'converting' | 'closing';
}

interface ChatWidgetProps {
  apiBaseUrl?: string;
  assistantName?: string;
  tenantId?: string;
  tenantBranding?: TenantBranding;
  proactiveTriggers?: Array<{ urlPattern: string; delay: number; prompt: string }>;
  /** When set, the widget auto-opens and sends this prompt */
  initialPrompt?: string;
  /** Bumped each time a new prompt is triggered — ensures re-sends even for identical prompts */
  promptKey?: number;
  /** The module the user selected (e.g. from FeatureWheel) — sent as context to the API */
  selectedModule?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function genId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getMuUid(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('memelli_uid');
  if (stored) return stored;
  const uid = `mu_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem('memelli_uid', uid);
  return uid;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Get started', icon: Zap, action: 'get_started' },
  { label: 'Ask a question', icon: HelpCircle, action: 'ask_question' },
  { label: 'View services', icon: FileText, action: 'view_services' },
  { label: 'Talk to someone', icon: Phone, action: 'talk_to_human' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  API helpers                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function apiCall<T>(
  baseUrl: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ChatWidget({
  apiBaseUrl = '/api',
  assistantName = 'Melli AI',
  tenantId = 'memelli-universe',
  tenantBranding,
  proactiveTriggers,
  initialPrompt,
  promptKey,
  selectedModule,
}: ChatWidgetProps) {
  /* ── Core state ──────────────────────────────────────────────────────── */
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatWidgetMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [visitorContext, setVisitorContext] = useState<VisitorContext | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [proactivePrompt, setProactivePrompt] = useState<string | undefined>();
  const [quickActions, setQuickActions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationStage, setConversationStage] = useState<
    'greeting' | 'qualifying' | 'helping' | 'converting' | 'closing'
  >('greeting');

  const muUid = useRef(getMuUid());
  const contextRefreshTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const proactiveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Track which promptKey we already processed so we don't re-send on re-renders */
  const lastProcessedKey = useRef<number | undefined>(undefined);

  /** Store the current selectedModule in a ref so API calls can read it without stale closures */
  const selectedModuleRef = useRef(selectedModule);
  selectedModuleRef.current = selectedModule;

  /* ── Hydrate visitor context ─────────────────────────────────────────── */
  const refreshContext = useCallback(async () => {
    const ctx = await apiCall<VisitorContext>(
      apiBaseUrl,
      `/chat/context/${muUid.current}?tenantId=${encodeURIComponent(tenantId)}`,
    );
    if (ctx) {
      setVisitorContext(ctx);
      if (ctx.conversationId) setConversationId(ctx.conversationId);
    }
  }, [apiBaseUrl, tenantId]);

  useEffect(() => {
    refreshContext();
    contextRefreshTimer.current = setInterval(refreshContext, 30_000);
    return () => {
      if (contextRefreshTimer.current) clearInterval(contextRefreshTimer.current);
    };
  }, [refreshContext]);

  /* ── Create visitor session on mount ───────────────────────────────── */
  const mountTracked = useRef(false);
  useEffect(() => {
    if (mountTracked.current) return;
    mountTracked.current = true;
    apiCall(apiBaseUrl, '/chat/track', {
      muUid: muUid.current,
      tenantId,
      signalType: 'page_view',
      route: window.location.pathname,
      host: window.location.hostname,
    });
  }, [apiBaseUrl, tenantId]);

  /* ── Proactive triggers ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!proactiveTriggers?.length || isOpen) return;
    const url = window.location.pathname;
    const match = proactiveTriggers.find((t) =>
      new RegExp(t.urlPattern).test(url),
    );
    if (match) {
      proactiveTimer.current = setTimeout(() => {
        setProactivePrompt(match.prompt);
        setUnreadCount((c) => c + 1);
      }, match.delay);
    }
    return () => {
      if (proactiveTimer.current) clearTimeout(proactiveTimer.current);
    };
  }, [proactiveTriggers, isOpen]);

  /* ── Track page views ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!conversationId) return;
    apiCall(apiBaseUrl, '/chat/track', {
      conversationId,
      muUid: muUid.current,
      tenantId,
      signalType: 'page_view',
      route: window.location.pathname,
      host: window.location.hostname,
    });
  }, [apiBaseUrl, conversationId, tenantId]);

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const addMessage = useCallback((msg: ChatWidgetMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    setProactivePrompt(undefined);

    if (messages.length > 0) return; // Already have messages

    // Start conversation
    setIsTyping(true);
    const res = await apiCall<ApiChatResponse>(apiBaseUrl, '/chat/start', {
      muUid: muUid.current,
      tenantId,
      page: window.location.pathname,
      ...(selectedModuleRef.current ? { selectedModule: selectedModuleRef.current } : {}),
    });
    setIsTyping(false);

    if (res) {
      setConversationId(res.conversationId);
      if (res.stage) setConversationStage(res.stage);
      addMessage({
        id: genId(),
        role: 'assistant',
        type: 'text',
        content: res.message,
        timestamp: new Date(),
      });
      if (res.suggestions) setSuggestions(res.suggestions);
      if (res.quickActions) {
        setQuickActions(
          res.quickActions.map((qa) => ({ label: qa.label, action: qa.action })),
        );
      }
    } else {
      // Fallback welcome
      const greeting = visitorContext?.isReturning
        ? `Welcome back${visitorContext.name ? `, ${visitorContext.name}` : ''}! How can I help you today?`
        : `Hi there! I'm ${assistantName}, your AI concierge. How can I help you today?`;
      addMessage({
        id: genId(),
        role: 'assistant',
        type: 'text',
        content: greeting,
        timestamp: new Date(),
      });
    }
  }, [apiBaseUrl, assistantName, tenantId, messages.length, visitorContext, addMessage]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      // Add user message
      addMessage({
        id: genId(),
        role: 'user',
        type: 'text',
        content: text,
        timestamp: new Date(),
      });

      setIsTyping(true);
      setSuggestions([]);

      const res = await apiCall<ApiChatResponse>(apiBaseUrl, '/chat/message', {
        conversationId,
        muUid: muUid.current,
        tenantId,
        message: text,
        page: window.location.pathname,
        ...(selectedModuleRef.current ? { selectedModule: selectedModuleRef.current } : {}),
      });

      setIsTyping(false);

      if (res) {
        if (res.conversationId) setConversationId(res.conversationId);
        if (res.stage) setConversationStage(res.stage);

        // Add AI response
        addMessage({
          id: genId(),
          role: 'assistant',
          type: 'text',
          content: res.message,
          timestamp: new Date(),
        });

        // Add card if present
        if (res.card) {
          addMessage({ ...res.card, id: genId(), timestamp: new Date() });
        }

        if (res.suggestions) setSuggestions(res.suggestions);
        if (res.quickActions) {
          setQuickActions(
            res.quickActions.map((qa) => ({ label: qa.label, action: qa.action })),
          );
        }
      } else {
        addMessage({
          id: genId(),
          role: 'assistant',
          type: 'text',
          content: 'I apologize, but I encountered an issue. Please try again in a moment.',
          timestamp: new Date(),
        });
      }
    },
    [apiBaseUrl, conversationId, tenantId, addMessage],
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      // Find the label for display
      const qa = quickActions.find((q) => q.action === action);
      const label = qa?.label ?? action;
      handleSendMessage(label);
    },
    [quickActions, handleSendMessage],
  );

  const handleQualification = useCallback(
    async (field: string, value: string) => {
      // Mark the qualification card as submitted in messages
      setMessages((prev) =>
        prev.map((m) =>
          m.type === 'qualification_card' && m.qualification?.field === field
            ? { ...m, qualificationSubmitted: true, qualificationValue: value }
            : m,
        ),
      );

      await apiCall(apiBaseUrl, '/chat/qualify', {
        conversationId,
        muUid: muUid.current,
        tenantId,
        field,
        value,
      });
    },
    [apiBaseUrl, conversationId, tenantId],
  );

  const handleChannelSwitch = useCallback(
    async (channelType: string) => {
      addMessage({
        id: genId(),
        role: 'system',
        type: 'system_notice',
        content: `Switching to ${channelType}...`,
        timestamp: new Date(),
      });

      await apiCall(apiBaseUrl, '/chat/channel-switch', {
        conversationId,
        muUid: muUid.current,
        tenantId,
        newChannel: channelType,
      });
    },
    [apiBaseUrl, conversationId, tenantId, addMessage],
  );

  const handleRestart = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setConversationStage('greeting');
    setSuggestions([]);
    setQuickActions(DEFAULT_QUICK_ACTIONS);
    handleOpen();
  }, [handleOpen]);

  /* ── Auto-open and send when initialPrompt changes ─────────────────── */
  useEffect(() => {
    if (!initialPrompt || promptKey === undefined || promptKey === lastProcessedKey.current) return;
    lastProcessedKey.current = promptKey;

    // Open the widget and send the prompt as a message
    const autoSend = async () => {
      // If not open yet, open first (which starts the conversation)
      if (!isOpen) {
        await handleOpen();
      }
      // Small delay to let the open/start settle, then send the prompt
      setTimeout(() => {
        handleSendMessage(initialPrompt);
      }, 300);
    };

    autoSend();
  }, [initialPrompt, promptKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <>
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <WidgetShell
            onClose={handleClose}
            onMinimize={handleMinimize}
            conversationId={conversationId}
            tenantBranding={tenantBranding}
            header={
              <WidgetHeader
                assistantName={assistantName}
                isReturning={visitorContext?.isReturning}
                conversationStage={conversationStage}
                tenantBranding={tenantBranding}
                onMinimize={handleMinimize}
                onClose={handleClose}
                onRestart={handleRestart}
                onChannelSwitch={handleChannelSwitch}
              />
            }
            thread={
              <ConversationThread
                messages={messages}
                isTyping={isTyping}
                onQuickAction={handleQuickAction}
                onQualificationSubmit={handleQualification}
                onChannelSelect={handleChannelSwitch}
              />
            }
            quickActions={
              quickActions.length > 0 ? (
                <QuickActionRail actions={quickActions} onAction={handleQuickAction} />
              ) : undefined
            }
            composer={
              <SmartComposer
                onSend={handleSendMessage}
                suggestions={suggestions}
                placeholder={
                  conversationStage === 'greeting'
                    ? `Ask ${assistantName} anything...`
                    : 'Type a message...'
                }
                contextAction={
                  conversationStage === 'converting'
                    ? 'Start now'
                    : conversationStage === 'qualifying'
                      ? 'Continue'
                      : undefined
                }
              />
            }
          />
        )}
      </AnimatePresence>

      {/* Launcher (hidden when widget is fully open) */}
      {(!isOpen || isMinimized) && (
        <WidgetLauncher
          onOpen={handleOpen}
          unreadCount={unreadCount}
          proactivePrompt={proactivePrompt}
          assistantName={assistantName}
          tenantBranding={tenantBranding}
        />
      )}
    </>
  );
}

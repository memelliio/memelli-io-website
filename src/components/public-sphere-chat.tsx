'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, X } from 'lucide-react';
import { API_URL } from '@/lib/config';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StartResponse {
  success: boolean;
  data: {
    conversationId: string;
    welcomeMessage: string;
    quickActions?: string[];
  };
}

interface MessageResponse {
  success: boolean;
  data: {
    aiResponse: {
      message: string;
      quickActions?: string[];
      followUpQuestion?: string;
    };
    conversation: unknown;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_TENANT_ID = 'memelli-universe';

const QUICK_PROMPTS = [
  'What can Memelli do for me?',
  'I need help with credit',
  'Show me funding options',
  'I want to get started',
];

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

async function chatApi<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api/chat${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Injected Styles                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STYLES = `
@keyframes pub-panel-in{0%{transform:translateY(16px) scale(0.97);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes pub-fade{0%{opacity:0}100%{opacity:1}}
@keyframes pub-msg-in{0%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes pub-dot{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PublicSphereChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const muUidRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationStarted = useRef(false);

  useEffect(() => {
    injectStyles();
    muUidRef.current = getMuUid();
  }, []);

  // Toggle via sphere click
  useEffect(() => {
    const h = () => setIsOpen((p) => !p);
    window.addEventListener('sphere-chat-toggle', h);
    return () => window.removeEventListener('sphere-chat-toggle', h);
  }, []);

  // Broadcast state for FloatingSphere visibility
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sphere-chat-state', { detail: { isOpen } }));
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Start conversation when chat opens
  useEffect(() => {
    if (!isOpen || conversationStarted.current) return;
    conversationStarted.current = true;

    const startConversation = async () => {
      setIsThinking(true);
      const res = await chatApi<StartResponse>('/start', {
        muUid: muUidRef.current,
        tenantId: DEFAULT_TENANT_ID,
        channel: 'site_chat',
        host: typeof window !== 'undefined' ? window.location.hostname : 'memelli.com',
        route: typeof window !== 'undefined' ? window.location.pathname : '/',
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      });
      setIsThinking(false);

      if (res?.success && res.data) {
        setConversationId(res.data.conversationId);
        const welcome = res.data.welcomeMessage ||
          "Hi! I'm Melli, your AI concierge at Memelli. I can help you with credit repair, business funding, and more. What brings you here today?";
        setMessages([{
          id: genId(),
          role: 'assistant',
          content: welcome,
          timestamp: new Date(),
        }]);
      } else {
        // Fallback welcome if API fails
        setMessages([{
          id: genId(),
          role: 'assistant',
          content: "Hi! I'm Melli, your AI concierge at Memelli. I can help you with credit repair, business funding, and more. What brings you here today?",
          timestamp: new Date(),
        }]);
      }
    };

    startConversation();
  }, [isOpen]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;
    setHasInteracted(true);

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMsg]);
    setInputText('');
    setIsThinking(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const res = await chatApi<MessageResponse>('/message', {
      muUid: muUidRef.current,
      tenantId: DEFAULT_TENANT_ID,
      conversationId: conversationId,
      message: text.trim(),
      route: typeof window !== 'undefined' ? window.location.pathname : '/',
      pageContext: { source: 'homepage_sphere' },
    });

    setIsThinking(false);

    if (res?.success && res.data?.aiResponse) {
      const reply = res.data.aiResponse.message;
      const followUp = res.data.aiResponse.followUpQuestion;
      const fullReply = followUp ? `${reply}\n\n${followUp}` : reply;

      setMessages((p) => [...p, {
        id: genId(),
        role: 'assistant',
        content: fullReply,
        timestamp: new Date(),
      }]);
    } else {
      setMessages((p) => [...p, {
        id: genId(),
        role: 'assistant',
        content: "I'm sorry, I had trouble processing that. Could you try again?",
        timestamp: new Date(),
      }]);
    }
  }, [isThinking, conversationId]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && !isThinking) {
      sendMessage(inputText);
    }
  }, [inputText, isThinking, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback((v: string) => {
    setInputText(v);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  if (!isOpen) return null;

  const showWelcome = messages.length === 0 && !isThinking && !hasInteracted;

  return (
    <div
      className="fixed z-[99] flex flex-col overflow-hidden rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.9)]"
      style={{
        width: 'min(400px, calc(100vw - 16px))',
        height: 'min(520px, calc(100dvh - 100px))',
        right: 'max(8px, env(safe-area-inset-right, 0px))',
        bottom: 84,
        animation: 'pub-panel-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="relative shrink-0 bg-zinc-950/80 backdrop-blur-3xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 flex items-center justify-center shadow-[0_0_16px_rgba(239,68,68,0.3)]">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 ${
                isThinking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white tracking-tight">Melli</h3>
              <p className="text-[11px] text-zinc-500">
                {isThinking ? 'Thinking...' : 'AI Concierge'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ── Messages Area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
        {/* Welcome screen */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full px-4 py-6 animate-[pub-fade_0.4s_ease-out]">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.25)] mb-4">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <h3 className="text-[17px] font-semibold text-white tracking-tight mb-1">Hi, I'm Melli</h3>
            <p className="text-[13px] text-zinc-500 text-center max-w-[260px] leading-relaxed mb-5">
              Your AI concierge. I can help with credit, funding, business formation, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-[300px]">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-3.5 py-2 md:py-1.5 text-[13px] md:text-[12px] text-zinc-400 transition-all hover:border-white/[0.12] hover:text-zinc-200 hover:bg-white/[0.06] active:scale-[0.97]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2.5'} animate-[pub-msg-in_0.25s_ease-out]`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center mt-0.5">
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-red-600/90 text-white rounded-tr-md'
                  : 'bg-white/[0.04] backdrop-blur-md border border-white/[0.06] text-zinc-200 rounded-tl-md'
              }`}
            >
              {msg.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isThinking && messages.length > 0 && (
          <div className="flex items-start gap-2.5 animate-[pub-fade_0.2s_ease-out]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-800 ring-1 ring-red-500/30 animate-pulse shrink-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white/[0.04] backdrop-blur-md border border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-[pub-dot_1.4s_ease-in-out_infinite]" />
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-[pub-dot_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-[pub-dot_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.04] bg-zinc-950/80 backdrop-blur-3xl px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Melli..."
            disabled={isThinking}
            className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 disabled:opacity-40 transition-all backdrop-blur-md"
            style={{ maxHeight: 120, minHeight: 40 }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-all hover:bg-red-500 disabled:opacity-20 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

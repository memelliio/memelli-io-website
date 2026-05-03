'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL } from '@/lib/config';

/**
 * Minimal fallback chat for mobile.
 *
 * This renders IMMEDIATELY (no dependency on Melli/MUA/Voice providers)
 * and provides a working chat experience while the full MelliDockPanel
 * loads via DeferredProviders.
 *
 * Once the full panel mounts AND is operational, it sets the global flag
 * and this component hides itself.
 */

// Global signal: when MelliDockPanel mounts and is OPERATIONAL, it sets this.
// The fallback checks this to hide itself.
let fullPanelMounted = false;
export function signalFullPanelMounted() {
  fullPanelMounted = true;
}

// Allow MelliDockPanel to revoke operational status (e.g. auth failed)
export function revokeFullPanelMounted() {
  fullPanelMounted = false;
}

interface FallbackMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

/** Safe localStorage.getItem — returns null if storage is unavailable (Safari private) */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Try all known token key patterns used by @memelli/auth/client.
 * Order: live (production), dev (localhost), bare fallback.
 */
function findAuthToken(): string | null {
  const candidates = [
    'memelli_live_token',
    'memelli_dev_token',
    'memelli_token',
    // Edge cases: some older auth versions or direct setItem calls
    'memelli_universe_token',
    'memelli_staging_token',
    'token',
    'auth_token',
  ];
  for (const key of candidates) {
    const val = safeGetItem(key);
    if (val) return val;
  }
  return null;
}

export default function MobileFallbackChat() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FallbackMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [chatMode, setChatMode] = useState<'meli' | 'claude'>('meli');
  const [crashError, setCrashError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount + mobile detection in useEffect (not during render) to avoid
  // SSR mismatch and ensure correct value on hydration.
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    console.log('[MobileFallbackChat] mounted, width:', window.innerWidth);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Poll for full panel mount
  useEffect(() => {
    if (fullLoaded) return;
    const interval = setInterval(() => {
      if (fullPanelMounted) {
        console.log('[MobileFallbackChat] full panel detected, hiding fallback');
        setFullLoaded(true);
        setIsOpen(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [fullLoaded]);

  // If fullPanelMounted is revoked (e.g. provider crashed), show fallback again
  useEffect(() => {
    if (!fullLoaded) return;
    const interval = setInterval(() => {
      if (!fullPanelMounted) {
        console.log('[MobileFallbackChat] full panel revoked, re-showing fallback');
        setFullLoaded(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [fullLoaded]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAuthRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/universe');

  // Don't render if: not mounted, not mobile, not auth route, or full panel is loaded
  if (!mounted || !isMobile || !isAuthRoute || fullLoaded) return null;

  // If the component itself crashed previously, show a simple recovery message
  if (crashError) {
    return (
      <div
        className="fixed z-50 flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-zinc-950/95 p-6 text-center shadow-2xl"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: 360,
        }}
      >
        <div className="text-sm font-medium text-red-400 mb-2">Chat unavailable</div>
        <div className="text-xs text-zinc-500 mb-3">{crashError}</div>
        <button
          onClick={() => {
            setCrashError(null);
            setMessages([]);
          }}
          className="rounded-lg bg-red-600/20 border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: FallbackMessage = {
      id: `fb_${Date.now()}_u`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Refocus input so keyboard stays open on iPhone
    setTimeout(() => inputRef.current?.focus(), 50);

    try {
      const token = findAuthToken();

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          context: {
            currentModule: 'general',
            currentRoute: pathname,
            ...(chatMode === 'claude' ? { mode: 'claude' } : {}),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply =
          data.responseText ||
          data.message ||
          data.data?.responseText ||
          data.data?.message ||
          data.response ||
          'I received your message.';
        setMessages((prev) => [
          ...prev,
          { id: `fb_${Date.now()}_a`, role: 'assistant', content: reply },
        ]);
      } else {
        // Show the actual error so user/developer can diagnose
        let errorDetail = `${res.status} ${res.statusText}`;
        try {
          const errBody = await res.text();
          const parsed = JSON.parse(errBody);
          errorDetail = parsed.error || parsed.message || errorDetail;
        } catch {
          // text wasn't JSON, that's fine
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `fb_${Date.now()}_a`,
            role: 'assistant',
            content: `Error: ${errorDetail}`,
            isError: true,
          },
        ]);
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Unknown connection error';
      setMessages((prev) => [
        ...prev,
        {
          id: `fb_${Date.now()}_a`,
          role: 'assistant',
          content: `Connection failed: ${errMsg}`,
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating orb — centered above tab bar */}
      {!isOpen && (
        <div
          className="fixed z-50"
          style={{
            bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <button
            onClick={() => setIsOpen(true)}
            className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 ${
              chatMode === 'claude'
                ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-900/30'
                : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/30'
            }`}
            aria-label="Open chat"
          >
            {/* Simple orb icon */}
            <div
              className={`h-7 w-7 rounded-full animate-pulse opacity-60 ${
                chatMode === 'claude' ? 'bg-blue-500/60' : 'bg-red-500/60'
              }`}
            />
            {/* Loading indicator */}
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-yellow-500 animate-pulse" />
          </button>
        </div>
      )}

      {/* Chat sheet */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl shadow-2xl"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
            transform: 'translateX(-50%)',
            width: 'min(92vw, 375px)',
            maxWidth: '92vw',
            /* Use a calc that guarantees space for iPhone keyboard + bottom bar */
            height: 'min(70vh, 480px)',
            maxHeight: '70vh',
          }}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-white/[0.06]">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`h-6 w-6 shrink-0 rounded-full animate-pulse ${
                    chatMode === 'claude' ? 'bg-blue-600/40' : 'bg-red-600/40'
                  }`}
                />
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-zinc-100">
                    {chatMode === 'claude' ? 'Claude' : 'Melli'}
                  </span>
                  <span className="ml-1.5 text-[10px] text-yellow-500 uppercase tracking-wider">
                    loading...
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] active:scale-95"
                aria-label="Close chat"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="7" x2="11" y2="7" />
                </svg>
              </button>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center px-3 pb-2 gap-1">
              <button
                onClick={() => setChatMode('meli')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  chatMode === 'meli'
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                Melli
              </button>
              <button
                onClick={() => setChatMode('claude')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  chatMode === 'claude'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                Claude
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="text-zinc-500 text-sm">
                  Chat with {chatMode === 'claude' ? 'Claude' : 'Melli'} while
                  the full system loads.
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
                    msg.isError
                      ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                      : msg.role === 'user'
                        ? chatMode === 'claude'
                          ? 'bg-blue-600/20 text-zinc-100 border border-blue-500/20'
                          : 'bg-red-600/20 text-zinc-100 border border-red-500/20'
                        : 'bg-zinc-800/60 text-zinc-300 border border-white/[0.04]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/60 border border-white/[0.04] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Powered by Claude badge */}
          {chatMode === 'claude' && (
            <div className="shrink-0 flex items-center justify-center gap-1.5 py-1 border-t border-blue-500/10 bg-blue-950/20">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-[10px] text-blue-400/70 tracking-wider uppercase font-medium">
                Powered by Claude
              </span>
            </div>
          )}

          {/* Input — safe-area padding for iPhone home indicator */}
          <div
            className="shrink-0 border-t border-white/[0.06] px-2.5 py-2.5"
            style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  chatMode === 'claude' ? 'Message Claude...' : 'Message Melli...'
                }
                className={`flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ${
                  chatMode === 'claude'
                    ? 'focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20'
                    : 'focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20'
                }`}
                disabled={sending}
                autoComplete="off"
                enterKeyHint="send"
                autoCapitalize="sentences"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${
                  chatMode === 'claude'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

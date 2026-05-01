'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
  Plus,
  RotateCcw,
  ChevronDown,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL as API } from '@/lib/config';
import { useVoice } from '@/hooks/useVoice';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AiAction {
  actionType: string;
  actionLabel: string;
  entityName: string;
  entityHref?: string;
  status: 'success' | 'pending' | 'error';
  description?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  actions?: AiAction[];
  timestamp: Date;
  isStreaming?: boolean;
}

interface AgentChatProps {
  agentSlug?: string;
  className?: string;
  compact?: boolean;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let msgCounter = 0;
function createId(): string {
  return `msg_${Date.now()}_${++msgCounter}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AgentChat({
  agentSlug = 'receptionist',
  className,
  compact = false
}: AgentChatProps) {
  const [session, setSession] = useState<ChatSession>({
    id: `session_${Date.now()}`,
    messages: []
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice input — track whether last message was voice-initiated
  const lastInputModeRef = useRef<'text' | 'voice'>('text');
  const handleVoiceTranscript = useCallback((text: string) => {
    if (text.trim()) {
      lastInputModeRef.current = 'voice';
      sendMessage(text.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const voice = useVoice(handleVoiceTranscript);
  const { state: voiceState, startListening, stopListening } = voice;

  // ---- Track mount state to avoid hydration mismatch -----------
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ---- Auto-fill from sessionStorage (command palette) -----------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = sessionStorage.getItem('ai_pending_prompt');
    if (pending) {
      sessionStorage.removeItem('ai_pending_prompt');
      setInput(pending);
      // Auto-send after a tick
      setTimeout(() => {
        sendMessage(pending);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Auto-scroll -----------------------------------------------
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!showScrollBtn) scrollToBottom();
  }, [session.messages, scrollToBottom, showScrollBtn]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  };

  // ---- Send message ----------------------------------------------
  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isStreaming) return;

    setInput('');
    setError(null);

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    const agentMsgId = createId();
    const agentMsg: ChatMessage = {
      id: agentMsgId,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg, agentMsg]
    }));

    setIsStreaming(true);

    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;

      const res = await fetch(`${API}/api/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          inputText: messageText,
          inputMode: 'text',
          engine: agentSlug === 'receptionist' ? 'core' : agentSlug,
          context: {
            page: typeof window !== 'undefined' ? window.location.pathname : ''
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      // Handle streaming response
      if (res.headers.get('content-type')?.includes('text/event-stream') || res.body) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let actions: AiAction[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'text') {
                    fullContent += parsed.content ?? '';
                  } else if (parsed.type === 'action') {
                    actions.push(parsed.action);
                  } else if (parsed.content) {
                    fullContent += parsed.content;
                  }
                } catch {
                  // Non-JSON chunk, treat as plain text
                  if (data.trim()) fullContent += data;
                }
              } else if (line.trim() && !line.startsWith(':')) {
                // Plain text streaming
                fullContent += line;
              }
            }

            setSession((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === agentMsgId
                  ? { ...m, content: fullContent, actions: actions.length > 0 ? [...actions] : undefined }
                  : m
              )
            }));
          }
        } else {
          // Fallback: read JSON body
          const data = await res.json();
          fullContent = data?.data?.responseText ?? data?.response ?? 'No response received.';
          if (data?.data?.actions) actions = data.data.actions;
          else if (data?.actions) actions = data.actions;
        }

        // Finalize streaming
        const finalContent = fullContent || 'I received your message but had no response to generate.';
        setSession((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === agentMsgId
              ? {
                  ...m,
                  content: finalContent,
                  actions: actions.length > 0 ? actions : undefined,
                  isStreaming: false,
                  timestamp: new Date()
                }
              : m
          )
        }));

        // TTS: speak the response if it was triggered by voice input
        if (lastInputModeRef.current === 'voice' && voice.ttsSupported && finalContent) {
          voice.speak(finalContent, () => {
            if (voice.settings.continuousMode) {
              voice.startListening();
            }
          });
          lastInputModeRef.current = 'text'; // reset
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errMsg);
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === agentMsgId
            ? {
                ...m,
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false,
                timestamp: new Date()
              }
            : m
        )
      }));
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  // ---- New session -----------------------------------------------
  const startNewSession = () => {
    setSession({
      id: `session_${Date.now()}`,
      messages: []
    });
    setError(null);
    setInput('');
    inputRef.current?.focus();
  };

  // ---- Input handling --------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, compact ? 80 : 150)}px`;
  };

  // ---- Render a message ------------------------------------------
  function renderMessage(msg: ChatMessage) {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
      >
        {/* Agent avatar */}
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 mt-0.5">
            <Bot className="h-4 w-4 text-red-400" />
          </div>
        )}

        <div className={cn('max-w-[80%] space-y-2', compact && 'max-w-[85%]')}>
          {/* Bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isUser
                ? 'bg-red-900/60 text-zinc-100 rounded-br-md'
                : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
            )}
          >
            {msg.isStreaming && !msg.content ? (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:300ms]" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
          </div>

          {/* Inline action cards */}
          {msg.actions && msg.actions.length > 0 && (
            <div className="space-y-2">
              {msg.actions.map((action, i) => {
                const statusColors = {
                  success: 'border-l-emerald-500 text-emerald-400',
                  pending: 'border-l-amber-500 text-amber-400',
                  error: 'border-l-red-500 text-red-400'
                };
                const statusLabels = { success: 'Done', pending: 'Pending', error: 'Error' };
                return (
                  <div
                    key={`${msg.id}-action-${i}`}
                    className={cn(
                      'rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 p-3',
                      statusColors[action.status]?.split(' ')[0]
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{action.actionLabel}</p>
                        {action.entityHref ? (
                          <a href={action.entityHref} className="text-xs text-red-400 hover:underline">
                            {action.entityName}
                          </a>
                        ) : (
                          <p className="text-xs text-zinc-400">{action.entityName}</p>
                        )}
                      </div>
                      <span className={cn('text-xs font-medium', statusColors[action.status]?.split(' ')[1])}>
                        {statusLabels[action.status]}
                      </span>
                    </div>
                    {action.description && (
                      <p className="mt-2 text-xs text-zinc-500">{action.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Timestamp */}
          <p
            className={cn(
              'text-[10px] text-zinc-600',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {formatTime(msg.timestamp)}
            {msg.isStreaming && (
              <span className="ml-1.5 text-red-400">streaming...</span>
            )}
          </p>
        </div>

        {/* User avatar */}
        {isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900/40 mt-0.5">
            <User className="h-4 w-4 text-red-300" />
          </div>
        )}
      </div>
    );
  }

  // ---- Main render -----------------------------------------------
  return (
    <div
      className={cn(
        'flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden',
        compact ? 'h-[480px]' : 'h-full min-h-[600px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20">
            <Sparkles className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 capitalize">
              {agentSlug === 'receptionist' ? 'Memelli AI' : agentSlug.replace(/-/g, ' ')}
            </p>
            <p className="text-[10px] text-zinc-500">
              {isStreaming ? (
                <span className="text-red-400">Responding...</span>
              ) : (
                'Online'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {session.messages.length > 0 && (
            <button
              onClick={startNewSession}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="New conversation"
            >
              <Plus className="h-3.5 w-3.5" />
              {!compact && <span>New chat</span>}
            </button>
          )}
        </div>
      </div>

      {/* Context banner */}
      {isMounted && window.location.pathname !== '/dashboard/ai' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/30 border-b border-zinc-800/50 shrink-0">
          <Info className="h-3 w-3 text-zinc-500 shrink-0" />
          <p className="text-[10px] text-zinc-500 truncate">
            Context: {window.location.pathname}
          </p>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {session.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 mb-4">
              <Sparkles className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              {agentSlug === 'receptionist' ? 'Memelli AI' : agentSlug.replace(/-/g, ' ')}
            </h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              Ask me anything about your business, contacts, deals, or let me help you get things done.
            </p>

            {/* Suggested prompts */}
            {!compact && (
              <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-sm">
                {[
                  'Show my top deals',
                  'Add a new contact',
                  'Summarize recent activity',
                  'Generate SEO article',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          session.messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <div className="flex justify-center -mt-10 relative z-10 pointer-events-none">
          <button
            onClick={() => {
              scrollToBottom();
              setShowScrollBtn(false);
            }}
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors shadow-lg"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            New messages
          </button>
        </div>
      )}

      {/* Error bar */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-950/30 border-t border-red-900/30 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400 flex-1 truncate">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-300 underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-zinc-800 bg-zinc-900/50 p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'Waiting for response...'
                : 'Type a message... (Enter to send, Shift+Enter for new line)'
            }
            disabled={isStreaming}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500',
              'focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          />

          {/* Voice button */}
          <button
            type="button"
            onClick={() => {
              if (voiceState === 'listening') {
                stopListening();
              } else {
                startListening();
              }
            }}
            disabled={isStreaming}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
              voiceState === 'listening'
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : voiceState === 'thinking'
                  ? 'bg-amber-600/20 border-amber-500/30 text-amber-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600',
              isStreaming && 'opacity-50 cursor-not-allowed'
            )}
            title={voiceState === 'listening' ? 'Stop listening' : 'Voice input'}
          >
            {voiceState === 'thinking' ? (
              <LoadingGlobe size="sm" />
            ) : voiceState === 'listening' ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
              input.trim() && !isStreaming
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-600 cursor-not-allowed'
            )}
          >
            {isStreaming ? (
              <LoadingGlobe size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Retry hint */}
        {session.messages.length > 0 &&
          !isStreaming &&
          session.messages[session.messages.length - 1]?.role === 'agent' &&
          session.messages[session.messages.length - 1]?.content?.includes('error') && (
            <button
              onClick={() => {
                const lastUserMsg = [...session.messages]
                  .reverse()
                  .find((m) => m.role === 'user');
                if (lastUserMsg) sendMessage(lastUserMsg.content);
              }}
              className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Retry last message
            </button>
          )}
      </div>
    </div>
  );
}

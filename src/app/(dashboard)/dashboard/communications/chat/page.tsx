'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, Send, Search, User, Bot, Clock,
  Sparkles, Copy, Check,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Input,
  Badge,
  Skeleton,
  EmptyState,
} from '@memelli/ui';

/* ---------- Types ---------- */

interface ChatSession {
  id: string;
  customerName: string;
  customerEmail?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: 'active' | 'waiting' | 'resolved';
}

interface ChatMessage {
  id: string;
  role: 'customer' | 'agent' | 'system';
  content: string;
  createdAt: string;
}

interface AiSuggestion {
  id: string;
  text: string;
}

interface SessionsResponse {
  data: ChatSession[];
  meta?: { total: number; page: number; perPage: number };
}

type MessagesResponse = ChatMessage[];

/* ---------- Helpers ---------- */

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' }> = {
  active: { label: 'Active', variant: 'success' },
  waiting: { label: 'Waiting', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'muted' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ---------- Mocked AI Suggestions ---------- */

function generateSuggestions(lastMessage?: string): AiSuggestion[] {
  if (!lastMessage) return [];
  return [
    {
      id: 's1',
      text: "I understand you're experiencing issues. Let me look into this for you right away.",
    },
    {
      id: 's2',
      text: 'I can help you with that. Could you provide me with your account number so I can check the details?',
    },
    {
      id: 's3',
      text: "Thank you for reaching out. I'm pulling up your information now - this should only take a moment.",
    },
  ];
}

/* ---------- Component ---------- */

export default function ChatConsolePage() {
  const api = useApi();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* --- Fetch sessions --- */
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery<SessionsResponse>({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const res = await api.get<SessionsResponse>('/api/comms/chat/sessions');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 15_000,
  });

  const sessions = sessionsData?.data ?? [];

  /* --- Fetch messages for selected session --- */
  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery<MessagesResponse>({
    queryKey: ['chat-messages', selectedSessionId],
    queryFn: async () => {
      const res = await api.get<MessagesResponse>(
        `/api/comms/chat/sessions/${selectedSessionId}/messages`
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!selectedSessionId,
    refetchInterval: 5_000,
  });

  const serverMessages: ChatMessage[] = (Array.isArray(messagesData) ? messagesData : (messagesData as any)?.data) ?? [];

  /* Merge server messages with locally-sent ones */
  const allMessages = [
    ...serverMessages,
    ...localMessages.filter(
      (lm) => !serverMessages.some((sm) => sm.id === lm.id)
    ),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  /* AI suggestions based on last customer message */
  const lastCustomerMsg = allMessages.filter((m) => m.role === 'customer').pop();
  const aiSuggestions = generateSuggestions(lastCustomerMsg?.content);

  /* Auto-scroll on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  /* Clear local messages when switching sessions */
  useEffect(() => {
    setLocalMessages([]);
  }, [selectedSessionId]);

  /* --- Filter sessions by search --- */
  const filteredSessions = sessions.filter(
    (s) =>
      !searchQuery ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* --- Send message --- */
  const handleSend = useCallback(() => {
    if (!input.trim() || !selectedSessionId) return;
    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'agent',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, newMsg]);

    // Fire-and-forget POST
    api.post(`/api/comms/chat/sessions/${selectedSessionId}/messages`, {
      content: input.trim(),
    });

    setInput('');
    inputRef.current?.focus();
  }, [input, selectedSessionId, api]);

  function handleUseSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  function handleCopySuggestion(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Chat Console"
        subtitle="Live chat with customers and AI-assisted responses"
      />

      <div className="flex flex-1 gap-0 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden mt-4 min-h-0">
        {/* ======= Left: Sessions List ======= */}
        <div className="w-80 border-r border-white/[0.04] flex flex-col shrink-0">
          {/* Search header */}
          <div className="p-4 border-b border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Sessions</h2>
              <Badge variant="primary">
                {sessions.filter((s) => s.status === 'active').length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              />
            </div>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="card" />
                ))}
              </div>
            ) : sessionsError ? (
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">Failed to load sessions</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<MessageSquare className="h-8 w-8" />}
                  title="No sessions"
                  description="No chat sessions found"
                />
              </div>
            ) : (
              filteredSessions.map((session) => {
                const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.active;
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full flex items-start gap-3 p-4 text-left border-b border-white/[0.03] transition-all duration-200 hover:bg-white/[0.04] ${
                      selectedSessionId === session.id
                        ? 'bg-white/[0.03] border-l-2 border-l-purple-500'
                        : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                        <User className="h-5 w-5 text-white/30" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/90 truncate">
                          {session.customerName}
                        </span>
                        <span className="text-[10px] text-white/20 shrink-0 ml-2">
                          {session.lastMessageAt ? timeAgo(session.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-white/30 truncate mt-0.5">
                        {session.lastMessage}
                      </p>
                      <div className="mt-1.5">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </div>
                    {session.unreadCount > 0 && (
                      <span className="shrink-0 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {session.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ======= Right: Chat Conversation ======= */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedSession ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/[0.04] flex items-center justify-center">
                    <User className="h-4 w-4 text-white/30" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {selectedSession.customerName}
                    </h3>
                    <p className="text-xs text-white/30">
                      {selectedSession.customerEmail}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_CONFIG[selectedSession.status]?.variant ?? 'muted'}>
                  {STATUS_CONFIG[selectedSession.status]?.label ?? selectedSession.status}
                </Badge>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-purple-500" />
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-white/30">No messages yet. Start the conversation below.</p>
                  </div>
                ) : (
                  allMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'agent' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
                    >
                      {msg.role === 'system' ? (
                        <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.04] text-[11px] text-white/30">
                          {msg.content}
                        </div>
                      ) : (
                        <div className={`max-w-[70%] ${msg.role === 'agent' ? 'ml-8' : 'mr-8'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {msg.role === 'customer' ? (
                              <User className="h-3 w-3 text-white/30" />
                            ) : (
                              <Bot className="h-3 w-3 text-primary" />
                            )}
                            <span className="text-[10px] text-white/20">
                              {msg.role === 'customer' ? selectedSession.customerName : 'You'}
                            </span>
                            <span className="text-[10px] text-white/15">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              msg.role === 'agent'
                                ? 'bg-primary text-white rounded-br-sm'
                                : 'bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl text-white/85 rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="px-6 py-4 border-t border-white/[0.04] shrink-0">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your response..."
                    rows={1}
                    className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-3 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[44px] max-h-[120px] transition-all duration-200"
                  />
                  <Button onClick={handleSend} disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="h-12 w-12" />}
                title="Select a conversation"
                description="Choose a session from the sidebar to start chatting"
              />
            </div>
          )}
        </div>

        {/* ======= AI Suggestions Panel ======= */}
        {selectedSession && aiSuggestions.length > 0 && (
          <div className="w-72 border-l border-white/[0.04] flex flex-col shrink-0">
            <div className="p-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold tracking-tight text-foreground">AI Suggestions</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">Click to use a suggested response</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleUseSuggestion(suggestion.text)}
                  className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer p-3 group"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {suggestion.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseSuggestion(suggestion.text);
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 font-medium"
                    >
                      Use this
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySuggestion(suggestion.id, suggestion.text);
                      }}
                      className="text-[10px] text-muted-foreground hover:bg-white/[0.04] flex items-center gap-1 transition-all duration-200"
                    >
                      {copiedId === suggestion.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedId === suggestion.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MessageSquare,
  Plus,
  Send,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Badge,
  Skeleton,
  EmptyState,
  Avatar,
  Textarea,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ---------- types ---------- */

interface SmsThread {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  direction: 'inbound' | 'outbound';
}

interface SmsThreadsResponse {
  data: SmsThread[];
  meta: { total: number; page: number; perPage: number };
}

interface SmsMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'sent' | 'delivered' | 'failed' | 'received';
  createdAt: string;
}

interface ThreadDetailResponse {
  threadId: string;
  contactName: string;
  contactPhone: string;
  messages: SmsMessage[];
}

/* ---------- helpers ---------- */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  );
}

/* ---------- main component ---------- */

export default function SmsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* --- thread list query --- */
  const { data: threadsData, isLoading: threadsLoading } = useQuery<SmsThreadsResponse>({
    queryKey: ['sms-threads', { search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        perPage: '50',
        ...(search ? { search } : {}),
      });
      const res = await api.get<SmsThreadsResponse>(`/api/comms/sms/threads?${params}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const threads = threadsData?.data ?? [];
  const total = threadsData?.meta?.total ?? 0;

  /* --- selected thread detail query --- */
  const { data: threadDetail, isLoading: messagesLoading } = useQuery<ThreadDetailResponse>({
    queryKey: ['sms-thread', selectedThreadId],
    queryFn: async () => {
      const res = await api.get<ThreadDetailResponse>(`/api/comms/sms/threads/${selectedThreadId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!selectedThreadId,
    refetchInterval: 10000,
  });

  const messages = threadDetail?.messages ?? [];
  const contactName = threadDetail?.contactName ?? threads.find((t) => t.id === selectedThreadId)?.contactName ?? 'Unknown';
  const contactPhone = threadDetail?.contactPhone ?? threads.find((t) => t.id === selectedThreadId)?.contactPhone ?? '';

  /* --- send mutation --- */
  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await api.post('/api/comms/sms/send', {
        threadId: selectedThreadId,
        body,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setComposeText('');
      queryClient.invalidateQueries({ queryKey: ['sms-thread', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['sms-threads'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  /* --- handlers --- */
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = composeText.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }, [composeText, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-8 pt-8 pb-0">
        <PageHeader
          title="SMS Inbox"
          subtitle={`${total} conversation${total !== 1 ? 's' : ''}`}
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'SMS' },
          ]}
          className="mb-6"
        />
      </div>

      {/* two-column layout */}
      <div className="flex flex-1 min-h-0 border-t border-white/[0.04]">
        {/* ---- LEFT: thread list ---- */}
        <div className="w-80 xl:w-96 shrink-0 flex flex-col border-r border-white/[0.04] bg-card backdrop-blur-xl">
          {/* search */}
          <div className="p-6">
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={handleSearch}
              className="bg-card border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* thread list */}
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
                title="No conversations"
                description={search ? 'Try different search terms.' : 'SMS conversations will appear here.'}
                className="border-0 bg-transparent mt-12"
              />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {threads.map((thread) => {
                  const isActive = thread.id === selectedThreadId;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`flex items-center gap-3 w-full px-6 py-4 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/80/[0.08] border-l-2 border-primary/30'
                          : 'hover:bg-white/[0.04] border-l-2 border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar name={thread.contactName} size="sm" />
                        {thread.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-medium truncate ${
                              thread.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {thread.contactName}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {relativeTime(thread.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 truncate ${
                            thread.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {thread.lastMessage}
                        </p>
                      </div>
                      {thread.unreadCount > 0 && (
                        <Badge variant="primary">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---- RIGHT: conversation ---- */}
        <div className="flex-1 flex flex-col min-w-0 bg-card">
          {!selectedThreadId ? (
            /* empty state when no thread selected */
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">Choose a thread from the left to view messages</p>
            </div>
          ) : (
            <>
              {/* contact header */}
              <div className="flex items-center gap-4 border-b border-white/[0.04] px-8 py-6 shrink-0 bg-card backdrop-blur-xl">
                <button
                  onClick={() => setSelectedThreadId(null)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Avatar name={contactName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{contactPhone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                  onClick={() => toast.info('Call feature coming soon')}
                  className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl"
                />
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className={`h-12 bg-muted ${i % 2 === 0 ? 'w-3/4' : 'w-2/3 ml-auto'} rounded-2xl`}
                      />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-3 text-muted-foreground" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send the first message below</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isSent
                              ? 'bg-primary text-white rounded-br-md'
                              : 'bg-card border border-white/[0.04] text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isSent ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span
                              className={`text-[10px] uppercase tracking-wider ${
                                isSent ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                            {isSent && msg.status === 'failed' && (
                              <span className="text-[10px] text-primary/80 ml-1 uppercase tracking-wider">Failed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* compose area */}
              <div className="border-t border-white/[0.04] px-8 py-6 shrink-0 bg-card backdrop-blur-xl">
                <div className="flex items-end gap-3">
                  <Textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="resize-none min-h-[40px] max-h-[120px] bg-card border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSend}
                    disabled={!composeText.trim() || sendMutation.isPending}
                    className="shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
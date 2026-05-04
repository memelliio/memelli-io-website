'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Phone,
  Clock,
  CheckCheck,
  Check,
  ArrowLeft,
  Search,
  X,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  Avatar,
  Input,
  Modal,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ================================================================
   Types
   ================================================================ */

interface SmsThread {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  direction: 'inbound' | 'outbound';
}

interface SmsMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: string;
  createdAt: string;
  fromNumber?: string;
  toNumber?: string;
}

interface ThreadsResponse {
  data: SmsThread[];
  meta: { total: number; page: number; perPage: number };
}

interface MessagesResponse {
  data: SmsMessage[];
  meta: { total: number };
}

interface Template {
  id: string;
  name: string;
  body: string;
}

interface TemplatesResponse {
  data: Template[];
}

/* ================================================================
   Helpers
   ================================================================ */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  );
}

function dateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'failed':
      return <X className="h-3 w-3 text-red-400" />;
    case 'queued':
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    default:
      return null;
  }
}

/* ================================================================
   Component
   ================================================================ */

export default function MessagingCenterPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  /* --- state --- */
  const [search, setSearch] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  /* --- thread list query --- */
  const { data: threadsData, isLoading: threadsLoading } = useQuery<ThreadsResponse>({
    queryKey: ['sms-threads', { search }],
    queryFn: async () => {
      const params = new URLSearchParams({ perPage: '100' });
      if (search) params.set('search', search);
      const res = await api.get<ThreadsResponse>(`/api/comms/sms/threads?${params}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 15000,
  });

  const threads = threadsData?.data ?? [];
  const totalThreads = threadsData?.meta?.total ?? 0;
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  /* --- messages query for selected thread --- */
  const { data: messagesData, isLoading: messagesLoading } = useQuery<MessagesResponse>({
    queryKey: ['sms-messages', selectedThreadId],
    queryFn: async () => {
      const res = await api.get<MessagesResponse>(
        `/api/comms/sms/threads/${selectedThreadId}/messages?limit=200`
      );
      if (res.error) throw new Error(res.error);
      // Normalize: API returns { success, data, meta }
      const payload = res.data as any;
      if (payload?.success !== undefined) {
        return { data: payload.data ?? [], meta: payload.meta ?? { total: 0 } };
      }
      return res.data!;
    },
    enabled: !!selectedThreadId,
    refetchInterval: 8000,
  });

  const messages = messagesData?.data ?? [];
  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  /* --- templates query --- */
  const { data: templatesData } = useQuery<TemplatesResponse>({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const res = await api.get<TemplatesResponse>('/api/comms/sms/templates');
      if (res.error) throw new Error(res.error);
      const payload = res.data as any;
      if (payload?.success !== undefined) {
        return { data: payload.data ?? [] };
      }
      return res.data!;
    },
  });

  const templates = templatesData?.data ?? [];

  /* --- send mutation (reply to existing thread) --- */
  const sendMutation = useMutation({
    mutationFn: async (payload: { body: string; scheduledAt?: string }) => {
      if (!selectedThreadId) throw new Error('No thread selected');
      const res = await api.post(`/api/comms/sms/send`, {
        threadId: selectedThreadId,
        body: payload.body,
      });
      if ((res as any).error) throw new Error((res as any).error);
    },
    onSuccess: () => {
      setComposeText('');
      setShowScheduleModal(false);
      setScheduleDate('');
      setScheduleTime('');
      queryClient.invalidateQueries({ queryKey: ['sms-messages', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['sms-threads'] });
      toast.success('Message sent');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to send message');
    },
  });

  /* --- handlers --- */
  const handleSelectThread = useCallback(
    (threadId: string) => {
      setSelectedThreadId(threadId);
      setMobileShowThread(true);
      // Messages query fetching the thread automatically marks it read via API
      queryClient.invalidateQueries({ queryKey: ['sms-threads'] });
    },
    [queryClient]
  );

  const handleSend = useCallback(() => {
    const trimmed = composeText.trim();
    if (!trimmed || !selectedThreadId) return;
    sendMutation.mutate({ body: trimmed });
  }, [composeText, selectedThreadId, sendMutation]);

  const handleScheduleSend = useCallback(() => {
    const trimmed = composeText.trim();
    if (!trimmed || !selectedThreadId || !scheduleDate || !scheduleTime) return;
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    sendMutation.mutate({ body: trimmed, scheduledAt });
  }, [composeText, selectedThreadId, scheduleDate, scheduleTime, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInsertTemplate = useCallback((template: Template) => {
    setComposeText(template.body);
    setShowTemplates(false);
    composeRef.current?.focus();
  }, []);

  /* --- auto-scroll --- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  /* --- invalidate thread list after reading messages (mark-read side effect) --- */
  useEffect(() => {
    if (selectedThreadId && messages.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['sms-threads'] });
    }
  }, [selectedThreadId, messages.length, queryClient]);

  /* --- group messages by date --- */
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: SmsMessage[] }[] = [];
    let currentDate = '';
    for (const msg of messages) {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  /* ================================================================
     Render
     ================================================================ */

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-0">
        <PageHeader
          title="Messaging Center"
          subtitle={`${totalThreads} conversation${totalThreads !== 1 ? 's' : ''}${totalUnread > 0 ? ` · ${totalUnread} unread` : ''}`}
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'Messaging Center' },
          ]}
          className="mb-6"
        />
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 border-t border-white/[0.04]">
        {/* ===== LEFT: Thread list ===== */}
        <div
          className={`w-full md:w-80 xl:w-96 shrink-0 flex flex-col border-r border-white/[0.04] bg-card backdrop-blur-xl ${
            mobileShowThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search */}
          <div className="p-4 lg:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-4 lg:p-6 space-y-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
                title="No SMS conversations"
                description={search ? 'Try a different phone number.' : 'Inbound SMS messages will appear here.'}
                className="border-0 bg-transparent mt-12"
              />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {threads.map((thread) => {
                  const isActive = thread.id === selectedThreadId;

                  return (
                    <button
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      className={`flex items-center gap-3 w-full px-4 lg:px-6 py-4 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-red-500/[0.08] border-l-2 border-red-400'
                          : 'hover:bg-white/[0.04] border-l-2 border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar name={thread.contactName} size="sm" />
                      </div>

                      {/* Info */}
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="shrink-0 text-green-400">
                            <Phone className="h-3 w-3" />
                          </span>
                          <p
                            className={`text-xs truncate ${
                              thread.unreadCount > 0
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {thread.lastMessage || thread.contactPhone}
                          </p>
                        </div>
                      </div>

                      {/* Unread badge */}
                      {thread.unreadCount > 0 && (
                        <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                          {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Conversation thread ===== */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-card ${
            !mobileShowThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!selectedThreadId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose an SMS thread from the left to view messages
              </p>
            </div>
          ) : (
            <>
              {/* Contact header */}
              <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 lg:px-8 py-4 lg:py-5 shrink-0 bg-card backdrop-blur-xl">
                <button
                  onClick={() => {
                    setMobileShowThread(false);
                    setSelectedThreadId(null);
                  }}
                  className="md:hidden p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="relative shrink-0">
                  <Avatar name={selectedThread?.contactName ?? 'Unknown'} size="sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedThread?.contactName ?? 'Unknown'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {selectedThread?.contactPhone && (
                      <span>{selectedThread.contactPhone}</span>
                    )}
                  </div>
                </div>

                {/* SMS badge */}
                <span className="hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium border bg-green-500/10 text-green-400 border-green-500/20">
                  <Phone className="h-3 w-3" />
                  SMS
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-1">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className={`h-14 bg-muted ${i % 2 === 0 ? 'w-3/4' : 'w-2/3 ml-auto'} rounded-2xl`}
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
                  groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      {/* Date divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/[0.04]" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                          {dateDivider(group.date)}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                      </div>

                      {/* Messages in group */}
                      <div className="space-y-3">
                        {group.messages.map((msg) => {
                          const isSent = msg.direction === 'outbound';

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="max-w-[80%] lg:max-w-[65%]">
                                {/* Message bubble */}
                                <div
                                  className={`rounded-2xl px-4 py-3 ${
                                    isSent
                                      ? 'bg-red-600 text-white rounded-br-md'
                                      : 'bg-card border border-white/[0.04] text-foreground rounded-bl-md'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.body}
                                  </p>

                                  {/* Timestamp + status */}
                                  <div
                                    className={`flex items-center gap-1.5 mt-1.5 ${
                                      isSent ? 'justify-end' : 'justify-start'
                                    }`}
                                  >
                                    <span
                                      className={`text-[10px] ${
                                        isSent ? 'text-red-200/70' : 'text-muted-foreground'
                                      }`}
                                    >
                                      {formatTimestamp(msg.createdAt)}
                                    </span>
                                    {isSent && getStatusIcon(msg.status)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ===== Compose area ===== */}
              <div className="border-t border-white/[0.04] px-4 lg:px-8 py-4 lg:py-5 shrink-0 bg-card backdrop-blur-xl">
                {/* Template bar */}
                {showTemplates && templates.length > 0 && (
                  <div className="mb-3 max-h-40 overflow-y-auto rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl divide-y divide-white/[0.04]">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleInsertTemplate(tpl)}
                        className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-all duration-150"
                      >
                        <p className="text-xs font-medium text-foreground">{tpl.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{tpl.body}</p>
                      </button>
                    ))}
                  </div>
                )}

                {showTemplates && templates.length === 0 && (
                  <div className="mb-3 rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground">No SMS templates available</p>
                  </div>
                )}

                {/* Input row */}
                <div className="flex items-end gap-2 lg:gap-3">
                  {/* Template button */}
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`rounded-xl p-2.5 border transition-all duration-200 ${
                      showTemplates
                        ? 'bg-white/[0.08] border-white/[0.1] text-foreground'
                        : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                    }`}
                    title="Templates"
                  >
                    <FileText className="h-4 w-4" />
                  </button>

                  {/* Text area */}
                  <div className="flex-1">
                    <textarea
                      ref={composeRef as React.RefObject<HTMLTextAreaElement>}
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send SMS..."
                      rows={1}
                      className="w-full resize-none min-h-[42px] max-h-[120px] rounded-xl border border-white/[0.06] bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                    />
                  </div>

                  {/* Schedule button */}
                  <button
                    onClick={() => {
                      if (!composeText.trim()) {
                        toast.error('Type a message first');
                        return;
                      }
                      setShowScheduleModal(true);
                    }}
                    className="rounded-xl p-2.5 border border-white/[0.06] text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all duration-200"
                    title="Schedule message"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>

                  {/* Send button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSend}
                    disabled={!composeText.trim() || sendMutation.isPending}
                    className="shrink-0 bg-red-600 hover:bg-red-500 text-white rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== Schedule Modal ===== */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Message"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Schedule this SMS to{' '}
            <span className="text-green-400">{selectedThread?.contactPhone}</span>
          </p>

          <div className="bg-card border border-white/[0.04] rounded-xl p-3">
            <p className="text-xs text-muted-foreground line-clamp-3">{composeText}</p>
          </div>

          <Input
            label="Date"
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="bg-card border-white/[0.06] text-foreground"
          />

          <Input
            label="Time"
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="bg-card border-white/[0.06] text-foreground"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Clock className="h-3.5 w-3.5" />}
              onClick={handleScheduleSend}
              disabled={!scheduleDate || !scheduleTime || sendMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {sendMutation.isPending ? 'Scheduling...' : 'Schedule Send'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

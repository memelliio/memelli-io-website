'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Plus,
  Paperclip,
  Send,
  Reply,
  Forward,
  Trash2,
  Archive,
  Clock,
  X,
  Inbox,
  MailOpen,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import {
  PageHeader,
  SearchInput,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  Modal,
  Input,
  Textarea,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { toast } from 'sonner';

/* ───────────────── Types ───────────────── */

interface EmailRecord {
  id: string;
  subject: string;
  from: string;
  to: string;
  preview: string;
  isRead: boolean;
  hasAttachments: boolean;
  direction: 'inbound' | 'outbound';
  createdAt: string;
  body?: string;
  cc?: string | null;
}

interface EmailDetail {
  id: string;
  subject: string;
  from: string;
  to: string;
  cc?: string | null;
  body: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: { id: string; name: string; size: number; url: string }[];
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

interface EmailsResponse {
  data: EmailRecord[];
  meta: { total: number; page: number; perPage: number };
}

type EmailDetailResponse = EmailDetail;

interface CommsStats {
  totalEmailThreads: number;
  totalEmailMessages: number;
  totalCalls: number;
  totalSmsThreads: number;
  totalSmsMessages: number;
  totalTickets: number;
  openTickets: number;
  totalChatSessions: number;
  totalChatMessages: number;
  totalVoicemails: number;
}

/* ───────────────── Helpers ───────────────── */

const PAGE_SIZE = 25;

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

/* ───────────────── Stats Bar ───────────────── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}

function StatCard({ icon, label, value, loading }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-5 py-4 flex-1 min-w-0">
      <div className="shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-14 mt-1 rounded-lg" />
        ) : (
          <p className="text-base font-semibold text-foreground mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Component ───────────────── */

export default function EmailPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  /* ── Comms stats query ── */
  const { data: statsData, isLoading: statsLoading } = useQuery<CommsStats>({
    queryKey: ['comms-stats'],
    queryFn: async () => {
      const res = await api.get<CommsStats>('/api/admin/communications/stats');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 60_000,
  });

  /* ── Email list query ── */
  const { data, isLoading } = useQuery<EmailsResponse>({
    queryKey: ['emails', { search, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res = await api.get<EmailsResponse>(`/api/comms/email/threads?${params}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const emails = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* ── Email detail query ── */
  const { data: detailData, isLoading: detailLoading } = useQuery<EmailDetailResponse>({
    queryKey: ['email', selectedEmailId],
    queryFn: async () => {
      const res = await api.get<EmailDetailResponse>(`/api/comms/email/threads/${selectedEmailId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!selectedEmailId,
  });

  const selectedEmail = detailData ?? null;

  /* ── Mutations ── */
  const sendMutation = useMutation({
    mutationFn: async (payload: { to: string; subject: string; body: string }) => {
      const res = await api.post('/api/comms/email/send', payload);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Email sent');
      setComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['comms-stats'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send email');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/comms/email/threads/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Email deleted');
      setSelectedEmailId(null);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['comms-stats'] });
    },
    onError: () => toast.error('Failed to delete email'),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/comms/email/threads/${id}`, { archived: true });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Email archived');
      setSelectedEmailId(null);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: () => toast.error('Failed to archive email'),
  });

  /* ── Handlers ── */
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSelectEmail = useCallback((email: EmailRecord) => {
    setSelectedEmailId(email.id);
  }, []);

  const handleCompose = useCallback(() => {
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setComposeOpen(true);
  }, []);

  const handleReply = useCallback(() => {
    if (!selectedEmail) return;
    const replyTo = selectedEmail.direction === 'inbound' ? selectedEmail.from : selectedEmail.to;
    const subject = selectedEmail.subject.startsWith('Re:')
      ? selectedEmail.subject
      : `Re: ${selectedEmail.subject}`;
    setComposeTo(replyTo);
    setComposeSubject(subject);
    setComposeBody(`\n\n---\nOn ${new Date(selectedEmail.createdAt).toLocaleString()}, ${selectedEmail.from} wrote:\n\n${selectedEmail.body?.replace(/<[^>]*>/g, '') ?? ''}`);
    setComposeOpen(true);
  }, [selectedEmail]);

  const handleForward = useCallback(() => {
    if (!selectedEmail) return;
    const subject = selectedEmail.subject.startsWith('Fwd:')
      ? selectedEmail.subject
      : `Fwd: ${selectedEmail.subject}`;
    setComposeTo('');
    setComposeSubject(subject);
    setComposeBody(`\n\n---\nForwarded message from ${selectedEmail.from}:\n\n${selectedEmail.body?.replace(/<[^>]*>/g, '') ?? ''}`);
    setComposeOpen(true);
  }, [selectedEmail]);

  const handleSend = useCallback(() => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast.error('To and Subject are required');
      return;
    }
    sendMutation.mutate({ to: composeTo, subject: composeSubject, body: composeBody });
  }, [composeTo, composeSubject, composeBody, sendMutation]);

  /* ───────────────── Render ───────────────── */

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-6 py-6 border-b border-white/[0.04]">
        <PageHeader
          title="Email Inbox"
          subtitle={`${total} email${total !== 1 ? 's' : ''}`}
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'Email' },
          ]}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleCompose}
            >
              Compose
            </Button>
          }
        />

        {/* Stats bar */}
        <div className="flex flex-wrap gap-3 mt-6">
          <StatCard
            icon={<Mail className="h-4 w-4" />}
            label="Email Threads"
            value={fmtNum(statsData?.totalEmailThreads)}
            loading={statsLoading}
          />
          <StatCard
            icon={<MailOpen className="h-4 w-4" />}
            label="Total Messages"
            value={fmtNum(statsData?.totalEmailMessages)}
            loading={statsLoading}
          />
          <StatCard
            icon={<Send className="h-4 w-4" />}
            label="Sent (outbound)"
            value={
              statsLoading
                ? '—'
                : emails.length > 0
                  ? fmtNum(emails.filter((e) => e.direction === 'outbound').length)
                  : '0'
            }
            loading={false}
          />
          <StatCard
            icon={<BarChart2 className="h-4 w-4" />}
            label="SMS Threads"
            value={fmtNum(statsData?.totalSmsThreads)}
            loading={statsLoading}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Open Tickets"
            value={fmtNum(statsData?.openTickets)}
            loading={statsLoading}
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left column: email list ── */}
        <div className="w-[420px] shrink-0 border-r border-white/[0.04] flex flex-col bg-card">
          <div className="p-6 border-b border-white/[0.04]">
            <SearchInput
              placeholder="Search emails..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <EmptyState
                icon={<Mail className="h-6 w-6" />}
                title="No emails found"
                description={
                  search
                    ? 'Try adjusting your search terms.'
                    : 'Emails will appear here.'
                }
                action={
                  !search
                    ? {
                        label: 'Compose Email',
                        onClick: handleCompose,
                        leftIcon: <Plus className="h-3.5 w-3.5" />,
                      }
                    : undefined
                }
                className="border-0 bg-transparent py-16"
              />
            ) : (
              <>
                <div className="divide-y divide-white/[0.04]">
                  {emails.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`flex items-start gap-3 w-full px-6 py-6 hover:bg-white/[0.04] transition-all duration-200 text-left ${
                        selectedEmailId === email.id
                          ? 'bg-primary/80/[0.08] border-l-2 border-l-purple-500 text-primary/80'
                          : !email.isRead
                            ? 'bg-card'
                            : ''
                      }`}
                    >
                      {/* Unread dot */}
                      <div className="pt-1.5 shrink-0">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            email.isRead ? 'bg-transparent' : 'bg-primary/70'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm truncate ${
                              email.isRead
                                ? 'text-muted-foreground'
                                : 'text-foreground font-semibold'
                            }`}
                          >
                            {email.direction === 'inbound' ? email.from : `To: ${email.to}`}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {relativeTime(email.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate mt-0.5 ${
                            email.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'
                          }`}
                        >
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {email.preview}
                          </p>
                          {email.hasAttachments && (
                            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/[0.04] px-6 py-6">
                    <p className="text-xs text-muted-foreground">
                      Page {page}/{totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right column: email detail ── */}
        <div className="flex-1 overflow-y-auto bg-card">
          {!selectedEmailId ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Inbox className="h-12 w-12 mb-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select an email to read</p>
            </div>
          ) : detailLoading ? (
            <div className="p-8 space-y-6">
              <Skeleton className="h-7 w-3/4 rounded-2xl" />
              <Skeleton className="h-4 w-1/2 rounded-2xl" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : !selectedEmail ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Email not found.
            </div>
          ) : (
            <div className="p-8 space-y-6 max-w-3xl">
              {/* Subject + badges */}
              <div>
                <div className="flex items-start justify-between gap-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {selectedEmail.subject}
                  </h2>
                  <button
                    onClick={() => setSelectedEmailId(null)}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground shrink-0 transition-all duration-200"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={selectedEmail.direction === 'inbound' ? 'info' : 'primary'}>
                    {selectedEmail.direction === 'inbound' ? 'Received' : 'Sent'}
                  </Badge>
                  {selectedEmail.hasAttachments && (
                    <Badge variant="default">
                      <Paperclip className="h-3 w-3 mr-1" />
                      Attachments
                    </Badge>
                  )}
                </div>
              </div>

              {/* From / To / Date */}
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="text-foreground">{selectedEmail.from}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="text-foreground">{selectedEmail.to}</span>
                </div>
                {selectedEmail.cc && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CC</span>
                    <span className="text-foreground">{selectedEmail.cc}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(selectedEmail.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Reply className="h-3.5 w-3.5" />}
                  onClick={handleReply}
                >
                  Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Forward className="h-3.5 w-3.5" />}
                  onClick={handleForward}
                >
                  Forward
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Archive className="h-3.5 w-3.5" />}
                  onClick={() => archiveMutation.mutate(selectedEmail.id)}
                  disabled={archiveMutation.isPending}
                >
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5 text-primary" />}
                  onClick={() => deleteMutation.mutate(selectedEmail.id)}
                  disabled={deleteMutation.isPending}
                  className="text-primary hover:text-primary/80"
                >
                  Delete
                </Button>
              </div>

              {/* Email body */}
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                <div
                  className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>

              {/* Attachments */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Attachments ({selectedEmail.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                      >
                        <span className="text-sm text-foreground truncate">
                          {attachment.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-3">
                          {formatFileSize(attachment.size)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Compose Modal ── */}
      <Modal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose Email"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <Input
            label="To"
            placeholder="recipient@example.com"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
          />
          <Input
            label="Subject"
            placeholder="Email subject"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
          />
          <Textarea
            label="Body"
            placeholder="Write your message..."
            rows={8}
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            autoResize
            maxRows={16}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setComposeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="h-3.5 w-3.5" />}
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

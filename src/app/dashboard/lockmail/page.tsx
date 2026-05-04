'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface MailAccount {
  id: string;
  address: string;
  displayName?: string;
}

interface MailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
}

type Folder = 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH';

interface ComposeState {
  open: boolean;
  minimized: boolean;
  to: string;
  subject: string;
  body: string;
  sending: boolean;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SVG Icons (inline, no emoji)                                       */
/* ─────────────────────────────────────────────────────────────────── */

function IconInbox({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconSent({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconDraft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconCompose({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconStar({ className = 'w-4 h-4', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconClose({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconMinimize({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconReply({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function IconMail({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconLock({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token') || localStorage.getItem('memelli_live_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function extractName(address: string): string {
  const match = address.match(/^(.+?)\s*</);
  if (match) return match[1].trim();
  return address.split('@')[0];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export default function LockMailPage() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder>('INBOX');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [compose, setCompose] = useState<ComposeState>({
    open: false,
    minimized: false,
    to: '',
    subject: '',
    body: '',
    sending: false,
  });
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ── Fetch accounts ── */
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch(`${getApiBase()}/api/mail/accounts`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setAccounts(Array.isArray(data) ? data : data.data ?? []);
        }
      } catch {
        // silent — show empty state
      }
    }
    fetchAccounts();
  }, []);

  /* ── Fetch messages ── */
  const fetchMessages = useCallback(async (folder: Folder) => {
    setLoadingMessages(true);
    setSelectedMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/mail/messages?folder=${folder}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.data ?? []);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(activeFolder);
  }, [activeFolder, fetchMessages, refreshKey]);

  /* ── Select message (fetch detail) ── */
  async function selectMessage(msg: MailMessage) {
    setLoadingDetail(true);
    setSelectedMessage(msg);
    try {
      const res = await fetch(`${getApiBase()}/api/mail/messages/${msg.id}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const detail: MailMessage = await res.json();
        setSelectedMessage(detail);
        // Mark read locally
        if (!detail.isRead) {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
          );
          // Fire-and-forget mark read
          fetch(`${getApiBase()}/api/mail/messages/${msg.id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ isRead: true }),
          }).catch(() => {});
        }
      }
    } catch {
      // keep partial data already set
    } finally {
      setLoadingDetail(false);
    }
  }

  /* ── Star toggle ── */
  async function toggleStar(msg: MailMessage, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !msg.isStarred;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isStarred: next } : m)));
    if (selectedMessage?.id === msg.id) setSelectedMessage((s) => s && { ...s, isStarred: next });
    try {
      await fetch(`${getApiBase()}/api/mail/messages/${msg.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isStarred: next }),
      });
    } catch {
      // revert
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isStarred: !next } : m)));
    }
  }

  /* ── Trash ── */
  async function trashMessage(msgId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (selectedMessage?.id === msgId) setSelectedMessage(null);
    try {
      await fetch(`${getApiBase()}/api/mail/messages/${msgId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      // best-effort
    }
  }

  /* ── Send ── */
  async function handleSend() {
    if (!compose.to.trim() || !compose.subject.trim()) {
      setSendError('To and Subject are required.');
      return;
    }
    setSendError(null);
    setCompose((c) => ({ ...c, sending: true }));
    try {
      const res = await fetch(`${getApiBase()}/api/mail/send`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          to: compose.to.trim(),
          subject: compose.subject.trim(),
          bodyText: compose.body,
          bodyHtml: `<pre style="font-family:inherit;white-space:pre-wrap">${compose.body.replace(/</g, '&lt;')}</pre>`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendError((err as { message?: string }).message ?? 'Failed to send. Please try again.');
      } else {
        setSendSuccess(true);
        setTimeout(() => {
          setCompose({ open: false, minimized: false, to: '', subject: '', body: '', sending: false });
          setSendSuccess(false);
          if (activeFolder === 'SENT') setRefreshKey((k) => k + 1);
        }, 1200);
      }
    } catch {
      setSendError('Network error. Please try again.');
    } finally {
      setCompose((c) => ({ ...c, sending: false }));
    }
  }

  /* ── Reply shortcut ── */
  function handleReply() {
    if (!selectedMessage) return;
    setCompose({
      open: true,
      minimized: false,
      to: selectedMessage.from,
      subject: selectedMessage.subject.startsWith('Re:')
        ? selectedMessage.subject
        : `Re: ${selectedMessage.subject}`,
      body: `\n\n---\nOn ${new Date(selectedMessage.date).toLocaleString()}, ${selectedMessage.from} wrote:\n${selectedMessage.bodyText ?? ''}`,
      sending: false,
    });
  }

  /* ── Folder counts ── */
  const unreadCount = messages.filter((m) => !m.isRead && activeFolder === 'INBOX').length;

  const folders: { key: Folder; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { key: 'INBOX', label: 'Inbox', Icon: IconInbox },
    { key: 'SENT', label: 'Sent', Icon: IconSent },
    { key: 'DRAFTS', label: 'Drafts', Icon: IconDraft },
    { key: 'TRASH', label: 'Trash', Icon: IconTrash },
  ];

  const primaryAddress = accounts[0]?.address ?? null;

  /* ─────────────────────────────────────────────────────────────── */
  /*  Render                                                         */
  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="flex h-screen bg-[#0e0e0e] text-gray-100 overflow-hidden font-sans select-none">
      {/* ═══════════════════════════════════════════ LEFT COLUMN */}
      <aside className="w-[200px] flex-none flex flex-col border-r border-white/[0.06] bg-[#111111]">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 pt-5 pb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-red-600 text-white">
            <IconLock className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">Lockmail</span>
        </div>

        {/* Compose button */}
        <div className="px-3 mb-4">
          <button
            onClick={() => {
              setSendError(null);
              setSendSuccess(false);
              setCompose({ open: true, minimized: false, to: '', subject: '', body: '', sending: false });
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-medium py-2 rounded-md transition-colors"
          >
            <IconCompose className="w-3.5 h-3.5" />
            Compose
          </button>
        </div>

        {/* Folder list */}
        <nav className="flex-1 px-2 space-y-0.5">
          {folders.map(({ key, label, Icon }) => {
            const isActive = activeFolder === key;
            const count = key === 'INBOX'
              ? messages.filter((m) => !m.isRead).length
              : 0;
            return (
              <button
                key={key}
                onClick={() => setActiveFolder(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-red-600/20 text-red-400 font-medium'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 flex-none" />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span className="flex-none text-[10px] font-bold bg-red-600 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Account address */}
        {primaryAddress && (
          <div className="px-3 py-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-gray-500 truncate" title={primaryAddress}>
              {primaryAddress}
            </p>
          </div>
        )}
      </aside>

      {/* ═══════════════════════════════════════════ MIDDLE COLUMN */}
      <section className="w-[320px] flex-none flex flex-col border-r border-white/[0.06] bg-[#131313]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white capitalize">{activeFolder.charAt(0) + activeFolder.slice(1).toLowerCase()}</h2>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
            title="Refresh"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Message list */}
        <ul className="flex-1 overflow-y-auto">
          {loadingMessages ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-3 bg-white/[0.06] rounded w-2/3" />
                  <div className="h-2.5 bg-white/[0.04] rounded w-full" />
                  <div className="h-2 bg-white/[0.03] rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
              <IconMail className="w-8 h-8" />
              <p className="text-sm">No messages</p>
            </div>
          ) : (
            messages.map((msg) => (
              <li
                key={msg.id}
                onClick={() => selectMessage(msg)}
                className={`relative flex flex-col gap-0.5 px-4 py-3 cursor-pointer border-b border-white/[0.04] transition-colors ${
                  selectedMessage?.id === msg.id
                    ? 'bg-white/[0.06]'
                    : 'hover:bg-white/[0.03]'
                } ${!msg.isRead ? 'border-l-2 border-l-red-600' : 'border-l-2 border-l-transparent'}`}
              >
                {/* Row 1: sender + time */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs truncate ${!msg.isRead ? 'font-semibold text-white' : 'text-gray-300'}`}>
                    {extractName(msg.from)}
                  </span>
                  <span className="text-[10px] text-gray-600 flex-none">{formatDate(msg.date)}</span>
                </div>
                {/* Row 2: subject */}
                <span className={`text-xs truncate ${!msg.isRead ? 'font-medium text-gray-100' : 'text-gray-400'}`}>
                  {msg.subject}
                </span>
                {/* Row 3: snippet + star */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-600 truncate flex-1">
                    {msg.snippet ?? ''}
                  </span>
                  <button
                    onClick={(e) => toggleStar(msg, e)}
                    className={`flex-none p-0.5 rounded transition-colors ${msg.isStarred ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-500'}`}
                  >
                    <IconStar className="w-3 h-3" filled={msg.isStarred} />
                  </button>
                  <button
                    onClick={(e) => trashMessage(msg.id, e)}
                    className="flex-none p-0.5 rounded text-gray-700 hover:text-red-500 transition-colors"
                  >
                    <IconTrash className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* ═══════════════════════════════════════════ RIGHT COLUMN */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0e0e0e]">
        {selectedMessage ? (
          <>
            {/* Message header */}
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h1 className="text-base font-semibold text-white mb-3 leading-snug">
                {selectedMessage.subject}
              </h1>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-500 font-medium">From</span>
                <span className="text-gray-300">{selectedMessage.from}</span>
                <span className="text-gray-500 font-medium">To</span>
                <span className="text-gray-300">{selectedMessage.to}</span>
                <span className="text-gray-500 font-medium">Date</span>
                <span className="text-gray-300">
                  {new Date(selectedMessage.date).toLocaleString([], {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Message body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loadingDetail ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`h-3 bg-white/[0.05] rounded ${i % 3 === 2 ? 'w-1/2' : 'w-full'}`} />
                  ))}
                </div>
              ) : selectedMessage.bodyHtml ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                  {selectedMessage.bodyText ?? '(No content)'}
                </pre>
              )}
            </div>

            {/* Reply bar */}
            <div className="px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={handleReply}
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 text-sm px-4 py-2 rounded-md transition-colors"
              >
                <IconReply className="w-3.5 h-3.5" />
                Reply
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] text-red-600">
              <IconLock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Lockmail</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Your private, encrypted inbox. Select a message to read it here.
              </p>
            </div>
            {primaryAddress && (
              <div className="mt-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-xs text-gray-500 mb-0.5">Your Lockmail address</p>
                <p className="text-sm font-medium text-red-400">{primaryAddress}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════ COMPOSE PANEL */}
      {compose.open && (
        <div
          className={`fixed bottom-0 right-6 z-50 w-[420px] bg-[#1a1a1a] border border-white/[0.1] rounded-t-xl shadow-2xl shadow-black/60 flex flex-col transition-all duration-200 ${
            compose.minimized ? 'h-[44px] overflow-hidden' : 'h-[440px]'
          }`}
        >
          {/* Compose header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] flex-none">
            <span className="flex-1 text-sm font-medium text-white">New Message</span>
            <button
              onClick={() => setCompose((c) => ({ ...c, minimized: !c.minimized }))}
              className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
              title={compose.minimized ? 'Expand' : 'Minimize'}
            >
              <IconMinimize className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCompose({ open: false, minimized: false, to: '', subject: '', body: '', sending: false });
                setSendError(null);
                setSendSuccess(false);
              }}
              className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
              title="Close"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compose fields */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="border-b border-white/[0.06]">
              <input
                type="email"
                placeholder="To"
                value={compose.to}
                onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))}
                className="w-full bg-transparent px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none"
              />
            </div>
            <div className="border-b border-white/[0.06]">
              <input
                type="text"
                placeholder="Subject"
                value={compose.subject}
                onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
                className="w-full bg-transparent px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none"
              />
            </div>
            <textarea
              placeholder="Write your message..."
              value={compose.body}
              onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-300 placeholder-gray-600 outline-none resize-none"
            />

            {/* Error / success */}
            {sendError && (
              <p className="px-4 pb-1 text-xs text-red-400">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="px-4 pb-1 text-xs text-green-400">Message sent.</p>
            )}

            {/* Compose footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] flex-none">
              <button
                onClick={handleSend}
                disabled={compose.sending}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
              >
                <IconSent className="w-3.5 h-3.5" />
                {compose.sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

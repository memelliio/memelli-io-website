'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  CheckCheck,
  Trash2,
  Circle,
  Bell,
  Bot,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useNotificationStore, type Notification } from '../../stores/notifications';

// ── Category tabs ────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'system' | 'ai';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'system', label: 'System' },
  { key: 'ai', label: 'AI' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Info className="h-4 w-4 text-blue-400" />;
  }
}

// ── Notification Center ──────────────────────────────────────────────────────

export function NotificationCenter() {
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const sseConnected = useNotificationStore((s) => s.sseConnected);

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter notifications by tab
  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'system':
        return notifications.filter(
          (n) => !n.category || n.category === 'system'
        );
      case 'ai':
        return notifications.filter((n) => n.category === 'ai');
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((n) => n.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkMarkRead = useCallback(() => {
    selectedIds.forEach((id) => markRead(id));
    setSelectedIds(new Set());
  }, [selectedIds, markRead]);

  const bulkDelete = useCallback(() => {
    selectedIds.forEach((id) => removeNotification(id));
    setSelectedIds(new Set());
  }, [selectedIds, removeNotification]);

  const handleClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markRead(notification.id);
      }
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    },
    [markRead, router]
  );

  return (
    <div className="flex h-full flex-col -mx-6 -my-4">
      {/* Header with connection status */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              sseConnected ? 'bg-emerald-400' : 'bg-[hsl(var(--muted-foreground))]'
            }`}
            title={sseConnected ? 'Real-time connected' : 'Disconnected'}
          />
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSelectedIds(new Set());
            }}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-red-400'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
                {unreadCount}
              </span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkMarkRead}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <Check className="h-3 w-3" />
              Read
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
            <button
              onClick={deselectAll}
              className="rounded px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
            <Bell className="h-8 w-8 mb-3" />
            <p className="text-sm">
              {activeTab === 'unread'
                ? 'No unread notifications'
                : activeTab === 'ai'
                  ? 'No AI notifications'
                  : activeTab === 'system'
                    ? 'No system notifications'
                    : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((notification) => {
              const isSelected = selectedIds.has(notification.id);
              return (
                <li
                  key={notification.id}
                  className={`flex items-start gap-3 border-b border-[hsl(var(--border))] px-4 py-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/5'
                      : notification.read
                        ? 'hover:bg-[hsl(var(--muted))]'
                        : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(notification.id);
                    }}
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-[hsl(var(--border))] hover:border-zinc-500'
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </button>

                  {/* Unread dot */}
                  <Circle
                    className={`mt-1.5 h-2 w-2 shrink-0 ${
                      notification.read
                        ? 'text-transparent fill-transparent'
                        : 'text-red-500 fill-red-500'
                    }`}
                  />

                  {/* Content */}
                  <button
                    onClick={() => handleClick(notification)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {typeIcon(notification.type)}
                      {notification.category === 'ai' && (
                        <Bot className="h-3 w-3 text-red-400" />
                      )}
                      <p
                        className={`text-sm leading-snug truncate ${
                          notification.read
                            ? 'text-[hsl(var(--muted-foreground))] font-normal'
                            : 'text-[hsl(var(--foreground))] font-medium'
                        }`}
                      >
                        {notification.title}
                      </p>
                    </div>
                    {notification.message && (
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </button>

                  {/* Quick actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(notification.id);
                        }}
                        className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-[hsl(var(--muted))] transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-[hsl(var(--muted))] transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer: select all */}
      {filtered.length > 0 && (
        <div className="shrink-0 border-t border-[hsl(var(--border))] px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={selectedIds.size === filtered.length ? deselectAll : selectAll}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {selectedIds.size === filtered.length ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

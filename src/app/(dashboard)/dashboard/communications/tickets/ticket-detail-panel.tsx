'use client';

import { useState } from 'react';
import {
  Clock, AlertTriangle, User, Send, X, ArrowUpRight,
  CheckCircle2, Circle, MessageSquare, Bot,
} from 'lucide-react';
import { Button, Badge, Card, CardContent } from '@memelli/ui';
import type { TicketItem, TicketComment } from './page';

interface TicketDetailPanelProps {
  ticket: TicketItem;
  onUpdateStatus: (id: string, status: TicketItem['status']) => void;
  onAddComment: (id: string, content: string) => void;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  waiting: { label: 'Waiting', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  resolved: { label: 'Resolved', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  closed: { label: 'Closed', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-zinc-400' },
  medium: { label: 'Medium', color: 'text-blue-400' },
  high: { label: 'High', color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' },
};

function getSlaStatus(deadline?: string) {
  if (!deadline) return null;
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return { label: 'SLA Breached', color: 'text-red-400 bg-red-900/20 border-red-800', pct: 0 };
  const hours = remaining / 3600000;
  const mins = Math.floor(remaining / 60000);
  if (hours < 1) return { label: `${mins}m remaining`, color: 'text-red-400 bg-red-900/20 border-red-800', pct: Math.max(5, mins / 60 * 100) };
  if (hours < 4) return { label: `${Math.floor(hours)}h ${mins % 60}m remaining`, color: 'text-orange-400 bg-orange-900/20 border-orange-800', pct: Math.min(100, hours / 8 * 100) };
  return { label: `${Math.floor(hours)}h ${mins % 60}m remaining`, color: 'text-green-400 bg-green-900/20 border-green-800', pct: Math.min(100, hours / 8 * 100) };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TicketDetailPanel({
  ticket,
  onUpdateStatus,
  onAddComment,
  onClose,
}: TicketDetailPanelProps) {
  const [commentInput, setCommentInput] = useState('');
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);

  const sla = getSlaStatus(ticket.slaDeadline);
  const comments = ticket.comments ?? [];

  function handleSendComment() {
    if (!commentInput.trim()) return;
    onAddComment(ticket.id, commentInput.trim());
    setCommentInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  }

  function handleEscalate() {
    onUpdateStatus(ticket.id, 'open');
    setShowEscalateConfirm(false);
    onAddComment(ticket.id, 'Ticket escalated to management.');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-600 font-mono">{ticket.id}</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">{ticket.subject}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG[ticket.status]?.color}`}>
            {STATUS_CONFIG[ticket.status]?.label}
          </span>
          <span className={`text-xs font-medium ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
            {ticket.priority === 'urgent' && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
            {PRIORITY_CONFIG[ticket.priority]?.label} priority
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
        {/* SLA Indicator */}
        {sla && (
          <div className={`rounded-lg border p-4 ${sla.color}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">SLA Status</span>
              </div>
              <span className="text-xs font-medium">{sla.label}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sla.pct > 50 ? 'bg-green-500' : sla.pct > 20 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${sla.pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Customer</span>
            <p className="text-sm text-zinc-200 font-medium mt-0.5">{ticket.customerName}</p>
            <p className="text-xs text-zinc-500">{ticket.customerEmail}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Assignee</span>
            <p className="text-sm text-zinc-200 font-medium mt-0.5">{ticket.assignee ?? 'Unassigned'}</p>
          </div>
        </div>

        {/* Description */}
        {ticket.description && (
          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Description</h4>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm text-zinc-300 leading-relaxed">{ticket.description}</p>
            </div>
          </div>
        )}

        {/* Status Updates */}
        <div>
          <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Update Status</h4>
          <div className="flex flex-wrap gap-2">
            {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onUpdateStatus(ticket.id, st)}
                disabled={ticket.status === st}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  ticket.status === st
                    ? STATUS_CONFIG[st].color + ' cursor-default'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {STATUS_CONFIG[st].label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments Thread */}
        <div>
          <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wide">
            Comments ({comments.length})
          </h4>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-6">No comments yet</p>
            ) : (
              comments.map((comment: TicketComment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg border p-3 ${
                    comment.authorRole === 'system'
                      ? 'border-zinc-800 bg-zinc-900/30'
                      : comment.authorRole === 'agent'
                      ? 'border-red-800/30 bg-red-900/10'
                      : 'border-zinc-800 bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {comment.authorRole === 'system' ? (
                        <Bot className="h-3 w-3 text-zinc-600" />
                      ) : comment.authorRole === 'agent' ? (
                        <User className="h-3 w-3 text-red-400" />
                      ) : (
                        <User className="h-3 w-3 text-zinc-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        comment.authorRole === 'agent' ? 'text-red-300' : 'text-zinc-400'
                      }`}>
                        {comment.authorName}
                      </span>
                      {comment.authorRole === 'agent' && (
                        <Badge variant="primary" className="text-[9px] px-1.5 py-0">Agent</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    comment.authorRole === 'system' ? 'text-zinc-500 italic' : 'text-zinc-300'
                  }`}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comment Input + Actions */}
      <div className="px-6 py-4 border-t border-zinc-800 shrink-0 space-y-3">
        <div className="flex items-end gap-2">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
          />
          <Button onClick={handleSendComment} disabled={!commentInput.trim()} size="sm">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status !== 'resolved' && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onUpdateStatus(ticket.id, 'resolved')}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
            </Button>
          )}
          {showEscalateConfirm ? (
            <div className="flex items-center gap-1">
              <Button variant="destructive" size="sm" onClick={handleEscalate}>
                Confirm Escalate
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEscalateConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEscalateConfirm(true)}
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Escalate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

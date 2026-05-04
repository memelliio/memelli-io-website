'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Trash2,
  Pencil,
  Calendar,
  User,
  Link2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  InlineEdit,
  Textarea,
  type BadgeVariant,
} from '@memelli/ui';
import { useApi } from '../../../../hooks/useApi';
import type { Task } from './page';

/* ------------------------------------------------------------------ */
/*  Maps                                                               */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  DONE: 'success',
  CANCELLED: 'error',
};

const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TaskDetailPanelProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export default function TaskDetailPanel({
  task,
  onComplete,
  onDelete,
  onEdit,
  onRefresh,
}: TaskDetailPanelProps) {
  const api = useApi();
  const queryClient = useQueryClient();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  /* ---- Inline update mutation ---- */
  const updateMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await api.patch(`/api/tasks/${task.id}`, patch);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onRefresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleAddComment() {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, comment]);
    setNewComment('');
    toast.success('Comment added');
  }

  const contactName = task.contact
    ? [task.contact.firstName, task.contact.lastName].filter(Boolean).join(' ') ||
      task.contact.email ||
      '\u2014'
    : null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</label>
        <InlineEdit
          value={task.title}
          onSave={(val: string) => updateMutation.mutate({ title: val })}
          placeholder="Task title"
          className="mt-1 text-lg font-semibold"
        />
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</label>
        <InlineEdit
          type="select"
          value={task.status}
          options={STATUS_OPTIONS}
          onSave={(val: string) => updateMutation.mutate({ status: val })}
          className="mt-1"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Priority</label>
        <div className="mt-1">
          <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'default'} className="capitalize">
            {task.priority.toLowerCase()}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Description</label>
        <InlineEdit
          value={task.description ?? ''}
          onSave={(val: string) => updateMutation.mutate({ description: val })}
          placeholder="Add a description..."
          className="mt-1"
        />
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-zinc-500" />
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Due Date</label>
          <p className="text-sm text-zinc-300 mt-0.5">
            {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No due date'}
          </p>
        </div>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-zinc-500" />
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Assignee</label>
          <p className="text-sm text-zinc-300 mt-0.5">
            {task.userId ? task.userId.slice(0, 8) + '...' : 'Unassigned'}
          </p>
        </div>
      </div>

      {/* Related Contact */}
      {contactName && (
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-zinc-500" />
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Related Contact</label>
            <a
              href={`/dashboard/contacts/${task.contactId}`}
              className="block text-sm text-red-400 hover:text-red-300 mt-0.5"
            >
              {contactName}
            </a>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Comments */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Comments</h3>

        {comments.length === 0 && (
          <p className="text-xs text-zinc-500 mb-3">No comments yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-sm text-zinc-200">{c.text}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            leftIcon={<Send className="h-3.5 w-3.5" />}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Pencil className="h-3.5 w-3.5" />}
          onClick={onEdit}
        >
          Edit
        </Button>

        {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            onClick={onComplete}
          >
            Complete
          </Button>
        )}

        <Button
          size="sm"
          variant="destructive"
          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

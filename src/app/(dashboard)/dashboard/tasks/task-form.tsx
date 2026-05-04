'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Textarea,
  Select,
  DatePicker,
  Combobox,
  type SelectOption,
  type ComboboxOption,
} from '@memelli/ui';
import { useApi } from '../../../../hooks/useApi';
import type { Task } from './page';

/* ------------------------------------------------------------------ */
/*  Options                                                            */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'PENDING', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskForm({ task, onClose, onSaved }: TaskFormProps) {
  const api = useApi();
  const isEdit = !!task?.id && task.id !== 'new';

  /* ---- Form state ---- */
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState(task?.status ?? 'PENDING');
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');
  const [dueAt, setDueAt] = useState<Date | null>(task?.dueAt ? new Date(task.dueAt) : null);
  const [contactIds, setContactIds] = useState<string[]>(task?.contactId ? [task.contactId] : []);
  const [contactOptions, setContactOptions] = useState<ComboboxOption[]>([]);

  /* ---- Load contacts for Combobox ---- */
  useEffect(() => {
    api
      .get<{ success: boolean; data: Array<{ id: string; firstName?: string; lastName?: string; email?: string }> }>(
        '/api/contacts?perPage=100'
      )
      .then((res) => {
        const raw = res.data;
        let list: Array<{ id: string; firstName?: string; lastName?: string; email?: string }> = [];
        if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;
        else if (Array.isArray(raw)) list = raw as any;

        setContactOptions(
          list.map((c) => ({
            value: c.id,
            label:
              [c.firstName, c.lastName].filter(Boolean).join(' ') ||
              c.email ||
              c.id.slice(0, 8),
          }))
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Submit mutation ---- */
  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title,
        description: description || undefined,
        priority,
        dueAt: dueAt ? dueAt.toISOString() : undefined,
        contactId: contactIds[0] || undefined,
      };

      if (isEdit) {
        payload.status = status;
        const res = await api.patch(`/api/tasks/${task!.id}`, payload);
        if (res.error) throw new Error(res.error);
        return res.data;
      } else {
        const res = await api.post('/api/tasks', payload);
        if (res.error) throw new Error(res.error);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created');
      onSaved();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task title"
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the task..."
        rows={3}
      />

      {isEdit && (
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v as Task['status'])}
        />
      )}

      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={(v) => setPriority(v as Task['priority'])}
      />

      <DatePicker
        value={dueAt}
        onChange={setDueAt}
        placeholder="Select due date"
        className="w-full"
      />

      <div>
        <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Contact</label>
        <Combobox
          options={contactOptions}
          values={contactIds}
          onChange={(v) => setContactIds(v.slice(0, 1))}
          placeholder="Search contacts..."
          maxItems={1}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={mutation.isPending}
        >
          {isEdit ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}

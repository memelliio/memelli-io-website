/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel — NewContactModal                                             */
/*  Extracted from ContactsPanel.tsx (refactor 2026-04-30).                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import type { Contact, NewContactForm } from './ContactsPanel.utils';

export interface NewContactModalProps {
  onClose: () => void;
  onCreated: (c: Contact) => void;
}

export function NewContactModal({ onClose, onCreated }: NewContactModalProps) {
  const api = useApi();
  const [form, setForm] = useState<NewContactForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.firstName.trim() && !form.email.trim()) {
        setError('First name or email is required.');
        return;
      }
      setSaving(true);
      setError(null);
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await api.post<Contact>('/api/contacts', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        tags,
      });
      setSaving(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data) {
        onCreated(res.data);
        onClose();
      }
    },
    [api, form, onCreated, onClose]
  );

  const inputCls =
    'rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:ring-1 focus:ring-teal-500/50 transition-all bg-white/[0.04] border border-white/[0.08]';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[hsl(var(--foreground))]/30" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl p-5 flex flex-col gap-4"
        style={{
          background: 'rgba(18,18,20,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            New Contact
          </span>
          <button
            onClick={onClose}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              placeholder="First name *"
              value={form.firstName}
              onChange={(e) =>
                setForm((p) => ({ ...p, firstName: e.target.value }))
              }
            />
            <input
              className={inputCls}
              placeholder="Last name *"
              value={form.lastName}
              onChange={(e) =>
                setForm((p) => ({ ...p, lastName: e.target.value }))
              }
            />
            <input
              className={`${inputCls} col-span-2`}
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <input
              className={inputCls}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
            <input
              className={inputCls}
              placeholder="Company"
              value={form.company}
              onChange={(e) =>
                setForm((p) => ({ ...p, company: e.target.value }))
              }
            />
            <input
              className={`${inputCls} col-span-2`}
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) =>
                setForm((p) => ({ ...p, tags: e.target.value }))
              }
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-400 font-mono">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium text-black transition-colors disabled:opacity-60"
              style={{ background: '#2dd4bf' }}
            >
              {saving ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Plus size={11} />
              )}
              Create Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

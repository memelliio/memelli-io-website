/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel — DetailPanel (right-side drawer view of one contact)         */
/*  Extracted from ContactsPanel.tsx (refactor 2026-04-30).                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, X, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import {
  Avatar,
  TagPill,
  displayName,
  fmtDate,
  fmtRelative,
  type Contact,
} from './ContactsPanel.utils';
import { DetailEditForm } from './ContactsPanel.DetailEditForm';

export interface DetailPanelProps {
  contact: Contact;
  onClose: () => void;
  onUpdated: (updated: Contact) => void;
  onDeleted: (id: string) => void;
}

export function DetailPanel({
  contact,
  onClose,
  onUpdated,
  onDeleted,
}: DetailPanelProps) {
  const api = useApi();
  const name = displayName(contact);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: contact.firstName ?? '',
    lastName: contact.lastName ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    company: contact.company ?? '',
    tags: (contact.tags ?? []).join(', '),
  });

  // Reset form when contact changes
  useEffect(() => {
    setForm({
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      company: contact.company ?? '',
      tags: (contact.tags ?? []).join(', '),
    });
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
  }, [contact.id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await api.patch<Contact>(`/api/contacts/${contact.id}`, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      company: form.company,
      tags,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) {
      onUpdated(res.data);
      setEditing(false);
    }
  }, [api, contact.id, form, onUpdated]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);
    const res = await api.del(`/api/contacts/${contact.id}`);
    setDeleting(false);
    if (res.error) {
      setError(res.error);
      setConfirmDelete(false);
      return;
    }
    onDeleted(contact.id);
  }, [api, contact.id, onDeleted]);

  return (
    <div
      className="flex flex-col h-full rounded-xl p-4 gap-4 overflow-y-auto"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={name} size={40} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">
              {name}
            </p>
            {contact.company && (
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                {contact.company}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Edit form or read-only info */}
      {editing ? (
        <DetailEditForm
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onCancel={() => {
            setEditing(false);
            setError(null);
          }}
          onSave={handleSave}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Contact fields */}
          <div className="flex flex-col gap-2">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-zinc-600 shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-[11px] text-teal-400 hover:text-teal-300 truncate transition-colors"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-zinc-600 shrink-0" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                >
                  {contact.phone}
                </a>
              </div>
            )}
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((t) => (
                <TagPill key={t} label={t} />
              ))}
            </div>
          )}

          {/* Timestamps */}
          <div
            className="flex flex-col gap-1 pt-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-[10px] font-mono text-zinc-600">
              Created {fmtDate(contact.createdAt)}
            </p>
            <p className="text-[10px] font-mono text-zinc-600">
              Updated {fmtRelative(contact.updatedAt)}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex flex-col gap-2 mt-auto shrink-0">
          {error && (
            <p className="text-[10px] text-red-400 font-mono">{error}</p>
          )}

          <button
            onClick={() => {
              setEditing(true);
              setConfirmDelete(false);
              setError(null);
            }}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Pencil size={11} />
            Edit
          </button>

          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors disabled:opacity-60"
                style={{ background: '#dc2626' }}
              >
                {deleting ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Trash2 size={10} />
                )}
                Confirm Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
              style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.15)',
              }}
            >
              <Trash2 size={11} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

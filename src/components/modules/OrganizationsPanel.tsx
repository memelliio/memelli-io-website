'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token')
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Organization {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  contacts?: OrgContact[];
}

interface OrgContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: string;
}

interface NewOrgForm {
  name: string;
  website: string;
  industry: string;
  size: string;
}

interface EditOrgForm {
  name: string;
  website: string;
  industry: string;
  size: string;
}

type View = 'list' | 'detail';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmtRelative(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (name.length >= 2) return name.slice(0, 2).toUpperCase();
  return name.toUpperCase();
}

const PALETTE: string[] = [
  '#7f1d1d', '#7c2d12', '#1e3a5f', '#14532d',
  '#581c87', '#3f3f46', '#164e63', '#713f12',
];

function avatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function contactDisplayName(c: OrgContact): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return full || c.email || 'Unknown';
}

const SIZE_LABELS: Record<string, string> = {
  '1-10': '1–10 employees',
  '11-50': '11–50 employees',
  '51-200': '51–200 employees',
  '201-500': '201–500 employees',
  '501-1000': '501–1,000 employees',
  '1001+': '1,001+ employees',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Inline SVG Icons (no external deps)                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IconBuilding({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="1" />
      <path d="M16 7V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
      <line x1="12" y1="12" x2="12.01" y2="12" />
    </svg>
  );
}

function IconPlus({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconX({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChevronLeft({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconEdit({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconCheck({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconGlobe({ size = 11, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconUsers({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Skeleton                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SkeletonCards({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="w-9 h-9 rounded-lg bg-white/[0.06] animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2.5 rounded bg-white/[0.06] animate-pulse w-2/5" />
            <div className="h-2 rounded bg-white/[0.04] animate-pulse w-1/3" />
          </div>
          <div className="h-2 w-14 rounded bg-white/[0.04] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Organization Card                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface OrgCardProps {
  org: Organization;
  selected: boolean;
  onClick: () => void;
}

function OrgCard({ org, selected, onClick }: OrgCardProps) {
  const initials = getInitials(org.name);
  const bg = avatarBg(org.name);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all hover:bg-white/[0.03]"
      style={{
        background: selected ? 'rgba(220,38,38,0.06)' : 'rgba(255,255,255,0.04)',
        border: selected
          ? '1px solid rgba(249,115,22,0.3)'
          : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-lg shrink-0 font-bold text-[hsl(var(--foreground))]"
        style={{
          width: 36,
          height: 36,
          background: selected ? 'linear-gradient(135deg, #dc2626, #f97316)' : bg,
          fontSize: 13,
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[hsl(var(--foreground))] truncate leading-tight">{org.name}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
          {org.industry || 'No industry'}{org.size ? ` · ${SIZE_LABELS[org.size] ?? org.size}` : ''}
        </p>
      </div>

      {/* Timestamp */}
      <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] shrink-0">
        {fmtRelative(org.updatedAt || org.createdAt)}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Detail Panel                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface DetailPanelProps {
  org: Organization;
  onClose: () => void;
  onUpdated: (updated: Organization) => void;
  onDeleted: (id: string) => void;
}

function DetailPanel({ org, onClose, onUpdated, onDeleted }: DetailPanelProps) {
  const [contacts, setContacts] = useState<OrgContact[]>(org.contacts ?? []);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditOrgForm>({
    name: org.name ?? '',
    website: org.website ?? '',
    industry: org.industry ?? '',
    size: org.size ?? '',
  });

  useEffect(() => {
    setForm({
      name: org.name ?? '',
      website: org.website ?? '',
      industry: org.industry ?? '',
      size: org.size ?? '',
    });
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
  }, [org.id]);

  // Load contacts for this org
  useEffect(() => {
    let cancelled = false;
    async function loadContacts() {
      setContactsLoading(true);
      try {
        const res = await fetch(`${API}/api/organizations/${org.id}/contacts?perPage=10`, {
          headers: authHeaders(),
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setContacts(json.data ?? []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    }
    loadContacts();
    return () => { cancelled = true; };
  }, [org.id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (form.name.trim()) body.name = form.name.trim();
      if (form.website.trim()) body.website = form.website.trim();
      if (form.industry.trim()) body.industry = form.industry.trim();
      if (form.size.trim()) body.size = form.size.trim();

      const res = await fetch(`${API}/api/organizations/${org.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onUpdated({ ...org, ...json.data });
      setEditing(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [form, org, onUpdated]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/organizations/${org.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as any).error || `HTTP ${res.status}`);
      }
      onDeleted(org.id);
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [org.id, onDeleted]);

  const inputCls =
    'w-full rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all bg-white/[0.04] border border-white/[0.08] focus:border-orange-500/40 focus:bg-white/[0.06]';

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-y-auto"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Detail header */}
      <div
        className="flex items-start justify-between gap-2 p-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center rounded-lg shrink-0 font-bold text-white text-sm"
            style={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #dc2626, #f97316)',
            }}
          >
            {getInitials(org.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight truncate">{org.name}</p>
            {org.industry && (
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">{org.industry}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors shrink-0 mt-0.5"
        >
          <IconX size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-4 flex-1">
        {editing ? (
          /* Edit form */
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Edit Organization</span>
            <input
              className={inputCls}
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Website (https://...)"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Industry"
              value={form.industry}
              onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            />
            <select
              className={inputCls}
              value={form.size}
              onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <option value="">Company size</option>
              {Object.entries(SIZE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditing(false); setError(null); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-50 transition-colors"
                style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}
              >
                <IconCheck size={11} color="#fff" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          /* Read-only info */
          <div className="flex flex-col gap-3">
            {org.website && (
              <div className="flex items-center gap-2">
                <IconGlobe size={11} color="#6b7280" />
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] truncate transition-colors"
                  style={{ color: '#f97316' }}
                >
                  {org.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {org.size && (
              <div className="flex items-center gap-2">
                <IconUsers size={11} color="#6b7280" />
                <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{SIZE_LABELS[org.size] ?? org.size}</span>
              </div>
            )}

            <div
              className="flex flex-col gap-1 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                Created {fmtRelative(org.createdAt)}
              </p>
              <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                Updated {fmtRelative(org.updatedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Contacts / Members section */}
        {!editing && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <IconUsers size={11} color="#6b7280" />
              <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Members / Contacts
              </span>
            </div>

            {contactsLoading ? (
              <div className="flex flex-col gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-7 rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono py-2 text-center">No contacts linked</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {contacts.map((c) => {
                  const name = contactDisplayName(c);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full shrink-0 font-semibold text-[hsl(var(--foreground))]"
                        style={{
                          width: 24,
                          height: 24,
                          background: avatarBg(name),
                          fontSize: 9,
                        }}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[hsl(var(--foreground))] truncate leading-tight">{name}</p>
                        {c.email && (
                          <p className="text-[9px] text-[hsl(var(--muted-foreground))] truncate">{c.email}</p>
                        )}
                      </div>
                      <span
                        className="shrink-0 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(249,115,22,0.1)',
                          color: '#f97316',
                          border: '1px solid rgba(249,115,22,0.2)',
                        }}
                      >
                        {c.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      {!editing && (
        <div
          className="flex flex-col gap-2 p-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

          <button
            onClick={() => { setEditing(true); setConfirmDelete(false); setError(null); }}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-medium text-[hsl(var(--foreground))] hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <IconEdit size={11} /> Edit Organization
          </button>

          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-60 transition-colors"
                style={{ background: '#dc2626' }}
              >
                <IconTrash size={11} color="#fff" />
                {deleting ? 'Deleting...' : 'Confirm Delete'}
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
              <IconTrash size={11} color="#f87171" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  New Organization Modal                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface NewOrgModalProps {
  onClose: () => void;
  onCreated: (org: Organization) => void;
}

function NewOrgModal({ onClose, onCreated }: NewOrgModalProps) {
  const [form, setForm] = useState<NewOrgForm>({
    name: '',
    website: '',
    industry: '',
    size: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name.trim()) {
        setError('Organization name is required.');
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const body: Record<string, string> = { name: form.name.trim() };
        if (form.website.trim()) body.website = form.website.trim();
        if (form.industry.trim()) body.industry = form.industry.trim();
        if (form.size.trim()) body.size = form.size.trim();

        const res = await fetch(`${API}/api/organizations`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        onCreated(json.data);
        onClose();
      } catch (e: any) {
        setError(e.message || 'Failed to create organization');
      } finally {
        setSaving(false);
      }
    },
    [form, onCreated, onClose]
  );

  const inputCls =
    'rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all bg-white/[0.04] border border-white/[0.08] focus:border-orange-500/40 focus:bg-white/[0.06]';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[hsl(var(--foreground))]/30" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl p-5 flex flex-col gap-4"
        style={{
          background: 'rgba(10,10,10,0.97)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}
            >
              <IconBuilding size={12} color="#fff" />
            </div>
            <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              New Organization
            </span>
          </div>
          <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors">
            <IconX size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={`${inputCls} w-full`}
            placeholder="Organization name *"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            autoFocus
          />
          <input
            className={`${inputCls} w-full`}
            placeholder="Website (https://...)"
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />
          <input
            className={`${inputCls} w-full`}
            placeholder="Industry"
            value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
          />
          <select
            className={`${inputCls} w-full`}
            value={form.size}
            onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
            style={{ background: 'rgba(10,10,10,0.97)' }}
          >
            <option value="">Company size (optional)</option>
            {Object.entries(SIZE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}
            >
              <IconPlus size={11} color="#fff" />
              {saving ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function OrganizationsPanel() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showNewOrg, setShowNewOrg] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const perPage = 20;

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  }, []);

  // ── Fetch organizations ──────────────────────────────────────────────────
  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`${API}/api/organizations?${params}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const data: Organization[] = json.data ?? [];
      setOrgs(data);
      setTotal(json.meta?.total ?? data.length);
    } catch (e: any) {
      setLoadError(e.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleUpdated = useCallback((updated: Organization) => {
    setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrg(updated);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setOrgs((prev) => prev.filter((o) => o.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    setSelectedOrg(null);
  }, []);

  const handleCreated = useCallback((org: Organization) => {
    setOrgs((prev) => [org, ...prev]);
    setTotal((t) => t + 1);
    setSelectedOrg(org);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: 'rgba(10,10,10,0.97)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col gap-3 px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}
            >
              <IconBuilding size={14} color="#fff" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">Organizations</h2>
              {total > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full text-[10px] font-mono font-semibold min-w-[22px] h-[18px] px-1.5"
                  style={{
                    background: 'rgba(249,115,22,0.12)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    color: '#f97316',
                  }}
                >
                  {total}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowNewOrg(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}
          >
            <IconPlus size={11} color="#fff" />
            New Org
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <IconSearch size={12} color="#52525b" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search organizations..."
            className="flex-1 bg-transparent text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setPage(1);
              }}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors"
            >
              <IconX size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* List */}
        <div
          className="flex flex-col min-h-0"
          style={{ width: selectedOrg ? '55%' : '100%', minWidth: 0 }}
        >
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <SkeletonCards count={6} />
            ) : loadError ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4">
                <p className="text-[11px] text-red-400 font-mono text-center">{loadError}</p>
                <button
                  onClick={fetchOrgs}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Retry
                </button>
              </div>
            ) : orgs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 px-4">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <IconBuilding size={18} color="#3f3f46" />
                </div>
                <p className="text-[12px] text-[hsl(var(--muted-foreground))] font-mono text-center">
                  {debouncedSearch ? 'No organizations match your search.' : 'No organizations yet.'}
                </p>
                {!debouncedSearch && (
                  <button
                    onClick={() => setShowNewOrg(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}
                  >
                    <IconPlus size={11} color="#fff" /> Create First Organization
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4">
                {orgs.map((org) => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    selected={selectedOrg?.id === org.id}
                    onClick={() => setSelectedOrg(selectedOrg?.id === org.id ? null : org)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !loadError && total > perPage && (
            <div
              className="flex items-center justify-between px-4 py-2.5 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                {showingFrom}–{showingTo} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-6 h-6 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <IconChevronLeft size={12} />
                </button>
                <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] px-1.5">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center justify-center w-6 h-6 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <IconChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedOrg && (
          <div
            className="shrink-0 overflow-hidden py-3 pr-4 pl-2"
            style={{ width: '45%', minWidth: 260 }}
          >
            <DetailPanel
              org={selectedOrg}
              onClose={() => setSelectedOrg(null)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          </div>
        )}
      </div>

      {/* New Org Modal */}
      {showNewOrg && (
        <NewOrgModal
          onClose={() => setShowNewOrg(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

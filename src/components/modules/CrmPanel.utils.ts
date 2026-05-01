/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel utilities — extracted from CrmPanel.tsx (refactor 2026-04-30)     */
/*  Constants, types, fetch helpers, formatters. No JSX in this file.          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const API =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    ''
  );
}

export function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

export async function apiFetch<T>(
  path: string,
  opts?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ── Types ─────────────────────────────────────────────────────────── */

export interface Stage {
  id: string;
  name: string;
  order?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  createdAt?: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  stage?: string | { id: string; name: string };
  stageId?: string;
  stageName?: string;
  status?: string;
  contactId?: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
  contactName?: string;
  pipelineId?: string;
}

export interface AnalyticsSummary {
  totalContacts?: number;
  openDeals?: number;
  pipelineValue?: number;
  wonThisMonth?: number;
  // dashboard shape
  contacts?: { total?: number };
  deals?: { open?: number; totalValue?: number; wonThisMonth?: number };
}

/* ── Formatters & extractors ───────────────────────────────────────── */

export function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString()}`;
}

export function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function contactFullName(c: Contact): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return full || c.email || 'Unknown';
}

export function dealStageName(d: Deal): string {
  if (typeof d.stage === 'object' && d.stage?.name) return d.stage.name;
  if (typeof d.stage === 'string') return d.stage;
  return d.stageName || d.status || '—';
}

export function dealContactName(d: Deal): string {
  if (d.contactName) return d.contactName;
  if (d.contact) {
    return (
      [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ') ||
      d.contact.email ||
      '—'
    );
  }
  return '—';
}

export function extractArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as T[];
    if (Array.isArray(r.items)) return r.items as T[];
    if (Array.isArray(r.results)) return r.results as T[];
  }
  return [];
}

/* ── Design tokens ─────────────────────────────────────────────────── */

export const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
} as const;

export type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'default';

export function stageBadgeVariant(stage: string): BadgeVariant {
  const s = stage.toLowerCase();
  if (s.includes('won') || s.includes('closed') || s.includes('complete'))
    return 'green';
  if (s.includes('lost') || s.includes('dead') || s.includes('cancel'))
    return 'red';
  if (s.includes('negotiat') || s.includes('proposal') || s.includes('quote'))
    return 'yellow';
  if (s.includes('qualify') || s.includes('prospect') || s.includes('lead'))
    return 'blue';
  return 'default';
}

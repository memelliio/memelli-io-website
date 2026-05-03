/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel utilities + tiny presentation primitives                      */
/*  Extracted from ContactsPanel.tsx (refactor 2026-04-30).                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

export const PAGE_SIZE = 20;

/* ── Types ─────────────────────────────────────────────────────────── */

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NewContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  tags: string; // comma-separated input
}

/* ── Helpers ───────────────────────────────────────────────────────── */

export function displayName(c: Contact): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return full || c.email || 'Unknown';
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_PALETTE: Record<string, string> = {
  a: '#7f1d1d', b: '#1e3a5f', c: '#14532d', d: '#581c87',
  e: '#7c2d12', f: '#3f3f46', g: '#7f1d1d', h: '#1e3a5f',
  i: '#14532d', j: '#581c87', k: '#7c2d12', l: '#3f3f46',
  m: '#7f1d1d', n: '#1e3a5f', o: '#14532d', p: '#581c87',
  q: '#7c2d12', r: '#3f3f46', s: '#7f1d1d', t: '#1e3a5f',
  u: '#14532d', v: '#581c87', w: '#7c2d12', x: '#3f3f46',
  y: '#7f1d1d', z: '#1e3a5f',
};

export function avatarBg(name: string): string {
  const key = (name[0] || 'z').toLowerCase();
  return AVATAR_PALETTE[key] ?? '#3f3f46';
}

export function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtRelative(dateStr?: string): string {
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
  return fmtDate(dateStr);
}

/* ── Sub-components (presentation only) ────────────────────────────── */

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-semibold text-zinc-200"
      style={{
        width: size,
        height: size,
        background: avatarBg(name),
        fontSize: size * 0.34,
        letterSpacing: '0.02em',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full text-[10px] px-2 py-0.5 font-medium bg-teal-500/15 text-teal-300 border border-teal-500/25">
      {label}
    </span>
  );
}

export function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3 border-b border-white/[0.04]"
        >
          <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2.5 rounded bg-white/[0.06] animate-pulse w-2/5" />
            <div className="h-2 rounded bg-white/[0.04] animate-pulse w-1/2" />
          </div>
          <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
        </div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel primitive sub-components — extracted from CrmPanel.tsx            */
/*  Stateless presentation building blocks. No data fetching.                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import type React from 'react';
import { stageBadgeVariant, type BadgeVariant } from './CrmPanel.utils';

export function StageBadge({ label }: { label: string }) {
  const v = stageBadgeVariant(label);
  const styles: Record<BadgeVariant, string> = {
    green: 'bg-emerald-950 text-emerald-400 border border-emerald-800/40',
    yellow: 'bg-yellow-950 text-yellow-400 border border-yellow-800/40',
    red: 'bg-red-950 text-red-400 border border-red-800/40',
    blue: 'bg-sky-950 text-sky-400 border border-sky-800/40',
    default: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-white/[0.06]',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[v]}`}
    >
      {label}
    </span>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
      {children}
    </h3>
  );
}

export function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]"
        >
          <div className="h-3 rounded bg-white/[0.05] flex-1 animate-pulse" />
          <div className="h-3 w-20 rounded bg-white/[0.05] animate-pulse" />
          <div className="h-4 w-14 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
      ))}
    </>
  );
}

export function InputField({
  name,
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:ring-1 focus:ring-red-700 transition-all ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    />
  );
}

export function SelectField({
  name,
  value,
  onChange,
  children,
  disabled,
  className = '',
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] outline-none focus:ring-1 focus:ring-red-700 transition-all disabled:opacity-40 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </select>
  );
}

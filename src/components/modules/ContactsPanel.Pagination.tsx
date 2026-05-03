/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel — pagination footer                                           */
/*  Extracted from ContactsPanel.tsx (refactor 2026-04-30).                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ContactsPagination({
  page,
  totalPages,
  showingFrom,
  showingTo,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  total: number;
  onPageChange: (next: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 shrink-0"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-[10px] font-mono text-zinc-600">
        Showing {showingFrom}–{showingTo} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ChevronLeft size={12} />
        </button>
        <span className="text-[10px] font-mono text-zinc-600 px-1.5">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — Recent Contacts table                                            */
/*  Extracted from CrmPanel.tsx (refactor 2026-04-30).                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
  card,
  contactFullName,
  fmtDate,
  type Contact,
} from './CrmPanel.utils';
import { RowSkeleton, SectionHeader } from './CrmPanel.primitives';

interface RecentContactsProps {
  recentContacts: Contact[];
  loadingContacts: boolean;
}

export function RecentContacts({
  recentContacts,
  loadingContacts,
}: RecentContactsProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <SectionHeader>Recent Contacts</SectionHeader>
        {loadingContacts && (
          <Loader2 size={12} className="text-zinc-600 animate-spin" />
        )}
      </div>

      {loadingContacts ? (
        <div className="px-3 pb-3">
          <RowSkeleton count={4} />
        </div>
      ) : recentContacts.length === 0 ? (
        <p className="text-[11px] text-zinc-600 py-6 text-center font-mono px-3">
          No contacts yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Name', 'Email', 'Company', 'Added', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-mono text-zinc-600 uppercase tracking-wider px-3 py-1.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentContacts.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2 text-zinc-200 font-medium truncate max-w-[120px]">
                    {contactFullName(c)}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 truncate max-w-[160px]">
                    {c.email || '—'}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 truncate max-w-[120px]">
                    {c.company || '—'}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 font-mono whitespace-nowrap">
                    {fmtDate(c.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/crm/contacts/${c.id}`}
                      className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

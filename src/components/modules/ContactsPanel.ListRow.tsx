/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel — single contact row in the list                              */
/*  Extracted from ContactsPanel.tsx (refactor 2026-04-30).                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import {
  Avatar,
  TagPill,
  displayName,
  fmtRelative,
  type Contact,
} from './ContactsPanel.utils';

export function ContactListRow({
  contact,
  isSelected,
  onSelect,
}: {
  contact: Contact;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const name = displayName(contact);
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 w-full py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors rounded text-left"
      style={isSelected ? { background: 'rgba(45,212,191,0.05)' } : {}}
    >
      <Avatar name={name} size={32} />

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-zinc-200 truncate leading-tight">
          {name}
        </p>
        {contact.company && (
          <p className="text-[10px] text-zinc-600 truncate mt-0.5">
            {contact.company}
          </p>
        )}
        {contact.email && (
          <p className="text-[10px] text-zinc-500 truncate">{contact.email}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-0">
        <span className="text-[10px] text-zinc-600 font-mono whitespace-nowrap">
          {fmtRelative(contact.updatedAt || contact.createdAt)}
        </span>
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {contact.tags.slice(0, 2).map((t) => (
              <TagPill key={t} label={t} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

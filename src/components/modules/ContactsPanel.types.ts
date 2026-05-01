/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DEPRECATED 2026-04-30 — superseded by ContactsPanel.utils.tsx                */
/*  Kept as a re-export shim so any incidental imports keep resolving.           */
/*  Memory-compaction supervisor will eventually remove. Do not add new code.    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export {
  PAGE_SIZE,
  displayName,
  getInitials,
  avatarBg,
  fmtDate,
  fmtRelative,
} from './ContactsPanel.utils';
export type { Contact, NewContactForm } from './ContactsPanel.utils';

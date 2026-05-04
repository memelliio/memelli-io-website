'use client';

/**
 * NEUTRALIZED 2026-04-30 — duplicate of `(dashboard)/dashboard/contacts/contact-detail-panel.tsx` (canonical, 549L).
 *
 * This file was an older orphan (353L, raw fetch + local components/ui/* paths,
 * imperative useEffect-based loader). It was NEVER imported anywhere in
 * apps/web/src — neither the sibling `page.tsx` (CRM contacts list) nor the
 * sibling `[contactId]/page.tsx` (self-contained detail view) referenced it.
 *
 * The canonical is the modern 549L sibling at:
 *   apps/web/src/app/(dashboard)/dashboard/contacts/contact-detail-panel.tsx
 * which uses @memelli/ui, react-query, and the workspace panel hook.
 *
 * Per CLAUDE.md anti-pattern rule "Comment out, don't delete", the body is
 * preserved below in a block comment in case any future caller surfaces.
 *
 * If a parent ever needs the old prop-driven shape ({ contactId, onClose }),
 * port that prop API onto the canonical workspace-panel-driven version
 * rather than reviving this file.
 */

import { ContactDetailPanel as Canonical } from '../../contacts/contact-detail-panel';

interface ContactDetailPanelProps {
  contactId: string;
  onClose: () => void;
}

// Stub re-export. Renders the canonical (which reads from useWorkspacePanel).
// Props accepted for backwards-compatibility but ignored — canonical reads
// the active record from workspace state.
export default function ContactDetailPanel(_props: ContactDetailPanelProps) {
  return <Canonical />;
}

/* ============================================================================
 * ORIGINAL BODY — commented out 2026-04-30 (was orphaned and never imported).
 * ============================================================================
 *
 * import { useEffect, useState } from 'react';
 * import { X, Mail, Phone, MessageSquare, FileText, Users, DollarSign, Clock, Send, GitMerge } from 'lucide-react';
 * import { useApi } from '../../../../../hooks/useApi';
 * import { Button } from '../../../../../components/ui/button';
 * import { Badge } from '../../../../../components/ui/badge';
 * import { Tabs, TabList, Tab, TabPanel } from '../../../../../components/ui/tabs';
 * import { Card, CardContent } from '../../../../../components/ui/card';
 *
 * interface ContactDetail {
 *   id: string;
 *   type: string;
 *   firstName?: string | null;
 *   lastName?: string | null;
 *   companyName?: string | null;
 *   email?: string | null;
 *   phone?: string | null;
 *   tags: string[];
 *   source?: string | null;
 *   createdAt: string;
 * }
 *
 * interface TimelineItem { type: 'deal' | 'communication' | 'activity'; date: string; data: any; }
 * interface Deal { id: string; title: string; value?: number; status: string; stage?: { name: string }; pipeline?: { name: string }; createdAt: string; }
 * interface Communication { id: string; channel: string; subject?: string | null; body?: string | null; direction?: string; occurredAt: string; }
 *
 * Loader (old version): parallel GETs of /api/contacts/:id + /api/crm/contacts/:id/timeline
 * + /api/crm/contacts/:id/deals + /api/crm/contacts/:id/communications.
 *
 * Slide-over modal layout with 4 tabs (timeline / deals / communications / notes).
 * Add-note: POST /api/crm/contacts/:id/notes with refresh of timeline after save.
 *
 * Unique features vs canonical:
 *  - "Communications" tab (separate channel feed) — canonical merges all into Timeline
 *  - "Add note inline from Timeline" via Enter-key submit
 *  - Inline communication-channel icon mapping by channel (CHANNEL_ICON map)
 *  - Slide-over backdrop modal layout (canonical is panel-embedded)
 *
 * None of these are wired to anything today; if needed, port to canonical
 * before reintroducing.
 *
 * (full original source preserved in git history at HEAD before 2026-04-30 sweep)
 * ============================================================================
 */

'use client';

/**
 * ModulePanel — renders the FULL page content for any dashboard route
 * directly inside a Dockview panel. No "open full view" — the content
 * lives right here, movable and resizable within the workspace.
 */

import dynamic from 'next/dynamic';
import type { IDockviewPanelProps } from 'dockview';
import { Loader2 } from 'lucide-react';

/* ── Loading placeholder ─────────────────────────────────────────── */
function PanelLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-[hsl(var(--background))]">
      <Loader2 className="h-5 w-5 animate-spin text-red-500" />
    </div>
  );
}

/* ── Route → dynamic component map ──────────────────────────────── */
// Each route gets its actual page component loaded dynamically.
// ssr: false because these are fully client-rendered dashboard pages.

const ROUTE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  '/dashboard/crm':              dynamic(() => import('../../../app/(dashboard)/dashboard/crm/page'),              { ssr: false, loading: PanelLoader }),
  '/dashboard/contacts':         dynamic(() => import('../../../app/(dashboard)/dashboard/contacts/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/analytics':        dynamic(() => import('../../../app/(dashboard)/dashboard/analytics/page'),        { ssr: false, loading: PanelLoader }),
  '/dashboard/ai':               dynamic(() => import('../../../app/(dashboard)/dashboard/ai/page'),               { ssr: false, loading: PanelLoader }),
  '/dashboard/tasks':            dynamic(() => import('../../../app/(dashboard)/dashboard/tasks/page'),            { ssr: false, loading: PanelLoader }),
  '/dashboard/commerce':         dynamic(() => import('../../../app/(dashboard)/dashboard/commerce/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/coaching':         dynamic(() => import('../../../app/(dashboard)/dashboard/coaching/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/seo':              dynamic(() => import('../../../app/(dashboard)/dashboard/seo/page'),              { ssr: false, loading: PanelLoader }),
  '/dashboard/workflows':        dynamic(() => import('../../../app/(dashboard)/dashboard/workflows/page'),        { ssr: false, loading: PanelLoader }),
  '/dashboard/leads':            dynamic(() => import('../../../app/(dashboard)/dashboard/leads/page'),            { ssr: false, loading: PanelLoader }),
  '/dashboard/communications':   dynamic(() => import('../../../app/(dashboard)/dashboard/communications/page'),   { ssr: false, loading: PanelLoader }),
  '/dashboard/documents':        dynamic(() => import('../../../app/(dashboard)/dashboard/documents/page'),        { ssr: false, loading: PanelLoader }),
  '/dashboard/notifications':    dynamic(() => import('../../../app/(dashboard)/dashboard/notifications/page'),    { ssr: false, loading: PanelLoader }),
  '/dashboard/settings':         dynamic(() => import('../../../app/(dashboard)/dashboard/settings/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/admin':            dynamic(() => import('../../../app/(dashboard)/dashboard/admin/page'),            { ssr: false, loading: PanelLoader }),
  '/dashboard/credit':           dynamic(() => import('../../../app/(dashboard)/dashboard/credit/page'),           { ssr: false, loading: PanelLoader }),
  '/dashboard/approval':         dynamic(() => import('../../../app/(dashboard)/dashboard/approval/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/insights':         dynamic(() => import('../../../app/(dashboard)/dashboard/insights/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/content':          dynamic(() => import('../../../app/(dashboard)/dashboard/content/page'),          { ssr: false, loading: PanelLoader }),
  '/dashboard/activities':       dynamic(() => import('../../../app/(dashboard)/dashboard/activities/page'),       { ssr: false, loading: PanelLoader }),
  '/dashboard/conversations':    dynamic(() => import('../../../app/(dashboard)/dashboard/conversations/page'),    { ssr: false, loading: PanelLoader }),
  '/dashboard/organizations':    dynamic(() => import('../../../app/(dashboard)/dashboard/organizations/page'),    { ssr: false, loading: PanelLoader }),
  '/dashboard/partners':         dynamic(() => import('../../../app/(dashboard)/dashboard/partners/page'),         { ssr: false, loading: PanelLoader }),
  '/dashboard/speed-lanes':      dynamic(() => import('../../../app/(dashboard)/dashboard/speed-lanes/page'),      { ssr: false, loading: PanelLoader }),
  '/dashboard/mobile-command':   dynamic(() => import('../../../app/(dashboard)/dashboard/mobile-command/page'),   { ssr: false, loading: PanelLoader }),
  '/dashboard/ai-company':       dynamic(() => import('../../../app/(dashboard)/dashboard/ai-company/page'),       { ssr: false, loading: PanelLoader }),
  '/dashboard/website-builder':  dynamic(() => import('../../../app/(dashboard)/dashboard/website-builder/page'),  { ssr: false, loading: PanelLoader }),
};

/* ── Panel component ─────────────────────────────────────────────── */

export function ModulePanel(props: IDockviewPanelProps) {
  const { route } = props.params as { moduleId: string; route: string; title: string };

  const PageComponent = ROUTE_COMPONENTS[route];

  if (!PageComponent) {
    // Route not in map — show a helpful fallback
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] gap-3 p-8 text-center">
        <p className="text-sm">This module is not yet available in the workspace.</p>
        <a
          href={route}
          className="text-xs text-red-400 hover:text-red-300 underline"
        >
          Open as full page
        </a>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-[hsl(var(--background))]">
      <PageComponent />
    </div>
  );
}

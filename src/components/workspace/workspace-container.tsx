'use client';

/**
 * WorkspaceContainer — The CENTER of the dashboard layout.
 *
 * Renders the Dockview-based workspace with:
 * - Tab bar at top showing open modules
 * - Content area rendering the active tab's WorkspaceView component
 * - Drop zone for sidebar drag operations
 *
 * WORKSPACE MOUNTING LAW: This container renders WorkspaceView components
 * (shell-less) — NEVER full route pages.
 */

import dynamic from 'next/dynamic';
import { LoadingGlobe } from '../ui/loading-globe';

// Dockview workspace — dynamic import (SSR not supported)
const OSWorkspace = dynamic(
  () => import('./os-workspace'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[hsl(var(--card))] backdrop-blur-xl">
        <LoadingGlobe size="md" />
      </div>
    ),
  }
);

export function WorkspaceContainer() {
  return (
    <div className="flex-1 overflow-hidden relative bg-[hsl(var(--card))] pb-0 md:pb-0 max-md:pb-14">
      <OSWorkspace />
    </div>
  );
}

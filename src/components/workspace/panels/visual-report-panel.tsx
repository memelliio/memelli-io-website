'use client';

import type { IDockviewPanelProps } from 'dockview';
import { VisualTab } from '../../uniscreen/VisualTab';
import type { VisualLayout } from '../../uniscreen/visual-engine/component-registry';

/**
 * VisualReportPanel — Dockview panel component that renders a VisualLayout
 * inside the OS workspace. Used when MUA returns a render_visual action.
 */
export function VisualReportPanel(props: IDockviewPanelProps) {
  const { visualLayout, title } = props.params as {
    visualLayout: VisualLayout;
    title: string;
  };

  if (!visualLayout) {
    return (
      <div className="flex h-full items-center justify-center bg-[#050505] text-zinc-500">
        <p className="text-sm">No visual data available</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#050505] text-zinc-100">
      <VisualTab layout={visualLayout} />
    </div>
  );
}

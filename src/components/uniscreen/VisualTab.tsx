"use client";

import { VisualRenderer } from "./visual-engine/VisualRenderer";
import type { VisualLayout } from "./visual-engine/component-registry";

/**
 * VisualTab — Tab content component that renders a VisualLayout
 * inside a UniScreen tab. Receives layout data and delegates
 * all rendering to the VisualRenderer engine.
 */
export function VisualTab({ layout }: { layout: VisualLayout }) {
  return (
    <div className="p-4 md:p-6">
      <VisualRenderer layout={layout} />
    </div>
  );
}

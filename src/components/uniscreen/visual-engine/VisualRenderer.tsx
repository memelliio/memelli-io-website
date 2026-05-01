"use client";

import type { VisualLayout } from "./component-registry";
import { VisualComponentRenderer } from "./components";

/**
 * VisualRenderer — Takes a VisualLayout and renders all components
 * in the specified layout arrangement.
 *
 * Layout types:
 *   "single"           -> full width single component
 *   "two_panel"        -> two columns side by side
 *   "multi_card"       -> responsive grid (2-3 columns)
 *   "timeline"         -> full width stacked (optimised for timeline components)
 *   "workflow_map"     -> full width stacked (optimised for workflow diagrams)
 *   "report"           -> stacked sections with dividers
 *   "kanban"           -> horizontal scrolling columns
 *   "diagnostic_split" -> 2/3 + 1/3 split for diagnostic + sidebar
 *   "lesson"           -> stacked with progress header
 *   "analytics_board"  -> metric row + chart grid
 */
export function VisualRenderer({ layout }: { layout: VisualLayout }) {
  const gridClass = getGridClass(layout.type);

  return (
    <div className="space-y-6">
      {/* Layout header */}
      <h2 className="text-lg font-bold text-zinc-100">{layout.title}</h2>

      {/* Components grid */}
      <div className={gridClass}>
        {layout.components.map((component, idx) => {
          const spanClass = getSpanClass(component.layout, layout.type);
          return (
            <div key={idx} className={spanClass}>
              <VisualComponentRenderer
                type={component.type}
                data={component.data}
                title={component.title}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function getGridClass(
  layoutType: VisualLayout["type"],
): string {
  switch (layoutType) {
    case "single":
      return "space-y-4";
    case "two_panel":
      return "grid grid-cols-1 gap-4 md:grid-cols-2";
    case "multi_card":
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
    case "timeline":
      return "space-y-4";
    case "workflow_map":
      return "space-y-4";
    case "report":
      return "space-y-6";
    case "kanban":
      return "space-y-4";
    case "diagnostic_split":
      return "grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]";
    case "lesson":
      return "space-y-5";
    case "analytics_board":
      return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*:nth-child(n+4)]:lg:col-span-1";
    default:
      return "space-y-4";
  }
}

function getSpanClass(
  componentLayout: "full" | "half" | "third" | undefined,
  layoutType: VisualLayout["type"],
): string {
  // In stacked layouts, everything is full width
  if (
    layoutType === "single" ||
    layoutType === "timeline" ||
    layoutType === "workflow_map" ||
    layoutType === "report" ||
    layoutType === "kanban" ||
    layoutType === "lesson"
  ) {
    return "";
  }

  // In diagnostic_split, first component spans the main area
  if (layoutType === "diagnostic_split") {
    // Components flow naturally into grid — no special span needed
    return "";
  }

  // In analytics_board, respect layout hints for spanning
  if (layoutType === "analytics_board") {
    switch (componentLayout) {
      case "full":
        return "sm:col-span-2 lg:col-span-3";
      case "half":
        return "lg:col-span-1 sm:col-span-1";
      case "third":
        return "lg:col-span-1";
      default:
        return "";
    }
  }

  // In grid layouts, respect the component's own layout hint
  switch (componentLayout) {
    case "full":
      return layoutType === "two_panel"
        ? "md:col-span-2"
        : "sm:col-span-2 lg:col-span-3";
    case "half":
      return layoutType === "multi_card" ? "lg:col-span-1 sm:col-span-1" : "";
    case "third":
      return "lg:col-span-1";
    default:
      return "";
  }
}

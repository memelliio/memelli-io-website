// UI Assembly System — transforms MUA intent into rendered output
// Pipeline: Request -> Validate -> Permission Filter -> Layout Select -> Assemble

import type {
  VisualLayout,
  VisualComponent,
  ComponentCategory,
  ComponentDefinition,
  LayoutDefinition,
  LayoutType,
} from "./component-registry";
import {
  COMPONENT_REGISTRY,
  LAYOUT_REGISTRY,
  validateComponentData,
} from "./component-registry";

// ---------------------------------------------------------------------------
// Assembly Request — input from MUA or agent dispatch
// ---------------------------------------------------------------------------
export interface AssemblyRequest {
  outputType: string; // "report", "dashboard", "diagnostic", "comparison", "lesson"
  title: string;
  components: Array<{
    type: string; // component type from registry
    data: Record<string, unknown>;
    title?: string;
    actions?: string[];
    layout?: "full" | "half" | "third";
  }>;
  layout?: string; // layout ID from registry, auto-selected if omitted
  theme?: "dark" | "light";
  permissionContext?: { userRole: string; domains: string[] };
}

// ---------------------------------------------------------------------------
// Assembled View — output ready for VisualRenderer
// ---------------------------------------------------------------------------
export interface AssembledView {
  layout: VisualLayout;
  title: string;
  validationErrors: string[];
  permissionFiltered: string[];
}

// ---------------------------------------------------------------------------
// assembleView — the main assembly pipeline
// ---------------------------------------------------------------------------
export function assembleView(request: AssemblyRequest): AssembledView {
  const validationErrors: string[] = [];
  const permissionFiltered: string[] = [];

  // Step 1: Validate each component against the registry
  const validatedComponents: Array<{
    type: string;
    data: Record<string, unknown>;
    title?: string;
    layout?: "full" | "half" | "third";
    definition: ComponentDefinition | undefined;
  }> = [];

  for (const comp of request.components) {
    const definition = COMPONENT_REGISTRY.get(comp.type);

    if (!definition) {
      validationErrors.push(`Unknown component type "${comp.type}" — skipping`);
      continue;
    }

    // Validate data shape (warn but don't block)
    const validation = validateComponentData(comp.type, comp.data);
    if (!validation.valid) {
      validationErrors.push(...validation.errors);
    }

    validatedComponents.push({
      type: comp.type,
      data: comp.data,
      title: comp.title,
      layout: comp.layout,
      definition,
    });
  }

  // Step 2: Filter by permission domain
  const permittedComponents = validatedComponents.filter((comp) => {
    if (!comp.definition?.permissionDomain) return true;
    if (!request.permissionContext) return true; // no permission context = allow all

    const { userRole, domains } = request.permissionContext;
    // SUPER_ADMIN and ADMIN see everything
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;

    if (domains.includes(comp.definition.permissionDomain)) return true;

    permissionFiltered.push(
      `${comp.definition.displayName} (requires "${comp.definition.permissionDomain}" permission)`,
    );
    return false;
  });

  // Step 3: Determine layout
  const categories = permittedComponents
    .map((c) => c.definition?.category)
    .filter(Boolean) as ComponentCategory[];

  const layoutId = request.layout || suggestLayout(permittedComponents.length, categories);
  const layoutDef = LAYOUT_REGISTRY.get(layoutId);

  if (!layoutDef && request.layout) {
    validationErrors.push(`Unknown layout "${request.layout}" — falling back to auto-select`);
  }

  const finalLayoutType = (layoutDef?.id ?? suggestLayout(permittedComponents.length, categories)) as LayoutType;

  // Step 4: Build VisualComponents with layout hints
  const visualComponents: VisualComponent[] = permittedComponents.map((comp) => {
    const defaultSpan = comp.definition?.layoutHints.defaultSpan;
    return {
      type: comp.type as VisualComponent["type"],
      title: comp.title,
      data: comp.data as Record<string, any>,
      layout: comp.layout ?? defaultSpan ?? undefined,
    };
  });

  // Step 5: Assemble the final layout
  const assembledLayout: VisualLayout = {
    type: finalLayoutType,
    title: request.title,
    components: visualComponents,
  };

  return {
    layout: assembledLayout,
    title: request.title,
    validationErrors,
    permissionFiltered,
  };
}

// ---------------------------------------------------------------------------
// getAvailableComponents — list all or filter by category
// ---------------------------------------------------------------------------
export function getAvailableComponents(
  category?: ComponentCategory,
): ComponentDefinition[] {
  const all = Array.from(COMPONENT_REGISTRY.values());
  if (!category) return all;
  return all.filter((def) => def.category === category);
}

// ---------------------------------------------------------------------------
// getAvailableLayouts — list all layout definitions
// ---------------------------------------------------------------------------
export function getAvailableLayouts(): LayoutDefinition[] {
  return Array.from(LAYOUT_REGISTRY.values());
}

// ---------------------------------------------------------------------------
// suggestLayout — auto-select best layout based on component count & categories
// ---------------------------------------------------------------------------
export function suggestLayout(
  componentCount: number,
  categories: ComponentCategory[],
): string {
  const uniqueCategories = new Set(categories);

  // Diagnostic content gets diagnostic_split
  if (uniqueCategories.has("diagnostic")) {
    return "diagnostic_split";
  }

  // Lesson content gets lesson layout
  if (uniqueCategories.has("lesson")) {
    return "lesson";
  }

  // Work order or kanban-heavy gets kanban
  if (uniqueCategories.has("work_order") || (uniqueCategories.has("workflow") && componentCount <= 3)) {
    return "kanban";
  }

  // Charts/metrics heavy gets analytics_board
  const chartMetricCount = categories.filter(
    (c) => c === "charts" || c === "metrics",
  ).length;
  if (chartMetricCount >= 3 || (chartMetricCount >= 2 && componentCount >= 4)) {
    return "analytics_board";
  }

  // Single component
  if (componentCount === 1) {
    return "single";
  }

  // Two components
  if (componentCount === 2) {
    return "two_panel";
  }

  // Mixed content with many items gets report
  if (componentCount >= 6 || uniqueCategories.size >= 4) {
    return "report";
  }

  // 3-5 components default to multi_card
  if (componentCount >= 3 && componentCount <= 5) {
    return "multi_card";
  }

  // Fallback
  return "multi_card";
}

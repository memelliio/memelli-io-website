// Component Registry — Maps component types to their renderers and definitions
// MUA selects from this registry when generating visual responses

// ---------------------------------------------------------------------------
// Component Types — all renderable component types in the system
// ---------------------------------------------------------------------------
export type VisualComponentType =
  | "metric_card"
  | "comparison_grid"
  | "bar_chart"
  | "line_chart"
  | "kanban_board"
  | "workflow_diagram"
  | "progress_tracker"
  | "timeline_view"
  | "status_panel"
  | "alert_banner"
  | "data_table"
  | "lesson_card"
  | "checklist_panel"
  | "report_header"
  | "entity_summary"
  | "diagnostic_panel"
  | "work_order_board"
  | "notification_feed"
  | "document_preview"
  | "lesson_module"
  | "task_panel"
  | "chart_line"
  | "chart_pie";

// ---------------------------------------------------------------------------
// Core component / layout interfaces (backward-compatible)
// ---------------------------------------------------------------------------
export interface VisualComponent {
  type: VisualComponentType;
  title?: string;
  data: Record<string, any>;
  layout?: "full" | "half" | "third";
}

export type LayoutType =
  | "single"
  | "two_panel"
  | "multi_card"
  | "timeline"
  | "workflow_map"
  | "report"
  | "kanban"
  | "diagnostic_split"
  | "lesson"
  | "analytics_board";

export interface VisualLayout {
  type: LayoutType;
  title: string;
  components: VisualComponent[];
}

// Response classification
export type ResponseCategory =
  | "text_only"
  | "dashboard_summary"
  | "data_comparison"
  | "workflow_explanation"
  | "report"
  | "lesson_module"
  | "system_diagnostic"
  | "task_overview";

// ---------------------------------------------------------------------------
// Component Category
// ---------------------------------------------------------------------------
export type ComponentCategory =
  | "metrics"
  | "status"
  | "comparison"
  | "data"
  | "charts"
  | "workflow"
  | "diagnostic"
  | "entity"
  | "work_order"
  | "notification"
  | "lesson";

// ---------------------------------------------------------------------------
// Data Shape — declares expected data fields for a component
// ---------------------------------------------------------------------------
export interface DataShapeField {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "date";
  required: boolean;
  description?: string;
}

// ---------------------------------------------------------------------------
// ComponentDefinition — the governed registry entry
// ---------------------------------------------------------------------------
export interface ComponentDefinition {
  id: string;
  type: VisualComponentType;
  displayName: string;
  category: ComponentCategory;
  dataShape: DataShapeField[];
  supportedActions: string[];
  layoutHints: {
    minWidth?: string;
    maxWidth?: string;
    defaultSpan?: "full" | "half" | "third";
  };
  permissionDomain?: string;
  animationBehavior?: "none" | "fade" | "slide" | "pulse";
}

// ---------------------------------------------------------------------------
// Layout Definition — governed layout entry
// ---------------------------------------------------------------------------
export interface LayoutDefinition {
  id: string;
  displayName: string;
  gridTemplate: string;
  maxComponents: number;
  supportedCategories: ComponentCategory[];
}

// ---------------------------------------------------------------------------
// COMPONENT_REGISTRY — full definitions for all component types
// ---------------------------------------------------------------------------
export const COMPONENT_REGISTRY = new Map<string, ComponentDefinition>([
  [
    "metric_card",
    {
      id: "metric_card",
      type: "metric_card",
      displayName: "Metric Card",
      category: "metrics",
      dataShape: [
        { name: "title", type: "string", required: true, description: "Metric label" },
        { name: "value", type: "string", required: true, description: "Primary value" },
        { name: "change", type: "number", required: false, description: "Percentage change" },
        { name: "unit", type: "string", required: false, description: "Unit suffix" },
      ],
      supportedActions: ["open_entity", "filter", "export"],
      layoutHints: { minWidth: "200px", defaultSpan: "third" },
      animationBehavior: "fade",
    },
  ],
  [
    "comparison_grid",
    {
      id: "comparison_grid",
      type: "comparison_grid",
      displayName: "Comparison Grid",
      category: "comparison",
      dataShape: [
        { name: "headers", type: "array", required: true, description: "Column headers" },
        { name: "items", type: "array", required: true, description: "Row objects with label and values" },
      ],
      supportedActions: ["filter", "export", "sort"],
      layoutHints: { minWidth: "400px", defaultSpan: "full" },
      animationBehavior: "fade",
    },
  ],
  [
    "bar_chart",
    {
      id: "bar_chart",
      type: "bar_chart",
      displayName: "Bar Chart",
      category: "charts",
      dataShape: [
        { name: "labels", type: "array", required: true, description: "X-axis labels" },
        { name: "values", type: "array", required: true, description: "Numeric values" },
        { name: "color", type: "string", required: false, description: "Bar color" },
      ],
      supportedActions: ["filter", "export", "drill_down"],
      layoutHints: { minWidth: "300px", defaultSpan: "half" },
      animationBehavior: "slide",
    },
  ],
  [
    "line_chart",
    {
      id: "line_chart",
      type: "line_chart",
      displayName: "Line Chart",
      category: "charts",
      dataShape: [
        { name: "labels", type: "array", required: true, description: "X-axis labels" },
        { name: "series", type: "array", required: true, description: "Array of data series" },
      ],
      supportedActions: ["filter", "export", "zoom"],
      layoutHints: { minWidth: "300px", defaultSpan: "half" },
      animationBehavior: "slide",
    },
  ],
  [
    "chart_line",
    {
      id: "chart_line",
      type: "chart_line",
      displayName: "Line Chart (Alt)",
      category: "charts",
      dataShape: [
        { name: "labels", type: "array", required: true, description: "X-axis labels" },
        { name: "series", type: "array", required: true, description: "Array of data series" },
      ],
      supportedActions: ["filter", "export", "zoom"],
      layoutHints: { minWidth: "300px", defaultSpan: "half" },
      animationBehavior: "slide",
    },
  ],
  [
    "chart_pie",
    {
      id: "chart_pie",
      type: "chart_pie",
      displayName: "Pie Chart",
      category: "charts",
      dataShape: [
        { name: "segments", type: "array", required: true, description: "Array of { label, value, color? }" },
      ],
      supportedActions: ["filter", "export"],
      layoutHints: { minWidth: "250px", defaultSpan: "third" },
      animationBehavior: "fade",
    },
  ],
  [
    "kanban_board",
    {
      id: "kanban_board",
      type: "kanban_board",
      displayName: "Kanban Board",
      category: "workflow",
      dataShape: [
        {
          name: "columns",
          type: "array",
          required: true,
          description: "Array of { id, title, cards: [{ id, title, subtitle?, priority?, assignee? }] }",
        },
      ],
      supportedActions: ["open_entity", "move_card", "filter"],
      layoutHints: { minWidth: "600px", defaultSpan: "full" },
      animationBehavior: "slide",
    },
  ],
  [
    "workflow_diagram",
    {
      id: "workflow_diagram",
      type: "workflow_diagram",
      displayName: "Workflow Diagram",
      category: "workflow",
      dataShape: [
        {
          name: "steps",
          type: "array",
          required: true,
          description: "Array of { id, label, status: active|completed|pending, description? }",
        },
      ],
      supportedActions: ["open_entity", "filter"],
      layoutHints: { minWidth: "400px", defaultSpan: "full" },
      animationBehavior: "slide",
    },
  ],
  [
    "progress_tracker",
    {
      id: "progress_tracker",
      type: "progress_tracker",
      displayName: "Progress Tracker",
      category: "workflow",
      dataShape: [
        { name: "stages", type: "array", required: true, description: "Array of { name, completed, active? }" },
        { name: "percentComplete", type: "number", required: true, description: "Overall percentage" },
      ],
      supportedActions: ["open_entity"],
      layoutHints: { minWidth: "300px", defaultSpan: "full" },
      animationBehavior: "fade",
    },
  ],
  [
    "timeline_view",
    {
      id: "timeline_view",
      type: "timeline_view",
      displayName: "Timeline View",
      category: "data",
      dataShape: [
        {
          name: "events",
          type: "array",
          required: true,
          description: "Array of { time, title, description?, type? }",
        },
      ],
      supportedActions: ["open_entity", "filter"],
      layoutHints: { minWidth: "300px", defaultSpan: "full" },
      animationBehavior: "slide",
    },
  ],
  [
    "status_panel",
    {
      id: "status_panel",
      type: "status_panel",
      displayName: "Status Panel",
      category: "status",
      dataShape: [
        {
          name: "items",
          type: "array",
          required: true,
          description: "Array of { label, status: healthy|warning|critical|unknown, value? }",
        },
      ],
      supportedActions: ["open_entity", "filter"],
      layoutHints: { minWidth: "250px", defaultSpan: "half" },
      animationBehavior: "fade",
    },
  ],
  [
    "alert_banner",
    {
      id: "alert_banner",
      type: "alert_banner",
      displayName: "Alert Banner",
      category: "notification",
      dataShape: [
        { name: "level", type: "string", required: true, description: "info | warning | critical" },
        { name: "message", type: "string", required: true, description: "Alert message" },
        { name: "action", type: "string", required: false, description: "Suggested action" },
      ],
      supportedActions: ["dismiss", "open_entity"],
      layoutHints: { defaultSpan: "full" },
      animationBehavior: "slide",
    },
  ],
  [
    "data_table",
    {
      id: "data_table",
      type: "data_table",
      displayName: "Data Table",
      category: "data",
      dataShape: [
        { name: "headers", type: "array", required: true, description: "Column headers" },
        { name: "rows", type: "array", required: true, description: "2D array of cell values" },
      ],
      supportedActions: ["sort", "filter", "export", "open_entity"],
      layoutHints: { minWidth: "400px", defaultSpan: "full" },
      animationBehavior: "fade",
    },
  ],
  [
    "lesson_card",
    {
      id: "lesson_card",
      type: "lesson_card",
      displayName: "Lesson Card",
      category: "lesson",
      dataShape: [
        { name: "items", type: "array", required: true, description: "Checklist items" },
      ],
      supportedActions: ["open_entity", "mark_complete"],
      layoutHints: { minWidth: "250px", defaultSpan: "half" },
      animationBehavior: "fade",
    },
  ],
  [
    "checklist_panel",
    {
      id: "checklist_panel",
      type: "checklist_panel",
      displayName: "Checklist Panel",
      category: "workflow",
      dataShape: [
        { name: "items", type: "array", required: true, description: "Array of { text, checked }" },
      ],
      supportedActions: ["toggle_check", "export"],
      layoutHints: { minWidth: "250px", defaultSpan: "half" },
      animationBehavior: "fade",
    },
  ],
  [
    "report_header",
    {
      id: "report_header",
      type: "report_header",
      displayName: "Report Header",
      category: "data",
      dataShape: [
        { name: "title", type: "string", required: true, description: "Report title" },
        { name: "subtitle", type: "string", required: false, description: "Subtitle" },
        { name: "date", type: "string", required: false, description: "Report date" },
        { name: "generatedBy", type: "string", required: false, description: "Author" },
      ],
      supportedActions: ["export"],
      layoutHints: { defaultSpan: "full" },
      animationBehavior: "none",
    },
  ],
  [
    "entity_summary",
    {
      id: "entity_summary",
      type: "entity_summary",
      displayName: "Entity Summary",
      category: "entity",
      dataShape: [
        { name: "name", type: "string", required: true, description: "Entity name" },
        { name: "entityType", type: "string", required: true, description: "Type label (Contact, Deal, Store, etc.)" },
        { name: "status", type: "string", required: false, description: "Current status" },
        { name: "fields", type: "array", required: true, description: "Array of { label, value }" },
        { name: "actions", type: "array", required: false, description: "Array of action button labels" },
      ],
      supportedActions: ["open_entity", "edit", "delete", "export"],
      layoutHints: { minWidth: "300px", defaultSpan: "half" },
      permissionDomain: "entities",
      animationBehavior: "fade",
    },
  ],
  [
    "diagnostic_panel",
    {
      id: "diagnostic_panel",
      type: "diagnostic_panel",
      displayName: "Diagnostic Panel",
      category: "diagnostic",
      dataShape: [
        { name: "systemArea", type: "string", required: true, description: "System area being diagnosed" },
        { name: "overallStatus", type: "string", required: true, description: "healthy | warning | critical" },
        { name: "errors", type: "array", required: false, description: "Array of { message, severity, code? }" },
        { name: "recommendations", type: "array", required: false, description: "Array of recommended actions" },
        { name: "metrics", type: "object", required: false, description: "Key diagnostic metrics" },
      ],
      supportedActions: ["run_diagnostic", "repair", "export"],
      layoutHints: { minWidth: "400px", defaultSpan: "full" },
      permissionDomain: "system_admin",
      animationBehavior: "pulse",
    },
  ],
  [
    "work_order_board",
    {
      id: "work_order_board",
      type: "work_order_board",
      displayName: "Work Order Board",
      category: "work_order",
      dataShape: [
        {
          name: "columns",
          type: "array",
          required: true,
          description: "Array of { id, title, orders: [{ id, title, priority, assignee?, dueDate? }] }",
        },
      ],
      supportedActions: ["open_entity", "assign", "update_status", "filter"],
      layoutHints: { minWidth: "600px", defaultSpan: "full" },
      permissionDomain: "work_orders",
      animationBehavior: "slide",
    },
  ],
  [
    "notification_feed",
    {
      id: "notification_feed",
      type: "notification_feed",
      displayName: "Notification Feed",
      category: "notification",
      dataShape: [
        {
          name: "notifications",
          type: "array",
          required: true,
          description: "Array of { id, title, message, time, read, level?, source? }",
        },
      ],
      supportedActions: ["mark_read", "dismiss", "open_entity"],
      layoutHints: { minWidth: "300px", maxWidth: "500px", defaultSpan: "half" },
      animationBehavior: "slide",
    },
  ],
  [
    "document_preview",
    {
      id: "document_preview",
      type: "document_preview",
      displayName: "Document Preview",
      category: "entity",
      dataShape: [
        { name: "title", type: "string", required: true, description: "Document title" },
        { name: "content", type: "string", required: true, description: "Document body or preview" },
        { name: "format", type: "string", required: false, description: "markdown | html | text" },
        { name: "metadata", type: "object", required: false, description: "Author, date, version, etc." },
      ],
      supportedActions: ["open_entity", "export", "edit"],
      layoutHints: { minWidth: "400px", defaultSpan: "full" },
      animationBehavior: "fade",
    },
  ],
  [
    "lesson_module",
    {
      id: "lesson_module",
      type: "lesson_module",
      displayName: "Lesson Module",
      category: "lesson",
      dataShape: [
        { name: "title", type: "string", required: true, description: "Lesson title" },
        { name: "content", type: "string", required: true, description: "Lesson body" },
        { name: "objectives", type: "array", required: false, description: "Learning objectives" },
        { name: "steps", type: "array", required: false, description: "Array of { title, content, completed? }" },
        { name: "progress", type: "number", required: false, description: "Completion percentage" },
      ],
      supportedActions: ["mark_complete", "next_lesson", "open_entity"],
      layoutHints: { minWidth: "400px", defaultSpan: "full" },
      permissionDomain: "coaching",
      animationBehavior: "fade",
    },
  ],
  [
    "task_panel",
    {
      id: "task_panel",
      type: "task_panel",
      displayName: "Task Panel",
      category: "workflow",
      dataShape: [
        {
          name: "tasks",
          type: "array",
          required: true,
          description: "Array of { id, title, completed, priority?, assignee?, dueDate? }",
        },
      ],
      supportedActions: ["toggle_check", "assign", "open_entity", "filter"],
      layoutHints: { minWidth: "300px", defaultSpan: "half" },
      animationBehavior: "fade",
    },
  ],
]);

// ---------------------------------------------------------------------------
// LAYOUT_REGISTRY — layout definitions
// ---------------------------------------------------------------------------
export const LAYOUT_REGISTRY = new Map<string, LayoutDefinition>([
  [
    "single",
    {
      id: "single",
      displayName: "Single Panel",
      gridTemplate: "1fr",
      maxComponents: 1,
      supportedCategories: ["metrics", "status", "comparison", "data", "charts", "workflow", "diagnostic", "entity", "work_order", "notification", "lesson"],
    },
  ],
  [
    "two_panel",
    {
      id: "two_panel",
      displayName: "Two Panel",
      gridTemplate: "1fr 1fr",
      maxComponents: 4,
      supportedCategories: ["metrics", "status", "comparison", "data", "charts", "workflow", "entity", "notification"],
    },
  ],
  [
    "multi_card",
    {
      id: "multi_card",
      displayName: "Multi Card Grid",
      gridTemplate: "repeat(3, 1fr)",
      maxComponents: 12,
      supportedCategories: ["metrics", "status", "comparison", "data", "charts", "entity", "notification"],
    },
  ],
  [
    "timeline",
    {
      id: "timeline",
      displayName: "Timeline",
      gridTemplate: "1fr",
      maxComponents: 20,
      supportedCategories: ["data", "status", "notification", "workflow"],
    },
  ],
  [
    "analytics_board",
    {
      id: "analytics_board",
      displayName: "Analytics Board",
      gridTemplate: "repeat(3, 1fr) / auto",
      maxComponents: 16,
      supportedCategories: ["metrics", "charts", "data", "comparison", "status"],
    },
  ],
  [
    "report",
    {
      id: "report",
      displayName: "Report",
      gridTemplate: "1fr",
      maxComponents: 20,
      supportedCategories: ["metrics", "status", "comparison", "data", "charts", "workflow", "diagnostic", "entity"],
    },
  ],
  [
    "kanban",
    {
      id: "kanban",
      displayName: "Kanban Board",
      gridTemplate: "repeat(auto-fill, minmax(280px, 1fr))",
      maxComponents: 6,
      supportedCategories: ["workflow", "work_order", "entity"],
    },
  ],
  [
    "diagnostic_split",
    {
      id: "diagnostic_split",
      displayName: "Diagnostic Split",
      gridTemplate: "2fr 1fr",
      maxComponents: 8,
      supportedCategories: ["diagnostic", "status", "data", "metrics", "notification"],
    },
  ],
  [
    "lesson",
    {
      id: "lesson",
      displayName: "Lesson View",
      gridTemplate: "1fr",
      maxComponents: 10,
      supportedCategories: ["lesson", "workflow", "data", "charts"],
    },
  ],
]);

// ---------------------------------------------------------------------------
// Validation — validate component data against registry data shape
// ---------------------------------------------------------------------------
export function validateComponentData(
  componentType: string,
  data: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const definition = COMPONENT_REGISTRY.get(componentType);
  if (!definition) {
    return { valid: false, errors: [`Unknown component type: ${componentType}`] };
  }

  const errors: string[] = [];

  for (const field of definition.dataShape) {
    const value = data[field.name];

    if (field.required && (value === undefined || value === null)) {
      errors.push(`Missing required field "${field.name}" for ${componentType}`);
      continue;
    }

    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      // Allow flexible type matching: 'date' can be string, 'object' matches object
      const expectedType = field.type === "date" ? "string" : field.type;
      if (actualType !== expectedType) {
        errors.push(
          `Field "${field.name}" expected type "${field.type}" but got "${actualType}" in ${componentType}`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

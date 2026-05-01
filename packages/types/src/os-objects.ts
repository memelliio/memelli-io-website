// ============================================================================
// Memelli OS — Canonical Object Schema
// ============================================================================
//
// This file defines ALL canonical OS-level object interfaces. Every subsystem
// (API, web, workers, agents, queues) must import from here instead of using
// ad hoc shapes. These types form the shared language of the operating system.
//
// Naming convention: OS-level objects are prefixed with "OS" to distinguish
// them from domain-level types (Contact, Deal, Order, etc.) defined in index.ts.
// ============================================================================

// ── Entity Reference — normalized pointer to any record ────────────────

/**
 * A lightweight, universal pointer to any record in the system.
 * Used wherever one object needs to reference another without coupling
 * to the target's full shape.
 */
export interface EntityReference {
  entityType: string;      // 'client' | 'contact' | 'deal' | 'work_order' | 'report' | 'document' | etc.
  entityId: string;        // UUID
  displayName: string;
  tenantId: string;
  status?: string;
  summaryPayload?: Record<string, unknown>;
}

// ── Workspace Object ───────────────────────────────────────────────────

/**
 * A workspace groups tabs and layout state for a user session.
 * Users can have multiple workspaces (e.g., "Operations", "Diagnostics").
 */
export interface OSWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceType: 'operations' | 'custom' | 'diagnostic' | 'report';
  workspaceIcon?: string;
  workspaceColor?: string;
  ownerUserId: string;
  tenantId: string;
  openTabIds: string[];
  activeTabId: string | null;
  layoutConfigId?: string;
  workspaceStatus: 'active' | 'idle' | 'background';
  createdAt: string;
  updatedAt: string;
}

// ── Tab Object ─────────────────────────────────────────────────────────

/**
 * A single tab within a workspace. Tabs can be entity-bound (showing a
 * specific client or deal) or freeform (diagnostics, reports).
 */
export interface OSTab {
  tabId: string;
  tabType: string;         // 'custom' | 'client' | 'credit' | 'pipeline' | 'report' | 'work_order' | 'visual' | 'diagnostic' | 'notification'
  tabTitle: string;
  workspaceId: string;
  entityRef?: EntityReference;
  viewMode?: string;
  filterState?: Record<string, unknown>;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  panelState?: Record<string, unknown>;
  isPinned: boolean;
  isActive: boolean;
  source: 'user' | 'mua' | 'system';
  createdAt: string;
  updatedAt: string;
}

// ── Module Object ──────────────────────────────────────────────────────

/**
 * A top-level navigation module in the OS dashboard. Modules map to
 * sidebar entries and define route bindings, permissions, and badges.
 */
export interface OSModule {
  moduleId: string;
  moduleKey: string;       // 'clients' | 'pipeline' | 'reports' | 'tasks' | 'automation' | 'messages' | 'development' | 'system'
  displayName: string;
  icon: string;
  routeBinding: string;    // e.g. '/dashboard/crm'
  defaultLayout: string;
  permissionDomain: string;
  statusBadgeConfig?: { enabled: boolean; source: string };
  isEnabled: boolean;
}

// ── Context Snapshot ───────────────────────────────────────────────────

/**
 * A point-in-time capture of the user's attention state. MUA (the AI
 * assistant) uses this to understand what the user is looking at when
 * they issue a command.
 */
export interface ContextSnapshot {
  userId: string | null;
  userRole: string | null;
  activeWorkspaceId: string;
  activeWorkspaceName: string;
  activeTabId: string | null;
  activeTabType: string | null;
  activeEntityRef: EntityReference | null;
  openTabIds: string[];
  openTabTypes: string[];
  recentEntityRefs: EntityReference[];
  recentActions: Array<{ action: string; timestamp: string; detail?: string }>;
  attentionState: 'clear' | 'info' | 'warning' | 'critical';
  systemHealthRef?: string;
  currentRoute: string;
  previousRoute: string | null;
  sessionStarted: string;
  actionCount: number;
  lastUpdatedAt: string;
}

// ── Work Order ─────────────────────────────────────────────────────────

/**
 * A high-level unit of work dispatched through the command center.
 * Work orders decompose into sub-tasks assigned to agent pools.
 */
export interface OSWorkOrder {
  workOrderId: string;
  tenantId: string;
  userId: string | null;
  goalSummary: string;
  taskType: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'QUEUED' | 'DISPATCHED' | 'IN_PROGRESS' | 'WAITING_DEPENDENCY' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ESCALATED';
  assignedPool: string | null;
  requestSource: string;
  subTaskCount: number;
  completedCount: number;
  failedCount: number;
  entityRef?: EntityReference;
  workspaceId?: string;
  outputFormat?: string;
  deadline?: string;
  resultSummary?: string;
  resultData?: Record<string, unknown>;
  errorSummary?: string;
  startedAt?: string;
  completedAt?: string;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Sub-Task ───────────────────────────────────────────────────────────

/**
 * An atomic unit of work within a work order. Sub-tasks are assigned to
 * specific agent pools and follow the sentinel/diagnostic/repair/validation
 * layer model.
 */
export interface OSSubTask {
  subTaskId: string;
  workOrderId: string;
  title: string;
  description?: string;
  assignedPool: string;
  assignedAgent?: string;
  layer: 'sentinel' | 'diagnostic' | 'repair' | 'validation';
  dependencyIds: string[];
  status: 'QUEUED' | 'DISPATCHED' | 'IN_PROGRESS' | 'WAITING_DEPENDENCY' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  retryCount: number;
  maxRetries: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorSummary?: string;
  tokenUsage: number;
  costCents: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Event Object ───────────────────────────────────────────────────────

/**
 * An OS-level event emitted by any subsystem. Events flow through the
 * event spine (Redis pub/sub) and can trigger agent pool wakeups,
 * notifications, and automation workflows.
 */
export interface OSEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  userId?: string;
  entityRef?: EntityReference;
  sourceService: string;
  sourcePool?: string;
  severity: 'info' | 'warning' | 'critical';
  summaryPayload?: Record<string, unknown>;
  createdAt: string;
}

// ── Notification Object ────────────────────────────────────────────────

/**
 * A user-facing notification rendered in the notification panel,
 * sphere badge, or pushed via email/SMS.
 */
export interface OSNotification {
  notificationId: string;
  notificationType: 'informational' | 'task_update' | 'client_activity' | 'pipeline_update' | 'work_order_status' | 'system_warning' | 'critical_alert';
  attentionLevel: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  entityRef?: EntityReference;
  workOrderId?: string;
  eventId?: string;
  source: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  isPinned: boolean;
  isArchived: boolean;
  groupKey?: string;
  createdAt: string;
}

// ── Runtime Card ───────────────────────────────────────────────────────

/**
 * A dynamic data card rendered in dashboards and panels. Cards are
 * generic containers whose payload type is parameterized.
 */
export interface RuntimeCard<T = Record<string, unknown>> {
  cardId: string;
  cardType: string;
  subjectRef?: EntityReference;
  payload: T;
  stalenessState: 'fresh' | 'aging' | 'stale';
  lastUpdatedAt: string;
}

// ── Command Object ─────────────────────────────────────────────────────

/**
 * A parsed user command captured from the sphere (MUA), search bar,
 * keyboard shortcut, or automation trigger.
 */
export interface OSCommand {
  commandId: string;
  rawText: string;
  source: 'mua' | 'search' | 'keyboard' | 'automation' | 'shortcut';
  parsedIntent: {
    intent: string;
    target: string;
    entityType?: string;
    entityName?: string;
    entityId?: string;
    params?: Record<string, unknown>;
    confidence: number;
  };
  targetRefs: EntityReference[];
  contextSnapshotId?: string;
  resolvedActionIds: string[];
  userId: string;
  tenantId: string;
  createdAt: string;
}

// ── Action Object ──────────────────────────────────────────────────────

/**
 * A concrete action executed by the OS in response to a command.
 * Actions are the bridge between parsed intent and system mutation.
 */
export interface OSAction {
  actionId: string;
  actionType: string;      // 'open_tab' | 'switch_workspace' | 'generate_report' | 'dispatch_work_order' | 'retry_work_order' | 'apply_theme' | etc.
  sourceCommandId?: string;
  targetRef?: EntityReference;
  payload: Record<string, unknown>;
  executionStatus: 'pending' | 'executing' | 'completed' | 'failed';
  resultMessage?: string;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Component Config ───────────────────────────────────────────────────

/**
 * Configuration for a single component instance within a layout.
 * Defines data bindings, theme context, and interaction rules.
 */
export interface ComponentConfig {
  componentInstanceId: string;
  componentId: string;     // from component registry
  layoutId: string;
  dataBindingSource: Record<string, unknown>;
  themeContext?: string;
  interactionRules?: string[];
  permissionDomain?: string;
  renderState: 'idle' | 'loading' | 'rendered' | 'error';
}

// ── Layout Config ──────────────────────────────────────────────────────

/**
 * Defines the spatial arrangement of component instances within a
 * workspace or tab view.
 */
export interface LayoutConfig {
  layoutConfigId: string;
  layoutType: string;
  workspaceId?: string;
  componentInstanceIds: string[];
  panelPositions: Record<string, { row: number; col: number; span?: number }>;
  densityMode: 'comfortable' | 'compact' | 'dense';
  themeVariant: 'dark' | 'light';
  updatedAt: string;
}

// ── System Health Snapshot ──────────────────────────────────────────────

/**
 * A periodic health check of the entire OS runtime — agent pools,
 * queues, deployment status, and memory pressure.
 */
export interface SystemHealthSnapshot {
  snapshotId: string;
  tenantId: string;
  activeAgentCount: number;
  queueBacklogSummary: Record<string, number>;
  criticalAlertCount: number;
  warningCount: number;
  deploymentStatus: 'healthy' | 'degraded' | 'failing';
  memoryPoolStatus: 'healthy' | 'pressure' | 'critical';
  eventSpineStatus: 'healthy' | 'lagging' | 'stalled';
  updatedAt: string;
}

// ── MUA Runtime State ──────────────────────────────────────────────────

/**
 * The real-time state of the MUA (Melli) AI assistant for a given
 * user session. Tracks attention, active context, and conversation mode.
 */
export interface MUARuntimeState {
  userId: string;
  tenantId: string;
  activeWorkspaceId: string;
  activeTabId: string | null;
  activeEntityRef: EntityReference | null;
  notificationSummary: { unread: number; urgent: number; critical: number };
  workOrderSummary: { active: number; failed: number; completed: number };
  attentionSummary: { info: number; warning: number; critical: number };
  lastSystemWarning: string | null;
  recentActions: string[];
  conversationMode: string;
  lastUpdatedAt: string;
}

export * from './seo';
export * from './os-objects';

// ─── Tenant & User ────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED";
  plan: string;
  domain?: string | null;
  logoUrl?: string | null;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "VIEWER";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  /** User ID from API responses */
  id?: string;
  /** JWT subject (same as id, present in decoded tokens) */
  sub?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "VIEWER";
  tenantId?: string;
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  tenantId: string;
  organizationId?: string | null;
  type: "PERSON" | "COMPANY";
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  customFields: Record<string, any>;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType =
  | "NOTE"
  | "EMAIL"
  | "SMS"
  | "CALL"
  | "MEETING"
  | "TASK"
  | "DEAL_STAGE_CHANGED"
  | "ORDER_CREATED"
  | "LESSON_COMPLETED"
  | "SEO_PAGE_GENERATED"
  | "AI_COMMAND"
  | "SYSTEM";

export interface Activity {
  id: string;
  tenantId: string;
  contactId?: string | null;
  userId?: string | null;
  type: ActivityType;
  title: string;
  body?: string | null;
  metadata: Record<string, any>;
  occurredAt: Date;
  createdAt: Date;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiCommandRequest {
  inputText: string;
  inputMode: "text" | "voice";
  engine?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface AiCommandResult {
  commandId: string;
  status: "COMPLETED" | "FAILED";
  responseText: string;
  actions?: AiAction[];
  metadata?: Record<string, any>;
}

export interface AiAction {
  type: string;
  payload: Record<string, any>;
  label?: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventName =
  // Contacts
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  // Deals
  | "deal.created"
  | "deal.stage_changed"
  | "deal.won"
  | "deal.lost"
  // Orders
  | "order.created"
  | "order.confirmed"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"
  | "order.paid"
  | "order.fulfilled"
  // Coaching / Education
  | "lesson.completed"
  | "program.enrolled"
  | "program.completed"
  | "enrollment.created"
  | "enrollment.completed"
  | "enrollment.certificate_issued"
  // SEO
  | "seo.article.generated"
  | "seo.article.published"
  | "seo.article.indexed"
  // Store
  | "store.created"
  | "store.updated"
  // Workflows
  | "workflow.triggered"
  // AI
  | "ai.command.completed"
  // Tenants
  | "tenant.created"
  | "tenant.updated"
  | "tenant.deleted"
  // Subscriptions
  | "subscription.created"
  | "subscription.changed"
  | "subscription.cancelled"
  // Agents
  | "agent.activated"
  | "agent.deactivated"
  | "agent.task_completed"
  | "agent.escalation_created"
  // Credit
  | "credit.pulled"
  | "credit.analyzed"
  | "credit.decision_made"
  // Documents
  | "document.uploaded"
  | "document.verified"
  | "document.rejected"
  // Commerce
  | "auction.closed"
  // Email
  | "email.sent"
  | "email.failed"
  // SMS
  | "sms.sent"
  | "sms.failed"
  // Leads
  | "lead.enriched"
  | "lead.scored"
  | "lead.synced"
  | string;

export interface SystemEvent {
  id: string;
  tenantId: string;
  name: EventName;
  payload: Record<string, any>;
  source: string;
  createdAt: Date;
}

// ─── Queue Jobs ───────────────────────────────────────────────────────────────

export interface AiAgentJob {
  tenantId: string;
  userId: string;
  commandId: string;
  inputText: string;
  engine: string;
  context: Record<string, any>;
}

export interface ContentGenerationJob {
  tenantId: string;
  questionId: string;
  keyword: string;
  clusterId?: string;
}

export interface IndexingJob {
  tenantId: string;
  articleId: string;
  url: string;
}

export interface AutomationJob {
  tenantId: string;
  workflowId: string;
  triggerId: string;
  payload: Record<string, any>;
}

export interface NotificationJob {
  tenantId: string;
  userId: string;
  channel: "IN_APP" | "EMAIL" | "SMS";
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsRollupJob {
  tenantId: string;
  metric: string;
  period: "hour" | "day" | "week" | "month";
}

// ─── CRM ─────────────────────────────────────────────────────────────────────

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color?: string | null;
  createdAt: string;
}

export interface Deal {
  id: string;
  tenantId: string;
  pipelineId: string;
  stageId: string;
  contactId?: string | null;
  title: string;
  value?: number | null;
  currency: string;
  status: "OPEN" | "WON" | "LOST" | "ON_HOLD";
  expectedAt?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
  lostReason?: string | null;
  notes?: string | null;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  tenantId: string;
  userId?: string | null;
  title: string;
  description?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueAt?: string | null;
  completedAt?: string | null;
  contactId?: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ─── Commerce ────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  type: "DIGITAL" | "PHYSICAL" | "SERVICE" | "SUBSCRIPTION" | "AUCTION";
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  currency: string;
  logoUrl?: string | null;
  description?: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  type: "DIGITAL" | "PHYSICAL" | "SERVICE" | "SUBSCRIPTION";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  basePrice: number;
  comparePrice?: number | null;
  sku?: string | null;
  inventory: number;
  imageUrls: string[];
  metaJson: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  storeId: string;
  contactId?: string | null;
  status: "DRAFT" | "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  couponCode?: string | null;
  notes?: string | null;
  metaJson: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ─── Coaching ────────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  price?: number | null;
  currency: string;
  template?: string | null;
  metaJson: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  contentType: "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT" | "DOCUMENT" | "AUDIO";
  content?: string | null;
  videoUrl?: string | null;
  order: number;
  durationMins?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  programId: string;
  contactId: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED" | "SUSPENDED";
  progressPct: number;
  enrolledAt: string;
  completedAt?: string | null;
  certificateId?: string | null;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  templateType?: string | null;
  issuedAt: string;
  pdfUrl?: string | null;
}

// ─── Communications ──────────────────────────────────────────────────────────

export interface CallLog {
  id: string;
  tenantId: string;
  contactId?: string | null;
  userId?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  status: "RINGING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "MISSED" | "VOICEMAIL" | "FAILED";
  fromNumber: string;
  toNumber: string;
  duration: number;
  startedAt?: string | null;
  endedAt?: string | null;
  dispositionCode?: string | null;
  notes?: string | null;
  externalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SmsThread {
  id: string;
  tenantId: string;
  contactId?: string | null;
  phoneNumber: string;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  tenantId: string;
  contactId?: string | null;
  assignedToId?: string | null;
  subject: string;
  description?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category?: string | null;
  slaDeadline?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  tenantId: string;
  contactId?: string | null;
  agentUserId?: string | null;
  status: "ACTIVE" | "WAITING" | "RESOLVED" | "CLOSED";
  channel: string;
  metadata: Record<string, any>;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export interface LeadSignal {
  id: string;
  tenantId: string;
  sourceId: string;
  status: "NEW" | "PROCESSING" | "ENRICHED" | "SCORED" | "QUALIFIED" | "REJECTED";
  rawData: Record<string, any>;
  title?: string | null;
  content?: string | null;
  url?: string | null;
  authorName?: string | null;
  authorProfile?: string | null;
  detectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadScore {
  id: string;
  profileId: string;
  totalScore: number;
  tier: string;
  factors: Record<string, any>;
  scoredAt: string;
}

export interface OutreachCampaign {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: string;
  targetCriteria: Record<string, any>;
  messageTemplate?: string | null;
  scheduledAt?: string | null;
  sentCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Forum ───────────────────────────────────────────────────────────────────

export interface ForumCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder: number;
  threadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumThread {
  id: string;
  tenantId: string;
  categoryId: string;
  questionId?: string | null;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "INDEXED" | "REFRESHING" | "ARCHIVED";
  directAnswer?: string | null;
  schemaMarkup?: Record<string, any> | null;
  viewCount: number;
  replyCount: number;
  voteCount: number;
  lastActivityAt?: string | null;
  publishedAt?: string | null;
  indexedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorType: string;
  authorId?: string | null;
  content: string;
  voteCount: number;
  isDirectAnswer: boolean;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Agents ───────────────────────────────────────────────────────────────

export interface AgentRole {
  id: string;
  slug: string;
  name: string;
  department: "EXECUTIVE" | "OPERATIONS" | "FINANCE" | "SALES" | "MARKETING" | "SUPPORT" | "COMPLIANCE" | "SECURITY";
  description?: string | null;
  systemPrompt?: string | null;
  tools: any[];
  permissions: any[];
  memoryScopes: any[];
  reportsTo?: string | null;
  schedule?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInstance {
  id: string;
  tenantId: string;
  roleId: string;
  name: string;
  status: "ACTIVE" | "IDLE" | "BUSY" | "ERROR" | "DISABLED";
  config: Record<string, any>;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  id: string;
  tenantId: string;
  agentId: string;
  type: string;
  input: Record<string, any>;
  output?: Record<string, any> | null;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  tokenUsage: number;
  costCents: number;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

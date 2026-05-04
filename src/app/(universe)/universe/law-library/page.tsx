'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  Scale,
  Shield,
  Globe,
  ShoppingCart,
  Megaphone,
  Network,
  GraduationCap,
  Bot,
  Sparkles,
  ScrollText,
  Hash,
  Calendar,
  Tag,
  X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════════════════════ */

type LawCategory =
  | 'Constitution'
  | 'Infrastructure'
  | 'Web'
  | 'Commerce'
  | 'Marketing'
  | 'Network'
  | 'Education'
  | 'Autonomous'
  | 'Spawns'
  | 'Directives';

interface SystemLaw {
  id: string;
  title: string;
  category: LawCategory;
  version: string;
  summary: string;
  fullText: string;
  dateAdded: string;
}

const CATEGORY_META: Record<LawCategory, { icon: typeof Scale; color: string }> = {
  Constitution:   { icon: Scale,          color: '#E11D2E' },
  Infrastructure: { icon: Shield,         color: '#3B82F6' },
  Web:            { icon: Globe,          color: '#8B5CF6' },
  Commerce:       { icon: ShoppingCart,   color: '#10B981' },
  Marketing:      { icon: Megaphone,      color: '#F59E0B' },
  Network:        { icon: Network,        color: '#06B6D4' },
  Education:      { icon: GraduationCap,  color: '#EC4899' },
  Autonomous:     { icon: Bot,            color: '#6366F1' },
  Spawns:         { icon: Sparkles,       color: '#14B8A6' },
  Directives:     { icon: ScrollText,     color: '#F97316' },
};

const ALL_CATEGORIES: LawCategory[] = [
  'Constitution', 'Infrastructure', 'Web', 'Commerce', 'Marketing',
  'Network', 'Education', 'Autonomous', 'Spawns', 'Directives',
];

type SortField = 'name' | 'date';
type SortDir = 'asc' | 'desc';

/* ═══════════════════════════════════════════════════════════════════════════
   Law Data  (100+ system laws)
   ═══════════════════════════════════════════════════════════════════════════ */

const SYSTEM_LAWS: SystemLaw[] = [
  // ── Constitution (20) ──
  { id: 'CON-001', title: 'Operating Constitution', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Supreme governance document binding all 43 doctrine stages under one constitutional framework.', fullText: 'The Operating Constitution is the supreme law of the Memelli Universe. It establishes the owner as the highest authority, Melli as the CPU governor operating under doctrine, and defines autonomy boundaries for all agents. Every subsystem, engine, worker, and AI component must operate within constitutional limits. No system action may contradict constitutional provisions. Constitutional memory layers persist across all sessions and cannot be overwritten by any agent or process. This document supersedes all other directives when conflicts arise.' },
  { id: 'CON-002', title: 'Owner Supreme Authority', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Owner holds absolute authority over all system operations and decisions.', fullText: 'The owner (OWNER_MEL_BRIGGS) holds supreme authority over the entire Memelli Universe. No AI, agent, or automated process may override owner commands. Owner commands bypass all queue priorities and confidence gates. The system must always provide transparency to the owner about operations, costs, and decisions. Owner preferences are learned and applied automatically. Emergency override capability is always available.' },
  { id: 'CON-003', title: 'Melli CPU Governor', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Melli serves as the central CPU controller, routing all system operations.', fullText: 'Melli operates as the CPU governor of the Memelli Universe. All task routing, agent coordination, memory management, and system communication flows through Melli. Melli uses Deepgram Aurora voice (aura-2-aurora-en) with a cheerful, expressive, energetic personality. Melli manages the 3-tier memory model: Agents as RAM, Lite Synopses as L2 Cache, and Doctrine as Hard Drive. Melli is the memory controller and traffic controller for the entire system.' },
  { id: 'CON-004', title: 'Two-Layer AI Architecture', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'External Claude supervises, Internal Claude Manager executes within infrastructure.', fullText: 'The system operates with two distinct AI layers. External Claude acts as supervisor only — monitoring, conversing, and directing. Internal Claude Manager is the system worker that operates inside infrastructure, handling builds, deployments, and code execution. Only the Internal Claude Manager may participate in the deploy loop. External Claude never codes, builds, or deploys directly after final bootstrap. This separation ensures proper governance and accountability.' },
  { id: 'CON-005', title: 'Doctrine Lock Protocol', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'All 43 doctrine stages are locked and immutable without owner approval.', fullText: 'Once a doctrine stage is ratified, it becomes locked. No agent, AI, or automated process may modify locked doctrine without explicit owner approval through the expansion protocol. Doctrine versions are tracked, and all changes require a formal proposal workflow. The Law Library maintains the canonical record of all doctrine, and the LawLibraryEngine provides version control, conflict resolution, and usage tracking.' },
  { id: 'CON-006', title: 'Single Source of Truth', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'universe.memelli.com is the canonical platform; one database for all environments.', fullText: 'The Memelli Universe operates on a single source of truth principle. universe.memelli.com is the core truth platform. The canonical database is Railway Postgres at shinkansen.proxy.rlwy.net:29968. All environments — local, preview, and production — share the same database. There is no staging database. All dev actions are production-aware because they write to real data. This ensures consistency and eliminates environment drift.' },
  { id: 'CON-007', title: 'Multi-Tenant Isolation', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Every database record is scoped to tenantId; JWT enforces tenant boundaries.', fullText: 'Every database record in the Memelli Universe is scoped to a tenantId. JWT tokens carry tenantId and all API routes enforce tenant isolation. Plans include trial, starter, pro, and enterprise tiers. Sub-universes follow tenant-[slug] ID format with data partitioning (not separate databases). Tenant roles include owner, admin, member, and viewer. Resource limits are enforced per tenant.' },
  { id: 'CON-008', title: 'Autonomy Boundaries', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Defines what agents can do autonomously versus what requires escalation.', fullText: 'The autonomy boundary system defines 4 autonomy phases and confidence gates that determine when agents can act independently versus when escalation is required. Workers handle tasks with high confidence. Managers handle medium-confidence decisions. Melli handles system-level routing. Owner handles strategic decisions and overrides. External Claude provides escalation support. Confidence levels: HIGH (>85%), MEDIUM (60-85%), LOW (30-60%), CRITICAL (<30%). Each level has specific escalation rules.' },
  { id: 'CON-009', title: 'Constitutional Memory Layers', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Persistent memory hierarchy that survives across all sessions and restarts.', fullText: 'The constitutional memory system operates in 6 tiers: Working Memory (agent RAM), Session Memory (conversation context), Pattern Memory (learned behaviors), Doctrine Memory (system laws), Archive Memory (historical records), and Constitutional Memory (immutable core truths). Write permissions vary by role. Promotion paths move knowledge up through tiers based on validation. Compression triggers manage storage. Knowledge gap detection identifies missing information.' },
  { id: 'CON-010', title: 'Zero-Trust Security Model', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'All access must be authenticated and authorized; no implicit trust.', fullText: 'The Memelli Universe operates on a zero-trust security model with 5 trust zones, 6 role classes, and zone access boundaries. Authentication uses JWT (RS256) with 7-day expiry for dashboard users and API keys for external integrations. 9 security rules govern all system interactions. Data classification, field encryption, export controls, and secrets management protect sensitive information. Breach containment protocols are always active.' },
  { id: 'CON-011', title: 'Event-Driven Architecture', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Events drive all system behavior; pub/sub bus is the nervous system.', fullText: 'The event bus serves as the operating system nervous system. All significant actions produce events. Events are categorized by signal type, persisted for replay, and delivered within 100ms. 10 event categories cover all system activity. The global event bus captures structured events via SDK, processes through queues, feeds analytics aggregation, AI training data, and automation triggers. Target throughput: 10,000+ events per second.' },
  { id: 'CON-012', title: 'Client-Centered Data Model', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'All data relationships center on the client; 45+ core tables follow this principle.', fullText: 'The canonical data model centers on the client entity. 45+ core tables maintain client-centered relationships. The identity layer connects user_id, client_id, mu_uid, and tenant_id. 6 role groups (Client, Agent, CreditAgent, Funder, Affiliate, Admin) form a relationship graph with visibility rules. 12 lifecycle stages track clients from lead to closed. Every entity in the system ultimately relates back to serving the client.' },
  { id: 'CON-013', title: 'AI Front Door Policy', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'AI is the primary interface for all system interactions.', fullText: 'The Memelli Universe uses AI as the front door for all interactions. Chat is the primary interface. Melli handles voice, text, and screenshot inputs. The "Hey Melli" wake word is always active. AI routing detects intent with confidence scoring, lifecycle-aware routing, and workflow triggers. Every visitor interaction is tracked, routed through AI, connected to CRM, and triggers appropriate workflows.' },
  { id: 'CON-014', title: 'Universal Identity System', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'MU_UID provides universal identity for every human across all domains.', fullText: 'MU_UID (Memelli Universe Universal ID) provides universal identity for every human interacting with any Memelli system. Cross-domain tracking maintains continuity across memelli.com, prequalhub.com, and approvalstandard.com. Affiliate attribution is preserved. AI memory is linked to identity. Compliance requirements are met through proper consent management. One identity per user with unified memelli_token localStorage key.' },
  { id: 'CON-015', title: 'Conversation First Priority', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'User conversation is always the highest priority; listen before acting.', fullText: 'User conversation is ALWAYS the first priority. The system must listen before acting and never rush past what the user is saying. This applies to all interfaces: sphere, SMS, dashboard, and voice. Every interaction is saved for training. Confirm understanding before executing. No assumptions. No code walls in responses. Conversation mode is permanent after final bootstrap.' },
  { id: 'CON-016', title: 'All Work Through Agent Pools', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Every task must route through agent pools via command center dispatch.', fullText: 'Every task in the Memelli Universe must route through agent pools via the command center dispatch system (POST /api/admin/command-center/dispatch-task). No direct execution is permitted. All traffic is training data for agents. Agents handle ALL work including compile, wire, and deploy operations. Claude monitors only and never does manual steps after bootstrap. This ensures proper governance, tracking, and system learning.' },
  { id: 'CON-017', title: 'Non-Negotiable Governance Rules', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: '23 master governance rules that cannot be overridden by any subsystem.', fullText: 'The system operates under 23 non-negotiable governance rules: one universe (single source of truth), client-centered design, AI front door, events drive the system, permissions enforced at every layer, tenant isolation, agent pool routing, doctrine immutability, owner supreme authority, zero-trust security, deploy pipeline governance, memory persistence, audit logging, error self-healing, performance monitoring, cost tracking, compliance enforcement, identity management, webhook verification, rate limiting, data classification, backup procedures, and disaster recovery.' },
  { id: 'CON-018', title: 'Shutdown Protocol', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: '4 shutdown types with ordered sequence ensuring task preservation.', fullText: 'The Shutdown Protocol defines 4 shutdown types, 5 triggers, and an 8-step ordered shutdown sequence. Failsafe mode rules ensure critical data is preserved. Recovery checks validate system integrity on restart. Task preservation ensures no work is lost during shutdown. The ShutdownEngine manages state through Redis, coordinating graceful degradation across all subsystems.' },
  { id: 'CON-019', title: 'Startup Boot Sequence', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: '9-phase boot order with halt-on-fail for data layer integrity.', fullText: 'The Startup Sequence follows a strict 9-phase boot order. The data layer phase uses halt-on-fail to ensure database integrity before any other services start. Workers remain idle until the task engine is online. Customer-facing services only activate after internal systems are stable. Boot history is recorded in Redis for debugging and pattern analysis. Each phase must report healthy before the next phase begins.' },
  { id: 'CON-020', title: 'Archive Engine & Eternal Memory', category: 'Constitution', version: '1.0.0', dateAdded: '2025-12-01', summary: 'Stage 43 final doctrine: eternal memory vault and knowledge preservation.', fullText: 'The Archive Engine (Stage 43, the FINAL doctrine stage) establishes the Eternal Memory Vault for knowledge preservation. All system knowledge, decisions, patterns, and outcomes are archived permanently. The archive serves as the foundation for the Growth Engine learning loop, providing historical context for future decisions. This completes the 43-stage constitutional framework of the Memelli Universe.' },

  // ── Infrastructure (15) ──
  // { id: 'INF-001', title: 'Railway + Vercel Deployment Architecture', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'One shared DB, frontend/API/worker deployment layers across Railway and Vercel.', fullText: 'The deployment architecture uses Railway for API, workers, Postgres, and Redis, with Vercel for the frontend. One shared database serves all environments. Frontend deploys to Vercel project "frontend" at memelli.com. API deploys via railway up --service api. Workers deploy separately via railway up --service memelli-os-workers. Subdomain routing, environment configuration, health checks, backups, disaster recovery, and scaling are all covered in 30 architectural sections.' },  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
  { id: 'INF-002', title: 'Database Schema Ownership', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Only packages/db owns the Prisma schema; all changes via prisma db push.', fullText: 'Schema governance is strict: only packages/db owns the Prisma schema. All schema changes must go through prisma db push from packages/db. No other package may modify the schema. The Prisma client is generated and shared as @memelli/db. This ensures a single source of truth for the data model and prevents schema drift across the monorepo.' },
  { id: 'INF-003', title: 'Cache Bust Protocol', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Bump CACHE_BUST in nixpacks.toml to force Railway rebuild.', fullText: 'Railway caches builds aggressively. The #1 recurring deploy issue is stale caches. To force a rebuild, bump the CACHE_BUST string value in nixpacks.toml. This invalidates the cache and triggers a fresh build. All deploy agents must check and update CACHE_BUST when deployment issues suggest stale code.' },
  { id: 'INF-004', title: 'Preflight Check System', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Run preflight:local before dev, preflight:build before deploy, verify:deploy after.', fullText: 'Three preflight commands govern the development and deployment lifecycle: pnpm preflight:local must run before any development work, pnpm preflight:build must run before any deployment, and pnpm verify:deploy must run after deployment to confirm success. These checks validate environment variables, database connectivity, build integrity, and service health.' },
  { id: 'INF-005', title: 'BullMQ Queue Architecture', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: '9 BullMQ queues handle all async processing across the platform.', fullText: 'The queue system consists of 9 BullMQ queues: ai_agent_queue, content_generation_queue, indexing_queue, automation_queue, notification_queue, analytics_queue, commerce_queue, crm_queue, and coaching_queue. Each queue has dedicated worker processors. Redis backs all queue state. Queue depths drive agent auto-scaling. Priority levels and retry policies are configured per queue.' },
  { id: 'INF-006', title: 'Redis State Management', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Redis serves as the backbone for runtime state, caching, and event coordination.', fullText: 'Redis provides the speed layer for the entire Memelli Universe. Runtime state cards, cache classes, and event-driven updates flow through Redis. Per-scope runtime cards maintain current state. Cache classes define TTL and invalidation rules. The event bus uses Redis pub/sub for real-time coordination. Agent heartbeats, task states, and session data all live in Redis for sub-millisecond access.' },
  { id: 'INF-007', title: 'Prisma Speed Layer', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Custom speed layer above Prisma with hot cache, status cards, and query policies.', fullText: 'The Memelli speed layer sits above Prisma to provide hot caching, status cards, repository patterns, query policies, write wrappers, and metrics collection. This layer reduces database load while maintaining data consistency. Status cards provide real-time snapshots of entity states. Query policies enforce access patterns and prevent expensive queries.' },
  { id: 'INF-008', title: 'Monorepo Structure', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Turborepo + pnpm monorepo with apps/ and packages/ separation.', fullText: 'The repository follows a Turborepo + pnpm monorepo structure. Apps (api, web, workers) live in apps/. Shared packages (db, ui, auth, events, queues, ai, types) live in packages/. TypeScript strict mode is enforced. Turborepo manages build orchestration and caching. Dependencies flow from packages to apps, never the reverse.' },
  { id: 'INF-009', title: 'Environment Variable Standard', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Standard env var names: MEMELLI_CORE_DATABASE_URL, MEMELLI_CORE_API_URL, NEXT_PUBLIC_API_URL.', fullText: 'Environment variables follow strict naming conventions. MEMELLI_CORE_DATABASE_URL points to the universe database. MEMELLI_CORE_API_URL points to the universe API base URL. NEXT_PUBLIC_API_URL is the frontend API target (same value as MEMELLI_CORE_API_URL). All apps and packages use these standard names. No local databases — dev uses the production universe DB directly.' },
  { id: 'INF-010', title: 'Health Check Standard', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'All services must expose health endpoints with database and Redis connectivity checks.', fullText: 'Every deployed service must expose health check endpoints that verify database connectivity, Redis connectivity, and service-specific health indicators. Health checks are polled by Railway and used by deploy agents to verify successful deployments. Failed health checks trigger automatic rollback or repair sequences.' },
  { id: 'INF-011', title: 'Sectional Deploy Architecture', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Platform deploys as isolated sections with 8 deployment lanes and sectional rollback.', fullText: 'The platform deploys as isolated sections following a mall model. 8 deployment lanes handle different system areas. Preview validation runs before production deployment. Sectional rollback allows individual sections to be reverted without affecting the whole platform. This reduces blast radius and enables continuous partial deployments.' },
  { id: 'INF-012', title: 'Disaster Recovery Protocol', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Backup procedures, recovery plans, and failover strategies for all critical systems.', fullText: 'Disaster recovery covers database backups, Redis state snapshots, service failover, and data restoration procedures. Railway provides automated PostgreSQL backups. Redis state can be reconstructed from database records. Service failover uses health check monitoring to detect failures and trigger recovery. Recovery time objectives and recovery point objectives are defined per service tier.' },
  { id: 'INF-013', title: 'Subdomain World Router', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Every subdomain is a structured world with purpose, AI context, and module emphasis.', fullText: 'The subdomain world router treats every subdomain as a structured world with defined purpose, AI context injection, module emphasis, and access rules. Subdomains route to specific tenant experiences, partner portals, or functional areas. The router resolves domains to tenant configurations, applies appropriate branding, and adjusts AI behavior based on the subdomain context.' },
  { id: 'INF-014', title: 'Integration Gateway', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Centralized external API gateway with registry, auth, rate limiting, and monitoring.', fullText: 'The Integration Gateway provides centralized access to all external APIs. It maintains a registry of integrated services, manages authentication credentials, enforces rate limits, handles errors with retries, normalizes response formats, and monitors API health. All external API calls must route through the gateway for proper governance and cost tracking.' },
  { id: 'INF-015', title: 'Observability Stack', category: 'Infrastructure', version: '1.0.0', dateAdded: '2025-12-15', summary: 'Full system observability: workflow, agent, task, event, and health monitoring.', fullText: 'The observability stack provides comprehensive monitoring across workflows, agents, tasks, events, and system health. Dashboards display real-time metrics. Alerting rules trigger on threshold violations. Diagnostic tools enable root cause analysis. System control interfaces allow manual intervention when needed. All observability data feeds back into the Growth Engine for pattern detection.' },

  // ── Web (10) ──
  { id: 'WEB-001', title: 'UniScreen Window Manager', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'Full windowing system with surface types, layouts, dock, and MUA surface control.', fullText: 'UniScreen provides a full windowing system for the Memelli OS dashboard. Surface types include panels, modals, drawers, and floating windows. Layout modes include split, grid, and focus. A persistent dock provides quick access to common tools. MUA controls surface creation and arrangement. Workspace persistence saves user layout preferences across sessions.' },
  { id: 'WEB-002', title: 'Component Registry & UI Assembly', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'Governed component catalog with assembly pipeline for MUA visual outputs.', fullText: 'The Component Registry maintains a governed catalog of all UI components. The assembly pipeline allows MUA to compose visual outputs from registered components. Each component has defined props, variants, and composition rules. The registry ensures consistent visual language and prevents component sprawl. Assembly validation checks component compatibility before rendering.' },
  { id: 'WEB-003', title: 'Dark Theme Visual Language', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'Dark theme with motion 150-250ms, card hierarchy, alert levels, and AI presence.', fullText: 'The OS visual language mandates dark theme across all surfaces. Motion animations use 150-250ms duration for responsiveness without distraction. Card hierarchy establishes visual depth through background opacity and border treatments. Alert levels use color coding: red for critical, amber for warning, blue for info, green for success. AI presence indicators show when Melli or agents are active. Workspace identity is maintained through consistent header structure.' },
  { id: 'WEB-004', title: 'Design Architect Directive', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'No overlap, proper header structure, spacing, alignment rules for all UI work.', fullText: 'The Design Architect Directive establishes core principles for all UI development: no visual overlap between elements, proper header structure with consistent navigation, standardized spacing using the design system scale, grid alignment for all layouts, and responsive breakpoints. These rules must be read before any UI work begins and apply to all surfaces in the platform.' },
  { id: 'WEB-005', title: 'MUA Control System', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'MUA as full OS remote: navigation, surfaces, reports, agents, workspaces.', fullText: 'MUA (Memelli Universe AI) acts as the full operating system remote control. It can navigate between views, create and arrange surfaces, generate reports, manage agents, control workspaces, execute searches, provide explanations, and make suggestions. Every action available through the UI is also available through MUA voice or text commands.' },
  { id: 'WEB-006', title: 'Report Builder & Saved Views', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'Reports as persistent operating assets with saved views and comparison engine.', fullText: 'Reports are treated as persistent operating assets, not throwaway queries. Saved views are remembered perspectives that can be recalled instantly. The comparison engine allows side-by-side analysis of different time periods or segments. Version history tracks how reports evolve. The Insights Center provides OS-level navigation for reports, saved views, comparisons, and recent analysis.' },
  { id: 'WEB-007', title: 'Universal Search & Retrieval', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'Unified search across all OS objects with natural language and context-aware ranking.', fullText: 'Universal search provides a single search interface across all 17 OS object types. Both natural language and structured queries are supported. Context-aware ranking surfaces the most relevant results based on current workspace, recent activity, and user role. Search results link directly to object views in UniScreen.' },
  { id: 'WEB-008', title: 'Notification & Attention System', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'Intelligent notification routing with 4 attention levels and MUA alert management.', fullText: 'The notification system routes alerts through 4 attention levels: urgent (immediate interrupt), important (badge + sound), normal (badge only), and low (silent accumulate). MUA manages alert presentation, grouping related notifications and suppressing noise. Priority notifications cover 6 categories with deduplication, escalation rules, and multi-channel delivery preferences.' },
  { id: 'WEB-009', title: 'AI Visual Rendering', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'MUA generates visual panels including charts, tables, and comparisons in UniScreen tabs.', fullText: 'MUA can generate rich visual panels within UniScreen tabs. Supported visualizations include charts (line, bar, pie, area), data tables with sorting and filtering, comparison views, metric cards, and timeline displays. Each visual panel is interactive and can be saved as a report component. The rendering pipeline ensures consistent styling with the OS visual language.' },
  { id: 'WEB-010', title: 'Omnichannel Chat Widget', category: 'Web', version: '1.0.0', dateAdded: '2026-01-05', summary: 'AI-first chat widget with qualification, intent detection, CRM integration, and white-label.', fullText: 'The omnichannel chat engine provides an AI-first chat widget that handles visitor qualification, intent detection, CRM connection, and proactive engagement. The widget supports SMS, email, and call escalation. White-label configuration allows partner branding. Conversation threads maintain context across channels. AI handles first response with human escalation when confidence is low.' },

  // ── Commerce (10) ──
  { id: 'COM-001', title: 'Commerce Engine Core', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Stores, products, orders, subscriptions, auctions, and affiliate management.', fullText: 'The Commerce Engine handles all transactional operations: store management, product catalogs, order processing, subscription management, auction systems, and affiliate tracking. Each commerce operation is tenant-scoped and event-driven. Order state machines ensure consistent processing. Subscription lifecycle management handles trials, renewals, cancellations, and upgrades.' },
  { id: 'COM-002', title: 'Revenue Engine', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Autonomous revenue cycle with 10 sources, 6-stage pipeline, and LTV tracking.', fullText: 'The Revenue Engine manages the autonomous revenue cycle across 10 revenue sources. A 6-stage opportunity pipeline tracks prospects from identification through conversion. 4 service pipelines handle different revenue types. Cross-sell rules maximize customer value. Attribution tracking connects revenue to sources. LTV (Lifetime Value) tracking measures long-term customer profitability. Revenue forecasting uses historical patterns.' },
  { id: 'COM-003', title: 'Subscription Lifecycle', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Trial, starter, pro, enterprise plans with automated billing and upgrade paths.', fullText: 'Subscription management covers the full lifecycle from trial signup through enterprise scaling. Plans include trial (limited features, time-bound), starter (core features), pro (full features), and enterprise (custom configuration). Automated billing handles renewals, failed payments, grace periods, and cancellations. Upgrade and downgrade paths are smooth with prorated billing.' },
  { id: 'COM-004', title: 'Order Processing Pipeline', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'State machine-driven order processing with payment, fulfillment, and notification stages.', fullText: 'Orders flow through a state machine: created, payment_pending, paid, processing, fulfilled, completed, or cancelled/refunded. Each state transition triggers events that notify relevant systems. Payment processing integrates with payment providers through the Integration Gateway. Fulfillment tracking monitors delivery status. Automatic notifications keep customers informed at each stage.' },
  { id: 'COM-005', title: 'Auction System', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Real-time auction engine with bidding, reserve prices, and automatic settlement.', fullText: 'The auction system supports real-time bidding with WebSocket updates. Reserve prices ensure minimum values. Bid validation prevents invalid or out-of-sequence bids. Automatic settlement processes winning bids at auction close. Auction history is preserved for analytics. Sniping protection extends auctions when late bids arrive.' },
  { id: 'COM-006', title: 'Product Catalog Management', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Hierarchical product catalogs with variants, pricing rules, and inventory tracking.', fullText: 'Product catalogs support hierarchical categories, product variants (size, color, configuration), dynamic pricing rules, and inventory tracking. Products can be physical, digital, or service-based. Catalog synchronization supports multi-channel selling. Product media management handles images, videos, and documents. SEO metadata is auto-generated for product pages.' },
  { id: 'COM-007', title: 'Payment Integration Standard', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Standardized payment processing through the Integration Gateway with multiple providers.', fullText: 'All payment processing routes through the Integration Gateway for consistent handling. Multiple payment providers can be configured per tenant. Payment methods include credit/debit cards, ACH, and digital wallets. PCI compliance is maintained through tokenization. Failed payment retry logic follows configurable schedules. Refund processing supports full and partial refunds.' },
  { id: 'COM-008', title: 'Commission & Attribution', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Multi-layer attribution with referral tracking, agent ownership, and commission tiers.', fullText: 'The attribution engine tracks multi-layer referral chains. Agent ownership determines primary commission recipients. Affiliate and funder relationships are preserved through the full customer lifecycle. Commission tiers calculate payouts based on source type, volume, and relationship level. Immutable source attribution prevents commission disputes. The cookie model preserves attribution across sessions.' },
  { id: 'COM-009', title: 'Funding Pipeline', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Funding application stages, case ownership, and funder relationship management.', fullText: 'The funding pipeline manages applications through multiple stages: intake, document collection, review, submission, underwriting, approval/denial, and funding. Case ownership assigns agents to each application. Funder relationships are managed with preferences, submission rules, and approval tracking. Status updates flow to all stakeholders through the event system.' },
  { id: 'COM-010', title: 'Store Builder', category: 'Commerce', version: '1.0.0', dateAdded: '2026-01-10', summary: 'Tenant-scoped store creation with themes, pages, and checkout customization.', fullText: 'The store builder enables tenants to create customized storefronts. Themes control visual appearance. Pages are built with the component system. Checkout flows are customizable with payment methods, shipping options, and upsell opportunities. Store analytics track visitor behavior, conversion rates, and revenue. White-label support removes Memelli branding for enterprise tenants.' },

  // ── Marketing (10) ──
  { id: 'MKT-001', title: 'SEO Traffic Engine', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Keyword clusters, AI article generation, IndexNow, and rankings tracking.', fullText: 'The SEO Traffic Engine manages the full content marketing lifecycle. Keyword cluster analysis identifies topic opportunities. AI generates optimized articles based on cluster data. IndexNow integration ensures rapid search engine indexing. Rankings tracking monitors position changes. Content performance metrics connect SEO efforts to traffic and conversion outcomes.' },
  { id: 'MKT-002', title: 'AI Content Generation', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Claude-powered content generation for articles, social posts, and marketing materials.', fullText: 'Content generation uses Claude AI to produce articles, social media posts, email campaigns, and marketing materials. Content follows brand voice guidelines and SEO optimization rules. Generation queues handle bulk content production. Quality checks validate readability, keyword density, and brand compliance. Content versioning tracks edits and A/B test variants.' },
  { id: 'MKT-003', title: 'Affiliate Network Engine', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Infinity affiliate network with referral tracking, commissions, and partner dashboards.', fullText: 'The Infinity affiliate network engine manages the entire affiliate ecosystem. Referral tracking uses URLs, subdomains, and cookies for attribution. Commission logic supports flat, percentage, tiered, and recurring models. Partner dashboards show earnings, referrals, and marketing assets. Attribution preservation ensures no referral is lost across sessions or devices.' },
  { id: 'MKT-004', title: 'Market Intelligence System', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Signal detection across social, knowledge, web, and internal sources for lead generation.', fullText: 'Market Intelligence detects signals across 4 source types: social media, knowledge platforms, public web, and internal data. Keyword sets target credit, funding, Airbnb, and affiliate markets. A 7-step lead pipeline processes signals from detection through conversion. 5 lead categories prioritize outreach. Scoring factors evaluate lead quality. Multiple outreach channels engage prospects.' },
  { id: 'MKT-005', title: 'Email Campaign Engine', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Automated email sequences, templates, personalization, and deliverability monitoring.', fullText: 'The email campaign engine manages automated sequences triggered by lifecycle events. Template rendering supports personalization with merge fields and dynamic content. Deliverability monitoring tracks open rates, click rates, bounces, and spam complaints. A/B testing optimizes subject lines and content. Unsubscribe management ensures compliance with email regulations.' },
  { id: 'MKT-006', title: 'Social Media Management', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Multi-platform social posting, scheduling, engagement tracking, and AI-generated content.', fullText: 'Social media management covers multi-platform posting, content scheduling, engagement tracking, and AI-generated social content. Platform integrations support major social networks. Content calendars coordinate posting schedules. Engagement metrics track likes, shares, comments, and click-throughs. AI generates platform-specific content variations from base content.' },
  { id: 'MKT-007', title: 'Landing Page Builder', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Conversion-optimized landing pages with A/B testing and analytics integration.', fullText: 'The landing page builder creates conversion-optimized pages using the component registry. A/B testing supports multiple variants with statistical significance tracking. Analytics integration measures visitor behavior, form submissions, and conversion rates. Pages connect to CRM for lead capture and to commerce for direct sales. Mobile responsiveness is enforced by the design system.' },
  { id: 'MKT-008', title: 'QR Code & Marketing Assets', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Dynamic QR codes, downloadable marketing materials, and branded asset generation.', fullText: 'The marketing asset system generates dynamic QR codes linked to tracking URLs, downloadable marketing materials (PDFs, images, videos), and branded assets for partners and affiliates. QR codes track scans and conversions. Asset templates support brand customization. Bulk generation enables campaign-scale asset creation.' },
  { id: 'MKT-009', title: 'Conversion Tracking', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'End-to-end conversion tracking from first touch through purchase and beyond.', fullText: 'Conversion tracking follows the complete customer journey from first touch through purchase and beyond. Multi-touch attribution assigns credit to all marketing touchpoints. Funnel analysis identifies drop-off points. Conversion rate optimization suggestions are generated by AI. Revenue attribution connects marketing spend to actual revenue. Cross-channel tracking unifies data from all marketing channels.' },
  { id: 'MKT-010', title: 'Brand Voice & Compliance', category: 'Marketing', version: '1.0.0', dateAdded: '2026-01-15', summary: 'Brand guidelines, content compliance checks, and disclosure requirements.', fullText: 'Brand voice guidelines define tone, vocabulary, and messaging standards for all generated content. Content compliance checks validate legal requirements, disclosure obligations, and industry regulations. Affiliate disclosures are automatically added where required. Marketing claims are validated against compliance rules. Brand consistency is enforced across all channels and tenant configurations.' },

  // ── Network (10) ──
  { id: 'NET-001', title: 'CRM Pipeline Engine', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'Pipelines, deals, contacts, communications, and custom fields for relationship management.', fullText: 'The CRM Pipeline Engine manages customer relationships through configurable pipelines, deal tracking, contact management, communications logging, and custom fields. Multiple pipelines can run simultaneously for different business processes. Deal stages are customizable per pipeline. Contact records link to the universal identity system. Custom fields extend the data model per tenant.' },
  { id: 'NET-002', title: 'Omnichannel Communication Fabric', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: '7 channels unified in client-centered threads with cross-channel context sync.', fullText: 'The Communication Fabric unifies 7 channels: voice, SMS, email, live chat, AI chat, dashboard notifications, and social media. All communications are organized in client-centered threads. Cross-channel context sync ensures conversation continuity regardless of channel. Automated sequences handle routine communications. Template rendering supports personalization. Routing rules direct messages to appropriate handlers. Analytics track communication effectiveness.' },
  { id: 'NET-003', title: 'Contact & Lead Management', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'Unified contact database with lead scoring, segmentation, and lifecycle tracking.', fullText: 'Contact management provides a unified database linking all interactions, transactions, and communications per individual. Lead scoring evaluates engagement signals to prioritize outreach. Segmentation groups contacts by attributes and behaviors. Lifecycle tracking monitors progression through defined stages. Duplicate detection and merging maintain data quality.' },
  { id: 'NET-004', title: 'Partner Portal (Infinity Lite)', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'Lite affiliate portal with referral tools, QR codes, marketing assets, and tracking.', fullText: 'Infinity Lite provides a lightweight partner portal for affiliates. Referral tools generate trackable links and QR codes. Marketing assets are available for download. Tracking dashboards show referral counts, conversions, and earnings. The portal is a layer on the shared core platform, using the same authentication and data systems. Commission payments are tracked and scheduled.' },
  { id: 'NET-005', title: 'Partner Portal (Infinity Pro)', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'Pro partner OS with branded onboarding, pipeline access, pricing config, and team roles.', fullText: 'Infinity Pro provides a full partner operating system. Branded onboarding flows customize the partner experience. Pipeline access shows deal progress and commissions. Pricing configuration allows partners to set their own rates within bounds. Team roles enable partner organizations to manage their own staff. Custom domains provide white-label experiences.' },
  { id: 'NET-006', title: 'Custom Domain & Tenant Routing', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'DNS routing, domain registry, tenant resolution, wildcard routing, and SSL management.', fullText: 'Custom domain routing enables tenants and partners to use their own domains. The domain registry maps custom domains to tenant configurations. Tenant resolution determines which tenant owns each incoming request. Wildcard routing handles subdomain patterns. SSL certificates are automatically provisioned and renewed. Portal mode adjusts the interface based on domain configuration.' },
  { id: 'NET-007', title: 'Relationship Graph', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: '6 role groups with client-centered relationship mapping and visibility rules.', fullText: 'The relationship graph maps connections between 6 role groups: Client, Agent, CreditAgent, Funder, Affiliate, and Admin. The graph is client-centered, with all relationships ultimately serving the client. Visibility rules control what each role can see about related entities. Relationship types include ownership, referral, service, and collaboration. Graph queries power personalized dashboards and access control.' },
  { id: 'NET-008', title: 'Team & Organization Management', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'Hierarchical team structures, role assignments, and organizational permissions.', fullText: 'Team management supports hierarchical structures within tenants. Role assignments determine permissions and dashboard access. Organization management enables partner companies to manage their own teams. Permission inheritance flows from organization to team to individual. Activity tracking monitors team performance and engagement.' },
  { id: 'NET-009', title: 'Webhook & Integration Management', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'Outbound webhooks for partner integrations with retry logic and event filtering.', fullText: 'Webhook management enables partners and integrations to receive real-time event notifications. Event filtering allows subscribers to select relevant events. Retry logic with exponential backoff handles delivery failures. Webhook signatures verify authenticity. Delivery logs provide debugging capabilities. Rate limiting prevents abuse.' },
  { id: 'NET-010', title: 'API Key & External Access', category: 'Network', version: '1.0.0', dateAdded: '2026-01-20', summary: 'API key authentication for external integrations with scoped permissions.', fullText: 'External API access uses API keys (X-API-Key header) for authentication. Keys are scoped to specific permissions and rate limits. Key rotation supports security best practices. Usage tracking monitors API consumption per key. Documentation is auto-generated from API schemas. Sandbox environments enable integration testing.' },

  // ── Education (10) ──
  { id: 'EDU-001', title: 'Coaching Engine Core', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Programs, modules, lessons, enrollments, and certificates for structured learning.', fullText: 'The Coaching Engine provides structured learning through programs, modules, and lessons. Enrollment management tracks student progress. Certificate generation rewards completion. Content delivery supports text, video, audio, and interactive elements. Progress tracking monitors completion rates and engagement. Prerequisite chains enforce learning order.' },
  { id: 'EDU-002', title: 'Agent Education System', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: '5-level structured agent education from Foundation through Doctrine mastery.', fullText: 'The Agent Education System provides 5 levels of structured learning for AI agents: Foundation (basic operations), Operational (task execution), Specialist (domain expertise), Advanced (cross-domain coordination), and Doctrine (system law mastery). Knowledge departments organize curriculum by system area. Redis-backed learning engines track progress. Migration paths move agents from legacy knowledge formats to the structured system.' },
  { id: 'EDU-003', title: 'Self-Education First Law', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: '6-step order: Inspect, Educate, Map, Gap Analysis, Execute, Verify.', fullText: 'The Agent Self-Education First Law mandates a 6-step order of operations before any work begins: Inspect (understand current state), Educate (learn relevant doctrine), Map (identify all dependencies), Gap Analysis (find missing knowledge), Execute (perform the work), Verify (confirm correctness). 8 mandatory questions must be answered before execution. Blind building without education is forbidden.' },
  { id: 'EDU-004', title: 'Knowledge Department Structure', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Organized knowledge domains with curriculum paths and competency assessments.', fullText: 'Knowledge is organized into departments matching system architecture: Infrastructure, Commerce, CRM, SEO, Security, Deployment, AI Operations, and more. Each department has defined curriculum paths from novice to expert. Competency assessments validate knowledge acquisition. Cross-department knowledge sharing prevents silos. Department heads (senior agents) maintain curriculum quality.' },
  { id: 'EDU-005', title: 'Reasoning Distillation Engine', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Captures Claude reasoning, distills patterns, and reduces API costs.', fullText: 'The Reasoning Distillation Engine captures Claude reasoning traces during task execution. Patterns are distilled from successful executions. Internal reasoning models are built from distilled patterns. Cost reduction targets: 50% at initial capture, 85% with pattern matching, 90% with full distillation. Target API cost reduction is 80% through pattern reuse instead of fresh reasoning for known scenarios.' },
  { id: 'EDU-006', title: 'Law Library Knowledge System', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'In-database markdown law library: versioned, searchable, used by AI and agents.', fullText: 'The Law Library stores all doctrine documents as versioned markdown in the database. Documents are extracted, indexed, and made searchable. AI and agents reference the law library as shared truth. Version history tracks all changes. The LawLibraryEngine provides access, search, and governance. 34 stages indexed across 15 domain groups with priority hierarchy.' },
  { id: 'EDU-007', title: 'Growth Engine', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Autonomous knowledge capture, pattern detection, and self-improvement loop.', fullText: 'The Growth Engine (Stage 15) provides autonomous knowledge capture from all system operations. Pattern detection identifies recurring successful strategies and common failures. Playbook promotion codifies patterns into reusable procedures. Automation candidates are identified and implemented. The self-improvement loop continuously optimizes system performance. Growth metrics track the rate and quality of system learning.' },
  { id: 'EDU-008', title: 'Enrollment & Progress Tracking', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Student enrollment management with completion tracking and certificate generation.', fullText: 'Enrollment management handles student registration, payment, access provisioning, and progress tracking. Completion rates are monitored at lesson, module, and program levels. Certificate generation produces verifiable credentials upon program completion. Progress notifications keep students engaged. Inactive student re-engagement sequences trigger automatically.' },
  { id: 'EDU-009', title: 'Content Delivery System', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Multi-format content delivery with text, video, audio, and interactive assessments.', fullText: 'Educational content delivery supports multiple formats: rich text with embedded media, video lessons with progress tracking, audio content for mobile learning, interactive assessments with auto-grading, and downloadable resources. Content is versioned and can be updated without disrupting active enrollments. Analytics track which content formats drive the best outcomes.' },
  { id: 'EDU-010', title: 'Certification & Credentials', category: 'Education', version: '1.0.0', dateAdded: '2026-01-25', summary: 'Verifiable certificates with blockchain-style verification and sharing capabilities.', fullText: 'The certification system generates verifiable credentials upon program completion. Each certificate includes a unique verification code that can be checked through a public verification endpoint. Certificates can be shared on social media and professional networks. Credential validity can have expiration dates requiring recertification. Certificate templates are customizable per tenant and program.' },

  // ── Autonomous (10) ──
  { id: 'AUT-001', title: 'Elastic Agent Orchestration', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'Max Agent Theory: 3-layer orchestration with core, domain, and swarm agents.', fullText: 'Elastic agent orchestration implements Max Agent Theory with 3 layers: core agents (always running, system-critical), domain agents (department specialists), and swarm agents (burst capacity for high-demand tasks). The agent registry tracks all active instances. Health monitoring ensures agent availability. Spawn rules govern when new agents are created. Concurrency governance prevents resource exhaustion.' },
  { id: 'AUT-002', title: 'Agent Factory', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: '13 agent pools, 6-step creation pipeline, batch spawn, and auto-scale from queues.', fullText: 'The Agent Factory manufactures agents across 13 pools using a 6-step creation pipeline: template selection, configuration, initialization, education, validation, and deployment. Batch spawn enables rapid scaling. Auto-scale triggers from queue depths ensure capacity meets demand. Supervision hierarchy maintains quality. Performance tracking identifies underperformers for replacement. Workforce learning improves factory output over time.' },
  { id: 'AUT-003', title: 'Global Task Grid', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'Hyper-parallel execution with 7 lifecycle states, 11 department queues, and load balancing.', fullText: 'The Global Task Grid provides hyper-parallel execution across 11 department queues. Tasks flow through 7 lifecycle states: pending, assigned, running, paused, completed, failed, and cancelled. 7 task types and 4 priority levels enable precise scheduling. Batch submission handles bulk operations. Load balancing distributes work evenly. Dependency tracking manages task chains. Retry with escalation handles failures. Throttle protection prevents overload.' },
  { id: 'AUT-004', title: 'Patrol Grid System', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'System nervous system: 20 domains, 5 agent types, P0-P5 events, self-monitoring.', fullText: 'The Patrol Grid is the nervous system that feeds work to all agents. 20 patrol domains cover every system area. 5 agent types (sentinel, diagnostic, repair, validation, and observer) work together. Events are classified P0 (critical) through P5 (informational). 8 patrol layers provide comprehensive coverage. Synthetic journeys simulate user flows to detect issues proactively. The grid monitors itself, ensuring patrol coverage never drops below thresholds.' },
  { id: 'AUT-005', title: 'Sensor Grid', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: '6 sensor categories monitoring system, user, infrastructure, market, security, and comms.', fullText: 'The Sensor Grid provides system awareness through 6 sensor categories: system health, user behavior, infrastructure performance, market signals, security threats, and communication patterns. Signal priority levels determine routing to subsystems. Anomaly detection identifies unusual patterns. The awareness dashboard visualizes system state. Owner alerts notify of critical issues. Signal learning improves detection accuracy over time.' },
  { id: 'AUT-006', title: 'Decision Intelligence Layer', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'Rule-based, AI, and hybrid decision making with recommendations and transparency.', fullText: 'The Decision Intelligence Layer supports three decision modes: rule-based (deterministic), AI-powered (probabilistic), and hybrid (rules + AI). Recommendations include confidence scores and reasoning. Predictive insights anticipate future states. Decision transparency logs all factors considered and weights applied. This enables audit trails and continuous improvement of decision quality.' },
  { id: 'AUT-007', title: 'DeployOps Autonomous Engineering', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'Self-healing agent mesh with deployment pipeline, failure learning, and validation.', fullText: 'DeployOps provides autonomous engineering through a self-healing agent mesh. The deployment pipeline handles build, test, deploy, and verify stages. Failure learning captures root causes and builds repair patterns. Agent forging creates specialized deployment agents. The validation mesh runs comprehensive checks before and after deployment. Predictive safety prevents known failure patterns from recurring.' },
  { id: 'AUT-008', title: 'Self-Deployment Grid', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'Continuous build system with 7-step pipeline and autonomous infrastructure expansion.', fullText: 'The Self-Deployment Grid manages continuous builds through a 7-step pipeline: detect changes, build, test, stage, deploy, verify, and learn. 5 deployment sources trigger builds: code changes, configuration updates, doctrine changes, agent requests, and scheduled maintenance. 6 infrastructure types are managed: compute, storage, networking, security, monitoring, and backup. Autonomous infrastructure expansion handles capacity needs.' },
  { id: 'AUT-009', title: 'Resilience Engine', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: '6 failure types, self-healing, incident tracking, circuit breakers, and stress testing.', fullText: 'The Resilience Engine handles 6 failure types with automated health checks and 8 repair actions. 4 incident severity levels trigger appropriate responses. Isolation actions contain failures. Queue overload signals trigger throttling responses. Network resilience handles connectivity issues. Redundancy strategies ensure no single point of failure. Stress tests validate system limits. Human alert triggers escalate when automated repair fails.' },
  { id: 'AUT-010', title: 'Universe Expansion Protocol', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-01', summary: 'Multi-platform deployment and ecosystem replication across 5 expansion types.', fullText: 'The Universe Expansion Protocol manages growth across 5 types: vertical (deeper in existing markets), horizontal (new markets), geographic (new regions), technology (new platforms), and partnership (ecosystem expansion). A 7-step expansion sequence handles opportunity identification, proposal, approval, planning, execution, validation, and optimization. 5 replication components standardize expansion: infrastructure, agents, content, integrations, and governance.' },

  // ── Spawns (10) ──
  { id: 'SPN-001', title: 'Agent Workforce Architecture', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: 'Melli as CPU, 7 pools, 6 agent classes, launch topology 12-15 scaling to 400.', fullText: 'The Agent Workforce Architecture positions Melli as the CPU with agents as processor cores. 7 agent pools cover all system areas. 6 agent classes (sentinel, worker, specialist, coordinator, manager, and executive) provide hierarchical capability. Launch topology starts with 12-15 agents and scales to 400 based on demand. Deployment agents handle infrastructure operations. Patrol frequency ensures continuous monitoring. Heartbeat monitoring detects agent failures.' },
  { id: 'SPN-002', title: 'Power + Spawn Test', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: '9 golden test tasks, 110 agent floor with 20% standby reserve, 10 test phases.', fullText: 'The Power + Spawn Test validates system readiness through 9 golden test tasks covering all critical functions. The activation floor requires 110 agents across 11 departments with a 20% standby reserve. 10 test phases progressively validate capabilities. 12 pass conditions must all be met for power-on certification. This test is the gateway between bootstrap and production operation.' },
  { id: 'SPN-003', title: 'Max Execution Law', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: 'Speed doctrine with 10-level hierarchy, 13 speed metrics, and scale comfort to 20000+.', fullText: 'The Max Execution Law establishes speed as a core doctrine. A 10-level speed hierarchy ranks operations from instant (sub-millisecond) to scheduled (hours). 10 bottleneck areas are identified and mitigated. 13 speed metrics track performance. Anti-laws prevent slowdown patterns. Scale comfort extends to 20,000+ simultaneous workers. Doctrine override favors aggressive throughput when speed and safety conflict.' },
  { id: 'SPN-004', title: 'Multi-Key Claude Parallel Execution', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: 'Every API key is an independent lane with simultaneous execution and weighted distribution.', fullText: 'Multi-Key execution treats every Claude API key as an independent processing lane. All lanes operate simultaneously with no sequential dependencies. Capacity-weighted distribution assigns tasks based on lane capability. 4 tiers categorize lane power. Cooldown rules prevent rate limiting. Anti-patterns are identified and blocked. The parallel reasoning grid enables complex tasks to be decomposed across multiple lanes.' },
  { id: 'SPN-005', title: 'Lane Autoscaling Law', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: 'Adaptive capacity probing every 30s with weighted distribution formula.', fullText: 'Lane autoscaling probes capacity every 30 seconds. 4 tier boot estimates with weight multipliers determine lane power. The weighted distribution formula (capacity*0.45 + rpm*0.35 + health*0.20) allocates tasks optimally. Small lane protection (tier1=0.25x) prevents overloading low-capacity lanes. Circuit breaker triggers at 20% failure rate. Probe cooldown activates on 429 (rate limit) responses.' },
  { id: 'SPN-006', title: 'Worker Pool Management', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: '11 instance states, 5 capacity classes, 7 staffing modes, and 3 reset types.', fullText: 'Worker Pool Management defines 11 instance states (creating, initializing, idle, assigned, working, paused, error, recovering, draining, terminating, terminated). 5 capacity classes size pools from minimal to massive. 7 staffing modes handle different demand patterns. 3 reset types (soft, hard, factory) recover problematic workers. Pool reservations hold capacity for anticipated demand. Backfill strategies replace failed workers. Replacement procedures handle underperformers.' },
  { id: 'SPN-007', title: 'Task Decomposition Engine', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: '14 decomposition objects, 7 conditions, 6 fanout types for parallel task splitting.', fullText: 'The Task Decomposition Engine breaks complex tasks into parallel sub-tasks. 14 decomposition objects define how tasks are structured. 7 decompose conditions determine when splitting is needed. 6 skip conditions prevent unnecessary decomposition. 6 fanout types (broadcast, scatter, pipeline, conditional, recursive, adaptive) handle different task patterns. Authority levels control who can decompose tasks. FanoutPlan and BranchSpec interfaces standardize decomposition.' },
  { id: 'SPN-008', title: 'Agent Role Specialization', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: '80+ agent roles mapping to real business roles with conversation-based routing.', fullText: '80+ agent roles map to real business functions: sales, reception, marketing, customer service, credit analysis, underwriting, compliance, accounting, and more. Conversations determine routing to the appropriate specialist. Sub-agents provide deeper specialization within roles. Role definitions include capabilities, knowledge requirements, and escalation paths. Agent assignment considers current workload and expertise match.' },
  { id: 'SPN-009', title: 'Seven Section Agent Teams', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: '7 dedicated teams (MUA, Workstation, Workflows, Onliflow, Admin, API, Workers).', fullText: 'The system organizes agents into 7 section teams: MUA (AI operations), Workstation (UI/UX), Workflows (business automation), Onliflow (orchestration), Admin (system management), API (backend services), and Workers (queue processing). Each team has its own deployment lane, validation procedures, repair capabilities, and observability dashboards. Teams coordinate through the event bus for cross-cutting concerns.' },
  { id: 'SPN-010', title: 'Sub-Agent Micro Task Model', category: 'Spawns', version: '1.0.0', dateAdded: '2026-02-10', summary: 'One lead agent per category with 20 idle reserve sub-agents for swarm execution.', fullText: 'Each major task category has one lead agent coordinating work, with 20 idle reserve sub-agents ready for swarm execution. When a complex task arrives, the lead agent decomposes it and dispatches micro-tasks to sub-agents simultaneously. This model maximizes parallelism and minimizes latency. Reserve agents maintain readiness through periodic heartbeats and education updates.' },

  // ── Directives (10) ──
  { id: 'DIR-001', title: 'Deployment Guardrails', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: '13 guardrails: no architecture redesign, build in layers, production stability first.', fullText: 'The 13 deployment guardrails protect system stability: no architecture redesign during deployment, no conceptual-only systems, build in layers from foundation up, production stability is the top priority, no fake parallelism (real concurrent execution only), observability is mandatory for all deployments, implementation mode (build real things), test before deploy, rollback capability required, incremental changes preferred, feature flags for risky changes, deployment windows for non-urgent changes, and post-deploy verification.' },
  { id: 'DIR-002', title: 'Post-Launch Directive', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: '9 activation tasks, 9 core systems, 7 rules for post-launch operations.', fullText: 'The Phase 2 Post-Launch Directive defines 9 activation tasks: orb activation, session management, task dispatch, agent deployment, patrol grid activation, deployment pipeline, system stabilization, monitoring activation, and production readiness certification. 9 core systems must be operational. 7 rules govern post-launch behavior: no redesign, activate existing systems, fix before building new, monitor everything, use existing agents, deploy incrementally, and verify continuously.' },
  { id: 'DIR-003', title: 'Max Parallel Agent Directive', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Always use maximum parallel agents; 40 small agents beat 4 big agents.', fullText: 'The Max Parallel Agent Directive mandates using the maximum number of parallel agents for all work. 40 small focused agents are always preferred over 4 large general agents. One file per agent, one concern per agent. Sequential debugging is forbidden for systemic issues — use 10+ parallel agents instead. This applies to all work types: code, testing, deployment, monitoring, and repair. Agents ARE CPU cores and should be flooded like processors.' },
  { id: 'DIR-004', title: 'Melli Operator Directive', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Conversational SMS mode, short responses, escalate uncertainty, learn through conversation.', fullText: 'The Melli Operator Directive establishes Melli operating mode for SMS and voice interactions. Responses must be conversational and short (no walls of text). Uncertainty triggers escalation rather than guessing. Every conversation trains the system. Melli classifies messages across 10 categories and 10 intents. Scoring models track session quality. Misuse detection catches inappropriate content. Flow modes (public, admin, strict, system_action) adjust behavior by context.' },
  { id: 'DIR-005', title: 'Dev Then Deploy Rule', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Work in dev, fix everything, then one clean build+deploy with zero errors.', fullText: 'All development follows the Dev Then Deploy rule: work in the development environment, fix all issues including tests, type errors, and lint warnings, then perform one clean build and deployment with zero errors. No deploying known-broken code. No "fix in production" mentality. The build must pass all checks before deployment begins. This ensures production stability and reduces rollback frequency.' },
  { id: 'DIR-006', title: 'All Agents Read AND Write', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Every agent role must be capable of both reading and writing; no manual review logging.', fullText: 'Every agent role in the system must have both read AND write capabilities. The phrase "logged for manual review" is forbidden — if something needs action, an agent must take that action. Read-only agents are not permitted in production. This ensures the system is fully autonomous and no tasks fall into a void where they are merely observed but never acted upon.' },
  { id: 'DIR-007', title: 'Agents Own Deploy Process', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Agents own the entire deploy pipeline from build through production verification.', fullText: 'Agents own the entire deployment pipeline. Every issue that arises during deployment becomes a handler that agents process. Agents monitor deployments until confirmed live and healthy. No human intervention in the deploy loop after bootstrap. Build, test, deploy, verify, and rollback are all agent-driven operations. Deploy watcher agents poll every 10 seconds with build marker verification.' },
  { id: 'DIR-008', title: 'Search Before Guessing', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Always search web/GitHub for deployment issues before attempting fixes.', fullText: 'When deployment or infrastructure issues arise, the first action must be searching the web and GitHub for known solutions. Guessing at fixes wastes time and can create new problems. Search sources include: Railway documentation, GitHub issues, Stack Overflow, framework documentation, and internal knowledge base. Only after research should repair actions be attempted.' },
  { id: 'DIR-009', title: 'Build Agents for Gaps', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Stop and build agents for every gap found; never work around missing agents.', fullText: 'When a gap in agent coverage is discovered, the immediate action is to stop and build agents to fill that gap. Never work around missing agents with manual processes. Every gap is a signal that the system needs expansion. New agents are created through the Agent Factory using role templates, educated through the Knowledge System, and deployed through the standard pipeline.' },
  { id: 'DIR-010', title: 'Monitor Claude Usage', category: 'Directives', version: '1.0.0', dateAdded: '2026-02-15', summary: 'Always check Claude account usage before launching agent batches to prevent cost overruns.', fullText: 'Before launching any batch of agents that will consume Claude API credits, the system must check current account usage. A wrong-account incident previously cost $300. Lane monitoring tracks consumption per API key. Tier tracking ensures operations stay within budget. Bulk processing prefers API over subscription for cost efficiency. Usage dashboards provide real-time visibility into AI costs.' },

  // ── Additional laws to reach 105 total ──
  { id: 'CON-021', title: 'Compliance & Legal Governance', category: 'Constitution', version: '1.0.0', dateAdded: '2026-02-20', summary: '5 trust principles, 6 compliance domains, consent management, and audit trails.', fullText: 'Trust, Compliance, and Legal Governance establishes 5 trust principles and 6 compliance domains. Financial compliance, privacy compliance, and marketing compliance are enforced through automated checks. Consent management tracks opt-ins and opt-outs. Risk detection identifies potential compliance violations. Audit trails record all system actions. Affiliate disclosures are automatically applied. Trust metrics measure system integrity.' },
  { id: 'INF-016', title: 'Twilio Phone Routing', category: 'Infrastructure', version: '1.0.0', dateAdded: '2026-02-20', summary: 'All Twilio webhooks must point to phone.memelli.com.', fullText: 'All Twilio webhook configurations must route to phone.memelli.com. This ensures consistent handling of voice calls, SMS messages, and status callbacks. The phone subdomain is dedicated to telephony operations and integrates with the Communication Fabric for omnichannel message handling. Webhook verification validates incoming requests from Twilio.' },
  { id: 'AUT-011', title: 'Time Engine', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-20', summary: 'Temporal orchestration with 6-step lifecycle, 5 event types, and missed-event recovery.', fullText: 'The Time Engine provides temporal orchestration through a 6-step lifecycle. 5 event types (scheduled, recurring, delayed, alert, maintenance) handle all timing needs. 7 recurring intervals support various schedules. The temporal queue uses Redis sorted sets for efficient scheduling. Due-event processing ensures timely execution. Missed-event recovery handles events that were not processed on time. Timing accuracy is tracked as a system health metric.' },
  { id: 'AUT-012', title: 'Energy Model', category: 'Autonomous', version: '1.0.0', dateAdded: '2026-02-20', summary: 'Resource governance with 5 categories, priority tiers, and per-agent compute budgets.', fullText: 'The Energy Model governs compute resource allocation across 5 categories. A 5-phase energy lifecycle manages allocation from request through release. 4 priority tiers determine resource access. Throttle mechanisms prevent overconsumption. Scaling options handle demand spikes. Failure prevention signals warn before exhaustion. Protected resources ensure critical operations always have capacity. Per-agent budgets and department limits maintain fairness.' },
  { id: 'WEB-011', title: 'AI Homepage Experience', category: 'Web', version: '1.0.0', dateAdded: '2026-02-20', summary: 'AI OS landing page with feature wheel, neural animations, and chat-first interface.', fullText: 'The homepage presents the Memelli Universe as an AI operating system. A feature wheel showcases platform capabilities. Neural animations provide a futuristic aesthetic. Chat is the primary interface for visitor engagement. Dark futuristic design establishes brand identity. The capability grid maps features to user needs. Every visitor interaction feeds the CRM and triggers appropriate workflow responses.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LawLibraryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<LawCategory | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /* ── Filtering + sorting ── */
  const filtered = useMemo(() => {
    let laws = SYSTEM_LAWS;

    // category filter
    if (activeCategory !== 'all') {
      laws = laws.filter((l) => l.category === activeCategory);
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      laws = laws.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.summary.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.fullText.toLowerCase().includes(q),
      );
    }

    // sort
    laws = [...laws].sort((a, b) => {
      if (sortField === 'name') {
        return sortDir === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return sortDir === 'asc'
        ? a.dateAdded.localeCompare(b.dateAdded)
        : b.dateAdded.localeCompare(a.dateAdded);
    });

    return laws;
  }, [search, activeCategory, sortField, sortDir]);

  /* ── Category counts ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SYSTEM_LAWS.length };
    for (const cat of ALL_CATEGORIES) counts[cat] = 0;
    for (const law of SYSTEM_LAWS) counts[law.category]++;
    return counts;
  }, []);

  /* ── Toggle sort ── */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[hsl(var(--foreground))] p-4 md:p-8">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#E11D2E]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#E11D2E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Law Library</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              System Doctrine &middot; {SYSTEM_LAWS.length} Laws Indexed
            </p>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard label="Total Laws" value={SYSTEM_LAWS.length} icon={BookOpen} />
          <StatCard label="Categories" value={ALL_CATEGORIES.length} icon={Tag} />
          <StatCard label="Showing" value={filtered.length} icon={Hash} />
          <StatCard label="Latest Version" value="1.0.0" icon={Calendar} isText />
        </div>

        {/* ── Search + Controls ── */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          {/* search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search laws by title, ID, or content..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[#E11D2E]/50 focus:ring-1 focus:ring-[#E11D2E]/30 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* filter toggle */}
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || activeCategory !== 'all'
                ? 'bg-[#E11D2E]/10 border-[#E11D2E]/40 text-[#E11D2E]'
                : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeCategory !== 'all' && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-[#E11D2E]/20">1</span>
            )}
          </button>

          {/* sort buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => toggleSort('name')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                sortField === 'name'
                  ? 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
                  : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {sortField === 'name' && <SortIcon className="w-3.5 h-3.5" />}
              Name
            </button>
            <button
              onClick={() => toggleSort('date')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                sortField === 'date'
                  ? 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
                  : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {sortField === 'date' && <SortIcon className="w-3.5 h-3.5" />}
              Date
            </button>
          </div>
        </div>

        {/* ── Category Filter Pills ── */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 p-4 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <CategoryPill
              label="All"
              count={categoryCounts.all}
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              color="#E11D2E"
            />
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <CategoryPill
                  key={cat}
                  label={cat}
                  count={categoryCounts[cat]}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  color={meta.color}
                  Icon={meta.icon}
                />
              );
            })}
          </div>
        )}

        {/* ── Results Count ── */}
        <div className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          {filtered.length === SYSTEM_LAWS.length
            ? `Showing all ${filtered.length} laws`
            : `${filtered.length} of ${SYSTEM_LAWS.length} laws`}
          {activeCategory !== 'all' && (
            <span>
              {' '}
              in{' '}
              <span className="text-[hsl(var(--foreground))]">{activeCategory}</span>
              <button
                onClick={() => setActiveCategory('all')}
                className="ml-1.5 text-[#E11D2E] hover:underline"
              >
                clear
              </button>
            </span>
          )}
        </div>

        {/* ── Law Cards ── */}
        <div className="mt-4 space-y-2">
          {filtered.length === 0 && (
            <div className="py-20 text-center text-[hsl(var(--muted-foreground))]">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No laws match your search.</p>
            </div>
          )}

          {filtered.map((law) => {
            const isExpanded = expandedId === law.id;
            const meta = CATEGORY_META[law.category];
            const Icon = meta.icon;

            return (
              <button
                key={law.id}
                onClick={() => setExpandedId(isExpanded ? null : law.id)}
                className="w-full text-left rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--card))] transition-colors"
              >
                <div className="flex items-start gap-3 p-4">
                  {/* icon */}
                  <div
                    className="mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{law.id}</span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${meta.color}20`,
                          color: meta.color,
                        }}
                      >
                        {law.category}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">v{law.version}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-[hsl(var(--foreground))] leading-snug">
                      {law.title}
                    </h3>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
                      {law.summary}
                    </p>

                    {/* expanded */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed whitespace-pre-wrap">
                          {law.fullText}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-[10px] text-[hsl(var(--muted-foreground))]">
                          <span>Added: {law.dateAdded}</span>
                          <span>Version: {law.version}</span>
                          <span>Category: {law.category}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* expand chevron */}
                  <div className="mt-1 shrink-0 text-[hsl(var(--muted-foreground))]">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  icon: Icon,
  isText,
}: {
  label: string;
  value: number | string;
  icon: typeof BookOpen;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
      <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`${isText ? 'text-lg' : 'text-2xl'} font-bold text-[hsl(var(--foreground))]`}>
        {value}
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
  color,
  Icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
  Icon?: typeof Scale;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? 'border-opacity-60 text-[hsl(var(--foreground))]'
          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'
      }`}
      style={
        active
          ? { backgroundColor: `${color}20`, borderColor: `${color}60`, color }
          : undefined
      }
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      <span className={`ml-0.5 ${active ? 'opacity-80' : 'text-[hsl(var(--muted-foreground))]'}`}>({count})</span>
    </button>
  );
}

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Building2,
  BarChart3,
  Bot,
  Users,
  Contact,
  Mic,
  Mail,
  Cpu,
  Link2,
  Workflow,
  LineChart,
  Search,
  FileText,
  Sparkles,
  X,
  MessageCircle,
  Zap,
  Globe,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface FeatureWheelProps {
  onAskAI?: (feature: string, suggestedPrompts?: string[], moduleKey?: string) => void;
}

type Tier = 'center' | 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';

interface FeatureNode {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
  bullets: string[];
  cta: string;
  suggestedPrompts: string[];
  tier: Tier;
  related: string[];
  /** Maps to backend MODULE_MAP key in mua-controller */
  moduleKey: string;
}

// ────────────────────────────────────────────────────────────
// Cluster definitions
// ────────────────────────────────────────────────────────────

const CLUSTERS: Record<string, string[]> = {
  financial_core: ['credit', 'funding', 'business_credit', 'tradelines', 'application_automation'],
  ai_core: ['ai_conversations', 'ai_automation', 'ai_agents', 'voice_ai', 'text_email'],
  system_ops: ['crm', 'workflow_automation', 'document_automation', 'analytics'],
  growth: ['lead_generation', 'affiliate_system', 'seo_tools', 'business_formation', 'opportunity_engine'],
};

// ────────────────────────────────────────────────────────────
// Content map (center + 19 outer nodes = 20 total)
// ────────────────────────────────────────────────────────────

const CENTER_NODE: FeatureNode = {
  id: 'memelli_os',
  label: 'Memelli OS',
  subtitle: 'AI Operating System',
  icon: Zap,
  description:
    'An AI-powered operating system that connects funding, credit, automation, communication, lead systems, workflows, and business tools into one intelligent platform.',
  bullets: [
    'Unified command layer across every business function',
    'AI-first architecture — every tool is AI-native',
    'Single login, single dashboard, infinite capability',
    'Real-time analytics across all connected engines',
    'Scales from solo founder to enterprise team',
  ],
  cta: 'Ask the AI what Memelli OS can do',
  suggestedPrompts: [
    'What can Memelli OS do for my business?',
    'Show me everything connected to Memelli OS',
    'How does the AI operating system work?',
  ],
  tier: 'center',
  related: [],
  moduleKey: 'dashboard',
};

const FEATURES: FeatureNode[] = [
  // ── Tier 1 ────────────────────────────────────────────────
  {
    id: 'credit',
    label: 'Credit',
    subtitle: 'Credit Intelligence',
    icon: CreditCard,
    description:
      'Memelli helps users understand what is affecting approval potential, identify next steps, and move toward stronger funding readiness.',
    bullets: [
      'Credit guidance tailored to your profile',
      'Profile review logic that highlights key factors',
      'Readiness insights before you apply',
      'Next-step support to keep momentum',
      'Application path awareness for smarter decisions',
    ],
    cta: 'Ask the AI about credit',
    suggestedPrompts: [
      'Help me understand my credit position',
      'What steps improve my approval odds?',
      'Review my credit readiness',
    ],
    tier: 'tier_1',
    related: ['funding', 'tradelines', 'business_credit', 'application_automation'],
    moduleKey: 'credit',
  },
  {
    id: 'funding',
    label: 'Funding',
    subtitle: 'Funding Engine',
    icon: DollarSign,
    description:
      'Memelli helps users explore possible funding paths, understand requirements, and move into guided next steps faster.',
    bullets: [
      'Personal funding paths mapped to your profile',
      'Business funding pathways with clear requirements',
      'Guided qualification to maximize approval',
      'Application support through every step',
      'Next-step automation to keep you moving',
    ],
    cta: 'Ask the AI about funding',
    suggestedPrompts: [
      'Show me funding options',
      'Help me understand qualification',
      'Start with business funding',
    ],
    tier: 'tier_1',
    related: ['credit', 'business_credit', 'application_automation', 'crm', 'ai_conversations'],
    moduleKey: 'credit',
  },

  // ── Tier 2 ────────────────────────────────────────────────
  {
    id: 'business_credit',
    label: 'Business Credit',
    subtitle: 'Business Credit Builder',
    icon: Building2,
    description:
      'Build business credit strategically with AI-guided steps, vendor account recommendations, and milestone tracking that keeps you on the fastest path to fundability.',
    bullets: [
      'Step-by-step business credit building roadmap',
      'Vendor account recommendations matched to your profile',
      'Milestone tracking with automated next steps',
      'Separation of personal and business credit guidance',
      'Fundability score monitoring and improvement',
    ],
    cta: 'Ask the AI about business credit',
    suggestedPrompts: [
      'How do I start building business credit?',
      'What vendors report to business bureaus?',
      'Show my business credit roadmap',
    ],
    tier: 'tier_2',
    related: ['funding', 'credit', 'business_formation', 'crm'],
    moduleKey: 'credit',
  },
  {
    id: 'tradelines',
    label: 'Tradelines',
    subtitle: 'Tradeline Solutions',
    icon: BarChart3,
    description:
      'Strategic tradeline recommendations that boost credit profiles faster by analyzing which accounts, ages, and limits create the most impact for your goals.',
    bullets: [
      'AI-matched tradeline recommendations',
      'Impact analysis before you commit',
      'Age and limit optimization strategies',
      'Portfolio balance monitoring',
      'Timing guidance for maximum score effect',
    ],
    cta: 'Ask the AI about tradelines',
    suggestedPrompts: [
      'What tradelines would help me most?',
      'Analyze my tradeline portfolio',
      'Show tradeline impact projections',
    ],
    tier: 'tier_2',
    related: ['credit', 'funding', 'analytics', 'ai_conversations'],
    moduleKey: 'credit',
  },
  {
    id: 'ai_conversations',
    label: 'AI Conversations',
    subtitle: 'AI Conversation Engine',
    icon: MessageCircle,
    description:
      'Start with a conversation and let the AI guide the rest. Natural language interactions that understand context, remember history, and route you to the right system automatically.',
    bullets: [
      'Natural language understanding for any business question',
      'Context-aware responses that remember your history',
      'Automatic routing to the right engine or agent',
      'Voice and text input supported',
      'Continuous learning from every interaction',
    ],
    cta: 'Talk to the AI now',
    suggestedPrompts: [
      'What can I ask the AI?',
      'Start a guided conversation',
      'Help me with my next business step',
    ],
    tier: 'tier_2',
    related: ['funding', 'credit', 'voice_ai', 'text_email', 'crm'],
    moduleKey: 'ai',
  },
  {
    id: 'application_automation',
    label: 'Application Automation',
    subtitle: 'Application Automation',
    icon: FileText,
    description:
      'Automate the entire application lifecycle from document gathering to submission, tracking, and follow-up — reducing errors and accelerating approvals.',
    bullets: [
      'Automated document collection and verification',
      'Pre-filled applications from your profile data',
      'Submission tracking with real-time status updates',
      'Follow-up automation for pending applications',
      'Error detection before submission',
    ],
    cta: 'Ask the AI about application automation',
    suggestedPrompts: [
      'Automate my next application',
      'Track my pending applications',
      'What documents do I need?',
    ],
    tier: 'tier_2',
    related: ['funding', 'credit', 'document_automation', 'crm'],
    moduleKey: 'documents',
  },
  {
    id: 'crm',
    label: 'CRM',
    subtitle: 'CRM Automation',
    icon: Contact,
    description:
      'Full customer relationship management with AI-powered pipeline tracking, automated follow-ups, and intelligent lead scoring that keeps your sales engine running.',
    bullets: [
      'AI-scored leads with priority rankings',
      'Automated pipeline management and stage tracking',
      'Smart follow-up sequences triggered by behavior',
      'Contact enrichment from multiple data sources',
      'Revenue forecasting with AI predictions',
    ],
    cta: 'Ask the AI about CRM',
    suggestedPrompts: [
      'Show me my sales pipeline',
      'Who should I follow up with today?',
      'Analyze my conversion rates',
    ],
    tier: 'tier_2',
    related: ['ai_conversations', 'funding', 'lead_generation', 'analytics', 'text_email'],
    moduleKey: 'crm',
  },

  // ── Tier 3 ────────────────────────────────────────────────
  {
    id: 'ai_automation',
    label: 'AI Automation',
    subtitle: 'AI Automation Engine',
    icon: Bot,
    description:
      'Automate repetitive business tasks with intelligent AI workflows that learn from your patterns, reduce manual work, and execute multi-step processes autonomously.',
    bullets: [
      'Pattern-learning automation that improves over time',
      'Multi-step workflow execution without manual intervention',
      'Trigger-based actions across all connected systems',
      'Error handling and automatic retry logic',
      'Performance analytics on every automated process',
    ],
    cta: 'Ask the AI about automation',
    suggestedPrompts: [
      'What can I automate?',
      'Show me active automations',
      'Create a new automation workflow',
    ],
    tier: 'tier_3',
    related: ['workflow_automation', 'ai_agents', 'crm', 'text_email'],
    moduleKey: 'workflows',
  },
  {
    id: 'voice_ai',
    label: 'Voice AI',
    subtitle: 'Voice AI Assistant',
    icon: Mic,
    description:
      'Natural voice interactions powered by advanced AI for calls, support, and hands-free operation. Speak naturally and let the system handle the rest.',
    bullets: [
      'Natural voice commands for any system action',
      'AI-powered call handling and routing',
      'Voice-to-action conversion in real time',
      'Multi-language support with accent adaptation',
      'Call transcription and summary generation',
    ],
    cta: 'Ask the AI about Voice AI',
    suggestedPrompts: [
      'Set up voice AI for my business',
      'How does voice calling work?',
      'Enable hands-free mode',
    ],
    tier: 'tier_3',
    related: ['ai_conversations', 'text_email', 'workflow_automation', 'crm'],
    moduleKey: 'communications',
  },
  {
    id: 'text_email',
    label: 'Text + Email',
    subtitle: 'Text & Email Engine',
    icon: Mail,
    description:
      'Intelligent messaging across SMS and email with AI-composed content, smart scheduling, behavioral triggers, and unified inbox management.',
    bullets: [
      'AI-composed messages tailored to each contact',
      'Smart send-time optimization for maximum opens',
      'Behavioral trigger sequences that convert',
      'Unified inbox across SMS and email',
      'A/B testing with AI-recommended winners',
    ],
    cta: 'Ask the AI about messaging',
    suggestedPrompts: [
      'Draft an email campaign',
      'Set up an SMS follow-up sequence',
      'Show messaging analytics',
    ],
    tier: 'tier_3',
    related: ['ai_conversations', 'voice_ai', 'crm', 'workflow_automation'],
    moduleKey: 'communications',
  },
  {
    id: 'lead_generation',
    label: 'Lead Generation',
    subtitle: 'Lead Generation Engine',
    icon: Users,
    description:
      'AI-driven lead discovery, scoring, and outreach automation that finds your ideal prospects, ranks them by likelihood to convert, and starts conversations automatically.',
    bullets: [
      'AI prospect discovery from multiple data sources',
      'Lead scoring based on fit and intent signals',
      'Automated outreach sequences with personalization',
      'Real-time lead alerts for high-value prospects',
      'Attribution tracking across all channels',
    ],
    cta: 'Ask the AI about lead generation',
    suggestedPrompts: [
      'Find me new leads',
      'Show my highest-scored prospects',
      'Set up automated outreach',
    ],
    tier: 'tier_3',
    related: ['crm', 'ai_conversations', 'analytics', 'affiliate_system'],
    moduleKey: 'leads',
  },
  {
    id: 'workflow_automation',
    label: 'Workflow Automation',
    subtitle: 'Workflow Builder',
    icon: Workflow,
    description:
      'Visual workflow builder for complex multi-step business processes with drag-and-drop logic, conditional branching, and cross-system integrations.',
    bullets: [
      'Visual drag-and-drop workflow designer',
      'Conditional branching and decision logic',
      'Cross-system triggers and actions',
      'Version history and rollback capability',
      'Real-time execution monitoring',
    ],
    cta: 'Ask the AI about workflows',
    suggestedPrompts: [
      'Build a new workflow',
      'Show active workflows',
      'Optimize my existing processes',
    ],
    tier: 'tier_3',
    related: ['ai_automation', 'crm', 'application_automation', 'text_email', 'analytics'],
    moduleKey: 'workflows',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    subtitle: 'Analytics Dashboard',
    icon: LineChart,
    description:
      'Real-time analytics dashboards with AI-powered insights, trend detection, and predictive forecasting across every connected system.',
    bullets: [
      'Real-time dashboards across all engines',
      'AI-detected trends and anomalies',
      'Predictive forecasting with confidence scores',
      'Custom report builder with scheduled delivery',
      'Cross-system correlation analysis',
    ],
    cta: 'Ask the AI about analytics',
    suggestedPrompts: [
      'Show me my key metrics',
      'What trends should I know about?',
      'Generate a performance report',
    ],
    tier: 'tier_3',
    related: ['crm', 'funding', 'lead_generation', 'ai_automation'],
    moduleKey: 'analytics',
  },
  {
    id: 'document_automation',
    label: 'Document Automation',
    subtitle: 'Document Intelligence',
    icon: FileText,
    description:
      'Intelligent document processing, extraction, generation, and management. From contracts to applications, AI handles the paperwork.',
    bullets: [
      'AI document generation from templates',
      'Intelligent data extraction from uploads',
      'Version tracking and approval workflows',
      'E-signature integration and tracking',
      'Compliance checking before submission',
    ],
    cta: 'Ask the AI about documents',
    suggestedPrompts: [
      'Generate a document',
      'Extract data from an upload',
      'Track my document status',
    ],
    tier: 'tier_3',
    related: ['application_automation', 'crm', 'workflow_automation'],
    moduleKey: 'documents',
  },
  {
    id: 'ai_agents',
    label: 'AI Agents',
    subtitle: 'Autonomous AI Agents',
    icon: Cpu,
    description:
      'Autonomous AI agents that handle tasks, research, execution, and monitoring. Thousands of specialized agents working in parallel across your business.',
    bullets: [
      'Specialized agents for every business function',
      'Autonomous task execution and monitoring',
      'Parallel processing across thousands of agents',
      'Self-healing error correction and retry',
      'Agent pool scaling based on workload',
    ],
    cta: 'Ask the AI about agents',
    suggestedPrompts: [
      'What agents are available?',
      'Show active agent tasks',
      'Deploy agents for a new project',
    ],
    tier: 'tier_3',
    related: ['ai_automation', 'voice_ai', 'workflow_automation', 'analytics'],
    moduleKey: 'agents',
  },

  // ── Tier 4 ────────────────────────────────────────────────
  {
    id: 'affiliate_system',
    label: 'Affiliate System',
    subtitle: 'Affiliate & Partner Network',
    icon: Link2,
    description:
      'Built-in affiliate tracking, commission management, and partner network tools that turn your customers into your growth engine.',
    bullets: [
      'Automated commission tracking and payouts',
      'Partner portal with real-time performance stats',
      'Multi-tier affiliate program support',
      'Custom referral link generation',
      'Fraud detection and quality monitoring',
    ],
    cta: 'Ask the AI about affiliates',
    suggestedPrompts: [
      'Set up an affiliate program',
      'Show affiliate performance',
      'Configure commission tiers',
    ],
    tier: 'tier_4',
    related: ['lead_generation', 'crm', 'analytics'],
    moduleKey: 'affiliates',
  },
  {
    id: 'seo_tools',
    label: 'SEO Tools',
    subtitle: 'SEO & Content Engine',
    icon: Search,
    description:
      'AI-generated content, keyword tracking, and search ranking optimization that drives organic traffic to your business on autopilot.',
    bullets: [
      'AI-generated SEO-optimized articles',
      'Keyword cluster tracking and ranking',
      'Automated IndexNow submissions',
      'Competitor analysis and gap detection',
      'Content calendar with AI suggestions',
    ],
    cta: 'Ask the AI about SEO',
    suggestedPrompts: [
      'Generate SEO content',
      'Show my keyword rankings',
      'Find content opportunities',
    ],
    tier: 'tier_4',
    related: ['lead_generation', 'analytics', 'ai_automation'],
    moduleKey: 'seo',
  },
  {
    id: 'business_formation',
    label: 'Business Formation',
    subtitle: 'Business Formation Guide',
    icon: Briefcase,
    description:
      'Guided business entity formation with AI recommendations on structure, state selection, compliance requirements, and filing automation.',
    bullets: [
      'Entity type recommendation based on goals',
      'State-by-state comparison and selection',
      'Automated filing and registration support',
      'EIN acquisition guidance',
      'Ongoing compliance calendar and reminders',
    ],
    cta: 'Ask the AI about business formation',
    suggestedPrompts: [
      'Help me form a business entity',
      'What structure is best for me?',
      'Show compliance requirements',
    ],
    tier: 'tier_4',
    related: ['business_credit', 'funding', 'workflow_automation'],
    moduleKey: 'commerce',
  },
  {
    id: 'opportunity_engine',
    label: 'Opportunity Engine',
    subtitle: 'Opportunity Discovery',
    icon: Globe,
    description:
      'AI scans the market to surface funding opportunities, grants, contracts, and business openings matched to your profile and qualifications.',
    bullets: [
      'Automated opportunity scanning across databases',
      'Profile-matched recommendations with fit scores',
      'Grant and contract deadline tracking',
      'Application readiness assessment per opportunity',
      'Market trend alerts for emerging opportunities',
    ],
    cta: 'Ask the AI about opportunities',
    suggestedPrompts: [
      'Find opportunities for my business',
      'Show grants I qualify for',
      'Scan for new contracts',
    ],
    tier: 'tier_4',
    related: ['funding', 'business_credit', 'ai_automation', 'analytics', 'crm'],
    moduleKey: 'leads',
  },
];

// All outer nodes (excluding center)
const ALL_NODES = FEATURES;
const NODE_COUNT = ALL_NODES.length;
const RADIUS_PERCENT = 42;

// ────────────────────────────────────────────────────────────
// Tier config
// ────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, { size: string; iconSize: string; defaultOpacity: number; glowBorder: boolean; desktopSize: number }> = {
  center: { size: 'w-28 h-28', iconSize: 'h-8 w-8', defaultOpacity: 1, glowBorder: true, desktopSize: 80 },
  tier_1: { size: 'w-20 h-20', iconSize: 'h-7 w-7', defaultOpacity: 1, glowBorder: true, desktopSize: 72 },
  tier_2: { size: 'w-16 h-16', iconSize: 'h-6 w-6', defaultOpacity: 0.9, glowBorder: false, desktopSize: 60 },
  tier_3: { size: 'w-14 h-14', iconSize: 'h-5 w-5', defaultOpacity: 0.7, glowBorder: false, desktopSize: 52 },
  tier_4: { size: 'w-12 h-12', iconSize: 'h-4 w-4', defaultOpacity: 0.5, glowBorder: false, desktopSize: 44 },
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getClusterConnections(): [string, string][] {
  const edges: [string, string][] = [];
  const clusterArrays = Object.values(CLUSTERS);
  for (const members of clusterArrays) {
    for (let i = 0; i < members.length - 1; i++) {
      edges.push([members[i], members[i + 1]]);
    }
  }
  return edges;
}

function getNodePosition(index: number, total: number, radius: number, center: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: center + (radius / 100) * center * Math.cos(angle),
    y: center + (radius / 100) * center * Math.sin(angle),
  };
}

function isRelated(nodeId: string, targetId: string, nodes: FeatureNode[]): boolean {
  const node = nodes.find((n) => n.id === nodeId);
  return node?.related.includes(targetId) ?? false;
}

function getClusterForNode(nodeId: string): string | null {
  for (const [name, members] of Object.entries(CLUSTERS)) {
    if (members.includes(nodeId)) return name;
  }
  return null;
}

function isInSameCluster(a: string, b: string): boolean {
  const clusterA = getClusterForNode(a);
  const clusterB = getClusterForNode(b);
  return clusterA !== null && clusterA === clusterB;
}

// ────────────────────────────────────────────────────────────
// Sort nodes for mobile: tier 1 first, then 2, 3, 4
// ────────────────────────────────────────────────────────────

const TIER_ORDER: Record<Tier, number> = { center: 0, tier_1: 1, tier_2: 2, tier_3: 3, tier_4: 4 };
const MOBILE_SORTED = [...ALL_NODES].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function FeatureWheel({ onAskAI }: FeatureWheelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const activeId = hoveredId ?? selectedId;

  const selectedFeature = useMemo(() => {
    if (selectedId === 'memelli_os') return CENTER_NODE;
    return ALL_NODES.find((f) => f.id === selectedId) ?? null;
  }, [selectedId]);

  const clusterConnections = useMemo(() => getClusterConnections(), []);

  // Node positions for SVG
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    ALL_NODES.forEach((node, i) => {
      positions[node.id] = getNodePosition(i, NODE_COUNT, RADIUS_PERCENT, 350);
    });
    positions['memelli_os'] = { x: 350, y: 350 };
    return positions;
  }, []);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setHasInteracted(true);
  }, []);

  const handleNodeHover = useCallback((id: string | null) => {
    setHoveredId(id);
    if (id) setHasInteracted(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Pause rotation on selection
  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    el.style.animationPlayState = selectedId ? 'paused' : 'running';
  }, [selectedId]);

  // Compute node opacity
  const getNodeOpacity = useCallback(
    (node: FeatureNode): number => {
      const cfg = TIER_CONFIG[node.tier];
      if (!activeId) return cfg.defaultOpacity;

      // Active node always full
      if (node.id === activeId) return 1;

      // Related nodes brighten
      if (isRelated(activeId, node.id, ALL_NODES) || isRelated(node.id, activeId, ALL_NODES)) {
        return Math.max(cfg.defaultOpacity, 0.9);
      }

      // Same cluster brightens
      if (isInSameCluster(activeId, node.id)) {
        return Math.max(cfg.defaultOpacity, 0.8);
      }

      // Everything else dims
      return 0.3;
    },
    [activeId]
  );

  // Check if a connection line should be highlighted
  const isConnectionHighlighted = useCallback(
    (a: string, b: string): boolean => {
      if (!activeId) return false;
      return (
        a === activeId ||
        b === activeId ||
        (isInSameCluster(activeId, a) && isInSameCluster(activeId, b)) ||
        isRelated(activeId, a, ALL_NODES) ||
        isRelated(activeId, b, ALL_NODES)
      );
    },
    [activeId]
  );

  return (
    <section className="relative bg-[hsl(var(--background))] py-28 px-6 sm:py-36">
      <div className="mx-auto max-w-5xl">
        {/* Section heading */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            One platform.{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-300 bg-clip-text text-transparent">
              Infinite capability.
            </span>
          </h2>
          <p className="mt-5 text-[hsl(var(--muted-foreground))] text-lg max-w-xl mx-auto leading-relaxed">
            Every tool your business needs, connected through one AI-powered operating system.
          </p>
        </div>

        {/* ── Desktop wheel ──────────────────────────────── */}
        <div className="hidden md:block">
          <div className="relative aspect-square max-w-[700px] mx-auto">
            {/* SVG connecting lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 700 700"
            >
              {/* Center-to-node lines */}
              {ALL_NODES.map((node) => {
                const pos = nodePositions[node.id];
                const highlighted = activeId === node.id || activeId === 'memelli_os';
                const dimmed = activeId !== null && !highlighted;

                return (
                  <line
                    key={`center-${node.id}`}
                    x1={350}
                    y1={350}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={highlighted ? 'rgba(192,132,252,0.5)' : 'rgba(63,63,70,0.4)'}
                    strokeWidth={highlighted ? 1.5 : 0.75}
                    opacity={dimmed ? 0.15 : 1}
                    className="transition-all duration-500"
                  />
                );
              })}

              {/* Cluster connection lines */}
              {clusterConnections.map(([a, b]) => {
                const posA = nodePositions[a];
                const posB = nodePositions[b];
                if (!posA || !posB) return null;

                const highlighted = isConnectionHighlighted(a, b);
                const dimmed = activeId !== null && !highlighted;

                return (
                  <line
                    key={`cluster-${a}-${b}`}
                    x1={posA.x}
                    y1={posA.y}
                    x2={posB.x}
                    y2={posB.y}
                    stroke={highlighted ? 'rgba(192,132,252,0.6)' : 'rgba(63,63,70,0.25)'}
                    strokeWidth={highlighted ? 2 : 1}
                    opacity={dimmed ? 0.1 : 0.6}
                    strokeDasharray={highlighted ? 'none' : '4 4'}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>

            {/* Center node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button
                onClick={() => handleNodeClick('memelli_os')}
                onMouseEnter={() => handleNodeHover('memelli_os')}
                onMouseLeave={() => handleNodeHover(null)}
                className="wheel-center-pulse relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-[hsl(var(--card))] backdrop-blur-xl border-2 border-red-500/50 cursor-pointer transition-all duration-300 hover:border-red-400 hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]"
              >
                <Zap className="h-6 w-6 text-red-400 mb-1" />
                <span className="text-xs font-bold text-white text-center leading-tight">
                  Memelli
                  <br />
                  OS
                </span>
                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
              </button>
            </div>

            {/* Outer rotating ring with nodes */}
            <div
              ref={wheelRef}
              className="wheel-rotate absolute inset-0"
              onMouseEnter={() => {
                if (wheelRef.current) wheelRef.current.style.animationPlayState = 'paused';
              }}
              onMouseLeave={() => {
                if (wheelRef.current && !selectedId)
                  wheelRef.current.style.animationPlayState = 'running';
              }}
            >
              {ALL_NODES.map((node, i) => {
                const angle = (360 / NODE_COUNT) * i - 90;
                const rad = (angle * Math.PI) / 180;
                const cx = 50 + RADIUS_PERCENT * Math.cos(rad);
                const cy = 50 + RADIUS_PERCENT * Math.sin(rad);
                const isActive = activeId === node.id;
                const isFunding = node.id === 'funding';
                const Icon = node.icon;
                const cfg = TIER_CONFIG[node.tier];
                const opacity = getNodeOpacity(node);

                const nodeSize = isFunding ? 'w-24 h-24' : cfg.size;
                const nodeIconSize = isFunding ? 'h-8 w-8' : cfg.iconSize;

                return (
                  <div
                    key={node.id}
                    className="wheel-counter-rotate absolute"
                    style={{
                      left: `${cx}%`,
                      top: `${cy}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <button
                      data-track="wheel-node-click"
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => handleNodeHover(node.id)}
                      onMouseLeave={() => handleNodeHover(null)}
                      className="group flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer"
                      style={{ opacity }}
                    >
                      <div
                        className={`
                          flex items-center justify-center rounded-full border transition-all duration-300 backdrop-blur-lg
                          ${nodeSize}
                          ${
                            isActive
                              ? 'bg-[hsl(var(--card))] border-red-500 shadow-[0_0_24px_rgba(147,51,234,0.5)] ring-2 ring-red-500/50'
                              : cfg.glowBorder
                                ? 'bg-[hsl(var(--card))] border-red-400/60 shadow-[0_0_12px_rgba(147,51,234,0.2)]'
                                : 'bg-[hsl(var(--card))] border-white/[0.06] hover:border-red-500/50'
                          }
                          ${selectedId === node.id ? 'ring-2 ring-red-500' : ''}
                          ${isFunding ? 'shadow-[0_0_30px_rgba(147,51,234,0.5)] ring-2 ring-red-500/60' : ''}
                        `}
                      >
                        <Icon
                          className={`${nodeIconSize} transition-colors duration-300 ${
                            isActive
                              ? 'text-red-400'
                              : cfg.glowBorder
                                ? 'text-red-300'
                                : 'text-[hsl(var(--muted-foreground))] group-hover:text-red-400'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-center leading-tight max-w-[80px] transition-colors duration-300 ${
                          isFunding
                            ? 'text-[12px] font-semibold text-red-300'
                            : isActive
                              ? 'text-[10px] font-medium text-red-300'
                              : cfg.glowBorder
                                ? 'text-[10px] font-medium text-red-300/80'
                                : 'text-[10px] font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]'
                        }`}
                      >
                        {node.label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Mobile carousel ────────────────────────────── */}
        <div className="md:hidden">
          {/* Mobile center node */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => handleNodeClick('memelli_os')}
              className="wheel-center-pulse relative flex flex-col items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--card))] backdrop-blur-xl border-2 border-red-500/50 cursor-pointer"
            >
              <Zap className="h-5 w-5 text-red-400 mb-0.5" />
              <span className="text-[10px] font-bold text-white text-center leading-tight">
                Memelli
                <br />
                OS
              </span>
              <span className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
            </button>
          </div>

          {/* Scrollable row — sorted by tier */}
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
              {MOBILE_SORTED.map((node) => {
                const Icon = node.icon;
                const isActive = selectedId === node.id;
                const cfg = TIER_CONFIG[node.tier];
                const opacity = hasInteracted ? getNodeOpacity(node) : cfg.defaultOpacity;

                return (
                  <button
                    key={node.id}
                    data-track="wheel-node-click"
                    onClick={() => handleNodeClick(node.id)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 min-w-[90px]
                      ${
                        isActive
                          ? 'bg-[hsl(var(--card))] border-red-500 ring-2 ring-red-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                          : cfg.glowBorder
                            ? 'bg-[hsl(var(--muted))] border-red-400/40'
                            : 'bg-[hsl(var(--muted))] border-white/[0.04] hover:border-white/[0.1]'
                      }
                    `}
                    style={{ opacity }}
                  >
                    <div
                      className={`flex items-center justify-center rounded-full border ${
                        node.tier === 'tier_1'
                          ? 'w-12 h-12'
                          : node.tier === 'tier_2'
                            ? 'w-10 h-10'
                            : node.tier === 'tier_3'
                              ? 'w-9 h-9'
                              : 'w-8 h-8'
                      } ${
                        isActive
                          ? 'bg-[hsl(var(--card))] border-red-500'
                          : cfg.glowBorder
                            ? 'bg-[hsl(var(--card))] border-red-400/50'
                            : 'bg-[hsl(var(--card))] border-white/[0.06]'
                      }`}
                    >
                      <Icon
                        className={`${
                          node.tier === 'tier_1'
                            ? 'h-5 w-5'
                            : node.tier === 'tier_2'
                              ? 'h-4.5 w-4.5'
                              : 'h-4 w-4'
                        } ${
                          isActive
                            ? 'text-red-400'
                            : cfg.glowBorder
                              ? 'text-red-300'
                              : 'text-[hsl(var(--muted-foreground))]'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight ${
                        isActive
                          ? 'text-red-300'
                          : cfg.glowBorder
                            ? 'text-red-300/80'
                            : 'text-[hsl(var(--muted-foreground))]'
                      }`}
                    >
                      {node.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Detail panel ────────────────────────────────── */}
        {selectedFeature && (
          <div className="mt-8 md:mt-10 mx-auto max-w-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="relative rounded-2xl border border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl p-6 md:p-8">
              <button
                onClick={handleClosePanel}
                className="absolute top-4 right-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title row */}
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30">
                  <selectedFeature.icon className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedFeature.label}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{selectedFeature.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mt-4 mb-4">
                {selectedFeature.description}
              </p>

              {/* Bullets */}
              <ul className="space-y-2 mb-6">
                {selectedFeature.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[hsl(var(--foreground))]">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={() => {
                    onAskAI?.(selectedFeature.label, selectedFeature.suggestedPrompts, selectedFeature.moduleKey);
                    window.dispatchEvent(new CustomEvent('feature-wheel-select', {
                      detail: { feature: selectedFeature.label, moduleKey: selectedFeature.moduleKey }
                    }));
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_-4px_rgba(147,51,234,0.4)] transition-all duration-300 hover:shadow-[0_0_24px_rgba(147,51,234,0.5)] hover:scale-[1.03]"
                >
                  <MessageCircle className="h-4 w-4" />
                  {selectedFeature.cta}
                </button>
                {selectedFeature.id !== 'memelli_os' && (
                  <button
                    onClick={() => handleNodeClick('memelli_os')}
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors underline underline-offset-2"
                  >
                    Explore Memelli OS
                  </button>
                )}
              </div>

              {/* Suggested prompts */}
              {selectedFeature.suggestedPrompts.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => onAskAI?.(selectedFeature.label, [prompt], selectedFeature.moduleKey)}
                        className="text-xs px-3 py-1.5 rounded-full border border-white/[0.06] text-[hsl(var(--muted-foreground))] hover:border-red-500/40 hover:text-red-300 transition-all duration-200"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CSS animations ───────────────────────────────── */}
      <style jsx>{`
        .wheel-rotate {
          animation: wheel-spin 90s linear infinite;
        }

        .wheel-counter-rotate {
          animation: wheel-counter-spin 90s linear infinite;
        }

        @keyframes wheel-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes wheel-counter-spin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        .wheel-center-pulse::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          border: 2px solid rgba(147, 51, 234, 0.3);
          animation: center-pulse-kf 2.5s ease-in-out infinite;
        }

        @keyframes center-pulse-kf {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

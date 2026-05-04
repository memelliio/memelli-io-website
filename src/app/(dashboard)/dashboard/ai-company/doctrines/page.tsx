'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Brain,
  Gavel,
  DollarSign,
  TrendingUp,
  Home,
  Heart,
  Cpu,
  GraduationCap,
  Building2,
  Globe,
  Megaphone,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Users,
  Copy,
} from 'lucide-react';
import { PageHeader, Button, Badge, Modal, Input, Skeleton } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doctrine {
  id: string;
  field: string;
  title: string;
  summary: string;
  knowledgePoints: string[];
  instructions: string;
  assignedAgents: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Built-in Field Templates ─────────────────────────────────────────────────

const FIELD_TEMPLATES: {
  field: string;
  icon: typeof Brain;
  color: string;
  bg: string;
  summary: string;
  knowledgePoints: string[];
  instructions: string;
}[] = [
  {
    field: 'Legal',
    icon: Gavel,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    summary: 'Contract law, business formation, compliance, IP rights, dispute resolution',
    knowledgePoints: [
      'Business entity types: LLC, S-Corp, C-Corp, sole proprietorship',
      'Contract essentials: offer, acceptance, consideration, legality',
      'Intellectual property: trademark, copyright, patent basics',
      'Employment law: at-will, non-competes, contractor vs employee',
      'Compliance: GDPR, CCPA, ADA, SOX, HIPAA basics',
      'Dispute resolution: arbitration, mediation, litigation',
      'Business licensing and permit requirements by state',
      'Secretary of State registration processes',
    ],
    instructions: 'Always clarify this is educational information, not legal advice. Recommend consulting a licensed attorney for specific legal matters. Be precise with legal terminology.',
  },
  {
    field: 'Finance & Credit',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    summary: 'Credit repair, business funding, financial planning, banking relationships',
    knowledgePoints: [
      'Credit scoring: FICO, VantageScore, factors and weights',
      'Credit repair: dispute process, FCRA rights, removal timelines',
      'Business credit: D&B PAYDEX, Net 30 accounts, trade lines',
      'SBA loans: 7(a), 504, microloans, eligibility requirements',
      'Business lines of credit: requirements, qualification criteria',
      'Cash flow management and financial forecasting',
      'Debt-to-income ratios and creditworthiness assessment',
      'Banking relationships: business checking, merchant accounts',
      'EIN acquisition and business credit file creation',
      'Soft pull vs hard pull credit inquiries',
    ],
    instructions: 'Provide actionable credit-building steps. Always disclose timeframes are estimates. Never promise specific score improvements. Direct users to check their reports for accuracy.',
  },
  {
    field: 'Marketing & Sales',
    icon: TrendingUp,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    summary: 'Digital marketing, sales funnels, copywriting, brand strategy, growth',
    knowledgePoints: [
      'Sales funnel stages: awareness, interest, decision, action (AIDA)',
      'Copywriting frameworks: AIDA, PAS, BAB, Before-After-Bridge',
      'Social media algorithms and organic reach strategies',
      'Email marketing: open rates, CTR benchmarks, deliverability',
      'Paid advertising: Facebook/Meta, Google Ads, TikTok Ads basics',
      'Content marketing: SEO, blogs, video, podcasts, repurposing',
      'Customer acquisition cost (CAC) and lifetime value (LTV)',
      'A/B testing methodology and statistical significance',
      'Brand positioning: USP, target audience, messaging hierarchy',
      'CRM and lead nurturing sequences',
    ],
    instructions: 'Be direct and actionable. Give specific tactics, not generic advice. Use real metrics when possible. Frame everything around ROI and revenue impact.',
  },
  {
    field: 'Real Estate',
    icon: Home,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    summary: 'Property investment, wholesaling, flipping, rentals, financing strategies',
    knowledgePoints: [
      'Real estate investment strategies: buy-and-hold, BRRRR, wholesaling, flipping',
      'Property valuation: ARV, cap rate, cash-on-cash return, NOI',
      'Financing: conventional loans, hard money, private money, seller financing',
      'Due diligence: title search, inspection, comparables analysis',
      'Rental property management: tenant screening, lease agreements',
      'Tax strategies: depreciation, 1031 exchange, cost segregation',
      'Wholesaling contracts: assignment clauses, earnest money, contingencies',
      'Market analysis: absorption rate, days on market, price trends',
    ],
    instructions: 'Focus on numbers and ROI analysis. Always note that real estate laws vary by state. Encourage due diligence and professional consultation for large transactions.',
  },
  {
    field: 'Healthcare & Wellness',
    icon: Heart,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    summary: 'Wellness coaching, health business compliance, telehealth, HIPAA',
    knowledgePoints: [
      'HIPAA compliance: PHI, covered entities, business associate agreements',
      'Telehealth regulations and state licensing requirements',
      'Health coaching scope of practice vs medical advice boundaries',
      'Wellness business models: membership, group programs, retreats',
      'Supplement and wellness product regulations (FTC, FDA)',
      'Insurance and billing basics for health practitioners',
      'Patient/client intake forms and liability waivers',
      'Mental health app compliance and data privacy',
    ],
    instructions: 'Always clearly distinguish health information from medical advice. Never diagnose or prescribe. Recommend licensed healthcare professionals for medical concerns.',
  },
  {
    field: 'Technology & AI',
    icon: Cpu,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    summary: 'Software development, AI/ML, SaaS, automation, tech stack decisions',
    knowledgePoints: [
      'Software architecture: monolith, microservices, serverless, edge',
      'AI/ML fundamentals: LLMs, embeddings, fine-tuning, RAG',
      'SaaS metrics: MRR, ARR, churn, LTV/CAC, NPS',
      'API design: REST, GraphQL, webhooks, rate limiting',
      'DevOps: CI/CD, Docker, Kubernetes, cloud providers (AWS/GCP/Azure)',
      'Database selection: relational, NoSQL, vector databases',
      'Security: OWASP top 10, authentication, encryption, SOC 2',
      'No-code/low-code tools: Bubble, Webflow, Zapier, Make',
      'Tech stack decisions: scalability, cost, team expertise',
    ],
    instructions: 'Prefer practical, production-tested approaches over cutting-edge but unstable options. Always consider cost, scalability, and maintainability. Give concrete examples.',
  },
  {
    field: 'Education & Coaching',
    icon: GraduationCap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    summary: 'Course creation, coaching programs, certification, student outcomes',
    knowledgePoints: [
      'Course design: learning objectives, curriculum structure, assessments',
      'Coaching frameworks: GROW model, cognitive behavioral coaching',
      'Online learning platforms: Teachable, Kajabi, Thinkific, Circle',
      'Community building: membership sites, cohort programs, masterminds',
      'Pricing strategies: one-time, subscription, high-ticket, tiered',
      'Student outcome tracking and testimonial collection',
      'Live vs self-paced program tradeoffs',
      'Certification and accreditation considerations',
      'Affiliate and referral programs for course creators',
    ],
    instructions: 'Emphasize measurable student outcomes. Focus on transformation, not information. Give frameworks that are practical to implement immediately.',
  },
  {
    field: 'Business Strategy',
    icon: Building2,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    summary: 'Business models, operations, systems, scaling, exit strategies',
    knowledgePoints: [
      'Business model canvas: 9 building blocks, value proposition design',
      'Lean startup: MVP, build-measure-learn, pivot vs persevere',
      'OKRs and KPIs: goal-setting, tracking, accountability systems',
      'Operations: SOPs, process documentation, delegation frameworks',
      'Hiring and team building: org design, culture, compensation',
      'Financial modeling: unit economics, break-even, scenario planning',
      'Scaling: productization, automation, outsourcing, franchising',
      'Exit strategies: acquisition, merger, IPO, ESOP',
      'Competitive analysis: SWOT, Porter\'s Five Forces, Blue Ocean',
    ],
    instructions: 'Be strategic and forward-thinking. Connect tactics to long-term outcomes. Challenge assumptions when appropriate. Focus on sustainable, scalable systems.',
  },
  {
    field: 'E-Commerce',
    icon: Globe,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    summary: 'Shopify, dropshipping, DTC brands, Amazon FBA, inventory, logistics',
    knowledgePoints: [
      'E-commerce platforms: Shopify, WooCommerce, BigCommerce, Amazon',
      'Product sourcing: Alibaba, US suppliers, private labeling, print-on-demand',
      'Amazon FBA: product research, listing optimization, PPC',
      'Conversion optimization: product pages, checkout, cart abandonment',
      'Inventory management: EOQ, reorder points, SKU management',
      'Shipping and fulfillment: 3PL, dropshipping, same-day delivery',
      'Returns and customer service best practices',
      'E-commerce metrics: AOV, conversion rate, ROAS, repeat purchase rate',
      'Payment processors: Stripe, PayPal, Klarna, Afterpay',
    ],
    instructions: 'Focus on profitability, not just revenue. Emphasize unit economics and contribution margin. Give specific platform-level tactics where possible.',
  },
  {
    field: 'Compliance & Risk',
    icon: ShieldCheck,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    summary: 'Regulatory compliance, risk management, auditing, insurance, data privacy',
    knowledgePoints: [
      'Data privacy: GDPR, CCPA, COPPA, PIPEDA requirements',
      'Business insurance: general liability, E&O, D&O, cyber insurance',
      'AML/KYC requirements for financial services businesses',
      'FTC regulations: disclosures, endorsements, advertising claims',
      'Industry-specific compliance: FINRA, SEC, FDA, FCC basics',
      'Risk management frameworks: ISO 31000, COSO, ERM',
      'Internal controls: segregation of duties, audit trails, access controls',
      'Incident response planning and business continuity',
    ],
    instructions: 'Be precise and conservative. Compliance is not optional. Always recommend professional consultation for regulated industries. Err on the side of caution.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTemplate(field: string) {
  return FIELD_TEMPLATES.find(t => t.field === field);
}

function fieldIcon(field: string) {
  const t = getTemplate(field);
  if (!t) return Brain;
  return t.icon;
}

function fieldColors(field: string) {
  const t = getTemplate(field);
  return { color: t?.color ?? 'text-muted-foreground', bg: t?.bg ?? 'bg-muted' };
}

// ─── Doctrine Card ────────────────────────────────────────────────────────────

function DoctrineCard({
  doctrine,
  onEdit,
  onDelete,
}: {
  doctrine: Doctrine;
  onEdit: (d: Doctrine) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = fieldIcon(doctrine.field);
  const { color, bg } = fieldColors(doctrine.field);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl ${bg} border border-white/10 flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">{doctrine.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info" className="text-[10px]">{doctrine.field}</Badge>
              {doctrine.assignedAgents > 0 && (
                <span className="text-[11px] text-white/30 flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" />
                  {doctrine.assignedAgents} agents
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
            onClick={() => onEdit(doctrine)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
            onClick={() => onDelete(doctrine.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">{doctrine.summary}</p>

      <button
        className="text-[11px] font-semibold text-white/40 hover:text-white/70 flex items-center gap-1"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {doctrine.knowledgePoints.length} knowledge points
      </button>

      {expanded && (
        <ul className="space-y-1.5 border-t border-white/[0.04] pt-3">
          {doctrine.knowledgePoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/50">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
              {pt}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-white/[0.04] pt-3">
        <p className="text-[11px] text-white/25 italic leading-relaxed">{doctrine.instructions}</p>
      </div>
    </div>
  );
}

// ─── Template Picker ─────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (t: typeof FIELD_TEMPLATES[0]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FIELD_TEMPLATES.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.field}
            className={`flex items-center gap-2 rounded-xl ${t.bg} border border-white/10 p-3 hover:border-white/20 transition-all text-left`}
            onClick={() => onSelect(t)}
          >
            <Icon className={`h-4 w-4 ${t.color} shrink-0`} />
            <span className="text-xs font-semibold text-white/70">{t.field}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctrinesPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editTarget, setEditTarget] = useState<Doctrine | null>(null);
  const [form, setForm] = useState({
    field: '',
    title: '',
    summary: '',
    knowledgePoints: '',
    instructions: '',
  });

  // Fetch doctrines
  const { data: doctrines, isLoading } = useQuery<Doctrine[]>({
    queryKey: ['agent-doctrines'],
    queryFn: async () => {
      const res = await api.get<{ doctrines: Doctrine[] }>('/api/admin/agent-doctrines');
      return res.data?.doctrines ?? [];
    },
  });

  // Create / update
  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const body = {
        field: values.field,
        title: values.title,
        summary: values.summary,
        knowledgePoints: values.knowledgePoints.split('\n').map(s => s.trim()).filter(Boolean),
        instructions: values.instructions,
      };
      if (editTarget) {
        const res = await api.patch(`/api/admin/agent-doctrines/${editTarget.id}`, body);
        if (res.error) throw new Error(res.error);
      } else {
        const res = await api.post('/api/admin/agent-doctrines', body);
        if (res.error) throw new Error(res.error);
      }
    },
    onSuccess: () => {
      toast.success(editTarget ? 'Doctrine updated' : 'Doctrine created');
      setShowNew(false);
      setEditTarget(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['agent-doctrines'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/admin/agent-doctrines/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Doctrine removed');
      queryClient.invalidateQueries({ queryKey: ['agent-doctrines'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setForm({ field: '', title: '', summary: '', knowledgePoints: '', instructions: '' });
  }

  const openNew = useCallback(() => {
    resetForm();
    setShowPicker(true);
  }, []);

  const applyTemplate = useCallback((t: typeof FIELD_TEMPLATES[0]) => {
    setForm({
      field: t.field,
      title: `${t.field} Doctrine`,
      summary: t.summary,
      knowledgePoints: t.knowledgePoints.join('\n'),
      instructions: t.instructions,
    });
    setShowPicker(false);
    setShowNew(true);
  }, []);

  const openEdit = useCallback((d: Doctrine) => {
    setForm({
      field: d.field,
      title: d.title,
      summary: d.summary,
      knowledgePoints: d.knowledgePoints.join('\n'),
      instructions: d.instructions,
    });
    setEditTarget(d);
    setShowNew(true);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="Agent Doctrines"
        subtitle="Give your AI agents deep expertise in specific fields. Each doctrine is a structured knowledge base injected into agent context — turning generalist agents into domain specialists."
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Company', href: '/dashboard/ai-company' },
          { label: 'Doctrines' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={openNew}
          >
            Add Doctrine
          </Button>
        }
      />

      {/* What are doctrines banner */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-5 flex items-start gap-4">
        <Brain className="h-6 w-6 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-violet-300 mb-1">What are Doctrines?</p>
          <p className="text-xs text-white/40 leading-relaxed">
            Doctrines are structured knowledge profiles you assign to AI agents. When an agent has a Legal doctrine, it understands contract law, compliance, and formation processes. A Finance doctrine makes it fluent in credit repair, funding, and financial planning. Assign multiple doctrines to create multi-disciplinary experts — and dispatch those agents to any task that requires that domain knowledge.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Doctrines', value: doctrines?.length ?? '—', icon: <BookOpen className="h-4 w-4 text-violet-400" /> },
          { label: 'Fields Covered', value: doctrines ? new Set(doctrines.map(d => d.field)).size : '—', icon: <Brain className="h-4 w-4 text-emerald-400" /> },
          { label: 'Available Templates', value: FIELD_TEMPLATES.length, icon: <Zap className="h-4 w-4 text-amber-400" /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4">
            <div className="mb-2">{s.icon}</div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Doctrines Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : doctrines && doctrines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctrines.map(d => (
            <DoctrineCard
              key={d.id}
              doctrine={d}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        /* Empty state — show all available templates */
        <div>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Available Field Templates — Click to Add</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {FIELD_TEMPLATES.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.field}
                  className={`text-left rounded-2xl border border-white/[0.06] ${t.bg} p-5 space-y-3 hover:border-white/20 transition-all group`}
                  onClick={() => applyTemplate(t)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${t.bg} border border-white/10 flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${t.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/80">{t.field}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{t.knowledgePoints.length} knowledge points</p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{t.summary}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Template picker modal */}
      <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Choose a Field Template">
        <div className="space-y-4">
          <p className="text-xs text-white/40">Select a pre-built doctrine or start from scratch</p>
          <TemplatePicker onSelect={applyTemplate} />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { resetForm(); setShowPicker(false); setShowNew(true); }}
          >
            Start from Scratch
          </Button>
        </div>
      </Modal>

      {/* Create/edit modal */}
      <Modal
        isOpen={showNew}
        onClose={() => { setShowNew(false); setEditTarget(null); resetForm(); }}
        title={editTarget ? `Edit: ${editTarget.title}` : 'New Agent Doctrine'}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Field / Domain"
              value={form.field}
              onChange={(e) => setForm(p => ({ ...p, field: e.target.value }))}
              placeholder="e.g. Legal, Finance, Marketing"
            />
            <Input
              label="Doctrine Title"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Business Law Doctrine"
            />
          </div>
          <Input
            label="Summary"
            value={form.summary}
            onChange={(e) => setForm(p => ({ ...p, summary: e.target.value }))}
            placeholder="One-line description of this doctrine's coverage"
          />
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Knowledge Points <span className="text-white/25">(one per line)</span>
            </label>
            <textarea
              value={form.knowledgePoints}
              onChange={(e) => setForm(p => ({ ...p, knowledgePoints: e.target.value }))}
              rows={8}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 text-white/80 text-xs px-3 py-2.5 resize-none focus:outline-none focus:border-violet-500/50 placeholder-white/20"
              placeholder="Enter each knowledge point on its own line&#10;e.g. Credit scoring: FICO, VantageScore, factors and weights&#10;Business entity types: LLC, S-Corp, C-Corp"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Agent Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm(p => ({ ...p, instructions: e.target.value }))}
              rows={3}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 text-white/80 text-xs px-3 py-2.5 resize-none focus:outline-none focus:border-violet-500/50 placeholder-white/20"
              placeholder="How should agents apply this knowledge? What tone, caveats, or constraints apply?"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowNew(false); setEditTarget(null); resetForm(); }} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending} leftIcon={<Save className="h-3.5 w-3.5" />} className="flex-1">
              {editTarget ? 'Update Doctrine' : 'Create Doctrine'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Zap, CreditCard } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { useEntitlements } from '../../../../../hooks/useEntitlements';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  ProgressBar,
  FeatureLock,
  UpgradePrompt,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlanDefinition {
  slug: string;
  name: string;
  price: number;
  interval: string;
  features: Record<string, number | boolean>;
  description: string;
}

interface PlansResponse {
  success: boolean;
  data: PlanDefinition[];
}

interface EntitlementItem {
  featureKey: string;
  enabled: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
}

interface EntitlementsResponse {
  planSlug: string | null;
  products: string[];
  entitlements: EntitlementItem[];
}

/* ------------------------------------------------------------------ */
/*  Static plan data (used as fallback / display layer)                */
/* ------------------------------------------------------------------ */

interface DisplayPlan {
  slug: string;
  name: string;
  price: number; // dollars per month
  description: string;
  features: string[];
  highlighted?: boolean;
}

const DISPLAY_PLANS: DisplayPlan[] = [
  {
    slug: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with the basics.',
    features: [
      '1 AI Agent',
      '1 Department',
      '50 Chat Messages / mo',
      '10 Scheduled Tasks',
      '100 Memory Entries',
      'Community support',
    ],
  },
  {
    slug: 'starter',
    name: 'Starter',
    price: 49,
    description: 'For growing businesses.',
    features: [
      '5 AI Agents',
      '3 Departments',
      '500 Chat Messages / mo',
      '50 Scheduled Tasks',
      '1,000 Memory Entries',
      'Email support',
      'Commerce Module',
    ],
  },
  {
    slug: 'professional',
    name: 'Professional',
    price: 149,
    description: 'Full power for scaling teams.',
    highlighted: true,
    features: [
      '25 AI Agents',
      '10 Departments',
      '5,000 Chat Messages / mo',
      'Unlimited Scheduled Tasks',
      'Unlimited Memory Entries',
      'Priority support',
      'Commerce Module',
      'SEO & Content',
      'Coaching Programs',
      'Custom Integrations',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: 499,
    description: 'Dedicated infrastructure & support.',
    features: [
      'Unlimited AI Agents',
      'Unlimited Departments',
      'Unlimited Chat Messages',
      'Unlimited Scheduled Tasks',
      'Unlimited Memory Entries',
      'Dedicated account manager',
      'All modules included',
      'Custom integrations',
      'SSO & SAML',
      'SLA guarantee',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Feature comparison table rows                                      */
/* ------------------------------------------------------------------ */

interface ComparisonRow {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'AI Agents', free: '1', starter: '5', professional: '25', enterprise: 'Unlimited' },
  { label: 'Departments', free: '1', starter: '3', professional: '10', enterprise: 'Unlimited' },
  { label: 'Chat Messages / mo', free: '50', starter: '500', professional: '5,000', enterprise: 'Unlimited' },
  { label: 'Scheduled Tasks', free: '10', starter: '50', professional: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Memory Entries', free: '100', starter: '1,000', professional: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Commerce Module', free: false, starter: true, professional: true, enterprise: true },
  { label: 'SEO & Content', free: false, starter: false, professional: true, enterprise: true },
  { label: 'Coaching Programs', free: false, starter: false, professional: true, enterprise: true },
  { label: 'Custom Integrations', free: false, starter: false, professional: true, enterprise: true },
  { label: 'SSO & SAML', free: false, starter: false, professional: false, enterprise: true },
  { label: 'SLA Guarantee', free: false, starter: false, professional: false, enterprise: true },
  { label: 'Support', free: 'Community', starter: 'Email', professional: 'Priority', enterprise: 'Dedicated' },
];

const PLAN_SLUGS = ['free', 'starter', 'professional', 'enterprise'] as const;

/* ------------------------------------------------------------------ */
/*  Feature label mapping for usage meters                             */
/* ------------------------------------------------------------------ */

const USAGE_LABELS: Record<string, string> = {
  agents: 'AI Agents',
  departments: 'Departments',
  chatMessages: 'Chat Messages',
  scheduledTasks: 'Scheduled Tasks',
  memoryEntries: 'Memory Entries',
};

/* ------------------------------------------------------------------ */
/*  Usage Meter                                                        */
/* ------------------------------------------------------------------ */

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const effectiveLimit = limit ?? 0;
  const pct = effectiveLimit > 0 ? Math.min((used / effectiveLimit) * 100, 100) : 0;
  const color: 'error' | 'warning' | 'primary' =
    pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-xs text-white/40">
          {used.toLocaleString()} / {limit !== null && limit >= 0 ? limit.toLocaleString() : 'Unlimited'}
        </span>
      </div>
      <ProgressBar value={pct} color={color} />
      {pct >= 90 && (
        <p className="mt-1 text-xs text-primary">Approaching limit -- consider upgrading</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison cell renderer                                           */
/* ------------------------------------------------------------------ */

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-primary mx-auto" />
    ) : (
      <X className="h-4 w-4 text-white/15 mx-auto" />
    );
  }
  return <span className="text-sm text-white/60">{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function BillingSettingsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { tierName, isLoading: entitlementsLoading } = useEntitlements();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState('professional');

  // Fetch available plans from API
  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get<PlansResponse>('/api/plans');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load plans');
      return res.data;
    },
  });

  // Fetch current entitlements from API
  const { data: entitlementsData, isLoading: entQueryLoading } = useQuery<EntitlementsResponse>({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const res = await api.get<EntitlementsResponse>('/api/entitlements');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load entitlements');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async (planSlug: string) => {
      const res = await api.post('/api/plans/upgrade', { planSlug });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Plan upgraded successfully!');
      setShowUpgradeModal(false);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['entitlements'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Upgrade failed'),
  });

  const isLoading = plansLoading || entQueryLoading || entitlementsLoading;
  const currentSlug = entitlementsData?.planSlug ?? tierName() ?? 'free';
  const entitlements = entitlementsData?.entitlements ?? [];

  // Merge API plans with display data (API plans take priority for pricing)
  const apiPlans = plansData?.data ?? [];
  const plans: DisplayPlan[] = DISPLAY_PLANS.map((dp) => {
    const apiPlan = apiPlans.find((p) => p.slug === dp.slug);
    if (apiPlan) {
      return {
        ...dp,
        price: apiPlan.price >= 0 ? apiPlan.price / 100 : dp.price,
        description: apiPlan.description || dp.description,
      };
    }
    return dp;
  });

  const currentPlanIndex = PLAN_SLUGS.indexOf(currentSlug as typeof PLAN_SLUGS[number]);

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Billing & Plans"
        subtitle="Manage your subscription, compare plans, and track usage."
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Billing' },
        ]}
      />

      {/* Current Plan + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-5">
            <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Current Plan</p>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-white/90 capitalize">{currentSlug}</h2>
                  <Badge variant="primary">Active</Badge>
                </div>
                <p className="text-sm text-white/30 mt-0.5">
                  {currentSlug === 'free'
                    ? 'Free forever'
                    : `$${plans.find((p) => p.slug === currentSlug)?.price ?? 0}/mo`}
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-white/15" />
            </div>
          </div>
        </div>

        {/* Usage Stats Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-5">
            <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Usage This Period</p>
            {entitlements.filter((e) => USAGE_LABELS[e.featureKey]).length > 0 ? (
              <div className="space-y-4">
                {entitlements
                  .filter((e) => USAGE_LABELS[e.featureKey])
                  .map((ent) => (
                    <UsageMeter
                      key={ent.featureKey}
                      label={USAGE_LABELS[ent.featureKey] ?? ent.featureKey}
                      used={ent.used}
                      limit={ent.limit}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-sm text-white/30">No usage data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-white/90 mb-4">Choose Your Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentSlug === plan.slug;
            const isHighlighted = plan.highlighted;
            const planIndex = PLAN_SLUGS.indexOf(plan.slug as typeof PLAN_SLUGS[number]);
            const isUpgrade = planIndex > currentPlanIndex;
            const isDowngrade = planIndex < currentPlanIndex;

            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 backdrop-blur-xl ${
                  isCurrent
                    ? 'border-primary/40 ring-2 ring-primary/20 bg-card shadow-[0_0_30px_rgba(0,0,0,0.15)]'
                    : isHighlighted
                      ? 'border-primary/20 ring-1 ring-primary/10 bg-card shadow-[0_2px_20px_rgba(0,0,0,0.15)]'
                      : 'border-white/[0.04] bg-card hover:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.15)]'
                }`}
              >
                {/* Current plan label */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 bg-primary text-white text-xs font-semibold rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Most Popular label (only if not current) */}
                {isHighlighted && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 bg-primary text-white text-xs font-semibold rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-4 mt-1">
                  <Badge variant={isCurrent ? 'primary' : 'default'}>{plan.name}</Badge>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-white/90">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-white/30">/mo</span>}
                  </div>
                  <p className="text-xs text-white/30 mt-1.5">{plan.description}</p>
                </div>

                {/* Feature list */}
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-white/40">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {isCurrent ? (
                  <div className="w-full py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium text-center cursor-default">
                    Current Plan
                  </div>
                ) : plan.slug === 'enterprise' ? (
                  <a
                    href="mailto:sales@memelli.com"
                    className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.06] text-white/70 rounded-xl text-sm font-medium text-center transition-all duration-200 block border border-white/[0.06]"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <Button
                    onClick={() => {
                      setUpgradeTarget(plan.slug);
                      setShowUpgradeModal(true);
                    }}
                    isLoading={upgradeMutation.isPending}
                    className="w-full"
                    size="sm"
                    variant={isHighlighted ? 'primary' : 'secondary'}
                  >
                    {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Switch'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="p-5 pb-0">
          <p className="text-sm font-semibold tracking-tight text-white/85">Feature Comparison</p>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="pb-3 pr-4 text-sm font-medium text-white/40 min-w-[180px]">Feature</th>
                  {DISPLAY_PLANS.map((plan) => (
                    <th
                      key={plan.slug}
                      className={`pb-3 px-4 text-sm font-medium text-center min-w-[100px] ${
                        currentSlug === plan.slug ? 'text-primary' : 'text-white/40'
                      }`}
                    >
                      {plan.name}
                      {currentSlug === plan.slug && (
                        <span className="block text-[10px] text-primary font-normal mt-0.5">
                          (current)
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-white/[0.03] last:border-0">
                    <td className="py-3 pr-4 text-sm text-white/60">{row.label}</td>
                    {(['free', 'starter', 'professional', 'enterprise'] as const).map((slug) => (
                      <td
                        key={slug}
                        className={`py-3 px-4 text-center ${
                          currentSlug === slug ? 'bg-primary/[0.04]' : ''
                        }`}
                      >
                        <ComparisonCell value={row[slug]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Locked Features (show only on free/starter) */}
      {(currentSlug === 'free' || currentSlug === 'starter') && (
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white/90 mb-4">Unlock More Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'commerce', label: 'Commerce Module', plan: 'Starter', minSlug: 'starter' },
              { key: 'seo', label: 'SEO & Content', plan: 'Professional', minSlug: 'professional' },
              { key: 'coaching', label: 'Coaching Programs', plan: 'Professional', minSlug: 'professional' },
            ]
              .filter((f) => {
                const ent = entitlements.find((e) => e.featureKey === f.key);
                return !ent?.enabled;
              })
              .map((f) => (
                <FeatureLock
                  key={f.key}
                  planName={f.plan}
                  feature={f.label}
                  description={`Upgrade to ${f.plan} to unlock ${f.label.toLowerCase()}.`}
                  onUpgrade={() => {
                    setUpgradeTarget(f.minSlug);
                    setShowUpgradeModal(true);
                  }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-white/60">{f.label}</p>
                      <p className="text-xs text-white/30 mt-1">Available on {f.plan}+ plans</p>
                    </CardContent>
                  </Card>
                </FeatureLock>
              ))}
          </div>
        </div>
      )}

      {/* Inline Upgrade Prompt for free users */}
      {currentSlug === 'free' && (
        <UpgradePrompt
          currentPlan="Free"
          targetPlan="Starter"
          features={[
            'Up to 5 AI Agents',
            '500 chat messages / mo',
            'Commerce Module',
            'Email support',
          ]}
          onUpgrade={() => {
            setUpgradeTarget('starter');
            setShowUpgradeModal(true);
          }}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          inline={false}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={plans.find((p) => p.slug === currentSlug)?.name ?? 'Free'}
          targetPlan={plans.find((p) => p.slug === upgradeTarget)?.name ?? upgradeTarget}
          features={
            plans
              .find((p) => p.slug === upgradeTarget)
              ?.features.slice(0, 5) ?? []
          }
          onUpgrade={() => upgradeMutation.mutate(upgradeTarget)}
        />
      )}
    </div>
  );
}

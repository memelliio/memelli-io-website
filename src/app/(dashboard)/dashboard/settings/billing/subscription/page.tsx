'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CreditCard,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Receipt,
  ExternalLink,
  Shield,
  BarChart3,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { useEntitlements } from '../../../../../../hooks/useEntitlements';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  ProgressBar,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceUrl: string | null;
}

interface SubscriptionDetails {
  planSlug: string;
  planName: string;
  price: number;
  interval: 'monthly' | 'yearly';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

interface UsageItem {
  featureKey: string;
  label: string;
  used: number;
  limit: number | null;
}

interface SubscriptionResponse {
  success: boolean;
  data: {
    subscription: SubscriptionDetails;
    paymentMethod: PaymentMethod | null;
    billingHistory: BillingHistoryItem[];
    usage: UsageItem[];
  };
}

/* ------------------------------------------------------------------ */
/*  Mock data (used when API is not wired yet)                         */
/* ------------------------------------------------------------------ */

const MOCK_DATA: SubscriptionResponse['data'] = {
  subscription: {
    planSlug: 'professional',
    planName: 'Professional',
    price: 14900,
    interval: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-03-01T00:00:00Z',
    currentPeriodEnd: '2026-04-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    trialEnd: null,
  },
  paymentMethod: {
    id: 'pm_mock',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
    isDefault: true,
  },
  billingHistory: [
    {
      id: 'inv_001',
      date: '2026-03-01T00:00:00Z',
      amount: 14900,
      currency: 'usd',
      status: 'paid',
      description: 'Professional Plan - Mar 2026',
      invoiceUrl: '#',
    },
    {
      id: 'inv_002',
      date: '2026-02-01T00:00:00Z',
      amount: 14900,
      currency: 'usd',
      status: 'paid',
      description: 'Professional Plan - Feb 2026',
      invoiceUrl: '#',
    },
    {
      id: 'inv_003',
      date: '2026-01-01T00:00:00Z',
      amount: 14900,
      currency: 'usd',
      status: 'paid',
      description: 'Professional Plan - Jan 2026',
      invoiceUrl: '#',
    },
    {
      id: 'inv_004',
      date: '2025-12-01T00:00:00Z',
      amount: 4900,
      currency: 'usd',
      status: 'paid',
      description: 'Starter Plan - Dec 2025',
      invoiceUrl: '#',
    },
    {
      id: 'inv_005',
      date: '2025-11-01T00:00:00Z',
      amount: 4900,
      currency: 'usd',
      status: 'refunded',
      description: 'Starter Plan - Nov 2025',
      invoiceUrl: '#',
    },
  ],
  usage: [
    { featureKey: 'agents', label: 'AI Agents', used: 18, limit: 25 },
    { featureKey: 'departments', label: 'Departments', used: 6, limit: 10 },
    { featureKey: 'chatMessages', label: 'Chat Messages', used: 3847, limit: 5000 },
    { featureKey: 'scheduledTasks', label: 'Scheduled Tasks', used: 142, limit: null },
    { featureKey: 'memoryEntries', label: 'Memory Entries', used: 8291, limit: null },
  ],
};

/* ------------------------------------------------------------------ */
/*  Plan tiers for upgrade/downgrade logic                             */
/* ------------------------------------------------------------------ */

const PLAN_ORDER = ['free', 'starter', 'professional', 'enterprise'] as const;

const PLAN_DETAILS: Record<string, { name: string; price: number }> = {
  free: { name: 'Free', price: 0 },
  starter: { name: 'Starter', price: 4900 },
  professional: { name: 'Professional', price: 14900 },
  enterprise: { name: 'Enterprise', price: 49900 },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCardBrand(brand: string): string {
  const brands: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  return brands[brand.toLowerCase()] ?? brand;
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'paid':
    case 'active':
      return 'success';
    case 'pending':
    case 'trialing':
    case 'paused':
      return 'warning';
    case 'failed':
    case 'past_due':
    case 'canceled':
      return 'error';
    default:
      return 'default';
  }
}

/* ------------------------------------------------------------------ */
/*  Usage Meter                                                        */
/* ------------------------------------------------------------------ */

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const effectiveLimit = limit ?? 0;
  const pct = effectiveLimit > 0 ? Math.min((used / effectiveLimit) * 100, 100) : 0;
  const isUnlimited = limit === null;
  const color: 'error' | 'warning' | 'primary' =
    pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-xs text-white/40">
          {used.toLocaleString()} / {isUnlimited ? 'Unlimited' : (limit ?? 0).toLocaleString()}
        </span>
      </div>
      {isUnlimited ? (
        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-red-500/20 to-red-500/5 rounded-full" />
        </div>
      ) : (
        <ProgressBar value={pct} color={color} />
      )}
      {!isUnlimited && pct >= 90 && (
        <p className="mt-1 text-xs text-red-400">Approaching limit -- consider upgrading</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cancel Confirmation Modal                                          */
/* ------------------------------------------------------------------ */

function CancelModal({
  planName,
  periodEnd,
  onConfirm,
  onClose,
  isLoading,
}: {
  planName: string;
  periodEnd: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0a0a0f] p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>

        <h3 className="text-lg font-semibold text-white/90 mb-2">Cancel Subscription?</h3>
        <p className="text-sm text-white/50 mb-1">
          Your <span className="text-white/70 font-medium">{planName}</span> plan will remain active
          until the end of your current billing period.
        </p>
        <p className="text-sm text-white/50 mb-6">
          You will lose access to premium features on{' '}
          <span className="text-white/70 font-medium">{formatDate(periodEnd)}</span>.
        </p>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
            <p className="text-xs text-white/40 mb-2">What you will lose:</p>
            <ul className="space-y-1.5 text-xs text-white/50">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-red-400" />
                Additional AI agents and departments
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-red-400" />
                Higher message and task limits
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-red-400" />
                Premium modules (Commerce, SEO, Coaching)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-red-400" />
                Priority support
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Keep Subscription
            </Button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/20 disabled:opacity-50"
            >
              {isLoading ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SubscriptionPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { tierName } = useEntitlements();

  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch subscription data (falls back to mock data)
  const { data, isLoading } = useQuery<SubscriptionResponse['data']>({
    queryKey: ['subscription-details'],
    queryFn: async () => {
      try {
        const res = await api.get<SubscriptionResponse>('/api/billing/subscription');
        if (res.error || !res.data) return MOCK_DATA;
        return (res.data as SubscriptionResponse).data ?? MOCK_DATA;
      } catch {
        return MOCK_DATA;
      }
    },
    staleTime: 60_000,
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/billing/subscription/cancel', {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Subscription canceled. Access continues until the end of your billing period.');
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ['subscription-details'] });
      queryClient.invalidateQueries({ queryKey: ['entitlements'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to cancel subscription'),
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/billing/subscription/reactivate', {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Subscription reactivated!');
      queryClient.invalidateQueries({ queryKey: ['subscription-details'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to reactivate'),
  });

  const sub = data?.subscription ?? MOCK_DATA.subscription;
  const payment = data?.paymentMethod ?? MOCK_DATA.paymentMethod;
  const history = data?.billingHistory ?? MOCK_DATA.billingHistory;
  const usage = data?.usage ?? MOCK_DATA.usage;

  const currentPlanIndex = PLAN_ORDER.indexOf(sub.planSlug as typeof PLAN_ORDER[number]);
  const nextBillingDate = sub.currentPeriodEnd;
  const daysUntilRenewal = Math.max(
    0,
    Math.ceil((new Date(nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Subscription"
        subtitle="Manage your plan, payment method, and billing history."
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Billing', href: '/dashboard/settings/billing' },
          { label: 'Subscription' },
        ]}
      />

      {/* ---- Row 1: Current Plan + Payment Method ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-5">
            <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">
              Current Plan
            </p>

            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <Zap className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-semibold tracking-tight text-white/90">
                    {sub.planName}
                  </h2>
                  <Badge variant={statusBadgeVariant(sub.status)}>
                    {sub.cancelAtPeriodEnd ? 'Canceling' : sub.status}
                  </Badge>
                </div>
                <p className="text-sm text-white/40 mt-0.5">
                  {formatCurrency(sub.price)} / {sub.interval === 'yearly' ? 'year' : 'month'}
                </p>
              </div>
            </div>

            {/* Billing cycle info */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Current period
                </span>
                <span className="text-xs text-white/60">
                  {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Next billing date</span>
                <span className="text-xs text-white/60">
                  {sub.cancelAtPeriodEnd ? (
                    <span className="text-red-400">Ends {formatDate(nextBillingDate)}</span>
                  ) : (
                    <>
                      {formatDate(nextBillingDate)}{' '}
                      <span className="text-white/30">({daysUntilRenewal}d)</span>
                    </>
                  )}
                </span>
              </div>
              {sub.trialEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Trial ends</span>
                  <span className="text-xs text-yellow-400">{formatDate(sub.trialEnd)}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
              {currentPlanIndex < PLAN_ORDER.length - 1 && (
                <a
                  href="/dashboard/settings/billing"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Upgrade
                </a>
              )}
              {currentPlanIndex > 0 && (
                <a
                  href="/dashboard/settings/billing"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/80"
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Downgrade
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-5">
            <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-4">
              Payment Method
            </p>

            {payment ? (
              <>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-14 w-20 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <CreditCard className="h-7 w-7 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80">
                      {formatCardBrand(payment.brand)}
                    </p>
                    <p className="text-lg font-mono tracking-widest text-white/60 mt-0.5">
                      **** **** **** {payment.last4}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      Expires {String(payment.expMonth).padStart(2, '0')}/{payment.expYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success">Default</Badge>
                  <Shield className="h-3.5 w-3.5 text-white/20" />
                  <span className="text-xs text-white/30">Secured with Stripe</span>
                </div>

                <button className="mt-4 text-xs text-red-400 hover:text-red-300 transition-colors underline underline-offset-2">
                  Update payment method
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CreditCard className="h-10 w-10 text-white/10 mb-3" />
                <p className="text-sm text-white/40 mb-1">No payment method on file</p>
                <p className="text-xs text-white/25 mb-4">
                  Add a card to enable paid plans
                </p>
                <Button variant="primary" size="sm">
                  Add Payment Method
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Row 2: Usage Meters ---- */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
              Usage This Period
            </p>
          </div>

          {usage.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {usage.map((item) => (
                <UsageMeter
                  key={item.featureKey}
                  label={item.label}
                  used={item.used}
                  limit={item.limit}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30">No usage data available yet.</p>
          )}
        </div>
      </div>

      {/* ---- Row 3: Billing History ---- */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="p-5 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-4 w-4 text-red-400" />
            <p className="text-sm font-semibold tracking-tight text-white/85">Billing History</p>
          </div>
        </div>

        <div className="p-5">
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="pb-3 pr-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium text-white/40 uppercase tracking-wider text-right">
                      Amount
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium text-white/40 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="pb-3 text-xs font-medium text-white/40 uppercase tracking-wider text-center">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="py-3.5 pr-4 text-sm text-white/60 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3.5 pr-4 text-sm text-white/50">
                        {item.description}
                      </td>
                      <td className="py-3.5 pr-4 text-sm text-white/70 text-right font-mono whitespace-nowrap">
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <Badge variant={statusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-center">
                        {item.invoiceUrl ? (
                          <a
                            href={item.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-white/20">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-6">No billing history yet.</p>
          )}
        </div>
      </div>

      {/* ---- Row 4: Cancel / Reactivate Subscription ---- */}
      {sub.planSlug !== 'free' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">
                  {sub.cancelAtPeriodEnd
                    ? 'Your subscription is set to cancel'
                    : 'Cancel Subscription'}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  {sub.cancelAtPeriodEnd
                    ? `Access continues until ${formatDate(nextBillingDate)}. Reactivate anytime before then.`
                    : 'Cancel your plan at any time. You will retain access until the end of your billing period.'}
                </p>
              </div>

              {sub.cancelAtPeriodEnd ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => reactivateMutation.mutate()}
                  isLoading={reactivateMutation.isPending}
                >
                  Reactivate
                </Button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/30"
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <CancelModal
          planName={sub.planName}
          periodEnd={nextBillingDate}
          onConfirm={() => cancelMutation.mutate()}
          onClose={() => setShowCancelModal(false)}
          isLoading={cancelMutation.isPending}
        />
      )}
    </div>
  );
}

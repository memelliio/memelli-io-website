'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useApi } from '@/hooks/useApi';
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  FileText,
  Plus,
  ArrowRight,
  Shield,
  AlertCircle,
  BarChart3,
  Users,
  CreditCard,
  Hash,
  Globe,
  Phone,
  MapPin,
  Briefcase,
  Target,
  Eye,
  Calendar,
  Zap,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProgressStep = 'duns_obtained' | 'vendors_applied' | 'accounts_opened' | 'reporting_confirmed';

type VendorCategory = 'office_supplies' | 'shipping' | 'fuel' | 'technology' | 'marketing' | 'general' | 'industrial' | 'fleet' | 'apparel' | 'telecom';

type VendorDifficulty = 'easy' | 'moderate' | 'advanced';

interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  difficulty: VendorDifficulty;
  creditLimit: string;
  netTerms: number;
  requirements: string[];
  reportsTo: string[];
  website: string;
  applied: boolean;
  approved: boolean;
  reporting: boolean;
  notes: string;
}

interface TradeReference {
  id: string;
  vendorName: string;
  accountNumber: string;
  creditLimit: number;
  currentBalance: number;
  dateOpened: string;
  paymentHistory: ('on_time' | 'late_30' | 'late_60' | 'late_90')[];
  reportsTo: string[];
  status: 'active' | 'closed' | 'collections';
}

interface CreditReport {
  id: string;
  bureau: string;
  pullDate: string;
  paydexScore: number | null;
  intelliscore: number | null;
  tradeLines: number;
  derogatoryMarks: number;
  creditUtilization: number;
  paymentIndex: number;
}

interface TimelineStep {
  id: string;
  step: number;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  active: boolean;
  tasks: { label: string; done: boolean }[];
}

/* API response shape from GET /api/admin/credit/stats */
interface CreditStatsData {
  creditPullsToday: number;
  fundingReadyUsers: number;
  creditRepairRouted: number;
  activeFundingRequests: number;
  pendingReviews: number;
  approvalRate: number;
  scoreDistribution: { excellent: number; good: number; fair: number; poor: number };
  recentPulls: Array<{
    id: string;
    contactName: string;
    tenant: string;
    score: number;
    category: string;
    decision: 'Funding Ready' | 'Credit Repair';
    date: string;
  }>;
  fundingPipeline: {
    applied: number;
    underReview: number;
    approved: number;
    funded: number;
    declined: number;
  };
  creditRepairQueue: {
    usersRouted: number;
    activePrograms: number;
    avgTimelineWeeks: number;
    completionRate: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  office_supplies: 'Office Supplies',
  shipping: 'Shipping',
  fuel: 'Fuel & Gas',
  technology: 'Technology',
  marketing: 'Marketing',
  general: 'General',
  industrial: 'Industrial',
  fleet: 'Fleet',
  apparel: 'Apparel',
  telecom: 'Telecom',
};

const DIFFICULTY_CONFIG: Record<VendorDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  moderate: { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  advanced: { label: 'Advanced', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const PROGRESS_STEPS: { key: ProgressStep; label: string; icon: typeof Building2 }[] = [
  { key: 'duns_obtained', label: 'DUNS Obtained', icon: Hash },
  { key: 'vendors_applied', label: 'Vendors Applied', icon: FileText },
  { key: 'accounts_opened', label: 'Accounts Opened', icon: CreditCard },
  { key: 'reporting_confirmed', label: 'Reporting Confirmed', icon: CheckCircle2 },
];

/* ------------------------------------------------------------------ */
/*  Mock: DUNS Profile                                                 */
/* ------------------------------------------------------------------ */

const MOCK_DUNS_PROFILE = {
  dunsNumber: '07-123-4567',
  businessName: 'Memelli Universe LLC',
  tradeName: 'Memelli',
  address: '123 Innovation Drive, Suite 400, Miami, FL 33101',
  phone: '(305) 555-0199',
  yearStarted: 2023,
  employees: 12,
  annualRevenue: '$1.2M',
  sic: '7372 - Prepackaged Software',
  naics: '511210 - Software Publishers',
  status: 'Active',
};

/* ------------------------------------------------------------------ */
/*  Mock: Net 30 Vendors (20)                                          */
/* ------------------------------------------------------------------ */

const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1', name: 'Uline', category: 'office_supplies', difficulty: 'easy',
    creditLimit: '$1,000 - $5,000', netTerms: 30,
    requirements: ['DUNS number', 'Business bank account', 'EIN'],
    reportsTo: ['D&B'], website: 'https://www.uline.com',
    applied: true, approved: true, reporting: true, notes: 'Shipping & packaging supplies. Reports quickly.',
  },
  {
    id: 'v2', name: 'Quill', category: 'office_supplies', difficulty: 'easy',
    creditLimit: '$500 - $2,500', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '3+ months in business'],
    reportsTo: ['D&B'], website: 'https://www.quill.com',
    applied: true, approved: true, reporting: true, notes: 'Office supplies. Easy approval for new businesses.',
  },
  {
    id: 'v3', name: 'Grainger', category: 'industrial', difficulty: 'easy',
    creditLimit: '$1,000 - $10,000', netTerms: 30,
    requirements: ['DUNS number', 'Business bank account', 'Trade references (2)'],
    reportsTo: ['D&B'], website: 'https://www.grainger.com',
    applied: true, approved: true, reporting: false, notes: 'Industrial supplies. High limits available.',
  },
  {
    id: 'v4', name: 'Summa Office Supplies', category: 'office_supplies', difficulty: 'easy',
    creditLimit: '$500 - $3,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN'],
    reportsTo: ['D&B', 'Experian Business'], website: 'https://www.summaofficesupplies.com',
    applied: true, approved: false, reporting: false, notes: 'Reports to multiple bureaus. Good starter vendor.',
  },
  {
    id: 'v5', name: 'Strategic Network Solutions', category: 'technology', difficulty: 'easy',
    creditLimit: '$1,000 - $5,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', 'Business bank account'],
    reportsTo: ['D&B', 'Experian Business'], website: 'https://www.snsonlinestore.com',
    applied: true, approved: false, reporting: false, notes: 'Tech supplies. Reports to D&B and Experian.',
  },
  {
    id: 'v6', name: 'Crown Office Supplies', category: 'office_supplies', difficulty: 'easy',
    creditLimit: '$500 - $2,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN'],
    reportsTo: ['D&B', 'Equifax Business'], website: 'https://www.crownofficesupplies.com',
    applied: false, approved: false, reporting: false, notes: 'Easy approval. Reports to D&B and Equifax.',
  },
  {
    id: 'v7', name: 'Marathon', category: 'fuel', difficulty: 'easy',
    creditLimit: '$500 - $2,500', netTerms: 30,
    requirements: ['DUNS number', 'EIN', 'Personal guarantee may apply'],
    reportsTo: ['D&B'], website: 'https://www.marathon.com',
    applied: false, approved: false, reporting: false, notes: 'Fleet fuel card. Good for businesses with vehicles.',
  },
  {
    id: 'v8', name: 'Shirtsy', category: 'apparel', difficulty: 'easy',
    creditLimit: '$500 - $2,500', netTerms: 30,
    requirements: ['DUNS number', 'EIN'],
    reportsTo: ['D&B'], website: 'https://www.shirtsy.com',
    applied: false, approved: false, reporting: false, notes: 'Custom apparel. Reports to D&B.',
  },
  {
    id: 'v9', name: 'The CEO Creative', category: 'marketing', difficulty: 'easy',
    creditLimit: '$1,000 - $5,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', 'Website'],
    reportsTo: ['D&B', 'Equifax Business', 'Experian Business'], website: 'https://www.theceocreative.com',
    applied: false, approved: false, reporting: false, notes: 'Marketing materials. Reports to all 3 bureaus.',
  },
  {
    id: 'v10', name: 'Wise Business Plans', category: 'general', difficulty: 'easy',
    creditLimit: '$1,000 - $3,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN'],
    reportsTo: ['D&B'], website: 'https://www.wisebusinessplans.com',
    applied: false, approved: false, reporting: false, notes: 'Business plan services. Quick approval.',
  },
  {
    id: 'v11', name: 'Dell Technologies', category: 'technology', difficulty: 'moderate',
    creditLimit: '$5,000 - $25,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '1+ year in business', 'Paydex 50+'],
    reportsTo: ['D&B'], website: 'https://www.dell.com',
    applied: false, approved: false, reporting: false, notes: 'Higher limits. Requires some established credit.',
  },
  {
    id: 'v12', name: 'Staples Business Advantage', category: 'office_supplies', difficulty: 'moderate',
    creditLimit: '$2,000 - $10,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '6+ months in business', 'Trade references (2)'],
    reportsTo: ['D&B'], website: 'https://www.staplesbusinessadvantage.com',
    applied: false, approved: false, reporting: false, notes: 'Requires some business credit history.',
  },
  {
    id: 'v13', name: 'Nadine West', category: 'apparel', difficulty: 'moderate',
    creditLimit: '$1,000 - $5,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', 'Paydex 40+'],
    reportsTo: ['D&B', 'Experian Business'], website: 'https://www.nadinewest.com',
    applied: false, approved: false, reporting: false, notes: 'Fashion apparel. Reports to multiple bureaus.',
  },
  {
    id: 'v14', name: "Sam's Club Business", category: 'general', difficulty: 'moderate',
    creditLimit: '$5,000 - $15,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '1+ year in business', 'Business bank account'],
    reportsTo: ['D&B'], website: 'https://www.samsclub.com',
    applied: false, approved: false, reporting: false, notes: 'Wholesale purchasing. Good credit limits.',
  },
  {
    id: 'v15', name: 'FedEx', category: 'shipping', difficulty: 'moderate',
    creditLimit: '$1,000 - $10,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '6+ months in business', 'Shipping volume history'],
    reportsTo: ['D&B'], website: 'https://www.fedex.com',
    applied: false, approved: false, reporting: false, notes: 'Shipping account. Limit based on volume.',
  },
  {
    id: 'v16', name: 'Home Depot Pro', category: 'industrial', difficulty: 'moderate',
    creditLimit: '$5,000 - $25,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '1+ year in business', 'Trade references (3)'],
    reportsTo: ['D&B'], website: 'https://www.homedepot.com',
    applied: false, approved: false, reporting: false, notes: 'Construction & maintenance supplies.',
  },
  {
    id: 'v17', name: 'Amazon Business Line of Credit', category: 'general', difficulty: 'advanced',
    creditLimit: '$10,000 - $100,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '2+ years in business', 'Paydex 60+', 'Annual revenue $100K+'],
    reportsTo: ['D&B'], website: 'https://business.amazon.com',
    applied: false, approved: false, reporting: false, notes: 'Highest limits. Requires established credit profile.',
  },
  {
    id: 'v18', name: 'Verizon Business', category: 'telecom', difficulty: 'advanced',
    creditLimit: '$5,000 - $50,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '2+ years in business', 'Paydex 70+', 'Annual revenue $500K+'],
    reportsTo: ['D&B', 'Experian Business'], website: 'https://www.verizon.com/business',
    applied: false, approved: false, reporting: false, notes: 'Telecom services. Strong credit required.',
  },
  {
    id: 'v19', name: 'BP Fleet Cards', category: 'fleet', difficulty: 'advanced',
    creditLimit: '$5,000 - $30,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '1+ year in business', 'Paydex 65+', 'Fleet vehicles'],
    reportsTo: ['D&B'], website: 'https://www.bp.com',
    applied: false, approved: false, reporting: false, notes: 'Fleet fuel management. Requires fleet vehicles.',
  },
  {
    id: 'v20', name: "Lowe's Business Credit", category: 'industrial', difficulty: 'advanced',
    creditLimit: '$10,000 - $50,000', netTerms: 30,
    requirements: ['DUNS number', 'EIN', '2+ years in business', 'Paydex 70+', 'Trade references (4+)'],
    reportsTo: ['D&B'], website: 'https://www.lowes.com',
    applied: false, approved: false, reporting: false, notes: 'High-limit building materials. Strong profile needed.',
  },
];

/* ------------------------------------------------------------------ */
/*  Mock: Trade References                                             */
/* ------------------------------------------------------------------ */

const MOCK_TRADE_REFS: TradeReference[] = [
  {
    id: 'tr1', vendorName: 'Uline', accountNumber: '****8842', creditLimit: 3000,
    currentBalance: 450, dateOpened: '2025-06-15',
    paymentHistory: ['on_time', 'on_time', 'on_time', 'on_time', 'on_time', 'on_time'],
    reportsTo: ['D&B'], status: 'active',
  },
  {
    id: 'tr2', vendorName: 'Quill', accountNumber: '****3391', creditLimit: 1500,
    currentBalance: 0, dateOpened: '2025-07-01',
    paymentHistory: ['on_time', 'on_time', 'on_time', 'on_time', 'on_time'],
    reportsTo: ['D&B'], status: 'active',
  },
  {
    id: 'tr3', vendorName: 'Grainger', accountNumber: '****6615', creditLimit: 5000,
    currentBalance: 1200, dateOpened: '2025-09-10',
    paymentHistory: ['on_time', 'on_time', 'on_time', 'on_time'],
    reportsTo: ['D&B'], status: 'active',
  },
];

/* ------------------------------------------------------------------ */
/*  Mock: Credit Reports                                               */
/* ------------------------------------------------------------------ */

const MOCK_REPORTS: CreditReport[] = [
  {
    id: 'cr1', bureau: 'D&B (Dun & Bradstreet)', pullDate: '2026-03-10',
    paydexScore: 72, intelliscore: null, tradeLines: 3,
    derogatoryMarks: 0, creditUtilization: 18, paymentIndex: 85,
  },
  {
    id: 'cr2', bureau: 'Experian Business', pullDate: '2026-03-10',
    paydexScore: null, intelliscore: 62, tradeLines: 2,
    derogatoryMarks: 0, creditUtilization: 12, paymentIndex: 80,
  },
];

/* ------------------------------------------------------------------ */
/*  Mock: Timeline Steps                                               */
/* ------------------------------------------------------------------ */

const MOCK_TIMELINE: TimelineStep[] = [
  {
    id: 'ts1', step: 1, title: 'Business Foundation', description: 'Establish your business entity and obtain EIN',
    duration: 'Week 1-2', completed: true, active: false,
    tasks: [
      { label: 'Register LLC/Corp with state', done: true },
      { label: 'Obtain EIN from IRS', done: true },
      { label: 'Open business bank account', done: true },
      { label: 'Get business phone number', done: true },
      { label: 'Create business website', done: true },
    ],
  },
  {
    id: 'ts2', step: 2, title: 'DUNS Number', description: 'Apply for your D&B DUNS number',
    duration: 'Week 2-3', completed: true, active: false,
    tasks: [
      { label: 'Apply at dnb.com/duns.html', done: true },
      { label: 'Verify business information', done: true },
      { label: 'Receive DUNS number (free takes 30 days)', done: true },
      { label: 'Confirm DUNS listing accuracy', done: true },
    ],
  },
  {
    id: 'ts3', step: 3, title: 'Starter Vendors', description: 'Apply for 5-8 easy Net 30 vendor accounts',
    duration: 'Week 3-6', completed: true, active: false,
    tasks: [
      { label: 'Apply to Uline', done: true },
      { label: 'Apply to Quill', done: true },
      { label: 'Apply to Grainger', done: true },
      { label: 'Apply to Summa Office Supplies', done: true },
      { label: 'Apply to Strategic Network Solutions', done: true },
      { label: 'Make initial purchases on each account', done: true },
    ],
  },
  {
    id: 'ts4', step: 4, title: 'Build Payment History', description: 'Make purchases and pay on time (or early) for 90+ days',
    duration: 'Month 2-4', completed: false, active: true,
    tasks: [
      { label: 'Monthly purchases on each vendor account', done: true },
      { label: 'Pay all invoices before due date', done: true },
      { label: 'Maintain consistent purchasing pattern', done: true },
      { label: 'Track payment confirmations', done: false },
      { label: 'Verify vendors are reporting to D&B', done: false },
    ],
  },
  {
    id: 'ts5', step: 5, title: 'Tier 2 Vendors', description: 'Apply for moderate-difficulty vendor accounts',
    duration: 'Month 4-6', completed: false, active: false,
    tasks: [
      { label: 'Check Paydex score (target: 50+)', done: false },
      { label: 'Apply to Dell Technologies', done: false },
      { label: 'Apply to Staples Business Advantage', done: false },
      { label: 'Apply to FedEx Business Account', done: false },
      { label: 'Apply to Home Depot Pro', done: false },
    ],
  },
  {
    id: 'ts6', step: 6, title: 'Business Credit Cards', description: 'Apply for business credit cards that report to bureaus',
    duration: 'Month 6-8', completed: false, active: false,
    tasks: [
      { label: 'Check Paydex score (target: 65+)', done: false },
      { label: 'Apply for store business credit cards', done: false },
      { label: 'Apply for business Visa/Mastercard', done: false },
      { label: 'Keep utilization under 30%', done: false },
    ],
  },
  {
    id: 'ts7', step: 7, title: 'Tier 3 & Scale', description: 'Access advanced vendor accounts and larger credit lines',
    duration: 'Month 8-12', completed: false, active: false,
    tasks: [
      { label: 'Check Paydex score (target: 75+)', done: false },
      { label: 'Apply for Amazon Business Line of Credit', done: false },
      { label: 'Apply for Verizon Business', done: false },
      { label: 'Request credit limit increases', done: false },
      { label: 'Apply for business line of credit', done: false },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label, value, icon: Icon, color, subtext,
}: {
  label: string; value: string | number; icon: React.ComponentType<any>; color: string; subtext?: string;
}) {
  const numVal = typeof value === 'number' ? value : null;
  const animatedValue = useAnimatedCounter(numVal ?? 0);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="absolute right-3 top-3 rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">
        {numVal !== null ? animatedValue : value}
      </p>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Tracker                                                   */
/* ------------------------------------------------------------------ */

function ProgressTracker({ vendors }: { vendors: Vendor[] }) {
  const dunsObtained = true;
  const vendorsApplied = vendors.filter((v) => v.applied).length;
  const accountsOpened = vendors.filter((v) => v.approved).length;
  const reportingConfirmed = vendors.filter((v) => v.reporting).length;

  const steps = [
    { ...PROGRESS_STEPS[0], complete: dunsObtained, count: dunsObtained ? 1 : 0, total: 1 },
    { ...PROGRESS_STEPS[1], complete: vendorsApplied >= 5, count: vendorsApplied, total: 5 },
    { ...PROGRESS_STEPS[2], complete: accountsOpened >= 3, count: accountsOpened, total: 3 },
    { ...PROGRESS_STEPS[3], complete: reportingConfirmed >= 3, count: reportingConfirmed, total: 3 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Business Credit Progress</h2>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    step.complete
                      ? 'border-emerald-500 bg-emerald-500/15'
                      : 'border-border bg-muted'
                  }`}
                >
                  {step.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Icon className={`h-5 w-5 ${step.count > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <p className={`mt-2 text-center text-[10px] font-medium uppercase tracking-wider ${
                  step.complete ? 'text-emerald-400' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {step.count}/{step.total}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-full min-w-[20px] ${
                  step.complete ? 'bg-emerald-500/40' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DUNS Lookup Panel                                                  */
/* ------------------------------------------------------------------ */

function DunsLookupPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(true);
  const profile = MOCK_DUNS_PROFILE;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Hash className="h-4 w-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-foreground">D&B DUNS Lookup</h2>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business name or DUNS number..."
            className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-white/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-muted"
          />
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-500/15 px-4 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/25"
        >
          <Search className="h-4 w-4" />
          Lookup
        </button>
      </div>

      {/* DUNS Profile */}
      {showProfile && (
        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Building2 className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{profile.businessName}</p>
                <p className="text-[10px] text-muted-foreground">DUNS: {profile.dunsNumber}</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              {profile.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <ProfileField icon={Globe} label="Trade Name" value={profile.tradeName} />
            <ProfileField icon={MapPin} label="Address" value={profile.address} />
            <ProfileField icon={Phone} label="Phone" value={profile.phone} />
            <ProfileField icon={Calendar} label="Year Started" value={profile.yearStarted.toString()} />
            <ProfileField icon={Users} label="Employees" value={profile.employees.toString()} />
            <ProfileField icon={TrendingUp} label="Annual Revenue" value={profile.annualRevenue} />
            <ProfileField icon={Briefcase} label="SIC" value={profile.sic} />
            <ProfileField icon={Target} label="NAICS" value={profile.naics} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Paydex Score Gauge                                                 */
/* ------------------------------------------------------------------ */

function PaydexGauge({ score }: { score: number }) {
  const animatedScore = useAnimatedCounter(score);
  const percentage = (score / 100) * 100;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 70) return 'Good';
    if (s >= 50) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <circle
            cx="64" cy="64" r="60" fill="none"
            stroke={getScoreColor(score)} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{animatedScore}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Paydex</span>
        </div>
      </div>
      <span
        className="mt-2 text-xs font-semibold"
        style={{ color: getScoreColor(score) }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vendor Card                                                        */
/* ------------------------------------------------------------------ */

function VendorCard({
  vendor,
  onToggleApply,
}: {
  vendor: Vendor;
  onToggleApply: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diff = DIFFICULTY_CONFIG[vendor.difficulty];

  return (
    <div className="rounded-xl border border-border bg-card transition-all hover:border-border">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{vendor.name}</p>
            {vendor.reporting && (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[vendor.category]}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-[10px] text-muted-foreground">Net {vendor.netTerms}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-[10px] text-muted-foreground">{vendor.creditLimit}</span>
          </div>
        </div>

        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${diff.bg} ${diff.color}`}>
          {diff.label}
        </span>

        {vendor.approved ? (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
            Approved
          </span>
        ) : vendor.applied ? (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
            Pending
          </span>
        ) : (
          <button
            onClick={() => onToggleApply(vendor.id)}
            className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-400 transition-colors hover:bg-indigo-500/20"
          >
            Apply
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Requirements */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Requirements</p>
              <ul className="space-y-1">
                {vendor.requirements.map((req) => (
                  <li key={req} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-muted" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reports To */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reports To</p>
              <div className="flex flex-wrap gap-1">
                {vendor.reportsTo.map((bureau) => (
                  <span key={bureau} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {bureau}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">{vendor.notes}</p>
            </div>

            {/* Apply Link */}
            <div className="flex flex-col items-end justify-between">
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                Visit Website
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Credit Builder Timeline                                            */
/* ------------------------------------------------------------------ */

function CreditBuilderTimeline({ steps }: { steps: TimelineStep[] }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(
    steps.find((s) => s.active)?.id ?? null
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-foreground">Credit Builder Timeline</h2>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.id;
          const completedTasks = step.tasks.filter((t) => t.done).length;
          const totalTasks = step.tasks.length;
          const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={step.id}
              className={`rounded-lg border transition-all ${
                step.active
                  ? 'border-violet-500/20 bg-violet-500/[0.03]'
                  : step.completed
                    ? 'border-emerald-500/10 bg-muted'
                    : 'border-border bg-muted'
              }`}
            >
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                {/* Step number */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.completed
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : step.active
                        ? 'bg-violet-500/15 text-violet-400'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${step.completed ? 'text-emerald-400/80' : step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    {step.active && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{step.duration}</p>
                </div>

                {/* Task progress */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{completedTasks}/{totalTasks}</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        step.completed ? 'bg-emerald-500' : step.active ? 'bg-violet-500' : 'bg-muted'
                      }`}
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>

                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-3">
                  <p className="mb-3 text-xs text-muted-foreground">{step.description}</p>
                  <ul className="space-y-1.5">
                    {step.tasks.map((task, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {task.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        ) : (
                          <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-border" />
                        )}
                        <span className={`text-xs ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {task.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trade Reference Manager                                            */
/* ------------------------------------------------------------------ */

function TradeReferenceManager({
  refs,
  onAdd,
}: {
  refs: TradeReference[];
  onAdd: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-foreground">Trade References</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {refs.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Reference
        </button>
      </div>

      <div className="space-y-2">
        {refs.map((ref) => {
          const utilization = ref.creditLimit > 0 ? Math.round((ref.currentBalance / ref.creditLimit) * 100) : 0;

          return (
            <div key={ref.id} className="rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{ref.vendorName}</p>
                    <p className="text-[10px] text-muted-foreground">{ref.accountNumber} | Opened {new Date(ref.dateOpened).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  ref.status === 'active'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/20 bg-red-500/10 text-red-400'
                }`}>
                  {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Credit Limit</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">${ref.creditLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">${ref.currentBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Utilization</p>
                  <p className={`mt-0.5 text-sm font-semibold ${utilization <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {utilization}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reports To</p>
                  <div className="mt-0.5 flex gap-1">
                    {ref.reportsTo.map((b) => (
                      <span key={b} className="text-[10px] text-muted-foreground">{b}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment History Dots */}
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Payment History</p>
                <div className="flex gap-1">
                  {ref.paymentHistory.map((payment, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-sm ${
                        payment === 'on_time'
                          ? 'bg-emerald-500'
                          : payment === 'late_30'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      title={payment === 'on_time' ? 'On Time' : payment.replace('_', ' ')}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Credit Report Viewer                                               */
/* ------------------------------------------------------------------ */

function CreditReportViewer({ reports }: { reports: CreditReport[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-foreground">Business Credit Reports</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-border bg-muted p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{report.bureau}</p>
                <p className="text-[10px] text-muted-foreground">
                  Pulled {new Date(report.pullDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground">
                <Eye className="h-3.5 w-3.5" />
                View Full
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {report.paydexScore !== null && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paydex</p>
                  <p className={`mt-1 text-xl font-bold ${
                    report.paydexScore >= 80 ? 'text-emerald-400' : report.paydexScore >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {report.paydexScore}
                  </p>
                </div>
              )}
              {report.intelliscore !== null && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Intelliscore</p>
                  <p className="mt-1 text-xl font-bold text-blue-400">{report.intelliscore}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trade Lines</p>
                <p className="mt-1 text-xl font-bold text-foreground">{report.tradeLines}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Derogatory</p>
                <p className={`mt-1 text-xl font-bold ${report.derogatoryMarks === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {report.derogatoryMarks}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Utilization</p>
                <p className={`mt-1 text-xl font-bold ${
                  report.creditUtilization <= 30 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {report.creditUtilization}%
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment Index</p>
                <p className={`mt-1 text-xl font-bold ${
                  report.paymentIndex >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {report.paymentIndex}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Credit Stats Panel (real API data)                            */
/* ------------------------------------------------------------------ */

function LiveCreditStatsPanel({ stats }: { stats: CreditStatsData | null; loading: boolean; error: string | null }) {
  if (stats === null) return null;

  const { scoreDistribution, fundingPipeline, creditRepairQueue } = stats;
  const totalProfiles = Object.values(scoreDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-red-400" />
        <h2 className="text-sm font-semibold text-foreground">Platform Credit Intelligence</h2>
        <span className="ml-auto rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          Live
        </span>
      </div>

      {/* Score distribution */}
      <div className="mb-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score Distribution ({totalProfiles} profiles)</p>
        <div className="space-y-2">
          {[
            { label: 'Excellent (720+)', count: scoreDistribution.excellent, color: 'bg-emerald-500' },
            { label: 'Good (680-719)', count: scoreDistribution.good, color: 'bg-emerald-400' },
            { label: 'Fair (620-679)', count: scoreDistribution.fair, color: 'bg-amber-400' },
            { label: 'Poor (<620)', count: scoreDistribution.poor, color: 'bg-red-500' },
          ].map((tier) => {
            const pct = totalProfiles > 0 ? Math.round((tier.count / totalProfiles) * 100) : 0;
            return (
              <div key={tier.label} className="flex items-center gap-3">
                <p className="w-32 text-[10px] text-muted-foreground">{tier.label}</p>
                <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                  <div className={`h-full rounded-full ${tier.color}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="w-8 text-right text-[10px] text-muted-foreground">{tier.count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funding pipeline */}
      <div className="mb-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Funding Pipeline</p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Applied', value: fundingPipeline.applied, color: 'text-blue-400' },
            { label: 'Review', value: fundingPipeline.underReview, color: 'text-amber-400' },
            { label: 'Approved', value: fundingPipeline.approved, color: 'text-emerald-400' },
            { label: 'Funded', value: fundingPipeline.funded, color: 'text-emerald-500' },
            { label: 'Declined', value: fundingPipeline.declined, color: 'text-red-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted p-2 text-center">
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[9px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Credit repair queue */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Credit Repair Queue</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-muted p-2 text-center">
            <p className="text-lg font-bold text-foreground">{creditRepairQueue.usersRouted}</p>
            <p className="text-[9px] text-muted-foreground">Routed</p>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <p className="text-lg font-bold text-amber-400">{creditRepairQueue.activePrograms}</p>
            <p className="text-[9px] text-muted-foreground">Active</p>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <p className="text-lg font-bold text-indigo-400">{creditRepairQueue.avgTimelineWeeks}w</p>
            <p className="text-[9px] text-muted-foreground">Avg Timeline</p>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <p className="text-lg font-bold text-emerald-400">{creditRepairQueue.completionRate}%</p>
            <p className="text-[9px] text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Pulls Panel (real API data)                                 */
/* ------------------------------------------------------------------ */

function RecentPullsPanel({ pulls }: { pulls: CreditStatsData['recentPulls'] }) {
  if (!pulls || pulls.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Credit Pulls</h2>
        </div>
        <p className="text-xs text-muted-foreground">No credit pulls yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Recent Credit Pulls</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">{pulls.length} records</span>
      </div>
      <div className="space-y-2">
        {pulls.slice(0, 8).map((pull) => (
          <div key={pull.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{pull.contactName}</p>
              <p className="text-[10px] text-muted-foreground">{pull.tenant}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${
                pull.score >= 720 ? 'text-emerald-400' : pull.score >= 680 ? 'text-emerald-300' : pull.score >= 620 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {pull.score}
              </p>
              <p className="text-[9px] text-muted-foreground">{pull.category}</p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
              pull.decision === 'Funding Ready'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
            }`}>
              {pull.decision}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab Navigation                                                     */
/* ------------------------------------------------------------------ */

type TabKey = 'overview' | 'vendors' | 'timeline' | 'references' | 'reports';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'vendors', label: 'Net 30 Vendors', icon: Building2 },
  { key: 'timeline', label: 'Credit Builder', icon: Target },
  { key: 'references', label: 'Trade References', icon: Users },
  { key: 'reports', label: 'Reports', icon: FileText },
];

/* ------------------------------------------------------------------ */
/*  Dispatch Task Button                                               */
/* ------------------------------------------------------------------ */

function DispatchTaskButton() {
  const { post } = useApi();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleDispatch = async () => {
    setStatus('loading');
    setMessage('');
    const { data, error } = await post('/api/admin/command-center/dispatch', {
      task: 'Build business credit report',
    });
    if (error) {
      setStatus('error');
      setMessage(error);
    } else {
      setStatus('success');
      setMessage('Task dispatched successfully');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDispatch}
        disabled={status === 'loading'}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          status === 'success'
            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : status === 'error'
              ? 'border border-red-500/20 bg-red-500/10 text-red-400'
              : 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
        }`}
      >
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {status === 'success' ? 'Dispatched' : status === 'error' ? 'Failed' : 'Dispatch Task'}
      </button>
      {message && status === 'error' && (
        <span className="text-[10px] text-red-400">{message}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function BusinessCreditPage() {
  const { get } = useApi();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [tradeRefs] = useState<TradeReference[]>(MOCK_TRADE_REFS);
  const [filterDifficulty, setFilterDifficulty] = useState<VendorDifficulty | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<VendorCategory | 'all'>('all');

  /* ---- Real API state ---- */
  const [creditStats, setCreditStats] = useState<CreditStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      const { data, error } = await get<CreditStatsData>('/api/admin/credit/stats');
      if (error) {
        setStatsError(error);
      } else if (data) {
        setCreditStats(data);
      }
      setStatsLoading(false);
    }
    fetchStats();
  }, []);

  /* ---- Computed stats (real data overrides mock for available fields) ---- */
  const vendorsApplied = vendors.filter((v) => v.applied).length;
  const vendorsApproved = vendors.filter((v) => v.approved).length;
  const vendorsReporting = vendors.filter((v) => v.reporting).length;
  const paydexScore = MOCK_REPORTS.find((r) => r.paydexScore !== null)?.paydexScore ?? 0;
  const totalCreditLimit = tradeRefs.reduce((sum, r) => sum + r.creditLimit, 0);
  const totalBalance = tradeRefs.reduce((sum, r) => sum + r.currentBalance, 0);

  /* Real stats to surface in top cards (falls back to local mock counts) */
  const fundingReadyCount = creditStats?.fundingReadyUsers ?? 0;
  const approvalRate = creditStats?.approvalRate ?? 0;
  const creditPullsToday = creditStats?.creditPullsToday ?? 0;

  /* ---- Vendor apply handler ---- */
  const handleToggleApply = useCallback((id: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, applied: true } : v))
    );
  }, []);

  /* ---- Filtered vendors ---- */
  const filteredVendors = vendors.filter((v) => {
    if (filterDifficulty !== 'all' && v.difficulty !== filterDifficulty) return false;
    if (filterCategory !== 'all' && v.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Building2 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Business Credit Builder</h1>
              <p className="text-sm text-muted-foreground">Build and monitor your business credit profile</p>
            </div>
          </div>
          <DispatchTaskButton />
        </div>
      </div>

      {/* API error banner */}
      {statsError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <p className="text-xs text-red-400">Credit stats unavailable: {statsError}</p>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="mb-6">
        <ProgressTracker vendors={vendors} />
      </div>

      {/* Top Stats — mix of real API data and local mock counts */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Paydex Score" value={paydexScore} icon={Shield} color="#f59e0b" subtext="D&B" />
        <StatCard label="Vendors Applied" value={vendorsApplied} icon={FileText} color="#10b981" subtext={`of ${vendors.length}`} />
        <StatCard label="Accounts Open" value={vendorsApproved} icon={CreditCard} color="#10b981" />
        <StatCard label="Reporting" value={vendorsReporting} icon={CheckCircle2} color="#22c55e" subtext="Confirmed" />
        <StatCard
          label="Funding Ready"
          value={statsLoading ? '...' : fundingReadyCount}
          icon={TrendingUp}
          color="#f59e0b"
          subtext="Platform"
        />
        <StatCard
          label="Approval Rate"
          value={statsLoading ? '...' : `${approvalRate}%`}
          icon={BarChart3}
          color="#ef4444"
          subtext={statsLoading ? 'Loading...' : `${creditPullsToday} pulls today`}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Paydex + DUNS */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Paydex Score */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-foreground">Paydex Score Tracker</h2>
              </div>
              <div className="flex items-center justify-center py-4">
                <PaydexGauge score={paydexScore} />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { range: '0-49', label: 'High Risk', color: 'bg-red-500' },
                  { range: '50-69', label: 'Medium Risk', color: 'bg-amber-500' },
                  { range: '70-79', label: 'Low Risk', color: 'bg-emerald-400' },
                  { range: '80-100', label: 'Excellent', color: 'bg-emerald-500' },
                ].map((tier) => (
                  <div key={tier.range} className="rounded-lg bg-muted p-2 text-center">
                    <div className={`mx-auto mb-1 h-1.5 w-8 rounded-full ${tier.color}`} />
                    <p className="text-[10px] font-semibold text-muted-foreground">{tier.range}</p>
                    <p className="text-[9px] text-muted-foreground">{tier.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DUNS Lookup */}
            <DunsLookupPanel />
          </div>

          {/* Live API data panels */}
          {creditStats && !statsLoading && (
            <div className="grid gap-6 lg:grid-cols-2">
              <LiveCreditStatsPanel stats={creditStats} loading={statsLoading} error={statsError} />
              <RecentPullsPanel pulls={creditStats.recentPulls} />
            </div>
          )}

          {/* Loading skeleton for live panels */}
          {statsLoading && (
            <div className="grid gap-6 lg:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="h-8 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Reports + Recent Activity (mock data, educational) */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CreditReportViewer reports={MOCK_REPORTS} />

            {/* Recent Vendor Activity */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Recent Vendor Activity</h2>
              </div>
              <div className="space-y-2">
                {[
                  { text: 'Grainger payment received - $450.00', time: '2 days ago', icon: CheckCircle2, color: 'text-emerald-400' },
                  { text: 'Uline reporting confirmed to D&B', time: '5 days ago', icon: Shield, color: 'text-indigo-400' },
                  { text: 'Quill credit limit increased to $1,500', time: '1 week ago', icon: TrendingUp, color: 'text-amber-400' },
                  { text: 'Summa Office Supplies application submitted', time: '1 week ago', icon: FileText, color: 'text-violet-400' },
                  { text: 'Strategic Network Solutions application submitted', time: '2 weeks ago', icon: FileText, color: 'text-violet-400' },
                  { text: 'Grainger account approved - $5,000 limit', time: '3 weeks ago', icon: CheckCircle2, color: 'text-emerald-400' },
                  { text: 'Paydex score updated: 72 (+4)', time: '1 month ago', icon: TrendingUp, color: 'text-indigo-400' },
                  { text: 'Quill reporting confirmed to D&B', time: '1 month ago', icon: Shield, color: 'text-indigo-400' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
                      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{item.text}</p>
                        <p className="text-[10px] text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {/* Vendor Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-medium text-muted-foreground">Filter:</span>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as VendorDifficulty | 'all')}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground outline-none"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as VendorCategory | 'all')}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground outline-none"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <span className="ml-auto text-xs text-muted-foreground">
              {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Vendor List */}
          <div className="space-y-2">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} onToggleApply={handleToggleApply} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <CreditBuilderTimeline steps={MOCK_TIMELINE} />
      )}

      {activeTab === 'references' && (
        <TradeReferenceManager
          refs={tradeRefs}
          onAdd={() => alert('Add trade reference dialog would open here')}
        />
      )}

      {activeTab === 'reports' && (
        <CreditReportViewer reports={MOCK_REPORTS} />
      )}
    </div>
  );
}

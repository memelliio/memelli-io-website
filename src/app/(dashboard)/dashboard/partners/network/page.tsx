'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Clock,
  Percent,
  Network,
  Trophy,
  Link2,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Star,
  Crown,
  Zap,
  Shield,
  Gift,
  CreditCard,
  FileText,
  Code,
  Image,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Affiliate {
  id: string;
  name: string;
  email: string;
  tier: 'Lite' | 'Pro';
  referrals: number;
  conversions: number;
  earnings: number;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  avatar?: string;
  code: string;
  phone?: string;
  conversionRate: number;
  pendingBalance: number;
  lastActive: string;
}

interface Referral {
  id: string;
  affiliateId: string;
  affiliateName: string;
  referredUser: string;
  referredEmail: string;
  signupDate: string;
  conversionStatus: 'pending' | 'converted' | 'expired' | 'cancelled';
  commissionAmount: number;
  source: string;
}

interface Commission {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  type: 'signup' | 'sale' | 'recurring';
  status: 'pending' | 'paid' | 'cancelled';
  date: string;
  referralId: string;
  description: string;
}

interface Payout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  status: 'processing' | 'completed' | 'failed';
  date: string;
  method: string;
  transactionId?: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_AFFILIATES: Affiliate[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', tier: 'Pro', referrals: 142, conversions: 89, earnings: 12450.00, status: 'active', joinDate: '2025-08-15', code: 'SARAH2025', conversionRate: 62.7, pendingBalance: 1250.00, lastActive: '2026-03-14' },
  { id: '2', name: 'Marcus Rivera', email: 'marcus@example.com', tier: 'Pro', referrals: 98, conversions: 71, earnings: 9875.50, status: 'active', joinDate: '2025-09-02', code: 'MARCUS25', conversionRate: 72.4, pendingBalance: 875.00, lastActive: '2026-03-15' },
  { id: '3', name: 'Alex Thompson', email: 'alex@example.com', tier: 'Lite', referrals: 67, conversions: 34, earnings: 3400.00, status: 'active', joinDate: '2025-10-20', code: 'ALEX2025', conversionRate: 50.7, pendingBalance: 450.00, lastActive: '2026-03-13' },
  { id: '4', name: 'Jessica Park', email: 'jessica@example.com', tier: 'Pro', referrals: 234, conversions: 178, earnings: 24850.75, status: 'active', joinDate: '2025-06-10', code: 'JPARK25', conversionRate: 76.1, pendingBalance: 3200.00, lastActive: '2026-03-15' },
  { id: '5', name: 'David Kim', email: 'david@example.com', tier: 'Lite', referrals: 45, conversions: 22, earnings: 2200.00, status: 'active', joinDate: '2025-11-05', code: 'DKIM25', conversionRate: 48.9, pendingBalance: 300.00, lastActive: '2026-03-12' },
  { id: '6', name: 'Emma Wilson', email: 'emma@example.com', tier: 'Pro', referrals: 189, conversions: 134, earnings: 18725.00, status: 'active', joinDate: '2025-07-22', code: 'EMMA2025', conversionRate: 70.9, pendingBalance: 2100.00, lastActive: '2026-03-15' },
  { id: '7', name: 'James Brown', email: 'james@example.com', tier: 'Lite', referrals: 23, conversions: 8, earnings: 800.00, status: 'inactive', joinDate: '2025-12-01', code: 'JBROWN25', conversionRate: 34.8, pendingBalance: 0, lastActive: '2026-02-10' },
  { id: '8', name: 'Olivia Martinez', email: 'olivia@example.com', tier: 'Pro', referrals: 156, conversions: 112, earnings: 15680.00, status: 'active', joinDate: '2025-08-30', code: 'OLIV25', conversionRate: 71.8, pendingBalance: 1890.00, lastActive: '2026-03-14' },
  { id: '9', name: 'Ryan Lee', email: 'ryan@example.com', tier: 'Lite', referrals: 34, conversions: 15, earnings: 1500.00, status: 'pending', joinDate: '2026-01-15', code: 'RYAN26', conversionRate: 44.1, pendingBalance: 200.00, lastActive: '2026-03-11' },
  { id: '10', name: 'Nina Patel', email: 'nina@example.com', tier: 'Pro', referrals: 278, conversions: 201, earnings: 28140.00, status: 'active', joinDate: '2025-05-18', code: 'NINA2025', conversionRate: 72.3, pendingBalance: 4500.00, lastActive: '2026-03-15' },
];

const MOCK_REFERRALS: Referral[] = [
  { id: 'r1', affiliateId: '4', affiliateName: 'Jessica Park', referredUser: 'Tom Harris', referredEmail: 'tom@example.com', signupDate: '2026-03-14', conversionStatus: 'converted', commissionAmount: 125.00, source: 'Direct Link' },
  { id: 'r2', affiliateId: '10', affiliateName: 'Nina Patel', referredUser: 'Lisa Chang', referredEmail: 'lisa@example.com', signupDate: '2026-03-14', conversionStatus: 'pending', commissionAmount: 0, source: 'Social Media' },
  { id: 'r3', affiliateId: '1', affiliateName: 'Sarah Chen', referredUser: 'Mike Johnson', referredEmail: 'mike@example.com', signupDate: '2026-03-13', conversionStatus: 'converted', commissionAmount: 87.50, source: 'Email Campaign' },
  { id: 'r4', affiliateId: '6', affiliateName: 'Emma Wilson', referredUser: 'Anna White', referredEmail: 'anna@example.com', signupDate: '2026-03-13', conversionStatus: 'expired', commissionAmount: 0, source: 'Blog Post' },
  { id: 'r5', affiliateId: '2', affiliateName: 'Marcus Rivera', referredUser: 'Chris Davis', referredEmail: 'chris@example.com', signupDate: '2026-03-12', conversionStatus: 'converted', commissionAmount: 150.00, source: 'QR Code' },
  { id: 'r6', affiliateId: '8', affiliateName: 'Olivia Martinez', referredUser: 'Jake Moore', referredEmail: 'jake@example.com', signupDate: '2026-03-12', conversionStatus: 'pending', commissionAmount: 0, source: 'Direct Link' },
  { id: 'r7', affiliateId: '4', affiliateName: 'Jessica Park', referredUser: 'Sam Taylor', referredEmail: 'sam@example.com', signupDate: '2026-03-11', conversionStatus: 'converted', commissionAmount: 125.00, source: 'Webinar' },
  { id: 'r8', affiliateId: '10', affiliateName: 'Nina Patel', referredUser: 'Rachel Green', referredEmail: 'rachel@example.com', signupDate: '2026-03-11', conversionStatus: 'cancelled', commissionAmount: 0, source: 'Social Media' },
];

const MOCK_COMMISSIONS: Commission[] = [
  { id: 'c1', affiliateId: '4', affiliateName: 'Jessica Park', amount: 125.00, type: 'signup', status: 'paid', date: '2026-03-14', referralId: 'r1', description: 'New user signup commission' },
  { id: 'c2', affiliateId: '10', affiliateName: 'Nina Patel', amount: 250.00, type: 'sale', status: 'pending', date: '2026-03-14', referralId: 'r2', description: 'Pro plan purchase' },
  { id: 'c3', affiliateId: '1', affiliateName: 'Sarah Chen', amount: 87.50, type: 'signup', status: 'paid', date: '2026-03-13', referralId: 'r3', description: 'New user signup commission' },
  { id: 'c4', affiliateId: '6', affiliateName: 'Emma Wilson', amount: 175.00, type: 'recurring', status: 'paid', date: '2026-03-13', referralId: 'r4', description: 'Monthly recurring commission' },
  { id: 'c5', affiliateId: '2', affiliateName: 'Marcus Rivera', amount: 150.00, type: 'sale', status: 'pending', date: '2026-03-12', referralId: 'r5', description: 'Enterprise plan upgrade' },
  { id: 'c6', affiliateId: '8', affiliateName: 'Olivia Martinez', amount: 100.00, type: 'signup', status: 'paid', date: '2026-03-12', referralId: 'r6', description: 'New user signup commission' },
  { id: 'c7', affiliateId: '4', affiliateName: 'Jessica Park', amount: 300.00, type: 'sale', status: 'cancelled', date: '2026-03-11', referralId: 'r7', description: 'Refunded purchase' },
  { id: 'c8', affiliateId: '10', affiliateName: 'Nina Patel', amount: 175.00, type: 'recurring', status: 'paid', date: '2026-03-11', referralId: 'r8', description: 'Monthly recurring commission' },
];

const MOCK_PAYOUTS: Payout[] = [
  { id: 'p1', affiliateId: '4', affiliateName: 'Jessica Park', amount: 5000.00, status: 'completed', date: '2026-03-01', method: 'Bank Transfer', transactionId: 'TXN-2026-0301-JP' },
  { id: 'p2', affiliateId: '10', affiliateName: 'Nina Patel', amount: 4200.00, status: 'completed', date: '2026-03-01', method: 'PayPal', transactionId: 'TXN-2026-0301-NP' },
  { id: 'p3', affiliateId: '6', affiliateName: 'Emma Wilson', amount: 3500.00, status: 'processing', date: '2026-03-15', method: 'Bank Transfer' },
  { id: 'p4', affiliateId: '1', affiliateName: 'Sarah Chen', amount: 2800.00, status: 'completed', date: '2026-03-01', method: 'Bank Transfer', transactionId: 'TXN-2026-0301-SC' },
  { id: 'p5', affiliateId: '2', affiliateName: 'Marcus Rivera', amount: 2100.00, status: 'completed', date: '2026-02-01', method: 'PayPal', transactionId: 'TXN-2026-0201-MR' },
  { id: 'p6', affiliateId: '8', affiliateName: 'Olivia Martinez', amount: 1890.00, status: 'processing', date: '2026-03-15', method: 'Bank Transfer' },
];

/* ------------------------------------------------------------------ */
/*  Growth Chart Data (12 months)                                      */
/* ------------------------------------------------------------------ */

const GROWTH_DATA = [
  { month: 'Apr', affiliates: 12, referrals: 45 },
  { month: 'May', affiliates: 18, referrals: 78 },
  { month: 'Jun', affiliates: 24, referrals: 112 },
  { month: 'Jul', affiliates: 35, referrals: 156 },
  { month: 'Aug', affiliates: 48, referrals: 210 },
  { month: 'Sep', affiliates: 62, referrals: 289 },
  { month: 'Oct', affiliates: 78, referrals: 345 },
  { month: 'Nov', affiliates: 95, referrals: 420 },
  { month: 'Dec', affiliates: 112, referrals: 510 },
  { month: 'Jan', affiliates: 128, referrals: 598 },
  { month: 'Feb', affiliates: 145, referrals: 702 },
  { month: 'Mar', affiliates: 164, referrals: 812 },
];

const REFERRAL_SOURCES = [
  { source: 'Direct Link', count: 342, percent: 42 },
  { source: 'Social Media', count: 215, percent: 26 },
  { source: 'Email Campaign', count: 130, percent: 16 },
  { source: 'Blog Post', count: 73, percent: 9 },
  { source: 'QR Code', count: 52, percent: 7 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtNumber = (n: number) => n.toLocaleString('en-US');

/* ------------------------------------------------------------------ */
/*  Animated Counter Hook                                              */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, duration = 1200, decimals = 0): string {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  if (decimals > 0) {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return Math.round(value).toLocaleString('en-US');
}

/* ------------------------------------------------------------------ */
/*  Stat Card Component                                                */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  prefix = '',
  suffix = '',
  decimals = 0,
  accent = 'red',
}: {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent?: string;
}) {
  const animated = useAnimatedCounter(value, 1400, decimals);
  const accentColors: Record<string, string> = {
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-primary/20 text-primary',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
  };

  const colors = accentColors[accent] || accentColors.red;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 group hover:border-white/[0.1] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, rgba(239,68,68,0.03), transparent)` }} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-2">{label}</p>
          <p className="text-2xl font-bold text-white/90 tracking-tight tabular-nums">
            {prefix}{animated}{suffix}
          </p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${colors} p-2.5 shadow-lg`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG Line Chart Component                                           */
/* ------------------------------------------------------------------ */

function GrowthChart({ data }: { data: typeof GROWTH_DATA }) {
  const width = 720;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxReferrals = Math.max(...data.map((d) => d.referrals));
  const maxAffiliates = Math.max(...data.map((d) => d.affiliates));
  const maxY = Math.max(maxReferrals, maxAffiliates) * 1.1;

  const toX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padding.top + chartH - (v / maxY) * chartH;

  const refPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.referrals)}`).join(' ');
  const affPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.affiliates)}`).join(' ');

  const refArea = `${refPath} L ${toX(data.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="refGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(239,68,68)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(239,68,68)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <g key={pct}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + chartH * (1 - pct)}
            y2={padding.top + chartH * (1 - pct)}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={padding.top + chartH * (1 - pct) + 4}
            fill="rgba(255,255,255,0.2)"
            fontSize="10"
            textAnchor="end"
          >
            {Math.round(maxY * pct)}
          </text>
        </g>
      ))}

      {/* Month labels */}
      {data.map((d, i) => (
        <text
          key={d.month}
          x={toX(i)}
          y={height - 6}
          fill="rgba(255,255,255,0.25)"
          fontSize="10"
          textAnchor="middle"
        >
          {d.month}
        </text>
      ))}

      {/* Area fill */}
      <path d={refArea} fill="url(#refGrad)" />

      {/* Lines */}
      <path d={refPath} fill="none" stroke="rgb(239,68,68)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={affPath} fill="none" stroke="rgb(147,197,253)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />

      {/* Dots */}
      {data.map((d, i) => (
        <g key={`dots-${i}`}>
          <circle cx={toX(i)} cy={toY(d.referrals)} r="3" fill="rgb(239,68,68)" />
          <circle cx={toX(i)} cy={toY(d.affiliates)} r="3" fill="rgb(147,197,253)" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab Button                                                         */
/* ------------------------------------------------------------------ */

type TabId = 'overview' | 'affiliates' | 'referrals' | 'commissions' | 'payouts' | 'links' | 'tiers';

function TabButton({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
  active: boolean;
  onClick: (id: TabId) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Glass Card                                                         */
/* ------------------------------------------------------------------ */

function GlassCard({
  children,
  className = '',
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.15)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div>
            {title && <h3 className="text-sm font-semibold text-white/85 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Network Overview Tab                                               */
/* ------------------------------------------------------------------ */

function OverviewTab() {
  const top10 = [...MOCK_AFFILIATES].sort((a, b) => b.earnings - a.earnings).slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Growth Chart */}
      <GlassCard title="Network Growth" subtitle="Affiliates & referrals over 12 months" className="lg:col-span-2">
        <div className="p-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-red-500" />
              <span className="text-xs text-white/40">Referrals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 border-t-2 border-dashed border-blue-300" />
              <span className="text-xs text-white/40">Affiliates</span>
            </div>
          </div>
          <GrowthChart data={GROWTH_DATA} />
        </div>
      </GlassCard>

      {/* Top 10 Leaderboard */}
      <GlassCard title="Top 10 Affiliates" subtitle="By total earnings">
        <div className="divide-y divide-white/[0.03]">
          {top10.map((aff, idx) => (
            <div key={aff.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors duration-200">
              <div className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${
                idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                'bg-white/[0.04] text-white/30'
              }`}>
                {idx < 3 ? <Trophy className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85 truncate">{aff.name}</p>
                <p className="text-[11px] text-white/30">{aff.referrals} referrals</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">{fmtCurrency(aff.earnings)}</p>
                <p className="text-[11px] text-white/30">{aff.conversionRate}%</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Referral Source Breakdown */}
      <GlassCard title="Referral Sources" subtitle="Traffic origin breakdown" className="lg:col-span-3">
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {REFERRAL_SOURCES.map((src) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-primary/80'];
              const idx = REFERRAL_SOURCES.indexOf(src);
              return (
                <div key={src.source} className="relative">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] transition-all duration-200">
                    <p className="text-xs text-white/40 mb-1">{src.source}</p>
                    <p className="text-xl font-bold text-white/90 tabular-nums">{fmtNumber(src.count)}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[idx]} transition-all duration-1000`}
                        style={{ width: `${src.percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-white/30 mt-1.5">{src.percent}% of total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Affiliates Tab                                                     */
/* ------------------------------------------------------------------ */

function AffiliatesTab() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK_AFFILIATES.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter && a.tier !== tierFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [search, tierFilter, statusFilter]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      inactive: 'bg-muted text-muted-foreground border-border',
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    };
    return map[status] || map.pending;
  };

  return (
    <GlassCard>
      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap p-5 border-b border-white/[0.04]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search affiliates..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white/85 placeholder:text-white/20 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200 backdrop-blur-xl"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2.5 text-sm text-white/85 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
        >
          <option value="">All Tiers</option>
          <option value="Lite">Lite</option>
          <option value="Pro">Pro</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2.5 text-sm text-white/85 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
        <span className="text-xs text-white/30">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Name</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Tier</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Referrals</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Conversions</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Earnings</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Join Date</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.map((aff) => (
              <>
                <tr
                  key={aff.id}
                  onClick={() => setExpandedId(expandedId === aff.id ? null : aff.id)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors duration-200"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white/85">{aff.name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{aff.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      aff.tier === 'Pro'
                        ? 'bg-red-500/15 text-red-400 border-red-500/25'
                        : 'bg-white/[0.04] text-white/50 border-white/[0.08]'
                    }`}>
                      {aff.tier === 'Pro' ? <Crown className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                      {aff.tier}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/70 tabular-nums">{fmtNumber(aff.referrals)}</td>
                  <td className="px-5 py-4 text-white/70 tabular-nums">{fmtNumber(aff.conversions)}</td>
                  <td className="px-5 py-4 text-emerald-400 font-medium tabular-nums">{fmtCurrency(aff.earnings)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(aff.status)}`}>
                      {aff.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/40 text-sm">{fmtDate(aff.joinDate)}</td>
                  <td className="px-5 py-4">
                    <ChevronDown className={`h-4 w-4 text-white/20 transition-transform duration-200 ${expandedId === aff.id ? 'rotate-180' : ''}`} />
                  </td>
                </tr>
                {expandedId === aff.id && (
                  <tr key={`${aff.id}-detail`}>
                    <td colSpan={8} className="bg-white/[0.01] border-b border-white/[0.04]">
                      <div className="px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
                          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Conversion Rate</p>
                          <p className="text-lg font-semibold text-white/90">{aff.conversionRate}%</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
                          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Pending Balance</p>
                          <p className="text-lg font-semibold text-amber-400">{fmtCurrency(aff.pendingBalance)}</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
                          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Affiliate Code</p>
                          <p className="text-sm font-mono text-red-300">{aff.code}</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
                          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Last Active</p>
                          <p className="text-sm text-white/70">{fmtDate(aff.lastActive)}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Users className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No affiliates match your filters</p>
        </div>
      )}
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Referrals Tab                                                      */
/* ------------------------------------------------------------------ */

function ReferralsTab() {
  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ComponentType<any> }> = {
      converted: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', icon: CheckCircle },
      pending: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', icon: Clock },
      expired: { color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
      cancelled: { color: 'bg-red-500/15 text-red-400 border-red-500/25', icon: XCircle },
    };
    const cfg = map[status] || map.pending;
    const IconComponent = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <GlassCard title="Referral Tracking" subtitle="All referrals across your network">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Source Affiliate</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Referred User</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Signup Date</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Source</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {MOCK_REFERRALS.map((ref) => (
              <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                <td className="px-5 py-4">
                  <p className="font-medium text-white/85">{ref.affiliateName}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-white/70">{ref.referredUser}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{ref.referredEmail}</p>
                </td>
                <td className="px-5 py-4 text-white/40">{fmtDate(ref.signupDate)}</td>
                <td className="px-5 py-4">
                  <span className="text-xs text-white/50 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1">
                    {ref.source}
                  </span>
                </td>
                <td className="px-5 py-4">{statusBadge(ref.conversionStatus)}</td>
                <td className="px-5 py-4 text-emerald-400 font-medium tabular-nums">
                  {ref.commissionAmount > 0 ? fmtCurrency(ref.commissionAmount) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Commissions Tab                                                    */
/* ------------------------------------------------------------------ */

function CommissionsTab() {
  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      signup: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      sale: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      recurring: 'bg-primary/80/15 text-primary border-primary/25',
    };
    return map[type] || '';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    return map[status] || '';
  };

  return (
    <GlassCard title="Commission Log" subtitle="All commissions across your network">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Affiliate</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Amount</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Type</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Description</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {MOCK_COMMISSIONS.map((comm) => (
              <tr key={comm.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                <td className="px-5 py-4 font-medium text-white/85">{comm.affiliateName}</td>
                <td className="px-5 py-4 text-emerald-400 font-semibold tabular-nums">{fmtCurrency(comm.amount)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeBadge(comm.type)}`}>
                    {comm.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-white/50 text-sm max-w-[200px] truncate">{comm.description}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(comm.status)}`}>
                    {comm.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-white/40">{fmtDate(comm.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Payouts Tab                                                        */
/* ------------------------------------------------------------------ */

function PayoutsTab() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === MOCK_PAYOUTS.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(MOCK_PAYOUTS.map((p) => p.id)));
    }
  };

  const exportCSV = () => {
    const headers = ['Affiliate', 'Amount', 'Status', 'Date', 'Method', 'Transaction ID'];
    const rows = MOCK_PAYOUTS.map((p) => [p.affiliateName, p.amount.toString(), p.status, p.date, p.method, p.transactionId || '']);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payouts-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      processing: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      failed: 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    return map[status] || '';
  };

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/60 hover:border-white/[0.1] hover:text-white/85 transition-all duration-200 backdrop-blur-xl"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        {selectedIds.size > 0 && (
          <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Send className="h-4 w-4" />
            Bulk Payout ({selectedIds.size} selected)
          </button>
        )}
      </div>

      <GlassCard title="Payout History" subtitle="Track all affiliate payouts">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === MOCK_PAYOUTS.length}
                    onChange={toggleAll}
                    className="rounded border-white/20 bg-white/[0.04] text-red-500 focus:ring-red-500/30"
                  />
                </th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Affiliate</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Amount</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Status</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Date</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Method</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-white/30 font-medium">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {MOCK_PAYOUTS.map((payout) => (
                <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(payout.id)}
                      onChange={() => toggleSelect(payout.id)}
                      className="rounded border-white/20 bg-white/[0.04] text-red-500 focus:ring-red-500/30"
                    />
                  </td>
                  <td className="px-5 py-4 font-medium text-white/85">{payout.affiliateName}</td>
                  <td className="px-5 py-4 text-emerald-400 font-semibold tabular-nums">{fmtCurrency(payout.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/40">{fmtDate(payout.date)}</td>
                  <td className="px-5 py-4 text-white/50">{payout.method}</td>
                  <td className="px-5 py-4 text-white/30 font-mono text-xs">{payout.transactionId || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Links & Assets Tab                                                 */
/* ------------------------------------------------------------------ */

function LinksAssetsTab() {
  const [copied, setCopied] = useState<string | null>(null);
  const [affiliateCode, setAffiliateCode] = useState('PARTNER2026');
  const [generatedLink, setGeneratedLink] = useState('');

  const baseUrl = 'https://memelli.com';

  const generateLink = () => {
    setGeneratedLink(`${baseUrl}?ref=${affiliateCode}`);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const embedCode = `<a href="${baseUrl}?ref=${affiliateCode}" target="_blank">
  <img src="${baseUrl}/assets/partner-badge.png" alt="Powered by Memelli" width="200" />
</a>`;

  const marketingAssets = [
    { name: 'Partner Badge (PNG)', size: '24 KB', icon: Image },
    { name: 'Banner 728x90', size: '45 KB', icon: Image },
    { name: 'Banner 300x250', size: '38 KB', icon: Image },
    { name: 'Brand Guidelines (PDF)', size: '2.1 MB', icon: FileText },
    { name: 'Social Media Kit', size: '8.5 MB', icon: Image },
    { name: 'Email Templates', size: '156 KB', icon: FileText },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Link Generator */}
      <GlassCard title="Affiliate Link Generator" subtitle="Create tracked referral links">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">Affiliate Code</label>
            <input
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white/85 font-mono placeholder:text-white/20 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200 backdrop-blur-xl"
              placeholder="Enter affiliate code"
            />
          </div>
          <button
            onClick={generateLink}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Link2 className="h-4 w-4" />
            Generate Link
          </button>
          {generatedLink && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
              <p className="text-xs text-white/40 mb-2">Your referral link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-red-300 font-mono bg-background rounded-lg px-3 py-2 truncate">
                  {generatedLink}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedLink, 'link')}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 hover:bg-white/[0.08] transition-all duration-200"
                >
                  {copied === 'link' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/40" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* QR Code Generator */}
      <GlassCard title="QR Code Generator" subtitle="Generate scannable referral QR codes">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-2xl border border-white/[0.08] bg-white p-4">
              {/* Stylized QR code placeholder */}
              <div className="w-40 h-40 grid grid-cols-8 grid-rows-8 gap-0.5">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isCorner = (row < 3 && col < 3) || (row < 3 && col > 4) || (row > 4 && col < 3);
                  const isData = Math.random() > 0.4;
                  return (
                    <div
                      key={i}
                      className={`rounded-[1px] ${
                        isCorner ? 'bg-background' : isData ? 'bg-background' : 'bg-white'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-white/30">
            QR code for: <span className="text-red-300 font-mono">{affiliateCode}</span>
          </p>
          <div className="flex gap-3">
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/60 hover:border-white/[0.1] hover:text-white/85 transition-all duration-200">
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/60 hover:border-white/[0.1] hover:text-white/85 transition-all duration-200">
              <Download className="h-4 w-4" />
              Download SVG
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Marketing Assets */}
      <GlassCard title="Marketing Assets" subtitle="Downloadable resources for affiliates">
        <div className="divide-y divide-white/[0.03]">
          {marketingAssets.map((asset) => (
            <div key={asset.name} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors duration-200">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5">
                <asset.icon className="h-4 w-4 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">{asset.name}</p>
                <p className="text-[11px] text-white/30">{asset.size}</p>
              </div>
              <button className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 hover:bg-white/[0.06] transition-all duration-200">
                <Download className="h-4 w-4 text-white/40" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Embed Code */}
      <GlassCard title="Embed Code" subtitle="Add partner badge to websites">
        <div className="p-6 space-y-4">
          <div className="relative">
            <pre className="rounded-xl bg-background border border-white/[0.06] p-4 text-xs text-white/50 font-mono overflow-x-auto leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={() => copyToClipboard(embedCode, 'embed')}
              className="absolute top-3 right-3 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1.5 hover:bg-white/[0.08] transition-all duration-200"
            >
              {copied === 'embed' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-white/40" />}
            </button>
          </div>
          <p className="text-xs text-white/30">
            Copy and paste this code into any HTML page to display your partner badge with tracking.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiers Tab                                                          */
/* ------------------------------------------------------------------ */

function TiersTab() {
  const tiers = [
    {
      name: 'Lite',
      price: 'Free',
      priceNote: 'No monthly fee',
      commission: '10%',
      icon: Zap,
      color: 'from-zinc-500/20 to-zinc-600/5 border-border',
      iconColor: 'text-foreground',
      features: [
        'Basic referral link',
        '10% commission on signups',
        'Standard reporting dashboard',
        'Email support',
        'Monthly payouts',
        'Basic marketing assets',
      ],
      limits: [
        'No recurring commissions',
        'No priority support',
        'No custom landing pages',
      ],
    },
    {
      name: 'Pro',
      price: '$49/mo',
      priceNote: 'Billed monthly',
      commission: '25%',
      icon: Crown,
      color: 'from-red-500/20 to-red-600/5 border-red-500/30',
      iconColor: 'text-red-400',
      popular: true,
      features: [
        'Custom referral links & QR codes',
        '25% commission on all revenue',
        'Recurring commission on subscriptions',
        'Advanced analytics dashboard',
        'Priority support (24h response)',
        'Custom landing pages',
        'Premium marketing assets',
        'Weekly payouts',
        'Dedicated account manager',
        'API access for integrations',
      ],
      limits: [],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`relative rounded-2xl border bg-gradient-to-br ${tier.color} backdrop-blur-xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.15)] ${
            tier.popular ? 'ring-1 ring-red-500/30' : ''
          }`}
        >
          {tier.popular && (
            <div className="absolute top-0 right-6 bg-red-600 text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-b-lg shadow-lg">
              Most Popular
            </div>
          )}

          <div className="p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`rounded-xl bg-white/[0.06] p-3 ${tier.iconColor}`}>
                <tier.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white/90">{tier.name}</h3>
                <p className="text-sm text-white/40 mt-0.5">{tier.priceNote}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white/90">{tier.price}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-semibold text-red-400">{tier.commission}</span>
                <span className="text-sm text-white/40">commission rate</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {tier.features.map((feat) => (
                <div key={feat} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/70">{feat}</span>
                </div>
              ))}
              {tier.limits.map((limit) => (
                <div key={limit} className="flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-white/20 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/30">{limit}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                tier.popular
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.25)]'
                  : 'border border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white/90'
              }`}
            >
              {tier.popular ? 'Upgrade to Pro' : 'Get Started Free'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AffiliateNetworkPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  /* ---- API Data ---- */
  const { data: apiPartners, isError } = useApiQuery<any>(
    ['partners-network'],
    '/api/partners'
  );
  const isDemo = isError || !apiPartners;

  /* Map API partners into local shape, fall back to mocks */
  const affiliates: Affiliate[] = useMemo(() => {
    const raw = Array.isArray(apiPartners) ? apiPartners : (apiPartners as any)?.data;
    if (!Array.isArray(raw) || raw.length === 0) return MOCK_AFFILIATES;
    return raw.map((p: any) => ({
      id: p.id,
      name: p.name ?? 'Unknown',
      email: p.email ?? '',
      tier: p.tier === 'PREMIUM_AFFILIATE' || p.tier === 'RESELLER' || p.tier === 'WHITE_LABEL' ? 'Pro' as const : 'Lite' as const,
      referrals: Number(p.totalReferrals ?? 0),
      conversions: Number(p.totalConversions ?? 0),
      earnings: Number(p.totalEarnings ?? 0),
      status: (p.status ?? 'ACTIVE').toLowerCase() === 'active' ? 'active' as const : p.status?.toLowerCase() === 'pending' ? 'pending' as const : 'inactive' as const,
      joinDate: p.createdAt ?? '',
      code: p.referralCode ?? p.id?.slice(0, 8).toUpperCase() ?? '',
      conversionRate: Number(p.totalReferrals ?? 0) > 0 ? (Number(p.totalConversions ?? 0) / Number(p.totalReferrals ?? 1)) * 100 : 0,
      pendingBalance: Number(p.pendingBalance ?? 0),
      lastActive: p.updatedAt ?? p.createdAt ?? '',
    }));
  }, [apiPartners]);

  /* Computed stats */
  const totalAffiliates = affiliates.length;
  const activeThisMonth = affiliates.filter((a) => a.status === 'active' && new Date(a.lastActive).getMonth() === new Date().getMonth()).length;
  const totalReferrals = affiliates.reduce((s, a) => s + a.referrals, 0);
  const totalCommissionsPaid = MOCK_COMMISSIONS.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const pendingPayouts = affiliates.reduce((s, a) => s + a.pendingBalance, 0);
  const overallConversionRate = affiliates.reduce((s, a) => s + a.conversions, 0) / Math.max(totalReferrals, 1) * 100;

  const tabs: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'overview', label: 'Network Overview', icon: Network },
    { id: 'affiliates', label: 'Affiliates', icon: Users },
    { id: 'referrals', label: 'Referrals', icon: UserPlus },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
    { id: 'payouts', label: 'Payouts', icon: CreditCard },
    { id: 'links', label: 'Links & Assets', icon: Link2 },
    { id: 'tiers', label: 'Tiers', icon: Crown },
  ];

  return (
    <div className="flex flex-col gap-6">
      {isDemo && <DemoBanner reason="No partner data from API" />}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-500/15 border border-red-500/25 p-2.5">
              <Network className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white/90">Affiliate Network</h1>
              <p className="text-sm text-white/40 mt-0.5">Command center for your affiliate program</p>
            </div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <UserPlus className="h-4 w-4" />
          Invite Affiliate
        </button>
      </div>

      {/* Top Stats — Animated Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Affiliates" value={totalAffiliates} icon={Users} accent="red" />
        <StatCard label="Active This Month" value={activeThisMonth} icon={TrendingUp} accent="emerald" />
        <StatCard label="Total Referrals" value={totalReferrals} icon={UserPlus} accent="blue" />
        <StatCard label="Commissions Paid" value={totalCommissionsPaid} icon={DollarSign} prefix="$" decimals={2} accent="emerald" />
        <StatCard label="Pending Payouts" value={pendingPayouts} icon={Clock} prefix="$" decimals={2} accent="amber" />
        <StatCard label="Conversion Rate" value={parseFloat(overallConversionRate.toFixed(1))} icon={Percent} suffix="%" decimals={1} accent="purple" />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={setActiveTab}
          />
        ))}
      </div>

      {/* Separator */}
      <div className="h-px bg-white/[0.04]" />

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'affiliates' && <AffiliatesTab />}
        {activeTab === 'referrals' && <ReferralsTab />}
        {activeTab === 'commissions' && <CommissionsTab />}
        {activeTab === 'payouts' && <PayoutsTab />}
        {activeTab === 'links' && <LinksAssetsTab />}
        {activeTab === 'tiers' && <TiersTab />}
      </div>
    </div>
  );
}

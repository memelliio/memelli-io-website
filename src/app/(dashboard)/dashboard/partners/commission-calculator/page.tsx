'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  BarChart3,
  Zap,
  ChevronRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIERS = {
  lite: { label: 'Lite', rate: 0.10, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  pro: { label: 'Pro', rate: 0.25, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
} as const;

type TierKey = keyof typeof TIERS;

const PAYOUT_SCHEDULE = [
  { day: '1st', label: 'Monthly payout processed', description: 'All approved commissions from prior month' },
  { day: '3rd', label: 'Review period', description: 'Reversals and adjustments finalized' },
  { day: '5th', label: 'Funds released', description: 'Direct deposit or PayPal transfer' },
  { day: '15th', label: 'Mid-month statement', description: 'Running total for current period' },
];

const SAMPLE_HISTORY = [
  { month: 'Oct', lite: 320, pro: 800 },
  { month: 'Nov', lite: 480, pro: 1200 },
  { month: 'Dec', lite: 640, pro: 1600 },
  { month: 'Jan', lite: 560, pro: 1400 },
  { month: 'Feb', lite: 720, pro: 1800 },
  { month: 'Mar', lite: 880, pro: 2200 },
];

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CommissionCalculatorPage() {
  const [referralCount, setReferralCount] = useState<number>(10);
  const [tier, setTier] = useState<TierKey>('lite');
  const [avgSaleValue, setAvgSaleValue] = useState<number>(200);

  const calculations = useMemo(() => {
    const rate = TIERS[tier].rate;
    const totalCommissions = referralCount * avgSaleValue * rate;
    const projectedMonthly = totalCommissions;
    const projectedAnnual = totalCommissions * 12;

    // Upgrade ROI: difference between Pro and Lite earnings
    const liteEarnings = referralCount * avgSaleValue * TIERS.lite.rate;
    const proEarnings = referralCount * avgSaleValue * TIERS.pro.rate;
    const upgradeGain = proEarnings - liteEarnings;
    const upgradeGainAnnual = upgradeGain * 12;

    return {
      totalCommissions,
      projectedMonthly,
      projectedAnnual,
      liteEarnings,
      proEarnings,
      upgradeGain,
      upgradeGainAnnual,
    };
  }, [referralCount, tier, avgSaleValue]);

  const maxBar = Math.max(...SAMPLE_HISTORY.map((h) => h.pro));

  return (
    <div className="bg-card min-h-screen">
      <div className="p-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Commission Calculator
            </h1>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Model your earnings across tiers and referral volumes
            </p>
          </div>

          {/* Calculator Inputs */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="h-4 w-4 text-red-400" />
              <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Calculator Inputs
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Referral Count */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Monthly Referrals
                </label>
                <input
                  type="number"
                  min={0}
                  value={referralCount}
                  onChange={(e) => setReferralCount(Math.max(0, Number(e.target.value)))}
                  className="rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={referralCount}
                  onChange={(e) => setReferralCount(Number(e.target.value))}
                  className="w-full accent-red-500 mt-1"
                />
              </div>

              {/* Tier Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Partner Tier
                </label>
                <div className="flex gap-3">
                  {(Object.keys(TIERS) as TierKey[]).map((key) => {
                    const t = TIERS[key];
                    const active = tier === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTier(key)}
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          active
                            ? `${t.bg} ${t.border} ${t.color}`
                            : 'border-white/[0.04] bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t.label}
                        <span className="block text-[10px] mt-0.5 opacity-70">
                          {(t.rate * 100).toFixed(0)}% rate
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Average Sale Value */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Average Sale Value
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={0}
                    value={avgSaleValue}
                    onChange={(e) => setAvgSaleValue(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted pl-9 pr-4 py-3 text-sm text-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={avgSaleValue}
                  onChange={(e) => setAvgSaleValue(Number(e.target.value))}
                  className="w-full accent-red-500 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {fmtCurrency(calculations.totalCommissions)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Per month at current inputs</p>
            </div>

            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {fmtCurrency(calculations.projectedMonthly)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Projected monthly earnings</p>
            </div>

            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Annual</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {fmtCurrency(calculations.projectedAnnual)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Projected annual earnings</p>
            </div>

            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Upgrade Gain</span>
              </div>
              <p className="text-2xl font-semibold text-emerald-400">
                +{fmtCurrency(calculations.upgradeGain)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Extra per month with Pro</p>
            </div>
          </div>

          {/* Tier Comparison + Upgrade ROI */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Tier Comparison Table */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.04]">
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Tier Comparison
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Feature</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-blue-400 font-medium">Lite</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-emerald-400 font-medium">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Commission Rate</td>
                      <td className="px-6 py-4 text-blue-400 font-medium">10%</td>
                      <td className="px-6 py-4 text-emerald-400 font-medium">25%</td>
                    </tr>
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Per-Sale Earnings</td>
                      <td className="px-6 py-4 text-blue-400">{fmtCurrency(avgSaleValue * 0.10)}</td>
                      <td className="px-6 py-4 text-emerald-400">{fmtCurrency(avgSaleValue * 0.25)}</td>
                    </tr>
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Monthly ({referralCount} refs)</td>
                      <td className="px-6 py-4 text-blue-400">{fmtCurrency(calculations.liteEarnings)}</td>
                      <td className="px-6 py-4 text-emerald-400">{fmtCurrency(calculations.proEarnings)}</td>
                    </tr>
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Annual Projection</td>
                      <td className="px-6 py-4 text-blue-400">{fmtCurrency(calculations.liteEarnings * 12)}</td>
                      <td className="px-6 py-4 text-emerald-400">{fmtCurrency(calculations.proEarnings * 12)}</td>
                    </tr>
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Marketing Assets</td>
                      <td className="px-6 py-4 text-muted-foreground">Basic</td>
                      <td className="px-6 py-4 text-emerald-400">Full Suite</td>
                    </tr>
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Priority Support</td>
                      <td className="px-6 py-4 text-muted-foreground">--</td>
                      <td className="px-6 py-4 text-emerald-400">Included</td>
                    </tr>
                    <tr className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4 text-foreground">Custom Landing Pages</td>
                      <td className="px-6 py-4 text-muted-foreground">--</td>
                      <td className="px-6 py-4 text-emerald-400">Included</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upgrade Path ROI */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Upgrade Path: Lite to Pro ROI
                </h2>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-6">
                {/* ROI Highlight */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <p className="text-xs text-emerald-400/70 uppercase tracking-wider font-medium mb-2">
                    Additional Annual Revenue with Pro
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">
                    +{fmtCurrency(calculations.upgradeGainAnnual)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    That&apos;s {fmtCurrency(calculations.upgradeGain)} more per month at your current volume
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lite monthly</span>
                    <span className="text-sm text-blue-400 font-medium">{fmtCurrency(calculations.liteEarnings)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pro monthly</span>
                    <span className="text-sm text-emerald-400 font-medium">{fmtCurrency(calculations.proEarnings)}</span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">Monthly difference</span>
                    <span className="text-sm text-emerald-400 font-semibold">+{fmtCurrency(calculations.upgradeGain)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">Rate multiplier</span>
                    <span className="text-sm text-emerald-400 font-semibold">2.5x</span>
                  </div>
                </div>

                {/* CTA */}
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 transition-all duration-200">
                  Upgrade to Pro
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Commission History Chart */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-red-400" />
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Commission History (Sample)
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="text-[10px] text-muted-foreground">Lite</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">Pro</span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3 h-56">
              {SAMPLE_HISTORY.map((entry) => (
                <div key={entry.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end gap-1 h-44">
                    {/* Lite bar */}
                    <div className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-blue-500/30 border border-blue-500/20 rounded-t-md transition-all duration-300"
                        style={{ height: `${(entry.lite / maxBar) * 100}%` }}
                      />
                    </div>
                    {/* Pro bar */}
                    <div className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-emerald-500/30 border border-emerald-500/20 rounded-t-md transition-all duration-300"
                        style={{ height: `${(entry.pro / maxBar) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{entry.month}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
              <div className="text-xs text-muted-foreground">
                Lite 6-mo total: <span className="text-blue-400 font-medium">{fmtCurrency(SAMPLE_HISTORY.reduce((s, h) => s + h.lite, 0))}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Pro 6-mo total: <span className="text-emerald-400 font-medium">{fmtCurrency(SAMPLE_HISTORY.reduce((s, h) => s + h.pro, 0))}</span>
              </div>
            </div>
          </div>

          {/* Payout Schedule */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.04] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-400" />
              <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Payout Schedule
              </h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {PAYOUT_SCHEDULE.map((item) => (
                <div
                  key={item.day}
                  className="flex items-center gap-6 px-6 py-4 hover:bg-white/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted border border-white/[0.06]">
                    <span className="text-sm font-semibold text-red-400">{item.day}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

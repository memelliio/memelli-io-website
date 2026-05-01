/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — Stats bar (4 metric cards)                                       */
/*  Extracted from CrmPanel.tsx (refactor 2026-04-30).                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { Users, DollarSign, TrendingUp, Trophy } from 'lucide-react';
import { card, fmtCurrency } from './CrmPanel.utils';

interface StatsBarProps {
  loadingContacts: boolean;
  loadingDeals: boolean;
  loadingAnalytics: boolean;
  totalContacts: number;
  openDeals: number;
  pipelineValue: number;
  wonThisMonth: number;
}

export function StatsBar({
  loadingContacts,
  loadingDeals,
  loadingAnalytics,
  totalContacts,
  openDeals,
  pipelineValue,
  wonThisMonth,
}: StatsBarProps) {
  const cells = [
    {
      icon: Users,
      label: 'Total Contacts',
      value:
        loadingContacts || loadingAnalytics
          ? '—'
          : totalContacts.toLocaleString(),
      accent: false,
    },
    {
      icon: TrendingUp,
      label: 'Open Deals',
      value: loadingDeals || loadingAnalytics ? '—' : String(openDeals),
      accent: true,
    },
    {
      icon: DollarSign,
      label: 'Pipeline Value',
      value:
        loadingDeals || loadingAnalytics ? '—' : fmtCurrency(pipelineValue),
      accent: false,
    },
    {
      icon: Trophy,
      label: 'Deals Won',
      value: loadingAnalytics ? '—' : String(wonThisMonth),
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cells.map(({ icon: Icon, label, value, accent }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 rounded-xl p-3"
          style={card}
        >
          <div className="flex items-center gap-1.5">
            <Icon size={12} style={{ color: accent ? '#dc2626' : '#71717a' }} />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {label}
            </span>
          </div>
          <span className="text-white text-2xl font-bold leading-none">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

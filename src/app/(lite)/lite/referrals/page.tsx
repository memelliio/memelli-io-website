'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Check,
  MousePointerClick,
  UserPlus,
  ArrowRightLeft,
  Plus,
  Link2,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ReferralProfile {
  referralCode: string;
  referralLink: string;
}

interface ReferralEvent {
  id: string;
  type: 'click' | 'signup' | 'conversion';
  description: string;
  createdAt: string;
}

interface FunnelData {
  clicks: number;
  signups: number;
  conversions: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const eventIcons: Record<string, React.ComponentType<any>> = {
  click: MousePointerClick,
  signup: UserPlus,
  conversion: ArrowRightLeft,
};

const eventColors: Record<string, string> = {
  click: 'text-blue-400/70',
  signup: 'text-emerald-400/70',
  conversion: 'text-red-400/70',
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ReferralsPage() {
  const api = useApi();
  const qc = useQueryClient();
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTarget, setCampaignTarget] = useState('');

  // Profile with referral info
  const { data: profile } = useQuery<ReferralProfile>({
    queryKey: ['lite-profile'],
    queryFn: async () => {
      const res = await api.get<ReferralProfile>('/api/lite/me');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load');
      return res.data;
    },
    staleTime: 120_000,
  });

  // Referral activity
  const { data: events } = useQuery<ReferralEvent[]>({
    queryKey: ['lite-referral-activity'],
    queryFn: async () => {
      const res = await api.get<ReferralEvent[]>('/api/lite/activity?type=referral&limit=20');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Funnel stats
  const { data: funnel } = useQuery<FunnelData>({
    queryKey: ['lite-funnel'],
    queryFn: async () => {
      const res = await api.get<FunnelData>('/api/lite/stats/funnel');
      if (res.error || !res.data) return { clicks: 0, signups: 0, conversions: 0 };
      return res.data;
    },
    staleTime: 60_000,
  });

  // Create campaign link
  const createCampaign = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/lite/links', {
        name: campaignName,
        targetUrl: campaignTarget,
        isCampaign: true,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Campaign link created!');
      setCampaignName('');
      setCampaignTarget('');
      qc.invalidateQueries({ queryKey: ['lite-referral-activity'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function copyToClipboard(text: string, type: 'link' | 'code') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type === 'link' ? 'Link' : 'Code'} copied!`);
    setTimeout(() => setCopied(null), 2000);
  }

  const activity = events ?? [];
  const funnelData = funnel ?? { clicks: 0, signups: 0, conversions: 0 };
  const maxFunnel = Math.max(funnelData.clicks, 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Referrals</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Manage your referral link, track signups, and create campaign links.</p>
      </div>

      {/* Referral link + code */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Link */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <label className="mb-2 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Your Referral Link</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={profile?.referralLink ?? '---'}
              className="flex-1 truncate rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-sm text-white/70"
            />
            <button
              onClick={() => profile?.referralLink && copyToClipboard(profile.referralLink, 'link')}
              className="rounded-xl bg-primary p-2.5 text-white transition-all duration-200 hover:bg-primary/90"
            >
              {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <label className="mb-2 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Referral Code</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={profile?.referralCode ?? '---'}
              className="flex-1 truncate rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-sm font-mono text-white/70"
            />
            <button
              onClick={() => profile?.referralCode && copyToClipboard(profile.referralCode, 'code')}
              className="rounded-xl bg-primary p-2.5 text-white transition-all duration-200 hover:bg-primary/90"
            >
              {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-zinc-100">Referral Funnel</h3>
        <div className="space-y-4">
          {[
            { label: 'Clicks', value: funnelData.clicks, color: 'bg-blue-400/60' },
            { label: 'Signups', value: funnelData.signups, color: 'bg-emerald-400/60' },
            { label: 'Conversions', value: funnelData.conversions, color: 'bg-primary/60' },
          ].map((stage) => (
            <div key={stage.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{stage.label}</span>
                <span className="text-sm font-bold tracking-tight text-white/70">{stage.value.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/[0.04]">
                <div
                  className={`h-2.5 rounded-full ${stage.color} transition-all duration-500`}
                  style={{ width: `${(stage.value / maxFunnel) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Campaign + Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Create campaign link */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100">
            <Link2 className="h-4 w-4 text-primary" />
            Create Campaign Link
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Campaign Name</label>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Facebook Spring Promo"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/15 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Target URL (optional)</label>
              <input
                value={campaignTarget}
                onChange={(e) => setCampaignTarget(e.target.value)}
                placeholder="https://memelli.com/signup"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/15 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={() => createCampaign.mutate()}
              disabled={!campaignName.trim() || createCampaign.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {createCampaign.isPending ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="border-b border-white/[0.04] px-5 py-4">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Recent Referral Activity</h3>
          </div>
          <div className="max-h-80 divide-y divide-white/[0.03] overflow-y-auto">
            {activity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No referral activity yet.</p>
            ) : (
              activity.map((ev) => {
                const Icon = eventIcons[ev.type] ?? MousePointerClick;
                const color = eventColors[ev.type] ?? 'text-zinc-400';
                return (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                    <div className="rounded-xl bg-white/[0.04] p-1.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/60">{ev.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400/60">{timeAgo(ev.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useState } from 'react';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  X,
  Users,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  onboardingStage: string;
  pipelineStatus: string;
  assignedTo?: string;
  createdAt: string;
}

interface OnboardForm {
  name: string;
  email: string;
  phone: string;
  service: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const stageTabs = ['All', 'Registration', 'Documents', 'Review', 'Active', 'Converted'] as const;

const stageBadgeColors: Record<string, string> = {
  Registration: 'bg-blue-500/10 text-blue-400',
  Documents: 'bg-amber-500/10 text-amber-400',
  Review: 'bg-orange-500/10 text-orange-400',
  Active: 'bg-emerald-500/10 text-emerald-400',
  Converted: 'bg-red-500/10 text-red-400',
};

const pipelineColors: Record<string, string> = {
  Lead: 'bg-white/[0.04] text-zinc-400',
  Qualified: 'bg-blue-500/10 text-blue-400',
  Proposal: 'bg-amber-500/10 text-amber-400',
  Negotiation: 'bg-orange-500/10 text-orange-400',
  Won: 'bg-emerald-500/10 text-emerald-400',
  Lost: 'bg-rose-500/10 text-rose-400',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProClientsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><LoadingGlobe size="lg" /></div>}>
      <ProClientsContent />
    </Suspense>
  );
}

function ProClientsContent() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showOnboard, setShowOnboard] = useState(searchParams.get('action') === 'onboard');
  const [form, setForm] = useState<OnboardForm>({ name: '', email: '', phone: '', service: '' });

  // Fetch clients
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['pro-clients', activeTab, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'All') params.set('stage', activeTab);
      if (search) params.set('q', search);
      const res = await api.get<Client[]>(`/api/pro/clients?${params.toString()}`);
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Onboard mutation
  const onboardMutation = useMutation({
    mutationFn: async (data: OnboardForm) => {
      const res = await api.post('/api/pro/clients/onboard', data);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Client onboarded successfully');
      setShowOnboard(false);
      setForm({ name: '', email: '', phone: '', service: '' });
      queryClient.invalidateQueries({ queryKey: ['pro-clients'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to onboard client');
    },
  });

  const list = clients ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Clients</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Manage your client portfolio and onboarding.</p>
        </div>
        <button
          onClick={() => setShowOnboard(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Onboard New Client
        </button>
      </div>

      {/* Search + Stage tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white/70 placeholder-white/20 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {stageTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-primary/10 text-primary'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Client table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex h-16 animate-pulse border-b border-white/[0.04] bg-zinc-900/60" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/30">No clients found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white/25">Name</th>
                <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white/25 md:table-cell">Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white/25">Stage</th>
                <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white/25 lg:table-cell">Pipeline</th>
                <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white/25 lg:table-cell">Assigned</th>
                <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white/25 sm:table-cell">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {list.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/pro/clients/${client.id}`)}
                  className="cursor-pointer transition-all duration-200 hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-3">
                    <span className="font-medium text-white/70">{client.name}</span>
                  </td>
                  <td className="hidden px-5 py-3 text-zinc-400 md:table-cell">{client.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${stageBadgeColors[client.onboardingStage] ?? 'bg-white/[0.04] text-zinc-400'}`}>
                      {client.onboardingStage}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 lg:table-cell">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${pipelineColors[client.pipelineStatus] ?? 'bg-white/[0.04] text-zinc-400'}`}>
                      {client.pipelineStatus}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 text-zinc-400 lg:table-cell">{client.assignedTo ?? '-'}</td>
                  <td className="hidden px-5 py-3 text-white/30 sm:table-cell">{formatDate(client.createdAt)}</td>
                  <td className="px-5 py-3">
                    <ChevronRight className="h-4 w-4 text-white/15" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Onboard modal */}
      {showOnboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-zinc-900/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Onboard New Client</h2>
              <button onClick={() => setShowOnboard(false)} className="text-white/30 transition-colors hover:text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Service</label>
                <select
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a service...</option>
                  <option value="credit_repair">Credit Repair</option>
                  <option value="business_funding">Business Funding</option>
                  <option value="tax_prep">Tax Preparation</option>
                  <option value="insurance">Insurance</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="consulting">Consulting</option>
                </select>
              </div>

              <button
                onClick={() => onboardMutation.mutate(form)}
                disabled={!form.name || !form.email || onboardMutation.isPending}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
              >
                {onboardMutation.isPending ? 'Onboarding...' : 'Onboard Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

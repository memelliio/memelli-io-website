'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Check,
  Plus,
  ExternalLink,
  MousePointerClick,
  UserPlus,
  ArrowRightLeft,
  ToggleLeft,
  ToggleRight,
  Trophy,
  Link2,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LinkItem {
  id: string;
  name: string;
  url: string;
  clicks: number;
  signups: number;
  conversions: number;
  active: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function LinksPage() {
  const api = useApi();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');

  // Fetch links
  const { data: links, isLoading } = useQuery<LinkItem[]>({
    queryKey: ['lite-links'],
    queryFn: async () => {
      const res = await api.get<LinkItem[]>('/api/lite/links');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Create link
  const createLink = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/lite/links', { name: newName, targetUrl: newTarget });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Link created!');
      setNewName('');
      setNewTarget('');
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['lite-links'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Toggle active
  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await api.patch(`/api/lite/links/${id}`, { active });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lite-links'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  const allLinks = links ?? [];
  const topLinks = [...allLinks].sort((a, b) => b.clicks - a.clicks).slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Links</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Create and manage your referral links.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Link
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <h3 className="mb-4 text-sm font-semibold tracking-tight text-zinc-100">New Referral Link</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Campaign / Link Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Instagram Bio"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/15 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Target URL</label>
              <input
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="https://memelli.com/signup"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/15 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => createLink.mutate()}
              disabled={!newName.trim() || createLink.isPending}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-40"
            >
              {createLink.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-white/[0.06] px-5 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Top links highlight */}
      {topLinks.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            <Trophy className="h-3.5 w-3.5 text-amber-400/60" />
            Top Performing
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {topLinks.map((link, i) => (
              <div key={link.id} className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-white/70">{link.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {link.clicks}</span>
                  <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" /> {link.signups}</span>
                  <span className="flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" /> {link.conversions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links table */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3">Name / Campaign</th>
                <th className="px-5 py-3">URL</th>
                <th className="px-5 py-3 text-right">Clicks</th>
                <th className="px-5 py-3 text-right">Signups</th>
                <th className="px-5 py-3 text-right">Conv.</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3">
                      <div className="h-5 animate-pulse rounded-lg bg-white/[0.03]" />
                    </td>
                  </tr>
                ))
              ) : allLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    No links yet. Click &quot;Create Link&quot; to get started.
                  </td>
                </tr>
              ) : (
                allLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-white/[0.04] transition-all duration-200">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span className="font-medium text-white/70">{link.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[200px] px-5 py-3">
                      <span className="truncate text-xs text-zinc-400">{link.url}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-white/60">{link.clicks.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-white/60">{link.signups.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-white/60">{link.conversions.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                          link.active
                            ? 'bg-emerald-500/10 text-emerald-400/80'
                            : 'bg-white/[0.04] text-zinc-400'
                        }`}
                      >
                        {link.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyLink(link.url, link.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
                          title="Copy link"
                        >
                          {copiedId === link.id ? <Check className="h-3.5 w-3.5 text-emerald-400/80" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => toggleActive.mutate({ id: link.id, active: !link.active })}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
                          title={link.active ? 'Deactivate' : 'Activate'}
                        >
                          {link.active ? <ToggleRight className="h-4 w-4 text-emerald-400/70" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

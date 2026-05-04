'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, X, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { API_URL as API } from '@/lib/config';
async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Affiliate {
  id: string;
  code: string;
  commission: number;
  totalEarned: number;
  isActive: boolean;
  name?: string;
  email?: string;
  createdAt: string;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function codeFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 10)
    .toUpperCase() + Math.floor(Math.random() * 100).toString().padStart(2, '0');
}

export default function AffiliatesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [storeName, setStoreName] = useState<string>('Store');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form
  const [fContactSearch, setFContactSearch] = useState('');
  const [fContacts, setFContacts] = useState<Contact[]>([]);
  const [fSelectedContact, setFSelectedContact] = useState<Contact | null>(null);
  const [fCommission, setFCommission] = useState('10');
  const [fCode, setFCode] = useState('');
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeData, affiliatesData] = await Promise.allSettled([
        api(`/api/commerce/stores/${storeId}`),
        api(`/api/commerce/affiliates?storeId=${storeId}`),
      ]);
      if (storeData.status === 'fulfilled') {
        const s = storeData.value?.data ?? storeData.value;
        setStoreName(s?.name ?? 'Store');
      }
      if (affiliatesData.status === 'fulfilled') {
        const d = affiliatesData.value;
        setAffiliates(d?.data ?? d ?? []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) load();
  }, [storeId, load]);

  const searchContacts = async (q: string) => {
    if (!q.trim()) { setFContacts([]); return; }
    setContactLoading(true);
    try {
      const data = await api(`/api/contacts?search=${encodeURIComponent(q)}&limit=5`);
      setFContacts(data?.data ?? data ?? []);
    } catch {
      setFContacts([]);
    } finally {
      setContactLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchContacts(fContactSearch), 350);
    return () => clearTimeout(t);
  }, [fContactSearch]);

  const selectContact = (c: Contact) => {
    setFSelectedContact(c);
    setFContactSearch(`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email || '');
    setFContacts([]);
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email || 'AFF';
    setFCode(codeFromName(name));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFSubmitting(true);
    setFError(null);
    try {
      const contactName = fSelectedContact
        ? `${fSelectedContact.firstName ?? ''} ${fSelectedContact.lastName ?? ''}`.trim() || 'Unknown'
        : fContactSearch.trim() || 'Unknown';
      const contactEmail = fSelectedContact?.email || '';
      if (!contactEmail) {
        setFError('An email is required. Select a contact with an email or enter one.');
        setFSubmitting(false);
        return;
      }
      const body: Record<string, any> = {
        storeId,
        code: fCode,
        name: contactName,
        email: contactEmail,
        commissionRate: parseFloat(fCommission),
      };
      const data = await api('/api/commerce/affiliates', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setAffiliates((prev) => [data?.data ?? data, ...prev]);
      setShowModal(false);
      resetForm();
      showToast('Affiliate added');
    } catch (e: any) {
      setFError(`Failed to add affiliate: ${e.message}`);
    } finally {
      setFSubmitting(false);
    }
  };

  const resetForm = () => {
    setFContactSearch('');
    setFContacts([]);
    setFSelectedContact(null);
    setFCommission('10');
    setFCode('');
    setFError(null);
  };

  const totalEarned = affiliates.reduce((s, a) => s + Number(a.totalEarned ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-2xl px-4 py-3 text-sm text-white/90 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Add Affiliate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl p-6 mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold tracking-tight text-white/90">Add Affiliate</h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-white/30 hover:text-white/60 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {fError && (
              <div className="mb-4 rounded-xl bg-primary/[0.06] border border-primary/[0.12] p-3 text-sm text-primary">
                {fError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Contact Search */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/50">Contact</label>
                <div className="relative">
                  <input
                    value={fContactSearch}
                    onChange={(e) => {
                      setFContactSearch(e.target.value);
                      setFSelectedContact(null);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  {(fContacts.length > 0 || contactLoading) && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl shadow-2xl z-10 overflow-hidden">
                      {contactLoading ? (
                        <div className="p-3 text-center text-sm text-white/30">Searching...</div>
                      ) : (
                        fContacts.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectContact(c)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/[0.06] transition-colors duration-200"
                          >
                            <p className="font-medium text-white/90">
                              {`${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Unknown'}
                            </p>
                            {c.email && <p className="text-xs text-white/30">{c.email}</p>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {fSelectedContact && (
                  <p className="text-xs text-primary/80">
                    Selected: {`${fSelectedContact.firstName ?? ''} ${fSelectedContact.lastName ?? ''}`.trim() || fSelectedContact.email}
                  </p>
                )}
              </div>

              {/* Commission */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/50">Commission Rate (%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={fCommission}
                  onChange={(e) => setFCommission(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/50">Affiliate Code</label>
                <input
                  required
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value.toUpperCase())}
                  placeholder="JOHN20"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.06] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-40 transition-all duration-200"
                >
                  {fSubmitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Add Affiliate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Affiliate Detail Panel */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-background backdrop-blur-sm" onClick={() => setSelectedAffiliate(null)} />
          <div className="w-full max-w-sm bg-white/[0.03] backdrop-blur-2xl border-l border-white/[0.06] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold tracking-tight text-white/90">Affiliate Detail</h3>
              <button onClick={() => setSelectedAffiliate(null)} className="text-white/30 hover:text-white/60 transition-colors duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Name</p>
                <p className="font-medium text-white/90">{selectedAffiliate.name ?? '—'}</p>
              </div>
              {selectedAffiliate.email && (
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-white/60">{selectedAffiliate.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Code</p>
                <span className="font-mono text-primary/80 bg-primary/[0.08] border border-primary/[0.15] rounded-lg px-2 py-0.5 text-sm">
                  {selectedAffiliate.code}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Commission Rate</p>
                <p className="text-2xl font-bold tracking-tight text-white/90">{Number(selectedAffiliate.commission)}%</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                <p className="text-xs text-white/30 mb-1">Total Earned</p>
                <p className="font-semibold text-emerald-400">${Number(selectedAffiliate.totalEarned ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  selectedAffiliate.isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.04] border border-white/[0.08] text-white/30'
                }`}>
                  {selectedAffiliate.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Joined</p>
                <p className="text-sm text-white/40">{new Date(selectedAffiliate.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}`}
          className="rounded-2xl p-2 text-white/40 hover:bg-white/[0.06] hover:text-white/80 backdrop-blur-xl transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">Affiliates</h1>
          <p className="text-sm text-white/30 mt-0.5">{storeName}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Affiliate
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-primary/[0.06] border border-primary/[0.12] p-4 text-sm text-primary">
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Affiliates', value: affiliates.length, icon: Users },
          { label: 'Active Affiliates', value: affiliates.filter((a) => a.isActive).length, icon: TrendingUp },
          { label: 'Total Commissions Paid', value: `$${totalEarned.toFixed(2)}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold tracking-tight text-white/90 mt-1">{value}</p>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
          <Users className="h-4 w-4 text-white/30" />
          <h2 className="font-semibold tracking-tight text-white/90">Affiliate Partners</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/80 border-t-transparent" />
          </div>
        ) : affiliates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No affiliates yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm text-primary/80 hover:underline"
            >
              Add your first affiliate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Name</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Code</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Commission</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Total Earned</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {affiliates.map((aff) => (
                  <tr
                    key={aff.id}
                    onClick={() => setSelectedAffiliate(aff)}
                    className="hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white/90">{aff.name ?? '—'}</p>
                      {aff.email && (
                        <p className="text-xs text-white/30 mt-0.5">{aff.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-primary/80 bg-primary/[0.08] border border-primary/[0.15] rounded-lg px-2 py-0.5 text-xs">
                        {aff.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white/90">{Number(aff.commission)}%</td>
                    <td className="px-6 py-4 text-emerald-400">${Number(aff.totalEarned ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        aff.isActive
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-white/[0.04] border border-white/[0.08] text-white/30'
                      }`}>
                        {aff.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

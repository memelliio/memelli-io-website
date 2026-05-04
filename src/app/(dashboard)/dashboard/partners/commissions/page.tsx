'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge, type BadgeVariant } from '../../../../../components/ui/badge';
import { MetricTile } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Commission {
  id: string;
  partnerName: string;
  amount: number;
  rate: number;
  type: string;
  status: string;
  date: string;
}

interface CommissionMeta {
  total: number;
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  thisMonth: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'primary',
  PAID: 'success',
  REVERSED: 'destructive',
};

const typeLabels: Record<string, string> = {
  ONE_TIME: 'One-time',
  RECURRING: 'Recurring',
};

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) => new Date(d).toLocaleDateString();

const STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REVERSED'];
const TYPES = ['ONE_TIME', 'RECURRING'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CommissionsPage() {
  const api = useApi();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [meta, setMeta] = useState<CommissionMeta>({
    total: 0,
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const perPage = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    const res = await api.get<{
      data: Commission[];
      meta: CommissionMeta;
    }>(`/api/partners/commissions?${params.toString()}`);

    if (res.data) {
      setCommissions(res.data.data ?? []);
      setMeta(
        res.data.meta ?? {
          total: 0,
          totalPending: 0,
          totalApproved: 0,
          totalPaid: 0,
          thisMonth: 0,
        }
      );
    }
    setLoading(false);
  }, [page, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(meta.total / perPage);

  return (
    <div className="min-h-screen">
      <div className="p-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Commissions</h1>
            <p className="text-muted-foreground leading-relaxed mt-1">
              Track partner commissions and earnings
            </p>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Total Pending"
              value={fmtCurrency(meta.totalPending)}
              icon={<Clock className="h-4 w-4" />}
              trend={meta.totalPending > 0 ? 'flat' : 'flat'}
            />
            <MetricTile
              label="Total Approved"
              value={fmtCurrency(meta.totalApproved)}
              icon={<CheckCircle className="h-4 w-4" />}
              trend={meta.totalApproved > 0 ? 'up' : 'flat'}
            />
            <MetricTile
              label="Total Paid"
              value={fmtCurrency(meta.totalPaid)}
              icon={<DollarSign className="h-4 w-4" />}
              trend={meta.totalPaid > 0 ? 'up' : 'flat'}
            />
            <MetricTile
              label="This Month"
              value={fmtCurrency(meta.thisMonth)}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={meta.thisMonth > 0 ? 'up' : 'flat'}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
            >
              <option value="">All Types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t] ?? t}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                placeholder="From"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                placeholder="To"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <DollarSign className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {statusFilter || typeFilter || dateFrom || dateTo
                    ? 'No commissions match your filters'
                    : 'No commissions yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Partner Name</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Rate</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {commissions.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-white/[0.04] transition-all duration-200"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">{c.partnerName}</td>
                        <td className="px-6 py-4 text-emerald-400 font-medium">{fmtCurrency(c.amount)}</td>
                        <td className="px-6 py-4 text-foreground">{c.rate}%</td>
                        <td className="px-6 py-4 text-foreground">{typeLabels[c.type] ?? c.type}</td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariant[c.status] ?? 'muted'} className="capitalize">
                            {c.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{fmtDate(c.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.04] px-6 py-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Page {page} of {totalPages} ({meta.total} total)
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="bg-card hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-xs text-foreground disabled:opacity-40 transition-all duration-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="bg-card hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-xs text-foreground disabled:opacity-40 transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
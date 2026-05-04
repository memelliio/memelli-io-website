'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Zap, CheckCircle2, XCircle, Clock,
  Filter, ChevronDown
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface AiAction {
  id: string;
  type: string;
  label?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  engine?: string;
  description?: string;
  input?: string;
  output?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const ACTION_TYPES = ['all', 'navigate', 'create', 'update', 'delete', 'ai_command', 'notify'] as const;
const STATUS_OPTIONS = ['all', 'pending', 'running', 'success', 'failed'] as const;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusIcon({ status }: { status: AiAction['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-primary" />;
  if (status === 'running') return <LoadingGlobe size="sm" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function statusVariant(status: AiAction['status']): 'success' | 'destructive' | 'primary' | 'muted' {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'destructive';
  if (status === 'running') return 'primary';
  return 'muted';
}

export default function AIActionsPage() {
  const api = useApi();
  const router = useRouter();
  const [actions, setActions] = useState<AiAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadActions() {
    setLoading(true);
    const res = await api.get<{ items: AiAction[] }>('/api/ai/actions?perPage=100');
    setActions(res.data?.items ?? []);
    setLoading(false);
  }

  const filtered = actions.filter((a) => {
    if (typeFilter !== 'all' && !a.type.includes(typeFilter)) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: actions.length,
    success: actions.filter((a) => a.status === 'success').length,
    failed: actions.filter((a) => a.status === 'failed').length,
    pending: actions.filter((a) => a.status === 'pending' || a.status === 'running').length
  };

  return (
    <div className="min-h-screen bg-card">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/ai-assistant')}
            className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200 border border-white/[0.04]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">AI Action History</h1>
            <p className="mt-1 text-muted-foreground leading-relaxed">Actions performed by your AI assistant</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="rounded-2xl border-white/[0.04] bg-card backdrop-blur-xl border p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Actions</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground mt-2">{stats.total}</p>
          </div>
          <div className="rounded-2xl border-white/[0.04] bg-card backdrop-blur-xl border p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Successful</p>
            <p className="text-2xl font-semibold tracking-tight text-emerald-400 mt-2">{stats.success}</p>
          </div>
          <div className="rounded-2xl border-white/[0.04] bg-card backdrop-blur-xl border p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Failed</p>
            <p className="text-2xl font-semibold tracking-tight text-primary mt-2">{stats.failed}</p>
          </div>
          <div className="rounded-2xl border-white/[0.04] bg-card backdrop-blur-xl border p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">In Progress</p>
            <p className="text-2xl font-semibold tracking-tight text-primary mt-2">{stats.pending}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-2 pr-10 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer transition-all duration-200"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t} className="bg-card">
                  {t === 'all' ? 'All Types' : t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-2 pr-10 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer transition-all duration-200"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-card">
                  {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Actions list */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 text-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-semibold tracking-tight">Actions ({filtered.length})</span>
            </div>
          </div>
          <div className="px-6 pb-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <Zap className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground leading-relaxed">No actions found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-white/[0.04] bg-muted backdrop-blur-xl transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
                  >
                    <div
                      className="flex items-center justify-between p-6 cursor-pointer"
                      onClick={() => setExpanded(expanded === action.id ? null : action.id)}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <StatusIcon status={action.status} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-semibold tracking-tight text-foreground">
                              {action.label || action.type.replace(/_/g, ' ')}
                            </p>
                            <Badge variant={statusVariant(action.status)} className="text-[11px] uppercase tracking-wider">
                              {action.status}
                            </Badge>
                          </div>
                          {action.description && (
                            <p className="text-muted-foreground leading-relaxed mt-1 truncate">{action.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {action.engine && (
                          <Badge variant="muted" className="text-[11px] uppercase tracking-wider">{action.engine}</Badge>
                        )}
                        <span className="text-muted-foreground text-sm">{timeAgo(action.createdAt)}</span>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                            expanded === action.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {expanded === action.id && (
                      <div className="border-t border-white/[0.04] px-6 py-5 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Type</p>
                            <p className="text-foreground font-mono text-sm">{action.type}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Created</p>
                            <p className="text-foreground text-sm">{new Date(action.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {action.input && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Input</p>
                            <pre className="bg-card rounded-2xl border border-white/[0.04] p-4 font-mono text-sm text-muted-foreground leading-relaxed overflow-x-auto">
                              {action.input}
                            </pre>
                          </div>
                        )}
                        {action.output && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Output</p>
                            <pre className="bg-card rounded-2xl border border-white/[0.04] p-4 font-mono text-sm text-muted-foreground leading-relaxed overflow-x-auto">
                              {action.output}
                            </pre>
                          </div>
                        )}
                        {action.error && (
                          <div className="rounded-2xl border border-primary/20 bg-primary/80/5 px-4 py-3 text-sm text-primary/80 font-mono leading-relaxed">
                            {action.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
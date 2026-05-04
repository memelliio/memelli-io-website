'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Radio,
  Bot,
  Activity,
  Zap,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface AgentPool {
  id: string;
  name: string;
  category?: string;
  activeAgents: number;
  idleAgents: number;
  totalTasks: number;
  status: string;
}

interface Dispatch {
  id: string;
  task: string;
  pool?: string;
  status: string;
  createdAt: string;
}

interface WorkOrderStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
}

interface PoolsResponse {
  pools?: AgentPool[];
  activeDispatches?: number;
  dispatches?: Dispatch[];
  workOrderStats?: WorkOrderStats;
}

const REFRESH_INTERVAL = 5000;

export default function LiveControlPage() {
  const api = useApi();
  const [pools, setPools] = useState<AgentPool[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [workStats, setWorkStats] = useState<WorkOrderStats>({ total: 0, completed: 0, inProgress: 0, failed: 0 });
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchInput, setDispatchInput] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [healthRes, poolsRes] = await Promise.all([
        api.get<{ status: string }>('/api/health'),
        api.get<PoolsResponse>('/api/admin/command-center/pools'),
      ]);

      setApiHealthy(!healthRes.error);
      setPools(poolsRes.data?.pools ?? []);
      setDispatches(poolsRes.data?.dispatches ?? []);
      setWorkStats(
        poolsRes.data?.workOrderStats ?? { total: 0, completed: 0, inProgress: 0, failed: 0 }
      );
      setLastRefresh(new Date());
    } catch {
      setApiHealthy(false);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  async function handleDispatch() {
    const task = dispatchInput.trim();
    if (!task || dispatching) return;

    setDispatching(true);
    try {
      const { error } = await api.post('/api/admin/command-center/dispatch', {
        task,
        priority: 'normal'
      });
      if (error) throw new Error(error);
      toast.success('Task dispatched to agent pool');
      setDispatchInput('');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch task');
    } finally {
      setDispatching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDispatch();
    }
  }

  const statusIcon: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    in_progress: <LoadingGlobe size="sm" />,
    pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    failed: <XCircle className="h-3.5 w-3.5 text-primary" />,
    active: <Activity className="h-3.5 w-3.5 text-emerald-400" />,
    idle: <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <div className="min-h-screen bg-card p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live Control</h1>
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5 animate-pulse bg-primary/20 text-primary/80 border-primary/30">
                LIVE
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">Production system monitoring and control</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card backdrop-blur-xl hover:bg-white/[0.04] text-muted-foreground hover:text-foreground border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* API Health + Work Order Stats */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            {apiHealthy === null ? (
              <LoadingGlobe size="sm" />
            ) : apiHealthy ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-primary" />
            )}
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">API Health</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {apiHealthy === null ? 'Checking...' : apiHealthy ? 'Healthy' : 'Down'}
          </p>
        </div>
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Work Orders</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{workStats.total}</p>
        </div>
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Completed</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{workStats.completed}</p>
        </div>
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Failed</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{workStats.failed}</p>
        </div>
      </div>

      {/* Dispatch Input */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <div className="p-6 pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <Send className="h-4 w-4 text-primary" />
            <span className="text-2xl font-semibold tracking-tight">Dispatch Task</span>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={dispatchInput}
              onChange={(e) => setDispatchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a task in natural language..."
              className="flex-1 rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
            />
            <button
              onClick={handleDispatch}
              disabled={!dispatchInput.trim() || dispatching}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {dispatching ? (
                <LoadingGlobe size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Dispatch
            </button>
          </div>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Tasks are routed to the appropriate agent pool via the command center
          </p>
        </div>
      </div>

      {/* Agent Pools Grid */}
      <div>
        <h2 className="mb-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Agent Pools ({pools.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <div className="py-12 text-center">
              <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground leading-relaxed">No agent pools registered</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                <div className="p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground truncate text-2xl font-semibold tracking-tight">{pool.name}</span>
                    <div className="flex items-center gap-1.5">
                      {statusIcon[pool.status] ?? statusIcon.idle}
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium capitalize">{pool.status}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-3">
                  {pool.category && (
                    <Badge variant="muted" className="text-[10px] font-mono bg-primary/[0.08] text-primary/80 border-primary/20">
                      {pool.category}
                    </Badge>
                  )}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-emerald-400">{pool.activeAgents}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Active</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-muted-foreground">{pool.idleAgents}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Idle</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-primary">{pool.totalTasks}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Dispatches */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <div className="p-6 pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-2xl font-semibold tracking-tight">Active Dispatches</span>
          </div>
        </div>
        <div className="px-6 pb-6">
          {dispatches.length === 0 ? (
            <p className="text-muted-foreground leading-relaxed">No active dispatches</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {dispatches.map((d) => (
                <div key={d.id} className="flex items-center gap-4 py-4">
                  <div className="shrink-0">
                    {statusIcon[d.status] ?? <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{d.task}</p>
                    {d.pool && (
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium font-mono">{d.pool}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <Badge
                      variant={d.status === 'completed' ? 'primary' : d.status === 'failed' ? 'destructive' : 'muted'}
                      className={`text-[10px] ${d.status === 'completed' ? 'bg-primary/[0.08] text-primary/80 border-primary/30' : ''}`}
                    >
                      {d.status}
                    </Badge>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{timeAgo(d.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

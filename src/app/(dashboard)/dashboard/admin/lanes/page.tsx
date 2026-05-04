'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Power,
  PowerOff,
  ArrowUpDown,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import { Badge } from '../../../../../components/ui/badge';

interface Lane {
  id: string;
  name: string;
  tier?: string;
  status: 'enabled' | 'disabled' | string;
  priority?: number;
  health?: 'healthy' | 'degraded' | 'down' | string;
  description?: string;
  createdAt?: string;
}

interface LanesResponse {
  lanes?: Lane[];
}

export default function LanesPage() {
  const api = useApi();
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Register form state
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerTier, setRegisterTier] = useState('standard');
  const [registerPriority, setRegisterPriority] = useState(5);
  const [registerDescription, setRegisterDescription] = useState('');
  const [registering, setRegistering] = useState(false);

  const fetchLanes = useCallback(async () => {
    try {
      const res = await api.get<LanesResponse | Lane[]>('/api/admin/lanes/');
      const data = res.data;
      if (Array.isArray(data)) {
        setLanes(data);
      } else if (data && 'lanes' in data) {
        setLanes(data.lanes ?? []);
      } else {
        setLanes([]);
      }
      setLastRefresh(new Date());
    } catch {
      toast.error('Failed to fetch lanes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLanes();
  }, [fetchLanes]);

  async function handleEnable(id: string) {
    setActionLoading(id);
    try {
      const { error } = await api.post(`/api/admin/lanes/${id}/enable`, {});
      if (error) throw new Error(error);
      toast.success('Lane enabled');
      fetchLanes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enable lane');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisable(id: string) {
    setActionLoading(id);
    try {
      const { error } = await api.post(`/api/admin/lanes/${id}/disable`, {});
      if (error) throw new Error(error);
      toast.success('Lane disabled');
      fetchLanes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disable lane');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!registerName.trim()) return;
    setRegistering(true);
    try {
      const { error } = await api.post('/api/admin/lanes/register', {
        name: registerName.trim(),
        tier: registerTier,
        priority: registerPriority,
        description: registerDescription.trim() || undefined,
      });
      if (error) throw new Error(error);
      toast.success('Lane registered');
      setRegisterName('');
      setRegisterTier('standard');
      setRegisterPriority(5);
      setRegisterDescription('');
      setShowRegister(false);
      fetchLanes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register lane');
    } finally {
      setRegistering(false);
    }
  }

  const healthIcon: Record<string, React.ReactNode> = {
    healthy: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    degraded: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
    down: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  };

  const healthColor: Record<string, string> = {
    healthy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    degraded: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    down: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-card p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20">
            <Layers className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lane Management</h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Configure and monitor processing lanes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchLanes}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground border border-white/[0.06] transition-all duration-200 text-[11px] uppercase tracking-wider font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 text-[11px] uppercase tracking-wider font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Register Lane
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Lanes</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{lanes.length}</p>
        </div>
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Enabled</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-400">
            {lanes.filter((l) => l.status === 'enabled').length}
          </p>
        </div>
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <PowerOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Disabled</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground">
            {lanes.filter((l) => l.status === 'disabled').length}
          </p>
        </div>
        <div className="rounded-2xl border-white/[0.04] bg-card p-5 backdrop-blur-xl border">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-400" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Degraded</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-400">
            {lanes.filter((l) => l.health === 'degraded' || l.health === 'down').length}
          </p>
        </div>
      </div>

      {/* Register Lane Form */}
      {showRegister && (
        <div className="bg-card backdrop-blur-xl border border-emerald-500/20 rounded-2xl">
          <div className="p-6 pb-3">
            <div className="flex items-center gap-2 text-foreground">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span className="text-2xl font-semibold tracking-tight">Register New Lane</span>
            </div>
          </div>
          <form onSubmit={handleRegister} className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Lane Name *
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="e.g. Credit Repair Pipeline"
                  required
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground placeholder-muted-foreground focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Tier
                </label>
                <select
                  value={registerTier}
                  onChange={(e) => setRegisterTier(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={registerPriority}
                  onChange={(e) => setRegisterPriority(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={registerDescription}
                  onChange={(e) => setRegisterDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground placeholder-muted-foreground focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!registerName.trim() || registering}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {registering ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Register Lane
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground border border-white/[0.06] hover:bg-muted transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lanes Grid */}
      <div>
        <h2 className="mb-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Lanes ({lanes.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : lanes.length === 0 ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <div className="py-12 text-center">
              <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground leading-relaxed">No lanes registered</p>
              <button
                onClick={() => setShowRegister(true)}
                className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
              >
                Register your first lane
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {lanes.map((lane) => {
              const isEnabled = lane.status === 'enabled';
              const health = lane.health ?? 'healthy';
              const isActioning = actionLoading === lane.id;

              return (
                <div
                  key={lane.id}
                  className={`bg-card backdrop-blur-xl border rounded-2xl hover:border-white/[0.08] transition-all duration-200 ${
                    isEnabled ? 'border-emerald-500/10' : 'border-white/[0.04]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground truncate text-lg font-semibold tracking-tight">
                        {lane.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {healthIcon[health] ?? <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
                        <Badge
                          className={`text-[10px] px-1.5 py-0 rounded-xl border ${
                            healthColor[health] ?? 'bg-muted text-muted-foreground border-white/[0.06]'
                          }`}
                        >
                          {health.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {lane.description && (
                      <p className="mt-1 text-muted-foreground text-sm leading-relaxed truncate">{lane.description}</p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="px-6 pb-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-foreground capitalize">
                          {lane.tier ?? 'standard'}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tier</p>
                      </div>
                      <div>
                        <p
                          className={`text-lg font-semibold tracking-tight ${
                            isEnabled ? 'text-emerald-400' : 'text-muted-foreground'
                          }`}
                        >
                          {isEnabled ? 'ON' : 'OFF'}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
                          <p className="text-lg font-semibold tracking-tight text-amber-400">
                            {lane.priority ?? '-'}
                          </p>
                        </div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Priority</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 pb-6">
                    {isEnabled ? (
                      <button
                        onClick={() => handleDisable(lane.id)}
                        disabled={isActioning}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 text-red-300 hover:bg-red-500/20 hover:border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                      >
                        {isActioning ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <PowerOff className="h-3.5 w-3.5" />
                        )}
                        Disable Lane
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnable(lane.id)}
                        disabled={isActioning}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-2.5 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                      >
                        {isActioning ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        Enable Lane
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

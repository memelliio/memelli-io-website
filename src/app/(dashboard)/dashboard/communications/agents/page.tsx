'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Headphones, Phone, Clock, Star, Search, User, ArrowLeft, BarChart3,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Toggle,
  Skeleton,
  MetricTile,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
  callsHandledToday: number;
  avgHandleTime: number; // seconds
  satisfactionScore: number; // 0-5
  skills: string[];
  lastStatusChange: string;
}

type AgentsResponse = Agent[];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_MAP: Record<Agent['status'], { label: string; variant: 'success' | 'destructive' | 'muted' }> = {
  available: { label: 'Available', variant: 'success' },
  busy: { label: 'Busy', variant: 'destructive' },
  offline: { label: 'Offline', variant: 'muted' },
};

function formatHandleTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Detail View                                                        */
/* ------------------------------------------------------------------ */

function AgentDetail({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-white/40 hover:text-white/70">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to agents
      </Button>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] ring-2 ring-white/[0.06]">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-white/30" />
          )}
        </div>
        <div>
          <h2 className="text-xl tracking-tight font-semibold text-foreground">{agent.name}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{agent.email}</p>
          <Badge variant={STATUS_MAP[agent.status].variant} className="mt-1">
            {STATUS_MAP[agent.status].label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricTile
          label="Calls Today"
          value={agent.callsHandledToday}
          icon={<Phone className="h-4 w-4" />}
        />
        <MetricTile
          label="Avg Handle Time"
          value={formatHandleTime(agent.avgHandleTime)}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTile
          label="Satisfaction"
          value={`${agent.satisfactionScore.toFixed(1)} / 5`}
          icon={<Star className="h-4 w-4" />}
        />
        <MetricTile
          label="Last Status Change"
          value={timeAgo(agent.lastStatusChange)}
          icon={<Headphones className="h-4 w-4" />}
        />
      </div>

      {agent.skills.length > 0 && (
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="tracking-tight font-semibold text-foreground">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <Badge key={skill} variant="muted">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AgentManagementPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Agent['status'] | ''>('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  /* ---------- fetch agents ---------- */

  const {
    data: agentsData,
    isLoading,
    error,
  } = useQuery<AgentsResponse>({
    queryKey: ['comms-agents'],
    queryFn: async () => {
      const res = await api.get<AgentsResponse>('/api/comms/agents');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 15_000,
  });

  const agents: Agent[] = agentsData ?? [];

  /* ---------- toggle status ---------- */

  const toggleAgentStatus = useCallback(
    async (agent: Agent, checked: boolean) => {
      const newStatus: Agent['status'] = checked ? 'available' : 'offline';
      await api.patch(`/api/comms/agents/${agent.id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['comms-agents'] });
    },
    [api, queryClient],
  );

  /* ---------- filter ---------- */

  const filtered = agents.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    }
    return true;
  });

  /* ---------- summary metrics ---------- */

  const totalOnline = agents.filter((a) => a.status !== 'offline').length;
  const totalAvailable = agents.filter((a) => a.status === 'available').length;
  const totalCallsToday = agents.reduce((s, a) => s + a.callsHandledToday, 0);
  const avgSatisfaction =
    agents.length > 0
      ? (agents.reduce((s, a) => s + a.satisfactionScore, 0) / agents.length).toFixed(1)
      : '--';
  const avgHandleTimeAll =
    agents.length > 0
      ? formatHandleTime(Math.round(agents.reduce((s, a) => s + a.avgHandleTime, 0) / agents.length))
      : '--';

  /* ---------- detail view ---------- */

  if (selectedAgent) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Agent Detail"
          subtitle={selectedAgent.name}
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'Agents', href: '/dashboard/communications/agents' },
            { label: selectedAgent.name },
          ]}
        />
        <AgentDetail agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
      </div>
    );
  }

  /* ---------- loading ---------- */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Management" subtitle="Monitor and manage communication agents" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- error ---------- */

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Management" subtitle="Monitor and manage communication agents" />
        <Card className="border-primary/20 bg-primary/5 rounded-2xl backdrop-blur-xl">
          <CardContent className="p-6 text-center">
            <p className="text-primary/80">Failed to load agents: {(error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['comms-agents'] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- main render ---------- */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Management"
        subtitle="Monitor and manage communication agents"
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Agents' },
        ]}
      />

      {/* Performance summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <MetricTile label="Online" value={totalOnline} icon={<Headphones className="h-4 w-4" />} />
        <MetricTile label="Available" value={totalAvailable} trend={totalAvailable > 0 ? 'up' : 'down'} icon={<User className="h-4 w-4" />} />
        <MetricTile label="Calls Today" value={totalCallsToday} icon={<Phone className="h-4 w-4" />} />
        <MetricTile label="Avg Handle Time" value={avgHandleTimeAll} icon={<Clock className="h-4 w-4" />} />
        <MetricTile label="Avg Satisfaction" value={avgSatisfaction} icon={<Star className="h-4 w-4" />} />
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          {(['' as const, 'available' as const, 'busy' as const, 'offline' as const]).map((st) => (
            <button
              key={st || 'all'}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 ${
                statusFilter === st
                  ? 'border-primary/30 bg-primary/10 text-primary/80'
                  : 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:border-white/[0.12]'
              }`}
            >
              {st ? STATUS_MAP[st].label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      {filtered.length === 0 ? (
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed">No agents match the current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const cfg = STATUS_MAP[agent.status];
            return (
              <Card
                key={agent.id}
                className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedAgent(agent)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                        {agent.avatar ? (
                          <img src={agent.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-white/30" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm tracking-tight font-semibold text-foreground truncate">
                        {agent.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground leading-relaxed truncate">{agent.email}</p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant} className="shrink-0 ml-2">
                    {cfg.label}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-semibold text-white/85">{agent.callsHandledToday}</p>
                      <p className="text-[11px] text-white/30">Calls Today</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white/85">{formatHandleTime(agent.avgHandleTime)}</p>
                      <p className="text-[11px] text-white/30">Avg Handle</p>
                    </div>
                    <div>
                      <p className={`text-lg font-semibold ${
                        agent.satisfactionScore >= 4.5 ? 'text-emerald-400' :
                        agent.satisfactionScore >= 3.5 ? 'text-amber-400' : 'text-primary'
                      }`}>
                        {agent.satisfactionScore.toFixed(1)}
                      </p>
                      <p className="text-[11px] text-white/30">CSAT</p>
                    </div>
                  </div>

                  {/* Toggle status */}
                  <div
                    className="flex items-center justify-between border-t border-white/[0.04] pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Toggle
                      size="sm"
                      label="Available"
                      checked={agent.status === 'available'}
                      onChange={(checked) => toggleAgentStatus(agent, checked)}
                      disabled={agent.status === 'busy'}
                    />
                    <span className="text-[10px] text-white/20">{timeAgo(agent.lastStatusChange)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

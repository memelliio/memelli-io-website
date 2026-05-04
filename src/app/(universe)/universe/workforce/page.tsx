'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users,
  RefreshCw,
  Search,
  Shield,
  Wrench,
  Eye,
  Zap,
  TrendingUp,
  TrendingDown,
  Bot,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Flame,
  Target,
  BarChart3,
  Crown,
  Skull,
  UserPlus,
  UserMinus,
} from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type AgentType = 'seo' | 'marketing' | 'support' | 'automation' | 'repair' | 'patrol';
type AgentStatus = 'active' | 'idle' | 'error' | 'cooldown';
type PerformanceTier = 'elite' | 'strong' | 'average' | 'underperformer';

interface AgentInstance {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  tasksToday: number;
  successRate: number;
  avgResponseMs: number;
  uptime: number;
  lastTaskAt: string | null;
  tier: PerformanceTier;
}

interface AgentTypeStats {
  type: AgentType;
  displayName: string;
  description: string;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  errorAgents: number;
  tasksCompletedToday: number;
  tasksFailedToday: number;
  successRate: number;
  avgResponseMs: number;
  agents: AgentInstance[];
}

interface WorkforceOverview {
  totalAgents: number;
  totalActive: number;
  totalIdle: number;
  totalTasks: number;
  globalSuccessRate: number;
  avgResponseMs: number;
  topPerformerId: string | null;
  topPerformerName: string | null;
  topPerformerTasks: number;
  heatmapData: number[];
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const AGENT_TYPE_META: Record<AgentType, { icon: typeof Bot; color: string; bgColor: string; borderColor: string }> = {
  seo:        { icon: Search,  color: 'text-cyan-400',    bgColor: 'bg-cyan-500/10',    borderColor: 'border-cyan-500/30' },
  marketing:  { icon: Target,  color: 'text-violet-400',  bgColor: 'bg-violet-500/10',  borderColor: 'border-violet-500/30' },
  support:    { icon: Users,   color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  automation: { icon: Zap,     color: 'text-amber-400',   bgColor: 'bg-amber-500/10',   borderColor: 'border-amber-500/30' },
  repair:     { icon: Wrench,  color: 'text-orange-400',  bgColor: 'bg-orange-500/10',  borderColor: 'border-orange-500/30' },
  patrol:     { icon: Shield,  color: 'text-red-400',     bgColor: 'bg-red-500/10',     borderColor: 'border-red-500/30' },
};

const STATUS_COLORS: Record<AgentStatus, { dot: string; label: string; bg: string }> = {
  active:   { dot: 'bg-emerald-400', label: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  idle:     { dot: 'bg-[hsl(var(--muted-foreground))]',    label: 'text-[hsl(var(--muted-foreground))]',    bg: 'bg-[hsl(var(--muted))]/$1' },
  error:    { dot: 'bg-red-400',     label: 'text-red-400',     bg: 'bg-red-500/10' },
  cooldown: { dot: 'bg-amber-400',   label: 'text-amber-400',   bg: 'bg-amber-500/10' },
};

const TIER_COLORS: Record<PerformanceTier, { text: string; bg: string; border: string }> = {
  elite:          { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  strong:         { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  average:        { text: 'text-[hsl(var(--muted-foreground))]', bg: 'bg-[hsl(var(--muted))]/$1', border: 'border-[hsl(var(--border))]' },
  underperformer: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

/* ================================================================== */
/*  Demo Data Generator                                                */
/* ================================================================== */

const AGENT_NAMES: Record<AgentType, string[]> = {
  seo: ['SEO-Crawler-01', 'SEO-Indexer-02', 'SEO-Ranker-03', 'SEO-Auditor-04', 'SEO-Link-05', 'SEO-Content-06', 'SEO-Tech-07', 'SEO-Local-08'],
  marketing: ['Mktg-Email-01', 'Mktg-Social-02', 'Mktg-Copy-03', 'Mktg-Funnel-04', 'Mktg-Ad-05', 'Mktg-Brand-06'],
  support: ['Support-Chat-01', 'Support-Ticket-02', 'Support-Escalate-03', 'Support-KB-04', 'Support-Follow-05'],
  automation: ['Auto-Flow-01', 'Auto-Trigger-02', 'Auto-Schedule-03', 'Auto-Webhook-04', 'Auto-Sync-05', 'Auto-ETL-06', 'Auto-Notify-07'],
  repair: ['Repair-Schema-01', 'Repair-API-02', 'Repair-Build-03', 'Repair-Data-04', 'Repair-Cache-05'],
  patrol: ['Patrol-Health-01', 'Patrol-Security-02', 'Patrol-Perf-03', 'Patrol-Uptime-04', 'Patrol-Drift-05', 'Patrol-Cert-06'],
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickTier(successRate: number, tasks: number): PerformanceTier {
  if (successRate >= 97 && tasks >= 40) return 'elite';
  if (successRate >= 90 && tasks >= 20) return 'strong';
  if (successRate < 75 || tasks < 5) return 'underperformer';
  return 'average';
}

function generateAgents(type: AgentType): AgentInstance[] {
  const names = AGENT_NAMES[type];
  return names.map((name, i) => {
    const isActive = Math.random() > 0.35;
    const isError = !isActive && Math.random() > 0.7;
    const isCooldown = !isActive && !isError && Math.random() > 0.6;
    const status: AgentStatus = isActive ? 'active' : isError ? 'error' : isCooldown ? 'cooldown' : 'idle';
    const tasks = randomBetween(2, 80);
    const successRate = randomBetween(65, 100);
    return {
      id: `${type}-${i}`,
      name,
      type,
      status,
      tasksToday: tasks,
      successRate,
      avgResponseMs: randomBetween(120, 3200),
      uptime: randomBetween(85, 100),
      lastTaskAt: status === 'active' ? new Date(Date.now() - randomBetween(5000, 60000)).toISOString() : null,
      tier: pickTier(successRate, tasks),
    };
  });
}

function generateTypeStats(): AgentTypeStats[] {
  const types: { type: AgentType; name: string; desc: string }[] = [
    { type: 'seo', name: 'SEO Agents', desc: 'Crawling, indexing, ranking, link building, technical audits' },
    { type: 'marketing', name: 'Marketing Agents', desc: 'Email campaigns, social media, copywriting, funnel optimization' },
    { type: 'support', name: 'Support Agents', desc: 'Live chat, ticket resolution, knowledge base, escalation handling' },
    { type: 'automation', name: 'Automation Agents', desc: 'Workflow triggers, scheduling, webhooks, data sync, ETL pipelines' },
    { type: 'repair', name: 'Repair Agents', desc: 'Schema fixes, API healing, build repair, data integrity, cache recovery' },
    { type: 'patrol', name: 'Patrol Agents', desc: 'Health checks, security scanning, performance monitoring, uptime validation' },
  ];

  return types.map(({ type, name, desc }) => {
    const agents = generateAgents(type);
    const active = agents.filter(a => a.status === 'active').length;
    const idle = agents.filter(a => a.status === 'idle').length;
    const error = agents.filter(a => a.status === 'error').length;
    const totalTasks = agents.reduce((s, a) => s + a.tasksToday, 0);
    const totalSuccess = agents.reduce((s, a) => s + Math.round(a.tasksToday * a.successRate / 100), 0);
    const avgResp = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.avgResponseMs, 0) / agents.length) : 0;
    return {
      type,
      displayName: name,
      description: desc,
      totalAgents: agents.length,
      activeAgents: active,
      idleAgents: idle,
      errorAgents: error,
      tasksCompletedToday: totalTasks,
      tasksFailedToday: totalTasks - totalSuccess,
      successRate: totalTasks > 0 ? Math.round((totalSuccess / totalTasks) * 100) : 100,
      avgResponseMs: avgResp,
      agents,
    };
  });
}

function generateHeatmap(): number[] {
  return Array.from({ length: 24 }, () => randomBetween(0, 100));
}

function buildOverview(stats: AgentTypeStats[], heatmap: number[]): WorkforceOverview {
  const totalAgents = stats.reduce((s, t) => s + t.totalAgents, 0);
  const totalActive = stats.reduce((s, t) => s + t.activeAgents, 0);
  const totalIdle = stats.reduce((s, t) => s + t.idleAgents, 0);
  const totalTasks = stats.reduce((s, t) => s + t.tasksCompletedToday, 0);
  const totalSuccess = stats.reduce((s, t) => s + Math.round(t.tasksCompletedToday * t.successRate / 100), 0);
  const avgResp = stats.length > 0 ? Math.round(stats.reduce((s, t) => s + t.avgResponseMs, 0) / stats.length) : 0;

  let topAgent: AgentInstance | null = null;
  for (const t of stats) {
    for (const a of t.agents) {
      if (!topAgent || a.tasksToday > topAgent.tasksToday) topAgent = a;
    }
  }

  return {
    totalAgents,
    totalActive,
    totalIdle,
    totalTasks,
    globalSuccessRate: totalTasks > 0 ? Math.round((totalSuccess / totalTasks) * 100) : 100,
    avgResponseMs: avgResp,
    topPerformerId: topAgent?.id ?? null,
    topPerformerName: topAgent?.name ?? null,
    topPerformerTasks: topAgent?.tasksToday ?? 0,
    heatmapData: heatmap,
  };
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function WorkforcePage() {
  const [typeStats, setTypeStats] = useState<AgentTypeStats[]>(() => generateTypeStats());
  const [heatmap, setHeatmap] = useState<number[]>(() => generateHeatmap());
  const [overview, setOverview] = useState<WorkforceOverview>(() => buildOverview(typeStats, heatmap));
  const [expandedType, setExpandedType] = useState<AgentType | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [spawnModal, setSpawnModal] = useState<AgentType | null>(null);
  const [spawnCount, setSpawnCount] = useState(5);
  const [fireModal, setFireModal] = useState<AgentInstance | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate live updates
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const stats = generateTypeStats();
      const hm = generateHeatmap();
      setTypeStats(stats);
      setHeatmap(hm);
      setOverview(buildOverview(stats, hm));
      setLastRefresh(new Date());
    }, 10_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const stats = generateTypeStats();
    const hm = generateHeatmap();
    setTypeStats(stats);
    setHeatmap(hm);
    setOverview(buildOverview(stats, hm));
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  // Leaderboard: top 15 agents across all types
  const leaderboard = useMemo(() => {
    const all: AgentInstance[] = [];
    for (const t of typeStats) all.push(...t.agents);
    return all
      .sort((a, b) => b.tasksToday - a.tasksToday || b.successRate - a.successRate)
      .slice(0, 15);
  }, [typeStats]);

  // Underperformers
  const underperformers = useMemo(() => {
    const all: AgentInstance[] = [];
    for (const t of typeStats) all.push(...t.agents);
    return all.filter(a => a.tier === 'underperformer').sort((a, b) => a.successRate - b.successRate);
  }, [typeStats]);

  const handleSpawn = () => {
    setSpawnModal(null);
    handleRefresh();
  };

  const handleFire = () => {
    setFireModal(null);
    handleRefresh();
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <Users className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">AI Agent Workforce</h1>
              <p className="mt-1 text-[hsl(var(--muted-foreground))] leading-relaxed">
                {overview.totalAgents} agents deployed &middot; {overview.totalActive} active &middot; {formatNumber(overview.totalTasks)} tasks today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
              Auto-refresh 10s &middot; {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-9 items-center gap-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Global Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Agents" value={overview.totalAgents} icon={<Bot className="h-4 w-4 text-violet-400" />} />
          <StatCard label="Active Now" value={overview.totalActive} icon={<Activity className="h-4 w-4 text-emerald-400" />} color="text-emerald-400" pulse />
          <StatCard label="Idle Reserve" value={overview.totalIdle} icon={<Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />} color="text-[hsl(var(--muted-foreground))]" />
          <StatCard label="Tasks Today" value={formatNumber(overview.totalTasks)} icon={<CheckCircle className="h-4 w-4 text-cyan-400" />} color="text-cyan-400" />
          <StatCard label="Success Rate" value={`${overview.globalSuccessRate}%`} icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} color="text-emerald-400" />
          <StatCard label="Avg Response" value={formatMs(overview.avgResponseMs)} icon={<Zap className="h-4 w-4 text-amber-400" />} color="text-amber-400" />
        </div>

        {/* Agent Activity Heatmap */}
        <div className="mb-8">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6">
            <h2 className="mb-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-400" />
              Agent Activity Heatmap (24h)
            </h2>
            <div className="flex items-end gap-1 h-20">
              {heatmap.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm transition-all duration-300"
                    style={{
                      height: `${Math.max(4, val * 0.8)}px`,
                      backgroundColor: val > 75 ? 'rgb(167, 139, 250)' : val > 50 ? 'rgb(96, 165, 250)' : val > 25 ? 'rgb(161, 161, 170)' : 'rgb(63, 63, 70)',
                      opacity: val > 0 ? 0.5 + val * 0.005 : 0.2,
                    }}
                  />
                  {i % 4 === 0 && <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{i}h</span>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--muted))]" /> Low</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--muted-foreground))]" /> Medium</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-400" /> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-violet-400" /> Peak</span>
            </div>
          </div>
        </div>

        {/* Two-Column: Agent Types + Leaderboard */}
        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Agent Type Cards */}
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-400" />
              Agent Workforce by Type
            </h2>

            {typeStats.map((ts) => {
              const meta = AGENT_TYPE_META[ts.type];
              const Icon = meta.icon;
              const isExpanded = expandedType === ts.type;

              return (
                <div
                  key={ts.type}
                  className={`bg-[hsl(var(--card))] border rounded-2xl transition-all duration-200 ${
                    isExpanded ? 'border-violet-500/40' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
                  }`}
                >
                  {/* Type Header */}
                  <button
                    onClick={() => setExpandedType(isExpanded ? null : ts.type)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.bgColor} border ${meta.borderColor}`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-semibold text-[hsl(var(--foreground))]">{ts.displayName}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.bgColor} ${meta.color} ${meta.borderColor}`}>
                            {ts.totalAgents} agents
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{ts.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <div className="hidden md:flex items-center gap-5 text-xs text-[hsl(var(--muted-foreground))]">
                        <span><span className="text-emerald-400 font-medium">{ts.activeAgents}</span> active</span>
                        <span><span className="text-[hsl(var(--foreground))] font-medium">{ts.idleAgents}</span> idle</span>
                        <span><span className="text-cyan-400 font-medium">{ts.tasksCompletedToday}</span> tasks</span>
                        <span><span className={`font-medium ${ts.successRate >= 90 ? 'text-emerald-400' : ts.successRate >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{ts.successRate}%</span> success</span>
                        <span className="text-[hsl(var(--muted-foreground))]">{formatMs(ts.avgResponseMs)}</span>
                      </div>

                      {/* Spawn button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSpawnModal(ts.type); }}
                        className="flex h-8 items-center gap-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 px-3 text-[11px] font-medium uppercase tracking-wider text-violet-400 hover:bg-violet-600/30 transition-all duration-200"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Hire
                      </button>

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                    </div>
                  </button>

                  {/* Expanded Agent List */}
                  {isExpanded && (
                    <div className="border-t border-[hsl(var(--border))] p-5">
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                        <MiniStat label="Active" value={ts.activeAgents} color="text-emerald-400" />
                        <MiniStat label="Idle" value={ts.idleAgents} />
                        <MiniStat label="Errors" value={ts.errorAgents} color={ts.errorAgents > 0 ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'} />
                        <MiniStat label="Tasks Today" value={ts.tasksCompletedToday} color="text-cyan-400" />
                        <MiniStat label="Avg Response" value={formatMs(ts.avgResponseMs)} isText />
                      </div>

                      {/* Agent Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[hsl(var(--border))]">
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Agent</th>
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))] text-right">Tasks</th>
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))] text-right">Success</th>
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))] text-right">Avg Time</th>
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Tier</th>
                              <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))] text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {ts.agents.map((agent) => {
                              const sc = STATUS_COLORS[agent.status];
                              const tc = TIER_COLORS[agent.tier];
                              return (
                                <tr key={agent.id} className="hover:bg-[hsl(var(--muted))] transition-colors">
                                  <td className="py-3 pr-4">
                                    <span className="text-[hsl(var(--foreground))] font-medium font-mono text-[11px]">{agent.name}</span>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${sc.bg} ${sc.label}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
                                      {agent.status}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4 text-right text-[hsl(var(--foreground))] font-mono">{agent.tasksToday}</td>
                                  <td className="py-3 pr-4 text-right">
                                    <span className={`font-mono ${agent.successRate >= 90 ? 'text-emerald-400' : agent.successRate >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                                      {agent.successRate}%
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4 text-right text-[hsl(var(--muted-foreground))] font-mono">{formatMs(agent.avgResponseMs)}</td>
                                  <td className="py-3 pr-4">
                                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tc.bg} ${tc.text} ${tc.border}`}>
                                      {agent.tier === 'elite' && <Crown className="h-3 w-3" />}
                                      {agent.tier === 'underperformer' && <TrendingDown className="h-3 w-3" />}
                                      {agent.tier}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    {agent.tier === 'underperformer' && (
                                      <button
                                        onClick={() => setFireModal(agent)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-red-600/20 border border-red-500/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400 hover:bg-red-600/30 transition-all duration-200"
                                      >
                                        <UserMinus className="h-3 w-3" />
                                        Fire
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Leaderboard + Underperformers */}
          <div className="space-y-6">
            {/* Performance Leaderboard */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl">
              <button
                onClick={() => setLeaderboardOpen(!leaderboardOpen)}
                className="flex w-full items-center justify-between p-5"
              >
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  Performance Leaderboard
                </h2>
                {leaderboardOpen ? <ChevronUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
              </button>

              {leaderboardOpen && (
                <div className="border-t border-[hsl(var(--border))] px-5 pb-5">
                  <div className="space-y-1 mt-3">
                    {leaderboard.map((agent, idx) => {
                      const meta = AGENT_TYPE_META[agent.type];
                      const tc = TIER_COLORS[agent.tier];
                      return (
                        <div
                          key={agent.id}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                            idx < 3 ? 'bg-amber-500/[0.04]' : 'hover:bg-[hsl(var(--muted))]'
                          }`}
                        >
                          <span className={`w-5 text-right text-[11px] font-mono font-bold ${idx < 3 ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
                            {idx + 1}
                          </span>
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${meta.bgColor}`}>
                            <meta.icon className={`h-3 w-3 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-[hsl(var(--foreground))] font-medium font-mono truncate block">{agent.name}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-cyan-400 font-mono font-medium">{agent.tasksToday}</span>
                            <span className={`text-[10px] font-mono ${agent.successRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {agent.successRate}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Underperformers */}
            {underperformers.length > 0 && (
              <div className="bg-[hsl(var(--card))] border border-red-500/20 rounded-2xl p-5">
                <h2 className="mb-4 text-sm font-semibold flex items-center gap-2">
                  <Skull className="h-4 w-4 text-red-400" />
                  Underperformers
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg px-2 py-0.5 font-medium">
                    {underperformers.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {underperformers.map((agent) => {
                    const meta = AGENT_TYPE_META[agent.type];
                    return (
                      <div key={agent.id} className="flex items-center justify-between rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${meta.bgColor}`}>
                            <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          </div>
                          <div>
                            <span className="text-[11px] text-[hsl(var(--foreground))] font-medium font-mono block">{agent.name}</span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{agent.tasksToday} tasks &middot; <span className="text-red-400">{agent.successRate}%</span></span>
                          </div>
                        </div>
                        <button
                          onClick={() => setFireModal(agent)}
                          className="flex h-7 items-center gap-1 rounded-lg bg-red-600/20 border border-red-500/30 px-2.5 text-[10px] font-medium uppercase tracking-wider text-red-400 hover:bg-red-600/30 transition-all duration-200"
                        >
                          <UserMinus className="h-3 w-3" />
                          Fire
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Performer Highlight */}
            {overview.topPerformerName && (
              <div className="bg-[hsl(var(--card))] border border-amber-500/20 rounded-2xl p-5">
                <h2 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  Top Performer
                </h2>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] block">{overview.topPerformerName}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{overview.topPerformerTasks} tasks completed today</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spawn Modal */}
        {spawnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-violet-400" />
                  Hire {AGENT_TYPE_META[spawnModal].icon && (() => { const I = AGENT_TYPE_META[spawnModal].icon; return <I className={`h-4 w-4 ${AGENT_TYPE_META[spawnModal].color}`} />; })()}
                  {typeStats.find(t => t.type === spawnModal)?.displayName}
                </h3>
                <button
                  onClick={() => setSpawnModal(null)}
                  className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                Spawn new agents into the {spawnModal} workforce pool. They will be initialized with base training and enter idle reserve.
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setSpawnCount(Math.max(1, spawnCount - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-3xl font-bold text-[hsl(var(--foreground))] w-16 text-center tabular-nums">{spawnCount}</span>
                <button
                  onClick={() => setSpawnCount(spawnCount + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setSpawnModal(null)}
                  className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSpawn}
                  className="bg-violet-600 hover:bg-violet-500 text-[hsl(var(--foreground))] rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Hire {spawnCount} Agents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fire Modal */}
        {fireModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Terminate Agent
                </h3>
                <button
                  onClick={() => setFireModal(null)}
                  className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  {(() => { const meta = AGENT_TYPE_META[fireModal.type]; const I = meta.icon; return (
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${meta.bgColor} border ${meta.borderColor}`}>
                      <I className={`h-4 w-4 ${meta.color}`} />
                    </div>
                  ); })()}
                  <div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] block font-mono">{fireModal.name}</span>
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{fireModal.type} agent</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))] block">Tasks</span>
                    <span className="text-[hsl(var(--foreground))] font-medium">{fireModal.tasksToday}</span>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))] block">Success</span>
                    <span className="text-red-400 font-medium">{fireModal.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--muted-foreground))] block">Avg Time</span>
                    <span className="text-[hsl(var(--foreground))] font-medium">{formatMs(fireModal.avgResponseMs)}</span>
                  </div>
                </div>
              </div>
              <p className="mb-5 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                This agent will be terminated and removed from the workforce. A replacement can be hired from the pool.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setFireModal(null)}
                  className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFire}
                  className="bg-red-600 hover:bg-red-500 text-[hsl(var(--foreground))] rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <UserMinus className="h-4 w-4" />
                  Fire Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function StatCard({ label, value, icon, color, pulse }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string; pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      {icon}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className={`text-xl font-semibold tracking-tight ${color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
          {pulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, isText }: { label: string; value: string | number; color?: string; isText?: boolean }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] p-3">
      <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
      <p className={`mt-1 text-sm font-medium ${isText ? 'text-[hsl(var(--muted-foreground))]' : color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ListOrdered, Users, Phone, MessageSquare, Clock,
  Plus, User, Activity, CheckCircle2, AlertTriangle,
  ChevronLeft, Settings,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  MetricTile,
  Skeleton,
} from '@memelli/ui';

/* ---------- Types ---------- */

interface QueueAgent {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'break';
}

interface Queue {
  id: string;
  name: string;
  description?: string;
  type: 'phone' | 'chat' | 'email';
  routingStrategy: 'round_robin' | 'least_busy' | 'skill_based' | 'priority';
  status: 'active' | 'paused' | 'closed';
  waiting: number;
  active: number;
  completed: number;
  avgWaitTime: number;
  maxWaitTime?: number;
  agents: QueueAgent[];
}

type QueuesResponse = Queue[];

interface CreateQueuePayload {
  name: string;
  routingStrategy: string;
}

/* ---------- Constants ---------- */

const TYPE_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  email: <ListOrdered className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  phone: 'text-emerald-400 bg-emerald-500/[0.08] border-emerald-500/20',
  chat: 'text-blue-400 bg-blue-500/[0.08] border-blue-500/20',
  email: 'text-primary bg-primary/80/[0.08] border-primary/20',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'muted'> = {
  active: 'success',
  paused: 'warning',
  closed: 'muted',
};

const ROUTING_OPTIONS = [
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'least_busy', label: 'Least Busy' },
  { value: 'skill_based', label: 'Skill Based' },
  { value: 'priority', label: 'Priority' },
];

const ROUTING_LABELS: Record<string, string> = Object.fromEntries(
  ROUTING_OPTIONS.map((o) => [o.value, o.label]),
);

/* ---------- Helpers ---------- */

function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/* ---------- Component ---------- */

export default function QueueDashboardPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRouting, setNewRouting] = useState('round_robin');

  /* --- Fetch queues --- */
  const {
    data: queuesData,
    isLoading,
    error,
  } = useQuery<QueuesResponse>({
    queryKey: ['comms-queues'],
    queryFn: async () => {
      const res = await api.get<QueuesResponse>('/api/comms/queues');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 10_000,
  });

  const queues: Queue[] = (Array.isArray(queuesData) ? queuesData : (queuesData as any)?.data) ?? [];
  const selectedQueue = queues.find((q: Queue) => q.id === selectedQueueId);

  /* --- Create queue mutation --- */
  const createMutation = useMutation({
    mutationFn: async (payload: CreateQueuePayload) => {
      const res = await api.post<{ success: boolean }>('/api/comms/queues', payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comms-queues'] });
      setCreateOpen(false);
      setNewName('');
      setNewRouting('round_robin');
    },
  });

  /* --- Aggregate stats --- */
  const totalWaiting = queues.reduce((acc, q) => acc + q.waiting, 0);
  const totalActive = queues.reduce((acc, q) => acc + q.active, 0);
  const totalCompleted = queues.reduce((acc, q) => acc + q.completed, 0);
  const avgWait =
    queues.length > 0
      ? Math.round(queues.reduce((acc, q) => acc + q.avgWaitTime, 0) / queues.length)
      : 0;
  const totalAgentsAvailable = queues.reduce(
    (acc, q) => acc + q.agents.filter((a) => a.status === 'available').length,
    0,
  );

  /* --- Handlers --- */

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), routingStrategy: newRouting });
  }

  /* ---------- Detail view ---------- */
  if (selectedQueue) {
    const isOverSLA =
      selectedQueue.maxWaitTime !== undefined &&
      selectedQueue.avgWaitTime > selectedQueue.maxWaitTime;
    const available = selectedQueue.agents.filter((a) => a.status === 'available');
    const busy = selectedQueue.agents.filter((a) => a.status === 'busy');
    const onBreak = selectedQueue.agents.filter((a) => a.status === 'break');

    return (
      <div className="bg-card min-h-screen p-6 space-y-6">
        <PageHeader
          title={selectedQueue.name}
          subtitle={selectedQueue.description || 'Queue detail view'}
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'Queues', href: '#' },
            { label: selectedQueue.name },
          ]}
          actions={
            <Button variant="ghost" className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200" onClick={() => setSelectedQueueId(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Queues
            </Button>
          }
        />

        {/* Detail metrics */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
          <MetricTile
            label="Calls Waiting"
            value={selectedQueue.waiting}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricTile
            label="Active Now"
            value={selectedQueue.active}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricTile
            label="Completed Today"
            value={selectedQueue.completed}
            icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricTile
            label="Avg Wait Time"
            value={formatWaitTime(selectedQueue.avgWaitTime)}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricTile
            label="Agents Available"
            value={`${available.length} / ${selectedQueue.agents.length}`}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* SLA progress */}
        {selectedQueue.maxWaitTime && (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Wait time vs SLA target</span>
                <span className="text-sm text-muted-foreground">
                  {formatWaitTime(selectedQueue.avgWaitTime)} / {formatWaitTime(selectedQueue.maxWaitTime)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    isOverSLA
                      ? 'bg-primary/80'
                      : selectedQueue.avgWaitTime / selectedQueue.maxWaitTime > 0.7
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedQueue.avgWaitTime / selectedQueue.maxWaitTime) * 100)}%`,
                  }}
                />
              </div>
              {isOverSLA && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-primary">SLA threshold exceeded</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Queue config */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${TYPE_COLORS[selectedQueue.type]}`}>
                  {TYPE_ICONS[selectedQueue.type]}
                  {selectedQueue.type}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Routing Strategy</span>
                <span className="text-sm text-foreground">
                  {ROUTING_LABELS[selectedQueue.routingStrategy] ?? selectedQueue.routingStrategy}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={STATUS_VARIANTS[selectedQueue.status] ?? 'muted'} className="rounded-xl">
                  {selectedQueue.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Agents list */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                Agents ({selectedQueue.agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {selectedQueue.agents.length === 0 ? (
                <p className="text-sm text-muted-foreground leading-relaxed py-4 text-center">No agents assigned</p>
              ) : (
                <div className="space-y-2">
                  {selectedQueue.agents.map((agent) => {
                    const dotColor =
                      agent.status === 'available'
                        ? 'bg-emerald-400'
                        : agent.status === 'busy'
                          ? 'bg-primary/70'
                          : 'bg-amber-400';
                    return (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                          <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04] text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" /> {available.length} available
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary/70" /> {busy.length} busy
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-400" /> {onBreak.length} on break
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------- Grid view ---------- */
  return (
    <div className="bg-card min-h-screen p-6 space-y-6">
      <PageHeader
        title="Queue Dashboard"
        subtitle="Real-time queue monitoring and management"
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Queues' },
        ]}
        actions={
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create Queue
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
        <MetricTile
          label="Calls Waiting"
          value={isLoading ? '...' : totalWaiting}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Active Calls"
          value={isLoading ? '...' : totalActive}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Completed Today"
          value={isLoading ? '...' : totalCompleted}
          icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Avg Wait"
          value={isLoading ? '...' : formatWaitTime(avgWait)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Agents Available"
          value={isLoading ? '...' : totalAgentsAvailable}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Queue Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      ) : error ? (
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent className="py-12 text-center p-6">
            <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-primary">Failed to load queues</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">Check your connection and try again</p>
          </CardContent>
        </Card>
      ) : queues.length === 0 ? (
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent className="py-12 text-center p-6">
            <ListOrdered className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed">No queues configured</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">Create your first queue to get started</p>
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Queue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {queues.map((queue) => {
            const isOverSLA =
              queue.maxWaitTime !== undefined && queue.avgWaitTime > queue.maxWaitTime;
            const availableAgents = queue.agents.filter((a) => a.status === 'available').length;

            return (
              <Card
                key={queue.id}
                className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:border-white/[0.08] transition-all duration-200 cursor-pointer group"
                onClick={() => setSelectedQueueId(queue.id)}
              >
                <CardHeader className="p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${TYPE_COLORS[queue.type]}`}
                      >
                        {TYPE_ICONS[queue.type]}
                        {queue.type}
                      </span>
                      {queue.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isOverSLA && (
                        <Badge variant="destructive" className="flex items-center gap-1 rounded-xl">
                          <AlertTriangle className="h-3 w-3" /> SLA
                        </Badge>
                      )}
                      <Badge variant={STATUS_VARIANTS[queue.status] ?? 'muted'} className="rounded-xl">
                        {queue.status}
                      </Badge>
                    </div>
                  </div>
                  {queue.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{queue.description}</p>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-center">
                      <p
                        className={`text-2xl font-semibold tracking-tight ${queue.waiting > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}
                      >
                        {queue.waiting}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Waiting</p>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-2xl font-semibold tracking-tight ${availableAgents > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}
                      >
                        {availableAgents}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Agents Free</p>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-2xl font-semibold tracking-tight ${isOverSLA ? 'text-primary' : 'text-foreground'}`}
                      >
                        {formatWaitTime(queue.avgWaitTime)}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Avg Wait</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold tracking-tight text-foreground">{queue.completed}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Done</p>
                    </div>
                  </div>

                  {/* Wait time progress bar */}
                  {queue.maxWaitTime && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Wait vs SLA</span>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          {formatWaitTime(queue.maxWaitTime)} target
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            isOverSLA
                              ? 'bg-primary/80'
                              : queue.avgWaitTime / queue.maxWaitTime > 0.7
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (queue.avgWaitTime / queue.maxWaitTime) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer: agents + routing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {queue.agents.length} agents
                      </span>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
                      {ROUTING_LABELS[queue.routingStrategy] ?? queue.routingStrategy}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Queue Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Queue" className="bg-card backdrop-blur-2xl border-white/[0.06] rounded-xl">
        <div className="space-y-4 p-6">
          <Input
            label="Queue Name"
            placeholder="e.g. General Support"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-card border-white/[0.04] rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          <Select
            label="Routing Strategy"
            options={ROUTING_OPTIONS}
            value={newRouting}
            onChange={(val) => setNewRouting(val)}
            className="bg-card border-white/[0.04] rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          {createMutation.error && (
            <p className="text-sm text-primary">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Failed to create queue'}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Queue'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
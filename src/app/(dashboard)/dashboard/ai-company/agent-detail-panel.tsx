'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bot,
  Brain,
  ClipboardList,
  FileText,
  Calendar,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  Shield,
  Wrench,
  Clock,
} from 'lucide-react';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  StatusBadge,
  Badge,
  Button,
  Spinner,
  Toggle,
} from '@memelli/ui';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentRole {
  id: string;
  slug: string;
  name: string;
  department: string;
  description?: string;
  systemPrompt?: string;
  tools?: string[];
  permissions?: string[];
  reportsTo?: string;
}

interface AgentMemory {
  id: string;
  scope: string;
  key: string;
  value: any;
  importance: number;
  updatedAt: string;
}

interface AgentTask {
  id: string;
  type: string;
  status: string;
  input?: any;
  output?: any;
  createdAt: string;
  completedAt?: string;
}

interface AgentReport {
  id: string;
  title: string;
  type: string;
  content: string;
  createdAt: string;
}

interface AgentSchedule {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

interface AgentDetail {
  id: string;
  name: string;
  status: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  role: AgentRole;
  memories: AgentMemory[];
  tasks: AgentTask[];
  reports: AgentReport[];
  schedules: AgentSchedule[];
  escalationsCreated: any[];
}

const AGENT_STATUS_MAP: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  active: 'green',
  idle: 'blue',
  busy: 'yellow',
  error: 'red',
  disabled: 'gray',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AgentDetailPanel({
  agentId,
  onClose,
}: {
  agentId: string;
  onClose: () => void;
}) {
  const api = useApi();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    const res = await api.get<any>(`/api/agents/${agentId}`);
    if (res.data?.data) setAgent(res.data.data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleDeactivate = async () => {
    setActionLoading(true);
    await api.post<any>(`/api/agents/${agentId}/deactivate`, {});
    setActionLoading(false);
    onClose();
  };

  if (loading || !agent) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const isActive = agent.status !== 'DISABLED';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950 border border-red-800">
            <Bot className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-500">{agent.role?.name}</span>
              <Badge variant="primary" className="capitalize text-[10px]">
                {agent.role?.department}
              </Badge>
            </div>
          </div>
        </div>
        <StatusBadge status={agent.status} customMap={AGENT_STATUS_MAP} />
      </div>

      {/* Tabs */}
      <Tabs defaultTab="overview">
        <TabList>
          <Tab id="overview">Overview</Tab>
          <Tab id="memory">Memory</Tab>
          <Tab id="tasks">Tasks</Tab>
          <Tab id="reports">Reports</Tab>
          <Tab id="schedule">Schedule</Tab>
        </TabList>

        <TabPanels>
          {/* ---- Overview ---- */}
          <TabPanel id="overview">
            <div className="space-y-5 pt-2">
              {/* System prompt */}
              {agent.role?.systemPrompt && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    System Prompt
                  </h4>
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {agent.role.systemPrompt}
                  </div>
                </div>
              )}

              {/* Tools */}
              {agent.role?.tools && agent.role.tools.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    <Wrench className="h-3 w-3" /> Tools
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.role.tools.map((tool) => (
                      <Badge key={tool} variant="default">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions */}
              {agent.role?.permissions && agent.role.permissions.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    <Shield className="h-3 w-3" /> Permissions
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.role.permissions.map((perm) => (
                      <Badge key={perm} variant="info">{perm}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports to */}
              {agent.role?.reportsTo && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Reports To
                  </h4>
                  <p className="text-sm text-zinc-300">{agent.role.reportsTo}</p>
                </div>
              )}

              {/* Description */}
              {agent.role?.description && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-sm text-zinc-300">{agent.role.description}</p>
                </div>
              )}
            </div>
          </TabPanel>

          {/* ---- Memory ---- */}
          <TabPanel id="memory">
            <div className="space-y-3 pt-2">
              {agent.memories.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No memories stored</p>
              ) : (
                agent.memories.map((mem) => (
                  <div key={mem.id} className="rounded-md border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" className="text-[10px]">{mem.scope}</Badge>
                        <span className="text-xs font-medium text-zinc-200">{mem.key}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600">
                        imp: {mem.importance.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono bg-zinc-950 rounded p-2 max-h-24 overflow-y-auto">
                      {typeof mem.value === 'object'
                        ? JSON.stringify(mem.value, null, 2)
                        : String(mem.value)}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Updated {new Date(mem.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabPanel>

          {/* ---- Tasks ---- */}
          <TabPanel id="tasks">
            <div className="space-y-2 pt-2">
              {agent.tasks.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No tasks yet</p>
              ) : (
                agent.tasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-200">{task.type}</span>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    {task.input && (
                      <div className="text-[10px] text-zinc-500 font-mono bg-zinc-950 rounded p-1.5 mt-1.5 max-h-16 overflow-y-auto truncate">
                        Input: {typeof task.input === 'object' ? JSON.stringify(task.input) : String(task.input)}
                      </div>
                    )}
                    {task.output && (
                      <div className="text-[10px] text-zinc-500 font-mono bg-zinc-950 rounded p-1.5 mt-1 max-h-16 overflow-y-auto truncate">
                        Output: {typeof task.output === 'object' ? JSON.stringify(task.output) : String(task.output)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-1.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(task.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabPanel>

          {/* ---- Reports ---- */}
          <TabPanel id="reports">
            <div className="space-y-2 pt-2">
              {agent.reports.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No reports</p>
              ) : (
                agent.reports.map((report) => (
                  <div key={report.id} className="rounded-md border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-200">{report.title}</span>
                      <Badge variant="default" className="text-[10px]">{report.type}</Badge>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-3 mt-1">{report.content}</p>
                    <p className="text-[10px] text-zinc-600 mt-1.5">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabPanel>

          {/* ---- Schedule ---- */}
          <TabPanel id="schedule">
            <div className="space-y-3 pt-2">
              {agent.schedules.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No scheduled reviews</p>
              ) : (
                agent.schedules.map((sched) => (
                  <div key={sched.id} className="flex items-center justify-between rounded-md border border-zinc-800 p-3">
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{sched.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{sched.cron}</p>
                      {sched.lastRunAt && (
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          Last: {new Date(sched.lastRunAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Toggle
                      checked={sched.enabled}
                      size="sm"
                      onChange={() => {/* TODO: toggle schedule */}}
                    />
                  </div>
                ))
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Actions */}
      <div className="border-t border-zinc-800 pt-4">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Pause className="h-3.5 w-3.5" />}
              isLoading={actionLoading}
              onClick={handleDeactivate}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="h-3.5 w-3.5" />}
              isLoading={actionLoading}
              onClick={async () => {
                /* Reactivate would require a separate endpoint */
              }}
            >
              Activate
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Run Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Clear Memory
          </Button>
        </div>
      </div>
    </div>
  );
}

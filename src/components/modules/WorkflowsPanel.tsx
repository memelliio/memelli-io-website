'use client';

import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    ''
  );
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

type WorkflowStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

type TriggerType =
  | 'CONTACT_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'ORDER_CREATED'
  | 'LESSON_COMPLETED'
  | 'PROGRAM_COMPLETED'
  | 'MANUAL'
  | 'SCHEDULED'
  | 'EVENT';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  stepsJson?: unknown;
  createdAt: string;
}

interface Execution {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PENDING';
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  error?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function extractArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if ('data' in r && Array.isArray(r.data)) return r.data as T[];
    if ('data' in r && r.data && typeof r.data === 'object') {
      const inner = r.data as Record<string, unknown>;
      if ('data' in inner && Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function triggerLabel(t: TriggerType): string {
  const map: Record<TriggerType, string> = {
    CONTACT_CREATED: 'Contact Created',
    DEAL_STAGE_CHANGED: 'Deal Stage Changed',
    DEAL_WON: 'Deal Won',
    DEAL_LOST: 'Deal Lost',
    ORDER_CREATED: 'Order Created',
    LESSON_COMPLETED: 'Lesson Completed',
    PROGRAM_COMPLETED: 'Program Completed',
    MANUAL: 'Manual',
    SCHEDULED: 'Scheduled',
    EVENT: 'Event',
  };
  return map[t] ?? t;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const styles: Record<WorkflowStatus, { bg: string; text: string; dot: string }> = {
    ACTIVE: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', dot: '#4ade80' },
    INACTIVE: { bg: 'rgba(113,113,122,0.15)', text: '#a1a1aa', dot: '#71717a' },
    DRAFT: { bg: 'rgba(234,179,8,0.12)', text: '#facc15', dot: '#eab308' },
  };
  const s = styles[status] ?? styles.INACTIVE;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 4,
        background: s.bg,
        fontFamily: 'monospace',
        fontSize: 11,
        color: s.text,
        fontWeight: 600,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function ExecStatusBadge({ status }: { status: Execution['status'] }) {
  const map: Record<Execution['status'], { bg: string; text: string }> = {
    SUCCESS: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80' },
    RUNNING: { bg: 'rgba(59,130,246,0.14)', text: '#60a5fa' },
    FAILED: { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
    PENDING: { bg: 'rgba(234,179,8,0.12)', text: '#facc15' },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span
      style={{
        padding: '2px 7px',
        borderRadius: 4,
        background: s.bg,
        fontFamily: 'monospace',
        fontSize: 10,
        color: s.text,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Icons                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 2l7 4-7 4V2z" fill="currentColor" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 2l10 10M12 2L2 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9 3L5 7l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <path d="M7 2a5 5 0 015 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Create Workflow Modal                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TRIGGER_TYPES: TriggerType[] = [
  'MANUAL',
  'SCHEDULED',
  'EVENT',
  'CONTACT_CREATED',
  'DEAL_STAGE_CHANGED',
  'DEAL_WON',
  'DEAL_LOST',
  'ORDER_CREATED',
  'LESSON_COMPLETED',
  'PROGRAM_COMPLETED',
];

interface CreateModalProps {
  onClose: () => void;
  onCreate: (name: string, triggerType: TriggerType, description?: string) => Promise<void>;
  saving: boolean;
}

function CreateModal({ onClose, onCreate, saving }: CreateModalProps) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<TriggerType>('MANUAL');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    await onCreate(name.trim(), trigger, description.trim() || undefined);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(14,14,14,0.99)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>New Workflow</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', letterSpacing: '0.06em' }}>
              NAME *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name"
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '8px 12px',
                color: 'white',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Trigger Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', letterSpacing: '0.06em' }}>
              TRIGGER TYPE
            </label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as TriggerType)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '8px 12px',
                color: 'white',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: '#111' }}>
                  {triggerLabel(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', letterSpacing: '0.06em' }}>
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '8px 12px',
                color: 'white',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                background: saving
                  ? 'rgba(220,38,38,0.4)'
                  : 'linear-gradient(135deg, #dc2626, #f97316)',
                border: 'none',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving && <IconSpinner />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Executions View                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ExecutionsViewProps {
  workflow: Workflow;
  onBack: () => void;
}

function ExecutionsView({ workflow, onBack }: ExecutionsViewProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<unknown>(`/api/workflows/${workflow.id}/executions`);
    setExecutions(extractArray<Execution>(res));
    setLoading(false);
  }, [workflow.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Back header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#a1a1aa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            gap: 4,
            fontSize: 12,
          }}
        >
          <IconChevronLeft />
          Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, color: 'white', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workflow.name}
          </p>
          <p style={{ margin: 0, color: '#71717a', fontSize: 11, fontFamily: 'monospace' }}>
            Execution History
          </p>
        </div>
        <button
          onClick={load}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#a1a1aa',
            cursor: 'pointer',
            fontSize: 11,
            padding: '4px 10px',
            fontFamily: 'monospace',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: '#52525b', fontSize: 13 }}>
            Loading executions...
          </div>
        ) : executions.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ color: '#52525b', fontSize: 13, margin: 0 }}>No executions yet.</p>
            <p style={{ color: '#3f3f46', fontSize: 12, margin: '6px 0 0' }}>
              Trigger the workflow to see runs here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {executions.map((ex) => (
              <div
                key={ex.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <ExecStatusBadge status={ex.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}>
                    Started: {fmtDateTime(ex.startedAt ?? ex.createdAt)}
                  </p>
                  {ex.completedAt && (
                    <p style={{ margin: '2px 0 0', color: '#71717a', fontSize: 11, fontFamily: 'monospace' }}>
                      Completed: {fmtDateTime(ex.completedAt)}
                    </p>
                  )}
                  {ex.error && (
                    <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: 11 }}>{ex.error}</p>
                  )}
                </div>
                <span style={{ color: '#3f3f46', fontSize: 10, fontFamily: 'monospace', flexShrink: 0 }}>
                  {ex.id.slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Workflow Row                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface WorkflowRowProps {
  workflow: Workflow;
  onToggle: (wf: Workflow) => Promise<void>;
  onRunNow: (wf: Workflow) => Promise<void>;
  onSelect: (wf: Workflow) => void;
  toggling: boolean;
  running: boolean;
}

function WorkflowRow({ workflow, onToggle, onRunNow, onSelect, toggling, running }: WorkflowRowProps) {
  const isManual = workflow.triggerType === 'MANUAL';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'border-color 0.15s',
        cursor: 'default',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => onSelect(workflow)}
          title="View executions"
        >
          <p
            style={{
              margin: 0,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {workflow.name}
          </p>
          {workflow.description && (
            <p
              style={{
                margin: '2px 0 0',
                color: '#71717a',
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {workflow.description}
            </p>
          )}
        </div>
        <StatusBadge status={workflow.status} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: '#52525b',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '2px 7px',
            borderRadius: 4,
            letterSpacing: '0.04em',
          }}
        >
          {triggerLabel(workflow.triggerType)}
        </span>
        <span style={{ color: '#3f3f46', fontSize: 10, fontFamily: 'monospace', marginLeft: 'auto' }}>
          Created {fmtDate(workflow.createdAt)}
        </span>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
        {/* Toggle active/inactive */}
        <button
          onClick={() => onToggle(workflow)}
          disabled={toggling || workflow.status === 'DRAFT'}
          title={workflow.status === 'DRAFT' ? 'Cannot toggle a draft workflow' : undefined}
          style={{
            flex: 1,
            minWidth: 90,
            padding: '6px 10px',
            borderRadius: 6,
            background:
              workflow.status === 'ACTIVE'
                ? 'rgba(113,113,122,0.15)'
                : 'rgba(34,197,94,0.1)',
            border: `1px solid ${workflow.status === 'ACTIVE' ? 'rgba(113,113,122,0.25)' : 'rgba(34,197,94,0.2)'}`,
            color: workflow.status === 'ACTIVE' ? '#a1a1aa' : '#4ade80',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'monospace',
            cursor: toggling || workflow.status === 'DRAFT' ? 'not-allowed' : 'pointer',
            opacity: toggling ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            letterSpacing: '0.04em',
          }}
        >
          {toggling ? <IconSpinner /> : null}
          {workflow.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </button>

        {/* Run Now — only for MANUAL trigger */}
        {isManual && (
          <button
            onClick={() => onRunNow(workflow)}
            disabled={running}
            style={{
              flex: 1,
              minWidth: 90,
              padding: '6px 10px',
              borderRadius: 6,
              background: running
                ? 'rgba(220,38,38,0.2)'
                : 'linear-gradient(135deg, rgba(220,38,38,0.8), rgba(249,115,22,0.8))',
              border: 'none',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            {running ? <IconSpinner /> : <IconPlay />}
            Run Now
          </button>
        )}

        {/* View executions */}
        <button
          onClick={() => onSelect(workflow)}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#71717a',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
          }}
        >
          History
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Panel                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function WorkflowsPanel() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | 'ALL'>('ALL');

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await apiFetch<unknown>('/api/workflows');
    if (res === null) {
      setError('Failed to load workflows.');
    } else {
      setWorkflows(extractArray<Workflow>(res));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  async function handleCreate(name: string, triggerType: TriggerType, description?: string) {
    setSaving(true);
    const res = await apiFetch<unknown>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ name, description, triggerType }),
    });
    setSaving(false);
    if (!res) {
      showToast('Failed to create workflow.', false);
    } else {
      setShowCreate(false);
      showToast('Workflow created.');
      await loadWorkflows();
    }
  }

  async function handleToggle(wf: Workflow) {
    if (wf.status === 'DRAFT') return;
    const next: WorkflowStatus = wf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(wf.id);
    const res = await apiFetch<unknown>(`/api/workflows/${wf.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setTogglingId(null);
    if (!res) {
      showToast('Failed to update status.', false);
    } else {
      showToast(`Workflow ${next === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: next } : w))
      );
    }
  }

  async function handleRunNow(wf: Workflow) {
    setRunningId(wf.id);
    const res = await apiFetch<unknown>(`/api/workflows/${wf.id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({ payload: {} }),
    });
    setRunningId(null);
    if (!res) {
      showToast('Trigger failed.', false);
    } else {
      showToast('Workflow triggered.');
    }
  }

  const filtered =
    filterStatus === 'ALL' ? workflows : workflows.filter((w) => w.status === filterStatus);

  const statusOptions: Array<WorkflowStatus | 'ALL'> = ['ALL', 'ACTIVE', 'INACTIVE', 'DRAFT'];

  /* ─── Executions view ─── */
  if (selectedWorkflow) {
    return (
      <div
        style={{
          background: 'rgba(10,10,10,0.97)',
          borderRadius: 12,
          height: '100%',
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <ExecutionsView
          workflow={selectedWorkflow}
          onBack={() => setSelectedWorkflow(null)}
        />
      </div>
    );
  }

  /* ─── List view ─── */
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          background: 'rgba(10,10,10,0.97)',
          borderRadius: 12,
          height: '100%',
          minHeight: 300,
          minWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: 15 }}>
                Workflows
              </p>
              <p style={{ margin: '2px 0 0', color: '#52525b', fontSize: 11, fontFamily: 'monospace' }}>
                {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={loadWorkflows}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#71717a',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '5px 10px',
                  fontFamily: 'monospace',
                }}
              >
                Refresh
              </button>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #dc2626, #f97316)',
                  border: 'none',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconPlus />
                New
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 5,
                  background: filterStatus === s ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: `1px solid ${filterStatus === s ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                  color: filterStatus === s ? 'white' : '#52525b',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: 48, color: '#52525b', fontSize: 13 }}>
              Loading workflows...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', paddingTop: 48 }}>
              <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
              <button
                onClick={loadWorkflows}
                style={{
                  marginTop: 12,
                  padding: '6px 16px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#a1a1aa',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 48 }}>
              <p style={{ color: '#52525b', fontSize: 13, margin: 0 }}>
                {filterStatus === 'ALL' ? 'No workflows yet.' : `No ${filterStatus} workflows.`}
              </p>
              {filterStatus === 'ALL' && (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    marginTop: 14,
                    padding: '7px 18px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #dc2626, #f97316)',
                    border: 'none',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create your first workflow
                </button>
              )}
            </div>
          ) : (
            filtered.map((wf) => (
              <WorkflowRow
                key={wf.id}
                workflow={wf}
                onToggle={handleToggle}
                onRunNow={handleRunNow}
                onSelect={setSelectedWorkflow}
                toggling={togglingId === wf.id}
                running={runningId === wf.id}
              />
            ))
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: toast.ok ? '#4ade80' : '#f87171',
              padding: '7px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            {toast.msg}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          saving={saving}
        />
      )}
    </>
  );
}

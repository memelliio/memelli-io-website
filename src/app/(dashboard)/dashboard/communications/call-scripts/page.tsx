'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, Trash2, ChevronDown, ChevronRight,
  Save, Edit2, Sparkles, Phone, PhoneOff, PhoneForwarded,
  CheckCircle2, Voicemail, Clock, Copy, Search,
  MessageSquare, Shield, Target, Handshake, AlertTriangle,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardContent,
  Modal,
  Input,
  Select,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { toast } from 'sonner';

/* ───────────────── Types ───────────────── */

type ScriptCategory = 'cold_call' | 'follow_up' | 'appointment_confirm' | 'objection_handling' | 'closing';
type OutcomeType = 'connected' | 'voicemail' | 'callback' | 'closed' | 'no_answer';

interface ObjectionResponse {
  id: string;
  objection: string;
  response: string;
}

interface ScriptOutcome {
  id: string;
  outcome: OutcomeType;
  count: number;
  lastUsed: string | null;
}

interface CallScript {
  id: string;
  title: string;
  category: ScriptCategory;
  purpose: string;
  scriptText: string;
  keyPhrases: string[];
  objectionResponses: ObjectionResponse[];
  outcomes: ScriptOutcome[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type CallScriptsResponse = CallScript[];

/* ───────────────── Constants ───────────────── */

const CATEGORY_CONFIG: Record<ScriptCategory, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  cold_call: {
    label: 'Cold Call',
    icon: <Phone className="h-3.5 w-3.5" />,
    color: 'text-blue-300 border-blue-400/20',
    bgColor: 'bg-blue-500/[0.08]',
  },
  follow_up: {
    label: 'Follow-Up',
    icon: <PhoneForwarded className="h-3.5 w-3.5" />,
    color: 'text-emerald-300 border-emerald-400/20',
    bgColor: 'bg-emerald-500/[0.08]',
  },
  appointment_confirm: {
    label: 'Appointment Confirm',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: 'text-amber-300 border-amber-400/20',
    bgColor: 'bg-amber-500/[0.08]',
  },
  objection_handling: {
    label: 'Objection Handling',
    icon: <Shield className="h-3.5 w-3.5" />,
    color: 'text-red-300 border-red-400/20',
    bgColor: 'bg-red-500/[0.08]',
  },
  closing: {
    label: 'Closing',
    icon: <Handshake className="h-3.5 w-3.5" />,
    color: 'text-primary/80 border-primary/20',
    bgColor: 'bg-primary/80/[0.08]',
  },
};

const CATEGORY_OPTIONS = [
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'appointment_confirm', label: 'Appointment Confirm' },
  { value: 'objection_handling', label: 'Objection Handling' },
  { value: 'closing', label: 'Closing' },
];

const OUTCOME_CONFIG: Record<OutcomeType, { label: string; icon: React.ReactNode; color: string }> = {
  connected: { label: 'Connected', icon: <Phone className="h-3 w-3" />, color: 'text-emerald-400' },
  voicemail: { label: 'Voicemail', icon: <Voicemail className="h-3 w-3" />, color: 'text-amber-400' },
  callback: { label: 'Callback', icon: <Clock className="h-3 w-3" />, color: 'text-blue-400' },
  closed: { label: 'Closed', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-primary' },
  no_answer: { label: 'No Answer', icon: <PhoneOff className="h-3 w-3" />, color: 'text-muted-foreground' },
};

function genId() {
  return `cs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ───────────────── Highlighted Script Text ───────────────── */

function HighlightedText({ text, keyPhrases }: { text: string; keyPhrases: string[] }) {
  if (!keyPhrases.length || !text) {
    return <span>{text}</span>;
  }

  const escaped = keyPhrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isHighlighted = keyPhrases.some(
          (kp) => kp.toLowerCase() === part.toLowerCase()
        );
        return isHighlighted ? (
          <mark
            key={i}
            className="bg-red-500/20 text-red-300 rounded px-0.5 font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

/* ───────────────── Component ───────────────── */

export default function CallScriptsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  /* ---- UI State ---- */
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editScriptId, setEditScriptId] = useState<string | null>(null);
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
  const [expandedObjections, setExpandedObjections] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  /* ---- Form State ---- */
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ScriptCategory>('cold_call');
  const [formPurpose, setFormPurpose] = useState('');
  const [formScriptText, setFormScriptText] = useState('');
  const [formKeyPhrases, setFormKeyPhrases] = useState('');
  const [formObjections, setFormObjections] = useState<ObjectionResponse[]>([]);

  /* ---- Queries ---- */
  const { data: scripts = [], isLoading } = useQuery<CallScriptsResponse>({
    queryKey: ['call-scripts'],
    queryFn: async () => {
      const res = await api.get<CallScriptsResponse>('/api/comms/call-scripts');
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  /* ---- Mutations ---- */
  const createScript = useMutation({
    mutationFn: async (payload: Partial<CallScript>) => {
      const res = await api.post<CallScript>('/api/comms/call-scripts', payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      toast.success('Call script created');
      resetForm();
      setCreateModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<CallScript>) => {
      const res = await api.patch<CallScript>(`/api/comms/call-scripts/${id}`, payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      toast.success('Script updated');
      resetForm();
      setEditScriptId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/comms/call-scripts/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      toast.success('Script deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch<CallScript>(`/api/comms/call-scripts/${id}`, { isActive });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      toast.success(vars.isActive ? 'Script activated' : 'Script deactivated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /* ---- AI Generate ---- */
  async function handleAiGenerate() {
    if (!formCategory || !formPurpose.trim()) {
      toast.error('Set category and purpose before generating');
      return;
    }
    setAiGenerating(true);
    try {
      const res = await api.post<{
        scriptText: string;
        keyPhrases: string[];
        objectionResponses: ObjectionResponse[];
      }>('/api/comms/call-scripts/ai-generate', {
        category: formCategory,
        purpose: formPurpose,
        title: formTitle,
      });
      if (res.error) throw new Error(res.error);
      if (res.data) {
        setFormScriptText(res.data.scriptText);
        setFormKeyPhrases(res.data.keyPhrases.join(', '));
        setFormObjections(
          res.data.objectionResponses.map((o) => ({ ...o, id: genId() }))
        );
        toast.success('Script generated by AI');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  }

  /* ---- Helpers ---- */
  function resetForm() {
    setFormTitle('');
    setFormCategory('cold_call');
    setFormPurpose('');
    setFormScriptText('');
    setFormKeyPhrases('');
    setFormObjections([]);
  }

  function openEdit(script: CallScript) {
    setFormTitle(script.title);
    setFormCategory(script.category);
    setFormPurpose(script.purpose);
    setFormScriptText(script.scriptText);
    setFormKeyPhrases(script.keyPhrases.join(', '));
    setFormObjections(script.objectionResponses);
    setEditScriptId(script.id);
  }

  function handleSave() {
    const keyPhrases = formKeyPhrases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      purpose: formPurpose.trim(),
      scriptText: formScriptText.trim(),
      keyPhrases,
      objectionResponses: formObjections,
    };

    if (editScriptId) {
      updateScript.mutate({ id: editScriptId, ...payload });
    } else {
      createScript.mutate(payload);
    }
  }

  function addObjection() {
    setFormObjections((prev) => [
      ...prev,
      { id: genId(), objection: '', response: '' },
    ]);
  }

  function updateObjection(id: string, field: 'objection' | 'response', value: string) {
    setFormObjections((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  }

  function removeObjection(id: string) {
    setFormObjections((prev) => prev.filter((o) => o.id !== id));
  }

  const toggleExpand = useCallback((id: string) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleObjection = useCallback((id: string) => {
    setExpandedObjections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function copyScript(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Script copied to clipboard');
  }

  /* ---- Filtered Scripts ---- */
  const filteredScripts = scripts.filter((s) => {
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.scriptText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ---- Outcome totals across all scripts ---- */
  const totalOutcomes = scripts.reduce(
    (acc, s) => {
      s.outcomes.forEach((o) => {
        acc[o.outcome] = (acc[o.outcome] || 0) + o.count;
      });
      return acc;
    },
    {} as Record<OutcomeType, number>
  );

  /* ───────────────── Render ───────────────── */

  const isFormOpen = createModalOpen || !!editScriptId;
  const isSaving = createScript.isPending || updateScript.isPending;

  return (
    <div className="bg-card min-h-screen">
      <div className="p-8 space-y-8">
        <PageHeader
          title="Call Scripts"
          subtitle={`${scripts.length} script${scripts.length !== 1 ? 's' : ''} for phone agents`}
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'Call Scripts' },
          ]}
          actions={
            <Button
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200"
              onClick={() => { resetForm(); setCreateModalOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Script
            </Button>
          }
        />

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {(Object.entries(OUTCOME_CONFIG) as [OutcomeType, typeof OUTCOME_CONFIG.connected][]).map(
            ([key, cfg]) => (
              <div
                key={key}
                className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl px-5 py-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    {cfg.label}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-foreground tabular-nums">
                  {totalOutcomes[key] || 0}
                </p>
              </div>
            )
          )}
        </div>

        {/* ─── Filters ─── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.04] bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 backdrop-blur-xl"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                filterCategory === 'all'
                  ? 'bg-red-600/20 border-red-400/30 text-red-300'
                  : 'bg-card border-white/[0.04] text-muted-foreground hover:border-white/[0.08] hover:text-foreground'
              }`}
            >
              All
            </button>
            {CATEGORY_OPTIONS.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat.value as ScriptCategory];
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                    filterCategory === cat.value
                      ? `${cfg.bgColor} ${cfg.color}`
                      : 'bg-card border-white/[0.04] text-muted-foreground hover:border-white/[0.08] hover:text-foreground'
                  }`}
                >
                  {cfg.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Script List ─── */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl bg-card" />
            ))}
          </div>
        ) : filteredScripts.length === 0 ? (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
                {searchQuery || filterCategory !== 'all'
                  ? 'No scripts match your filters'
                  : 'No call scripts yet'}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {searchQuery || filterCategory !== 'all'
                  ? 'Try adjusting your search or category filter.'
                  : 'Create your first script to equip phone agents.'}
              </p>
              {!searchQuery && filterCategory === 'all' && (
                <Button
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200"
                  onClick={() => { resetForm(); setCreateModalOpen(true); }}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> New Script
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredScripts.map((script) => {
              const isExpanded = expandedScripts.has(script.id);
              const catCfg = CATEGORY_CONFIG[script.category];
              const totalUses = script.outcomes.reduce((sum, o) => sum + o.count, 0);

              return (
                <Card
                  key={script.id}
                  className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl"
                >
                  <CardContent className="p-0">
                    {/* Script Header */}
                    <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.04]">
                      <button
                        onClick={() => toggleExpand(script.id)}
                        className="text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-semibold text-foreground truncate">
                            {script.title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium ${catCfg.bgColor} ${catCfg.color}`}
                          >
                            {catCfg.icon}
                            {catCfg.label}
                          </span>
                          <Badge
                            className={`text-[11px] uppercase tracking-wider font-medium border shrink-0 ${
                              script.isActive
                                ? 'bg-emerald-500/[0.08] text-emerald-300 border-emerald-400/20'
                                : 'bg-muted text-muted-foreground border-white/[0.06]'
                            }`}
                          >
                            {script.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {script.purpose}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Usage count */}
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Uses</p>
                          <p className="text-sm font-semibold text-foreground tabular-nums">
                            {totalUses}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                            size="sm"
                            onClick={() =>
                              toggleActive.mutate({
                                id: script.id,
                                isActive: !script.isActive,
                              })
                            }
                          >
                            {script.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                            size="sm"
                            onClick={() => openEdit(script)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            className="bg-red-600/10 hover:bg-red-500/20 border border-red-400/20 text-red-300 rounded-xl transition-all duration-200"
                            size="sm"
                            onClick={() => deleteScript.mutate(script.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 py-6 space-y-6">
                        {/* Script Text */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                              Script
                            </p>
                            <button
                              onClick={() => copyScript(script.scriptText)}
                              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </button>
                          </div>
                          <div className="rounded-xl border border-white/[0.04] bg-card px-5 py-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            <HighlightedText
                              text={script.scriptText}
                              keyPhrases={script.keyPhrases}
                            />
                          </div>
                          {script.keyPhrases.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                                Key phrases:
                              </span>
                              {script.keyPhrases.map((phrase, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs bg-red-500/10 text-red-300 border border-red-400/20"
                                >
                                  {phrase}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Objection Responses */}
                        {script.objectionResponses.length > 0 && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                              Objection Responses ({script.objectionResponses.length})
                            </p>
                            <div className="space-y-2">
                              {script.objectionResponses.map((obj) => {
                                const isObjExpanded = expandedObjections.has(obj.id);
                                return (
                                  <div
                                    key={obj.id}
                                    className="rounded-xl border border-white/[0.04] bg-card overflow-hidden"
                                  >
                                    <button
                                      onClick={() => toggleObjection(obj.id)}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-all duration-200"
                                    >
                                      {isObjExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                      )}
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                      <span className="text-sm text-foreground font-medium truncate">
                                        &quot;{obj.objection}&quot;
                                      </span>
                                    </button>
                                    {isObjExpanded && (
                                      <div className="px-4 pb-4 pl-11">
                                        <div className="rounded-lg bg-emerald-500/[0.05] border border-emerald-400/10 px-4 py-3">
                                          <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-medium mb-1.5">
                                            Response
                                          </p>
                                          <p className="text-sm text-foreground leading-relaxed">
                                            {obj.response}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Outcome Tracking */}
                        {script.outcomes.length > 0 && (
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                              Outcome Tracking
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                              {script.outcomes.map((outcome) => {
                                const ocCfg = OUTCOME_CONFIG[outcome.outcome];
                                return (
                                  <div
                                    key={outcome.id}
                                    className="rounded-xl border border-white/[0.04] bg-card px-4 py-3"
                                  >
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className={ocCfg.color}>
                                        {ocCfg.icon}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {ocCfg.label}
                                      </span>
                                    </div>
                                    <p className="text-lg font-semibold text-foreground tabular-nums">
                                      {outcome.count}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── Create / Edit Modal ─── */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setEditScriptId(null);
            resetForm();
          }}
          title={editScriptId ? 'Edit Call Script' : 'Create Call Script'}
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <Input
              label="Script Title"
              placeholder="e.g. New Lead Cold Call"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />

            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={formCategory}
              onChange={(val) => setFormCategory(val as ScriptCategory)}
            />

            <Input
              label="Purpose"
              placeholder="e.g. First contact with inbound leads to qualify and schedule..."
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
            />

            {/* AI Generate Button */}
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-card px-4 py-3">
              <Sparkles className="h-4 w-4 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">AI Script Generator</p>
                <p className="text-xs text-muted-foreground">
                  Auto-generate script text, key phrases, and objection responses
                </p>
              </div>
              <Button
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-400/20 text-red-300 rounded-xl transition-all duration-200 shrink-0"
                size="sm"
                onClick={handleAiGenerate}
                isLoading={aiGenerating}
                disabled={!formPurpose.trim()}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate
              </Button>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Script Text
              </label>
              <textarea
                value={formScriptText}
                onChange={(e) => setFormScriptText(e.target.value)}
                rows={10}
                placeholder="Hi [Name], this is [Agent] from [Company]. I'm calling because..."
                className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none backdrop-blur-xl font-mono leading-relaxed"
              />
            </div>

            <Input
              label="Key Phrases (comma-separated)"
              placeholder="e.g. schedule a call, special offer, limited time"
              value={formKeyPhrases}
              onChange={(e) => setFormKeyPhrases(e.target.value)}
            />

            {/* Objection Responses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Objection Responses
                </label>
                <button
                  onClick={addObjection}
                  className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-all duration-200 font-medium"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              {formObjections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No objection responses yet. Add one or use AI generate.
                </p>
              ) : (
                <div className="space-y-3">
                  {formObjections.map((obj) => (
                    <div
                      key={obj.id}
                      className="rounded-xl border border-white/[0.04] bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder={"e.g. \"I'm not interested right now\""}
                            value={obj.objection}
                            onChange={(e) =>
                              updateObjection(obj.id, 'objection', e.target.value)
                            }
                            className="w-full rounded-lg border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                          />
                          <textarea
                            placeholder="Response to this objection..."
                            value={obj.response}
                            onChange={(e) =>
                              updateObjection(obj.id, 'response', e.target.value)
                            }
                            rows={2}
                            className="w-full rounded-lg border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none"
                          />
                        </div>
                        <button
                          onClick={() => removeObjection(obj.id)}
                          className="text-muted-foreground hover:text-red-400 transition-all duration-200 p-1 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditScriptId(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={!formTitle.trim() || !formScriptText.trim()}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {editScriptId ? 'Update Script' : 'Create Script'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

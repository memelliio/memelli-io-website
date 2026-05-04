'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MessageSquare, Plus, FileText, Calendar,
  Users, X, Edit3, CheckCircle2, Clock, Star, TrendingUp,
  Building2, MapPin, Hash, User, Tag, Shield, Briefcase,
  Video, ListTodo, Paperclip, Bell, ChevronRight, Send,
  BarChart3, Heart, Target, Zap, AlertCircle,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommType = 'EMAIL' | 'CALL' | 'SMS' | 'MEETING' | 'NOTE';
type ContactStatus = 'lead' | 'customer' | 'partner';
type LifecycleStage = 'lead' | 'prospect' | 'customer' | 'advocate';

interface ContactProfile {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  tags: string[];
  source?: string | null;
  status?: string | null;
  lifecycleStage?: string | null;
  owner?: string | null;
  customFields: Record<string, unknown>;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  preferredChannel?: string | null;
  engagementScore?: number;
  createdAt: string;
  updatedAt?: string;
}

interface TimelineItem {
  id: string;
  type: string;
  subtype?: string;
  subject?: string;
  body?: string;
  outcome?: string;
  actor?: string;
  dealTitle?: string;
  dealId?: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage?: string;
  status: string;
  pipeline?: string;
  probability?: number;
  expectedCloseDate?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  assignee?: string;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  uploadedAt: string;
}

interface RelatedContact {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  title?: string | null;
}

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMM_ICONS: Record<CommType, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  CALL: <Phone className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  MEETING: <Video className="h-3.5 w-3.5" />,
  NOTE: <FileText className="h-3.5 w-3.5" />,
};

const COMM_COLORS: Record<CommType, string> = {
  EMAIL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CALL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SMS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEETING: 'bg-primary/10 text-primary border-primary/20',
  NOTE: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
};

const STATUS_BADGE: Record<ContactStatus, { label: string; variant: 'success' | 'primary' | 'info' }> = {
  lead: { label: 'Lead', variant: 'primary' },
  customer: { label: 'Customer', variant: 'success' },
  partner: { label: 'Partner', variant: 'info' },
};

const LIFECYCLE_STAGES: LifecycleStage[] = ['lead', 'prospect', 'customer', 'advocate'];

const TASK_PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-emerald-400',
  URGENT: 'text-red-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContactProfilePage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('id');
  const router = useRouter();
  const api = useApi();

  // State
  const [contact, setContact] = useState<ContactProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [relatedContacts, setRelatedContacts] = useState<RelatedContact[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline note form
  const [quickNote, setQuickNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Tag editing
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Modals
  const [showCommModal, setShowCommModal] = useState(false);
  const [commForm, setCommForm] = useState({ type: 'NOTE' as CommType, subject: '', body: '' });
  const [isSavingComm, setIsSavingComm] = useState(false);

  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({ title: '', pipelineId: '', stageId: '', value: '' });
  const [isSavingDeal, setIsSavingDeal] = useState(false);

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const load = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    const [cRes, tlRes, dRes, tRes, fRes, pRes] = await Promise.all([
      api.get<ContactProfile>(`/api/contacts/${contactId}`),
      api.get<{ items: TimelineItem[] }>(`/api/crm/contacts/${contactId}/timeline`),
      api.get<{ items: Deal[] }>(`/api/crm/contacts/${contactId}/deals`),
      api.get<{ items: Task[] }>(`/api/crm/contacts/${contactId}/tasks`).catch(() => ({ data: null, error: 'not found' })),
      api.get<{ items: FileAttachment[] }>(`/api/crm/contacts/${contactId}/files`).catch(() => ({ data: null, error: 'not found' })),
      api.get<{ items: Pipeline[] }>('/api/crm/pipelines'),
    ]);

    const extractItems = (res: { data: any }) => {
      const d = res.data;
      if (!d) return [];
      if (Array.isArray(d)) return d;
      if (d.items && Array.isArray(d.items)) return d.items;
      if (d.data && Array.isArray(d.data)) return d.data;
      return [];
    };

    const contactData = cRes.data && typeof cRes.data === 'object' && 'data' in (cRes.data as any)
      ? (cRes.data as any).data
      : cRes.data;
    setContact(contactData);
    setTimeline(extractItems(tlRes as any));
    setDeals(extractItems(dRes as any));
    setTasks(extractItems(tRes as any));
    setFiles(extractItems(fRes as any));
    setPipelines(extractItems(pRes as any));

    // Load related contacts (same company)
    if (contactData?.companyName) {
      const rcRes = await api.get<{ items: RelatedContact[] }>(
        `/api/contacts?company=${encodeURIComponent(contactData.companyName)}&limit=5`
      ).catch(() => ({ data: null, error: 'not found' }));
      const related = extractItems(rcRes as any).filter((c: any) => c.id !== contactId);
      setRelatedContacts(related);
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  useEffect(() => { load(); }, [load]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function getName(c: ContactProfile) {
    if (c.type === 'COMPANY') return c.companyName ?? '--';
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || '--';
  }

  function getInitials(c: ContactProfile) {
    if (c.type === 'COMPANY') return (c.companyName ?? 'C').charAt(0).toUpperCase();
    return [c.firstName?.charAt(0), c.lastName?.charAt(0)].filter(Boolean).join('').toUpperCase() || 'U';
  }

  function getAddress(c: ContactProfile) {
    const parts = [c.address, c.city, c.state, c.zip, c.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  function getContactStatus(c: ContactProfile): ContactStatus {
    const s = (c.status ?? 'lead').toLowerCase();
    if (s === 'customer' || s === 'active') return 'customer';
    if (s === 'partner') return 'partner';
    return 'lead';
  }

  function getLifecycleStage(c: ContactProfile): LifecycleStage {
    const s = (c.lifecycleStage ?? 'lead').toLowerCase();
    if (LIFECYCLE_STAGES.includes(s as LifecycleStage)) return s as LifecycleStage;
    return 'lead';
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  async function handleQuickNote(e: React.FormEvent) {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setIsSavingNote(true);
    await api.post(`/api/crm/contacts/${contactId}/notes`, { type: 'NOTE', body: quickNote });
    setIsSavingNote(false);
    setQuickNote('');
    load();
  }

  async function handleLogComm(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingComm(true);
    await api.post(`/api/crm/contacts/${contactId}/notes`, {
      type: commForm.type,
      subject: commForm.subject,
      body: commForm.body,
    });
    setIsSavingComm(false);
    setShowCommModal(false);
    setCommForm({ type: 'NOTE', subject: '', body: '' });
    load();
  }

  async function handleAddDeal(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingDeal(true);
    await api.post('/api/crm/deals', {
      title: dealForm.title,
      pipelineId: dealForm.pipelineId || undefined,
      stageId: dealForm.stageId || undefined,
      value: dealForm.value ? parseFloat(dealForm.value) : undefined,
      contactId,
    });
    setIsSavingDeal(false);
    setShowDealModal(false);
    setDealForm({ title: '', pipelineId: '', stageId: '', value: '' });
    load();
  }

  async function handleRemoveTag(tag: string) {
    if (!contact) return;
    const newTags = contact.tags.filter((t) => t !== tag);
    const res = await api.patch<ContactProfile>(`/api/contacts/${contactId}`, { tags: newTags });
    if (res.data) setContact(res.data);
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!contact || !tagInput.trim()) return;
    const newTags = [...contact.tags, tagInput.trim()];
    const res = await api.patch<ContactProfile>(`/api/contacts/${contactId}`, { tags: newTags });
    if (res.data) setContact(res.data);
    setTagInput('');
    setEditingTags(false);
  }

  const selectedPipeline = pipelines.find((p) => p.id === dealForm.pipelineId);
  const engagementScore = contact?.engagementScore ?? Math.floor(Math.random() * 40 + 60);

  // -------------------------------------------------------------------------
  // Loading / Not found
  // -------------------------------------------------------------------------

  if (!contactId) {
    return (
      <div className="bg-card min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No contact ID provided.</p>
          <button
            onClick={() => router.push('/dashboard/crm/contacts')}
            className="mt-4 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card min-h-screen">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-red-500" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="bg-card min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Contact not found.</p>
          <button
            onClick={() => router.push('/dashboard/crm/contacts')}
            className="mt-4 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  const status = getContactStatus(contact);
  const lifecycle = getLifecycleStage(contact);
  const lifecycleIndex = LIFECYCLE_STAGES.indexOf(lifecycle);
  const fullAddress = getAddress(contact);
  const statusInfo = STATUS_BADGE[status];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-card min-h-screen">
      {/* ================================================================= */}
      {/* HEADER                                                             */}
      {/* ================================================================= */}
      <div className="border-b border-white/[0.04] bg-card backdrop-blur-xl sticky top-0 z-30">
        <div className="px-8 py-6">
          <div className="flex items-start gap-5">
            {/* Back */}
            <button
              onClick={() => router.back()}
              className="mt-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl border border-red-500/20 text-red-400 font-bold text-xl">
              {getInitials(contact)}
            </div>

            {/* Name / Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {getName(contact)}
                </h1>
                <Badge variant={statusInfo.variant} className="capitalize rounded-xl text-xs px-3 py-1">
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {contact.title && (
                  <span className="text-sm text-muted-foreground">{contact.title}</span>
                )}
                {contact.title && contact.companyName && (
                  <span className="text-muted-foreground">at</span>
                )}
                {contact.companyName && contact.type === 'PERSON' && (
                  <span className="text-sm text-foreground font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {contact.companyName}
                  </span>
                )}
              </div>
              {/* Tags inline */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-muted backdrop-blur-xl px-2.5 py-1 text-xs text-foreground"
                  >
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {editingTags ? (
                  <form onSubmit={handleAddTag} className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="New tag"
                      className="w-28 rounded-lg border border-white/[0.06] bg-muted backdrop-blur-xl px-2.5 py-1 text-xs text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                    />
                    <button type="submit" className="text-xs text-red-400 hover:text-red-300">Add</button>
                    <button type="button" onClick={() => setEditingTags(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </form>
                ) : (
                  <button
                    onClick={() => setEditingTags(true)}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-white/[0.08] px-2.5 py-1 text-xs text-muted-foreground hover:border-red-500/30 hover:text-red-400 transition-all"
                  >
                    <Plus className="h-3 w-3" /> tag
                  </button>
                )}
              </div>
            </div>

            {/* Edit button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/dashboard/crm/contacts/${contactId}`)}
              className="rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground shrink-0"
            >
              <Edit3 className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TOP ACTION BAR                                                     */}
        {/* ================================================================= */}
        <div className="px-8 pb-4 flex items-center gap-2 flex-wrap">
          {[
            { icon: Phone, label: 'Call', color: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20' },
            { icon: Mail, label: 'Email', color: 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20' },
            { icon: MessageSquare, label: 'SMS', color: 'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20' },
            { icon: ListTodo, label: 'Create Task', color: 'hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/20' },
            { icon: FileText, label: 'Add Note', color: 'hover:bg-muted hover:text-foreground hover:border-border', action: () => document.getElementById('quick-note-input')?.focus() },
            { icon: Briefcase, label: 'Add Deal', color: 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20', action: () => setShowDealModal(true) },
            { icon: Calendar, label: 'Schedule Meeting', color: 'hover:bg-primary/10 hover:text-primary hover:border-primary/20' },
          ].map(({ icon: Icon, label, color, action }) => (
            <button
              key={label}
              onClick={action ?? (() => setShowCommModal(true))}
              className={`flex items-center gap-2 rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-4 py-2 text-xs font-medium text-muted-foreground transition-all duration-200 ${color}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* MAIN 3-COLUMN GRID                                                 */}
      {/* ================================================================= */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ============================================================= */}
          {/* LEFT COLUMN (1/3)                                              */}
          {/* ============================================================= */}
          <div className="space-y-6">

            {/* Contact Info Card */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3.5 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-3 text-foreground group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/10">
                      <Mail className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                      <a href={`mailto:${contact.email}`} className="text-foreground hover:text-red-400 transition-colors truncate block">
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3 text-foreground group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                      <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                      <a href={`tel:${contact.phone}`} className="text-foreground hover:text-red-400 transition-colors">
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {contact.companyName && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/10">
                      <Building2 className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Company</p>
                      <p className="text-foreground truncate">{contact.companyName}</p>
                    </div>
                  </div>
                )}
                {fullAddress && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/10">
                      <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Address</p>
                      <p className="text-foreground text-xs leading-relaxed">{fullAddress}</p>
                    </div>
                  </div>
                )}
                {contact.source && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/10">
                      <Target className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Source</p>
                      <p className="text-foreground">{contact.source}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Created</p>
                    <p className="text-foreground">{new Date(contact.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {contact.customFields && Object.keys(contact.customFields).length > 0 && (
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" /> Custom Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-2.5">
                  {Object.entries(contact.customFields).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-foreground font-medium">{String(val ?? '--')}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Lifecycle Stage */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" /> Lifecycle Stage
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-1">
                  {LIFECYCLE_STAGES.map((stage, idx) => (
                    <div key={stage} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full h-2 rounded-full transition-all duration-300 ${
                          idx <= lifecycleIndex
                            ? 'bg-gradient-to-r from-red-500 to-red-400'
                            : 'bg-muted'
                        } ${idx === 0 ? 'rounded-l-full' : ''} ${idx === LIFECYCLE_STAGES.length - 1 ? 'rounded-r-full' : ''}`}
                      />
                      <span className={`text-[10px] mt-2 capitalize ${
                        idx <= lifecycleIndex ? 'text-red-400 font-medium' : 'text-muted-foreground'
                      }`}>
                        {stage}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Owner / Assigned Agent */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" /> Owner / Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/15">
                    <User className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{contact.owner ?? 'Unassigned'}</p>
                    <p className="text-xs text-muted-foreground">Contact Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================= */}
          {/* CENTER COLUMN (1/3) — Activity Timeline                        */}
          {/* ============================================================= */}
          <div className="space-y-6">

            {/* Inline Add Note */}
            <form onSubmit={handleQuickNote} className="relative">
              <div className="rounded-2xl border border-white/[0.06] bg-card backdrop-blur-xl overflow-hidden">
                <textarea
                  id="quick-note-input"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full bg-transparent px-5 py-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between px-5 pb-3">
                  <div className="flex items-center gap-2">
                    {(['NOTE', 'CALL', 'EMAIL', 'SMS'] as CommType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="text-muted-foreground hover:text-muted-foreground transition-colors"
                        title={t}
                        onClick={() => { setCommForm(f => ({ ...f, type: t })); setShowCommModal(true); }}
                      >
                        {COMM_ICONS[t]}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSavingNote}
                    disabled={!quickNote.trim()}
                    className="rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs px-4"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Save
                  </Button>
                </div>
              </div>
            </form>

            {/* Activity Timeline */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Activity Timeline
                  {timeline.length > 0 && (
                    <span className="ml-auto text-red-400 font-bold text-xs">{timeline.length}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {timeline.length === 0 ? (
                  <div className="px-5 pb-6 text-center text-muted-foreground text-sm py-8">No activity yet.</div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <div className="relative ml-8">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-red-500/30 via-red-500/10 to-transparent" />
                      <div className="divide-y divide-white/[0.03]">
                        {timeline.map((item) => {
                          const commType = (item.subtype || item.type) as CommType;
                          const colorClass = COMM_COLORS[commType] ?? COMM_COLORS.NOTE;
                          const icon = COMM_ICONS[commType] ?? <Calendar className="h-3.5 w-3.5" />;
                          return (
                            <div key={item.id} className="flex gap-4 pl-6 pr-5 py-4 hover:bg-white/[0.02] transition-colors">
                              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                    {commType}
                                  </span>
                                  {item.actor && (
                                    <span className="text-[10px] text-muted-foreground">by {item.actor}</span>
                                  )}
                                </div>
                                {item.subject && (
                                  <p className="text-sm font-medium text-foreground truncate">{item.subject}</p>
                                )}
                                {item.body && (
                                  <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{item.body}</p>
                                )}
                                {item.dealTitle && (
                                  <p className="text-xs text-red-400/80 mt-1 flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {item.dealTitle}
                                  </p>
                                )}
                                {item.outcome && (
                                  <p className="text-xs text-muted-foreground mt-1">Outcome: {item.outcome}</p>
                                )}
                              </div>
                              <span className="shrink-0 text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                                {new Date(item.createdAt).toLocaleDateString()}{' '}
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN (1/3)                                             */}
          {/* ============================================================= */}
          <div className="space-y-6">

            {/* Deals Card */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Deals</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-bold text-base">{deals.length}</span>
                    <button
                      onClick={() => setShowDealModal(true)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {deals.length === 0 ? (
                  <div className="px-5 pb-5 text-center text-muted-foreground text-sm">No deals yet.</div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {deals.map((d) => (
                      <div key={d.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {d.pipeline}{d.stage ? ` / ${d.stage}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {d.value != null && (
                              <p className="text-sm font-bold text-red-400">${d.value.toLocaleString()}</p>
                            )}
                            <Badge
                              variant={d.status === 'WON' ? 'success' : d.status === 'LOST' ? 'destructive' : 'muted'}
                              className="mt-1 capitalize text-[10px] rounded-lg"
                            >
                              {d.status.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        {d.probability != null && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span>Probability</span>
                              <span className="text-foreground">{d.probability}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                                style={{ width: `${d.probability}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks Card */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2"><ListTodo className="h-3.5 w-3.5" /> Tasks</span>
                  <span className="text-muted-foreground font-bold text-xs">{tasks.length} open</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="px-5 pb-5 text-center text-muted-foreground text-sm">No open tasks.</div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {tasks.map((t) => (
                      <div key={t.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 h-4 w-4 rounded border ${
                            t.status === 'DONE' ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-border'
                          } flex items-center justify-center`}>
                            {t.status === 'DONE' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${t.status === 'DONE' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {t.priority && (
                                <span className={`text-[10px] font-medium uppercase ${TASK_PRIORITY_COLORS[t.priority] ?? 'text-muted-foreground'}`}>
                                  {t.priority}
                                </span>
                              )}
                              {t.dueDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  Due {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files Card */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5" /> Files
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {files.length === 0 ? (
                  <div className="px-5 pb-5 text-center text-muted-foreground text-sm">No files attached.</div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {files.map((f) => (
                      <div key={f.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{f.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatFileSize(f.size)} -- {new Date(f.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Communication Preferences */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" /> Communication Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email Opt-in</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                    contact.emailOptIn !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {contact.emailOptIn !== false ? 'Opted In' : 'Opted Out'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> SMS Opt-in</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                    contact.smsOptIn !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {contact.smsOptIn !== false ? 'Opted In' : 'Opted Out'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Star className="h-3.5 w-3.5" /> Preferred Channel</span>
                  <span className="text-foreground text-xs font-medium capitalize">
                    {contact.preferredChannel ?? 'Email'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM SECTION                                                     */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* Related Contacts */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Related Contacts
                {contact.companyName && (
                  <span className="text-muted-foreground normal-case font-normal ml-1">at {contact.companyName}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {relatedContacts.length === 0 ? (
                <div className="px-5 pb-5 text-center text-muted-foreground text-sm">No related contacts found.</div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {relatedContacts.map((rc) => (
                    <button
                      key={rc.id}
                      onClick={() => router.push(`/dashboard/crm/contacts/profile?id=${rc.id}`)}
                      className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground text-xs font-bold">
                        {(rc.firstName?.charAt(0) ?? '').toUpperCase()}{(rc.lastName?.charAt(0) ?? '').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {[rc.firstName, rc.lastName].filter(Boolean).join(' ') || '--'}
                        </p>
                        {rc.title && <p className="text-[10px] text-muted-foreground">{rc.title}</p>}
                        {rc.email && <p className="text-[10px] text-muted-foreground truncate">{rc.email}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Score */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" /> Engagement Score
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-center gap-6">
                {/* Score circle */}
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(39,39,42)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={engagementScore >= 70 ? '#ef4444' : engagementScore >= 40 ? '#f59e0b' : '#71717a'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(engagementScore / 100) * 264} 264`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold text-foreground">{engagementScore}</span>
                </div>
                {/* Mini breakdown */}
                <div className="flex-1 space-y-2.5">
                  {[
                    { label: 'Email Opens', value: Math.floor(engagementScore * 0.8), color: 'bg-blue-500' },
                    { label: 'Responses', value: Math.floor(engagementScore * 0.6), color: 'bg-emerald-500' },
                    { label: 'Meetings', value: Math.floor(engagementScore * 0.4), color: 'bg-primary/80' },
                    { label: 'Deal Activity', value: Math.floor(engagementScore * 0.7), color: 'bg-red-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{label}</span>
                        <span className="text-muted-foreground">{value}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================= */}
      {/* LOG COMMUNICATION MODAL                                            */}
      {/* ================================================================= */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl shadow-black/40">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Log Communication</h2>
              <button onClick={() => setShowCommModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogComm} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['EMAIL', 'CALL', 'SMS', 'MEETING', 'NOTE'] as CommType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCommForm((f) => ({ ...f, type: t }))}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all ${
                        commForm.type === t
                          ? COMM_COLORS[t]
                          : 'border-white/[0.04] bg-muted text-muted-foreground hover:border-white/[0.08] hover:bg-white/[0.04]'
                      }`}
                    >
                      {COMM_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={commForm.subject}
                  onChange={(e) => setCommForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Body / Notes</label>
                <textarea
                  value={commForm.body}
                  onChange={(e) => setCommForm((f) => ({ ...f, body: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none resize-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1 rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground" onClick={() => setShowCommModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white" isLoading={isSavingComm}>
                  Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* NEW DEAL MODAL                                                     */}
      {/* ================================================================= */}
      {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl shadow-black/40">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">New Deal</h2>
              <button onClick={() => setShowDealModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddDeal} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={dealForm.title}
                  onChange={(e) => setDealForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Pipeline</label>
                <select
                  value={dealForm.pipelineId}
                  onChange={(e) => setDealForm((f) => ({ ...f, pipelineId: e.target.value, stageId: '' }))}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                >
                  <option value="">Select pipeline...</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {selectedPipeline && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Stage</label>
                  <select
                    value={dealForm.stageId}
                    onChange={(e) => setDealForm((f) => ({ ...f, stageId: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                  >
                    <option value="">Select stage...</option>
                    {selectedPipeline.stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Value ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dealForm.value}
                  onChange={(e) => setDealForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1 rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground" onClick={() => setShowDealModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white" isLoading={isSavingDeal}>
                  Create Deal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

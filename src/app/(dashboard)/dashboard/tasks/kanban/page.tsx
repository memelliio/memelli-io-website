'use client';

import { useState, useCallback, useRef, useMemo, useEffect, DragEvent } from 'react';
import {
  Plus,
  Search,
  X,
  Calendar,
  User,
  Tag,
  ChevronDown,
  ChevronRight,
  Paperclip,
  MessageSquare,
  CheckSquare,
  Clock,
  AlertTriangle,
  Edit3,
  Trash2,
  GripVertical,
  Filter,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ColumnId = 'todo' | 'in_progress' | 'review' | 'done';
type Priority = 'P1' | 'P2' | 'P3' | 'P4';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface KanbanCard {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  priority: Priority;
  dueDate: string;
  tags: string[];
  column: ColumnId;
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  activity: ActivityEntry[];
  createdAt: string;
}

interface Column {
  id: ColumnId;
  title: string;
  color: string;
  dotColor: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', color: 'border-border', dotColor: 'bg-muted' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/40', dotColor: 'bg-amber-400' },
  { id: 'review', title: 'Review', color: 'border-blue-500/40', dotColor: 'bg-blue-400' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/40', dotColor: 'bg-emerald-400' },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  P1: { label: 'P1', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  P2: { label: 'P2', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  P3: { label: 'P3', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  P4: { label: 'P4', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

const AVATAR_COLORS = [
  'bg-red-500/20 text-red-400',
  'bg-blue-500/20 text-blue-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-primary/20 text-primary',
  'bg-amber-500/20 text-amber-400',
  'bg-pink-500/20 text-pink-400',
];

const ALL_TAGS = ['frontend', 'backend', 'design', 'bug', 'feature', 'docs', 'urgent', 'refactor'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _idCounter = 100;
function genId(): string {
  return `card_${Date.now()}_${++_idCounter}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(d: string): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

/* ------------------------------------------------------------------ */
/*  Seed Data                                                          */
/* ------------------------------------------------------------------ */

function createSeedCards(): KanbanCard[] {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return [
    {
      id: genId(), title: 'Design system audit', description: 'Review all components for consistency and accessibility compliance across the platform.',
      assignee: 'Sarah Chen', assigneeInitials: 'SC', assigneeColor: pickColor('Sarah Chen'),
      priority: 'P2', dueDate: nextWeek, tags: ['design', 'frontend'], column: 'todo',
      subtasks: [
        { id: 's1', title: 'Audit buttons', completed: true },
        { id: 's2', title: 'Audit forms', completed: false },
        { id: 's3', title: 'Audit modals', completed: false },
      ],
      comments: [{ id: 'c1', author: 'Sarah Chen', text: 'Starting with the button component audit first.', createdAt: now }],
      attachments: [{ id: 'a1', name: 'audit-checklist.pdf', size: '240 KB', createdAt: now }],
      activity: [{ id: 'act1', action: 'created this task', actor: 'Admin', timestamp: now }],
      createdAt: now,
    },
    {
      id: genId(), title: 'API rate limiting', description: 'Implement rate limiting middleware for all public API endpoints.',
      assignee: 'Jake Morrison', assigneeInitials: 'JM', assigneeColor: pickColor('Jake Morrison'),
      priority: 'P1', dueDate: tomorrow, tags: ['backend', 'urgent'], column: 'todo',
      subtasks: [{ id: 's4', title: 'Research libraries', completed: true }, { id: 's5', title: 'Implement middleware', completed: false }],
      comments: [], attachments: [],
      activity: [{ id: 'act2', action: 'created this task', actor: 'Admin', timestamp: now }],
      createdAt: now,
    },
    {
      id: genId(), title: 'User onboarding flow', description: 'Build the guided onboarding experience for new users.',
      assignee: 'Lena Park', assigneeInitials: 'LP', assigneeColor: pickColor('Lena Park'),
      priority: 'P2', dueDate: nextWeek, tags: ['frontend', 'feature'], column: 'in_progress',
      subtasks: [{ id: 's6', title: 'Welcome screen', completed: true }, { id: 's7', title: 'Setup wizard', completed: false }],
      comments: [{ id: 'c2', author: 'Lena Park', text: 'Welcome screen is done, moving to wizard.', createdAt: now }],
      attachments: [], activity: [{ id: 'act3', action: 'moved to In Progress', actor: 'Lena Park', timestamp: now }],
      createdAt: now,
    },
    {
      id: genId(), title: 'Fix login redirect bug', description: 'Users are redirected to 404 after login when session expires.',
      assignee: 'Jake Morrison', assigneeInitials: 'JM', assigneeColor: pickColor('Jake Morrison'),
      priority: 'P1', dueDate: yesterday, tags: ['bug', 'urgent'], column: 'in_progress',
      subtasks: [], comments: [], attachments: [],
      activity: [{ id: 'act4', action: 'created this task', actor: 'Admin', timestamp: now }],
      createdAt: now,
    },
    {
      id: genId(), title: 'Dashboard analytics widget', description: 'Review the analytics widget implementation for performance.',
      assignee: 'Sarah Chen', assigneeInitials: 'SC', assigneeColor: pickColor('Sarah Chen'),
      priority: 'P3', dueDate: nextWeek, tags: ['frontend', 'feature'], column: 'review',
      subtasks: [{ id: 's8', title: 'Unit tests', completed: true }, { id: 's9', title: 'Code review', completed: false }],
      comments: [], attachments: [],
      activity: [{ id: 'act5', action: 'moved to Review', actor: 'Sarah Chen', timestamp: now }],
      createdAt: now,
    },
    {
      id: genId(), title: 'Update API documentation', description: 'Sync API docs with the latest endpoint changes.',
      assignee: 'Lena Park', assigneeInitials: 'LP', assigneeColor: pickColor('Lena Park'),
      priority: 'P4', dueDate: nextWeek, tags: ['docs'], column: 'done',
      subtasks: [{ id: 's10', title: 'Endpoints section', completed: true }, { id: 's11', title: 'Auth section', completed: true }],
      comments: [], attachments: [],
      activity: [{ id: 'act6', action: 'moved to Done', actor: 'Lena Park', timestamp: now }],
      createdAt: now,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Kanban Page                                                        */
/* ------------------------------------------------------------------ */

export default function KanbanPage() {
  /* ---- API Data ---- */
  const { data: apiTasks, isLoading, isError } = useApiQuery<any[]>(
    ['tasks'],
    '/api/tasks?perPage=100'
  );
  const isDemo = isError || (!isLoading && !apiTasks);

  const mappedApiCards: KanbanCard[] = useMemo(() => {
    const raw = Array.isArray(apiTasks) ? apiTasks : (apiTasks as any)?.data;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const statusToColumn: Record<string, ColumnId> = {
      PENDING: 'todo', TODO: 'todo', OPEN: 'todo',
      IN_PROGRESS: 'in_progress', ACTIVE: 'in_progress',
      REVIEW: 'review', IN_REVIEW: 'review',
      DONE: 'done', COMPLETED: 'done', CLOSED: 'done',
    };
    const priorityMap: Record<string, Priority> = {
      URGENT: 'P1', HIGH: 'P2', MEDIUM: 'P3', LOW: 'P4',
    };
    return raw.map((t: any) => {
      const name = t.contact ? `${t.contact.firstName ?? ''} ${t.contact.lastName ?? ''}`.trim() : 'Unassigned';
      return {
        id: t.id,
        title: t.title ?? 'Untitled',
        description: t.description ?? '',
        assignee: name,
        assigneeInitials: getInitials(name),
        assigneeColor: pickColor(name),
        priority: priorityMap[t.priority] ?? 'P3',
        dueDate: t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 10) : '',
        tags: [],
        column: statusToColumn[t.status] ?? 'todo',
        subtasks: [],
        comments: [],
        attachments: [],
        activity: [{ id: t.id + '_created', action: 'created this task', actor: 'System', timestamp: t.createdAt }],
        createdAt: t.createdAt ?? new Date().toISOString(),
      };
    });
  }, [apiTasks]);

  const [cards, setCards] = useState<KanbanCard[]>(createSeedCards);

  useEffect(() => {
    if (mappedApiCards.length > 0) {
      setCards(mappedApiCards);
    }
  }, [mappedApiCards]);

  const [boardTitle, setBoardTitle] = useState('Task Board');
  const [editingTitle, setEditingTitle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<ColumnId | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  /* ---- Unique assignees for filter ---- */
  const assignees = useMemo(() => {
    const set = new Set(cards.map((c) => c.assignee));
    return Array.from(set).sort();
  }, [cards]);

  /* ---- Used tags for filter ---- */
  const usedTags = useMemo(() => {
    const set = new Set(cards.flatMap((c) => c.tags));
    return Array.from(set).sort();
  }, [cards]);

  /* ---- Filtered cards ---- */
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          card.title.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q) ||
          card.assignee.toLowerCase().includes(q) ||
          card.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filterPriority && card.priority !== filterPriority) return false;
      if (filterAssignee && card.assignee !== filterAssignee) return false;
      if (filterTag && !card.tags.includes(filterTag)) return false;
      return true;
    });
  }, [cards, searchQuery, filterPriority, filterAssignee, filterTag]);

  const hasActiveFilters = !!searchQuery || !!filterPriority || !!filterAssignee || !!filterTag;

  /* ---- Drag handlers ---- */
  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: DragEvent<HTMLDivElement>) => {
    setDraggedCardId(null);
    setDragOverColumn(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, columnId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetColumn: ColumnId) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      if (!cardId) return;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          if (c.column === targetColumn) return c;
          const now = new Date().toISOString();
          const colLabel = COLUMNS.find((col) => col.id === targetColumn)?.title ?? targetColumn;
          return {
            ...c,
            column: targetColumn,
            activity: [
              { id: genId(), action: `moved to ${colLabel}`, actor: 'You', timestamp: now },
              ...c.activity,
            ],
          };
        })
      );
      setDraggedCardId(null);
      setDragOverColumn(null);
    },
    []
  );

  /* ---- Add card ---- */
  const addCard = useCallback(
    (columnId: ColumnId) => {
      if (!newCardTitle.trim()) return;
      const card: KanbanCard = {
        id: genId(),
        title: newCardTitle.trim(),
        description: '',
        assignee: 'Unassigned',
        assigneeInitials: 'UA',
        assigneeColor: 'bg-muted text-muted-foreground',
        priority: 'P3',
        dueDate: '',
        tags: [],
        column: columnId,
        subtasks: [],
        comments: [],
        attachments: [],
        activity: [{ id: genId(), action: 'created this task', actor: 'You', timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };
      setCards((prev) => [...prev, card]);
      setNewCardTitle('');
      setAddingTo(null);
    },
    [newCardTitle]
  );

  /* ---- Delete card ---- */
  const deleteCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setExpandedCard(null);
  }, []);

  /* ---- Toggle subtask ---- */
  const toggleSubtask = useCallback((cardId: string, subtaskId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              subtasks: c.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : c
      )
    );
  }, []);

  /* ---- Clear filters ---- */
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterPriority('');
    setFilterAssignee('');
    setFilterTag('');
  }, []);

  /* ---- Expanded card data ---- */
  const expandedCardData = expandedCard ? cards.find((c) => c.id === expandedCard) : null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-card">
        <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {isDemo && <div className="px-6 pt-4"><DemoBanner reason="API returned no tasks" /></div>}
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-white/[0.04] bg-card backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-red-400" />
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTitle(false);
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                autoFocus
                className="bg-transparent text-xl font-bold text-foreground border-b border-red-500/50 outline-none px-1 py-0.5"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="text-xl font-bold text-foreground hover:text-red-400 transition-colors flex items-center gap-2 group"
              >
                {boardTitle}
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-red-400 transition-colors" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-white/[0.06] bg-card pl-9 pr-8 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                showFilters || hasActiveFilters
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-white/[0.06] bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {[filterPriority, filterAssignee, filterTag].filter(Boolean).length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {/* Priority */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
              className="rounded-lg border border-white/[0.06] bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-red-500/30"
            >
              <option value="">All Priorities</option>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </select>

            {/* Assignee */}
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="rounded-lg border border-white/[0.06] bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-red-500/30"
            >
              <option value="">All Assignees</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            {/* Tag */}
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="rounded-lg border border-white/[0.06] bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-red-500/30"
            >
              <option value="">All Tags</option>
              {usedTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Board ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-5 h-full min-w-max">
          {COLUMNS.map((column) => {
            const colCards = filteredCards.filter((c) => c.column === column.id);
            const isDragOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={`flex w-80 flex-shrink-0 flex-col rounded-xl border transition-all duration-200 ${
                  isDragOver
                    ? 'border-red-500/40 bg-red-500/[0.03]'
                    : 'border-white/[0.04] bg-card'
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
                    <span className="text-sm font-semibold text-foreground">{column.title}</span>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/[0.06] px-1.5 text-[11px] font-medium text-muted-foreground">
                      {colCards.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAddingTo(column.id);
                      setNewCardTitle('');
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scrollbar-thin">
                  {/* Add card form */}
                  {addingTo === column.id && (
                    <div className="rounded-lg border border-red-500/30 bg-card p-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Task title..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addCard(column.id);
                          if (e.key === 'Escape') setAddingTo(null);
                        }}
                        autoFocus
                        className="w-full rounded-md border border-white/[0.06] bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-red-500/30"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addCard(column.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingTo(null)}
                          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setExpandedCard(card.id)}
                      className={`group cursor-pointer rounded-lg border border-white/[0.04] bg-card p-3.5 transition-all duration-150 hover:border-white/[0.08] hover:bg-card hover:shadow-lg hover:shadow-black/20 ${
                        draggedCardId === card.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      {/* Drag handle + priority */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_CONFIG[card.priority].bg} ${PRIORITY_CONFIG[card.priority].text} ${PRIORITY_CONFIG[card.priority].border}`}
                          >
                            {card.priority}
                          </span>
                        </div>
                        {card.dueDate && (
                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              isOverdue(card.dueDate) && card.column !== 'done'
                                ? 'text-red-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {isOverdue(card.dueDate) && card.column !== 'done' && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            <Calendar className="h-3 w-3" />
                            {formatDate(card.dueDate)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-foreground leading-snug mb-2.5">{card.title}</h4>

                      {/* Tags */}
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground border border-white/[0.04]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: avatar + meta */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${card.assigneeColor}`}
                          >
                            {card.assigneeInitials}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{card.assignee}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          {card.subtasks.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px]">
                              <CheckSquare className="h-3 w-3" />
                              {card.subtasks.filter((s) => s.completed).length}/{card.subtasks.length}
                            </span>
                          )}
                          {card.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px]">
                              <MessageSquare className="h-3 w-3" />
                              {card.comments.length}
                            </span>
                          )}
                          {card.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px]">
                              <Paperclip className="h-3 w-3" />
                              {card.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colCards.length === 0 && addingTo !== column.id && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <LayoutGrid className="h-8 w-8 mb-2 opacity-30" />
                      <span className="text-xs">No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Expanded Card Modal ──────────────────────────────────── */}
      {expandedCardData && (
        <ExpandedCardModal
          card={expandedCardData}
          onClose={() => setExpandedCard(null)}
          onDelete={deleteCard}
          onToggleSubtask={toggleSubtask}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded Card Modal                                                */
/* ------------------------------------------------------------------ */

function ExpandedCardModal({
  card,
  onClose,
  onDelete,
  onToggleSubtask,
}: {
  card: KanbanCard;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (cardId: string, subtaskId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'activity'>(
    'details'
  );

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: CheckSquare },
    { id: 'comments' as const, label: 'Comments', count: card.comments.length, icon: MessageSquare },
    { id: 'attachments' as const, label: 'Files', count: card.attachments.length, icon: Paperclip },
    { id: 'activity' as const, label: 'Activity', count: card.activity.length, icon: Clock },
  ];

  const colLabel = COLUMNS.find((c) => c.id === card.column)?.title ?? card.column;
  const completedSubtasks = card.subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/[0.06] bg-card shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.04] px-6 py-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_CONFIG[card.priority].bg} ${PRIORITY_CONFIG[card.priority].text} ${PRIORITY_CONFIG[card.priority].border}`}
              >
                {card.priority}
              </span>
              <span className="text-xs text-muted-foreground">in</span>
              <span className="text-xs font-medium text-muted-foreground">{colLabel}</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(card.id)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-5 border-b border-white/[0.04] px-6 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${card.assigneeColor}`}>
              {card.assigneeInitials}
            </span>
            <span className="text-muted-foreground">{card.assignee}</span>
          </div>
          {card.dueDate && (
            <div className={`flex items-center gap-1.5 ${isOverdue(card.dueDate) && card.column !== 'done' ? 'text-red-400' : 'text-muted-foreground'}`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(card.dueDate)}</span>
              {isOverdue(card.dueDate) && card.column !== 'done' && <span className="text-[10px] font-medium">(overdue)</span>}
            </div>
          )}
          {card.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {card.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground border border-white/[0.04]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.04] px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-muted-foreground hover:text-muted-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/[0.06] px-1 text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description || 'No description provided.'}
                </p>
              </div>

              {/* Subtasks */}
              {card.subtasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subtasks
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      {completedSubtasks}/{card.subtasks.length} done
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted mb-3">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-300"
                      style={{
                        width: `${card.subtasks.length > 0 ? (completedSubtasks / card.subtasks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {card.subtasks.map((subtask) => (
                      <label
                        key={subtask.id}
                        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => onToggleSubtask(card.id, subtask.id)}
                          className="h-4 w-4 rounded border-border bg-muted text-red-500 focus:ring-red-500/30 focus:ring-offset-0"
                        />
                        <span
                          className={`text-sm ${
                            subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {card.comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-xs">No comments yet</span>
                </div>
              ) : (
                card.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-white/[0.04] bg-muted p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${pickColor(comment.author)}`}>
                        {getInitials(comment.author)}
                      </span>
                      <span className="text-sm font-medium text-foreground">{comment.author}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-2">
              {card.attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Paperclip className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-xs">No attachments</span>
                </div>
              ) : (
                card.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-muted px-4 py-3"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{att.name}</div>
                      <div className="text-[10px] text-muted-foreground">{att.size}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDate(att.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-0">
              {card.activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-xs">No activity</span>
                </div>
              ) : (
                card.activity.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3 py-2.5">
                    <div className="flex flex-col items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-white/[0.06]">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </span>
                      {idx < card.activity.length - 1 && (
                        <div className="w-px flex-1 bg-white/[0.04] mt-1" />
                      )}
                    </div>
                    <div className="pb-2">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{entry.actor}</span>{' '}
                        {entry.action}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{formatDate(entry.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

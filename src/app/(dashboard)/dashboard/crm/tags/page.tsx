'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Pencil, Trash2, Users, Briefcase } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Badge,
  Skeleton,
  ConfirmDialog,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CrmTag {
  id: string;
  name: string;
  color: string;
  contactCount: number;
  dealCount: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PREDEFINED_COLORS = [
  { name: 'Purple', value: '#3b82f6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#f59e0b' },
  { name: 'Gray', value: '#71717a' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeTagList(raw: unknown): CrmTag[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CrmTag[];
    if (Array.isArray(obj.items)) return obj.items as CrmTag[];
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TagsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  // ---- Data fetching ----
  const {
    data: tags = [],
    isLoading,
  } = useQuery<CrmTag[]>({
    queryKey: ['crm', 'tags'],
    queryFn: async () => {
      const res = await api.get<unknown>('/api/crm/tags');
      return normalizeTagList(res.data);
    },
  });

  // ---- Modal state ----
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<CrmTag | null>(null);
  const [deleteTag, setDeleteTag] = useState<CrmTag | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---- Form state ----
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(PREDEFINED_COLORS[0].value);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- Handlers ----
  function openCreate() {
    setFormName('');
    setFormColor(PREDEFINED_COLORS[0].value);
    setFormError(null);
    setCreateOpen(true);
  }

  function openEdit(tag: CrmTag) {
    setFormName(tag.name);
    setFormColor(tag.color || PREDEFINED_COLORS[0].value);
    setFormError(null);
    setEditTag(tag);
  }

  async function handleCreate() {
    if (!formName.trim()) {
      setFormError('Tag name is required');
      return;
    }
    setSaving(true);
    const res = await api.post('/api/crm/tags', { name: formName.trim(), color: formColor });
    setSaving(false);
    if (res.error) {
      setFormError(res.error);
      return;
    }
    setCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['crm', 'tags'] });
  }

  async function handleUpdate() {
    if (!editTag) return;
    if (!formName.trim()) {
      setFormError('Tag name is required');
      return;
    }
    setSaving(true);
    const res = await api.patch(`/api/crm/tags/${editTag.id}`, { name: formName.trim(), color: formColor });
    setSaving(false);
    if (res.error) {
      setFormError(res.error);
      return;
    }
    setEditTag(null);
    queryClient.invalidateQueries({ queryKey: ['crm', 'tags'] });
  }

  async function handleDelete() {
    if (!deleteTag) return;
    setDeleting(true);
    await api.del(`/api/crm/tags/${deleteTag.id}`);
    setDeleting(false);
    setDeleteTag(null);
    queryClient.invalidateQueries({ queryKey: ['crm', 'tags'] });
  }

  // ---- Color picker component ----
  function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Color</label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              title={c.name}
              className={`h-8 w-8 rounded-xl border-2 transition-all duration-200 ${
                value === c.value
                  ? 'border-primary scale-110 ring-2 ring-primary/20 ring-offset-2 ring-offset-zinc-950'
                  : 'border-white/[0.06] hover:border-white/[0.15]'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="bg-card min-h-screen">
      <div className="space-y-8 p-8">
        <PageHeader
          title="Tags"
          subtitle="Organize contacts and deals with color-coded tags"
          breadcrumb={[
            { label: 'CRM', href: '/dashboard/crm' },
            { label: 'Tags' },
          ]}
          actions={
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Tag
            </Button>
          }
        />

        {/* Tag grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-32 rounded-2xl bg-card" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl py-20 text-center">
            <Tag className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm mb-1 leading-relaxed">No tags yet</p>
            <p className="text-muted-foreground text-xs mb-6 leading-relaxed">Create your first tag to start organizing contacts and deals.</p>
            <Button onClick={openCreate} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Tag
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group relative rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
              >
                {/* Actions */}
                <div className="absolute right-3.5 top-3.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => openEdit(tag)}
                    className="rounded-xl p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
                    title="Edit tag"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTag(tag)}
                    className="rounded-xl p-1.5 text-muted-foreground hover:bg-primary/80/[0.08] hover:text-primary transition-all duration-200"
                    title="Delete tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Tag info */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/[0.06]"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                  />
                  <span className="text-sm font-semibold tracking-tight text-foreground truncate">{tag.name}</span>
                </div>

                {/* Counts */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{tag.contactCount ?? 0}</span>
                    contacts
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{tag.dealCount ?? 0}</span>
                    deals
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Tag Modal */}
        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Tag">
          <div className="space-y-6">
            <Input
              label="Name"
              placeholder="e.g. VIP, High Priority"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setFormError(null); }}
              error={formError ?? undefined}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
            <ColorPicker value={formColor} onChange={setFormColor} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} isLoading={saving} className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200">Create</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Tag Modal */}
        <Modal isOpen={!!editTag} onClose={() => setEditTag(null)} title="Edit Tag">
          <div className="space-y-6">
            <Input
              label="Name"
              placeholder="Tag name"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setFormError(null); }}
              error={formError ?? undefined}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(); }}
            />
            <ColorPicker value={formColor} onChange={setFormColor} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditTag(null)}>Cancel</Button>
              <Button onClick={handleUpdate} isLoading={saving} className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200">Save</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteTag}
          onCancel={() => setDeleteTag(null)}
          onConfirm={handleDelete}
          title={`Delete "${deleteTag?.name ?? ''}"?`}
          description="This tag will be removed from all contacts and deals. This action cannot be undone."
          confirmLabel="Delete Tag"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
}
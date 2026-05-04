'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FolderTree, Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  EmptyState,
  ConfirmDialog,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryRaw {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  _count?: { threads: number };
  threadCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  threadCount: number;
}

type CategoriesResponse = CategoryRaw[];

/* ------------------------------------------------------------------ */
/*  Color options                                                      */
/* ------------------------------------------------------------------ */

const COLOR_OPTIONS = [
  { value: 'primary', label: 'Purple' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'amber', label: 'Amber' },
  { value: 'red', label: 'Red' },
  { value: 'pink', label: 'Pink' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'zinc', label: 'Gray' },
];

const COLOR_MAP: Record<string, { dot: string; badge: string }> = {
  purple: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary border-primary/20' },
  blue: { dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  green: { dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
  amber: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  red: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary border-primary/20' },
  pink: { dot: 'bg-pink-500', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  cyan: { dot: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  zinc: { dot: 'bg-muted', badge: 'bg-muted text-muted-foreground border-border' },
};

function colorClasses(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.purple!;
}

/* ------------------------------------------------------------------ */
/*  Category Form (shared by create / edit)                            */
/* ------------------------------------------------------------------ */

interface CategoryFormState {
  name: string;
  description: string;
  color: string;
}

const EMPTY_FORM: CategoryFormState = { name: '', description: '', color: 'primary' };

function CategoryFormFields({
  form,
  onChange,
}: {
  form: CategoryFormState;
  onChange: (f: CategoryFormState) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
        <Input
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="e.g. Credit Score FAQ"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Short description of this category..."
          rows={3}
        />
      </div>
      <div>
        <Select
          label="Color"
          options={COLOR_OPTIONS}
          value={form.color}
          onChange={(val) => onChange({ ...form, color: val })}
          renderOption={(opt, isSelected) => (
            <span className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${colorClasses(opt.value).dot}`} />
              <span>{opt.label}</span>
            </span>
          )}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CategoriesPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Form state
  const [createForm, setCreateForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CategoryFormState>(EMPTY_FORM);

  /* ---- Fetch categories ---- */

  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the categories array)
      const res = await api.get<CategoriesResponse>('/api/forum/categories');
      if (res.error) throw new Error(res.error);
      const raw = Array.isArray(res.data) ? res.data : [];
      return raw.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        threadCount: c.threadCount ?? c._count?.threads ?? 0,
      }));
    },
  });

  const categories = data ?? [];
  const totalThreads = categories.reduce((sum, c) => sum + c.threadCount, 0);

  /* ---- Create ---- */

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/forum/categories', {
        name: createForm.name,
        description: createForm.description || null,
        color: createForm.color,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] });
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
    },
  });

  /* ---- Edit ---- */

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editCategory) return;
      const res = await api.patch(`/api/forum/categories/${editCategory.id}`, {
        name: editForm.name,
        description: editForm.description || null,
        color: editForm.color,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] });
      setEditCategory(null);
    },
  });

  /* ---- Delete ---- */

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      const res = await api.del(`/api/forum/categories/${deleteTarget.id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] });
      setDeleteTarget(null);
    },
  });

  /* ---- Handlers ---- */

  function openEdit(cat: Category) {
    setEditForm({
      name: cat.name,
      description: cat.description ?? '',
      color: cat.color || 'primary',
    });
    setEditCategory(cat);
  }

  /* ---- Render ---- */

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Forum Categories"
        subtitle={`${categories.length} categories \u00b7 ${totalThreads} threads`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Categories' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              setCreateForm(EMPTY_FORM);
              setShowCreate(true);
            }}
          >
            Create Category
          </Button>
        }
        className="mb-8"
      />

      {/* ---------- Grid ---------- */}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-6 w-6" />}
          title="No categories yet"
          description="Create categories to organize your forum threads and improve site structure."
          action={{
            label: 'Create Category',
            onClick: () => setShowCreate(true),
            leftIcon: <Plus className="h-3.5 w-3.5" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const c = colorClasses(cat.color || 'primary');
            return (
              <Card
                key={cat.id}
                className="group cursor-pointer rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04] hover:-translate-y-0.5"
                onClick={() => router.push(`/dashboard/seo/categories/${cat.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${c.dot}`} />
                    <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
                      {cat.name}
                    </CardTitle>
                  </div>
                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="rounded-xl p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
                      onClick={() => openEdit(cat)}
                      aria-label="Edit category"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="rounded-xl p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={() => setDeleteTarget(cat)}
                      aria-label="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {cat.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className={`border ${c.badge} text-xs`}>
                      <MessageSquare className="mr-1 h-3 w-3" />
                      {cat.threadCount} {cat.threadCount === 1 ? 'thread' : 'threads'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- Create Modal ---------- */}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Category">
        <CategoryFormFields form={createForm} onChange={setCreateForm} />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!createForm.name.trim() || createMutation.isPending}
            isLoading={createMutation.isPending}
          >
            Create
          </Button>
        </div>
      </Modal>

      {/* ---------- Edit Modal ---------- */}

      <Modal
        isOpen={!!editCategory}
        onClose={() => setEditCategory(null)}
        title="Edit Category"
      >
        <CategoryFormFields form={editForm} onChange={setEditForm} />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setEditCategory(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => editMutation.mutate()}
            disabled={!editForm.name.trim() || editMutation.isPending}
            isLoading={editMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* ---------- Delete Confirmation ---------- */}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Delete "${deleteTarget?.name ?? ''}"?`}
        description="This will permanently delete the category and unlink all associated threads. This action cannot be undone."
        confirmLabel="Delete Category"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

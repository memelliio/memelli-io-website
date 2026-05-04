'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Settings2 } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  DataTable,
  type DataTableColumn,
  PageHeader,
  Button,
  Modal,
  Input,
  Select,
  type SelectOption,
  Toggle,
  Badge,
  type BadgeVariant,
  Skeleton,
  ConfirmDialog,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EntityType = 'contact' | 'deal';
type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

interface CustomField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  entityType: EntityType;
  required: boolean;
  options?: string[];
  createdAt: string;
}

interface FieldFormState {
  id?: string;
  label: string;
  key: string;
  type: FieldType;
  entityType: EntityType;
  required: boolean;
  options: string[];
  newOption: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Select',
  boolean: 'Boolean',
};

const TYPE_BADGE_VARIANT: Record<FieldType, BadgeVariant> = {
  text: 'default',
  number: 'info',
  date: 'success',
  select: 'primary',
  boolean: 'warning',
};

const FIELD_TYPE_OPTIONS: SelectOption[] = Object.entries(FIELD_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const ENTITY_OPTIONS: SelectOption[] = [
  { value: 'deal', label: 'Deal' },
  { value: 'contact', label: 'Contact' },
];

const EMPTY_FORM: FieldFormState = {
  label: '',
  key: '',
  type: 'text',
  entityType: 'deal',
  required: false,
  options: [],
  newOption: '',
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CustomFieldsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FieldFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  /* -- Query -------------------------------------------------------- */

  const {
    data: fields = [],
    isLoading,
  } = useQuery({
    queryKey: ['crm', 'custom-fields'],
    queryFn: async () => {
      const res = await api.get<
        { data?: CustomField[]; items?: CustomField[] } | CustomField[]
      >('/api/crm/custom-fields');
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      if (raw && 'data' in raw && Array.isArray(raw.data)) return raw.data;
      if (raw && 'items' in raw && Array.isArray(raw.items)) return raw.items;
      return [];
    },
  });

  /* -- Mutations ---------------------------------------------------- */

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post<CustomField>('/api/crm/custom-fields', payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'custom-fields'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await api.patch<CustomField>(`/api/crm/custom-fields/${id}`, payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'custom-fields'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/crm/custom-fields/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'custom-fields'] });
      setDeleteTarget(null);
    },
  });

  /* -- Helpers ------------------------------------------------------ */

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(field: CustomField) {
    setForm({
      id: field.id,
      label: field.label,
      key: field.key,
      type: field.type,
      entityType: field.entityType,
      required: field.required,
      options: field.options ?? [],
      newOption: '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function handleLabelChange(label: string) {
    setForm((f) => ({ ...f, label, key: f.id ? f.key : slugify(label) }));
  }

  function addOption() {
    const opt = form.newOption.trim();
    if (!opt || form.options.includes(opt)) return;
    setForm((f) => ({ ...f, options: [...f.options, opt], newOption: '' }));
  }

  function removeOption(opt: string) {
    setForm((f) => ({ ...f, options: f.options.filter((o) => o !== opt) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label || !form.key) return;
    setFormError(null);

    const payload: Record<string, unknown> = {
      label: form.label,
      key: form.key,
      type: form.type,
      entityType: form.entityType,
      required: form.required,
    };
    if (form.type === 'select') {
      payload.options = form.options;
    }

    if (form.id) {
      updateMutation.mutate({ id: form.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /* -- Columns ------------------------------------------------------ */

  const columns: DataTableColumn<CustomField>[] = [
    {
      header: 'Field Name',
      accessor: 'label',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{row.label}</span>
          <code className="text-[11px] text-muted-foreground">{row.key}</code>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <Badge variant={TYPE_BADGE_VARIANT[row.type] ?? 'default'}>
          {FIELD_TYPE_LABELS[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      accessor: 'entityType',
      render: (row) => (
        <Badge variant={row.entityType === 'deal' ? 'primary' : 'info'}>
          {row.entityType === 'deal' ? 'Deal' : 'Contact'}
        </Badge>
      ),
    },
    {
      header: 'Required',
      accessor: 'required',
      render: (row) =>
        row.required ? (
          <Badge variant="success">Yes</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: '',
      accessor: 'id',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-muted-foreground transition-all duration-200"
            title="Edit field"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-primary/80/[0.08] hover:text-primary transition-all duration-200"
            title="Delete field"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  /* -- Render ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-card p-6 space-y-6">
      <PageHeader
        title="Custom Fields"
        subtitle="Define extra data fields for deals and contacts"
        breadcrumb={[
          { label: 'CRM', href: '/dashboard/crm' },
          { label: 'Custom Fields' },
        ]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Create Field
          </Button>
        }
      />

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="table-row" count={5} />
        </div>
      ) : (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <DataTable
            columns={columns}
            data={fields}
            rowKey={(row) => row.id}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Settings2 className="h-8 w-8 mb-3 text-muted-foreground" />
                <p className="text-sm">No custom fields defined yet</p>
                <button
                  onClick={openCreate}
                  className="mt-3 text-sm text-primary hover:text-primary/80 transition-all duration-200"
                >
                  Add your first field
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* -- Create / Edit Modal ------------------------------------- */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={form.id ? 'Edit Custom Field' : 'Create Custom Field'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Field Name"
            value={form.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Lead Score"
            required
          />

          <Input
            label="Field Key"
            hint="Auto-generated from name. Used in API."
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: slugify(e.target.value) }))}
            placeholder="e.g. lead_score"
            className="font-mono"
            required
          />

          <Select
            label="Field Type"
            options={FIELD_TYPE_OPTIONS}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v as FieldType }))}
          />

          <Select
            label="Entity"
            options={ENTITY_OPTIONS}
            value={form.entityType}
            onChange={(v) => setForm((f) => ({ ...f, entityType: v as EntityType }))}
          />

          {/* Options for select type */}
          {form.type === 'select' && (
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Options</label>
              <div className="flex flex-wrap gap-2 min-h-[28px] p-3 rounded-xl bg-card border border-white/[0.04]">
                {form.options.map((opt) => (
                  <span
                    key={opt}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/80/[0.08] border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary/80"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(opt)}
                      className="hover:text-primary transition-all duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {form.options.length === 0 && (
                  <span className="text-xs text-muted-foreground">No options yet</span>
                )}
              </div>
              <div className="flex gap-3">
                <Input
                  value={form.newOption}
                  onChange={(e) => setForm((f) => ({ ...f, newOption: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addOption(); }
                  }}
                  placeholder="Add option..."
                  className="flex-1"
                />
                <Button type="button" variant="secondary" size="sm" onClick={addOption}>
                  Add
                </Button>
              </div>
            </div>
          )}

          <Toggle
            checked={form.required}
            onChange={(checked) => setForm((f) => ({ ...f, required: checked }))}
            label="Required field"
            size="sm"
          />

          {formError && (
            <p className="text-sm text-primary">{formError}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSaving}
            >
              {form.id ? 'Save Changes' : 'Create Field'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -- Confirm Delete Dialog ----------------------------------- */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Custom Field"
        description="This will permanently remove this field and all stored values across all records. This action cannot be undone."
        confirmLabel="Delete Field"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
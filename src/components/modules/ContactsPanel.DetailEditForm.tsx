/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ContactsPanel — DetailPanel inline edit form                                */
/*  Extracted from ContactsPanel.DetailPanel.tsx (refactor 2026-04-30).         */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { Check, Loader2 } from 'lucide-react';

export interface DetailEditFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  tags: string;
}

const inputCls =
  'w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-teal-500/50 transition-all bg-white/[0.04] border border-white/[0.08]';

export function DetailEditForm({
  form,
  setForm,
  saving,
  error,
  onCancel,
  onSave,
}: {
  form: DetailEditFormState;
  setForm: React.Dispatch<React.SetStateAction<DetailEditFormState>>;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
        Edit Contact
      </span>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputCls}
          placeholder="First name"
          value={form.firstName}
          onChange={(e) =>
            setForm((p) => ({ ...p, firstName: e.target.value }))
          }
        />
        <input
          className={inputCls}
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) =>
            setForm((p) => ({ ...p, lastName: e.target.value }))
          }
        />
        <input
          className={`${inputCls} col-span-2`}
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        <input
          className={inputCls}
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <input
          className={inputCls}
          placeholder="Company"
          value={form.company}
          onChange={(e) =>
            setForm((p) => ({ ...p, company: e.target.value }))
          }
        />
        <input
          className={`${inputCls} col-span-2`}
          placeholder="Tags (comma-separated)"
          value={form.tags}
          onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
        />
      </div>

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

      <div className="flex gap-2 justify-end mt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-black transition-colors disabled:opacity-60"
          style={{ background: '#2dd4bf' }}
        >
          {saving ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Check size={10} />
          )}
          Save
        </button>
      </div>
    </div>
  );
}

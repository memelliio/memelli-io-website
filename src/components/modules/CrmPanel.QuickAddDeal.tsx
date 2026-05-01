/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — Quick Add Deal collapsible form                                  */
/*  Extracted from CrmPanel.tsx (refactor 2026-04-30).                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

'use client';

import { useRef } from 'react';
import { ChevronDown, ChevronUp, Loader2, Plus, Search } from 'lucide-react';
import {
  card,
  contactFullName,
  type Contact,
  type Pipeline,
} from './CrmPanel.utils';
import { InputField, SectionHeader, SelectField } from './CrmPanel.primitives';

export interface DealFormState {
  title: string;
  value: string;
  pipelineId: string;
  stageId: string;
  contactSearch: string;
  contactId: string;
}

interface QuickAddDealProps {
  open: boolean;
  onToggle: () => void;
  pipelines: Pipeline[];
  dealForm: DealFormState;
  setDealForm: React.Dispatch<React.SetStateAction<DealFormState>>;
  dealFormError: string | null;
  setDealFormError: React.Dispatch<React.SetStateAction<string | null>>;
  dealFormSuccess: boolean;
  savingDeal: boolean;
  contactSuggestions: Contact[];
  handleDealFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleDealContactSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectContactSuggestion: (c: Contact) => void;
  submitDeal: (e: React.FormEvent) => void;
}

export function QuickAddDeal({
  open,
  onToggle,
  pipelines,
  dealForm,
  setDealForm,
  dealFormError,
  setDealFormError,
  dealFormSuccess,
  savingDeal,
  contactSuggestions,
  handleDealFormChange,
  handleDealContactSearch,
  selectContactSuggestion,
  submitDeal,
}: QuickAddDealProps) {
  const contactSearchRef = useRef<HTMLDivElement>(null);

  const dealFormPipeline =
    pipelines.find((p) => p.id === dealForm.pipelineId) ?? null;
  const dealFormStages = dealFormPipeline?.stages ?? [];

  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <SectionHeader>Quick Add Deal</SectionHeader>
        {open ? (
          <ChevronUp size={13} className="text-zinc-500" />
        ) : (
          <ChevronDown size={13} className="text-zinc-500" />
        )}
      </button>

      {open && (
        <form onSubmit={submitDeal} className="px-3 pb-3 flex flex-col gap-2">
          {/* Title */}
          <InputField
            name="title"
            placeholder="Deal title"
            value={dealForm.title}
            onChange={(e) => {
              setDealForm((f) => ({ ...f, title: e.target.value }));
              setDealFormError(null);
            }}
            className="col-span-2"
          />

          <div className="grid grid-cols-2 gap-2">
            {/* Value */}
            <InputField
              name="value"
              placeholder="Value ($)"
              value={dealForm.value}
              onChange={(e) =>
                setDealForm((f) => ({ ...f, value: e.target.value }))
              }
              type="number"
            />

            {/* Pipeline select */}
            {pipelines.length > 0 && (
              <SelectField
                name="pipelineId"
                value={dealForm.pipelineId}
                onChange={handleDealFormChange}
              >
                <option value="">Pipeline...</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            )}

            {/* Stage select — updates based on pipeline */}
            {dealFormStages.length > 0 && (
              <SelectField
                name="stageId"
                value={dealForm.stageId}
                onChange={handleDealFormChange}
                disabled={!dealForm.pipelineId}
              >
                <option value="">Stage...</option>
                {dealFormStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            )}

            {/* Contact search */}
            <div ref={contactSearchRef} className="relative col-span-2">
              <div className="relative">
                <Search
                  size={11}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
                />
                <input
                  name="contactSearch"
                  type="text"
                  placeholder="Search contact..."
                  value={dealForm.contactSearch}
                  onChange={handleDealContactSearch}
                  className="w-full rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-red-700 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  autoComplete="off"
                />
              </div>
              {contactSuggestions.length > 0 && (
                <div
                  className="absolute z-20 top-full mt-1 left-0 right-0 rounded-lg overflow-hidden"
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {contactSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectContactSuggestion(c)}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-colors flex gap-2 items-center"
                    >
                      <span className="font-medium">{contactFullName(c)}</span>
                      {c.email && (
                        <span className="text-zinc-600 truncate">
                          {c.email}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {dealFormError && (
            <p className="text-[10px] text-red-400 font-mono">
              {dealFormError}
            </p>
          )}
          {dealFormSuccess && (
            <p className="text-[10px] text-emerald-400 font-mono">
              Deal created.
            </p>
          )}

          <button
            type="submit"
            disabled={savingDeal}
            className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#dc2626' }}
          >
            {savingDeal ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Plus size={11} />
            )}
            Save Deal
          </button>
        </form>
      )}
    </div>
  );
}

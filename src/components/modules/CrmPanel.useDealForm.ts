/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — useDealForm hook                                                 */
/*  Extracted from useCrmPanel (refactor 2026-04-30, stage 3).                  */
/*  Owns the new-deal form: state, contact-search suggestions, submit.          */
/*  Lifted 1:1 from the prior inline implementation. No behavior changes.       */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useState } from 'react';
import {
  apiFetch,
  contactFullName,
  type Contact,
  type Deal,
  type Pipeline,
} from './CrmPanel.utils';
import type { DealFormState } from './CrmPanel.QuickAddDeal';

interface UseDealFormArgs {
  pipelines: Pipeline[];
  contacts: Contact[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
}

export interface UseDealFormResult {
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
  submitDeal: (e: React.FormEvent) => Promise<void>;
}

export function useDealForm({
  pipelines,
  contacts,
  setDeals,
}: UseDealFormArgs): UseDealFormResult {
  const [dealForm, setDealForm] = useState<DealFormState>({
    title: '',
    value: '',
    pipelineId: '',
    stageId: '',
    contactSearch: '',
    contactId: '',
  });
  const [dealFormError, setDealFormError] = useState<string | null>(null);
  const [dealFormSuccess, setDealFormSuccess] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState<Contact[]>([]);

  const handleDealFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setDealForm((f) => {
        const next = { ...f, [name]: value };
        // When pipeline changes, reset stage to first stage of new pipeline
        if (name === 'pipelineId') {
          const pl = pipelines.find((p) => p.id === value);
          next.stageId = pl?.stages?.[0]?.id ?? '';
        }
        return next;
      });
      setDealFormError(null);
    },
    [pipelines]
  );

  const handleDealContactSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setDealForm((f) => ({ ...f, contactSearch: q, contactId: '' }));
      if (q.length < 2) {
        setContactSuggestions([]);
        return;
      }
      const lq = q.toLowerCase();
      setContactSuggestions(
        contacts
          .filter(
            (c) =>
              contactFullName(c).toLowerCase().includes(lq) ||
              (c.email || '').toLowerCase().includes(lq)
          )
          .slice(0, 5)
      );
    },
    [contacts]
  );

  const selectContactSuggestion = useCallback((c: Contact) => {
    setDealForm((f) => ({
      ...f,
      contactSearch: contactFullName(c),
      contactId: c.id,
    }));
    setContactSuggestions([]);
  }, []);

  const submitDeal = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setDealFormError(null);
      if (!dealForm.title.trim()) {
        setDealFormError('Deal title is required.');
        return;
      }
      setSavingDeal(true);
      const body: Record<string, unknown> = {
        title: dealForm.title.trim(),
        value: dealForm.value ? parseFloat(dealForm.value) : 0,
      };
      if (dealForm.pipelineId) body.pipelineId = dealForm.pipelineId;
      if (dealForm.stageId) body.stage = dealForm.stageId;
      if (dealForm.contactId) body.contactId = dealForm.contactId;

      const res = await apiFetch<Deal>('/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSavingDeal(false);

      if (!res) {
        setDealFormError('Failed to create deal. Please try again.');
        return;
      }

      setDeals((prev) => [res, ...prev]);
      setDealFormSuccess(true);
      setDealForm((f) => ({
        title: '',
        value: '',
        pipelineId: f.pipelineId,
        stageId: f.stageId,
        contactSearch: '',
        contactId: '',
      }));
      setTimeout(() => setDealFormSuccess(false), 3000);
    },
    [dealForm, setDeals]
  );

  return {
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
  };
}

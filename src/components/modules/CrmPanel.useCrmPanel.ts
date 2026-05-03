/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — useCrmPanel hook                                                 */
/*  Refactor 2026-04-30 (stage 3): composes data + form sub-hooks.              */
/*  Owns:                                                                       */
/*    • data state (pipelines / deals / contacts / analytics + loading flags)   */
/*    • initial fetch effect                                                    */
/*    • derived values (active pipeline, dealsByStage, stats, recentContacts)   */
/*    • form open/close UI state                                                */
/*  Delegates:                                                                  */
/*    • deal-form state + handlers → useDealForm                                */
/*    • contact-form state + handlers → useContactForm                          */
/*  No behavior change — same effect / same derivations / same handler bodies.  */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import {
  apiFetch,
  dealStageName,
  extractArray,
  type AnalyticsSummary,
  type Contact,
  type Deal,
  type Pipeline,
  type Stage,
} from './CrmPanel.utils';
import { useDealForm, type UseDealFormResult } from './CrmPanel.useDealForm';
import {
  useContactForm,
  type UseContactFormResult,
} from './CrmPanel.useContactForm';

export interface UseCrmPanelResult
  extends UseDealFormResult,
    UseContactFormResult {
  // data
  pipelines: Pipeline[];
  deals: Deal[];
  contacts: Contact[];
  analytics: AnalyticsSummary | null;
  // loading
  loadingPipelines: boolean;
  loadingDeals: boolean;
  loadingContacts: boolean;
  loadingAnalytics: boolean;
  // pipeline selection
  activePipelineId: string;
  setActivePipelineId: (id: string) => void;
  activePipeline: Pipeline | null;
  stages: Stage[];
  dealsByStage: (stageId: string) => Deal[];
  // stats
  totalContacts: number;
  openDeals: number;
  pipelineValue: number;
  wonThisMonth: number;
  // recent
  recentContacts: Contact[];
  // form open state
  dealFormOpen: boolean;
  setDealFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  contactFormOpen: boolean;
  setContactFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCrmPanel(): UseCrmPanelResult {
  /* ── State: data ── */
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  /* ── State: loading ── */
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  /* ── State: UI ── */
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);

  /* ── Form sub-hooks ── */
  const dealFormHook = useDealForm({ pipelines, contacts, setDeals });
  const contactFormHook = useContactForm({ setContacts });

  /* ── Fetch all data ── */
  useEffect(() => {
    // Pipelines
    (async () => {
      setLoadingPipelines(true);
      const raw = await apiFetch<unknown>('/api/crm/pipelines');
      const arr = extractArray<Pipeline>(raw);
      setPipelines(arr);
      if (arr.length > 0) {
        setActivePipelineId(arr[0].id);
        dealFormHook.setDealForm((f) => ({
          ...f,
          pipelineId: arr[0].id,
          stageId: arr[0].stages?.[0]?.id ?? '',
        }));
      }
      setLoadingPipelines(false);
    })();

    // Deals
    (async () => {
      setLoadingDeals(true);
      const raw = await apiFetch<unknown>('/api/crm/deals?limit=50');
      setDeals(extractArray<Deal>(raw));
      setLoadingDeals(false);
    })();

    // Contacts
    (async () => {
      setLoadingContacts(true);
      const raw = await apiFetch<unknown>('/api/contacts');
      setContacts(extractArray<Contact>(raw));
      setLoadingContacts(false);
    })();

    // Analytics — try dashboard first, fallback to base
    (async () => {
      setLoadingAnalytics(true);
      let raw = await apiFetch<AnalyticsSummary>('/api/analytics/dashboard');
      if (!raw) raw = await apiFetch<AnalyticsSummary>('/api/analytics');
      setAnalytics(raw);
      setLoadingAnalytics(false);
    })();
    // dealFormHook.setDealForm is stable from useState — intentional empty dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived: active pipeline ── */
  const activePipeline =
    pipelines.find((p) => p.id === activePipelineId) ?? pipelines[0] ?? null;
  const stages: Stage[] = activePipeline?.stages ?? [];

  /* ── Derived: deals grouped by stage ── */
  const dealsByStage = useCallback(
    (stageId: string) =>
      deals.filter((d) => {
        if (d.stageId === stageId) return true;
        if (typeof d.stage === 'object' && d.stage?.id === stageId) return true;
        return false;
      }),
    [deals]
  );

  /* ── Derived: stats ── */
  const totalContacts =
    analytics?.totalContacts ??
    analytics?.contacts?.total ??
    contacts.length;

  const openDeals =
    analytics?.openDeals ??
    analytics?.deals?.open ??
    deals.filter((d) => {
      const s = dealStageName(d).toLowerCase();
      return !s.includes('won') && !s.includes('lost') && !s.includes('closed');
    }).length;

  const pipelineValue =
    analytics?.pipelineValue ??
    analytics?.deals?.totalValue ??
    deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const wonThisMonth =
    analytics?.wonThisMonth ?? analytics?.deals?.wonThisMonth ?? 0;

  /* ── Recent contacts (8 rows) ── */
  const recentContacts = [...contacts]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 8);

  return {
    pipelines,
    deals,
    contacts,
    analytics,
    loadingPipelines,
    loadingDeals,
    loadingContacts,
    loadingAnalytics,
    activePipelineId,
    setActivePipelineId,
    activePipeline,
    stages,
    dealsByStage,
    totalContacts,
    openDeals,
    pipelineValue,
    wonThisMonth,
    recentContacts,
    dealFormOpen,
    setDealFormOpen,
    contactFormOpen,
    setContactFormOpen,
    ...dealFormHook,
    ...contactFormHook,
  };
}

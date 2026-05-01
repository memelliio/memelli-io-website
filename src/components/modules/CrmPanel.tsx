'use client';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CrmPanel — orchestrator                                                     */
/*  Refactored 2026-04-30: split god-component (951L) into siblings:            */
/*    • CrmPanel.utils.ts          — types, fetch, formatters                   */
/*    • CrmPanel.primitives.tsx    — StageBadge, SectionHeader, RowSkeleton,   */
/*                                   InputField, SelectField                    */
/*    • CrmPanel.PipelineBoard.tsx — kanban board                               */
/*    • CrmPanel.StatsBar.tsx      — 4 metric cards                             */
/*    • CrmPanel.RecentContacts.tsx— contacts table                             */
/*    • CrmPanel.QuickAddDeal.tsx  — collapsible deal form                      */
/*    • CrmPanel.QuickAddContact.tsx — collapsible contact form                 */
/*  Stage 2 (2026-04-30): state/effects/handlers extracted into useCrmPanel.    */
/*  This file owns ONLY the top-header layout + render wiring. No behavior      */
/*  changes from the prior version — the hook is a 1:1 lift of the previous    */
/*  inline state/effect/handler block.                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';

import { SelectField } from './CrmPanel.primitives';
import { PipelineBoard } from './CrmPanel.PipelineBoard';
import { StatsBar } from './CrmPanel.StatsBar';
import { RecentContacts } from './CrmPanel.RecentContacts';
import { QuickAddDeal } from './CrmPanel.QuickAddDeal';
import { QuickAddContact } from './CrmPanel.QuickAddContact';
import { useCrmPanel } from './CrmPanel.useCrmPanel';

export function CrmPanel() {
  const c = useCrmPanel();

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">
      {/* ── 1. Header row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-zinc-100 text-base font-semibold tracking-tight mr-auto">
          CRM
        </h2>

        {/* Pipeline selector */}
        {c.pipelines.length > 1 && (
          <SelectField
            name="activePipeline"
            value={c.activePipelineId}
            onChange={(e) => c.setActivePipelineId(e.target.value)}
          >
            {c.pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
        )}
        {c.pipelines.length === 1 && (
          <span className="text-[11px] font-mono text-zinc-500">
            {c.pipelines[0].name}
          </span>
        )}

        <button
          onClick={() => {
            c.setDealFormOpen((v) => !v);
            c.setContactFormOpen(false);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors"
          style={{ background: '#dc2626' }}
        >
          <Plus size={11} />
          New Deal
        </button>
        <button
          onClick={() => {
            c.setContactFormOpen((v) => !v);
            c.setDealFormOpen(false);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-zinc-200 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Plus size={11} />
          New Contact
        </button>
        <Link
          href="/dashboard/crm"
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
        >
          Full CRM
          <ExternalLink size={10} />
        </Link>
      </div>

      {/* ── 2. Pipeline Kanban board ── */}
      <PipelineBoard
        activePipeline={c.activePipeline}
        stages={c.stages}
        dealsByStage={c.dealsByStage}
        loadingPipelines={c.loadingPipelines}
        loadingDeals={c.loadingDeals}
      />

      {/* ── 3. Stats bar ── */}
      <StatsBar
        loadingContacts={c.loadingContacts}
        loadingDeals={c.loadingDeals}
        loadingAnalytics={c.loadingAnalytics}
        totalContacts={c.totalContacts}
        openDeals={c.openDeals}
        pipelineValue={c.pipelineValue}
        wonThisMonth={c.wonThisMonth}
      />

      {/* ── 4. Recent Contacts table ── */}
      <RecentContacts
        recentContacts={c.recentContacts}
        loadingContacts={c.loadingContacts}
      />

      {/* ── 5. Quick Add Deal (collapsible) ── */}
      <QuickAddDeal
        open={c.dealFormOpen}
        onToggle={() => {
          c.setDealFormOpen((v) => !v);
          c.setContactFormOpen(false);
        }}
        pipelines={c.pipelines}
        dealForm={c.dealForm}
        setDealForm={c.setDealForm}
        dealFormError={c.dealFormError}
        setDealFormError={c.setDealFormError}
        dealFormSuccess={c.dealFormSuccess}
        savingDeal={c.savingDeal}
        contactSuggestions={c.contactSuggestions}
        handleDealFormChange={c.handleDealFormChange}
        handleDealContactSearch={c.handleDealContactSearch}
        selectContactSuggestion={c.selectContactSuggestion}
        submitDeal={c.submitDeal}
      />

      {/* ── 6. Quick Add Contact (collapsible) ── */}
      <QuickAddContact
        open={c.contactFormOpen}
        onToggle={() => {
          c.setContactFormOpen((v) => !v);
          c.setDealFormOpen(false);
        }}
        contactForm={c.contactForm}
        contactFormError={c.contactFormError}
        contactFormSuccess={c.contactFormSuccess}
        savingContact={c.savingContact}
        handleContactFormChange={c.handleContactFormChange}
        submitContact={c.submitContact}
      />
    </div>
  );
}

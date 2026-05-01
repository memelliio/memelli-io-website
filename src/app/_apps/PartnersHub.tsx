'use client';

import { useState } from 'react';
import { PartnersPanel } from '@/components/modules/PartnersPanel';

// ── Program tabs ──────────────────────────────────────────────────────────────

type ProgramTab = 'affiliate' | 'infinity';

const TABS: { id: ProgramTab; label: string; description: string }[] = [
  {
    id: 'affiliate',
    label: 'Affiliate Partners',
    description: 'Standard & Premium affiliates — referral links and commission tracking.',
  },
  {
    id: 'infinity',
    label: 'Infinity Partners',
    description: 'Reseller, White Label, and Authority Business partners — full platform access.',
  },
];

// Tiers that map to each program
const PROGRAM_TIERS: Record<ProgramTab, string[]> = {
  affiliate: ['STANDARD_AFFILIATE', 'PREMIUM_AFFILIATE'],
  infinity: ['RESELLER', 'WHITE_LABEL', 'AUTHORITY_BUSINESS'],
};

// ── Styles ────────────────────────────────────────────────────────────────────

const shell: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#fff',
  fontFamily: 'Inter, system-ui, sans-serif',
  overflow: 'hidden',
};

const headerBar: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e5e7eb',
  padding: '14px 20px 0',
  flexShrink: 0,
};

const titleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 14,
};

const logoBox: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'linear-gradient(135deg, #C41E3A, #f97316)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const titleText: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#111827',
  lineHeight: 1,
};

const subText: React.CSSProperties = {
  fontSize: 12,
  color: '#9ca3af',
  marginTop: 2,
};

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 0,
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 600,
  border: 'none',
  borderBottom: active ? '2px solid #C41E3A' : '2px solid transparent',
  background: 'transparent',
  color: active ? '#C41E3A' : '#6b7280',
  cursor: 'pointer',
  transition: 'all 0.15s',
  marginBottom: -1,
});

const descBar: React.CSSProperties = {
  padding: '8px 20px',
  background: '#f9fafb',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 12,
  color: '#6b7280',
  flexShrink: 0,
};

const body: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 16,
  background: '#f9fafb',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PartnersHub({ windowId: _windowId }: { windowId: string }) {
  const [activeTab, setActiveTab] = useState<ProgramTab>('affiliate');
  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={shell}>
      {/* Header */}
      <div style={headerBar}>
        <div style={titleRow}>
          <div style={logoBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div style={titleText}>Partner Programs</div>
            <div style={subText}>Affiliate &amp; Infinity programs in one place</div>
          </div>
        </div>

        {/* Program tabs */}
        <div style={tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={tabBtn(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Program description */}
      <div style={descBar}>{currentTab.description}</div>

      {/* Partners panel — pre-filtered to the active program's tiers */}
      <div style={body}>
        <PartnersPanel
          key={activeTab}
          defaultTierFilter={PROGRAM_TIERS[activeTab][0]}
          programTiers={PROGRAM_TIERS[activeTab]}
          programLabel={currentTab.label}
        />
      </div>
    </div>
  );
}

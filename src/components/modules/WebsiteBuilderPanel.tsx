'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Site {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  config: Record<string, any> | null;
  _count?: { pages: number };
}

interface Page {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  type: string;
  published: boolean;
  sortOrder: number;
}

type Template = 'credit-repair' | 'coaching' | 'services' | 'ecommerce' | 'minimal';

const TEMPLATES: { value: Template; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'credit-repair', label: 'Credit Repair' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'services', label: 'Services' },
  { value: 'ecommerce', label: 'E-Commerce' },
];

const PAGE_TYPE_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  about: 'About',
  services: 'Services',
  contact: 'Contact',
  forum_hub: 'Forum',
  privacy: 'Privacy',
  terms: 'Terms',
  custom: 'Custom',
};

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#71717a',
  marginBottom: 5,
};

// ─── NewSiteForm ──────────────────────────────────────────────────────────────

interface NewSiteFormProps {
  onCreated: (site: Site) => void;
  onCancel: () => void;
}

function NewSiteForm({ onCreated, onCancel }: NewSiteFormProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [template, setTemplate] = useState<Template>('minimal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Site name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/website-builder/sites/from-template`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || undefined,
          industry: industry.trim() || template,
          template,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create site');
      onCreated(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
        New Site
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Site Name *</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Site"
            disabled={loading}
          />
        </div>
        <div>
          <label style={labelStyle}>Domain (optional)</label>
          <input
            style={inputStyle}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            disabled={loading}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Industry</label>
          <input
            style={inputStyle}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Finance, Health"
            disabled={loading}
          />
        </div>
        <div>
          <label style={labelStyle}>Template</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={template}
            onChange={(e) => setTemplate(e.target.value as Template)}
            disabled={loading}
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value} style={{ background: '#111' }}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#fca5a5',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#a1a1aa',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #dc2626, #f97316)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Site'}
        </button>
      </div>
    </form>
  );
}

// ─── PagesDrawer ──────────────────────────────────────────────────────────────

interface PagesDrawerProps {
  site: Site;
  onClose: () => void;
}

function PagesDrawer({ site, onClose }: PagesDrawerProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageType, setNewPageType] = useState<string>('custom');
  const [addingPage, setAddingPage] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id]);

  async function fetchPages() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/website-builder/pages/by-site/${site.id}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load pages');
      setPages(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPage(e: React.FormEvent) {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      setAddError('Title and slug are required.');
      return;
    }
    setAddingPage(true);
    setAddError(null);
    try {
      const res = await fetch(`${API_BASE}/api/website-builder/pages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          siteId: site.id,
          title: newPageTitle.trim(),
          slug: newPageSlug.trim().toLowerCase().replace(/\s+/g, '-'),
          type: newPageType,
          content: {},
          sortOrder: pages.length,
          published: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create page');
      setPages((prev) => [...prev, json.data]);
      setNewPageTitle('');
      setNewPageSlug('');
      setNewPageType('custom');
      setShowAddPage(false);
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingPage(false);
    }
  }

  const badgeStyle = (published: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: published ? 'rgba(34,197,94,0.12)' : 'rgba(113,113,122,0.15)',
    color: published ? '#4ade80' : '#71717a',
    border: `1px solid ${published ? 'rgba(34,197,94,0.25)' : 'rgba(113,113,122,0.2)'}`,
  });

  return (
    <div
      style={{
        marginTop: 0,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.04em' }}>
          Pages ({pages.length})
        </span>
        <button
          onClick={() => { setShowAddPage((v) => !v); setAddError(null); }}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: showAddPage ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: '#d4d4d8',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showAddPage ? 'Cancel' : '+ Add Page'}
        </button>
      </div>

      {showAddPage && (
        <form
          onSubmit={handleAddPage}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                style={{ ...inputStyle, fontSize: 12, padding: '7px 10px' }}
                value={newPageTitle}
                onChange={(e) => {
                  setNewPageTitle(e.target.value);
                  setNewPageSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-'));
                }}
                placeholder="About Us"
                disabled={addingPage}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input
                style={{ ...inputStyle, fontSize: 12, padding: '7px 10px' }}
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                placeholder="about-us"
                disabled={addingPage}
              />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                style={{ ...inputStyle, fontSize: 12, padding: '7px 10px', cursor: 'pointer' }}
                value={newPageType}
                onChange={(e) => setNewPageType(e.target.value)}
                disabled={addingPage}
              >
                {Object.entries(PAGE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ background: '#111' }}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {addError && (
            <div style={{ color: '#fca5a5', fontSize: 11, marginBottom: 8 }}>{addError}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={addingPage}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: addingPage ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #dc2626, #f97316)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: addingPage ? 'not-allowed' : 'pointer',
              }}
            >
              {addingPage ? 'Adding...' : 'Add Page'}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div style={{ color: '#52525b', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          Loading pages...
        </div>
      )}

      {error && (
        <div style={{ color: '#fca5a5', fontSize: 12, padding: '8px 0' }}>{error}</div>
      )}

      {!loading && !error && pages.length === 0 && (
        <div style={{ color: '#52525b', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          No pages yet.
        </div>
      )}

      {!loading && pages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pages.map((page) => (
            <div
              key={page.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: 7,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#e4e4e7', fontWeight: 500 }}>
                  {page.title}
                </span>
                <span style={{ fontSize: 11, color: '#52525b' }}>/{page.slug}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#71717a', fontStyle: 'italic' }}>
                  {PAGE_TYPE_LABELS[page.type] || page.type}
                </span>
                <span style={badgeStyle(page.published)}>
                  {page.published ? 'Live' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SiteCard ─────────────────────────────────────────────────────────────────

interface SiteCardProps {
  site: Site;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTogglePublish: (site: Site) => void;
  onDelete: (site: Site) => void;
  publishing: boolean;
}

function SiteCard({ site, isExpanded, onToggleExpand, onTogglePublish, onDelete, publishing }: SiteCardProps) {
  const pageCount = site._count?.pages ?? 0;
  const isPublished = site.published;

  const statusBadge: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: isPublished ? 'rgba(34,197,94,0.12)' : 'rgba(113,113,122,0.12)',
    color: isPublished ? '#4ade80' : '#71717a',
    border: `1px solid ${isPublished ? 'rgba(34,197,94,0.25)' : 'rgba(113,113,122,0.18)'}`,
  };

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Card header */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${isExpanded ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: isExpanded ? '12px 12px 0 0' : 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'border-color 0.15s',
        }}
      >
        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: isExpanded ? '#f97316' : '#52525b',
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
            lineHeight: 1,
            flexShrink: 0,
            transition: 'color 0.15s, transform 0.15s',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
          }}
          aria-label="Toggle pages"
        >
          &#9654;
        </button>

        {/* Site info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 220,
              }}
            >
              {site.name}
            </span>
            <span style={statusBadge}>{isPublished ? 'Published' : 'Draft'}</span>
            {(site.config as any)?.template && (
              <span style={{ fontSize: 10, color: '#52525b', fontStyle: 'italic' }}>
                {TEMPLATES.find((t) => t.value === (site.config as any).template)?.label ?? (site.config as any).template}
              </span>
            )}
          </div>
          <div style={{ marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {site.domain && (
              <span style={{ fontSize: 11, color: '#71717a' }}>{site.domain}</span>
            )}
            {site.industry && (
              <span style={{ fontSize: 11, color: '#52525b' }}>{site.industry}</span>
            )}
            <span style={{ fontSize: 11, color: '#52525b' }}>
              {pageCount} page{pageCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Publish toggle */}
          <button
            onClick={() => onTogglePublish(site)}
            disabled={publishing}
            title={isPublished ? 'Unpublish site' : 'Publish site'}
            style={{
              padding: '5px 13px',
              borderRadius: 7,
              border: isPublished
                ? '1px solid rgba(220,38,38,0.3)'
                : '1px solid rgba(34,197,94,0.3)',
              background: isPublished
                ? 'rgba(220,38,38,0.08)'
                : 'rgba(34,197,94,0.08)',
              color: isPublished ? '#f87171' : '#4ade80',
              fontSize: 11,
              fontWeight: 600,
              cursor: publishing ? 'not-allowed' : 'pointer',
              opacity: publishing ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {publishing ? '...' : isPublished ? 'Unpublish' : 'Publish'}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(site)}
            title="Delete site"
            style={{
              padding: '5px 10px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'transparent',
              color: '#52525b',
              fontSize: 11,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f87171')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#52525b')}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Pages drawer */}
      {isExpanded && <PagesDrawer site={site} onClose={onToggleExpand} />}
    </div>
  );
}

// ─── WebsiteBuilderPanel ──────────────────────────────────────────────────────

export function WebsiteBuilderPanel() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/website-builder/sites`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load sites');
      setSites(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSiteCreated(site: Site) {
    setSites((prev) => [site, ...prev]);
    setShowNewForm(false);
    setExpandedSiteId(site.id);
  }

  async function handleTogglePublish(site: Site) {
    setPublishingId(site.id);
    try {
      const res = await fetch(`${API_BASE}/api/website-builder/sites/${site.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ published: !site.published }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update site');
      setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, ...json.data } : s)));
    } catch {
      // silently fail — the user can retry
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(site: Site) {
    if (deleteConfirmId !== site.id) {
      setDeleteConfirmId(site.id);
      return;
    }
    setDeletingId(site.id);
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`${API_BASE}/api/website-builder/sites/${site.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete site');
      setSites((prev) => prev.filter((s) => s.id !== site.id));
      if (expandedSiteId === site.id) setExpandedSiteId(null);
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.97)',
        minHeight: '100%',
        padding: 24,
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#e4e4e7',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            Website Builder
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#52525b' }}>
            Manage your sites and pages
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={fetchSites}
            disabled={loading}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: '#71717a',
              fontSize: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => { setShowNewForm((v) => !v); setDeleteConfirmId(null); }}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: 'none',
              background: showNewForm
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #dc2626, #f97316)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {showNewForm ? 'Cancel' : '+ New Site'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* New site form */}
      {showNewForm && (
        <NewSiteForm
          onCreated={handleSiteCreated}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Delete confirmation banner */}
      {deleteConfirmId && (
        <div
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: '#fca5a5' }}>
            Delete "{sites.find((s) => s.id === deleteConfirmId)?.name}"? This cannot be undone.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setDeleteConfirmId(null)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#a1a1aa',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const site = sites.find((s) => s.id === deleteConfirmId);
                if (site) handleDelete(site);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#dc2626',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Sites list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && sites.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 68,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  opacity: 1 - i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {!loading && !error && sites.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#52525b',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>[ ]</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#71717a', marginBottom: 6 }}>
              No sites yet
            </div>
            <div style={{ fontSize: 12, color: '#52525b' }}>
              Click "+ New Site" to create your first site from a template.
            </div>
          </div>
        )}

        {sites.map((site) => (
          <SiteCard
            key={site.id}
            site={site}
            isExpanded={expandedSiteId === site.id}
            onToggleExpand={() =>
              setExpandedSiteId((prev) => (prev === site.id ? null : site.id))
            }
            onTogglePublish={handleTogglePublish}
            onDelete={handleDelete}
            publishing={publishingId === site.id || deletingId === site.id}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

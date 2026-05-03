'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  logoUrl: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  tenantId: string;
  tenantRole: string | null;
  tenant: Tenant | null;
  lockMailAddress: string | null;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    ''
  );
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    ...extra,
  };
}

function initials(first: string | null, last: string | null, email: string): string {
  if (first || last) {
    return `${(first ?? '')[0] ?? ''}${(last ?? '')[0] ?? ''}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatRole(role: string): string {
  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 21V8M16 21V8M2 12h20" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  hint?: string;
}

function Field({ label, value, onChange, readOnly, placeholder, icon, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: readOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: focused
            ? '1px solid rgba(220,38,38,0.5)'
            : readOnly
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 9,
          padding: '11px 14px',
          transition: 'border-color 0.15s',
        }}
      >
        {icon && (
          <span style={{ color: readOnly ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: readOnly ? 'rgba(255,255,255,0.35)' : '#fff',
            fontSize: 14,
            cursor: readOnly ? 'default' : 'text',
            minWidth: 0,
          }}
        />
        {readOnly && (
          <span
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: '1px 6px',
              flexShrink: 0,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            read-only
          </span>
        )}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{hint}</div>
      )}
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', flexShrink: 0, minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SettingsPanel() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({ firstName: '', lastName: '', avatarUrl: '' });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [avatarError, setAvatarError] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          const d: UserProfile = res.data;
          setProfile(d);
          setForm({
            firstName: d.firstName ?? '',
            lastName: d.lastName ?? '',
            avatarUrl: d.avatarUrl ?? '',
          });
          setDirty(false);
        } else {
          setError(res.error || 'Failed to load profile');
        }
      })
      .catch(() => setError('Network error — could not load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = () => {
    if (!dirty || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const body: Record<string, string> = {};
    if (form.firstName.trim()) body.firstName = form.firstName.trim();
    if (form.lastName.trim()) body.lastName = form.lastName.trim();
    if (form.avatarUrl.trim()) body.avatarUrl = form.avatarUrl.trim();

    fetch(`${API_BASE}/api/me`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setSaveSuccess(true);
          setDirty(false);
          setProfile(prev => prev ? { ...prev, ...res.data } : prev);
          setTimeout(() => setSaveSuccess(false), 4000);
        } else {
          setSaveError(res.error || 'Failed to save profile');
        }
      })
      .catch(() => setSaveError('Network error — changes not saved'))
      .finally(() => setSaving(false));
  };

  // ── Avatar display ───────────────────────────────────────────────────────────

  const avatarSrc = form.avatarUrl && !avatarError ? form.avatarUrl : null;
  const avatarInitials = profile
    ? initials(form.firstName || profile.firstName, form.lastName || profile.lastName, profile.email)
    : '??';

  // ── Styles ───────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,10,0.97)',
    borderRadius: 16,
    padding: '28px 28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    minHeight: 520,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#fff',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '20px 22px',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    marginBottom: 10,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'linear-gradient(135deg,#dc2626,#f97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <IconSettings />
        </div>
        <span
          style={{
            background: 'linear-gradient(90deg,#dc2626,#f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Settings
        </span>
      </div>

      {/* Error loading profile */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.09)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
          Loading profile...
        </div>
      ) : profile ? (
        <>
          {/* ── 1. Profile Section ────────────────────────────────────────────── */}
          <div>
            <div style={sectionLabel}>Profile</div>
            <div style={cardStyle}>
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg,#dc2626,#f97316)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.1)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Avatar"
                      onError={() => setAvatarError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    avatarInitials
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    {[form.firstName, form.lastName].filter(Boolean).join(' ') || profile.email}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>
                    {profile.email}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 9px',
                      borderRadius: 20,
                      background: 'rgba(220,38,38,0.1)',
                      border: '1px solid rgba(220,38,38,0.22)',
                      color: '#f87171',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {formatRole(profile.tenantRole ?? profile.role)}
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <Field
                      label="First Name"
                      value={form.firstName}
                      onChange={v => updateField('firstName', v)}
                      placeholder="First name"
                      icon={<IconUser />}
                    />
                  </div>
                  <div style={{ flex: '1 1 160px' }}>
                    <Field
                      label="Last Name"
                      value={form.lastName}
                      onChange={v => updateField('lastName', v)}
                      placeholder="Last name"
                      icon={<IconUser />}
                    />
                  </div>
                </div>
                <Field
                  label="Avatar URL"
                  value={form.avatarUrl}
                  onChange={v => { updateField('avatarUrl', v); setAvatarError(false); }}
                  placeholder="https://example.com/avatar.jpg"
                  icon={<IconImage />}
                  hint="Paste a direct image URL. Changes preview instantly in the avatar above."
                />
              </div>

              {/* Save banners */}
              {saveSuccess && (
                <div
                  style={{
                    marginTop: 16,
                    background: 'rgba(34,197,94,0.10)',
                    border: '1px solid rgba(34,197,94,0.28)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IconCheck />
                  Profile saved successfully.
                </div>
              )}
              {saveError && (
                <div
                  style={{
                    marginTop: 16,
                    background: 'rgba(239,68,68,0.09)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#ef4444',
                  }}
                >
                  {saveError}
                </div>
              )}

              {/* Save button */}
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  style={{
                    background:
                      !dirty || saving
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg,#dc2626,#f97316)',
                    border: 'none',
                    borderRadius: 10,
                    color: !dirty ? 'rgba(255,255,255,0.3)' : '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '12px 28px',
                    cursor: !dirty || saving ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, opacity 0.15s',
                    opacity: saving ? 0.65 : 1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {dirty && !saving && (
                  <button
                    onClick={() => {
                      setForm({
                        firstName: profile.firstName ?? '',
                        lastName: profile.lastName ?? '',
                        avatarUrl: profile.avatarUrl ?? '',
                      });
                      setDirty(false);
                      setSaveError(null);
                      setAvatarError(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '12px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    Discard
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. Account Info ───────────────────────────────────────────────── */}
          <div>
            <div style={sectionLabel}>Account Info</div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <InfoRow
                  icon={<IconMail />}
                  label="Email"
                  value={profile.email}
                />
                <InfoRow
                  icon={<IconUser />}
                  label="System Role"
                  value={formatRole(profile.role)}
                />
                {profile.tenantRole && (
                  <InfoRow
                    icon={<IconUser />}
                    label="Workspace Role"
                    value={formatRole(profile.tenantRole)}
                  />
                )}
                {profile.tenant && (
                  <InfoRow
                    icon={<IconBuilding />}
                    label="Workspace"
                    value={`${profile.tenant.name} (${profile.tenant.slug})`}
                  />
                )}
                {profile.lockMailAddress && (
                  <InfoRow
                    icon={<IconLock />}
                    label="LockMail"
                    value={profile.lockMailAddress}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', minWidth: 110 }}>Member Since</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                    {formatDate(profile.createdAt)}
                  </span>
                </div>
              </div>

              {/* Read-only notice */}
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.25)',
                  lineHeight: 1.6,
                }}
              >
                Email, role, and workspace are managed by your organization administrator and cannot be changed here.
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

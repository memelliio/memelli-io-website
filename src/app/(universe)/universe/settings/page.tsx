'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Settings,
  Globe,
  Key,
  Shield,
  Mail,
  Zap,
  CreditCard,
  Phone,
  Server,
  Bot,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlatformConfig {
  platformName: string;
  defaultPlan: string;
  autoProvisioningEnabled: boolean;
  defaultAiAgentsEnabled: boolean;
}

interface ApiConfig {
  baseUrl: string;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  corsAllowedOrigins: string;
}

interface AiConfig {
  defaultModel: string;
  maxTokensPerRequest: number;
  maxSpendPerTenantPerDay: number;
  agentAutoActivation: boolean;
}

interface EmailConfig {
  sendGridStatus: 'connected' | 'disconnected';
  defaultFromEmail: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
}

interface SecurityConfig {
  jwtTokenExpiry: string;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  enforce2FA: boolean;
  ipAllowlist: string;
}

interface Integration {
  name: string;
  key: string;
  connected: boolean;
}

interface UniverseSettings {
  platform: PlatformConfig;
  api: ApiConfig;
  ai: AiConfig;
  email: EmailConfig;
  security: SecurityConfig;
  integrations: Integration[];
}

/* ------------------------------------------------------------------ */
/*  Default state                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS: UniverseSettings = {
  platform: {
    platformName: 'Memelli',
    defaultPlan: 'Starter',
    autoProvisioningEnabled: true,
    defaultAiAgentsEnabled: true
  },
  api: {
    baseUrl: 'https://api.memelli.com',
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    corsAllowedOrigins: 'https://memelli.com, https://*.memelli.com'
  },
  ai: {
    defaultModel: 'claude-sonnet-4-20250514',
    maxTokensPerRequest: 4096,
    maxSpendPerTenantPerDay: 50,
    agentAutoActivation: true
  },
  email: {
    sendGridStatus: 'connected',
    defaultFromEmail: 'noreply@memelli.com',
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true
  },
  security: {
    jwtTokenExpiry: '24h',
    minPasswordLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    enforce2FA: false,
    ipAllowlist: ''
  },
  integrations: [
    { name: 'Stripe', key: 'stripe', connected: true },
    { name: 'Twilio', key: 'twilio', connected: true },
    { name: 'SendGrid', key: 'sendgrid', connected: true },
    { name: 'SmartCredit', key: 'smartcredit', connected: false },
    { name: 'Higgsfield', key: 'higgsfield', connected: false },
  ]
};

const PLAN_OPTIONS = ['Free', 'Starter', 'Pro', 'Enterprise'];
const MODEL_OPTIONS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-haiku-35-20241022',
];
const EXPIRY_OPTIONS = ['1h', '6h', '12h', '24h', '48h', '7d', '30d'];

/* ------------------------------------------------------------------ */
/*  Section icons                                                      */
/* ------------------------------------------------------------------ */

const INTEGRATION_ICONS: Record<string, React.ComponentType<any>> = {
  stripe: CreditCard,
  twilio: Phone,
  sendgrid: Mail,
  smartcredit: CreditCard,
  higgsfield: Zap
};

/* ------------------------------------------------------------------ */
/*  Collapsible Card                                                   */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  icon: Icon,
  children,
  defaultOpen = false
}: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[hsl(var(--muted))] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{title}</h2>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        )}
      </button>
      {open && (
        <div className="border-t border-[hsl(var(--border))] px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */

function Toggle({
  enabled,
  onChange,
  label,
  description
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</p>
        {description && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-[hsl(var(--muted))]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
/* ------------------------------------------------------------------ */

function Field({
  label,
  description,
  children
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</label>
      {description && <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function UniverseSettingsPage() {
  const api = useApi();

  const [settings, setSettings] = useState<UniverseSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* Fetch */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<UniverseSettings>('/api/admin/settings');
    if (res.error) {
      // Use defaults on error — settings may not exist yet
      setSettings(DEFAULT_SETTINGS);
    } else if (res.data) {
      setSettings(res.data);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Save */
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const res = await api.patch('/api/admin/settings', settings);
    if (res.error) {
      setError(res.error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  /* Updaters */
  const updatePlatform = (patch: Partial<PlatformConfig>) =>
    setSettings((s) => ({ ...s, platform: { ...s.platform, ...patch } }));
  const updateApi = (patch: Partial<ApiConfig>) =>
    setSettings((s) => ({ ...s, api: { ...s.api, ...patch } }));
  const updateAi = (patch: Partial<AiConfig>) =>
    setSettings((s) => ({ ...s, ai: { ...s.ai, ...patch } }));
  const updateEmail = (patch: Partial<EmailConfig>) =>
    setSettings((s) => ({ ...s, email: { ...s.email, ...patch } }));
  const updateSecurity = (patch: Partial<SecurityConfig>) =>
    setSettings((s) => ({ ...s, security: { ...s.security, ...patch } }));

  /* Input styles */
  const inputCls =
    'h-9 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30';
  const selectCls =
    'h-9 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-sm text-[hsl(var(--foreground))] outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30';
  const readonlyCls =
    'h-9 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 text-sm text-[hsl(var(--muted-foreground))] cursor-not-allowed';

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-4xl px-6 py-8">

        {/* ---- Header ---- */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-7 w-7 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight">Universe Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <LoadingGlobe size="sm" />
            ) : saveSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
          </button>
        </div>

        {/* ---- Loading ---- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
            <LoadingGlobe size="lg" />
            <p className="mt-3 text-sm">Loading settings...</p>
          </div>
        )}

        {/* ---- Error ---- */}
        {!loading && error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ---- Settings Sections ---- */}
        {!loading && (
          <div className="space-y-4">

            {/* Platform Configuration */}
            <SectionCard title="Platform Configuration" icon={Globe} defaultOpen>
              <div className="space-y-5">
                <Field label="Platform Name">
                  <input
                    type="text"
                    value={settings.platform.platformName}
                    onChange={(e) => updatePlatform({ platformName: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Default Plan for New Tenants">
                  <select
                    value={settings.platform.defaultPlan}
                    onChange={(e) => updatePlatform({ defaultPlan: e.target.value })}
                    className={selectCls}
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Toggle
                  label="Auto-Provisioning"
                  description="Automatically provision resources when a new tenant signs up"
                  enabled={settings.platform.autoProvisioningEnabled}
                  onChange={(v) => updatePlatform({ autoProvisioningEnabled: v })}
                />
                <Toggle
                  label="Default AI Agents on Signup"
                  description="Enable AI agents by default for new tenants"
                  enabled={settings.platform.defaultAiAgentsEnabled}
                  onChange={(v) => updatePlatform({ defaultAiAgentsEnabled: v })}
                />
              </div>
            </SectionCard>

            {/* API Configuration */}
            <SectionCard title="API Configuration" icon={Server}>
              <div className="space-y-5">
                <Field label="API Base URL">
                  <input
                    type="text"
                    value={settings.api.baseUrl}
                    readOnly
                    className={readonlyCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Rate Limit (requests/minute)">
                    <input
                      type="number"
                      value={settings.api.rateLimitPerMinute}
                      onChange={(e) => updateApi({ rateLimitPerMinute: parseInt(e.target.value) || 0 })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Rate Limit (requests/hour)">
                    <input
                      type="number"
                      value={settings.api.rateLimitPerHour}
                      onChange={(e) => updateApi({ rateLimitPerHour: parseInt(e.target.value) || 0 })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="CORS Allowed Origins" description="Comma-separated list of allowed origins">
                  <input
                    type="text"
                    value={settings.api.corsAllowedOrigins}
                    onChange={(e) => updateApi({ corsAllowedOrigins: e.target.value })}
                    className={inputCls}
                    placeholder="https://example.com, https://*.example.com"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* AI Configuration */}
            <SectionCard title="AI Configuration" icon={Bot}>
              <div className="space-y-5">
                <Field label="Default Claude Model">
                  <select
                    value={settings.ai.defaultModel}
                    onChange={(e) => updateAi({ defaultModel: e.target.value })}
                    className={selectCls}
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Max Tokens Per Request">
                  <input
                    type="number"
                    value={settings.ai.maxTokensPerRequest}
                    onChange={(e) => updateAi({ maxTokensPerRequest: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Max Spend per Tenant per Day ($)" description="Cost control limit in USD">
                  <input
                    type="number"
                    value={settings.ai.maxSpendPerTenantPerDay}
                    onChange={(e) => updateAi({ maxSpendPerTenantPerDay: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </Field>
                <Toggle
                  label="Agent Auto-Activation"
                  description="Automatically activate AI agents based on tenant plan rules"
                  enabled={settings.ai.agentAutoActivation}
                  onChange={(v) => updateAi({ agentAutoActivation: v })}
                />
              </div>
            </SectionCard>

            {/* Email / Notifications */}
            <SectionCard title="Email / Notifications" icon={Mail}>
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">SendGrid API Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                      settings.email.sendGridStatus === 'connected'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        settings.email.sendGridStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    {settings.email.sendGridStatus === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Field label="Default From Email">
                  <input
                    type="email"
                    value={settings.email.defaultFromEmail}
                    onChange={(e) => updateEmail({ defaultFromEmail: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Notification Channels
                  </p>
                  <Toggle
                    label="Email Notifications"
                    enabled={settings.email.emailNotifications}
                    onChange={(v) => updateEmail({ emailNotifications: v })}
                  />
                  <Toggle
                    label="SMS Notifications"
                    enabled={settings.email.smsNotifications}
                    onChange={(v) => updateEmail({ smsNotifications: v })}
                  />
                  <Toggle
                    label="In-App Notifications"
                    enabled={settings.email.inAppNotifications}
                    onChange={(v) => updateEmail({ inAppNotifications: v })}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Security */}
            <SectionCard title="Security" icon={Shield}>
              <div className="space-y-5">
                <Field label="JWT Token Expiry">
                  <select
                    value={settings.security.jwtTokenExpiry}
                    onChange={(e) => updateSecurity({ jwtTokenExpiry: e.target.value })}
                    className={selectCls}
                  >
                    {EXPIRY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Password Requirements
                  </p>
                  <Field label="Minimum Password Length">
                    <input
                      type="number"
                      value={settings.security.minPasswordLength}
                      onChange={(e) => updateSecurity({ minPasswordLength: parseInt(e.target.value) || 8 })}
                      min={8}
                      max={64}
                      className={inputCls}
                    />
                  </Field>
                  <Toggle
                    label="Require Uppercase Letters"
                    enabled={settings.security.requireUppercase}
                    onChange={(v) => updateSecurity({ requireUppercase: v })}
                  />
                  <Toggle
                    label="Require Numbers"
                    enabled={settings.security.requireNumbers}
                    onChange={(v) => updateSecurity({ requireNumbers: v })}
                  />
                  <Toggle
                    label="Require Special Characters"
                    enabled={settings.security.requireSpecialChars}
                    onChange={(v) => updateSecurity({ requireSpecialChars: v })}
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Advanced Security
                  </p>
                  <Toggle
                    label="Enforce Two-Factor Authentication"
                    description="Require 2FA for all admin users"
                    enabled={settings.security.enforce2FA}
                    onChange={(v) => updateSecurity({ enforce2FA: v })}
                  />
                  <Field label="IP Allowlist" description="Comma-separated IPs. Leave empty to allow all.">
                    <input
                      type="text"
                      value={settings.security.ipAllowlist}
                      onChange={(e) => updateSecurity({ ipAllowlist: e.target.value })}
                      className={inputCls}
                      placeholder="192.168.1.0/24, 10.0.0.1"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Integrations Status */}
            <SectionCard title="Integrations Status" icon={Key}>
              <div className="space-y-3">
                {settings.integrations.map((integration) => {
                  const IntIcon = INTEGRATION_ICONS[integration.key] || Zap;
                  return (
                    <div
                      key={integration.key}
                      className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <IntIcon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{integration.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                            integration.connected
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'
                          }`}
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              integration.connected ? 'bg-emerald-400' : 'bg-[hsl(var(--muted-foreground))]'
                            }`}
                          />
                          {integration.connected ? 'Connected' : 'Not Connected'}
                        </span>
                        <button className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
                          Configure
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  );
}

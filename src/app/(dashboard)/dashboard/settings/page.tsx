'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  LayoutGrid,
  Mic,
  Bell,
  Phone,
  Plug,
  CreditCard,
  Users,
  Code,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        value ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
          value ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// SettingRow
// ---------------------------------------------------------------------------
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] gap-4">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SaveButton
// ---------------------------------------------------------------------------
function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`mt-6 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        saved
          ? 'bg-green-700 text-white'
          : 'bg-primary hover:bg-primary/90 text-white'
      }`}
    >
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// useSave hook
// ---------------------------------------------------------------------------
function useSave(key: string, data: object) {
  const [saved, setSaved] = useState(false);
  const save = () => {
    localStorage.setItem(key, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return { save, saved };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { id: 'my-os',         label: 'Business Profile',       icon: User },
  { id: 'sphere',        label: 'Sphere & Display',        icon: Sparkles },
  { id: 'home-screen',   label: 'Home Screen',             icon: LayoutGrid },
  { id: 'voice',         label: 'Voice & AI',              icon: Mic },
  { id: 'notifications', label: 'Notifications',           icon: Bell },
  { id: 'phone',         label: 'Phone & Communications',  icon: Phone },
  { id: 'integrations',  label: 'Integrations',            icon: Plug },
  { id: 'billing',       label: 'Billing & Plans',         icon: CreditCard },
  { id: 'users',         label: 'Users & Permissions',     icon: Users },
  { id: 'developer',     label: 'Developer',               icon: Code },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

// ---------------------------------------------------------------------------
// 1. My OS — Business Profile
// ---------------------------------------------------------------------------
function MyOsPanel() {
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    timezone: 'America/New_York',
    language: 'en',
  });

  useEffect(() => {
    const stored = localStorage.getItem('melli_profile');
    if (stored) setForm(JSON.parse(stored));
  }, []);

  const { save, saved } = useSave('melli_profile', form);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const inputCls =
    'bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-56';

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Business Profile</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Your organization&apos;s public identity on Melli OS.</p>

      <SettingRow label="Business Name" description="Displayed throughout the OS">
        <input className={inputCls} value={form.businessName} onChange={set('businessName')} placeholder="Acme Corp" />
      </SettingRow>
      <SettingRow label="Owner Name" description="Primary account holder">
        <input className={inputCls} value={form.ownerName} onChange={set('ownerName')} placeholder="Jane Smith" />
      </SettingRow>
      <SettingRow label="Email" description="Contact email address">
        <input className={inputCls} value={form.email} onChange={set('email')} placeholder="jane@acme.com" type="email" />
      </SettingRow>
      <SettingRow label="Phone" description="Business phone number">
        <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" type="tel" />
      </SettingRow>
      <SettingRow label="Timezone" description="Used for scheduling and reports">
        <select className={inputCls} value={form.timezone} onChange={set('timezone')}>
          {[
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Anchorage',
            'Pacific/Honolulu',
            'Europe/London',
            'Europe/Paris',
            'Asia/Tokyo',
            'Australia/Sydney',
          ].map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </SettingRow>
      <SettingRow label="Language" description="Interface language">
        <select className={inputCls} value={form.language} onChange={set('language')}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="pt">Português</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>
      </SettingRow>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Sphere & Display
// ---------------------------------------------------------------------------
function SpherePanel() {
  const [cfg, setCfg] = useState({
    hue: 210,
    saturation: 70,
    energy: 1.0,
    speed: 1.0,
    audioSensitivity: 1.5,
    pulseRings: true,
    logoOpacity: 0.85,
    coronaSize: 1.0,
  });

  useEffect(() => {
    const stored = localStorage.getItem('melli_sphere_config');
    if (stored) setCfg(JSON.parse(stored));
  }, []);

  const { save, saved } = useSave('melli_sphere_config', cfg);
  const setNum = (k: keyof typeof cfg) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCfg((p) => ({ ...p, [k]: parseFloat(e.target.value) }));

  const sliderCls = 'w-44 accent-red-500';

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Sphere &amp; Display</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Customize the animated sphere on your homepage.</p>

      <div className="mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
        Changes apply to your homepage sphere instantly.
      </div>

      {(
        [
          { key: 'hue',              label: 'Hue',              desc: 'Color angle (0–360)',     min: 0,   max: 360, step: 1 },
          { key: 'saturation',       label: 'Saturation',       desc: 'Color intensity (0–100)', min: 0,   max: 100, step: 1 },
          { key: 'energy',           label: 'Energy',           desc: 'Visual intensity (0–2)',  min: 0,   max: 2,   step: 0.01 },
          { key: 'speed',            label: 'Speed',            desc: 'Animation speed (0–2)',   min: 0,   max: 2,   step: 0.01 },
          { key: 'audioSensitivity', label: 'Audio Sensitivity',desc: 'Mic reactivity (0–3)',    min: 0,   max: 3,   step: 0.01 },
          { key: 'logoOpacity',      label: 'Logo Opacity',     desc: 'Logo visibility (0–1)',   min: 0,   max: 1,   step: 0.01 },
          { key: 'coronaSize',       label: 'Corona Size',      desc: 'Halo radius (0.5–2)',     min: 0.5, max: 2,   step: 0.01 },
        ] as const
      ).map(({ key, label, desc, min, max, step }) => (
        <SettingRow key={key} label={label} description={desc}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              className={sliderCls}
              min={min}
              max={max}
              step={step}
              value={cfg[key]}
              onChange={setNum(key as keyof typeof cfg)}
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{Number(cfg[key]).toFixed(step < 1 ? 2 : 0)}</span>
          </div>
        </SettingRow>
      ))}

      <SettingRow label="Pulse Rings" description="Animated concentric rings">
        <Toggle value={cfg.pulseRings} onChange={(v) => setCfg((p) => ({ ...p, pulseRings: v }))} />
      </SettingRow>

      <div className="flex items-center gap-4 mt-6">
        <SaveButton onClick={save} saved={saved} />
        <Link
          href="/dashboard/admin/sphere-studio"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.06] text-foreground hover:border-white/[0.1] hover:text-foreground transition-all duration-200"
        >
          Open Sphere Studio <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Home Screen
// ---------------------------------------------------------------------------
const ALL_MODULES = [
  { id: 'crm',             label: 'CRM' },
  { id: 'contacts',        label: 'Contacts' },
  { id: 'analytics',       label: 'Analytics' },
  { id: 'ai',              label: 'AI' },
  { id: 'tasks',           label: 'Tasks' },
  { id: 'commerce',        label: 'Commerce' },
  { id: 'coaching',        label: 'Coaching' },
  { id: 'seo',             label: 'SEO' },
  { id: 'workflows',       label: 'Workflows' },
  { id: 'leads',           label: 'Leads' },
  { id: 'communications',  label: 'Communications' },
  { id: 'documents',       label: 'Documents' },
  { id: 'credit',          label: 'Credit' },
  { id: 'iptv',            label: 'IPTV' },
  { id: 'insights',        label: 'Insights' },
  { id: 'content',         label: 'Content' },
  { id: 'activities',      label: 'Activities' },
  { id: 'conversations',   label: 'Conversations' },
  { id: 'partners',        label: 'Partners' },
];

function HomeScreenPanel() {
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('melli_pinned_modules');
    if (stored) setPinned(JSON.parse(stored));
    else {
      const defaults: Record<string, boolean> = {};
      ALL_MODULES.forEach((m) => (defaults[m.id] = true));
      setPinned(defaults);
    }
  }, []);

  const toggle = (id: string) => setPinned((p) => ({ ...p, [id]: !p[id] }));

  const save = () => {
    localStorage.setItem('melli_pinned_modules', JSON.stringify(pinned));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Home Screen</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Choose which modules appear on your home screen grid.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {ALL_MODULES.map((mod) => (
          <div
            key={mod.id}
            className="flex items-center justify-between py-3 border-b border-white/[0.04] pr-2 gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center">
                <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm text-foreground">{mod.label}</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!pinned[mod.id]}
                onChange={() => toggle(mod.id)}
                className="accent-red-500 w-4 h-4 rounded"
              />
              <span className="text-xs text-muted-foreground">{pinned[mod.id] ? 'Pinned' : 'Pin'}</span>
            </label>
          </div>
        ))}
      </div>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Voice & AI
// ---------------------------------------------------------------------------
function VoicePanel() {
  const [cfg, setCfg] = useState({
    voiceModel: 'aura2-aurora',
    micSensitivity: 70,
    greeting: "Hi, I'm Melli. How can I help you today?",
    conversationMode: true,
  });

  useEffect(() => {
    const stored = localStorage.getItem('melli_voice_config');
    if (stored) setCfg(JSON.parse(stored));
  }, []);

  const { save, saved } = useSave('melli_voice_config', cfg);

  const inputCls =
    'bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20';

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Voice &amp; AI</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Configure Melli&apos;s voice and conversational behavior.</p>

      <SettingRow label="Voice Model" description="Text-to-speech voice engine">
        <select
          className={`${inputCls} w-56`}
          value={cfg.voiceModel}
          onChange={(e) => setCfg((p) => ({ ...p, voiceModel: e.target.value }))}
        >
          <option value="aura2-aurora">Aura 2 Aurora (Natural)</option>
          <option value="aura2-orion">Aura 2 Orion</option>
          <option value="aura2-luna">Aura 2 Luna</option>
        </select>
      </SettingRow>

      <SettingRow label="Mic Sensitivity" description={`Microphone input gain (${cfg.micSensitivity})`}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={cfg.micSensitivity}
          onChange={(e) => setCfg((p) => ({ ...p, micSensitivity: parseInt(e.target.value) }))}
          className="w-44 accent-red-500"
        />
      </SettingRow>

      <SettingRow label="Conversation Mode" description="Keep mic open between turns">
        <Toggle
          value={cfg.conversationMode}
          onChange={(v) => setCfg((p) => ({ ...p, conversationMode: v }))}
        />
      </SettingRow>

      <div className="py-3 border-b border-white/[0.04]">
        <p className="text-sm text-foreground mb-1">Greeting Message</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">What Melli says when activated</p>
        <textarea
          rows={3}
          className={`${inputCls} w-full resize-none`}
          value={cfg.greeting}
          onChange={(e) => setCfg((p) => ({ ...p, greeting: e.target.value }))}
        />
      </div>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Notifications
// ---------------------------------------------------------------------------
const NOTIFICATION_KEYS = [
  { key: 'newLeads',       label: 'New Leads',        desc: 'Alert when a lead is captured' },
  { key: 'dealUpdates',    label: 'Deal Updates',     desc: 'Stage changes in your pipeline' },
  { key: 'aiCompletions',  label: 'AI Completions',   desc: 'When AI finishes a long task' },
  { key: 'systemAlerts',   label: 'System Alerts',    desc: 'Critical system notifications' },
  { key: 'emailDigest',    label: 'Email Digest',     desc: 'Daily summary via email' },
  { key: 'smsAlerts',      label: 'SMS Alerts',       desc: 'Text message notifications' },
] as const;

type NotifKey = (typeof NOTIFICATION_KEYS)[number]['key'];

function NotificationsPanel() {
  const [cfg, setCfg] = useState<Record<NotifKey, boolean>>({
    newLeads: true,
    dealUpdates: true,
    aiCompletions: false,
    systemAlerts: true,
    emailDigest: false,
    smsAlerts: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('melli_notifications');
    if (stored) setCfg(JSON.parse(stored));
  }, []);

  const { save, saved } = useSave('melli_notifications', cfg);

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Notifications</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Control which events trigger notifications.</p>

      {NOTIFICATION_KEYS.map(({ key, label, desc }) => (
        <SettingRow key={key} label={label} description={desc}>
          <Toggle
            value={cfg[key]}
            onChange={(v) => setCfg((p) => ({ ...p, [key]: v }))}
          />
        </SettingRow>
      ))}

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Phone & Communications
// ---------------------------------------------------------------------------
function PhonePanel() {
  const [cfg, setCfg] = useState({
    forwardNumber: '',
    voicemailGreeting: '',
    smsSignature: '',
    ivrEnabled: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('melli_phone_config');
    if (stored) setCfg(JSON.parse(stored));
  }, []);

  const { save, saved } = useSave('melli_phone_config', cfg);

  const inputCls =
    'bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-56';

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Phone &amp; Communications</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Manage call routing, voicemail, and SMS settings.</p>

      <SettingRow label="Call Forward Number" description="Route incoming calls to this number">
        <input
          className={inputCls}
          value={cfg.forwardNumber}
          onChange={(e) => setCfg((p) => ({ ...p, forwardNumber: e.target.value }))}
          placeholder="+1 555 000 0000"
          type="tel"
        />
      </SettingRow>

      <SettingRow label="SMS Signature" description="Appended to outgoing messages">
        <input
          className={inputCls}
          value={cfg.smsSignature}
          onChange={(e) => setCfg((p) => ({ ...p, smsSignature: e.target.value }))}
          placeholder="— Sent via Melli"
        />
      </SettingRow>

      <SettingRow label="IVR Enabled" description="Interactive voice response menu">
        <Toggle
          value={cfg.ivrEnabled}
          onChange={(v) => setCfg((p) => ({ ...p, ivrEnabled: v }))}
        />
      </SettingRow>

      <div className="py-3 border-b border-white/[0.04]">
        <p className="text-sm text-foreground mb-1">Voicemail Greeting</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">Script read to callers when you&apos;re unavailable</p>
        <textarea
          rows={3}
          className="bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full resize-none"
          value={cfg.voicemailGreeting}
          onChange={(e) => setCfg((p) => ({ ...p, voicemailGreeting: e.target.value }))}
          placeholder="You've reached Acme Corp. Please leave a message..."
        />
      </div>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Integrations
// ---------------------------------------------------------------------------
function IntegrationsPanel() {
  const [stripe, setStripe] = useState({ connected: false });
  const [twilio, setTwilio] = useState({ apiKey: '', secret: '' });
  const [google, setGoogle] = useState({ connected: false });
  const [zapier, setZapier] = useState({ webhookUrl: '' });
  const [openai, setOpenai] = useState({ apiKey: '' });

  const inputCls =
    'bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full';

  const cardCls = 'bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 mb-4';

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Integrations</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Connect third-party services to extend Melli OS.</p>

      {/* Stripe */}
      <div className={cardCls}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-foreground">Stripe</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accept payments and manage subscriptions</p>
          </div>
          <button
            onClick={() => setStripe((p) => ({ connected: !p.connected }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              stripe.connected
                ? 'bg-green-700/30 text-green-400 border border-green-700/50'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {stripe.connected ? '✓ Connected' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Twilio */}
      <div className={cardCls}>
        <p className="text-sm font-medium text-foreground mb-1">Twilio</p>
        <p className="text-xs text-muted-foreground mb-3">SMS, voice, and communication APIs</p>
        <div className="grid grid-cols-1 gap-2">
          <input
            className={inputCls}
            value={twilio.apiKey}
            onChange={(e) => setTwilio((p) => ({ ...p, apiKey: e.target.value }))}
            placeholder="API Key (ACxxxxxxxx)"
          />
          <input
            className={inputCls}
            type="password"
            value={twilio.secret}
            onChange={(e) => setTwilio((p) => ({ ...p, secret: e.target.value }))}
            placeholder="Auth Token"
          />
        </div>
      </div>

      {/* Google */}
      <div className={cardCls}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-foreground">Google</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sync calendar, contacts, and Gmail</p>
          </div>
          <button
            onClick={() => setGoogle((p) => ({ connected: !p.connected }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              google.connected
                ? 'bg-green-700/30 text-green-400 border border-green-700/50'
                : 'bg-muted hover:bg-muted text-white'
            }`}
          >
            {google.connected ? '✓ Connected' : 'Sign in with Google'}
          </button>
        </div>
      </div>

      {/* Zapier */}
      <div className={cardCls}>
        <p className="text-sm font-medium text-foreground mb-1">Zapier</p>
        <p className="text-xs text-muted-foreground mb-3">Trigger Zaps via webhook events</p>
        <input
          className={inputCls}
          value={zapier.webhookUrl}
          onChange={(e) => setZapier({ webhookUrl: e.target.value })}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
        />
      </div>

      {/* OpenAI */}
      <div className={cardCls}>
        <p className="text-sm font-medium text-foreground mb-1">OpenAI</p>
        <p className="text-xs text-muted-foreground mb-3">Use your own OpenAI API key</p>
        <input
          className={inputCls}
          type="password"
          value={openai.apiKey}
          onChange={(e) => setOpenai({ apiKey: e.target.value })}
          placeholder="sk-..."
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. Billing & Plans
// ---------------------------------------------------------------------------
function UsageBar({ label, used, limit, unit = '' }: { label: string; used: number; limit: number; unit?: string }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>
          {used.toLocaleString()}{unit} / {limit.toLocaleString()}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 85 ? 'bg-red-500' : 'bg-red-600/70'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BillingPanel() {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Billing &amp; Plans</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">Manage your subscription and monitor usage.</p>

      {/* Plan card */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold tracking-tight text-foreground">Current Plan</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">PRO</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Billing cycle: Monthly</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Next payment: April 30, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">$99</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold tracking-tight text-foreground mb-4">Usage This Period</p>
        <UsageBar label="Contacts" used={3240} limit={10000} />
        <UsageBar label="AI Credits" used={18500} limit={50000} />
        <UsageBar label="Storage" used={4.2} limit={20} unit=" GB" />
      </div>

      <button className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold tracking-tight transition-all duration-200">
        Upgrade to Enterprise →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. Users & Permissions
// ---------------------------------------------------------------------------
const MOCK_USERS = [
  { name: 'Jane Smith',   email: 'jane@acme.com',    role: 'Admin',  status: 'Active' },
  { name: 'Bob Lee',      email: 'bob@acme.com',     role: 'Member', status: 'Active' },
  { name: 'Carol Jones',  email: 'carol@acme.com',   role: 'Viewer', status: 'Invited' },
];

const ROLE_COLORS: Record<string, string> = {
  Admin:  'bg-red-600/20 text-red-400',
  Member: 'bg-blue-600/20 text-blue-400',
  Viewer: 'bg-muted text-muted-foreground',
};

function UsersPanel() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'Member' });

  const handleInvite = () => {
    if (!invite.email) return;
    setUsers((u) => [...u, { ...invite, status: 'Invited' }]);
    setInvite({ name: '', email: '', role: 'Member' });
    setShowInvite(false);
  };

  const inputCls =
    'bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Users &amp; Permissions</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">Manage team members and access roles.</p>
        </div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all duration-200"
        >
          + Invite User
        </button>
      </div>

      {showInvite && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 mb-5 grid grid-cols-1 gap-3">
          <p className="text-sm font-semibold tracking-tight text-foreground">Invite New User</p>
          <input
            className={`${inputCls} w-full`}
            placeholder="Full Name"
            value={invite.name}
            onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className={`${inputCls} w-full`}
            placeholder="Email address"
            type="email"
            value={invite.email}
            onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
          />
          <select
            className={`${inputCls} w-full`}
            value={invite.role}
            onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}
          >
            <option>Admin</option>
            <option>Member</option>
            <option>Viewer</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all duration-200"
            >
              Send Invite
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted text-foreground text-sm font-medium transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04] text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] transition-all duration-200">
                <td className="px-4 py-3 text-foreground font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.status === 'Active' ? 'text-green-400' : 'text-yellow-500'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setUsers((prev) => prev.filter((_, j) => j !== i))}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. Developer
// ---------------------------------------------------------------------------
const DEMO_API_KEY = 'melli_live_sk_4f8a2b9c1d3e6f7g8h9i0j1k2l3m4n5o';

function DeveloperPanel() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [env, setEnv] = useState<'production' | 'sandbox'>('production');
  const [allConfig, setAllConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setWebhookUrl(localStorage.getItem('melli_webhook_url') ?? '');
    const keys = [
      'melli_profile',
      'melli_sphere_config',
      'melli_pinned_modules',
      'melli_voice_config',
      'melli_notifications',
      'melli_phone_config',
    ];
    const out: Record<string, unknown> = {};
    keys.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val) out[k] = JSON.parse(val);
    });
    setAllConfig(out);
  }, []);

  const copyKey = () => {
    navigator.clipboard.writeText(DEMO_API_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls =
    'bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full';

  const maskedKey = DEMO_API_KEY.slice(0, 12) + '•'.repeat(24) + DEMO_API_KEY.slice(-4);

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Developer</h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">API access, webhooks, and raw configuration.</p>

      {/* API Key */}
      <div className="py-3 border-b border-white/[0.04]">
        <p className="text-sm text-foreground mb-1">API Key</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">Use this key to authenticate API requests</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-card border border-white/[0.04] rounded-xl px-3 py-1.5 text-xs text-foreground font-mono truncate">
            {showKey ? DEMO_API_KEY : maskedKey}
          </code>
          <button
            onClick={() => setShowKey((v) => !v)}
            className="p-1.5 rounded-xl bg-muted hover:bg-muted text-muted-foreground transition-all duration-200"
            title={showKey ? 'Hide' : 'Show'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={copyKey}
            className="p-1.5 rounded-xl bg-muted hover:bg-muted text-muted-foreground transition-all duration-200"
            title="Copy"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="py-3 border-b border-white/[0.04]">
        <p className="text-sm text-foreground mb-1">Webhook URL</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">Receive POST events for all Melli actions</p>
        <input
          className={inputCls}
          value={webhookUrl}
          onChange={(e) => {
            setWebhookUrl(e.target.value);
            localStorage.setItem('melli_webhook_url', e.target.value);
          }}
          placeholder="https://your-server.com/webhooks/melli"
        />
      </div>

      {/* Environment toggle */}
      <SettingRow label="Environment" description="Switch between production and sandbox">
        <div className="flex items-center gap-1 bg-card border border-white/[0.04] rounded-xl p-0.5">
          {(['production', 'sandbox'] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-all duration-200 ${
                env === e
                  ? 'bg-primary text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Raw JSON Config */}
      <div className="mt-6">
        <p className="text-sm text-foreground mb-2">Raw Config (localStorage)</p>
        <div className="bg-card border border-white/[0.04] rounded-2xl p-4 max-h-72 overflow-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {Object.keys(allConfig).length > 0
              ? JSON.stringify(allConfig, null, 2)
              : '// No saved config found.\n// Save settings in other categories to see them here.'}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel router
// ---------------------------------------------------------------------------
function CategoryPanel({ id }: { id: CategoryId }) {
  switch (id) {
    case 'my-os':         return <MyOsPanel />;
    case 'sphere':        return <SpherePanel />;
    case 'home-screen':   return <HomeScreenPanel />;
    case 'voice':         return <VoicePanel />;
    case 'notifications': return <NotificationsPanel />;
    case 'phone':         return <PhonePanel />;
    case 'integrations':  return <IntegrationsPanel />;
    case 'billing':       return <BillingPanel />;
    case 'users':         return <UsersPanel />;
    case 'developer':     return <DeveloperPanel />;
    default:              return null;
  }
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('my-os');

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#0f0f0f', color: '#f4f4f5' }}
    >
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/[0.04] flex flex-col py-6 sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 mb-6">
          <p className="text-xs font-semibold tracking-tight text-foreground uppercase tracking-widest">Settings</p>
        </div>
        <nav className="flex-1 px-2">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-xl text-sm font-medium transition-all duration-200 text-left relative ${
                  isActive
                    ? 'bg-primary/[0.08] text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/60" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right panel */}
      <main className="flex-1 min-w-0 py-10 px-8 max-w-3xl">
        <CategoryPanel id={activeCategory} />
      </main>
    </div>
  );
}

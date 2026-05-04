'use client';

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useApi } from '../../../../../../hooks/useApi';
import { Button, Input, Skeleton } from '@memelli/ui';
import {
  Camera,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Globe,
  Languages,
  Bell,
  BellRing,
  MessageSquare,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Copy,
  Check,
  Trash2,
  Monitor,
  LogOut,
  Chrome,
  Link2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  company: string | null;
  title: string | null;
  timezone: string | null;
  language: string | null;
  role: string;
  status: string;
  createdAt: string;
  tenantId: string;
  tenantRole: string | null;
  tenant: { id: string; name: string; slug: string } | null;
  twoFactorEnabled?: boolean;
  notificationPreferences?: NotificationPreferences;
  connectedAccounts?: ConnectedAccount[];
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  connectedAt: string;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface MeResponse {
  success: boolean;
  data: UserProfile;
}

interface UploadResponse {
  success: boolean;
  data: { url: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (EET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time (NZST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  marketingEmails: false,
  securityAlerts: true,
  productUpdates: true,
};

const MOCK_SESSIONS: ActiveSession[] = [
  {
    id: 'sess_current',
    device: 'MacBook Pro',
    browser: 'Chrome 122',
    ip: '192.168.1.1',
    location: 'New York, US',
    lastActive: new Date().toISOString(),
    current: true,
  },
  {
    id: 'sess_2',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    ip: '10.0.0.42',
    location: 'New York, US',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    current: false,
  },
  {
    id: 'sess_3',
    device: 'Windows Desktop',
    browser: 'Firefox 123',
    ip: '172.16.0.5',
    location: 'Chicago, US',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    current: false,
  },
];

const MOCK_CONNECTED: ConnectedAccount[] = [
  {
    id: 'conn_1',
    provider: 'Google',
    email: 'user@gmail.com',
    connectedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <Icon className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/90">{title}</h2>
          {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/80 group-hover:text-white/90 transition-colors">{label}</p>
        {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
          checked ? 'border-red-500 bg-red-500' : 'border-white/[0.12] bg-white/[0.06]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200 ${
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ProfileEditPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Profile form state ----
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [language, setLanguage] = useState('en');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formSeeded, setFormSeeded] = useState(false);

  // ---- Notification preferences ----
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);

  // ---- 2FA state ----
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const twoFactorSecret = 'JBSWY3DPEHPK3PXP'; // Placeholder

  // ---- Password change ----
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // ---- Sessions ----
  const [sessions, setSessions] = useState<ActiveSession[]>(MOCK_SESSIONS);

  // ---- Connected accounts ----
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(MOCK_CONNECTED);

  // ---- Fetch current user ----
  const {
    data: me,
    isLoading,
    isError,
  } = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<MeResponse>('/api/me');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load profile');
      return res.data;
    },
    staleTime: 30_000,
  });

  // Seed form once data arrives
  useEffect(() => {
    if (!me?.data || formSeeded) return;
    const d = me.data;
    setFirstName(d.firstName ?? '');
    setLastName(d.lastName ?? '');
    setEmail(d.email ?? '');
    setPhone(d.phone ?? '');
    setCompany(d.company ?? '');
    setTitle(d.title ?? '');
    setTimezone(d.timezone ?? 'America/New_York');
    setLanguage(d.language ?? 'en');
    setAvatarUrl(d.avatarUrl ?? null);
    setTwoFactorEnabled(d.twoFactorEnabled ?? false);
    if (d.notificationPreferences) {
      setNotifications(d.notificationPreferences);
    }
    if (d.connectedAccounts) {
      setConnectedAccounts(d.connectedAccounts);
    }
    setFormSeeded(true);
  }, [me, formSeeded]);

  // ---- Avatar upload ----
  const [uploading, setUploading] = useState(false);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload<UploadResponse>('/api/uploads/avatar', fd);
      if (res.error || !res.data) throw new Error(res.error ?? 'Upload failed');
      const url = (res.data as any).data?.url ?? (res.data as any).url;
      setAvatarUrl(url);
      toast.success('Avatar uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ---- Save profile ----
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        timezone,
        language,
        avatarUrl: avatarUrl ?? undefined,
        notificationPreferences: notifications,
      };
      const res = await api.patch('/api/me', payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save profile');
    },
  });

  // ---- Password change ----
  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
      if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
      const res = await api.post('/api/me/password', {
        currentPassword,
        newPassword,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change password');
    },
  });

  // ---- 2FA ----
  const twoFactorMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/me/two-factor', {
        code: twoFactorCode,
        enabled: !twoFactorEnabled,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setTwoFactorEnabled(!twoFactorEnabled);
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
      toast.success(twoFactorEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update 2FA');
    },
  });

  // ---- Session revoke ----
  const handleRevokeSession = useCallback(
    async (sessionId: string) => {
      try {
        const res = await api.del(`/api/me/sessions/${sessionId}`);
        if (res.error) throw new Error(res.error);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success('Session revoked');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to revoke session');
      }
    },
    [api]
  );

  // ---- Disconnect account ----
  const handleDisconnectAccount = useCallback(
    async (accountId: string) => {
      try {
        const res = await api.del(`/api/me/connected-accounts/${accountId}`);
        if (res.error) throw new Error(res.error);
        setConnectedAccounts((prev) => prev.filter((a) => a.id !== accountId));
        toast.success('Account disconnected');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to disconnect account');
      }
    },
    [api]
  );

  // ---- Connect account ----
  const handleConnectGoogle = useCallback(async () => {
    try {
      const res = await api.get<{ data: { url: string } }>('/api/me/connected-accounts/google/auth-url');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to get auth URL');
      window.location.href = (res.data as any).data?.url ?? (res.data as any).url;
    } catch {
      toast.error('Failed to start Google connection');
    }
  }, [api]);

  // ---- Helpers ----
  const initials =
    (firstName?.[0] ?? '').toUpperCase() + (lastName?.[0] ?? '').toUpperCase() || email?.[0]?.toUpperCase() || 'U';

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    passwordMutation.mutate();
  }

  function copySecret() {
    navigator.clipboard.writeText(twoFactorSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function getProviderIcon(provider: string) {
    switch (provider.toLowerCase()) {
      case 'google':
        return Chrome;
      default:
        return Link2;
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Loading skeleton                                                 */
  /* ---------------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Skeleton height={28} width="40%" />
        <Skeleton height={14} width="60%" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.04] bg-white/[0.03] p-6">
              <Skeleton height={20} width="30%" />
              <div className="mt-4 space-y-3">
                <Skeleton height={40} />
                <Skeleton height={40} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
  /* ---------------------------------------------------------------- */
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-6 text-center">
          <p className="text-sm text-red-300/80">Unable to load your profile. Please try refreshing.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['me'] })}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/settings/profile')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Edit Profile</h1>
        <p className="text-sm text-white/40 mt-1">
          Update your personal information, security settings, and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* ============================================================ */}
        {/*  SECTION 1: Avatar & Personal Info                           */}
        {/* ============================================================ */}
        <SectionCard title="Personal Information" description="Your name, contact details, and identity" icon={User}>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="group relative h-20 w-20 shrink-0 rounded-full border-2 border-white/[0.08] bg-white/[0.04] overflow-hidden
                           transition-all duration-200 hover:border-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Change avatar"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/30">
                    {initials}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {uploading ? (
                    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/70">Profile Photo</p>
                <p className="mt-0.5 text-xs text-white/30">Click to upload. JPG, PNG, or WebP up to 5 MB.</p>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="mt-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>

            {/* Email (read-only) */}
            <div className="relative">
              <Input
                label="Email"
                type="email"
                value={email}
                readOnly
                disabled
                hint="Email cannot be changed. Contact support if you need to update it."
              />
              <Mail className="absolute right-3 top-[38px] h-4 w-4 text-white/15 pointer-events-none" />
            </div>

            {/* Phone */}
            <div className="relative">
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              <Phone className="absolute right-3 top-[38px] h-4 w-4 text-white/15 pointer-events-none" />
            </div>

            {/* Company & Title */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label="Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
                <Building2 className="absolute right-3 top-[38px] h-4 w-4 text-white/15 pointer-events-none" />
              </div>
              <div className="relative">
                <Input
                  label="Job Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Product Manager"
                />
                <Briefcase className="absolute right-3 top-[38px] h-4 w-4 text-white/15 pointer-events-none" />
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-5">
              <p className="text-xs text-white/25">
                {me?.data.createdAt
                  ? `Member since ${new Date(me.data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                  : ''}
              </p>
              <Button type="submit" isLoading={saveMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ============================================================ */}
        {/*  SECTION 2: Timezone & Language                              */}
        {/* ============================================================ */}
        <SectionCard title="Locale & Preferences" description="Timezone and language settings" icon={Globe}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Timezone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="h-3.5 w-3.5 text-white/30" />
                  Timezone
                </div>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 outline-none
                           transition-all duration-200 hover:border-white/[0.12] focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20
                           [&>option]:bg-card [&>option]:text-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <Languages className="h-3.5 w-3.5 text-white/30" />
                  Language
                </div>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 outline-none
                           transition-all duration-200 hover:border-white/[0.12] focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20
                           [&>option]:bg-card [&>option]:text-white"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              Save Preferences
            </Button>
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/*  SECTION 3: Notification Preferences                         */}
        {/* ============================================================ */}
        <SectionCard title="Notifications" description="Choose how and when you receive alerts" icon={Bell}>
          <div className="divide-y divide-white/[0.04]">
            <Toggle
              label="Email Notifications"
              description="Receive important updates and alerts via email"
              checked={notifications.emailNotifications}
              onChange={(v) => setNotifications((p) => ({ ...p, emailNotifications: v }))}
            />
            <Toggle
              label="SMS Notifications"
              description="Get text messages for urgent alerts and verifications"
              checked={notifications.smsNotifications}
              onChange={(v) => setNotifications((p) => ({ ...p, smsNotifications: v }))}
            />
            <Toggle
              label="Push Notifications"
              description="Browser and mobile push notifications"
              checked={notifications.pushNotifications}
              onChange={(v) => setNotifications((p) => ({ ...p, pushNotifications: v }))}
            />
            <Toggle
              label="Security Alerts"
              description="Login attempts, password changes, and suspicious activity"
              checked={notifications.securityAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, securityAlerts: v }))}
            />
            <Toggle
              label="Product Updates"
              description="New features, improvements, and release notes"
              checked={notifications.productUpdates}
              onChange={(v) => setNotifications((p) => ({ ...p, productUpdates: v }))}
            />
            <Toggle
              label="Marketing Emails"
              description="Tips, promotions, and partner offers"
              checked={notifications.marketingEmails}
              onChange={(v) => setNotifications((p) => ({ ...p, marketingEmails: v }))}
            />
          </div>

          <div className="mt-4 flex justify-end border-t border-white/[0.04] pt-4">
            <Button size="sm" onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              Save Notifications
            </Button>
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/*  SECTION 4: Two-Factor Authentication                        */}
        {/* ============================================================ */}
        <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account" icon={ShieldCheck}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${twoFactorEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-white/20'}`}
                />
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                  </p>
                  <p className="text-xs text-white/30">
                    {twoFactorEnabled
                      ? 'Your account is protected with an authenticator app'
                      : 'Secure your account with a time-based one-time password'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={twoFactorEnabled ? 'secondary' : 'primary'}
                onClick={() => {
                  if (twoFactorEnabled) {
                    setShowTwoFactorSetup(true);
                  } else {
                    setShowTwoFactorSetup(true);
                  }
                }}
              >
                {twoFactorEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>

            {showTwoFactorSetup && !twoFactorEnabled && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-2">Setup Instructions</p>
                  <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
                    <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code or enter the secret key below</li>
                    <li>Enter the 6-digit verification code from the app</li>
                  </ol>
                </div>

                {/* Secret key */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1 block">Secret Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm font-mono text-red-400 tracking-wider">
                      {twoFactorSecret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-200"
                      title="Copy secret"
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Verification code */}
                <div>
                  <Input
                    label="Verification Code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    hint="Enter the 6-digit code from your authenticator app"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowTwoFactorSetup(false);
                      setTwoFactorCode('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={twoFactorCode.length !== 6}
                    isLoading={twoFactorMutation.isPending}
                    onClick={() => twoFactorMutation.mutate()}
                  >
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}

            {showTwoFactorSetup && twoFactorEnabled && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
                <p className="text-sm text-white/70">
                  Enter a code from your authenticator app to confirm disabling 2FA.
                </p>
                <Input
                  label="Verification Code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowTwoFactorSetup(false);
                      setTwoFactorCode('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={twoFactorCode.length !== 6}
                    isLoading={twoFactorMutation.isPending}
                    onClick={() => twoFactorMutation.mutate()}
                  >
                    Disable 2FA
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/*  SECTION 5: Password Change                                  */}
        {/* ============================================================ */}
        <SectionCard title="Change Password" description="Update your account password" icon={Lock}>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-[38px] text-white/20 hover:text-white/50 transition-colors"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                hint="Minimum 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-[38px] text-white/20 hover:text-white/50 transition-colors"
                tabIndex={-1}
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      (newPassword.length >= 8 ? 1 : 0) +
                      (/[A-Z]/.test(newPassword) ? 1 : 0) +
                      (/[0-9]/.test(newPassword) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          level <= strength ? colors[strength - 1] : 'bg-white/[0.06]'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-white/30">
                  {(() => {
                    const strength =
                      (newPassword.length >= 8 ? 1 : 0) +
                      (/[A-Z]/.test(newPassword) ? 1 : 0) +
                      (/[0-9]/.test(newPassword) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
                    return labels[strength - 1] ?? 'Too short';
                  })()}
                </p>
              </div>
            )}

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}

            <div className="flex justify-end border-t border-white/[0.04] pt-4">
              <Button
                type="submit"
                size="sm"
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                isLoading={passwordMutation.isPending}
              >
                Change Password
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ============================================================ */}
        {/*  SECTION 6: Connected Accounts                               */}
        {/* ============================================================ */}
        <SectionCard title="Connected Accounts" description="Link external accounts for quick sign-in" icon={Link2}>
          <div className="space-y-3">
            {connectedAccounts.map((account) => {
              const ProviderIcon = getProviderIcon(account.provider);
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <ProviderIcon className="h-4 w-4 text-white/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{account.provider}</p>
                      <p className="text-xs text-white/30">{account.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/20">
                      Connected {new Date(account.connectedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDisconnectAccount(account.id)}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                      title="Disconnect"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Google */}
            {!connectedAccounts.some((a) => a.provider === 'Google') && (
              <button
                onClick={handleConnectGoogle}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/[0.08] px-4 py-3
                           text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition-all duration-200 group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:border-red-500/20">
                  <Chrome className="h-4 w-4 text-white/30 group-hover:text-red-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors">
                    Connect Google Account
                  </p>
                  <p className="text-xs text-white/20">Sign in faster with Google</p>
                </div>
              </button>
            )}

            {/* Add social placeholder */}
            <button
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/[0.08] px-4 py-3
                         text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition-all duration-200 group"
              onClick={() => toast.info('Social account connections coming soon')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:border-red-500/20">
                <Link2 className="h-4 w-4 text-white/30 group-hover:text-red-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors">
                  Connect Social Account
                </p>
                <p className="text-xs text-white/20">Facebook, X, LinkedIn, and more</p>
              </div>
            </button>
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/*  SECTION 7: Active Sessions                                  */}
        {/* ============================================================ */}
        <SectionCard title="Active Sessions" description="Manage devices signed into your account" icon={Monitor}>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  session.current
                    ? 'border-red-500/20 bg-red-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    {session.device.toLowerCase().includes('iphone') ||
                    session.device.toLowerCase().includes('android') ? (
                      <Smartphone className="h-4 w-4 text-white/50" />
                    ) : (
                      <Monitor className="h-4 w-4 text-white/50" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white/80">{session.device}</p>
                      {session.current && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30">
                      {session.browser} &middot; {session.location} &middot; {session.ip}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/20">{formatTimeAgo(session.lastActive)}</span>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/40
                                 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                    >
                      <LogOut className="h-3 w-3" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}

            {sessions.length > 1 && (
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const otherSessions = sessions.filter((s) => !s.current);
                    otherSessions.forEach((s) => handleRevokeSession(s.id));
                  }}
                >
                  Revoke All Other Sessions
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

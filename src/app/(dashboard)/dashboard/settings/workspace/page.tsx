'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Button, Input, Select, Card, CardContent, PageHeader, Skeleton } from '@memelli/ui';
import type { SelectOption } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  settings?: {
    timezone?: string;
  };
}

interface TenantResponse {
  success: boolean;
  data: Tenant;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIMEZONES: SelectOption[] = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
].map((tz) => ({ value: tz, label: tz }));

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WorkspaceSettingsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Form state */
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [formLoaded, setFormLoaded] = useState(false);

  /* ---- Fetch current workspace ----------------------------------- */
  const { data: tenantData, isLoading } = useQuery<TenantResponse>({
    queryKey: ['tenant-me'],
    queryFn: async () => {
      const res = await api.get<TenantResponse>('/api/tenants/me');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load workspace');
      return res.data;
    },
  });

  useEffect(() => {
    if (tenantData && !formLoaded) {
      const t = tenantData.data ?? (tenantData as unknown as Tenant);
      setName(t.name ?? '');
      setDomain(t.domain ?? '');
      setLogoUrl(t.logoUrl ?? '');
      setTimezone(t.settings?.timezone ?? 'UTC');
      setFormLoaded(true);
    }
  }, [tenantData, formLoaded]);

  /* ---- Logo upload ----------------------------------------------- */
  const [uploading, setUploading] = useState(false);

  async function handleLogoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.upload<{ url: string }>('/api/uploads/logo', fd);
    setUploading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.data?.url) {
      setLogoUrl(res.data.url);
      toast.success('Logo uploaded');
    }
  }

  function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleLogoFile(file);
  }

  /* ---- Save mutation --------------------------------------------- */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/api/tenants/me', {
        name,
        domain: domain || undefined,
        logoUrl: logoUrl || undefined,
        settings: { timezone },
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Workspace settings saved');
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save workspace settings'),
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  /* ---- Loading skeleton ------------------------------------------ */
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-xl" />
        <div className="space-y-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const tenant = tenantData?.data ?? (tenantData as unknown as Tenant);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Workspace"
        subtitle="Manage your workspace identity and preferences."
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Workspace' },
        ]}
      />

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {/* ---- Identity card ---- */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-6">
            <h2 className="text-base font-semibold tracking-tight text-white/90 mb-1">Identity</h2>
            <p className="text-xs text-white/30 mb-5">
              How your workspace appears to team members and clients.
            </p>

            <div className="space-y-5">
              {/* Workspace name */}
              <Input
                label="Workspace Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                required
              />

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Logo
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Workspace logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Upload className="h-5 w-5 text-white/20" />
                    )}
                  </div>

                  {/* Drop zone */}
                  <div
                    onDrop={handleLogoDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/[0.08] hover:border-primary/40 bg-card py-4 cursor-pointer transition-all duration-200"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogoFile(f);
                      }}
                    />
                    <p className="text-xs text-white/40">
                      {uploading ? 'Uploading...' : 'Click or drag to upload'}
                    </p>
                    <p className="text-[10px] text-white/20">PNG, JPG, SVG -- max 2 MB</p>
                  </div>

                  {/* Remove */}
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="p-1.5 rounded-xl text-white/30 hover:text-primary hover:bg-white/[0.04] transition-all duration-200"
                      title="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Custom domain */}
              <Input
                label="Custom Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
              />
            </div>
          </div>
        </div>

        {/* ---- Preferences card ---- */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-6">
            <h2 className="text-base font-semibold tracking-tight text-white/90 mb-1">Preferences</h2>
            <p className="text-xs text-white/30 mb-5">
              Regional settings applied across your workspace.
            </p>

            <Select
              label="Timezone"
              options={TIMEZONES}
              value={timezone}
              onChange={(v) => setTimezone(v)}
              searchable
            />
          </div>
        </div>

        {/* ---- Save button ---- */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* ---- Danger zone ---- */}
      <div className="mt-10">
        <div className="rounded-2xl border border-primary/15 bg-card backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          <div className="p-6">
            <h2 className="text-base font-semibold text-primary/80 mb-1 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </h2>
            <p className="text-xs text-white/30 mb-4">
              Irreversible actions. Proceed with extreme caution.
            </p>
            <div className="bg-primary/[0.05] border border-primary/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white/85">Delete Workspace</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    Permanently delete this workspace and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  onClick={() => toast.info('Contact support@memelli.com to delete your workspace')}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace ID */}
      {tenant?.id && (
        <p className="text-xs text-white/15 mt-6">Workspace ID: {tenant.id}</p>
      )}
    </div>
  );
}

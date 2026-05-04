'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Palette,
  Type,
  Globe,
  Eye,
  Save,
  Image,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface BrandingConfig {
  logoUrl?: string;
  orgName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  welcomeMessage: string;
  portalTitle: string;
  brandingMode: 'co-branded' | 'custom-domain';
  subdomain: string;
  customDomain: string;
}

const defaultBranding: BrandingConfig = {
  orgName: '',
  primaryColor: '#ef4444',
  secondaryColor: '#3b82f6',
  accentColor: '#f59e0b',
  fontFamily: 'Inter',
  welcomeMessage: 'Welcome to your partner portal.',
  portalTitle: 'Partner Portal',
  brandingMode: 'co-branded',
  subdomain: '',
  customDomain: '',
};

const fontOptions = [
  'Inter',
  'Poppins',
  'DM Sans',
  'Manrope',
  'Plus Jakarta Sans',
  'Space Grotesk',
  'Outfit',
];

/* ------------------------------------------------------------------ */
/*  Color Picker                                                        */
/* ------------------------------------------------------------------ */

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-xl border border-white/[0.06] bg-transparent"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-white/70 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProBrandingPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BrandingConfig>(defaultBranding);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch current branding
  const { data: branding, isLoading } = useQuery<BrandingConfig>({
    queryKey: ['pro-branding'],
    queryFn: async () => {
      const res = await api.get<BrandingConfig>('/api/pro/branding');
      if (res.error || !res.data) return defaultBranding;
      return res.data;
    },
    staleTime: 120_000,
  });

  useEffect(() => {
    if (branding) {
      setForm(branding);
      if (branding.logoUrl) setLogoPreview(branding.logoUrl);
    }
  }, [branding]);

  // Save branding
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadRes = await api.upload<{ url: string }>('/api/pro/branding/logo', formData);
        if (uploadRes.error) throw new Error(uploadRes.error);
        if (uploadRes.data) form.logoUrl = uploadRes.data.url;
      }
      const res = await api.patch('/api/pro/branding', form);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Branding saved');
      queryClient.invalidateQueries({ queryKey: ['pro-branding'] });
      queryClient.invalidateQueries({ queryKey: ['pro-profile'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save branding'),
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function update<K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-white/[0.03]" />
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Branding</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Customize your partner portal appearance.</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Configuration column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Logo */}
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Logo</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.08] bg-zinc-900/60">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-white/20" />
                )}
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.06]">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="mt-1.5 text-[10px] text-white/20">PNG, JPG, or SVG. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Colors</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ColorPicker label="Primary" value={form.primaryColor} onChange={(v) => update('primaryColor', v)} />
              <ColorPicker label="Secondary" value={form.secondaryColor} onChange={(v) => update('secondaryColor', v)} />
              <ColorPicker label="Accent" value={form.accentColor} onChange={(v) => update('accentColor', v)} />
            </div>
          </div>

          {/* Typography + Content */}
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Typography &amp; Content</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Font Family</label>
                <select
                  value={form.fontFamily}
                  onChange={(e) => update('fontFamily', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {fontOptions.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Portal Title</label>
                <input
                  type="text"
                  value={form.portalTitle}
                  onChange={(e) => update('portalTitle', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Organization Name</label>
                <input
                  type="text"
                  value={form.orgName}
                  onChange={(e) => update('orgName', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Welcome Message</label>
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => update('welcomeMessage', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Domain */}
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Domain Configuration</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">Branding Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => update('brandingMode', 'co-branded')}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                      form.brandingMode === 'co-branded'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:text-white/60'
                    }`}
                  >
                    Co-Branded
                  </button>
                  <button
                    onClick={() => update('brandingMode', 'custom-domain')}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                      form.brandingMode === 'custom-domain'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:text-white/60'
                    }`}
                  >
                    Custom Domain
                  </button>
                </div>
              </div>
              {form.brandingMode === 'co-branded' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Subdomain</label>
                  <div className="flex items-center gap-0">
                    <input
                      type="text"
                      value={form.subdomain}
                      onChange={(e) => update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="your-brand"
                      className="flex-1 rounded-l-xl border border-r-0 border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="rounded-r-xl border border-white/[0.06] bg-zinc-900/60 px-3 py-2.5 text-sm text-white/25">
                      .memelli.com
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Custom Domain</label>
                  <input
                    type="text"
                    value={form.customDomain}
                    onChange={(e) => update('customDomain', e.target.value)}
                    placeholder="portal.yourbrand.com"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1.5 text-[10px] text-white/20">
                    Point your CNAME record to pro.memelli.com
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live preview column */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Live Preview</h3>
            </div>
            <div className="p-4">
              {/* Mini portal header preview */}
              <div
                className="rounded-xl border border-white/[0.06] bg-black/40 p-4 backdrop-blur-xl"
                style={{ fontFamily: form.fontFamily }}
              >
                <div className="flex items-center gap-3 border-b border-white/[0.04] pb-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-8 w-8 rounded-xl object-cover" />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      {(form.orgName || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-zinc-100">{form.portalTitle || 'Portal Title'}</p>
                    <p className="text-[10px] text-white/30">{form.orgName || 'Organization'}</p>
                  </div>
                </div>

                {/* Nav preview */}
                <div className="mt-3 space-y-1">
                  {['Dashboard', 'Clients', 'Pipeline'].map((item, i) => (
                    <div
                      key={item}
                      className="rounded-lg px-3 py-1.5 text-xs"
                      style={
                        i === 0
                          ? { backgroundColor: `${form.primaryColor}18`, color: form.primaryColor }
                          : { color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {/* Accent buttons preview */}
                <div className="mt-4 flex gap-2">
                  <div
                    className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: form.secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div
                    className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: form.accentColor }}
                  >
                    Accent
                  </div>
                </div>

                {/* Welcome message */}
                <p className="mt-4 text-[10px] text-zinc-400">
                  {form.welcomeMessage || 'Welcome message preview'}
                </p>

                {/* Footer */}
                <p className="mt-3 border-t border-white/[0.04] pt-2 text-center text-[8px] text-white/15">
                  Powered by Memelli Universe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

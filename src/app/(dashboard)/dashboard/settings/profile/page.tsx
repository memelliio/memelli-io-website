'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import { Button, Input, PageHeader, Skeleton } from '@memelli/ui';
import { Camera, User } from 'lucide-react';

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
  role: string;
  status: string;
  createdAt: string;
  tenantId: string;
  tenantRole: string | null;
  tenant: { id: string; name: string; slug: string } | null;
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfileSettingsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Form state ----
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formSeeded, setFormSeeded] = useState(false);

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

  // Seed the form once data arrives
  useEffect(() => {
    if (!me?.data || formSeeded) return;
    const d = me.data;
    setFirstName(d.firstName ?? '');
    setLastName(d.lastName ?? '');
    setEmail(d.email ?? '');
    setPhone(d.phone ?? '');
    setAvatarUrl(d.avatarUrl ?? null);
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
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ---- Save profile ----
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | undefined> = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  // ---- Initials helper ----
  const initials =
    (firstName?.[0] ?? '').toUpperCase() + (lastName?.[0] ?? '').toUpperCase() || email?.[0]?.toUpperCase() || 'U';

  /* ---------------------------------------------------------------- */
  /*  Loading skeleton                                                 */
  /* ---------------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        <Skeleton height={28} width="40%" />
        <Skeleton height={14} width="60%" />

        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 space-y-6">
          {/* Avatar skeleton */}
          <div className="flex items-center gap-5">
            <Skeleton variant="circle" width={80} height={80} />
            <div className="flex-1 space-y-2">
              <Skeleton height={14} width="30%" />
              <Skeleton height={36} width="50%" />
            </div>
          </div>

          {/* Field skeletons */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton height={14} width="40%" />
              <Skeleton height={40} />
            </div>
            <div className="space-y-2">
              <Skeleton height={14} width="40%" />
              <Skeleton height={40} />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton height={14} width="20%" />
            <Skeleton height={40} />
          </div>

          <div className="space-y-2">
            <Skeleton height={14} width="20%" />
            <Skeleton height={40} />
          </div>

          <Skeleton height={40} width={140} />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
  /* ---------------------------------------------------------------- */
  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <PageHeader title="Profile" subtitle="Manage your personal information." />
        <div className="mt-8 rounded-2xl border border-primary/20 bg-card backdrop-blur-xl p-6 text-center">
          <p className="text-sm text-primary">
            Unable to load your profile. Please try refreshing the page.
          </p>
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader
        title="Profile"
        subtitle="Manage your personal information."
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Profile' },
        ]}
      />

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 space-y-6 shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
          {/* -------- Avatar -------- */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative h-20 w-20 shrink-0 rounded-full border-2 border-white/[0.08] bg-white/[0.04] overflow-hidden
                         transition-all duration-200 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Change avatar"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/30">
                  {initials}
                </span>
              )}
              {/* Overlay */}
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
              <p className="mt-0.5 text-xs text-white/30">
                Click the avatar to upload. JPG, PNG, or WebP up to 5 MB.
              </p>
            </div>
          </div>

          {/* -------- Name fields -------- */}
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

          {/* -------- Email (read-only) -------- */}
          <Input
            label="Email"
            type="email"
            value={email}
            readOnly
            disabled
            hint="Email cannot be changed. Contact support if you need to update it."
          />

          {/* -------- Phone -------- */}
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          {/* -------- Submit -------- */}
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
        </div>
      </form>
    </div>
  );
}

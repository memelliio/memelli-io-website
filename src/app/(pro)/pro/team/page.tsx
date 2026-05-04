'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Mail,
  Trash2,
  Clock,
  Shield,
  Crown,
  BarChart3,
  Megaphone,
  Users,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Operator' | 'Marketing' | 'Analyst';
  joinedAt: string;
  lastActive?: string;
  avatarUrl?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  sentAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const roles = ['Owner', 'Operator', 'Marketing', 'Analyst'] as const;

const roleIcons: Record<string, React.ComponentType<any>> = {
  Owner: Crown,
  Operator: Shield,
  Marketing: Megaphone,
  Analyst: BarChart3,
};

const roleBadgeColors: Record<string, string> = {
  Owner: 'bg-red-500/10 text-red-400',
  Operator: 'bg-blue-500/10 text-blue-400',
  Marketing: 'bg-amber-500/10 text-amber-400',
  Analyst: 'bg-emerald-500/10 text-emerald-400',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProTeamPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('Operator');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch team
  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['pro-team'],
    queryFn: async () => {
      const res = await api.get<TeamMember[]>('/api/pro/team');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Fetch pending invites
  const { data: invites } = useQuery<PendingInvite[]>({
    queryKey: ['pro-team-invites'],
    queryFn: async () => {
      const res = await api.get<PendingInvite[]>('/api/pro/team/invites');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await api.post('/api/pro/team/invite', { email, role });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invite sent');
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['pro-team-invites'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invite'),
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.patch(`/api/pro/team/${memberId}`, { role });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['pro-team'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.del(`/api/pro/team/${memberId}`);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Member removed');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['pro-team'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const team = members ?? [];
  const pendingInvites = invites ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">Team</h1>
        <p className="mt-1 text-sm text-white/40">Manage your team members and their access levels.</p>
      </div>

      {/* Invite form */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-white/90">Invite Team Member</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-red-500/50"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 outline-none transition-colors focus:border-red-500/50"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
            disabled={!inviteEmail || inviteMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-red-500/20 transition-all duration-200 hover:bg-red-500 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>

      {/* Team members */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
          <Users className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold tracking-tight text-white/90">Team Members</h3>
          <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/30">
            {team.length}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex h-16 animate-pulse border-b border-white/[0.04] bg-white/[0.02]" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Users className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/30">No team members yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {team.map((member) => {
              const RoleIcon = roleIcons[member.role] ?? Shield;
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/60">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/70">{member.name}</p>
                    <p className="truncate text-xs text-white/30">{member.email}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`hidden items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold sm:inline-flex ${roleBadgeColors[member.role] ?? 'bg-white/[0.04] text-white/40'}`}>
                    <RoleIcon className="h-3 w-3" />
                    {member.role}
                  </span>

                  {/* Joined */}
                  <div className="hidden text-right lg:block">
                    <p className="text-[10px] text-white/20">Joined</p>
                    <p className="text-xs text-white/40">{formatDate(member.joinedAt)}</p>
                  </div>

                  {/* Last active */}
                  <div className="hidden text-right md:block">
                    <p className="text-[10px] text-white/20">Last active</p>
                    <p className="text-xs text-white/40">{timeAgo(member.lastActive)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => changeRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] text-white/50 outline-none transition-colors focus:border-red-500/50"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    {member.role !== 'Owner' && (
                      <>
                        {confirmDelete === member.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => removeMutation.mutate(member.id)}
                              className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-medium text-white"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-white/50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(member.id)}
                            className="rounded-lg p-1 text-white/15 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold tracking-tight text-white/90">Pending Invites</h3>
            <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {pendingInvites.length}
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <Mail className="h-4 w-4 shrink-0 text-white/15" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/60">{inv.email}</p>
                </div>
                <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/40">{inv.role}</span>
                <span className="text-xs text-white/25">Sent {formatDate(inv.sentAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

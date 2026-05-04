'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, ArrowLeft, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApi } from '../../../../../hooks/useApi';
import {
  Button,
  Badge,
  Modal,
  Input,
  Select,
  DataTable,
  Skeleton,
  Card,
  CardContent,
  SlidePanel,
  ConfirmDialog,
} from '@memelli/ui';
import type { DataTableColumn, SelectOption } from '@memelli/ui';

interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  tenantRole?: string;
  status: string;
  createdAt: string;
}

interface MembersResponse {
  success: boolean;
  data: TeamMember[];
}

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'ADMIN', label: 'Admin -- Full access' },
  { value: 'MEMBER', label: 'Member -- Standard access' },
  { value: 'VIEWER', label: 'Viewer -- Read only' },
];

const roleBadgeVariant: Record<string, 'primary' | 'info' | 'default'> = {
  ADMIN: 'primary',
  MEMBER: 'info',
  VIEWER: 'default',
};

const statusBadgeVariant: Record<string, 'success' | 'error' | 'default'> = {
  ACTIVE: 'success',
  SUSPENDED: 'error',
  DEACTIVATED: 'default',
};

export default function TeamSettingsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  // Member detail panel
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editRole, setEditRole] = useState('');

  // Confirm delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const { data: membersData, isLoading } = useQuery<MembersResponse>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await api.get<MembersResponse>('/api/users');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load team');
      return res.data;
    },
  });

  const members: TeamMember[] = (() => {
    if (!membersData) return [];
    const d: any = membersData.data ?? membersData;
    return Array.isArray(d) ? d : d.items ?? d.users ?? [];
  })();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/users/invite', { email: inviteEmail, role: inviteRole });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invite sent!');
      setInviteEmail('');
      setInviteRole('MEMBER');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invite'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.patch(`/api/users/${userId}`, { role });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update role'),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.del(`/api/users/${userId}`);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Member removed');
      setPanelOpen(false);
      setSelectedMember(null);
      setShowDeleteConfirm(false);
      setDeletingMember(null);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to remove member'),
  });

  function handleRowClick(member: TeamMember) {
    setSelectedMember(member);
    setEditRole(member.tenantRole ?? member.role);
    setPanelOpen(true);
  }

  function handleConfirmDelete(member: TeamMember) {
    setDeletingMember(member);
    setShowDeleteConfirm(true);
  }

  const columns: DataTableColumn<TeamMember>[] = [
    {
      header: 'Member',
      accessor: 'firstName',
      render: (row) => {
        const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ') || null;
        const initials = fullName
          ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
          : row.email[0].toUpperCase();
        return (
          <button
            onClick={() => handleRowClick(row)}
            className="flex items-center gap-3 text-left group w-full"
          >
            <div className="h-8 w-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-white/50 overflow-hidden shrink-0">
              {row.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.avatarUrl} alt={initials} className="h-full w-full object-cover" />
              ) : initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/85 truncate group-hover:text-primary transition-colors duration-200">{fullName ?? row.email}</p>
              {fullName && <p className="text-xs text-white/30 truncate">{row.email}</p>}
            </div>
          </button>
        );
      },
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => {
        const role = row.tenantRole ?? row.role;
        return <Badge variant={roleBadgeVariant[role] ?? 'default'}>{role}</Badge>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={statusBadgeVariant[row.status] ?? 'default'}>{row.status}</Badge>
      ),
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-white/30">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--'}
        </span>
      ),
    },
    {
      header: '',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          {row.status !== 'SUSPENDED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmDelete(row);
              }}
              title="Remove member"
              className="p-1.5 text-white/20 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
            >
              <UserMinus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="p-1.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Team</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setShowInvite(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        pageSize={15}
      />

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={inviteRole}
            onChange={(v) => setInviteRole(v)}
          />
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInvite(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending} className="flex-1">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Member Detail SlidePanel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedMember(null);
        }}
        title="Member Details"
        width="md"
      >
        {selectedMember && (
          <div className="space-y-6">
            {/* Member Info */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                {selectedMember.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedMember.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white/30 uppercase">
                    {(selectedMember.firstName?.[0] ?? selectedMember.email[0])}
                  </span>
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-white/90">
                  {[selectedMember.firstName, selectedMember.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                </p>
                <p className="text-sm text-white/40">{selectedMember.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={roleBadgeVariant[selectedMember.tenantRole ?? selectedMember.role] ?? 'default'}>
                    {selectedMember.tenantRole ?? selectedMember.role}
                  </Badge>
                  <Badge variant={statusBadgeVariant[selectedMember.status] ?? 'default'}>
                    {selectedMember.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Change Role */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-white/85 mb-3">Change Role</h3>
                <Select
                  options={ROLE_OPTIONS}
                  value={editRole}
                  onChange={(v) => setEditRole(v)}
                />
                <Button
                  size="sm"
                  className="mt-3"
                  isLoading={updateRoleMutation.isPending}
                  disabled={editRole === (selectedMember.tenantRole ?? selectedMember.role)}
                  onClick={() =>
                    updateRoleMutation.mutate({
                      userId: selectedMember.id,
                      role: editRole,
                    })
                  }
                >
                  Update Role
                </Button>
              </CardContent>
            </Card>

            {/* Meta */}
            <div className="space-y-2 text-xs text-white/30">
              <p>User ID: <span className="font-mono text-white/50">{selectedMember.id}</span></p>
              {selectedMember.createdAt && (
                <p>Joined: {new Date(selectedMember.createdAt).toLocaleDateString()}</p>
              )}
            </div>

            {/* Remove */}
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<UserMinus className="h-3.5 w-3.5" />}
              onClick={() => handleConfirmDelete(selectedMember)}
            >
              Remove from Workspace
            </Button>
          </div>
        )}
      </SlidePanel>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingMember(null);
        }}
        onConfirm={() => {
          if (deletingMember) removeMutation.mutate(deletingMember.id);
        }}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${deletingMember?.email ?? 'this member'} from the workspace? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Remove"
        loading={removeMutation.isPending}
      />
    </div>
  );
}

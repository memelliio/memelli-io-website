'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  ArrowLeft,
  UserMinus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Check,
  X,
  Search,
  Users,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  Mail,
  KeyRound,
  Ban,
  CheckCircle2,
  Building2,
  BarChart3,
  History,
  PieChart,
} from 'lucide-react';
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  tenantRole?: string;
  status: string;
  lastActiveAt?: string;
  createdAt: string;
  department?: string;
}

interface MembersResponse {
  success: boolean;
  data: TeamMember[];
}

interface ActivityEntry {
  id: string;
  action: string;
  target?: string;
  timestamp: string;
  ip?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'ADMIN', label: 'Admin -- Full system access' },
  { value: 'MANAGER', label: 'Manager -- Department lead' },
  { value: 'AGENT', label: 'Agent -- Standard operator' },
  { value: 'VIEWER', label: 'Viewer -- Read only' },
];

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'SALES', label: 'Sales' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'HR', label: 'Human Resources' },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <ShieldCheck className="h-3.5 w-3.5 text-red-400" />,
  MANAGER: <Shield className="h-3.5 w-3.5 text-amber-400" />,
  AGENT: <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />,
  VIEWER: <Eye className="h-3.5 w-3.5 text-white/40" />,
};

const roleBadgeVariant: Record<string, 'primary' | 'info' | 'warning' | 'default'> = {
  ADMIN: 'primary',
  MANAGER: 'warning',
  AGENT: 'info',
  VIEWER: 'default',
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  SUSPENDED: 'error',
  DEACTIVATED: 'default',
};

/* ------------------------------------------------------------------ */
/*  Permissions Matrix Data                                            */
/* ------------------------------------------------------------------ */

interface PermissionRow {
  module: string;
  admin: boolean;
  manager: boolean;
  agent: boolean;
  viewer: boolean;
}

const PERMISSIONS_MATRIX: PermissionRow[] = [
  { module: 'CRM',                admin: true,  manager: true,  agent: true,  viewer: true  },
  { module: 'Commerce',           admin: true,  manager: true,  agent: true,  viewer: true  },
  { module: 'SEO & Content',      admin: true,  manager: true,  agent: false, viewer: false },
  { module: 'Coaching',           admin: true,  manager: true,  agent: true,  viewer: false },
  { module: 'Workflows',          admin: true,  manager: true,  agent: false, viewer: false },
  { module: 'AI Agents',          admin: true,  manager: false, agent: false, viewer: false },
  { module: 'Settings',           admin: true,  manager: false, agent: false, viewer: false },
  { module: 'Billing',            admin: true,  manager: false, agent: false, viewer: false },
  { module: 'Team Management',    admin: true,  manager: true,  agent: false, viewer: false },
  { module: 'Analytics',          admin: true,  manager: true,  agent: true,  viewer: true  },
  { module: 'Integrations',       admin: true,  manager: true,  agent: false, viewer: false },
  { module: 'Dev Terminal',       admin: true,  manager: false, agent: false, viewer: false },
];

/* ------------------------------------------------------------------ */
/*  Mock Activity Data                                                 */
/* ------------------------------------------------------------------ */

function generateMockActivity(memberId: string): ActivityEntry[] {
  const actions = [
    'Logged in',
    'Updated contact record',
    'Created new deal',
    'Sent email campaign',
    'Generated SEO report',
    'Modified workflow',
    'Viewed analytics dashboard',
    'Exported data',
    'Updated profile settings',
    'Assigned task',
  ];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `${memberId}-act-${i}`,
    action: actions[i % actions.length],
    target: i % 3 === 0 ? 'CRM Module' : i % 3 === 1 ? 'Commerce' : undefined,
    timestamp: new Date(Date.now() - i * 3600000 * (i + 1)).toISOString(),
    ip: '192.168.1.' + (100 + i),
  }));
}

/* ------------------------------------------------------------------ */
/*  Pie Chart Component (pure SVG)                                     */
/* ------------------------------------------------------------------ */

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

function MiniPieChart({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const paths = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const startAngle = (cumulative / total) * 360;
      cumulative += slice.value;
      const endAngle = (cumulative / total) * 360;
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      if (slices.filter((s) => s.value > 0).length === 1) {
        return (
          <circle key={slice.label} cx="50" cy="50" r="40" fill={slice.color} />
        );
      }

      return (
        <path
          key={slice.label}
          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={slice.color}
        />
      );
    });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0">
        {paths}
        <circle cx="50" cy="50" r="22" fill="rgb(15, 15, 15)" />
        <text x="50" y="54" textAnchor="middle" className="text-[11px] font-bold fill-white/80">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices
          .filter((s) => s.value > 0)
          .map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-white/50">
                {s.label}: <span className="text-white/80 font-medium">{s.value}</span>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type TabId = 'roster' | 'permissions' | 'stats';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'roster', label: 'Team Roster', icon: <Users className="h-4 w-4" /> },
  { id: 'permissions', label: 'Role Permissions', icon: <Shield className="h-4 w-4" /> },
  { id: 'stats', label: 'Team Stats', icon: <BarChart3 className="h-4 w-4" /> },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function TeamManagementPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');

  // Member detail panel
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Confirm actions
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendingMember, setSuspendingMember] = useState<TeamMember | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Queries                                                          */
  /* ---------------------------------------------------------------- */

  const { data: membersData, isLoading } = useQuery<MembersResponse>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await api.get<MembersResponse>('/api/users');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load team');
      return res.data;
    },
  });

  const members: TeamMember[] = useMemo(() => {
    if (!membersData) return [];
    const d: any = membersData.data ?? membersData;
    return Array.isArray(d) ? d : d.items ?? d.users ?? [];
  }, [membersData]);

  /* ---------------------------------------------------------------- */
  /*  Filtered + Searched members                                      */
  /* ---------------------------------------------------------------- */

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.firstName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.lastName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = filterRole === 'ALL' || (m.tenantRole ?? m.role) === filterRole;
      const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [members, searchQuery, filterRole, filterStatus]);

  /* ---------------------------------------------------------------- */
  /*  Stats                                                            */
  /* ---------------------------------------------------------------- */

  const stats = useMemo(() => {
    const roleBreakdown: Record<string, number> = {};
    let activeToday = 0;
    const now = Date.now();
    for (const m of members) {
      const role = m.tenantRole ?? m.role;
      roleBreakdown[role] = (roleBreakdown[role] ?? 0) + 1;
      if (m.lastActiveAt && now - new Date(m.lastActiveAt).getTime() < 86400000) {
        activeToday++;
      }
    }
    // If no lastActiveAt data, estimate from active status
    if (activeToday === 0) {
      activeToday = members.filter((m) => m.status === 'ACTIVE').length;
    }
    return { total: members.length, activeToday, roleBreakdown };
  }, [members]);

  const pieSlices: PieSlice[] = [
    { label: 'Admin', value: stats.roleBreakdown['ADMIN'] ?? stats.roleBreakdown['SUPER_ADMIN'] ?? 0, color: '#ef4444' },
    { label: 'Manager', value: stats.roleBreakdown['MANAGER'] ?? 0, color: '#f59e0b' },
    { label: 'Agent', value: stats.roleBreakdown['AGENT'] ?? stats.roleBreakdown['MEMBER'] ?? 0, color: '#3b82f6' },
    { label: 'Viewer', value: stats.roleBreakdown['VIEWER'] ?? 0, color: '#6b7280' },
  ];

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/users/invite', { email: inviteEmail, role: inviteRole });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invite sent!');
      setInviteEmail('');
      setInviteRole('AGENT');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to send invite'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, department }: { userId: string; role: string; department?: string }) => {
      const res = await api.patch(`/api/users/${userId}`, { role, department });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Member updated');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update member'),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'suspend' | 'activate' }) => {
      const res = await api.patch(`/api/users/${userId}`, {
        status: action === 'suspend' ? 'SUSPENDED' : 'ACTIVE',
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.action === 'suspend' ? 'Member suspended' : 'Member activated');
      setShowSuspendConfirm(false);
      setSuspendingMember(null);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Action failed'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/api/users/${userId}/reset-password`, {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => toast.success('Password reset email sent'),
    onError: (err: Error) => toast.error(err.message || 'Failed to send reset email'),
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

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  function handleRowClick(member: TeamMember) {
    setSelectedMember(member);
    setEditRole(member.tenantRole ?? member.role);
    setEditDepartment(member.department ?? '');
    setShowActivityLog(false);
    setPanelOpen(true);
  }

  function handleConfirmDelete(member: TeamMember) {
    setDeletingMember(member);
    setShowDeleteConfirm(true);
  }

  function handleSuspendToggle(member: TeamMember) {
    setSuspendingMember(member);
    setShowSuspendConfirm(true);
  }

  function formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  /* ---------------------------------------------------------------- */
  /*  Table Columns                                                    */
  /* ---------------------------------------------------------------- */

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
            <div className="h-9 w-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-white/50 overflow-hidden shrink-0">
              {row.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.avatarUrl} alt={initials} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/85 truncate group-hover:text-red-400 transition-colors duration-200">
                {fullName ?? row.email}
              </p>
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
        return (
          <div className="flex items-center gap-1.5">
            {ROLE_ICONS[role] ?? ROLE_ICONS['VIEWER']}
            <Badge variant={roleBadgeVariant[role] ?? 'default'}>{role}</Badge>
          </div>
        );
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
      header: 'Department',
      accessor: 'department' as any,
      render: (row) => (
        <span className="text-xs text-white/40">{row.department ?? '--'}</span>
      ),
    },
    {
      header: 'Last Active',
      accessor: 'createdAt',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-white/20" />
          <span className="text-xs text-white/30">{formatRelativeTime(row.lastActiveAt ?? row.createdAt)}</span>
        </div>
      ),
    },
    {
      header: '',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSuspendToggle(row);
            }}
            title={row.status === 'SUSPENDED' ? 'Activate member' : 'Suspend member'}
            className="p-1.5 text-white/20 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
          >
            {row.status === 'SUSPENDED' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Ban className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmDelete(row);
            }}
            title="Remove member"
            className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  /* ---------------------------------------------------------------- */
  /*  Loading State                                                    */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="p-1.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Team Management</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''} across your workspace
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
              <Users className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-semibold text-white/90">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider">Active Today</p>
              <p className="text-2xl font-semibold text-white/90">{stats.activeToday}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <PieChart className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider">Roles</p>
              <p className="text-sm text-white/60">
                {Object.entries(stats.roleBreakdown)
                  .map(([r, c]) => `${c} ${r.toLowerCase()}${c !== 1 ? 's' : ''}`)
                  .join(', ') || 'No data'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.04] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'text-red-400 border-red-500'
                : 'text-white/40 border-transparent hover:text-white/60 hover:border-white/10'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Team Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 focus:outline-none focus:border-red-500/30 appearance-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="AGENT">Agent</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 focus:outline-none focus:border-red-500/30 appearance-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            data={filteredMembers}
            isLoading={isLoading}
            rowKey={(row) => row.id}
            pageSize={15}
          />

          {filteredMembers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No members match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Role Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold text-white/85">Role Permissions Matrix</h3>
            <p className="text-xs text-white/30 mt-1">What each role can access across the platform</p>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 pr-4 text-sm font-medium text-white/40 min-w-[180px]">Module</th>
                    {['Admin', 'Manager', 'Agent', 'Viewer'].map((role) => (
                      <th key={role} className="pb-3 px-4 text-sm font-medium text-center min-w-[100px]">
                        <div className="flex items-center justify-center gap-1.5">
                          {ROLE_ICONS[role.toUpperCase()]}
                          <span className="text-white/50">{role}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS_MATRIX.map((row) => (
                    <tr key={row.module} className="border-b border-white/[0.03] last:border-0">
                      <td className="py-3 pr-4 text-sm text-white/60">{row.module}</td>
                      {(['admin', 'manager', 'agent', 'viewer'] as const).map((role) => (
                        <td key={role} className="py-3 px-4 text-center">
                          {row[role] ? (
                            <Check className="h-4 w-4 text-red-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-white/10 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Team Stats */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles Breakdown Pie */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold text-white/85 mb-4">Roles Breakdown</h3>
            <MiniPieChart slices={pieSlices} />
          </div>

          {/* Status Breakdown */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold text-white/85 mb-4">Status Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Active', count: members.filter((m) => m.status === 'ACTIVE').length, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                { label: 'Invited', count: members.filter((m) => m.status === 'INVITED').length, color: 'bg-amber-500', textColor: 'text-amber-400' },
                { label: 'Suspended', count: members.filter((m) => m.status === 'SUSPENDED').length, color: 'bg-red-500', textColor: 'text-red-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-white/50">{item.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${item.textColor}`}>{item.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.04]">
              <h4 className="text-xs text-white/30 uppercase tracking-wider mb-3">Department Distribution</h4>
              <div className="space-y-2">
                {DEPARTMENT_OPTIONS.map((dept) => {
                  const count = members.filter((m) => m.department === dept.value).length;
                  const pct = members.length > 0 ? (count / members.length) * 100 : 0;
                  return (
                    <div key={dept.value}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/40">{dept.label}</span>
                        <span className="text-xs text-white/30">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white/85 mb-4">Recent Team Activity</h3>
            <div className="space-y-3">
              {members.slice(0, 5).map((m) => {
                const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0"
                  >
                    <div className="h-7 w-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-white/50 shrink-0">
                      {m.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        (m.firstName?.[0] ?? m.email[0]).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 truncate">
                        <span className="font-medium text-white/80">{fullName}</span>
                        {' was last active '}
                        {formatRelativeTime(m.lastActiveAt ?? m.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant[m.status] ?? 'default'} className="shrink-0">
                      {m.status}
                    </Badge>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-xs text-white/30 text-center py-4">No team activity yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
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
            placeholder="colleague@company.com"
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
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
            <p className="text-xs text-white/30 mb-2">Role permissions preview:</p>
            <div className="flex flex-wrap gap-1.5">
              {PERMISSIONS_MATRIX.filter(
                (p) => p[inviteRole.toLowerCase() as keyof PermissionRow] === true
              ).map((p) => (
                <span
                  key={p.module}
                  className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-medium"
                >
                  {p.module}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowInvite(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={inviteMutation.isPending}
              className="flex-1"
              leftIcon={<Mail className="h-3.5 w-3.5" />}
            >
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
            {/* Member Info Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                {selectedMember.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedMember.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white/30 uppercase">
                    {selectedMember.firstName?.[0] ?? selectedMember.email[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-white/90">
                  {[selectedMember.firstName, selectedMember.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                </p>
                <p className="text-sm text-white/40">{selectedMember.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={roleBadgeVariant[selectedMember.tenantRole ?? selectedMember.role] ?? 'default'}>
                    {selectedMember.tenantRole ?? selectedMember.role}
                  </Badge>
                  <Badge variant={statusBadgeVariant[selectedMember.status] ?? 'default'}>
                    {selectedMember.status}
                  </Badge>
                  {selectedMember.department && (
                    <Badge variant="default">{selectedMember.department}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Change Role */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-white/85 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  Change Role
                </h3>
                <Select options={ROLE_OPTIONS} value={editRole} onChange={(v) => setEditRole(v)} />
                <Button
                  size="sm"
                  className="mt-3"
                  isLoading={updateRoleMutation.isPending}
                  disabled={
                    editRole === (selectedMember.tenantRole ?? selectedMember.role) &&
                    editDepartment === (selectedMember.department ?? '')
                  }
                  onClick={() =>
                    updateRoleMutation.mutate({
                      userId: selectedMember.id,
                      role: editRole,
                      department: editDepartment || undefined,
                    })
                  }
                >
                  Update Role
                </Button>
              </CardContent>
            </Card>

            {/* Department Assignment */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-white/85 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Department Assignment
                </h3>
                <Select
                  options={[{ value: '', label: 'No department' }, ...DEPARTMENT_OPTIONS]}
                  value={editDepartment}
                  onChange={(v) => setEditDepartment(v)}
                />
                <Button
                  size="sm"
                  className="mt-3"
                  isLoading={updateRoleMutation.isPending}
                  disabled={editDepartment === (selectedMember.department ?? '')}
                  onClick={() =>
                    updateRoleMutation.mutate({
                      userId: selectedMember.id,
                      role: editRole,
                      department: editDepartment || undefined,
                    })
                  }
                >
                  Update Department
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-white/85 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<KeyRound className="h-3.5 w-3.5" />}
                    isLoading={resetPasswordMutation.isPending}
                    onClick={() => resetPasswordMutation.mutate(selectedMember.id)}
                  >
                    Reset Password
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={
                      selectedMember.status === 'SUSPENDED' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )
                    }
                    onClick={() => handleSuspendToggle(selectedMember)}
                  >
                    {selectedMember.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardContent className="p-4">
                <button
                  className="flex items-center justify-between w-full"
                  onClick={() => setShowActivityLog(!showActivityLog)}
                >
                  <h3 className="text-sm font-semibold text-white/85 flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-400" />
                    Activity Log
                  </h3>
                  {showActivityLog ? (
                    <ChevronUp className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  )}
                </button>
                {showActivityLog && (
                  <div className="mt-3 space-y-2.5">
                    {generateMockActivity(selectedMember.id).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-2.5 py-2 border-b border-white/[0.03] last:border-0"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500/60 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/60">{entry.action}</p>
                          {entry.target && (
                            <p className="text-[10px] text-white/25 mt-0.5">in {entry.target}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-white/20 shrink-0 whitespace-nowrap">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meta */}
            <div className="space-y-2 text-xs text-white/30">
              <p>
                User ID: <span className="font-mono text-white/50">{selectedMember.id}</span>
              </p>
              {selectedMember.createdAt && (
                <p>Joined: {new Date(selectedMember.createdAt).toLocaleDateString()}</p>
              )}
              {selectedMember.lastActiveAt && (
                <p>Last active: {formatRelativeTime(selectedMember.lastActiveAt)}</p>
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
        description={`Are you sure you want to remove ${deletingMember?.email ?? 'this member'} from the workspace? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Remove"
        loading={removeMutation.isPending}
      />

      {/* Suspend Confirmation */}
      <ConfirmDialog
        open={showSuspendConfirm}
        onCancel={() => {
          setShowSuspendConfirm(false);
          setSuspendingMember(null);
        }}
        onConfirm={() => {
          if (suspendingMember) {
            suspendMutation.mutate({
              userId: suspendingMember.id,
              action: suspendingMember.status === 'SUSPENDED' ? 'activate' : 'suspend',
            });
          }
        }}
        title={suspendingMember?.status === 'SUSPENDED' ? 'Activate Member' : 'Suspend Member'}
        description={
          suspendingMember?.status === 'SUSPENDED'
            ? `Activate ${suspendingMember?.email ?? 'this member'}? They will regain access to the workspace.`
            : `Suspend ${suspendingMember?.email ?? 'this member'}? They will lose access until reactivated.`
        }
        variant={suspendingMember?.status === 'SUSPENDED' ? 'default' : 'destructive'}
        confirmLabel={suspendingMember?.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
        loading={suspendMutation.isPending}
      />
    </div>
  );
}

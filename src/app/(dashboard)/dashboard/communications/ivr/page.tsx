'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone, Plus, Trash2, ChevronDown, ChevronRight,
  Voicemail, Users, ArrowRight, Hash, Save,
  Volume2, Settings, Edit2, PhoneOff, GitBranch,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardContent,
  Modal,
  Input,
  Select,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { toast } from 'sonner';

/* ───────────────── Types ───────────────── */

type ActionType = 'transfer' | 'voicemail' | 'submenu' | 'hangup';

interface IvrMenuItem {
  id: string;
  keyPress: string;
  label: string;
  actionType: ActionType;
  actionTarget?: string;
}

interface IvrMenu {
  id: string;
  name: string;
  greetingText: string;
  items: IvrMenuItem[];
  createdAt: string;
  updatedAt: string;
}

type IvrMenusResponse = IvrMenu[];

const ACTION_CONFIG: Record<ActionType, { label: string; icon: React.ReactNode; color: string }> = {
  transfer: { label: 'Transfer', icon: <ArrowRight className="h-3.5 w-3.5" />, color: 'bg-blue-500/[0.08] text-blue-300 border-blue-400/20' },
  voicemail: { label: 'Voicemail', icon: <Voicemail className="h-3.5 w-3.5" />, color: 'bg-amber-500/[0.08] text-amber-300 border-amber-400/20' },
  submenu: { label: 'Submenu', icon: <GitBranch className="h-3.5 w-3.5" />, color: 'bg-primary/80/[0.08] text-primary/80 border-primary/20' },
  hangup: { label: 'Hang Up', icon: <PhoneOff className="h-3.5 w-3.5" />, color: 'bg-primary/80/[0.08] text-primary/80 border-primary/20' },
};

const ACTION_OPTIONS = [
  { value: 'transfer', label: 'Transfer to Number' },
  { value: 'voicemail', label: 'Send to Voicemail' },
  { value: 'submenu', label: 'Go to Submenu' },
  { value: 'hangup', label: 'Hang Up' },
];

const KEY_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
})).concat({ value: '0', label: '0' }, { value: '*', label: '*' }, { value: '#', label: '#' });

function genId() {
  return `ivr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ───────────────── Component ───────────────── */

export default function IvrBuilderPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  // State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editMenuId, setEditMenuId] = useState<string | null>(null);
  const [itemModalMenuId, setItemModalMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<IvrMenuItem | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Menu form state
  const [menuName, setMenuName] = useState('');
  const [menuGreeting, setMenuGreeting] = useState('');

  // Item form state
  const [itemKeyPress, setItemKeyPress] = useState('1');
  const [itemLabel, setItemLabel] = useState('');
  const [itemActionType, setItemActionType] = useState<ActionType>('transfer');
  const [itemActionTarget, setItemActionTarget] = useState('');

  // Queries
  const { data: menus = [], isLoading } = useQuery<IvrMenusResponse>({
    queryKey: ['ivr-menus'],
    queryFn: async () => {
      const res = await api.get<IvrMenusResponse>('/api/comms/ivr');
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  // Mutations
  const createMenu = useMutation({
    mutationFn: async (payload: { name: string; greetingText: string }) => {
      const res = await api.post<IvrMenu>('/api/comms/ivr', payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      toast.success('IVR menu created');
      resetMenuForm();
      setCreateModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMenu = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name: string; greetingText: string }) => {
      const res = await api.patch<IvrMenu>(`/api/comms/ivr/${id}`, payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      toast.success('Menu updated');
      resetMenuForm();
      setEditMenuId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMenu = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/comms/ivr/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      toast.success('Menu deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveMenuItem = useMutation({
    mutationFn: async ({ menuId, item }: { menuId: string; item: IvrMenuItem }) => {
      const res = await api.post<IvrMenu>(`/api/comms/ivr/${menuId}/items`, item);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      toast.success(editingItem ? 'Menu item updated' : 'Menu item added');
      resetItemForm();
      setItemModalMenuId(null);
      setEditingItem(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMenuItem = useMutation({
    mutationFn: async ({ menuId, itemId }: { menuId: string; itemId: string }) => {
      const res = await api.del(`/api/comms/ivr/${menuId}/items/${itemId}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      toast.success('Menu item removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Helpers
  function resetMenuForm() {
    setMenuName('');
    setMenuGreeting('');
  }

  function resetItemForm() {
    setItemKeyPress('1');
    setItemLabel('');
    setItemActionType('transfer');
    setItemActionTarget('');
  }

  function openEditMenu(menu: IvrMenu) {
    setMenuName(menu.name);
    setMenuGreeting(menu.greetingText);
    setEditMenuId(menu.id);
  }

  function openAddItem(menuId: string) {
    resetItemForm();
    setEditingItem(null);
    setItemModalMenuId(menuId);
  }

  function openEditItem(menuId: string, item: IvrMenuItem) {
    setItemKeyPress(item.keyPress);
    setItemLabel(item.label);
    setItemActionType(item.actionType);
    setItemActionTarget(item.actionTarget ?? '');
    setEditingItem(item);
    setItemModalMenuId(menuId);
  }

  const toggleExpand = useCallback((menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  }, []);

  function handleCreateMenu() {
    if (!menuName.trim()) return;
    createMenu.mutate({ name: menuName.trim(), greetingText: menuGreeting.trim() });
  }

  function handleUpdateMenu() {
    if (!editMenuId || !menuName.trim()) return;
    updateMenu.mutate({ id: editMenuId, name: menuName.trim(), greetingText: menuGreeting.trim() });
  }

  function handleSaveItem() {
    if (!itemModalMenuId || !itemLabel.trim()) return;
    const item: IvrMenuItem = {
      id: editingItem?.id ?? genId(),
      keyPress: itemKeyPress,
      label: itemLabel.trim(),
      actionType: itemActionType,
      actionTarget: itemActionTarget.trim() || undefined,
    };
    saveMenuItem.mutate({ menuId: itemModalMenuId, item });
  }

  /* ───────────────── Render ───────────────── */

  return (
    <div className="bg-card min-h-screen">
      <div className="p-8 space-y-8">
        <PageHeader
          title="IVR Builder"
          subtitle="Design interactive voice response menu trees"
          breadcrumb={[
            { label: 'Communications', href: '/dashboard/communications' },
            { label: 'IVR Builder' },
          ]}
          actions={
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200" onClick={() => { resetMenuForm(); setCreateModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Menu
            </Button>
          }
        />

        {/* Menu List */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl bg-card" />
            ))}
          </div>
        ) : menus.length === 0 ? (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-1">No IVR menus yet</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">Create your first menu to build an interactive call flow</p>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200" onClick={() => { resetMenuForm(); setCreateModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Create Menu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {menus.map((menu) => {
              const isExpanded = expandedMenus.has(menu.id);

              return (
                <Card key={menu.id} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                  <CardContent className="p-0">
                    {/* Menu Header */}
                    <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.04]">
                      <button
                        onClick={() => toggleExpand(menu.id)}
                        className="text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0"
                      >
                        {isExpanded
                          ? <ChevronDown className="h-5 w-5" />
                          : <ChevronRight className="h-5 w-5" />
                        }
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <Hash className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-lg font-semibold text-foreground truncate">{menu.name}</span>
                          <Badge className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-muted border border-white/[0.06] shrink-0">
                            {menu.items.length} option{menu.items.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200" size="sm" onClick={() => openAddItem(menu.id)}>
                          <Plus className="h-4 w-4 mr-1.5" /> Add Option
                        </Button>
                        <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200" size="sm" onClick={() => openEditMenu(menu)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary/80 rounded-xl transition-all duration-200"
                          size="sm"
                          onClick={() => deleteMenu.mutate(menu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Visual Tree */}
                    {isExpanded && (
                      <div className="px-6 py-6 space-y-4">
                        {/* Greeting Node */}
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center shrink-0 pt-1">
                            <div className="h-10 w-10 rounded-2xl bg-primary/80/[0.08] border border-primary/20 flex items-center justify-center">
                              <Volume2 className="h-5 w-5 text-primary" />
                            </div>
                            {menu.items.length > 0 && (
                              <div className="w-px h-6 bg-white/[0.04] mt-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-2">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Greeting</p>
                            <p className="text-muted-foreground leading-relaxed">
                              {menu.greetingText || <span className="text-muted-foreground italic">No greeting text set</span>}
                            </p>
                          </div>
                        </div>

                        {/* Menu Options Arrow */}
                        {menu.items.length > 0 && (
                          <div className="flex items-center gap-4 pl-4">
                            <div className="w-px h-3 bg-white/[0.04]" />
                          </div>
                        )}

                        {/* Menu Items */}
                        {menu.items.length > 0 ? (
                          <div className="space-y-3 pl-6 border-l border-white/[0.04] ml-5">
                            {menu.items
                              .sort((a, b) => a.keyPress.localeCompare(b.keyPress))
                              .map((item) => {
                                const actionCfg = ACTION_CONFIG[item.actionType];
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/[0.04] bg-card hover:border-white/[0.08] transition-all duration-200 group"
                                  >
                                    {/* Key Press */}
                                    <span className="h-8 w-8 rounded-xl bg-muted border border-white/[0.06] flex items-center justify-center text-sm font-mono text-foreground font-semibold shrink-0">
                                      {item.keyPress}
                                    </span>

                                    {/* Arrow */}
                                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                                    {/* Label */}
                                    <span className="text-foreground font-medium truncate flex-1">
                                      {item.label}
                                    </span>

                                    {/* Action Badge */}
                                    <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium shrink-0 ${actionCfg.color}`}>
                                      {actionCfg.icon}
                                      {actionCfg.label}
                                    </span>

                                    {/* Action target */}
                                    {item.actionTarget && (
                                      <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                                        {item.actionTarget}
                                      </span>
                                    )}

                                    {/* Edit / Delete */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                      <button
                                        onClick={() => openEditItem(menu.id, item)}
                                        className="text-muted-foreground hover:text-foreground transition-all duration-200 p-1 rounded-lg hover:bg-white/[0.04]"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteMenuItem.mutate({ menuId: menu.id, itemId: item.id })}
                                        className="text-muted-foreground hover:text-primary transition-all duration-200 p-1 rounded-lg hover:bg-white/[0.04]"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="pl-6 border-l border-white/[0.04] ml-5 py-8 text-center">
                            <p className="text-muted-foreground mb-3">No menu options yet</p>
                            <button
                              onClick={() => openAddItem(menu.id)}
                              className="text-sm text-primary hover:text-primary/80 transition-all duration-200 font-medium"
                            >
                              + Add first option
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── Create Menu Modal ─── */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create IVR Menu"
        >
          <div className="space-y-6">
            <Input
              label="Menu Name"
              placeholder="e.g. Main Menu"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
            />
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Greeting Text</label>
              <textarea
                value={menuGreeting}
                onChange={(e) => setMenuGreeting(e.target.value)}
                rows={3}
                placeholder="Thank you for calling. Press 1 for Sales..."
                className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 resize-none backdrop-blur-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
                onClick={handleCreateMenu}
                isLoading={createMenu.isPending}
                disabled={!menuName.trim()}
              >
                <Save className="h-4 w-4 mr-1.5" /> Create
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Edit Menu Modal ─── */}
        <Modal
          isOpen={!!editMenuId}
          onClose={() => { setEditMenuId(null); resetMenuForm(); }}
          title="Edit IVR Menu"
        >
          <div className="space-y-6">
            <Input
              label="Menu Name"
              placeholder="e.g. Main Menu"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
            />
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Greeting Text</label>
              <textarea
                value={menuGreeting}
                onChange={(e) => setMenuGreeting(e.target.value)}
                rows={3}
                placeholder="Thank you for calling. Press 1 for Sales..."
                className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 resize-none backdrop-blur-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200" onClick={() => { setEditMenuId(null); resetMenuForm(); }}>
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
                onClick={handleUpdateMenu}
                isLoading={updateMenu.isPending}
                disabled={!menuName.trim()}
              >
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Add/Edit Item Modal ─── */}
        <Modal
          isOpen={!!itemModalMenuId}
          onClose={() => { setItemModalMenuId(null); setEditingItem(null); resetItemForm(); }}
          title={editingItem ? 'Edit Menu Option' : 'Add Menu Option'}
        >
          <div className="space-y-6">
            <Select
              label="Key Press"
              options={KEY_OPTIONS}
              value={itemKeyPress}
              onChange={(val) => setItemKeyPress(val)}
            />
            <Input
              label="Label"
              placeholder="e.g. Sales Department"
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
            />
            <Select
              label="Action"
              options={ACTION_OPTIONS}
              value={itemActionType}
              onChange={(val) => setItemActionType(val as ActionType)}
            />
            {(itemActionType === 'transfer' || itemActionType === 'submenu') && (
              <Input
                label={itemActionType === 'transfer' ? 'Transfer Number' : 'Submenu ID'}
                placeholder={itemActionType === 'transfer' ? '+1 (555) 123-4567' : 'Enter submenu name'}
                value={itemActionTarget}
                onChange={(e) => setItemActionTarget(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
                onClick={() => { setItemModalMenuId(null); setEditingItem(null); resetItemForm(); }}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
                onClick={handleSaveItem}
                isLoading={saveMenuItem.isPending}
                disabled={!itemLabel.trim()}
              >
                <Save className="h-4 w-4 mr-1.5" /> {editingItem ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
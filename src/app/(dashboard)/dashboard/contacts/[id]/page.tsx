'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { MessageSquare, Mail, Phone, Users, GitMerge, ShoppingBag, Sparkles, Activity, Plus, X, Pencil } from 'lucide-react';
import { API_URL } from '@/lib/config';

async function api(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Contact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  source?: string | null;
  customFields?: Record<string, unknown>;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  createdAt: string;
}

const TypeIcon = ({ type }: { type: string }) => {
  const props = { className: 'h-4 w-4' };
  switch (type) {
    case 'NOTE': return <MessageSquare {...props} />;
    case 'EMAIL': return <Mail {...props} />;
    case 'CALL': return <Phone {...props} />;
    case 'MEETING': return <Users {...props} />;
    case 'DEAL': return <GitMerge {...props} />;
    case 'ORDER': return <ShoppingBag {...props} />;
    case 'AI': return <Sparkles {...props} />;
    default: return <Activity {...props} />;
  }
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const activityTypes = ['NOTE', 'EMAIL', 'CALL', 'MEETING', 'DEAL', 'ORDER', 'AI'];

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState('NOTE');
  const [logTitle, setLogTitle] = useState('');
  const [logBody, setLogBody] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api(`/api/contacts/${id}`),
      api(`/api/activities?contactId=${id}`).catch(() => null),
    ])
      .then(([contactData, activityData]) => {
        setContact(contactData);
        if (activityData) {
          setActivities(Array.isArray(activityData) ? activityData : activityData.activities ?? activityData.items ?? []);
        }
      })
      .catch(() => toast.error('Failed to load contact'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    setLogSubmitting(true);
    try {
      const activity = await api('/api/activities', {
        method: 'POST',
        body: JSON.stringify({ type: logType, title: logTitle, body: logBody, contactId: id }),
      });
      setActivities((prev) => [activity, ...prev]);
      setShowLogModal(false);
      setLogTitle(''); setLogBody(''); setLogType('NOTE');
      toast.success('Activity logged');
    } catch {
      toast.error('Failed to log activity');
    } finally {
      setLogSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5 p-6">
        <div className="animate-pulse bg-white/[0.02] border border-white/[0.04] rounded-2xl h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse bg-white/[0.02] border border-white/[0.04] rounded-2xl h-64 w-full" />
          <div className="animate-pulse bg-white/[0.02] border border-white/[0.04] rounded-2xl h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return <div className="text-center py-20 text-muted-foreground">Contact not found.</div>;
  }

  const displayName =
    contact.type === 'PERSON'
      ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || 'Unknown'
      : contact.companyName ?? contact.email ?? 'Unknown';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10 text-primary text-xl font-bold">
            {String(displayName)[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <div className="flex items-center flex-wrap gap-3 mt-1.5">
              {contact.email && <span className="text-sm text-muted-foreground">{contact.email}</span>}
              {contact.phone && <span className="text-sm text-muted-foreground">{contact.phone}</span>}
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                contact.type === 'PERSON'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {contact.type.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground rounded-xl text-sm transition-all duration-200 border border-white/[0.06] backdrop-blur-xl">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Activity
          </button>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Contact info */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
            <h2 className="text-sm font-semibold text-foreground mb-5">Contact Details</h2>
            <div className="space-y-3.5 text-sm">
              {contact.email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">{contact.phone}</span>
                </div>
              )}
              {contact.type === 'PERSON' && contact.companyName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="text-foreground">{contact.companyName}</span>
                </div>
              )}
              {contact.source && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-foreground">{contact.source}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {contact.customFields && Object.keys(contact.customFields).length > 0 && (
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-5">Custom Fields</h2>
              <div className="space-y-3.5 text-sm">
                {Object.entries(contact.customFields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="text-foreground">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Activity timeline */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Activity Timeline</h2>
          {activities.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No activities yet.
              <br />
              <button
                onClick={() => setShowLogModal(true)}
                className="mt-2 text-primary hover:text-primary/80 transition-colors duration-200"
              >
                Log the first activity
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.04]" />
              <div className="space-y-0">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-4 pb-5">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-primary">
                      <TypeIcon type={activity.type} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(activity.createdAt)}</span>
                      </div>
                      {activity.body && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {activity.body.slice(0, 100)}{activity.body.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={() => setShowLogModal(false)}>
          <form
            onSubmit={handleLogActivity}
            className="bg-card border border-white/[0.06] rounded-2xl p-6 w-full max-w-md mx-4 backdrop-blur-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Log Activity</h2>
              <button type="button" onClick={() => setShowLogModal(false)} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-colors duration-200"
                >
                  {activityTypes.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title</label>
                <input
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                <textarea
                  value={logBody}
                  onChange={(e) => setLogBody(e.target.value)}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl resize-none transition-colors duration-200"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={logSubmitting}
              className="mt-6 w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all duration-200"
            >
              {logSubmitting ? 'Logging...' : 'Log Activity'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

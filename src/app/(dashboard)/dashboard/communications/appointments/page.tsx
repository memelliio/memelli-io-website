'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { API_URL } from '@/lib/config';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Phone,
  Video,
  Users,
  X,
  Copy,
  Check,
  Link2,
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Settings,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit3,
  User,
  MapPin,
  FileText,
  Ban,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = 'day' | 'week' | 'month';
type AppointmentType = 'call' | 'meeting' | 'consultation';
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
type ModalView = 'none' | 'create' | 'detail' | 'availability' | 'booking-link' | 'integrations';

interface Appointment {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // minutes
  notes: string;
  reminders: {
    email24h: boolean;
    email1h: boolean;
    sms24h: boolean;
    sms1h: boolean;
  };
  noShowCount: number;
  meetingLink?: string;
  location?: string;
}

interface AvailabilitySlot {
  day: number; // 0=Sun, 1=Mon, ... 6=Sat
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface BlockedTime {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WORKING_HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7AM to 7PM

const TYPE_CONFIG: Record<AppointmentType, { color: string; bg: string; border: string; icon: typeof Phone; label: string }> = {
  call: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Phone, label: 'Call' },
  meeting: { color: 'text-primary', bg: 'bg-primary/80/15', border: 'border-primary/30', icon: Video, label: 'Meeting' },
  consultation: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: Users, label: 'Consultation' },
};

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; bg: string; label: string }> = {
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Scheduled' },
  confirmed: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Confirmed' },
  completed: { color: 'text-white/50', bg: 'bg-white/[0.06]', label: 'Completed' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-500/15', label: 'Cancelled' },
  'no-show': { color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'No-Show' },
  rescheduled: { color: 'text-yellow-400', bg: 'bg-yellow-500/15', label: 'Rescheduled' },
};

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday start
  const days: Date[] = [];
  for (let i = -startPad; i <= lastDay.getDate() - 1; i++) {
    const d = new Date(year, month, i + 1);
    days.push(d);
  }
  // pad to fill last row
  while (days.length % 7 !== 0) {
    const d = new Date(days[days.length - 1]);
    d.setDate(d.getDate() + 1);
    days.push(d);
  }
  return days;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const today = new Date();
const todayStr = formatDate(today);

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    title: 'Credit Review Call',
    clientName: 'Sarah Chen',
    clientEmail: 'sarah.chen@email.com',
    type: 'call',
    status: 'confirmed',
    date: todayStr,
    startTime: '09:00',
    endTime: '09:30',
    duration: 30,
    notes: 'Review credit report and discuss dispute strategy.',
    reminders: { email24h: true, email1h: true, sms24h: false, sms1h: true },
    noShowCount: 0,
  },
  {
    id: '2',
    title: 'Funding Consultation',
    clientName: 'Marcus Johnson',
    clientEmail: 'marcus.j@email.com',
    type: 'consultation',
    status: 'scheduled',
    date: todayStr,
    startTime: '11:00',
    endTime: '12:00',
    duration: 60,
    notes: 'First consultation for business funding. Prepare qualification docs.',
    reminders: { email24h: true, email1h: true, sms24h: true, sms1h: true },
    noShowCount: 0,
    meetingLink: 'https://universe.memelli.com/meet/abc123',
  },
  {
    id: '3',
    title: 'Team Strategy Meeting',
    clientName: 'Alex Rivera',
    clientEmail: 'alex.r@email.com',
    type: 'meeting',
    status: 'confirmed',
    date: todayStr,
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    notes: 'Discuss Q2 goals and pipeline targets.',
    reminders: { email24h: true, email1h: false, sms24h: false, sms1h: false },
    noShowCount: 0,
    meetingLink: 'https://universe.memelli.com/meet/def456',
  },
  {
    id: '4',
    title: 'Follow-up Call',
    clientName: 'Emily Watson',
    clientEmail: 'emily.w@email.com',
    type: 'call',
    status: 'no-show',
    date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatDate(d); })(),
    startTime: '10:00',
    endTime: '10:30',
    duration: 30,
    notes: 'Follow up on credit dispute results. Client did not answer.',
    reminders: { email24h: true, email1h: true, sms24h: true, sms1h: true },
    noShowCount: 2,
  },
  {
    id: '5',
    title: 'Onboarding Session',
    clientName: 'David Park',
    clientEmail: 'david.p@email.com',
    type: 'consultation',
    status: 'scheduled',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return formatDate(d); })(),
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    notes: 'New client onboarding, walk through platform.',
    reminders: { email24h: true, email1h: true, sms24h: true, sms1h: true },
    noShowCount: 0,
  },
  {
    id: '6',
    title: 'Pipeline Review',
    clientName: 'Lisa Morgan',
    clientEmail: 'lisa.m@email.com',
    type: 'meeting',
    status: 'scheduled',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return formatDate(d); })(),
    startTime: '13:00',
    endTime: '13:45',
    duration: 45,
    notes: 'Monthly pipeline review and forecast.',
    reminders: { email24h: true, email1h: true, sms24h: false, sms1h: false },
    noShowCount: 0,
  },
  {
    id: '7',
    title: 'Credit Dispute Update',
    clientName: 'James Wilson',
    clientEmail: 'james.w@email.com',
    type: 'call',
    status: 'completed',
    date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return formatDate(d); })(),
    startTime: '15:00',
    endTime: '15:30',
    duration: 30,
    notes: 'Dispute resolved. Score improved by 45 points.',
    reminders: { email24h: true, email1h: true, sms24h: false, sms1h: false },
    noShowCount: 0,
  },
];

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { day: 0, startTime: '09:00', endTime: '17:00', enabled: false },
  { day: 1, startTime: '09:00', endTime: '17:00', enabled: true },
  { day: 2, startTime: '09:00', endTime: '17:00', enabled: true },
  { day: 3, startTime: '09:00', endTime: '17:00', enabled: true },
  { day: 4, startTime: '09:00', endTime: '17:00', enabled: true },
  { day: 5, startTime: '09:00', endTime: '17:00', enabled: true },
  { day: 6, startTime: '09:00', endTime: '17:00', enabled: false },
];

/* ------------------------------------------------------------------ */
/*  Create / Edit Appointment Modal                                    */
/* ------------------------------------------------------------------ */

function AppointmentFormModal({
  appointment,
  selectedDate,
  selectedTime,
  onSave,
  onClose,
}: {
  appointment?: Appointment | null;
  selectedDate?: string;
  selectedTime?: string;
  onSave: (appt: Appointment) => void;
  onClose: () => void;
}) {
  const isEdit = !!appointment;
  const [title, setTitle] = useState(appointment?.title || '');
  const [clientName, setClientName] = useState(appointment?.clientName || '');
  const [clientEmail, setClientEmail] = useState(appointment?.clientEmail || '');
  const [type, setType] = useState<AppointmentType>(appointment?.type || 'call');
  const [date, setDate] = useState(appointment?.date || selectedDate || todayStr);
  const [startTime, setStartTime] = useState(appointment?.startTime || selectedTime || '09:00');
  const [duration, setDuration] = useState(appointment?.duration || 30);
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [reminders, setReminders] = useState(appointment?.reminders || { email24h: true, email1h: true, sms24h: false, sms1h: true });

  const endTime = useMemo(() => {
    const mins = timeToMinutes(startTime) + duration;
    return minutesToTime(Math.min(mins, 23 * 60 + 59));
  }, [startTime, duration]);

  const handleSave = () => {
    if (!title.trim() || !clientName.trim()) return;
    const appt: Appointment = {
      id: appointment?.id || Date.now().toString(),
      title: title.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      type,
      status: appointment?.status || 'scheduled',
      date,
      startTime,
      endTime,
      duration,
      notes: notes.trim(),
      reminders,
      noShowCount: appointment?.noShowCount || 0,
      meetingLink: appointment?.meetingLink,
      location: appointment?.location,
    };
    onSave(appt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#0e0e12]/95 z-10">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Credit Review Call"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
            />
          </div>

          {/* Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Client Name</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Client Email</label>
              <input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TYPE_CONFIG) as [AppointmentType, typeof TYPE_CONFIG.call][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      type === key
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark] appearance-none"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* End time display */}
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Clock className="h-3.5 w-3.5" />
            <span>Ends at {formatTime12(endTime)}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this appointment..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
            />
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Reminders</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'email24h' as const, icon: Mail, label: 'Email (24h before)' },
                { key: 'email1h' as const, icon: Mail, label: 'Email (1h before)' },
                { key: 'sms24h' as const, icon: MessageSquare, label: 'SMS (24h before)' },
                { key: 'sms1h' as const, icon: MessageSquare, label: 'SMS (1h before)' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setReminders(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                    reminders[key]
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50'
                  }`}
                >
                  {reminders[key] ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] sticky bottom-0 bg-[#0e0e12]/95">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !clientName.trim()}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-white/[0.06] disabled:text-white/20 text-white text-sm font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {isEdit ? 'Update' : 'Create Appointment'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Appointment Detail Modal                                           */
/* ------------------------------------------------------------------ */

function AppointmentDetailModal({
  appointment,
  onClose,
  onEdit,
  onCancel,
  onReschedule,
  onNoShow,
}: {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onNoShow: () => void;
}) {
  const cfg = TYPE_CONFIG[appointment.type];
  const statusCfg = STATUS_CONFIG[appointment.status];
  const Icon = cfg.icon;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (appointment.meetingLink) {
      navigator.clipboard.writeText(appointment.meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPast = appointment.date < todayStr || (appointment.date === todayStr && appointment.endTime < new Date().toTimeString().slice(0, 5));
  const isActive = appointment.status === 'scheduled' || appointment.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{appointment.title}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Client */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center">
              <User className="h-4 w-4 text-white/40" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">{appointment.clientName}</p>
              <p className="text-xs text-white/40">{appointment.clientEmail}</p>
            </div>
          </div>

          {/* DateTime */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar className="h-4 w-4 text-white/30" />
              {new Date(appointment.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4 text-white/30" />
              {formatTime12(appointment.startTime)} - {formatTime12(appointment.endTime)}
            </div>
          </div>

          {/* Duration */}
          <div className="text-xs text-white/30">
            Duration: {appointment.duration >= 60 ? `${Math.floor(appointment.duration / 60)}h${appointment.duration % 60 ? ` ${appointment.duration % 60}m` : ''}` : `${appointment.duration}m`}
          </div>

          {/* Meeting link */}
          {appointment.meetingLink && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Link2 className="h-4 w-4 text-white/30 flex-shrink-0" />
              <span className="flex-1 text-sm text-white/50 truncate font-mono">{appointment.meetingLink}</span>
              <button onClick={copyLink} className="p-1 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div>
              <label className="block text-xs text-white/30 mb-1">Notes</label>
              <p className="text-sm text-white/60 leading-relaxed">{appointment.notes}</p>
            </div>
          )}

          {/* Reminders */}
          <div>
            <label className="block text-xs text-white/30 mb-1.5">Active Reminders</label>
            <div className="flex flex-wrap gap-1.5">
              {appointment.reminders.email24h && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40">
                  <Mail className="h-3 w-3" /> Email 24h
                </span>
              )}
              {appointment.reminders.email1h && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40">
                  <Mail className="h-3 w-3" /> Email 1h
                </span>
              )}
              {appointment.reminders.sms24h && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40">
                  <MessageSquare className="h-3 w-3" /> SMS 24h
                </span>
              )}
              {appointment.reminders.sms1h && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40">
                  <MessageSquare className="h-3 w-3" /> SMS 1h
                </span>
              )}
            </div>
          </div>

          {/* No-show warning */}
          {appointment.noShowCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <span className="text-xs text-orange-400">
                This client has {appointment.noShowCount} previous no-show{appointment.noShowCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-white/[0.06] space-y-2">
          {isActive && !isPast && (
            <div className="flex gap-2">
              {appointment.type === 'call' && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                  <Phone className="h-4 w-4" />
                  Call Now
                </button>
              )}
              {(appointment.type === 'meeting' || appointment.type === 'consultation') && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                  <Video className="h-4 w-4" />
                  Join
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm hover:bg-white/[0.08] hover:text-white/80 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            {isActive && (
              <>
                <button
                  onClick={onReschedule}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-yellow-400/70 text-sm hover:bg-yellow-500/10 hover:text-yellow-400 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reschedule
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-red-400/70 text-sm hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </>
            )}
            {isActive && isPast && (
              <button
                onClick={onNoShow}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400/70 text-sm hover:text-orange-400 transition-all"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                No-Show
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Availability Settings Modal                                        */
/* ------------------------------------------------------------------ */

function AvailabilityModal({
  availability,
  blockedTimes,
  onSave,
  onClose,
}: {
  availability: AvailabilitySlot[];
  blockedTimes: BlockedTime[];
  onSave: (slots: AvailabilitySlot[], blocked: BlockedTime[]) => void;
  onClose: () => void;
}) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([...availability]);
  const [blocked, setBlocked] = useState<BlockedTime[]>([...blockedTimes]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState('10:00');
  const [newBlockReason, setNewBlockReason] = useState('');

  const toggleDay = (day: number) => {
    setSlots(prev => prev.map(s => s.day === day ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSlot = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setSlots(prev => prev.map(s => s.day === day ? { ...s, [field]: value } : s));
  };

  const addBlockedTime = () => {
    if (!newBlockDate) return;
    setBlocked(prev => [...prev, {
      id: Date.now().toString(),
      date: newBlockDate,
      startTime: newBlockStart,
      endTime: newBlockEnd,
      reason: newBlockReason || 'Blocked',
    }]);
    setNewBlockDate('');
    setNewBlockReason('');
  };

  const removeBlocked = (id: string) => {
    setBlocked(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#0e0e12]/95 z-10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-white/40" />
            Availability Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Working Hours */}
        <div className="px-6 py-5 space-y-4">
          <h3 className="text-sm font-medium text-white/70">Working Hours</h3>
          <div className="space-y-2">
            {slots.map((slot) => (
              <div key={slot.day} className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(slot.day)}
                  className={`w-24 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    slot.enabled
                      ? 'text-white bg-white/[0.06]'
                      : 'text-white/25 bg-white/[0.02]'
                  }`}
                >
                  {DAYS_FULL[slot.day]}
                </button>
                {slot.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.day, 'startTime', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 transition-all [color-scheme:dark]"
                    />
                    <span className="text-white/20 text-xs">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.day, 'endTime', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 transition-all [color-scheme:dark]"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-white/20 italic">Unavailable</span>
                )}
              </div>
            ))}
          </div>

          {/* Block Off Time */}
          <div className="pt-4 border-t border-white/[0.06]">
            <h3 className="text-sm font-medium text-white/70 mb-3">Block Off Time</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <input
                type="date"
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-red-500/40 transition-all [color-scheme:dark]"
              />
              <input
                type="time"
                value={newBlockStart}
                onChange={(e) => setNewBlockStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-red-500/40 transition-all [color-scheme:dark]"
              />
              <input
                type="time"
                value={newBlockEnd}
                onChange={(e) => setNewBlockEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-red-500/40 transition-all [color-scheme:dark]"
              />
              <button
                onClick={addBlockedTime}
                disabled={!newBlockDate}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 disabled:opacity-30 transition-all"
              >
                Block
              </button>
            </div>
            <input
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-xs focus:outline-none focus:border-red-500/40 transition-all mb-3"
            />
            {blocked.length > 0 && (
              <div className="space-y-1.5">
                {blocked.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="text-xs text-white/50">
                      <span className="text-white/70 font-medium">{b.date}</span>
                      {' '}{formatTime12(b.startTime)} - {formatTime12(b.endTime)}
                      {b.reason && <span className="text-white/30 ml-2">({b.reason})</span>}
                    </div>
                    <button onClick={() => removeBlocked(b.id)} className="text-white/20 hover:text-red-400 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] sticky bottom-0 bg-[#0e0e12]/95">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(slots, blocked); onClose(); }}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking Link Generator Modal                                       */
/* ------------------------------------------------------------------ */

function BookingLinkModal({ onClose }: { onClose: () => void }) {
  const [linkName, setLinkName] = useState('');
  const [linkDuration, setLinkDuration] = useState(30);
  const [linkType, setLinkType] = useState<AppointmentType>('consultation');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const slug = (linkName || 'booking').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setGeneratedLink(`https://universe.memelli.com/book/${slug}-${Date.now().toString(36)}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link2 className="h-5 w-5 text-red-400" />
            Create Booking Link
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Link Name</label>
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="e.g. Free Consultation"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Duration</label>
              <select
                value={linkDuration}
                onChange={(e) => setLinkDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark] appearance-none"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Type</label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as AppointmentType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark] appearance-none"
              >
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-white/30">
            Clients will see your available slots based on your availability settings and can pick a time that works.
          </p>

          {!generatedLink ? (
            <button
              onClick={generate}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Link
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-white/[0.04] border border-emerald-500/20">
                <Link2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-white/70 truncate font-mono">{generatedLink}</span>
                <button onClick={copyLink} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-emerald-400/60 text-center">Link generated. Share with your client.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Integrations Modal                                                 */
/* ------------------------------------------------------------------ */

function IntegrationsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Calendar Integrations</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Google Calendar */}
          <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">Google Calendar</p>
                <p className="text-xs text-white/30">Two-way sync with Google</p>
              </div>
            </div>
            <button className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-medium hover:bg-white/[0.1] hover:text-white/70 transition-all">
              Connect
            </button>
          </div>

          {/* Outlook */}
          <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">Outlook Calendar</p>
                <p className="text-xs text-white/30">Sync with Microsoft Outlook</p>
              </div>
            </div>
            <button className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-medium hover:bg-white/[0.1] hover:text-white/70 transition-all">
              Connect
            </button>
          </div>

          {/* Apple Calendar */}
          <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white/40" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">Apple Calendar</p>
                <p className="text-xs text-white/30">iCal subscription feed</p>
              </div>
            </div>
            <button className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-medium hover:bg-white/[0.1] hover:text-white/70 transition-all">
              Connect
            </button>
          </div>

          <p className="text-xs text-white/20 text-center pt-2">
            Integrations will sync appointments in both directions and block off unavailable times automatically.
          </p>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Week View Calendar Grid                                            */
/* ------------------------------------------------------------------ */

function WeekView({
  currentDate,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (appt: Appointment) => void;
}) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const getAppointmentsForDay = (dateStr: string) =>
    appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.06] sticky top-0 bg-[#0a0a0e] z-10">
        <div className="p-2" />
        {weekDates.map((d) => {
          const isToday = formatDate(d) === todayStr;
          return (
            <div key={formatDate(d)} className="p-2 text-center border-l border-white/[0.04]">
              <div className="text-[10px] text-white/30 uppercase tracking-wider">{DAYS[d.getDay()]}</div>
              <div className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-red-400' : 'text-white/70'}`}>
                {d.getDate()}
                {isToday && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="relative">
        {WORKING_HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.03]">
            <div className="p-2 text-right pr-3">
              <span className="text-[10px] text-white/20 font-mono">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
            {weekDates.map((d) => {
              const dateStr = formatDate(d);
              const dayAppts = getAppointmentsForDay(dateStr).filter(
                a => {
                  const startH = parseInt(a.startTime.split(':')[0]);
                  return startH === hour;
                }
              );

              return (
                <div
                  key={`${dateStr}-${hour}`}
                  className="relative border-l border-white/[0.04] h-16 cursor-pointer hover:bg-white/[0.02] transition-colors group"
                  onClick={() => onSlotClick(dateStr, `${hour.toString().padStart(2, '0')}:00`)}
                >
                  {/* Hover indicator */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                    <Plus className="h-3.5 w-3.5 text-white/15" />
                  </div>

                  {/* Appointments in this slot */}
                  {dayAppts.map((appt) => {
                    const cfg = TYPE_CONFIG[appt.type];
                    const startMin = parseInt(appt.startTime.split(':')[1]);
                    const topOffset = (startMin / 60) * 100;
                    const heightPx = Math.min((appt.duration / 60) * 64, 128);
                    return (
                      <div
                        key={appt.id}
                        onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                        className={`absolute left-0.5 right-0.5 rounded-lg ${cfg.bg} border ${cfg.border} px-1.5 py-1 cursor-pointer hover:brightness-125 transition-all overflow-hidden z-10`}
                        style={{ top: `${topOffset}%`, height: `${heightPx}px`, minHeight: '24px' }}
                      >
                        <p className={`text-[10px] font-medium ${cfg.color} truncate leading-tight`}>{appt.title}</p>
                        <p className="text-[9px] text-white/30 truncate">{appt.clientName}</p>
                        <p className="text-[9px] text-white/20">{formatTime12(appt.startTime)}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Day View                                                           */
/* ------------------------------------------------------------------ */

function DayView({
  currentDate,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (appt: Appointment) => void;
}) {
  const dateStr = formatDate(currentDate);
  const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
  const isToday = dateStr === todayStr;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] sticky top-0 bg-[#0a0a0e] z-10">
        <div className={`text-lg font-semibold ${isToday ? 'text-red-400' : 'text-white'}`}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {isToday && <span className="ml-2 text-xs text-red-400/60 font-normal">Today</span>}
        </div>
      </div>

      {/* Hour rows */}
      {WORKING_HOURS.map((hour) => {
        const hourAppts = dayAppts.filter(a => parseInt(a.startTime.split(':')[0]) === hour);
        return (
          <div
            key={hour}
            className="flex border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors cursor-pointer"
            onClick={() => onSlotClick(dateStr, `${hour.toString().padStart(2, '0')}:00`)}
          >
            <div className="w-20 p-3 text-right flex-shrink-0">
              <span className="text-xs text-white/20 font-mono">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
            <div className="flex-1 min-h-[72px] border-l border-white/[0.04] p-1 space-y-1">
              {hourAppts.map((appt) => {
                const cfg = TYPE_CONFIG[appt.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={appt.id}
                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${cfg.bg} border ${cfg.border} cursor-pointer hover:brightness-125 transition-all`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${cfg.color} truncate`}>{appt.title}</p>
                      <p className="text-xs text-white/40">{appt.clientName} &middot; {formatTime12(appt.startTime)} - {formatTime12(appt.endTime)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${STATUS_CONFIG[appt.status].bg} ${STATUS_CONFIG[appt.status].color}`}>
                      {STATUS_CONFIG[appt.status].label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Month View                                                         */
/* ------------------------------------------------------------------ */

function MonthView({
  currentDate,
  appointments,
  onDayClick,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appt: Appointment) => void;
}) {
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-[10px] text-white/30 uppercase tracking-wider py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.06]">
        {monthDays.map((d, i) => {
          const dateStr = formatDate(d);
          const isCurrentMonth = d.getMonth() === currentMonth;
          const isToday = dateStr === todayStr;
          const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');

          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              className={`min-h-[100px] p-1.5 cursor-pointer transition-colors ${
                isCurrentMonth ? 'bg-[#0a0a0e] hover:bg-white/[0.03]' : 'bg-[#080810]'
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isToday ? 'text-red-400' : isCurrentMonth ? 'text-white/50' : 'text-white/15'
              }`}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map(appt => {
                  const cfg = TYPE_CONFIG[appt.type];
                  return (
                    <div
                      key={appt.id}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                      className={`text-[9px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} truncate cursor-pointer hover:brightness-125`}
                    >
                      {formatTime12(appt.startTime).replace(' ', '')} {appt.title}
                    </div>
                  );
                })}
                {dayAppts.length > 3 && (
                  <div className="text-[9px] text-white/20 px-1.5">+{dayAppts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upcoming Appointments Sidebar                                      */
/* ------------------------------------------------------------------ */

function UpcomingSidebar({
  appointments,
  onAppointmentClick,
}: {
  appointments: Appointment[];
  onAppointmentClick: (appt: Appointment) => void;
}) {
  const upcoming = useMemo(() => {
    return appointments
      .filter(a => {
        if (a.status === 'cancelled' || a.status === 'completed') return false;
        if (a.date > todayStr) return true;
        if (a.date === todayStr && a.startTime >= new Date().toTimeString().slice(0, 5)) return true;
        return false;
      })
      .sort((a, b) => {
        const da = `${a.date}T${a.startTime}`;
        const db = `${b.date}T${b.startTime}`;
        return da.localeCompare(db);
      })
      .slice(0, 10);
  }, [appointments]);

  const noShowClients = useMemo(() => {
    return appointments.filter(a => a.noShowCount > 0)
      .reduce((acc, a) => {
        if (!acc.find(x => x.clientEmail === a.clientEmail)) acc.push(a);
        return acc;
      }, [] as Appointment[]);
  }, [appointments]);

  return (
    <div className="w-80 border-l border-white/[0.06] bg-white/[0.01] flex flex-col overflow-hidden">
      {/* Upcoming */}
      <div className="p-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-red-400" />
          Upcoming
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-8 w-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/20">No upcoming appointments</p>
          </div>
        ) : (
          upcoming.map(appt => {
            const cfg = TYPE_CONFIG[appt.type];
            const Icon = cfg.icon;
            const isToday = appt.date === todayStr;
            return (
              <div
                key={appt.id}
                onClick={() => onAppointmentClick(appt)}
                className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] cursor-pointer transition-all group"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">{appt.title}</p>
                    <p className="text-xs text-white/40 truncate">{appt.clientName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] ${isToday ? 'text-red-400' : 'text-white/30'}`}>
                        {isToday ? 'Today' : new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-white/20">{formatTime12(appt.startTime)}</span>
                    </div>
                  </div>
                  {/* Quick action */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {appt.type === 'call' ? (
                      <button className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        <Phone className="h-3 w-3" />
                      </button>
                    ) : (
                      <button className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        <Video className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {appt.noShowCount > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 ml-10">
                    <AlertTriangle className="h-3 w-3 text-orange-400/60" />
                    <span className="text-[10px] text-orange-400/60">{appt.noShowCount} no-show{appt.noShowCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* No-Show Tracking */}
      {noShowClients.length > 0 && (
        <div className="border-t border-white/[0.06] p-3">
          <h4 className="text-[10px] text-orange-400/60 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            No-Show Clients
          </h4>
          <div className="space-y-1">
            {noShowClients.slice(0, 3).map(a => (
              <div key={a.clientEmail} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-orange-500/5">
                <span className="text-xs text-white/40 truncate">{a.clientName}</span>
                <span className="text-[10px] text-orange-400 font-medium">{a.noShowCount}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function dispatchSchedulingTask(payload: Record<string, unknown>): Promise<void> {
  await fetch(`${API_URL}/api/admin/command-center/dispatch`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      task: 'create appointment scheduling task',
      payload,
    }),
  });
}

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(DEFAULT_AVAILABILITY);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null); // null = unknown
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  // Modal states
  const [modal, setModal] = useState<ModalView>('none');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [createDate, setCreateDate] = useState<string>('');
  const [createTime, setCreateTime] = useState<string>('');

  /* Fetch appointments from API on mount */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/comms/appointments`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          const data: Appointment[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          setApiAvailable(true);
          if (data.length > 0) {
            setAppointments(data);
          }
          // If API returns empty, keep mock data so UI looks populated
        } else if (res.status === 404 || res.status === 501) {
          // No appointment endpoint yet — stay on mock data, dispatch-task fallback active
          setApiAvailable(false);
        } else {
          setApiAvailable(false);
        }
      } catch {
        setApiAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  /* Navigation */
  const navigate = useCallback((direction: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'day') d.setDate(d.getDate() + direction);
      else if (viewMode === 'week') d.setDate(d.getDate() + direction * 7);
      else d.setMonth(d.getMonth() + direction);
      return d;
    });
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  /* Slot click */
  const handleSlotClick = useCallback((date: string, time: string) => {
    setCreateDate(date);
    setCreateTime(time);
    setSelectedAppointment(null);
    setModal('create');
  }, []);

  /* Appointment click */
  const handleAppointmentClick = useCallback((appt: Appointment) => {
    setSelectedAppointment(appt);
    setModal('detail');
  }, []);

  /* Save */
  const handleSave = useCallback(async (appt: Appointment) => {
    // Optimistic local update first
    setAppointments(prev => {
      const idx = prev.findIndex(a => a.id === appt.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = appt;
        return updated;
      }
      return [...prev, appt];
    });
    setModal('none');
    setSelectedAppointment(null);

    // Sync to API if available
    if (apiAvailable) {
      const isEdit = appointments.some(a => a.id === appt.id);
      try {
        if (isEdit) {
          await fetch(`${API_URL}/api/comms/appointments/${appt.id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(appt),
          });
        } else {
          const res = await fetch(`${API_URL}/api/comms/appointments`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(appt),
          });
          if (res.ok) {
            const json = await res.json();
            const created: Appointment = json?.data ?? json;
            if (created?.id && created.id !== appt.id) {
              setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, id: created.id } : a));
            }
          }
        }
      } catch {
        // Silent — optimistic update already applied
      }
    } else {
      // No API endpoint: dispatch scheduling intent to command center
      dispatchSchedulingTask({ appointment: appt, action: 'create_or_update' }).catch(() => {});
    }
  }, [apiAvailable, appointments]);

  /* Cancel */
  const handleCancel = useCallback(async () => {
    if (!selectedAppointment) return;
    setAppointments(prev =>
      prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'cancelled' as AppointmentStatus } : a)
    );
    setModal('none');
    const apptId = selectedAppointment.id;
    setSelectedAppointment(null);
    if (apiAvailable) {
      try {
        await fetch(`${API_URL}/api/comms/appointments/${apptId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'cancelled' }),
        });
      } catch {
        // Silent
      }
    }
  }, [selectedAppointment, apiAvailable]);

  /* Reschedule */
  const handleReschedule = useCallback(async () => {
    if (!selectedAppointment) return;
    setAppointments(prev =>
      prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'rescheduled' as AppointmentStatus } : a)
    );
    const apptId = selectedAppointment.id;
    setModal('create');
    if (apiAvailable) {
      try {
        await fetch(`${API_URL}/api/comms/appointments/${apptId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'rescheduled' }),
        });
      } catch {
        // Silent
      }
    }
  }, [selectedAppointment, apiAvailable]);

  /* No-Show */
  const handleNoShow = useCallback(async () => {
    if (!selectedAppointment) return;
    const newCount = selectedAppointment.noShowCount + 1;
    setAppointments(prev =>
      prev.map(a => a.id === selectedAppointment.id
        ? { ...a, status: 'no-show' as AppointmentStatus, noShowCount: newCount }
        : a
      )
    );
    setModal('none');
    const apptId = selectedAppointment.id;
    setSelectedAppointment(null);
    if (apiAvailable) {
      try {
        await fetch(`${API_URL}/api/comms/appointments/${apptId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'no-show', noShowCount: newCount }),
        });
      } catch {
        // Silent
      }
    }
  }, [selectedAppointment, apiAvailable]);

  /* Month view day click */
  const handleMonthDayClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  }, []);

  /* Stats */
  const stats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const noShows = appointments.filter(a => a.status === 'no-show').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    return { total, upcoming, noShows, completed };
  }, [appointments]);

  /* Header label */
  const headerLabel = useMemo(() => {
    if (viewMode === 'day') return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (viewMode === 'week') {
      const week = getWeekDates(currentDate);
      const start = week[0];
      const end = week[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
    }
    return formatMonthYear(currentDate);
  }, [viewMode, currentDate]);

  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col bg-[#0a0a0e]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
        {/* Left: Title + Nav */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">Appointments</h1>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1 rounded-lg text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition-colors font-medium"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="text-sm text-white/60 font-medium">{headerLabel}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.06] p-0.5">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === v
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Availability */}
          <button
            onClick={() => setModal('availability')}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all"
            title="Availability Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Booking link */}
          <button
            onClick={() => setModal('booking-link')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs font-medium hover:bg-white/[0.08] hover:text-white/70 transition-all"
          >
            <Link2 className="h-3.5 w-3.5" />
            Booking Link
          </button>

          {/* Integrations */}
          <button
            onClick={() => setModal('integrations')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs font-medium hover:bg-white/[0.08] hover:text-white/70 transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Sync
          </button>

          {/* New appointment */}
          <button
            onClick={() => { setSelectedAppointment(null); setCreateDate(todayStr); setCreateTime('09:00'); setModal('create'); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.04] bg-white/[0.01] flex-shrink-0">
        <div className="flex items-center gap-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-white/60' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-400' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
            { label: 'No-Shows', value: stats.noShows, color: stats.noShows > 0 ? 'text-orange-400' : 'text-white/30' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[10px] text-white/25 uppercase tracking-wider">{s.label}</span>
              <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
          {loading && (
            <span className="text-[10px] text-white/20 italic flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading…
            </span>
          )}
        </div>
        {/* API status indicator */}
        <div className="flex items-center gap-2">
          {apiAvailable === true && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Live data
            </span>
          )}
          {apiAvailable === false && (
            <button
              onClick={async () => {
                await dispatchSchedulingTask({ action: 'setup_appointments_api' });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400/70 text-[10px] hover:text-amber-400 hover:bg-amber-500/15 transition-all"
              title="No appointment API detected — click to dispatch setup via AI"
            >
              <Sparkles className="h-3 w-3" />
              Schedule via AI
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar area */}
        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              appointments={appointments}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              appointments={appointments}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              appointments={appointments}
              onDayClick={handleMonthDayClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </div>

        {/* Upcoming sidebar */}
        <UpcomingSidebar
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
        />
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <AppointmentFormModal
          appointment={selectedAppointment}
          selectedDate={createDate}
          selectedTime={createTime}
          onSave={handleSave}
          onClose={() => { setModal('none'); setSelectedAppointment(null); }}
        />
      )}

      {modal === 'detail' && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => { setModal('none'); setSelectedAppointment(null); }}
          onEdit={() => setModal('create')}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
          onNoShow={handleNoShow}
        />
      )}

      {modal === 'availability' && (
        <AvailabilityModal
          availability={availability}
          blockedTimes={blockedTimes}
          onSave={(slots, blocked) => { setAvailability(slots); setBlockedTimes(blocked); }}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'booking-link' && (
        <BookingLinkModal onClose={() => setModal('none')} />
      )}

      {modal === 'integrations' && (
        <IntegrationsModal onClose={() => setModal('none')} />
      )}
    </div>
  );
}

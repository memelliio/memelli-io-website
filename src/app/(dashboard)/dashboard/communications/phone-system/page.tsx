'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  MessageSquare,
  Mail,
  Users,
  Clock,
  Activity,
  Headphones,
  Hash,
  Send,
  Paperclip,
  Star,
  StarOff,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronRight,
  Circle,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Plus,
  Wifi,
  WifiOff,
  Radio,
  Delete,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { API_URL } from '@/lib/config';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface CallRecord {
  id: string;
  direction: 'inbound' | 'outbound';
  contactName: string;
  phoneNumber: string;
  duration: number;
  status: string;
  createdAt: string;
  recordingUrl: string | null;
  transcript: string | null;
  sentiment: string | null;
  disposition: string | null;
  notes: string | null;
}

interface LiveCall {
  id: string;
  caller: string;
  callerNumber: string;
  agent: string;
  department: string;
  duration: number;
  status: 'ringing' | 'active' | 'hold' | 'conference' | 'transferring';
  startedAt: string;
  isMuted: boolean;
  isRecording: boolean;
}

interface QueueDepartment {
  id: string;
  name: string;
  callersWaiting: number;
  avgWait: number;
  agentsAvailable: number;
  agentsTotal: number;
  priority: 'normal' | 'high' | 'critical';
  longestWait: number;
}

interface SMSConversation {
  id: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: SMSMessage[];
}

interface SMSMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  hasAttachment: boolean;
}

interface Voicemail {
  id: string;
  caller: string;
  callerNumber: string;
  duration: number;
  timestamp: string;
  transcription: string;
  isRead: boolean;
  isPlaying: boolean;
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  leadListSize: number;
  callsMade: number;
  connects: number;
  voicemailDrops: number;
  agentCount: number;
  startedAt: string;
  conversionRate: number;
}

interface AgentStatus {
  id: string;
  name: string;
  avatar: string;
  status: 'available' | 'busy' | 'on_call' | 'break' | 'offline';
  currentCall: string | null;
  callsToday: number;
  avgHandleTime: number;
  department: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data for non-wired sections                                  */
/* ------------------------------------------------------------------ */

function generateQueues(): QueueDepartment[] {
  return [
    { id: 'q-sales', name: 'Sales', callersWaiting: Math.floor(Math.random() * 8), avgWait: Math.floor(Math.random() * 120) + 15, agentsAvailable: 3 + Math.floor(Math.random() * 3), agentsTotal: 8, priority: 'high', longestWait: Math.floor(Math.random() * 180) + 30 },
    { id: 'q-support', name: 'Support', callersWaiting: Math.floor(Math.random() * 12), avgWait: Math.floor(Math.random() * 90) + 10, agentsAvailable: 4 + Math.floor(Math.random() * 4), agentsTotal: 12, priority: 'normal', longestWait: Math.floor(Math.random() * 150) + 20 },
    { id: 'q-billing', name: 'Billing', callersWaiting: Math.floor(Math.random() * 5), avgWait: Math.floor(Math.random() * 60) + 5, agentsAvailable: 2 + Math.floor(Math.random() * 2), agentsTotal: 5, priority: 'normal', longestWait: Math.floor(Math.random() * 120) + 10 },
    { id: 'q-onboarding', name: 'Onboarding', callersWaiting: Math.floor(Math.random() * 3), avgWait: Math.floor(Math.random() * 45) + 5, agentsAvailable: 1 + Math.floor(Math.random() * 2), agentsTotal: 4, priority: 'critical', longestWait: Math.floor(Math.random() * 90) + 10 },
  ];
}

function generateSMSConversations(): SMSConversation[] {
  const contacts = [
    { name: 'John Smith', number: '+1 (951) 514-8821' },
    { name: 'Lisa Chen', number: '+1 (323) 445-2901' },
    { name: 'Acme Corp', number: '+1 (415) 329-7712' },
    { name: 'Robert Wilson', number: '+1 (602) 881-3345' },
    { name: 'Emily Davis', number: '+1 (718) 992-5567' },
  ];
  return contacts.map((c, i) => ({
    id: `sms-${i}`,
    contactName: c.name,
    contactNumber: c.number,
    lastMessage: ['Thanks for the info!', 'When is the appointment?', 'Confirmed for Tuesday', 'Please call me back', 'Got it, thanks'][i],
    lastMessageAt: new Date(Date.now() - i * 3600000).toISOString(),
    unread: i < 2 ? Math.floor(Math.random() * 4) + 1 : 0,
    messages: Array.from({ length: 5 + Math.floor(Math.random() * 5) }, (_, j) => ({
      id: `msg-${i}-${j}`,
      direction: (j % 2 === 0 ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
      body: [
        'Hi, I wanted to check on my application status.',
        'Sure! Let me pull that up for you. One moment.',
        'Take your time, no rush.',
        'Your application is currently in review. Should be completed by Friday.',
        'Perfect, thanks for the update!',
        'You\'re welcome! Let us know if you need anything else.',
        'Will do. Have a great day!',
        'Thanks for the info!',
        'When is the appointment?',
        'Confirmed for Tuesday',
      ][j % 10],
      timestamp: new Date(Date.now() - (10 - j) * 600000).toISOString(),
      status: 'delivered' as const,
      hasAttachment: j === 3,
    })),
  }));
}

function generateVoicemails(): Voicemail[] {
  const callers = ['Michael Brown', 'Sarah Johnson', 'Tech Solutions', 'Amanda Lee', 'Chris Taylor', 'Premium Lending'];
  return callers.map((c, i) => ({
    id: `vm-${i}`,
    caller: c,
    callerNumber: `+1 (${800 + i * 10})${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    duration: 15 + Math.floor(Math.random() * 120),
    timestamp: new Date(Date.now() - i * 7200000).toISOString(),
    transcription: [
      'Hi, this is Michael calling about my loan application. I had a few questions about the documentation requirements...',
      'Hello, Sarah here. Just wanted to confirm our meeting for Thursday at 2pm. Please call me back when you can.',
      'This is Tech Solutions calling regarding your service agreement renewal. We have some updated terms to discuss.',
      'Hi there, Amanda Lee from the partnership team. I wanted to follow up on our conversation from last week.',
      'Hey, Chris Taylor here. Need to reschedule our Friday call. Can you give me a ring when you get this?',
      'Premium Lending returning your call about the underwriting requirements. We have an update on the file.',
    ][i],
    isRead: i > 2,
    isPlaying: false,
  }));
}

function generateCampaigns(): Campaign[] {
  return [
    { id: 'camp-1', name: 'Q1 Lending Outreach', status: 'active', leadListSize: 2500, callsMade: 1847, connects: 423, voicemailDrops: 892, agentCount: 6, startedAt: '2026-03-10T08:00:00Z', conversionRate: 12.4 },
    { id: 'camp-2', name: 'Credit Repair Follow-Up', status: 'active', leadListSize: 800, callsMade: 342, connects: 156, voicemailDrops: 124, agentCount: 3, startedAt: '2026-03-12T09:00:00Z', conversionRate: 18.2 },
    { id: 'camp-3', name: 'Partner Recruitment', status: 'paused', leadListSize: 1200, callsMade: 678, connects: 234, voicemailDrops: 301, agentCount: 4, startedAt: '2026-03-08T08:00:00Z', conversionRate: 8.7 },
    { id: 'camp-4', name: 'Renewal Reminders', status: 'active', leadListSize: 450, callsMade: 450, connects: 312, voicemailDrops: 98, agentCount: 2, startedAt: '2026-03-01T08:00:00Z', conversionRate: 45.3 },
  ];
}

function generateAgents(): AgentStatus[] {
  const agents = [
    { name: 'Sarah Mitchell', dept: 'Sales' },
    { name: 'James Kim', dept: 'Sales' },
    { name: 'Lisa Rodriguez', dept: 'Support' },
    { name: 'David Park', dept: 'Support' },
    { name: 'Maria Garcia', dept: 'Billing' },
    { name: 'Tom Watson', dept: 'Sales' },
    { name: 'Amy Chen', dept: 'Support' },
    { name: 'Ryan Brooks', dept: 'Onboarding' },
    { name: 'Nicole Adams', dept: 'Sales' },
    { name: 'Kevin Moore', dept: 'Billing' },
  ];
  const statuses: AgentStatus['status'][] = ['available', 'on_call', 'busy', 'available', 'on_call', 'break', 'available', 'on_call', 'offline', 'available'];
  return agents.map((a, i) => ({
    id: `agent-${i}`,
    name: a.name,
    avatar: a.name.split(' ').map(n => n[0]).join(''),
    status: statuses[i],
    currentCall: statuses[i] === 'on_call' ? `+1 (${900 + i}xx) xxx-xxxx` : null,
    callsToday: Math.floor(Math.random() * 30) + 5,
    avgHandleTime: Math.floor(Math.random() * 180) + 60,
    department: a.dept,
  }));
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                       */
/* ------------------------------------------------------------------ */

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchCalls(page = 1, perPage = 50): Promise<{ data: CallRecord[]; meta: { total: number; page: number; perPage: number } }> {
  const res = await fetch(`${API_URL}/api/comms/calls?page=${page}&perPage=${perPage}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch calls: ${res.status}`);
  const json = await res.json();
  return json;
}

async function initiateCall(phoneNumber: string): Promise<CallRecord> {
  const res = await fetch(`${API_URL}/api/comms/calls`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      direction: 'OUTBOUND',
      toNumber: phoneNumber,
      fromNumber: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || 'system',
    }),
  });
  if (!res.ok) throw new Error(`Failed to initiate call: ${res.status}`);
  const json = await res.json();
  return json.data;
}

async function updateCall(id: string, patch: { status?: string; notes?: string; dispositionCode?: string }): Promise<CallRecord> {
  const res = await fetch(`${API_URL}/api/comms/calls/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update call: ${res.status}`);
  const json = await res.json();
  return json.data;
}

/* ------------------------------------------------------------------ */
/*  Map API CallRecord → LiveCall shape                               */
/* ------------------------------------------------------------------ */

function mapToLiveCall(r: CallRecord): LiveCall {
  const statusMap: Record<string, LiveCall['status']> = {
    'ringing': 'ringing',
    'in-progress': 'active',
    'in_progress': 'active',
    'on-hold': 'hold',
    'on_hold': 'hold',
    'conference': 'conference',
  };
  return {
    id: r.id,
    caller: r.contactName || r.phoneNumber,
    callerNumber: r.phoneNumber,
    agent: '—',
    department: '—',
    duration: r.duration ?? 0,
    status: statusMap[r.status] ?? 'ringing',
    startedAt: r.createdAt,
    isMuted: false,
    isRecording: !!r.recordingUrl,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Status Styling                                                    */
/* ------------------------------------------------------------------ */

const callStatusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  ringing: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
  active: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  hold: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400 animate-pulse' },
  conference: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  transferring: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary/70 animate-pulse' },
};

const agentStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Available' },
  busy: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Busy' },
  on_call: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'On Call' },
  break: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Break' },
  offline: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Offline' },
};

const priorityStyles: Record<string, { border: string; badge: string }> = {
  normal: { border: 'border-border', badge: 'bg-muted text-foreground' },
  high: { border: 'border-yellow-500/40', badge: 'bg-yellow-500/20 text-yellow-400' },
  critical: { border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-400' },
};

const outcomeStyle = (status: string) => {
  if (status === 'completed') return 'bg-green-500/10 text-green-400';
  if (status === 'voicemail') return 'bg-yellow-500/10 text-yellow-400';
  if (status === 'missed' || status === 'failed') return 'bg-red-500/10 text-red-400';
  return 'bg-muted text-foreground';
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

type TabKey = 'live' | 'queue' | 'dialer' | 'sms' | 'voicemail' | 'campaigns' | 'agents';

const tabs: { key: TabKey; label: string; icon: typeof Phone }[] = [
  { key: 'live', label: 'Live Calls', icon: Radio },
  { key: 'queue', label: 'Call Queue', icon: Users },
  { key: 'dialer', label: 'Dialer', icon: Phone },
  { key: 'sms', label: 'SMS Inbox', icon: MessageSquare },
  { key: 'voicemail', label: 'Voicemail', icon: Mail },
  { key: 'campaigns', label: 'Campaigns', icon: Zap },
  { key: 'agents', label: 'Agent Status', icon: Headphones },
];

export default function PhoneSystemPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('live');

  // --- Real API state ---
  const [allCalls, setAllCalls] = useState<CallRecord[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [callsMeta, setCallsMeta] = useState<{ total: number; page: number; perPage: number } | null>(null);

  // Dialer state
  const [dialerNumber, setDialerNumber] = useState('');
  const [dialerLoading, setDialerLoading] = useState(false);
  const [dialerError, setDialerError] = useState<string | null>(null);
  const [dialerSuccess, setDialerSuccess] = useState<string | null>(null);
  const [recentDials] = useState(['(951) 514-6019', '(323) 445-2901', '(415) 329-7712']);
  const [favorites] = useState(['Mel Briggs', 'Office Main', 'Support Line']);

  // Mock-only state (sections not wired to API)
  const [queues, setQueues] = useState<QueueDepartment[]>(generateQueues);
  const [smsConversations] = useState<SMSConversation[]>(generateSMSConversations);
  const [voicemails, setVoicemails] = useState<Voicemail[]>(generateVoicemails);
  const [campaigns] = useState<Campaign[]>(generateCampaigns);
  const [agents, setAgents] = useState<AgentStatus[]>(generateAgents);

  // SMS state
  const [selectedSMS, setSelectedSMS] = useState<string>(smsConversations[0]?.id ?? '');
  const [smsInput, setSmsInput] = useState('');

  // Voicemail state
  const [playingVoicemail, setPlayingVoicemail] = useState<string | null>(null);

  /* ---- Load calls from API ---- */
  const loadCalls = useCallback(async () => {
    try {
      const result = await fetchCalls(1, 50);
      setAllCalls(result.data ?? []);
      setCallsMeta(result.meta ?? null);
      setCallsError(null);
    } catch (err: any) {
      setCallsError(err.message ?? 'Failed to load calls');
    } finally {
      setCallsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  /* ---- Poll every 5s for live data ---- */
  useEffect(() => {
    const interval = setInterval(() => {
      loadCalls();
      setQueues(generateQueues());
      setAgents(generateAgents());
    }, 5000);
    return () => clearInterval(interval);
  }, [loadCalls]);

  /* ---- Derived views from real call data ---- */
  const liveStatuses = new Set(['ringing', 'in-progress', 'in_progress', 'on-hold', 'on_hold', 'conference']);
  const historicStatuses = new Set(['completed', 'missed', 'voicemail', 'failed']);

  const liveCalls: LiveCall[] = allCalls
    .filter(c => liveStatuses.has(c.status))
    .map(mapToLiveCall);

  const callHistory = allCalls.filter(c => historicStatuses.has(c.status));

  /* ---- Derived stats ---- */
  const activeCalls = liveCalls.filter(c => c.status === 'active' || c.status === 'conference').length;
  const callsToday = callsMeta?.total ?? 0;
  const avgWaitTime = Math.floor(queues.reduce((a, q) => a + q.avgWait, 0) / queues.length);
  const availableAgents = agents.filter(a => a.status === 'available').length;
  const pendingVoicemails = voicemails.filter(v => !v.isRead).length;
  const unreadSMS = smsConversations.reduce((a, c) => a + c.unread, 0);

  /* ---- Dialer ---- */
  const dialPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const handleDial = useCallback((digit: string) => {
    setDialerNumber(prev => prev + digit);
  }, []);

  const handleCall = useCallback(async () => {
    const number = dialerNumber.trim();
    if (!number) return;
    setDialerLoading(true);
    setDialerError(null);
    setDialerSuccess(null);
    try {
      const call = await initiateCall(number);
      setDialerSuccess(`Call initiated to ${number} (ID: ${call.id})`);
      setDialerNumber('');
      // Refresh call list to include the new ringing call
      await loadCalls();
    } catch (err: any) {
      setDialerError(err.message ?? 'Failed to place call');
    } finally {
      setDialerLoading(false);
    }
  }, [dialerNumber, loadCalls]);

  /* ---- End a live call via PATCH ---- */
  const handleEndCall = useCallback(async (callId: string) => {
    try {
      await updateCall(callId, { status: 'COMPLETED' });
      await loadCalls();
    } catch {
      // silently fail — UI will resync on next poll
    }
  }, [loadCalls]);

  const selectedConversation = smsConversations.find(c => c.id === selectedSMS);

  return (
    <div className="min-h-screen bg-card text-white">
      {/* ---- Header ---- */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Phone System</h1>
            <p className="text-sm text-muted-foreground mt-1">Telephony command center &mdash; calls, queues, SMS, voicemail, campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-green-400">
              <Wifi className="w-3.5 h-3.5" />
              Twilio Connected
            </span>
            <span className="flex items-center gap-2 text-xs text-green-400">
              <Activity className="w-3.5 h-3.5" />
              System Active
            </span>
          </div>
        </div>
      </div>

      {/* ---- Top Stats ---- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-4">
        {[
          { label: 'Active Calls', value: activeCalls, icon: PhoneCall, color: 'text-green-400', bgColor: 'bg-green-500/10' },
          { label: 'Calls Total', value: callsToday, icon: Phone, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
          { label: 'Avg Wait Time', value: `${avgWaitTime}s`, icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
          { label: 'Agents Available', value: `${availableAgents}/${agents.length}`, icon: Headphones, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
          { label: 'Voicemails', value: pendingVoicemails, icon: Mail, color: 'text-red-400', bgColor: 'bg-red-500/10' },
          { label: 'SMS Unread', value: unreadSMS, icon: MessageSquare, color: 'text-primary', bgColor: 'bg-primary/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div className={`${stat.bgColor} p-1.5 rounded`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ---- Tabs ---- */}
      <div className="px-6 border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-card text-red-400 border border-border border-b-zinc-900 -mb-px'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Tab Content ---- */}
      <div className="px-6 py-4">
        {/* ---------- LIVE CALLS ---------- */}
        {activeTab === 'live' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400 animate-pulse" />
                Live Calls ({liveCalls.length})
              </h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {callsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Auto-refreshing every 5s
              </span>
            </div>

            {callsError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {callsError}
              </div>
            )}

            {callsLoading && liveCalls.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading live calls...
              </div>
            ) : liveCalls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No active calls</div>
            ) : (
              liveCalls.map(call => {
                const style = callStatusStyles[call.status] ?? callStatusStyles['ringing'];
                return (
                  <div key={call.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                    {/* Status dot */}
                    <div className={`w-3 h-3 rounded-full ${style.dot} flex-shrink-0`} />

                    {/* Call info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{call.caller}</span>
                        <span className="text-xs text-muted-foreground">{call.callerNumber}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {call.agent !== '—' && <span>Agent: <span className="text-foreground">{call.agent}</span></span>}
                        {call.department !== '—' && <span>{call.department}</span>}
                        <span>{formatDuration(call.duration)}</span>
                        <span className="text-muted-foreground">{formatTime(call.startedAt)}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`px-2.5 py-1 rounded text-xs font-medium ${style.bg} ${style.text} capitalize`}>
                      {call.status}
                    </div>

                    {/* Recording indicator */}
                    {call.isRecording && (
                      <div className="flex items-center gap-1 text-xs text-red-400">
                        <Circle className="w-2 h-2 fill-red-400 animate-pulse" />
                        REC
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-blue-400 transition-colors" title="Transfer">
                        <PhoneForwarded className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-yellow-400 transition-colors" title="Hold">
                        <Pause className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-orange-400 transition-colors" title={call.isMuted ? 'Unmute' : 'Mute'}>
                        {call.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Barge">
                        <Users className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-cyan-400 transition-colors" title="Whisper">
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEndCall(call.id)}
                        className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors"
                        title="End Call"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------- CALL QUEUE ---------- */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Queue Status by Department
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queues.map(queue => {
                const pStyle = priorityStyles[queue.priority];
                return (
                  <div key={queue.id} className={`bg-card border ${pStyle.border} rounded-lg p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{queue.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${pStyle.badge} uppercase`}>
                        {queue.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Waiting</div>
                        <div className={`text-2xl font-bold ${queue.callersWaiting > 5 ? 'text-red-400' : queue.callersWaiting > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {queue.callersWaiting}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Avg Wait</div>
                        <div className="text-2xl font-bold text-foreground">{queue.avgWait}s</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Agents</div>
                        <div className="text-2xl font-bold">
                          <span className="text-green-400">{queue.agentsAvailable}</span>
                          <span className="text-muted-foreground">/{queue.agentsTotal}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>Longest wait: {formatDuration(queue.longestWait)}</span>
                      <span className={queue.agentsAvailable < 2 ? 'text-red-400' : 'text-muted-foreground'}>
                        {queue.agentsAvailable < 2 ? 'Low coverage' : 'Adequate coverage'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- DIALER ---------- */}
        {activeTab === 'dialer' && (
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
              <Phone className="w-5 h-5 text-green-400" />
              Click-to-Call Dialer
            </h2>

            {/* Number display */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dialerNumber}
                  onChange={(e) => setDialerNumber(e.target.value)}
                  placeholder="Enter phone number..."
                  className="flex-1 bg-transparent text-2xl font-mono text-center outline-none placeholder:text-muted-foreground"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCall(); }}
                />
                {dialerNumber && (
                  <button onClick={() => setDialerNumber(prev => prev.slice(0, -1))} className="p-2 text-muted-foreground hover:text-red-400">
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dial pad */}
            <div className="grid grid-cols-3 gap-2">
              {dialPad.map(digit => (
                <button
                  key={digit}
                  onClick={() => handleDial(digit)}
                  className="bg-card border border-border rounded-lg py-4 text-xl font-semibold hover:bg-muted hover:border-border transition-colors active:bg-muted"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Status messages */}
            {dialerError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {dialerError}
              </div>
            )}
            {dialerSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {dialerSuccess}
              </div>
            )}

            {/* Call button */}
            <button
              onClick={handleCall}
              disabled={!dialerNumber.trim() || dialerLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {dialerLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Calling...</>
              ) : (
                <><Phone className="w-5 h-5" /> Call</>
              )}
            </button>

            {/* Recent & Favorites */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent</h3>
                <div className="space-y-1">
                  {recentDials.map(num => (
                    <button
                      key={num}
                      onClick={() => setDialerNumber(num.replace(/\D/g, ''))}
                      className="w-full text-left px-3 py-2 rounded text-sm text-muted-foreground hover:bg-card hover:text-white transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Favorites</h3>
                <div className="space-y-1">
                  {favorites.map(name => (
                    <button
                      key={name}
                      className="w-full text-left px-3 py-2 rounded text-sm text-muted-foreground hover:bg-card hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Star className="w-3 h-3 text-yellow-400" />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- SMS INBOX ---------- */}
        {activeTab === 'sms' && (
          <div className="flex gap-4 h-[600px]">
            {/* Contact list */}
            <div className="w-80 bg-card border border-border rounded-lg flex flex-col">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full bg-muted rounded-lg pl-9 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {smsConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedSMS(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors ${
                      selectedSMS === conv.id ? 'bg-muted border-l-2 border-l-red-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{conv.contactName}</span>
                      {conv.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{conv.contactNumber}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">{conv.lastMessage}</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatTimeAgo(conv.lastMessageAt)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-card border border-border rounded-lg flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{selectedConversation.contactName}</div>
                      <div className="text-xs text-muted-foreground">{selectedConversation.contactNumber}</div>
                    </div>
                    <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-green-400" title="Call">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedConversation.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          msg.direction === 'outbound'
                            ? 'bg-red-600/20 text-red-100 border border-red-500/20'
                            : 'bg-muted text-foreground border border-border'
                        }`}>
                          <p className="text-sm">{msg.body}</p>
                          {msg.hasAttachment && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Paperclip className="w-3 h-3" />
                              Attachment
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">{formatTime(msg.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Attach">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={smsInput}
                        onChange={(e) => setSmsInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-red-500/50"
                      />
                      <button className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors" title="Send">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- VOICEMAIL ---------- */}
        {activeTab === 'voicemail' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-400" />
              Voicemail ({voicemails.length})
              {pendingVoicemails > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingVoicemails} new</span>
              )}
            </h2>
            {voicemails.map(vm => (
              <div
                key={vm.id}
                className={`bg-card border rounded-lg p-4 ${
                  vm.isRead ? 'border-border' : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Caller info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${!vm.isRead ? 'text-white' : 'text-foreground'}`}>{vm.caller}</span>
                      {!vm.isRead && <Circle className="w-2 h-2 fill-red-400 text-red-400" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{vm.callerNumber}</div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{vm.transcription}</p>
                  </div>

                  {/* Meta */}
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className="text-xs text-muted-foreground">{formatTimeAgo(vm.timestamp)}</div>
                    <div className="text-xs text-muted-foreground">{formatDuration(vm.duration)}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setPlayingVoicemail(playingVoicemail === vm.id ? null : vm.id)}
                      className={`p-2 rounded hover:bg-muted transition-colors ${
                        playingVoicemail === vm.id ? 'text-red-400' : 'text-muted-foreground hover:text-white'
                      }`}
                      title={playingVoicemail === vm.id ? 'Stop' : 'Play'}
                    >
                      {playingVoicemail === vm.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-green-400 transition-colors" title="Callback">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setVoicemails(prev => prev.map(v => v.id === vm.id ? { ...v, isRead: !v.isRead } : v))}
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-blue-400 transition-colors"
                      title={vm.isRead ? 'Mark Unread' : 'Mark Read'}
                    >
                      {vm.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Playing indicator */}
                {playingVoicemail === vm.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="bg-red-500 rounded-full h-1.5 w-1/3 animate-pulse" />
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDuration(vm.duration)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ---------- CAMPAIGNS ---------- */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Calling Campaigns
              </h2>
              <button className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{camp.name}</h3>
                    <span className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${
                      camp.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      camp.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{camp.callsMade} / {camp.leadListSize} calls</span>
                      <span>{Math.round((camp.callsMade / camp.leadListSize) * 100)}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div
                        className="bg-red-500 rounded-full h-2 transition-all"
                        style={{ width: `${(camp.callsMade / camp.leadListSize) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Leads</div>
                      <div className="text-lg font-bold text-foreground">{camp.leadListSize.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Connects</div>
                      <div className="text-lg font-bold text-green-400">{camp.connects}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">VM Drops</div>
                      <div className="text-lg font-bold text-yellow-400">{camp.voicemailDrops}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Agents</div>
                      <div className="text-lg font-bold text-blue-400">{camp.agentCount}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversion: <span className="text-red-400 font-medium">{camp.conversionRate}%</span></span>
                    <span className="text-muted-foreground">Started {formatTimeAgo(camp.startedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- AGENT STATUS ---------- */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-400" />
                Agent Roster ({agents.length})
              </h2>
              <div className="flex items-center gap-3 text-xs">
                {Object.entries(agentStatusStyles).map(([key, style]) => (
                  <span key={key} className="flex items-center gap-1">
                    <Circle className={`w-2 h-2 fill-current ${style.text}`} />
                    <span className="text-muted-foreground">{style.label}: {agents.filter(a => a.status === key).length}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {agents.map(agent => {
                const style = agentStatusStyles[agent.status];
                return (
                  <div key={agent.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${style.bg} ${style.text}`}>
                        {agent.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.department}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>

                    {agent.currentCall && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 rounded px-2 py-1.5">
                        <PhoneCall className="w-3 h-3" />
                        {agent.currentCall}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                      <span>Calls today: <span className="text-foreground font-medium">{agent.callsToday}</span></span>
                      <span>Avg handle: <span className="text-foreground font-medium">{formatDuration(agent.avgHandleTime)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---- Bottom: Recent Call Log (real data) ---- */}
      <div className="px-6 pb-6">
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Recent Call Log ({callHistory.length} completed)
            </h2>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {callsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Live data
            </span>
          </div>

          {callsLoading && callHistory.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading call history...
            </div>
          ) : callHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No completed calls yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5 font-medium">Time</th>
                    <th className="text-left px-4 py-2.5 font-medium">Dir</th>
                    <th className="text-left px-4 py-2.5 font-medium">Contact</th>
                    <th className="text-left px-4 py-2.5 font-medium">Duration</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium">Notes</th>
                    <th className="text-left px-4 py-2.5 font-medium">Recording</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.slice(0, 50).map((entry, i) => (
                    <tr key={entry.id} className={`border-b border-border hover:bg-muted transition-colors ${i % 2 === 0 ? '' : 'bg-card'}`}>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatTime(entry.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        {entry.direction === 'inbound' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-400" />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{entry.contactName}</div>
                        <div className="text-xs text-muted-foreground">{entry.phoneNumber}</div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono">{formatDuration(entry.duration ?? 0)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${outcomeStyle(entry.status)}`}>
                          {entry.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate">
                        {entry.notes ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {entry.recordingUrl ? (
                          <a
                            href={entry.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors inline-block"
                            title="Play Recording"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

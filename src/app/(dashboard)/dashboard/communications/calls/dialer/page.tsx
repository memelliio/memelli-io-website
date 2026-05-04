'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  ArrowRightLeft,
  Circle,
  Delete,
  Search,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface RecentCall {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  createdAt: string;
}

interface ContactResult {
  id: string;
  name: string;
  phone: string;
}

const dialPad = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DialerPage() {
  const api = useApi();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const { data: recentCalls, isLoading: recentsLoading } = useQuery<RecentCall[]>({
    queryKey: ['recent-calls'],
    queryFn: async () => {
      const res = await api.get<{ data: RecentCall[]; meta: any }>(
        '/api/comms/calls?perPage=10'
      );
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? [];
    },
  });

  const { data: contactResults } = useQuery<ContactResult[]>({
    queryKey: ['contact-search', contactSearch],
    queryFn: async () => {
      const res = await api.get<ContactResult[]>(
        `/api/contacts/search?q=${encodeURIComponent(contactSearch)}&hasPhone=true`
      );
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
    },
    enabled: contactSearch.length >= 2,
  });

  const dialMutation = useMutation({
    mutationFn: async (number: string) => {
      const res = await api.post('/api/comms/calls/dial', {
        phoneNumber: number,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setIsInCall(true);
      toast.success('Call initiated');
    },
    onError: (err) => {
      toast.error(`Failed to dial: ${err.message}`);
    },
  });

  const handleDigit = useCallback((digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleDial = useCallback(() => {
    if (!phoneNumber.trim()) {
      toast.error('Enter a phone number');
      return;
    }
    dialMutation.mutate(phoneNumber);
  }, [phoneNumber, dialMutation]);

  const handleHangup = useCallback(() => {
    setIsInCall(false);
    setIsMuted(false);
    setIsOnHold(false);
    setIsRecording(false);
    setCallDuration(0);
    toast.info('Call ended');
  }, []);

  const handleContactSelect = useCallback((contact: ContactResult) => {
    setPhoneNumber(contact.phone);
    setContactSearch('');
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader
        title="Dialer"
        subtitle="Make and manage phone calls"
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Calls', href: '/dashboard/communications/calls' },
          { label: 'Dialer' },
        ]}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dialer Pad */}
        <div className="lg:col-span-1">
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            {/* Phone number display */}
            <div className="flex items-center gap-2 mb-6">
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter number..."
                className="text-center text-xl font-mono tracking-wider"
              />
              {phoneNumber && (
                <button
                  onClick={handleBackspace}
                  className="rounded-xl p-2 text-white/40 hover:bg-white/[0.04] hover:text-white/80 transition-all duration-200"
                >
                  <Delete className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Dial pad grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {dialPad.map(({ digit, letters }) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  disabled={isInCall}
                  className="flex flex-col items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08] active:bg-white/[0.08] transition-all duration-200 py-4 disabled:opacity-40 disabled:pointer-events-none backdrop-blur-xl"
                >
                  <span className="text-xl font-semibold text-white/90">{digit}</span>
                  {letters && (
                    <span className="text-[10px] text-white/30 tracking-widest mt-0.5">
                      {letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Dial / Hangup button */}
            {isInCall ? (
              <button
                onClick={handleHangup}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-semibold tracking-tight py-4 transition-all duration-200"
              >
                <PhoneOff className="h-5 w-5" />
                End Call
              </button>
            ) : (
              <button
                onClick={handleDial}
                disabled={!phoneNumber.trim() || dialMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-semibold tracking-tight py-4 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Phone className="h-5 w-5" />
                {dialMutation.isPending ? 'Dialing...' : 'Call'}
              </button>
            )}

            {/* In-call controls */}
            {isInCall && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                <button
                  onClick={() => setIsMuted((v) => !v)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-all duration-200 ${
                    isMuted
                      ? 'bg-primary/80/15 text-primary border border-primary/20'
                      : 'bg-white/[0.03] border border-white/[0.04] text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span className="text-[10px]">Mute</span>
                </button>
                <button
                  onClick={() => setIsOnHold((v) => !v)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-all duration-200 ${
                    isOnHold
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'bg-white/[0.03] border border-white/[0.04] text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span className="text-[10px]">Hold</span>
                </button>
                <button
                  onClick={() => toast.info('Transfer feature coming soon')}
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.03] border border-white/[0.04] py-3 text-white/40 hover:bg-white/[0.06] transition-all duration-200"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span className="text-[10px]">Transfer</span>
                </button>
                <button
                  onClick={() => setIsRecording((v) => !v)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-all duration-200 ${
                    isRecording
                      ? 'bg-primary/80/15 text-primary border border-primary/20'
                      : 'bg-white/[0.03] border border-white/[0.04] text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <Circle className={`h-4 w-4 ${isRecording ? 'fill-current' : ''}`} />
                  <span className="text-[10px]">Record</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Contact Search + Recent Calls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Search */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-white/30" />
              Contact Search
            </h3>
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts by name or phone..."
            />
            {contactResults && contactResults.length > 0 && (
              <div className="mt-3 divide-y divide-white/[0.04] max-h-48 overflow-y-auto rounded-xl border border-white/[0.04]">
                {contactResults.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-white/[0.04] transition-all duration-200 text-left"
                  >
                    <span className="text-sm font-medium text-white/90">{contact.name}</span>
                    <span className="text-sm text-white/40 font-mono">{contact.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Calls */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
              <Clock className="h-4 w-4 text-white/30" />
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Recent Calls</h3>
            </div>
            {recentsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : !recentCalls || recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <Phone className="h-6 w-6 mb-2 text-white/10" />
                <p className="text-sm">No recent calls</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentCalls.map((call) => {
                  const DirIcon =
                    call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing;
                  return (
                    <button
                      key={call.id}
                      onClick={() => setPhoneNumber(call.phoneNumber)}
                      className="flex items-center gap-4 w-full px-5 py-3 hover:bg-white/[0.04] transition-all duration-200 text-left"
                    >
                      <DirIcon
                        className={`h-4 w-4 ${
                          call.direction === 'inbound'
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">
                          {call.contactName}
                        </p>
                        <p className="text-xs text-white/30 font-mono">
                          {call.phoneNumber}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/30">
                          {formatDuration(call.duration)}
                        </p>
                        <p className="text-xs text-white/20">
                          {new Date(call.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

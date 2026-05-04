// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MessageSquare,
  Users,
  Circle,
  PhoneOff,
  Copy,
  Check,
  X,
  Plus,
  Send,
  Calendar,
  Link2,
  Clock,
  Sparkles,
  User,
  Settings,
  Volume2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { API_URL } from '@/lib/config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  role: string;
  status: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  // WebRTC peer connection (local only, not serialised)
  peerConnection?: RTCPeerConnection;
  stream?: MediaStream;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

interface RoomInfo {
  roomId: string;
  name: string;
  status: string;
  provider: string;
  participantId: string;
}

type MeetingView = 'lobby' | 'meeting';
type SidePanel = 'none' | 'chat' | 'participants';
type VideoLayout = 'grid' | 'screen-share';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Request failed');
  return data.data as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Request failed');
  return data.data as T;
}

/* ------------------------------------------------------------------ */
/*  Toolbar Button                                                     */
/* ------------------------------------------------------------------ */

function ToolbarButton({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onClick,
  badge,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200
          ${disabled ? 'opacity-40 cursor-not-allowed bg-white/[0.04] text-white/30' :
            danger
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300'
              : active
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
          }
        `}
      >
        <Icon className="h-5 w-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-background border border-white/10 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-black/90" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Participant Tile                                                   */
/* ------------------------------------------------------------------ */

function ParticipantTile({
  participant,
  large = false,
  videoRef,
}: {
  participant: Participant;
  large?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
}) {
  const isSpeaking = participant.status === 'speaking';
  const isMuted = !participant.audioEnabled;
  const isCameraOff = !participant.videoEnabled;

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden bg-white/[0.03] border transition-all duration-200
        ${isSpeaking ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-white/[0.06]'}
        ${large ? 'aspect-video' : 'aspect-video'}
      `}
    >
      {/* Live video element */}
      {videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.role === 'host' || participant.userId === 'self'}
          className={`absolute inset-0 w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
        />
      )}

      {/* Camera off / no stream fallback */}
      {(isCameraOff || !videoRef) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className={`rounded-full bg-white/[0.08] flex items-center justify-center font-semibold text-white/60 ${large ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg'}`}>
            {getInitials(participant.displayName)}
          </div>
          <span className="mt-2 text-sm text-white/40">{participant.displayName}</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-background backdrop-blur-sm text-white/90 text-xs font-medium">
          {participant.displayName}{participant.role === 'host' ? ' (Host)' : ''}
        </span>
        {isMuted && (
          <span className="w-6 h-6 rounded-lg bg-red-500/30 flex items-center justify-center">
            <MicOff className="h-3 w-3 text-red-400" />
          </span>
        )}
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 backdrop-blur-sm">
            <Volume2 className="h-3 w-3 text-red-400" />
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-red-400 rounded-full animate-pulse" />
              <div className="w-0.5 h-2 bg-red-400 rounded-full animate-pulse [animation-delay:100ms]" />
              <div className="w-0.5 h-4 bg-red-400 rounded-full animate-pulse [animation-delay:200ms]" />
            </div>
          </div>
        </div>
      )}

      {/* Screen share indicator */}
      {participant.screenSharing && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/20 backdrop-blur-sm">
          <Monitor className="h-3 w-3 text-blue-400" />
          <span className="text-xs text-blue-400">Sharing</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Schedule Meeting Modal                                             */
/* ------------------------------------------------------------------ */

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [invitees, setInvitees] = useState<string[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const addInvitee = () => {
    if (emailInput.trim() && emailInput.includes('@')) {
      setInvitees((prev) => [...prev, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const removeInvitee = (email: string) => {
    setInvitees((prev) => prev.filter((e) => e !== email));
  };

  const generateLink = () => {
    const id = Math.random().toString(36).substring(2, 10);
    setGeneratedLink(`https://universe.memelli.com/meeting/${id}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Schedule Meeting</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Meeting Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Standup"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-sm text-white/50 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Participants</label>
            <div className="flex gap-2">
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInvitee()}
                placeholder="email@example.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
              <button
                onClick={addInvitee}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.1] hover:text-white transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {invitees.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {invitees.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs text-white/70">
                    {email}
                    <button onClick={() => removeInvitee(email)} className="text-white/30 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={generateLink}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all"
            >
              <Link2 className="h-4 w-4" />
              Generate Meeting Link
            </button>
            {generatedLink && (
              <div className="mt-2 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="flex-1 text-sm text-white/60 truncate font-mono">{generatedLink}</span>
                <button
                  onClick={copyLink}
                  className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pre-Meeting Lobby                                                  */
/* ------------------------------------------------------------------ */

function MeetingLobby({
  onJoin,
  onSchedule,
}: {
  onJoin: (name: string, roomCode: string, audioOnly: boolean) => void;
  onSchedule: () => void;
}) {
  const [name, setName] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [meetingCode, setMeetingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [webrtcAvailable, setWebrtcAvailable] = useState(true);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Check WebRTC availability
  useEffect(() => {
    const hasWebRTC = !!(
      typeof window !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia &&
      window.RTCPeerConnection
    );
    setWebrtcAvailable(hasWebRTC);
  }, []);

  // Request camera/mic preview
  useEffect(() => {
    if (!webrtcAvailable || !cameraOn) {
      previewStream?.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
      return;
    }

    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: cameraOn, audio: micOn })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        setPreviewStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setWebrtcAvailable(false);
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn, webrtcAvailable]);

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Toggle mic tracks
  useEffect(() => {
    previewStream?.getAudioTracks().forEach((t) => { t.enabled = micOn; });
  }, [micOn, previewStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewStream?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    // Stop preview stream — we'll get a fresh one in the meeting
    previewStream?.getTracks().forEach((t) => t.stop());
    onJoin(name.trim(), meetingCode.trim(), !webrtcAvailable);
  };

  const copyCurrentLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/communications/meeting`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Camera Preview */}
        <div className="space-y-4">
          <div className="aspect-video rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden relative">
            {/* Live preview video */}
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${!cameraOn || !webrtcAvailable ? 'hidden' : ''}`}
            />

            {/* Camera off or unavailable fallback */}
            {(!cameraOn || !webrtcAvailable) && (
              cameraOn && !webrtcAvailable ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    <AlertCircle className="h-9 w-9 text-amber-400/60" />
                  </div>
                  <span className="text-sm text-white/40">Camera unavailable</span>
                  <span className="text-xs text-amber-400/60 mt-1">Audio-only fallback will be used</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-white/30" />
                  </div>
                  <span className="mt-3 text-sm text-white/30">Camera is off</span>
                </div>
              )
            )}

            {/* Device controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={() => setCameraOn(!cameraOn)}
                disabled={!webrtcAvailable}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  !webrtcAvailable ? 'opacity-40 cursor-not-allowed bg-white/[0.04] text-white/30' :
                  cameraOn ? 'bg-white/[0.1] text-white' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setMicOn(!micOn)}
                disabled={!webrtcAvailable}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  !webrtcAvailable ? 'opacity-40 cursor-not-allowed bg-white/[0.04] text-white/30' :
                  micOn ? 'bg-white/[0.1] text-white' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Device status */}
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cameraOn && webrtcAvailable ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Camera {cameraOn && webrtcAvailable ? 'on' : 'off'}
            </span>
            <span className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${micOn && webrtcAvailable ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Microphone {micOn && webrtcAvailable ? 'on' : 'off'}
            </span>
            {!webrtcAvailable && (
              <span className="flex items-center gap-1.5 text-amber-400/70">
                <AlertCircle className="h-3 w-3" />
                Audio-only mode
              </span>
            )}
          </div>
        </div>

        {/* Join Form */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Join Meeting</h1>
            <p className="text-sm text-white/40">Enter your name and configure your devices</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleJoin()}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/50 mb-1.5">Room Code (leave empty to create new)</label>
              <input
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="room_xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm font-mono focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!name.trim() || loading}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-white/[0.06] disabled:text-white/20 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
              ) : (
                <><Video className="h-4 w-4" /> {meetingCode ? 'Join Meeting' : 'Start New Meeting'}</>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-white/[0.06]" />
              <span className="text-xs text-white/30">or</span>
              <div className="flex-1 border-t border-white/[0.06]" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onSchedule}
                className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Schedule
              </button>
              <button
                onClick={copyCurrentLink}
                className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function MeetingPage() {
  const [view, setView] = useState<MeetingView>('lobby');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [userName, setUserName] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiNotes, setAiNotes] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [duration, setDuration] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [connectError, setConnectError] = useState('');

  // WebRTC refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const signalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---- Duration timer ---- */
  useEffect(() => {
    if (view !== 'meeting') return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [view]);

  /* ---- Scroll chat to bottom ---- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---- Track unread messages ---- */
  useEffect(() => {
    if (sidePanel === 'chat') setUnreadMessages(0);
  }, [sidePanel]);

  /* ---- Cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Helpers ---- */
  function cleanup() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    if (signalPollRef.current) clearInterval(signalPollRef.current);
    if (roomPollRef.current) clearInterval(roomPollRef.current);
  }

  /* ---- Fetch room participants ---- */
  const fetchParticipants = useCallback(async (roomId: string) => {
    try {
      const room = await apiGet<{
        participants: Participant[];
        chatMessages: Array<{ id: string; displayName: string; text: string; timestamp: string }>;
      }>(`/api/admin/video/room/${roomId}`);

      setParticipants(room.participants);

      // Sync chat messages from backend
      if (room.chatMessages?.length) {
        const mapped = room.chatMessages.map((m) => ({
          id: m.id,
          sender: m.displayName,
          text: m.text,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mapped);
      }
    } catch {
      // Non-fatal — just skip this poll
    }
  }, []);

  /* ---- WebRTC: create peer connection for a remote participant ---- */
  const createPeerConnection = useCallback(
    async (remoteParticipantId: string, currentRoomId: string, currentParticipantId: string) => {
      if (peerConnectionsRef.current.has(remoteParticipantId)) return;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnectionsRef.current.set(remoteParticipantId, pc);

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // ICE candidates
      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;
        try {
          await apiPost(`/api/admin/video/room/${currentRoomId}/signal`, {
            fromParticipantId: currentParticipantId,
            toParticipantId: remoteParticipantId,
            type: 'ice_candidate',
            payload: { candidate: event.candidate },
          });
        } catch {
          // best effort
        }
      };

      // Connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(remoteParticipantId);
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await apiPost(`/api/admin/video/room/${currentRoomId}/signal`, {
        fromParticipantId: currentParticipantId,
        toParticipantId: remoteParticipantId,
        type: 'offer',
        payload: { sdp: offer.sdp, type: offer.type },
      });
    },
    []
  );

  /* ---- WebRTC: poll + handle signals ---- */
  const pollSignals = useCallback(
    async (currentRoomId: string, currentParticipantId: string) => {
      try {
        const signals = await apiGet<Array<{
          id: string;
          type: string;
          fromParticipantId: string;
          payload: Record<string, unknown>;
        }>>(`/api/admin/video/room/${currentRoomId}/signals?participantId=${currentParticipantId}`);

        for (const signal of signals) {
          const from = signal.fromParticipantId;
          if (from === currentParticipantId) continue;

          if (signal.type === 'offer') {
            let pc = peerConnectionsRef.current.get(from);
            if (!pc) {
              pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
              peerConnectionsRef.current.set(from, pc);
              localStreamRef.current?.getTracks().forEach((t) => pc!.addTrack(t, localStreamRef.current!));
              pc.onicecandidate = async (ev) => {
                if (!ev.candidate) return;
                await apiPost(`/api/admin/video/room/${currentRoomId}/signal`, {
                  fromParticipantId: currentParticipantId,
                  toParticipantId: from,
                  type: 'ice_candidate',
                  payload: { candidate: ev.candidate },
                }).catch(() => {});
              };
            }
            await pc.setRemoteDescription({ type: signal.payload.type as RTCSdpType, sdp: signal.payload.sdp as string });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await apiPost(`/api/admin/video/room/${currentRoomId}/signal`, {
              fromParticipantId: currentParticipantId,
              toParticipantId: from,
              type: 'answer',
              payload: { sdp: answer.sdp, type: answer.type },
            });
          } else if (signal.type === 'answer') {
            const pc = peerConnectionsRef.current.get(from);
            if (pc && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription({ type: 'answer', sdp: signal.payload.sdp as string });
            }
          } else if (signal.type === 'ice_candidate') {
            const pc = peerConnectionsRef.current.get(from);
            if (pc) {
              await pc.addIceCandidate(signal.payload.candidate as RTCIceCandidateInit);
            }
          }
        }
      } catch {
        // Non-fatal
      }
    },
    []
  );

  /* ---- Join flow ---- */
  const handleJoin = useCallback(
    async (name: string, roomCode: string, audioOnlyMode: boolean) => {
      setConnectError('');
      setAudioOnly(audioOnlyMode);
      setUserName(name);

      try {
        // Step 1: Acquire local media
        let stream: MediaStream | null = null;
        if (!audioOnlyMode) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch {
            // Degrade gracefully to audio-only
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
              setAudioOnly(true);
            } catch {
              setAudioOnly(true);
            }
          }
        } else {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } catch {
            // No audio either — proceed without
          }
        }

        if (stream) {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }

        // Step 2: Create or join room via API
        let roomId = roomCode;
        let participantId: string;
        let roomName: string;
        let provider: string;

        if (!roomId) {
          // Create new room
          const created = await apiPost<{ roomId: string; name: string; status: string; provider: string }>(
            '/api/admin/video/room',
            { name: `${name}'s Meeting` }
          );
          roomId = created.roomId;
          roomName = created.name;
          provider = created.provider;
        } else {
          const existing = await apiGet<{ roomId: string; name: string; status: string; provider: string }>(
            `/api/admin/video/room/${roomId}`
          );
          roomName = existing.name;
          provider = existing.provider;
        }

        // Step 3: Join the room
        const joinResult = await apiPost<{
          participantId: string;
          roomId: string;
          status: string;
          participants: Participant[];
        }>(`/api/admin/video/room/${roomId}/join`, {
          displayName: name,
          role: 'participant',
        });

        participantId = joinResult.participantId;

        // Add self to participant list
        const selfParticipant: Participant = {
          id: participantId,
          userId: 'self',
          displayName: name,
          role: 'host',
          status: 'connected',
          audioEnabled: stream ? stream.getAudioTracks().some((t) => t.enabled) : false,
          videoEnabled: stream ? stream.getVideoTracks().some((t) => t.enabled) : false,
          screenSharing: false,
        };

        const remoteParticipants = joinResult.participants.filter((p) => p.id !== participantId);
        setParticipants([selfParticipant, ...remoteParticipants]);

        setRoomInfo({ roomId, name: roomName, status: joinResult.status, provider, participantId });
        setView('meeting');

        // Step 4: Initiate WebRTC with existing participants
        if (!audioOnlyMode && stream) {
          for (const rp of remoteParticipants) {
            createPeerConnection(rp.id, roomId, participantId);
          }

          // Poll signals every 2s
          signalPollRef.current = setInterval(() => {
            pollSignals(roomId, participantId);
          }, 2000);
        }

        // Step 5: Poll room state for new participants
        roomPollRef.current = setInterval(() => {
          fetchParticipants(roomId);
        }, 5000);
      } catch (err: any) {
        setConnectError(err.message ?? 'Failed to connect to meeting');
      }
    },
    [createPeerConnection, pollSignals, fetchParticipants]
  );

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: userName || 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput('');
    // Increment unread if chat is not open
    if (sidePanel !== 'chat') setUnreadMessages((n) => n + 1);
  }, [chatInput, userName, sidePanel]);

  const toggleSidePanel = useCallback((panel: 'chat' | 'participants') => {
    setSidePanel((prev) => (prev === panel ? 'none' : panel));
    if (panel === 'chat') setUnreadMessages(0);
  }, []);

  const handleToggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = next; });

    if (roomInfo) {
      apiPost(`/api/admin/video/room/${roomInfo.roomId}/signal`, {
        fromParticipantId: roomInfo.participantId,
        type: next ? 'unmute' : 'mute',
        payload: {},
      }).catch(() => {});
    }
  }, [micOn, roomInfo]);

  const handleToggleCamera = useCallback(() => {
    const next = !cameraOn;
    setCameraOn(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next; });
  }, [cameraOn]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share — restore camera
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        localStreamRef.current?.addTrack(camTrack);
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
      } catch { /* ignore */ }
      setIsScreenSharing(false);
      if (roomInfo) {
        apiPost(`/api/admin/video/room/${roomInfo.roomId}/signal`, {
          fromParticipantId: roomInfo.participantId,
          type: 'screen_share_stop',
          payload: {},
        }).catch(() => {});
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => setIsScreenSharing(false);
        setIsScreenSharing(true);
        if (roomInfo) {
          apiPost(`/api/admin/video/room/${roomInfo.roomId}/signal`, {
            fromParticipantId: roomInfo.participantId,
            type: 'screen_share_start',
            payload: {},
          }).catch(() => {});
        }
      } catch { /* user denied */ }
    }
  }, [isScreenSharing, roomInfo]);

  const handleLeave = useCallback(async () => {
    if (roomInfo) {
      try {
        await apiPost(`/api/admin/video/room/${roomInfo.roomId}/leave`, {
          participantId: roomInfo.participantId,
        });
      } catch { /* best effort */ }
    }
    cleanup();
    setView('lobby');
    setDuration(0);
    setIsRecording(false);
    setIsScreenSharing(false);
    setAiNotes(false);
    setSidePanel('none');
    setRoomInfo(null);
    setParticipants([]);
    setMessages([]);
  }, [roomInfo]);

  const copyRoomLink = useCallback(() => {
    if (!roomInfo) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/dashboard/communications/meeting?room=${roomInfo.roomId}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [roomInfo]);

  const videoLayout: VideoLayout = isScreenSharing ? 'screen-share' : 'grid';
  const participantCount = participants.length;
  const gridCols =
    participantCount <= 1 ? 1 :
    participantCount <= 4 ? 2 :
    3;

  /* ---- Lobby ---- */
  if (view === 'lobby') {
    return (
      <>
        <MeetingLobby onJoin={handleJoin} onSchedule={() => setShowScheduleModal(true)} />
        {connectError && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-sm text-red-400 shadow-xl z-50">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {connectError}
          </div>
        )}
        {showScheduleModal && <ScheduleModal onClose={() => setShowScheduleModal(false)} />}
      </>
    );
  }

  /* ---- Meeting Room ---- */
  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col bg-[#0a0a0e]">
      {/* Hidden local video element for WebRTC */}
      <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />

      {/* Meeting Info Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-white">{roomInfo?.name ?? 'Meeting Room'}</h2>
          <div className="flex items-center gap-1.5 text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-mono tabular-nums">{formatTimer(duration)}</span>
          </div>
          {audioOnly && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <MicOff className="h-2.5 w-2.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Audio only</span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/20">
              <Circle className="h-2.5 w-2.5 text-red-500 fill-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">Recording</span>
            </div>
          )}
          {aiNotes && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/80/15 border border-primary/20">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">Melli is taking notes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {roomInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 font-mono">{roomInfo.roomId}</span>
              <button
                onClick={copyRoomLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all"
              >
                {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Link2 className="h-3 w-3" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
          <span className="text-xs text-white/30">
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {/* Screen Share Layout */}
          {videoLayout === 'screen-share' ? (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Monitor className="h-16 w-16 text-blue-400/30 mb-3" />
                  <span className="text-sm text-white/40">Screen Share Active</span>
                  <span className="text-xs text-blue-400/60 mt-1">You are sharing your screen</span>
                </div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-blue-500/20 backdrop-blur-sm">
                  <span className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" />
                    Your Screen
                  </span>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {participants.map((p) => (
                  <div key={p.id} className="w-48 flex-shrink-0">
                    <ParticipantTile participant={p} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid Layout */
            <div
              className="flex-1 grid gap-3 auto-rows-fr"
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              {participants.map((p) => (
                <ParticipantTile
                  key={p.id}
                  participant={p}
                  large={participantCount <= 2}
                  videoRef={p.userId === 'self' ? localVideoRef : undefined}
                />
              ))}
              {participants.length === 0 && (
                <div className="flex flex-col items-center justify-center text-white/30 gap-3">
                  <User className="h-12 w-12 opacity-30" />
                  <span className="text-sm">Waiting for others to join...</span>
                  {roomInfo && (
                    <span className="text-xs font-mono text-white/20">Room: {roomInfo.roomId}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        {sidePanel !== 'none' && (
          <div className="w-80 border-l border-white/[0.06] bg-white/[0.02] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">
                {sidePanel === 'chat' ? 'Chat' : 'Participants'}
              </h3>
              <button
                onClick={() => setSidePanel('none')}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sidePanel === 'participants' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-white/60 font-medium">
                      {getInitials(p.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white/80 truncate block">
                        {p.displayName}{p.role === 'host' ? ' (Host)' : ''}
                        {p.userId === 'self' ? ' (You)' : ''}
                      </span>
                      <span className="text-[10px] text-white/30 capitalize">{p.status}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!p.audioEnabled ? (
                        <MicOff className="h-3.5 w-3.5 text-red-400/60" />
                      ) : (
                        <Mic className="h-3.5 w-3.5 text-white/20" />
                      )}
                      {!p.videoEnabled ? (
                        <VideoOff className="h-3.5 w-3.5 text-red-400/60" />
                      ) : (
                        <Video className="h-3.5 w-3.5 text-white/20" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-white/70">{msg.sender}</span>
                        <span className="text-[10px] text-white/25">{msg.time}</span>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/30 transition-colors"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
        <ToolbarButton
          icon={cameraOn ? Video : VideoOff}
          label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          active={!cameraOn}
          disabled={audioOnly}
          onClick={handleToggleCamera}
        />
        <ToolbarButton
          icon={micOn ? Mic : MicOff}
          label={micOn ? 'Mute' : 'Unmute'}
          active={!micOn}
          onClick={handleToggleMic}
        />
        <ToolbarButton
          icon={Monitor}
          label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          active={isScreenSharing}
          disabled={audioOnly}
          onClick={handleToggleScreenShare}
        />

        <div className="w-px h-8 bg-white/[0.08] mx-1" />

        <ToolbarButton
          icon={MessageSquare}
          label="Chat"
          active={sidePanel === 'chat'}
          onClick={() => toggleSidePanel('chat')}
          badge={sidePanel !== 'chat' ? unreadMessages : undefined}
        />
        <ToolbarButton
          icon={Users}
          label="Participants"
          active={sidePanel === 'participants'}
          onClick={() => toggleSidePanel('participants')}
        />
        <ToolbarButton
          icon={Circle}
          label={isRecording ? 'Stop recording' : 'Start recording'}
          active={isRecording}
          onClick={() => setIsRecording(!isRecording)}
        />
        <ToolbarButton
          icon={Sparkles}
          label={aiNotes ? 'Disable AI notes' : 'Enable AI notes'}
          active={aiNotes}
          onClick={() => setAiNotes(!aiNotes)}
        />

        <div className="w-px h-8 bg-white/[0.08] mx-1" />

        <ToolbarButton
          icon={PhoneOff}
          label="Leave meeting"
          danger
          onClick={handleLeave}
        />
      </div>

      {showScheduleModal && <ScheduleModal onClose={() => setShowScheduleModal(false)} />}
    </div>
  );
}

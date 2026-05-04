'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-production-057c.up.railway.app';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VideoRoom {
  id: string;
  name: string;
  status: string;
  provider: string;
  participants: { id: string; displayName: string; status: string; role: string }[];
  recording: { status: string; recordingId: string | null; duration: number };
  createdAt: string;
  startedAt: string | null;
  duration: number;
  metadata: Record<string, unknown>;
}

interface Recording {
  id: string;
  type: string;
  status: string;
  duration: number;
  fileSize: number;
  storageUrl: string | null;
  createdAt: string;
}

interface EditJob {
  id: string;
  status: string;
  progress: number;
  outputUrl: string | null;
  operations: { operation: string; status: string }[];
  createdAt: string;
  completedAt: string | null;
}

type Panel = 'home' | 'meeting' | 'record' | 'edit' | 'join';

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  StatusDot                                                          */
/* ------------------------------------------------------------------ */

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-2"
      style={{ backgroundColor: color }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function VideoPage() {
  const [panel, setPanel] = useState<Panel>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Meeting state
  const [currentRoom, setCurrentRoom] = useState<VideoRoom | null>(null);
  const [meetingName, setMeetingName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Recording via MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Edit state
  const [editJobs, setEditJobs] = useState<EditJob[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string>('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  API helpers                                                      */
  /* ---------------------------------------------------------------- */

  const apiCall = useCallback(
    async (path: string, method: string = 'GET', body?: unknown) => {
      setError(null);
      try {
        const opts: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_URL}${path}`, opts);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setError(msg);
        return null;
      }
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Meeting actions                                                  */
  /* ---------------------------------------------------------------- */

  const startMeeting = useCallback(async () => {
    if (!meetingName.trim()) {
      setError('Enter a meeting name');
      return;
    }
    setLoading(true);
    const data = await apiCall('/api/video/rooms', 'POST', {
      name: meetingName,
      hostUserId: 'owner',
      tenantId: 'memelli-universe',
    });
    if (data?.room) {
      setCurrentRoom(data.room);
      setPanel('meeting');
    }
    setLoading(false);
  }, [meetingName, apiCall]);

  const joinMeeting = useCallback(async () => {
    if (!joinRoomId.trim()) {
      setError('Enter a room ID');
      return;
    }
    setLoading(true);
    const name = displayName.trim() || 'Guest';
    const data = await apiCall(`/api/video/rooms/${joinRoomId}/join`, 'POST', {
      userId: `user_${Date.now()}`,
      displayName: name,
    });
    if (data?.room) {
      setCurrentRoom(data.room);
      setPanel('meeting');
    }
    setLoading(false);
  }, [joinRoomId, displayName, apiCall]);

  const endMeeting = useCallback(async () => {
    if (!currentRoom) return;
    setLoading(true);
    await apiCall(`/api/video/rooms/${currentRoom.id}/end`, 'POST');
    setCurrentRoom(null);
    setPanel('home');
    setLoading(false);
  }, [currentRoom, apiCall]);

  /* ---------------------------------------------------------------- */
  /*  Screen recording actions                                         */
  /* ---------------------------------------------------------------- */

  const startScreenRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Build blob for download
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screen-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        chunksRef.current = [];
      };

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        // User clicked browser "Stop sharing"
        stopScreenRecording();
      });

      recorder.start(1000); // 1s chunks

      // Notify backend
      const data = await apiCall('/api/video/screen-capture/start', 'POST', {
        tenantId: 'memelli-universe',
        userId: 'owner',
        label: 'Screen Recording',
      });
      if (data?.recording) setRecordingId(data.recording.id);

      setIsRecording(true);
      setRecordingTimer(0);
      timerRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Screen capture error:', e);
      setError('Screen capture was cancelled or not supported');
    }
  }, [apiCall]);

  const stopScreenRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recordingId) {
      await apiCall(`/api/video/screen-capture/${recordingId}/stop`, 'POST');
    }

    setIsRecording(false);
    setRecordingId(null);
    setRecordingTimer(0);
  }, [recordingId, apiCall]);

  /* ---------------------------------------------------------------- */
  /*  Edit actions                                                     */
  /* ---------------------------------------------------------------- */

  const submitTrimJob = useCallback(async () => {
    if (!selectedRecording) {
      setError('Select a recording first');
      return;
    }
    setLoading(true);
    const data = await apiCall('/api/video/edit', 'POST', {
      tenantId: 'memelli-universe',
      sourceRecordingIds: [selectedRecording],
      operations: [
        { operation: 'trim', params: { startTime: trimStart, endTime: trimEnd } },
      ],
      outputFormat: 'mp4',
    });
    if (data?.job) {
      setEditJobs((prev) => [data.job, ...prev]);
    }
    setLoading(false);
  }, [selectedRecording, trimStart, trimEnd, apiCall]);

  const loadRecordings = useCallback(async () => {
    const data = await apiCall('/api/video/recordings?tenantId=memelli-universe');
    if (data?.recordings) setRecordings(data.recordings);
  }, [apiCall]);

  const loadEditJobs = useCallback(async () => {
    const data = await apiCall('/api/video/edit-jobs?tenantId=memelli-universe');
    if (data?.jobs) setEditJobs(data.jobs);
  }, [apiCall]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground flex flex-col">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Memelli Video</h1>
          <span className="text-xs text-muted-foreground ml-2">Conference + Recording + Editing</span>
        </div>
        {panel !== 'home' && (
          <button
            onClick={() => {
              setPanel('home');
              setCurrentRoom(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </button>
        )}
      </header>

      {/* ── Error Banner ──────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-2 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 p-6">
        {/* ──────── HOME PANEL ──────── */}
        {panel === 'home' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 mt-8">
              <h2 className="text-3xl font-bold mb-2">Video Command Center</h2>
              <p className="text-muted-foreground">Start meetings, record your screen, edit video — all in one place.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Start Meeting Card */}
              <div className="bg-card border border-zinc-800 rounded-xl p-6 hover:border-violet-600/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Start Meeting</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new video room. Invite participants by sharing the room ID.
                </p>
                <input
                  type="text"
                  placeholder="Meeting name..."
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  className="w-full bg-muted border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={startMeeting}
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-muted text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  {loading ? 'Creating...' : 'Start Meeting'}
                </button>
              </div>

              {/* Record Screen Card */}
              <div className="bg-card border border-zinc-800 rounded-xl p-6 hover:border-emerald-600/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" fill="#10b981" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Record Screen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Capture your screen with audio. Download when done.
                </p>
                {!isRecording ? (
                  <button
                    onClick={() => {
                      setPanel('record');
                      startScreenRecording();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                  >
                    Record Screen
                  </button>
                ) : (
                  <button
                    onClick={stopScreenRecording}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors animate-pulse"
                  >
                    Stop Recording ({formatDuration(recordingTimer)})
                  </button>
                )}
              </div>

              {/* Edit Video Card */}
              <div className="bg-card border border-zinc-800 rounded-xl p-6 hover:border-amber-600/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Edit Video</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Trim, merge, add captions, and export recordings.
                </p>
                <button
                  onClick={() => {
                    setPanel('edit');
                    loadRecordings();
                    loadEditJobs();
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  Edit Video
                </button>
              </div>
            </div>

            {/* Join by Room ID */}
            <div className="bg-card border border-zinc-800 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4 text-center">Join a Meeting</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Room ID (e.g. room_abc123)"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="w-full bg-muted border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                />
                <input
                  type="text"
                  placeholder="Your name..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-muted border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={joinMeeting}
                  disabled={loading}
                  className="w-full bg-muted hover:bg-muted border border-zinc-600 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  {loading ? 'Joining...' : 'Join Meeting'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────── MEETING PANEL ──────── */}
        {panel === 'meeting' && currentRoom && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{currentRoom.name}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center">
                    <StatusDot color={currentRoom.status === 'active' ? '#22c55e' : '#71717a'} />
                    {currentRoom.status}
                  </span>
                  <span>Room: {currentRoom.id}</span>
                  <span>Provider: {currentRoom.provider}</span>
                </div>
              </div>
              <button
                onClick={endMeeting}
                className="bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              >
                End Meeting
              </button>
            </div>

            {/* Video Area */}
            <div className="bg-card border border-zinc-800 rounded-xl overflow-hidden mb-6">
              <div className="aspect-video bg-[hsl(var(--background))] flex items-center justify-center relative">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {currentRoom.provider === 'zoom' && (currentRoom.metadata as any)?.zoomJoinUrl
                      ? 'Zoom meeting active'
                      : 'WebRTC room active'}
                  </p>
                  {(currentRoom.metadata as any)?.zoomJoinUrl && (
                    <a
                      href={(currentRoom.metadata as any)?.zoomJoinUrl as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block"
                    >
                      Open in Zoom
                    </a>
                  )}
                </div>

                {/* Recording indicator */}
                {currentRoom.recording.status === 'recording' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-900/60 border border-red-700 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-300 font-medium">REC</span>
                  </div>
                )}
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-center gap-3 py-4 px-6 bg-card border-t border-zinc-800">
                <button className="w-10 h-10 rounded-full bg-muted hover:bg-muted flex items-center justify-center transition-colors" title="Mute">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-muted hover:bg-muted flex items-center justify-center transition-colors" title="Camera">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-muted hover:bg-muted flex items-center justify-center transition-colors" title="Share Screen">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-muted hover:bg-muted flex items-center justify-center transition-colors" title="Chat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <button
                  onClick={endMeeting}
                  className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                  title="Leave"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Participants sidebar */}
            <div className="bg-card border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Participants ({currentRoom.participants.length})
              </h3>
              {currentRoom.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet. Share the room ID to invite others.</p>
              ) : (
                <div className="space-y-2">
                  {currentRoom.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot
                          color={
                            p.status === 'connected' || p.status === 'speaking'
                              ? '#22c55e'
                              : p.status === 'muted'
                              ? '#f59e0b'
                              : '#71717a'
                          }
                        />
                        <span className="text-sm">{p.displayName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.role}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Room ID (share to invite):</p>
                <code className="text-xs text-violet-400 select-all">{currentRoom.id}</code>
              </div>
            </div>
          </div>
        )}

        {/* ──────── RECORD PANEL ──────── */}
        {panel === 'record' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8 mt-8">
              <h2 className="text-2xl font-bold mb-2">Screen Recording</h2>
              <p className="text-muted-foreground">Recording your screen. The file will download automatically when you stop.</p>
            </div>

            <div className="bg-card border border-zinc-800 rounded-xl p-8 mb-6">
              {isRecording ? (
                <>
                  <div className="w-24 h-24 rounded-full border-4 border-red-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <span className="w-8 h-8 rounded-full bg-red-600" />
                  </div>
                  <p className="text-4xl font-mono font-bold text-red-400 mb-4">
                    {formatDuration(recordingTimer)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">Recording in progress...</p>
                  <button
                    onClick={stopScreenRecording}
                    className="bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg px-8 py-3 text-sm transition-colors"
                  >
                    Stop Recording
                  </button>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full border-4 border-zinc-700 flex items-center justify-center mx-auto mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground mb-6">Ready to record</p>
                  <button
                    onClick={startScreenRecording}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-8 py-3 text-sm transition-colors"
                  >
                    Start Recording
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ──────── EDIT PANEL ──────── */}
        {panel === 'edit' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 mt-4">
              <h2 className="text-2xl font-bold mb-2">Video Editor</h2>
              <p className="text-muted-foreground">Select a recording, apply edits, and export.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recordings list */}
              <div className="bg-card border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Recordings</h3>
                  <button
                    onClick={loadRecordings}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Refresh
                  </button>
                </div>
                {recordings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recordings found. Start a meeting or record your screen first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recordings.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => setSelectedRecording(rec.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                          selectedRecording === rec.id
                            ? 'bg-violet-600/20 border border-violet-600/40'
                            : 'bg-muted border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{rec.id}</span>
                          <span className="text-xs text-muted-foreground">{rec.type}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatDuration(rec.duration)}</span>
                          <span>{formatBytes(rec.fileSize)}</span>
                          <span>
                            <StatusDot
                              color={rec.status === 'stored' ? '#22c55e' : '#f59e0b'}
                            />
                            {rec.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit Controls */}
              <div className="bg-card border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Trim & Export</h3>

                {selectedRecording ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Selected:</p>
                      <code className="text-xs text-violet-400">{selectedRecording}</code>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Start (seconds)</label>
                        <input
                          type="number"
                          min={0}
                          value={trimStart}
                          onChange={(e) => setTrimStart(Number(e.target.value))}
                          className="w-full bg-muted border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">End (seconds)</label>
                        <input
                          type="number"
                          min={0}
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(Number(e.target.value))}
                          className="w-full bg-muted border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={submitTrimJob}
                      disabled={loading}
                      className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-muted text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                    >
                      {loading ? 'Submitting...' : 'Trim & Export'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a recording from the left to begin editing.
                  </p>
                )}

                {/* Edit Jobs */}
                {editJobs.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Edit Jobs
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editJobs.map((job) => (
                        <div
                          key={job.id}
                          className="px-3 py-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{job.id}</span>
                            <span className="text-xs text-muted-foreground">{job.status}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${job.progress}%`,
                                backgroundColor:
                                  job.status === 'completed'
                                    ? '#22c55e'
                                    : job.status === 'failed'
                                    ? '#ef4444'
                                    : '#10b981',
                              }}
                            />
                          </div>
                          {job.outputUrl && (
                            <a
                              href={`${API_URL}${job.outputUrl}`}
                              className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 px-6 py-3 text-center">
        <span className="text-xs text-muted-foreground">Memelli Video Service  /  Rail Connected  /  Nano Tracked</span>
      </footer>
    </div>
  );
}

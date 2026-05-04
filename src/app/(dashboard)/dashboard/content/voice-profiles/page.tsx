// @ts-nocheck
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Music2,
  Play,
  Square,
  Volume2,
  Mic,
  Sliders,
  Cpu,
  Download,
  Zap,
  MessageSquare,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type GenreId = 'trap' | 'rnb' | 'pop' | 'electronic' | 'jazz' | 'lofi' | 'cinematic' | 'drill';
type MoodId  = 'dark' | 'uplifting' | 'aggressive' | 'melancholic' | 'euphoric' | 'chill';
type MusicalKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

type TrackName = 'Kick' | 'Snare' | 'Hi-Hat' | 'Bass' | 'Lead Synth' | 'Pad' | 'FX' | 'Vocals';

interface Track {
  name: TrackName;
  muted: boolean;
  solo: boolean;
  volume: number;
  steps: boolean[];
  color: string;
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: string;
}

/* ================================================================= */
/*  Genre Patterns                                                     */
/* ================================================================= */

const EMPTY_16 = (): boolean[] => Array(16).fill(false);

type PatternMap = Record<TrackName, boolean[]>;

const GENRE_PATTERNS: Record<GenreId, PatternMap> = {
  trap: {
    Kick:       [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0].map(Boolean),
    Snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0].map(Boolean),
    'Hi-Hat':   [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1].map(Boolean),
    Bass:       [1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0].map(Boolean),
    'Lead Synth':[0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1].map(Boolean),
    Pad:        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    FX:         [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1].map(Boolean),
    Vocals:     EMPTY_16(),
  },
  rnb: {
    Kick:       [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0].map(Boolean),
    Snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1].map(Boolean),
    'Hi-Hat':   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean),
    Bass:       [1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0].map(Boolean),
    'Lead Synth':[0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0].map(Boolean),
    Pad:        [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    FX:         EMPTY_16(),
    Vocals:     [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0].map(Boolean),
  },
  pop: {
    Kick:       [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    Snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0].map(Boolean),
    'Hi-Hat':   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean),
    Bass:       [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    'Lead Synth':[0,1,0,1,0,0,1,0,0,1,0,1,0,0,1,0].map(Boolean),
    Pad:        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    FX:         [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1].map(Boolean),
    Vocals:     [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1].map(Boolean),
  },
  electronic: {
    Kick:       [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),
    Snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0].map(Boolean),
    'Hi-Hat':   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1].map(Boolean),
    Bass:       [1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0].map(Boolean),
    'Lead Synth':[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0].map(Boolean),
    Pad:        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    FX:         [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0].map(Boolean),
    Vocals:     EMPTY_16(),
  },
  jazz: {
    Kick:       [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0].map(Boolean),
    Snare:      [0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0].map(Boolean),
    'Hi-Hat':   [1,0,1,1,0,1,1,0,1,0,1,1,0,1,0,0].map(Boolean),
    Bass:       [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1,0].map(Boolean),
    'Lead Synth':[0,1,0,0,0,1,0,0,0,1,0,0,1,0,0,0].map(Boolean),
    Pad:        [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0].map(Boolean),
    FX:         EMPTY_16(),
    Vocals:     EMPTY_16(),
  },
  lofi: {
    Kick:       [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    Snare:      [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0].map(Boolean),
    'Hi-Hat':   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean),
    Bass:       [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0].map(Boolean),
    'Lead Synth':[0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0].map(Boolean),
    Pad:        [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0].map(Boolean),
    FX:         [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0].map(Boolean),
    Vocals:     EMPTY_16(),
  },
  cinematic: {
    Kick:       [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0].map(Boolean),
    Snare:      [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    'Hi-Hat':   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].map(Boolean),
    Bass:       [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    'Lead Synth':[0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1].map(Boolean),
    Pad:        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    FX:         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1].map(Boolean),
    Vocals:     EMPTY_16(),
  },
  drill: {
    Kick:       [1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0].map(Boolean),
    Snare:      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1].map(Boolean),
    'Hi-Hat':   [1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1].map(Boolean),
    Bass:       [1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1].map(Boolean),
    'Lead Synth':[0,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0].map(Boolean),
    Pad:        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0].map(Boolean),
    FX:         [0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0].map(Boolean),
    Vocals:     EMPTY_16(),
  },
};

const TRACK_COLORS: Record<TrackName, string> = {
  Kick:         'bg-primary/80',
  Snare:        'bg-violet-500',
  'Hi-Hat':     'bg-fuchsia-500',
  Bass:         'bg-indigo-500',
  'Lead Synth': 'bg-primary/70',
  Pad:          'bg-violet-400',
  FX:           'bg-pink-500',
  Vocals:       'bg-fuchsia-400',
};

const TRACK_NAMES: TrackName[] = ['Kick', 'Snare', 'Hi-Hat', 'Bass', 'Lead Synth', 'Pad', 'FX', 'Vocals'];
const GENRES_LIST: { id: GenreId; label: string }[] = [
  { id: 'trap',       label: 'Trap'       },
  { id: 'rnb',        label: 'R&B'        },
  { id: 'pop',        label: 'Pop'        },
  { id: 'electronic', label: 'Electronic' },
  { id: 'jazz',       label: 'Jazz'       },
  { id: 'lofi',       label: 'Lo-Fi'      },
  { id: 'cinematic',  label: 'Cinematic'  },
  { id: 'drill',      label: 'Drill'      },
];

const MOODS_LIST: { id: MoodId; label: string }[] = [
  { id: 'dark',        label: 'Dark'        },
  { id: 'uplifting',   label: 'Uplifting'   },
  { id: 'aggressive',  label: 'Aggressive'  },
  { id: 'melancholic', label: 'Melancholic' },
  { id: 'euphoric',    label: 'Euphoric'    },
  { id: 'chill',       label: 'Chill'       },
];

const MUSICAL_KEYS: MusicalKey[] = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const DEFAULT_BPM_BY_GENRE: Record<GenreId, number> = {
  trap: 140, rnb: 80, pop: 115, electronic: 125,
  jazz: 95, lofi: 75, cinematic: 70, drill: 145,
};

const AI_SUGGESTIONS = [
  'Add trap hi-hats',
  'Make it harder',
  'Add 808 bass',
  'Change key to minor',
  'Swing the groove',
  'Double-time hi-hats',
];

/* ================================================================= */
/*  Build initial tracks from pattern                                  */
/* ================================================================= */

function buildTracks(genre: GenreId): Track[] {
  const pattern = GENRE_PATTERNS[genre];
  return TRACK_NAMES.map((name) => ({
    name,
    muted: false,
    solo: false,
    volume: 80,
    steps: [...pattern[name]],
    color: TRACK_COLORS[name],
  }));
}

/* ================================================================= */
/*  Web Audio helpers                                                  */
/* ================================================================= */

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playKick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.4);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
  osc.start(time);
  osc.stop(time + 0.4);
}

function playSnare(ctx: AudioContext, time: number) {
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  source.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  source.start(time);
  source.stop(time + 0.2);
}

function playHihat(ctx: AudioContext, time: number) {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;
  const gain = ctx.createGain();
  source.connect(highpass);
  highpass.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  source.start(time);
  source.stop(time + 0.05);
}

/* ================================================================= */
/*  Export Progress                                                    */
/* ================================================================= */

function ExportProgress({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Exporting WAV...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function MusicProductionPage() {
  const [genre, setGenre] = useState<GenreId>('trap');
  const [bpm, setBpm] = useState(140);
  const [musicalKey, setMusicalKey] = useState<MusicalKey>('C');
  const [scale, setScale] = useState<'Major' | 'Minor'>('Minor');
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState<MoodId>('dark');
  const [projectName, setProjectName] = useState('Untitled Beat');
  const [tracks, setTracks] = useState<Track[]>(() => buildTracks('trap'));
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      text: 'Ready to produce. Select a genre, adjust settings, then hit Generate Beat or type a prompt below.',
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const tracksRef = useRef(tracks);
  const bpmRef = useRef(bpm);

  // Keep refs in sync
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const stopTransport = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
    setCurrentStep(-1);
    stepRef.current = 0;
  }, []);

  const startTransport = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    stepRef.current = 0;
    setPlaying(true);

    intervalRef.current = setInterval(() => {
      const step = stepRef.current;
      setCurrentStep(step);

      const now = ctx.currentTime;
      const tks = tracksRef.current;
      const activeTracks = tks.filter((t) => !t.muted);
      const soloTrack = tks.find((t) => t.solo);

      const toPlay = soloTrack ? [soloTrack] : activeTracks;

      for (const track of toPlay) {
        if (!track.steps[step]) continue;
        const vol = track.volume / 100;
        if (track.name === 'Kick') playKick(ctx, now);
        else if (track.name === 'Snare') playSnare(ctx, now);
        else if (track.name === 'Hi-Hat') playHihat(ctx, now);
        // Other tracks: no audio synthesis for now
      }

      stepRef.current = (step + 1) % 16;
    }, (60 / bpmRef.current / 4) * 1000);
  }, []);

  const toggleTransport = useCallback(() => {
    if (playing) {
      stopTransport();
    } else {
      startTransport();
    }
  }, [playing, startTransport, stopTransport]);

  // Cleanup on unmount
  useEffect(() => () => stopTransport(), [stopTransport]);

  const generateBeat = useCallback((targetGenre?: GenreId) => {
    const g = targetGenre ?? genre;
    setTracks(buildTracks(g));
    setBpm(DEFAULT_BPM_BY_GENRE[g]);
    if (playing) stopTransport();
  }, [genre, playing, stopTransport]);

  const handleGenreChange = (g: GenreId) => {
    setGenre(g);
    setBpm(DEFAULT_BPM_BY_GENRE[g]);
  };

  const toggleStep = useCallback((trackIdx: number, stepIdx: number) => {
    setTracks((prev) =>
      prev.map((t, i) => {
        if (i !== trackIdx) return t;
        const steps = [...t.steps];
        steps[stepIdx] = !steps[stepIdx];
        return { ...t, steps };
      })
    );
  }, []);

  const toggleMute = useCallback((trackIdx: number) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === trackIdx ? { ...t, muted: !t.muted } : t))
    );
  }, []);

  const toggleSolo = useCallback((trackIdx: number) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === trackIdx ? { ...t, solo: !t.solo } : { ...t, solo: false }))
    );
  }, []);

  const setTrackVolume = useCallback((trackIdx: number, vol: number) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === trackIdx ? { ...t, volume: vol } : t))
    );
  }, []);

  const handleAiSend = useCallback((text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AiMessage = { id: crypto.randomUUID(), role: 'user', text, ts: now };

    const responses: Record<string, string> = {
      'add trap hi-hats':    'Adding syncopated trap hi-hat pattern — 16th-note triplet rolls applied.',
      'make it harder':      'Boosting kick density and adding ghost snares on off-beats. Energy raised to 9.',
      'add 808 bass':        'Programming 808 bass line to complement the kick. Sliding notes on beats 2 and 4.',
      'change key to minor': `Switching to ${musicalKey} Minor. Chord progression updated to i-VI-III-VII.`,
      'swing the groove':    'Applying 60% swing to hi-hats. Groove is now triplet-based.',
      'double-time hi-hats': 'Doubling hi-hat density to 32nd notes. Velocity humanization applied.',
    };

    const reply = responses[text.toLowerCase()] ?? `Processing: "${text}" — analyzing genre context and applying optimal pattern changes.`;
    const assistantMsg: AiMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: reply,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg, assistantMsg]);
    setAiInput('');
  }, [musicalKey]);

  const handleExport = () => {
    if (exporting) return;
    setExportDone(false);
    setExporting(true);
  };

  const BARS = [1, 2, 3, 4];

  return (
    <div className="flex flex-col h-full min-h-screen bg-card">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Music2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Music Production</h1>
            <p className="text-xs text-muted-foreground">AI-powered beat sequencer &amp; composer</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/80/[0.08] px-3 py-1 text-xs font-semibold text-primary ml-2">
            <Cpu className="h-3 w-3" />
            AI Composer
          </span>
        </div>
        <div className="flex items-center gap-3">
          {exportDone && (
            <span className="text-xs text-emerald-400 font-medium">Export complete</span>
          )}
          {exporting && !exportDone ? (
            <div className="w-48">
              <ExportProgress onComplete={() => { setExporting(false); setExportDone(true); }} />
            </div>
          ) : (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
            >
              <Download className="h-4 w-4" />
              Export WAV
            </button>
          )}
        </div>
      </div>

      {/* ─── Three-Panel Layout ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="w-80 shrink-0 border-r border-white/[0.06] overflow-y-auto p-5 space-y-6">

          {/* Project Name */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Genre
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENRES_LIST.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGenreChange(g.id)}
                  className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                    genre === g.id
                      ? 'border-primary/40 bg-primary/80/[0.12] text-primary/80 shadow-sm shadow-purple-900/20'
                      : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:border-white/[0.12] hover:text-foreground'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Tempo
              </label>
              <span className="text-sm font-bold text-primary font-mono">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={60}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full bg-white/[0.08] accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>60</span>
              <span>200</span>
            </div>
          </div>

          {/* Key */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value as MusicalKey)}
                  className="w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 pr-8 text-sm text-foreground focus:border-primary/40 focus:outline-none transition-all"
                >
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k} className="bg-card">{k}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
              <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
                {(['Major', 'Minor'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-3 py-2 text-xs font-medium transition-all ${
                      scale === s
                        ? 'bg-primary/20 text-primary/80'
                        : 'text-muted-foreground hover:text-foreground bg-white/[0.02]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Energy
              </label>
              <span className="text-sm font-bold text-primary">{energy}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full bg-white/[0.08] accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Mood
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOODS_LIST.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                    mood === m.id
                      ? 'border-violet-500/40 bg-violet-500/[0.12] text-violet-300'
                      : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:border-white/[0.10] hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => generateBeat()}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-violet-500 hover:shadow-purple-700/40 transition-all"
          >
            Generate Beat
          </button>
        </div>

        {/* ── CENTER PANEL — DAW ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Transport Bar */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06] bg-card">
            <button
              onClick={toggleTransport}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                playing
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md shadow-purple-900/30 hover:from-purple-500 hover:to-violet-500'
              }`}
            >
              {playing ? (
                <><Square className="h-3.5 w-3.5 fill-current" /> Stop</>
              ) : (
                <><Play className="h-3.5 w-3.5 fill-current ml-0.5" /> Play</>
              )}
            </button>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 font-mono text-sm font-bold text-primary">
              {bpm} BPM
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {BARS.map((bar) => (
                <div key={bar} className="flex items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono w-4">{bar}</span>
                  {Array.from({ length: 4 }, (_, beat) => {
                    const stepIdx = (bar - 1) * 4 + beat;
                    return (
                      <div
                        key={beat}
                        className={`h-3 w-3 rounded-sm transition-colors ${
                          currentStep === stepIdx
                            ? 'bg-primary/70'
                            : 'bg-white/[0.04]'
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <button
              onClick={() => generateBeat()}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          {/* Sequencer Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {/* Step numbers */}
            <div className="flex items-center gap-2 pl-[152px] mb-1">
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className={`h-4 w-8 flex items-center justify-center text-[9px] font-mono rounded transition-colors ${
                    currentStep === i
                      ? 'text-primary font-bold'
                      : (i % 4 === 0 ? 'text-muted-foreground' : 'text-muted-foreground')
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {tracks.map((track, trackIdx) => (
              <div key={track.name} className="flex items-center gap-2">
                {/* Track label + controls */}
                <div className="w-36 shrink-0 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${track.color} shrink-0`} />
                  <span className="text-xs font-medium text-foreground truncate w-20">{track.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => toggleMute(trackIdx)}
                      className={`w-5 h-5 rounded text-[9px] font-bold transition-colors ${
                        track.muted
                          ? 'bg-red-500/30 text-red-400 border border-red-500/30'
                          : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:text-muted-foreground'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => toggleSolo(trackIdx)}
                      className={`w-5 h-5 rounded text-[9px] font-bold transition-colors ${
                        track.solo
                          ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                          : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:text-muted-foreground'
                      }`}
                    >
                      S
                    </button>
                  </div>
                </div>

                {/* Steps */}
                <div className="flex gap-0.5 flex-1">
                  {track.steps.map((active, stepIdx) => {
                    const isCurrentStep = currentStep === stepIdx;
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(trackIdx, stepIdx)}
                        className={`h-8 w-8 rounded-md border transition-all duration-75 ${
                          active
                            ? `${track.color} border-transparent opacity-${track.muted ? 40 : 100} ${isCurrentStep ? 'brightness-125 scale-105' : ''}`
                            : `bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] ${isCurrentStep ? 'border-white/20' : ''}`
                        } ${stepIdx % 4 === 0 ? 'ml-1' : ''}`}
                      />
                    );
                  })}
                </div>

                {/* Volume fader */}
                <div className="flex items-center gap-1.5 w-24 shrink-0">
                  <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={track.volume}
                    onChange={(e) => setTrackVolume(trackIdx, parseInt(e.target.value))}
                    className="flex-1 h-1 appearance-none rounded-full bg-white/[0.06] accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mixer Strip */}
          <div className="border-t border-white/[0.06] bg-card px-5 py-4">
            <div className="flex items-end gap-4 overflow-x-auto pb-1">
              {tracks.map((track, i) => (
                <div key={track.name} className="flex flex-col items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center gap-1 h-20 justify-end">
                    <div
                      className={`w-2 rounded-full ${track.color} opacity-70`}
                      style={{ height: `${track.volume * 0.7}px`, minHeight: '4px' }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={track.volume}
                      onChange={(e) => setTrackVolume(i, parseInt(e.target.value))}
                      orient="vertical"
                      className="h-16 w-1.5 appearance-none rounded-full bg-white/[0.06] accent-purple-500 cursor-pointer"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">{track.name.split(' ')[0]}</span>
                </div>
              ))}
              {/* Master */}
              <div className="flex flex-col items-center gap-2 shrink-0 border-l border-white/[0.06] pl-4">
                <div className="flex flex-col items-center gap-1 h-20 justify-end">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={85}
                    orient="vertical"
                    className="h-16 w-1.5 appearance-none rounded-full bg-white/[0.06] accent-violet-500 cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                </div>
                <span className="text-[9px] font-bold text-violet-400">MASTER</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — AI Assistant ── */}
        <div className="w-72 shrink-0 border-l border-white/[0.06] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.06]">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Assistant</span>
          </div>

          {/* Suggestions */}
          <div className="px-4 pt-3 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAiSend(s)}
                  className="rounded-lg border border-primary/20 bg-primary/80/[0.06] px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/80/[0.12] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary/20 text-foreground rounded-br-sm'
                      : 'bg-white/[0.04] border border-white/[0.06] text-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Mic className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[9px] font-medium text-primary">AI Composer</span>
                    </div>
                  )}
                  {msg.text}
                </div>
                <span className="text-[9px] text-muted-foreground">{msg.ts}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiSend(aiInput); }}
                placeholder="Describe a change..."
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none transition-all"
              />
              <button
                onClick={() => handleAiSend(aiInput)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/80/30 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

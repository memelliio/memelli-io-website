'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  Users,
  Music2,
  Headphones,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

interface Station {
  id: string;
  name: string;
  genre: string;
  listeners: string;
  currentTrack: string;
  gradient: string;
  streamUrl: string | null;
  comingSoon?: boolean;
}

interface Genre {
  id: string;
  label: string;
  listeners: string;
  gradient: string;
}

interface RecentStation {
  id: string;
  name: string;
  genre: string;
  duration: string;
  gradient: string;
}

interface DiscoverStation {
  id: string;
  name: string;
  genre: string;
  listeners: string;
  gradient: string;
  reason: string;
  currentTrack: string;
}

/* ================================================================= */
/*  Data                                                               */
/* ================================================================= */

const STATIONS: Station[] = [
  {
    id: 's-1',
    name: 'Deep Focus',
    genre: 'Ambient / Focus',
    listeners: '2.4K',
    currentTrack: 'Neural Drift — Aleph Zero',
    gradient: 'from-purple-600 to-violet-900',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio2.mp3',
  },
  {
    id: 's-2',
    name: 'Chill Vibes',
    genre: 'Chill / Lo-Fi',
    listeners: '1.8K',
    currentTrack: 'Evening Haze — Sable',
    gradient: 'from-indigo-500 to-purple-800',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio17.mp3',
  },
  {
    id: 's-3',
    name: 'Hip Hop Heat',
    genre: 'Hip Hop / Trap',
    listeners: '3.1K',
    currentTrack: 'Gold Standard — MC Cipher',
    gradient: 'from-violet-600 to-fuchsia-900',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio9.mp3',
  },
  {
    id: 's-4',
    name: 'Electronic Pulse',
    genre: 'Electronic / EDM',
    listeners: '2.9K',
    currentTrack: 'Voltage — SYNTH_X',
    gradient: 'from-purple-500 to-indigo-800',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio8.mp3',
  },
  {
    id: 's-5',
    name: 'Workout Mode',
    genre: 'High Energy / BPM',
    listeners: '1.2K',
    currentTrack: 'Ignition Protocol — BOOST',
    gradient: 'from-fuchsia-600 to-purple-900',
    streamUrl: null,
    comingSoon: true,
  },
  {
    id: 's-6',
    name: 'Jazz After Dark',
    genre: 'Jazz / Neo-Soul',
    listeners: '980',
    currentTrack: 'Late Session — Velour Quartet',
    gradient: 'from-violet-700 to-indigo-900',
    streamUrl: null,
    comingSoon: true,
  },
  {
    id: 's-7',
    name: 'Lo-Fi Study',
    genre: 'Lo-Fi / Beats',
    listeners: '4.2K',
    currentTrack: 'Rainy Campus — Nomad',
    gradient: 'from-purple-800 to-violet-950',
    streamUrl: null,
    comingSoon: true,
  },
  {
    id: 's-8',
    name: 'Classical Morning',
    genre: 'Classical / Orchestral',
    listeners: '760',
    currentTrack: 'Opus 7 in D Major — Bellara',
    gradient: 'from-indigo-700 to-purple-900',
    streamUrl: null,
    comingSoon: true,
  },
];

const GENRES: Genre[] = [
  { id: 'pop',        label: 'Pop',        listeners: '12.4K', gradient: 'from-purple-500 to-violet-700' },
  { id: 'hiphop',     label: 'Hip Hop',    listeners: '9.8K',  gradient: 'from-violet-600 to-fuchsia-800' },
  { id: 'rnb',        label: 'R&B',        listeners: '7.2K',  gradient: 'from-fuchsia-600 to-purple-800' },
  { id: 'jazz',       label: 'Jazz',       listeners: '3.1K',  gradient: 'from-indigo-600 to-purple-700' },
  { id: 'electronic', label: 'Electronic', listeners: '8.5K',  gradient: 'from-purple-600 to-indigo-800' },
  { id: 'classical',  label: 'Classical',  listeners: '2.4K',  gradient: 'from-violet-700 to-indigo-900' },
  { id: 'reggae',     label: 'Reggae',     listeners: '1.9K',  gradient: 'from-purple-700 to-violet-900' },
  { id: 'latin',      label: 'Latin',      listeners: '5.6K',  gradient: 'from-fuchsia-700 to-purple-900' },
];

const RECENTLY_PLAYED: RecentStation[] = [
  { id: 'r-1', name: 'Deep Focus',      genre: 'Ambient / Focus',    duration: '42 min', gradient: 'from-purple-600 to-violet-900' },
  { id: 'r-2', name: 'Hip Hop Heat',    genre: 'Hip Hop / Trap',     duration: '28 min', gradient: 'from-violet-600 to-fuchsia-900' },
  { id: 'r-3', name: 'Chill Vibes',     genre: 'Chill / Lo-Fi',      duration: '1h 14m', gradient: 'from-indigo-500 to-purple-800' },
  { id: 'r-4', name: 'Electronic Pulse',genre: 'Electronic / EDM',   duration: '33 min', gradient: 'from-purple-500 to-indigo-800' },
  { id: 'r-5', name: 'Lo-Fi Study',     genre: 'Lo-Fi / Beats',      duration: '2h 05m', gradient: 'from-purple-800 to-violet-950' },
];

const DISCOVER: DiscoverStation[] = [
  {
    id: 'd-1',
    name: 'Deep Focus',
    genre: 'Ambient / Focus',
    listeners: '2.4K',
    gradient: 'from-purple-600 to-violet-900',
    currentTrack: 'Neural Drift — Aleph Zero',
    reason: 'Based on your 3-hour focus sessions every weekday morning',
  },
  {
    id: 'd-2',
    name: 'Jazz After Dark',
    genre: 'Jazz / Neo-Soul',
    listeners: '980',
    gradient: 'from-violet-700 to-indigo-900',
    currentTrack: 'Late Session — Velour Quartet',
    reason: 'Matches your late-evening listening patterns and R&B history',
  },
  {
    id: 'd-3',
    name: 'Electronic Pulse',
    genre: 'Electronic / EDM',
    listeners: '2.9K',
    gradient: 'from-purple-500 to-indigo-800',
    currentTrack: 'Voltage — SYNTH_X',
    reason: 'Trending in your network — 14 connections listening now',
  },
];

/* ================================================================= */
/*  Waveform Animation                                                 */
/* ================================================================= */

function WaveformBars({ playing }: { playing: boolean }) {
  const bars = [3, 5, 8, 5, 10, 7, 4, 9, 6, 3, 8, 5, 7, 4, 9];
  return (
    <div className="flex items-end gap-[2px] h-5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-primary/70"
          style={{
            height: playing ? `${h * 2}px` : '4px',
            transition: 'height 0.3s ease',
            animation: playing ? `waveBar 0.8s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

/* ================================================================= */
/*  Station Artwork                                                    */
/* ================================================================= */

function StationArt({ gradient, size = 'md' }: { gradient: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-10 w-10', md: 'h-16 w-16', lg: 'h-20 w-20' };
  return (
    <div className={`${sizeMap[size]} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
      <Music2 className="h-5 w-5 text-white/60" />
    </div>
  );
}

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function RadioStationPage() {
  const [playing, setPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station>(STATIONS[0]);
  const [volume, setVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = 'none';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const playStation = useCallback(async (station: Station) => {
    if (!audioRef.current) return;

    if (station.comingSoon || !station.streamUrl) return;

    // Same station — toggle play/pause
    if (currentStation.id === station.id) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        setLoadingId(station.id);
        try {
          audioRef.current.src = station.streamUrl;
          await audioRef.current.play();
          setPlaying(true);
        } catch {
          // Stream may be blocked by browser policy or network; surface gracefully
        } finally {
          setLoadingId(null);
        }
      }
      return;
    }

    // Switch to new station
    audioRef.current.pause();
    setPlaying(false);
    setCurrentStation(station);
    setLoadingId(station.id);
    try {
      audioRef.current.src = station.streamUrl;
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      // Silently handle autoplay policy
    } finally {
      setLoadingId(null);
    }
  }, [currentStation.id, playing]);

  const skipToNext = useCallback(() => {
    const liveStations = STATIONS.filter((s) => !s.comingSoon);
    const idx = liveStations.findIndex((s) => s.id === currentStation.id);
    const next = liveStations[(idx + 1) % liveStations.length];
    playStation(next);
  }, [currentStation.id, playStation]);

  return (
    <div className="space-y-8 p-6 pb-28">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Radio Station
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            AI-curated live streams and music discovery
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/80/[0.06] px-4 py-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary/80">Live AI Curation</span>
        </div>
      </div>

      {/* ─── Now Playing Bar ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-white/[0.06] p-5">
        <div className="flex items-center gap-5">
          {/* Artwork */}
          <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${currentStation.gradient} flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/30`}>
            <Music2 className="h-8 w-8 text-white/50" />
          </div>

          {/* Station Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{currentStation.name}</h2>
              <span className="rounded-lg border border-primary/25 bg-primary/80/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-primary">
                {currentStation.genre}
              </span>
              {!currentStation.comingSoon && (
                <span className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground truncate">{currentStation.currentTrack}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{currentStation.listeners} listeners</span>
            </div>
          </div>

          {/* Waveform */}
          <div className="hidden sm:flex items-center">
            <WaveformBars playing={playing} />
          </div>

          {/* Transport */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => playStation(currentStation)}
              disabled={!!currentStation.comingSoon}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-900/40 transition-all hover:scale-105 hover:shadow-purple-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingId === currentStation.id ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : playing ? (
                <Pause className="h-6 w-6 text-white fill-white" />
              ) : (
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              )}
            </button>
            <button
              onClick={skipToNext}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-3 shrink-0 min-w-[160px]">
            <button
              onClick={() => setMuted((m) => !m)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              className="flex-1 h-1.5 appearance-none rounded-full bg-white/[0.08] accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ─── Featured Stations ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Featured Stations</h2>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            See all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {STATIONS.map((station) => {
            const isActive = currentStation.id === station.id;
            const isLoading = loadingId === station.id;
            return (
              <div
                key={station.id}
                className={`group relative shrink-0 w-52 rounded-2xl bg-card border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-primary/40 shadow-lg shadow-purple-900/20'
                    : 'border-white/[0.06] hover:border-white/[0.12]'
                }`}
                onClick={() => playStation(station)}
              >
                {/* Artwork */}
                <div className={`h-32 w-full rounded-t-2xl bg-gradient-to-br ${station.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music2 className="h-10 w-10 text-white/30" />
                  </div>
                  {/* Hover play overlay */}
                  {!station.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        {isLoading ? (
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : isActive && playing ? (
                          <Pause className="h-4 w-4 text-white fill-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>
                  )}
                  {/* Coming Soon badge */}
                  {station.comingSoon && (
                    <div className="absolute top-2 right-2 rounded-lg bg-background backdrop-blur-sm border border-white/10 px-2 py-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">Coming Soon</span>
                    </div>
                  )}
                  {/* Live badge */}
                  {isActive && playing && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-red-500/80 backdrop-blur-sm px-2 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] font-bold text-white">LIVE</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 space-y-1.5">
                  <div className="text-sm font-semibold text-foreground truncate">{station.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{station.currentTrack}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      {station.listeners}
                    </span>
                    <span className="rounded-md border border-primary/20 bg-primary/80/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-primary truncate max-w-[80px]">
                      {station.genre.split(' / ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Browse by Genre ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Browse by Genre</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GENRES.map((genre) => (
            <div
              key={genre.id}
              className="group relative h-24 rounded-2xl bg-card border border-white/[0.06] overflow-hidden cursor-pointer hover:border-white/[0.12] transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-30 group-hover:opacity-40 transition-opacity`} />
              <div className="relative h-full flex flex-col items-center justify-center gap-1">
                <span className="text-base font-bold text-foreground">{genre.label}</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" />
                  {genre.listeners}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom Row: Recently Played + Discover ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recently Played */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recently Played</h2>
          <div className="rounded-2xl bg-card border border-white/[0.06] divide-y divide-white/[0.04]">
            {RECENTLY_PLAYED.map((station) => (
              <div
                key={station.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${station.gradient} flex items-center justify-center shrink-0`}>
                  <Music2 className="h-4 w-4 text-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{station.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{station.genre}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {station.duration}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discover — AI Picks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">AI Picks for You</h2>
            <span className="flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/80/[0.08] px-2 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              Personalized
            </span>
          </div>
          <div className="space-y-3">
            {DISCOVER.map((station) => (
              <div
                key={station.id}
                className="group rounded-2xl bg-card border border-white/[0.06] p-4 hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${station.gradient} flex items-center justify-center shrink-0`}>
                    <Music2 className="h-5 w-5 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{station.name}</span>
                      <span className="rounded-md border border-primary/20 bg-primary/80/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-primary">
                        {station.genre.split(' / ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{station.currentTrack}</p>
                    <div className="flex items-start gap-1.5 pt-0.5">
                      <Headphones className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{station.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Users className="h-3 w-3" />
                    {station.listeners}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Fixed Mini-Player ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-card backdrop-blur-xl px-6 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          {/* Art */}
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${currentStation.gradient} flex items-center justify-center shrink-0`}>
            <Music2 className="h-4 w-4 text-white/50" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{currentStation.name}</span>
              {playing && (
                <span className="flex items-center gap-1 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                  <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{currentStation.currentTrack}</p>
          </div>

          {/* Waveform animation */}
          <div className="hidden sm:flex items-center gap-[2px] h-5">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full bg-primary/80"
                style={{
                  height: playing ? `${4 + Math.sin(i * 0.8) * 8 + 4}px` : '3px',
                  transition: 'height 0.3s ease',
                  animation: playing ? `waveBar 0.7s ease-in-out infinite alternate` : 'none',
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => playStation(currentStation)}
              disabled={!!currentStation.comingSoon}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-sm shadow-purple-900/40 hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {playing ? (
                <Pause className="h-4 w-4 text-white fill-white" />
              ) : (
                <Play className="h-4 w-4 text-white fill-white ml-0.5" />
              )}
            </button>
            <button
              onClick={skipToNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume mini */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 w-32">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              className="flex-1 h-1 appearance-none rounded-full bg-white/[0.08] accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

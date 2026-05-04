'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Tv2, Search, Play, X, Radio, Globe, Heart,
  Info, ChevronRight, Signal, Volume2, VolumeX,
  Maximize2, Minimize2, Wifi, WifiOff, Star, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface Channel {
  id: string;
  name: string;
  category: string;
  language: string;
  resolution: 'HD' | 'FHD' | '4K';
  streamUrl: string;
  logo: string;
  description: string;
  free: boolean;
  featured?: boolean;
  bgColor: string;
  logoColor: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Channels — real public HLS streams where available                        */
/* ────────────────────────────────────────────────────────────────────────── */

const CHANNELS: Channel[] = [
  // ── News ──────────────────────────────────────────────────────────────
  {
    id: 'nasa-tv', name: 'NASA TV', category: 'Science', language: 'EN', resolution: 'FHD', free: true, featured: true,
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    logo: '🚀', bgColor: '#0b1a3d', logoColor: '#60a5fa',
    description: 'Official NASA Television — live launches, ISS coverage, and space exploration.',
  },
  {
    id: 'al-jazeera', name: 'Al Jazeera EN', category: 'News', language: 'EN', resolution: 'FHD', free: true, featured: true,
    streamUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    logo: '🌍', bgColor: '#1a2a1a', logoColor: '#4ade80',
    description: 'Independent international news from Al Jazeera English.',
  },
  {
    id: 'al-jazeera-ar', name: 'Al Jazeera AR', category: 'News', language: 'AR', resolution: 'FHD', free: true,
    streamUrl: 'https://live-hls-web-aja.getaj.net/AJA/01.m3u8',
    logo: 'AJA', bgColor: '#1a2a1a', logoColor: '#86efac',
    description: 'Al Jazeera Arabic live news channel.',
  },
  {
    id: 'france24', name: 'France 24', category: 'News', language: 'EN', resolution: 'FHD', free: true,
    streamUrl: 'https://stream.france24.com/hls/live/2037199/F24_EN_HI_HLS/master.m3u8',
    logo: 'F24', bgColor: '#1a1a2e', logoColor: '#818cf8',
    description: 'French international 24-hour news channel in English.',
  },
  {
    id: 'dw-news', name: 'DW News', category: 'News', language: 'EN', resolution: 'FHD', free: true,
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    logo: 'DW', bgColor: '#001f3f', logoColor: '#38bdf8',
    description: 'Deutsche Welle — German international broadcaster covering world events.',
  },
  {
    id: 'cgtn', name: 'CGTN', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8',
    logo: 'CG', bgColor: '#1a0a0a', logoColor: '#f87171',
    description: 'China Global Television Network — international news from China.',
  },
  {
    id: 'euronews', name: 'Euronews', category: 'News', language: 'EN', resolution: 'FHD', free: true,
    streamUrl: 'https://rakuten-euronews-1-gb.samsung.wurl.tv/playlist.m3u8',
    logo: 'EN', bgColor: '#0a1628', logoColor: '#fbbf24',
    description: 'European news channel covering international affairs in multiple languages.',
  },
  {
    id: 'pbs-news', name: 'PBS NewsHour', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://dai.google.com/linear/hls/event/Sid4xiTQTkCT1SLu6rjUSQ/master.m3u8',
    logo: 'PBS', bgColor: '#1a0a2e', logoColor: '#c084fc',
    description: 'Trusted public broadcasting news from the United States.',
  },
  {
    id: 'fox-news-now', name: 'Fox News Now', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://fox-foxnewsnow-vizio.amagi.tv/playlist.m3u8',
    logo: 'FOX', bgColor: '#001428', logoColor: '#0ea5e9',
    description: 'Fox News Now live stream.',
  },
  {
    id: 'livenow-fox', name: 'LiveNOW from Fox', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00488-foxdigital-livenowbyfox-lgus/playlist.m3u8',
    logo: 'LNF', bgColor: '#0a0a1a', logoColor: '#f97316',
    description: 'LiveNOW from Fox — breaking news and live events.',
  },
  {
    id: 'rt-news', name: 'RT International', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8',
    logo: 'RT', bgColor: '#1a0000', logoColor: '#ef4444',
    description: 'RT International live news.',
  },
  {
    id: 'alhurra', name: 'Alhurra', category: 'News', language: 'AR', resolution: 'HD', free: true,
    streamUrl: 'https://mbn-ingest-worldsafe.akamaized.net/hls/live/2038900/MBN_Alhurra_Worldsafe_HLS/master.m3u8',
    logo: 'ALH', bgColor: '#0f1a0f', logoColor: '#4ade80',
    description: 'US-funded Arabic news channel.',
  },
  // ── Local US News ─────────────────────────────────────────────────────
  {
    id: 'nbc-la', name: 'NBC Los Angeles', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://nbculocallive.akamaized.net/hls/live/2037084/losangeles/stream1/master.m3u8',
    logo: 'NBC', bgColor: '#1a0a2e', logoColor: '#a78bfa',
    description: 'NBC local news for Los Angeles.',
  },
  {
    id: 'nbc-sd', name: 'NBC San Diego', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://nbculocallive.akamaized.net/hls/live/2037098/sandiego/stream1/master.m3u8',
    logo: 'NBC', bgColor: '#1a0a2e', logoColor: '#818cf8',
    description: 'NBC local news for San Diego.',
  },
  {
    id: 'fox-dallas', name: 'Fox 4 Dallas', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00488-foxdigital-fox4dallaskdfw-vizious/playlist.m3u8',
    logo: 'FOX4', bgColor: '#001428', logoColor: '#38bdf8',
    description: 'Fox 4 Dallas (KDFW) local news.',
  },
  {
    id: 'fox-la', name: 'Fox 11 Los Angeles', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00488-foxdigital-fox11losangeleskttv-vizious/playlist.m3u8',
    logo: 'FOX11', bgColor: '#001428', logoColor: '#7dd3fc',
    description: 'Fox 11 Los Angeles (KTTV) local news.',
  },
  {
    id: 'fox-houston', name: 'Fox 26 Houston', category: 'News', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00488-foxdigital-kriv-lgus/playlist.m3u8',
    logo: 'FOX26', bgColor: '#001428', logoColor: '#bae6fd',
    description: 'Fox 26 Houston (KRIV) local news.',
  },
  // ── Science & Weather ─────────────────────────────────────────────────
  {
    id: 'fox-weather', name: 'Fox Weather', category: 'Science', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://247wlive.foxweather.com/stream/index.m3u8',
    logo: '🌤', bgColor: '#001a28', logoColor: '#7dd3fc',
    description: 'Live weather coverage from Fox Weather.',
  },
  {
    id: 'rt-doc', name: 'RT Documentary', category: 'Science', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://rt-glb.rttv.com/live/rtdoc/playlist.m3u8',
    logo: 'RTD', bgColor: '#0a0a14', logoColor: '#c084fc',
    description: 'RT Documentary — world culture and history.',
  },
  // ── Business & Finance ────────────────────────────────────────────────
  {
    id: 'bloomberg-orig', name: 'Bloomberg Originals', category: 'Business', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://86fdc85a.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctZ2JfQmxvb21iZXJnT3JpZ2luYWxzX0hMUw/playlist.m3u8',
    logo: 'BLM', bgColor: '#0a0a00', logoColor: '#fbbf24',
    description: 'Bloomberg Originals — in-depth business stories.',
  },
  {
    id: 'bloomberg-tv', name: 'Bloomberg TV+', category: 'Business', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://66e4bbba.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctZ2JfQmxvb21iZXJnVFZQbHVzX0hMUw/playlist.m3u8',
    logo: 'BTV', bgColor: '#0a0a00', logoColor: '#f59e0b',
    description: 'Bloomberg TV+ business and markets coverage.',
  },
  // ── Entertainment ─────────────────────────────────────────────────────
  {
    id: 'pbs-create', name: 'PBS Create', category: 'Entertainment', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://create.lls.pbs.org/index.m3u8',
    logo: 'PBS', bgColor: '#1a1200', logoColor: '#fbbf24',
    description: 'Cooking, travel, home improvement and arts from PBS.',
  },
  {
    id: 'bounce-xl', name: 'Bounce XL', category: 'Entertainment', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01438-ewscrippscompan-bouncexl-tablo/playlist.m3u8',
    logo: 'BXL', bgColor: '#1a0a00', logoColor: '#fb923c',
    description: 'Movies, sports and entertainment on Bounce XL.',
  },
  {
    id: 'pbs-fnx', name: 'PBS FNX', category: 'Entertainment', language: 'EN', resolution: 'HD', free: true,
    streamUrl: 'https://fnx.lls.pbs.org/index.m3u8',
    logo: 'FNX', bgColor: '#1a0f0a', logoColor: '#f87171',
    description: 'First Nations Experience — Indigenous arts and culture.',
  },
];

const CATEGORIES = ['News', 'Sports', 'Entertainment', 'Movies', 'Science'] as const;

/* ────────────────────────────────────────────────────────────────────────── */
/*  HLS Video Player                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

function LivePlayer({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel.streamUrl) { setStatus('error'); return; }

    const proxyUrl = (url: string) => `/api/iptv/proxy?url=${encodeURIComponent(url)}`;

    async function init() {
      // Safari / WebKit — supports HLS natively
      if (video!.canPlayType('application/vnd.apple.mpegurl')) {
        video!.src = channel.streamUrl;
        video!.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
        return;
      }
      // Chrome/Firefox/WebView — use hls.js
      const Hls = (await import('hls.js')).default;
      if (!Hls.isSupported()) { setStatus('error'); return; }
      let retried = false;
      const hls = new Hls({
        maxBufferLength: 20,
        enableWorker: false, // Web Workers are restricted in Android WebView
        lowLatencyMode: false,
        backBufferLength: 10,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false;
        },
      });
      hlsRef.current = hls;
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video!);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video!.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
      });
      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR && !retried) {
          // Direct stream failed — retry through CORS proxy
          retried = true;
          hls.stopLoad();
          hls.loadSource(proxyUrl(channel.streamUrl));
          hls.startLoad();
        } else if (data.fatal) {
          setStatus('error');
        }
      });
    }
    init();

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (video) { video.pause(); video.src = ''; }
    };
  }, [channel.streamUrl]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // D-pad / keyboard navigation for Android TV / WebView remote controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
        onClose();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        resetControlsTimer();
        const video = videoRef.current;
        if (video) {
          if (video.paused) { video.play().catch(() => {}); } else { video.pause(); }
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        resetControlsTimer();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, resetControlsTimer]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background backdrop-blur-lg p-4"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-background rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '16/9' }}
        onMouseMove={resetControlsTimer}
        onClick={resetControlsTimer}
      >
        {/* Video */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted={muted}
          playsInline
          autoPlay
          x-webkit-airplay="allow"
          webkit-playsinline="true"
        />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card">
            <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Connecting to {channel.name}…</p>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card"
            style={{ background: `linear-gradient(135deg, ${channel.bgColor}, #0a0a0a)` }}>
            <span className="text-6xl mb-4">{channel.logo}</span>
            <WifiOff className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-foreground font-semibold">{channel.name}</p>
            <p className="text-sm text-muted-foreground mt-1">Stream temporarily unavailable</p>
            <p className="text-xs text-muted-foreground mt-3 max-w-xs text-center">
              Live streams may have geo-restrictions or brief outages. Try again shortly.
            </p>
          </div>
        )}

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col justify-between pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)' }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-red-500/25 border border-red-500/40 rounded-full px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Live</span>
                  </span>
                  <span className="text-white font-semibold text-sm">{channel.name}</span>
                  <span className="text-xs text-muted-foreground border border-white/10 rounded px-1.5 py-0.5">{channel.resolution}</span>
                </div>
                <button
                  onClick={onClose}
                  className="bg-background hover:bg-red-600/80 border border-white/10 rounded-full p-2 transition-all"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Bottom controls */}
              <div className="flex items-center gap-3 px-4 py-3 pointer-events-auto">
                <button
                  onClick={() => setMuted(!muted)}
                  className="bg-background hover:bg-background rounded-full p-2 transition-all border border-white/10"
                >
                  {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
                </button>
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wifi className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-green-400">Live</span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="bg-background hover:bg-background rounded-full p-2 transition-all border border-white/10"
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4 text-white" /> : <Maximize2 className="h-4 w-4 text-white" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Channel Card                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function ChannelCard({ channel, onClick, focused }: { channel: Channel; onClick: () => void; focused?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group flex-shrink-0 w-44 rounded-2xl overflow-hidden border transition-all duration-200 text-left"
      style={{
        background: `linear-gradient(135deg, ${channel.bgColor} 0%, #0a0a0a 100%)`,
        borderColor: focused ? '#E11D2E' : 'rgba(255,255,255,0.06)',
        outline: focused ? '2px solid #E11D2E' : 'none',
        boxShadow: focused ? '0 0 20px rgba(225,29,46,0.4)' : undefined,
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-24 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 40% 40%, ${channel.logoColor}33, transparent)` }} />
        <span className="text-2xl font-black select-none" style={{ color: channel.logoColor, fontSize: typeof channel.logo === 'string' && channel.logo.length > 2 ? '1rem' : '1.8rem', letterSpacing: '-0.02em' }}>
          {channel.logo}
        </span>
        {/* Live badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-background backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${channel.free ? 'bg-red-400 animate-pulse' : 'bg-muted'}`} />
          <span className={`text-[9px] font-bold tracking-wider uppercase ${channel.free ? 'text-red-300' : 'text-muted-foreground'}`}>
            {channel.free ? 'Live' : 'Sub'}
          </span>
        </div>
        {/* Resolution badge */}
        <div className="absolute top-2 right-2 bg-background backdrop-blur-sm rounded px-1.5 py-0.5">
          <span className="text-[9px] font-bold tracking-wider text-foreground">{channel.resolution}</span>
        </div>
        {/* Lock for premium */}
        {!channel.free && (
          <div className="absolute inset-0 bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        {/* Play overlay for free */}
        {channel.free && (
          <div className="absolute inset-0 bg-background group-hover:bg-background flex items-center justify-center transition-all duration-200">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-600/80 rounded-full p-2.5 shadow-lg shadow-red-600/30">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground truncate">{channel.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{channel.language}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-[10px]" style={{ color: channel.logoColor + 'aa' }}>{channel.category}</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Channel Info Modal (for premium/offline channels)                        */
/* ────────────────────────────────────────────────────────────────────────── */

function ChannelModal({ channel, onClose, onWatch }: { channel: Channel; onClose: () => void; onWatch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-card backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60"
      >
        {/* Hero */}
        <div className="relative h-48 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${channel.bgColor} 0%, #111 100%)` }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 40% 40%, ${channel.logoColor}22, transparent 70%)` }} />
          <span className="text-7xl font-black select-none relative z-10"
            style={{ color: channel.logoColor, fontSize: typeof channel.logo === 'string' && channel.logo.length > 2 ? '3rem' : '5rem' }}>
            {channel.logo}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-background backdrop-blur-sm rounded-full p-2 border border-white/10 hover:bg-red-600/50 transition-colors z-10">
            <X className="h-4 w-4 text-foreground" />
          </button>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
            {channel.free ? (
              <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-muted border border-white/10 rounded-full px-3 py-1">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Premium</span>
              </span>
            )}
            <span className="bg-background rounded-full px-2.5 py-1 text-xs font-bold text-foreground border border-white/10">{channel.resolution}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{channel.name}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Globe className="h-3 w-3" />{channel.language}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{channel.category}</span>
              {channel.free && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-1 text-xs text-green-400"><Signal className="h-3 w-3" />Free stream</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{channel.description}</p>

          <div className="flex gap-3">
            {channel.free ? (
              <button
                onClick={onWatch}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-2xl py-3 transition-all shadow-lg shadow-red-900/30"
              >
                <Play className="h-4 w-4 fill-white" /> Watch Live
              </button>
            ) : (
              <button className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted text-foreground font-semibold text-sm rounded-2xl py-3 transition-all border border-white/[0.06]">
                <Lock className="h-4 w-4" /> Subscription Required
              </button>
            )}
            <button className="flex items-center justify-center bg-muted hover:bg-muted border border-white/[0.06] text-foreground rounded-2xl px-4 py-3 transition-all">
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Featured Hero                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function FeaturedHero({ channel, onWatch }: { channel: Channel; onWatch: () => void }) {
  return (
    <div className="mx-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative rounded-3xl overflow-hidden border border-red-900/30"
        style={{
          background: `linear-gradient(135deg, ${channel.bgColor} 0%, #0a0a0a 100%)`,
          boxShadow: '0 0 60px rgba(220,38,38,0.1), 0 20px 60px -20px rgba(0,0,0,0.9)',
        }}
      >
        <div className="aspect-video relative flex items-center justify-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 60% 40%, ${channel.logoColor}18, transparent 70%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/70 to-transparent" />

          {/* Big logo */}
          <span className="absolute right-16 text-[140px] font-black select-none opacity-5"
            style={{ color: channel.logoColor }}>
            {channel.logo}
          </span>

          {/* Play button */}
          <button onClick={onWatch} className="absolute inset-0 flex items-center justify-center group">
            <motion.div
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
              className="bg-red-600/20 hover:bg-red-600/50 backdrop-blur-sm border border-red-500/40 rounded-full p-5 transition-all duration-200 shadow-2xl shadow-red-900/30"
            >
              <Play className="h-10 w-10 text-white fill-white" />
            </motion.div>
          </button>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Live</span>
              </span>
              <span className="text-xs text-muted-foreground bg-background backdrop-blur-sm rounded-full px-3 py-1 border border-white/[0.06]">Featured</span>
              <span className="text-xs bg-background backdrop-blur-sm rounded-full px-3 py-1 border border-white/[0.06]" style={{ color: channel.logoColor }}>{channel.resolution}</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">{channel.name}</h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{channel.description}</p>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={onWatch}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-all shadow-lg shadow-red-900/30">
                <Play className="h-3.5 w-3.5 fill-white" /> Watch Live
              </button>
              <button className="flex items-center gap-2 bg-white/8 hover:bg-white/12 backdrop-blur-sm text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 transition-all">
                <Info className="h-3.5 w-3.5" /> Info
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Category Row                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function CategoryRow({ category, channels, onChannelClick }: {
  category: string; channels: Channel[]; onChannelClick: (ch: Channel) => void;
}) {
  const freeCount = channels.filter((c) => c.free).length;
  const freeChannels = channels.filter((c) => c.free);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Set initial focus to first free channel when row is mounted
  useEffect(() => {
    if (freeChannels.length > 0) {
      setFocusedId(freeChannels[0].id);
    }
  }, [freeChannels.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // D-pad left/right navigation within this row
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!focusedId) return;
      const idx = channels.findIndex((c) => c.id === focusedId);
      if (idx === -1) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = channels[idx - 1];
        if (prev) setFocusedId(prev.id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = channels[idx + 1];
        if (next) setFocusedId(next.id);
      } else if (e.key === 'Enter') {
        const ch = channels[idx];
        if (ch) onChannelClick(ch);
      }
    };
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [focusedId, channels, onChannelClick]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="h-1 w-5 rounded-full bg-gradient-to-r from-red-600 to-red-400" />
          <h2 className="text-base font-semibold text-foreground tracking-tight">{category}</h2>
          <span className="text-xs text-muted-foreground">{channels.length} channels</span>
          {freeCount > 0 && (
            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
              {freeCount} FREE
            </span>
          )}
        </div>
        <button className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div ref={rowRef} tabIndex={0} className="px-8 overflow-x-auto pb-2 outline-none" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {channels.map((ch) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              focused={focusedId === ch.id}
              onClick={() => { setFocusedId(ch.id); onChannelClick(ch); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export default function IPTVDashboard() {
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const filtered = search
    ? CHANNELS.filter((ch) =>
        ch.name.toLowerCase().includes(search.toLowerCase()) ||
        ch.category.toLowerCase().includes(search.toLowerCase())
      )
    : CHANNELS;

  const featured = CHANNELS.find((c) => c.featured && c.free) ?? CHANNELS[0];
  const byCategory = CATEGORIES.reduce<Record<string, Channel[]>>((acc, cat) => {
    acc[cat] = filtered.filter((ch) => ch.category === cat);
    return acc;
  }, {});

  function handleChannelClick(ch: Channel) {
    if (ch.free) {
      setPlayingChannel(ch);
    } else {
      setSelectedChannel(ch);
    }
  }

  const toggleFav = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const freeCount = CHANNELS.filter((c) => c.free).length;
  const totalCount = CHANNELS.length;

  return (
    <div className="min-h-screen bg-card pb-20">
      {/* Header */}
      <div className="px-8 pt-8 pb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3 border border-red-500/20" style={{ background: 'rgba(220,38,38,0.08)' }}>
              <Tv2 className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight"
                  style={{ background: 'linear-gradient(90deg, #fff, #fca5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Live TV
                </h1>
                <span className="rounded-full border border-red-500/25 px-3 py-0.5 text-xs font-semibold text-red-300" style={{ background: 'rgba(220,38,38,0.1)' }}>
                  {totalCount} channels
                </span>
                <span className="rounded-full border border-green-500/25 px-2.5 py-0.5 text-xs font-semibold text-green-300" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  {freeCount} free
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Stream live TV from around the world</p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search channels…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-white/[0.06] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/40 focus:bg-card transition-all"
            />
          </div>
        </motion.div>
      </div>

      {/* Featured */}
      {!search && (
        <div className="mb-8">
          <FeaturedHero channel={featured} onWatch={() => setPlayingChannel(featured)} />
        </div>
      )}

      {/* Category Rows */}
      <div className="space-y-8">
        {search ? (
          <div className="px-8">
            <p className="text-sm text-muted-foreground mb-5">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
            <div className="flex flex-wrap gap-4">
              {filtered.map((ch) => <ChannelCard key={ch.id} channel={ch} onClick={() => handleChannelClick(ch)} />)}
            </div>
          </div>
        ) : (
          CATEGORIES.map((cat) =>
            byCategory[cat]?.length > 0 ? (
              <CategoryRow key={cat} category={cat} channels={byCategory[cat]} onChannelClick={handleChannelClick} />
            ) : null
          )
        )}
      </div>

      {/* Stats Bar */}
      <div className="mx-8 mt-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-8 rounded-2xl border border-white/[0.04] bg-card px-8 py-4">
          {[
            { icon: Tv2, label: `${totalCount} channels`, color: 'text-red-400' },
            { icon: Radio, label: `${CATEGORIES.length} categories`, color: 'text-red-500' },
            { icon: Signal, label: `${freeCount} free streams`, color: 'text-green-400' },
            { icon: Star, label: '4K available', color: 'text-amber-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className={`h-4 w-4 ${color}`} />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Channel Info Modal (premium or error info) */}
      <AnimatePresence>
        {selectedChannel && !playingChannel && (
          <ChannelModal
            channel={selectedChannel}
            onClose={() => setSelectedChannel(null)}
            onWatch={() => { setPlayingChannel(selectedChannel); setSelectedChannel(null); }}
          />
        )}
      </AnimatePresence>

      {/* Live Player */}
      <AnimatePresence>
        {playingChannel && (
          <LivePlayer
            channel={playingChannel}
            onClose={() => setPlayingChannel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Phone, Trash2, CheckCheck, X, FileText, Clock, Calendar,
} from 'lucide-react';
import { Button, Badge } from '@memelli/ui';
import type { VoicemailItem } from './page';

interface VoicemailDetailPanelProps {
  voicemail: VoicemailItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onCallback: (number: string) => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoicemailDetailPanel({
  voicemail,
  onMarkRead,
  onDelete,
  onCallback,
  onClose,
}: VoicemailDetailPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
  }, [voicemail.id]);

  function togglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    } else {
      setIsPlaying(true);
      progressInterval.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= voicemail.duration) {
            setIsPlaying(false);
            if (progressInterval.current) clearInterval(progressInterval.current);
            return 0;
          }
          return prev + playbackSpeed;
        });
      }, 1000);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.floor(pct * voicemail.duration));
  }

  function skipBack() {
    setCurrentTime((prev) => Math.max(0, prev - 10));
  }

  function skipForward() {
    setCurrentTime((prev) => Math.min(voicemail.duration, prev + 10));
  }

  function cycleSpeed() {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  }

  const progress = voicemail.duration > 0 ? (currentTime / voicemail.duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {voicemail.fromName ?? 'Unknown Caller'}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{voicemail.fromNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={voicemail.isRead ? 'muted' : 'primary'}>
            {voicemail.isRead ? 'Read' : 'New'}
          </Badge>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Meta info */}
        <div className="flex items-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(voicemail.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(voicemail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(voicemail.duration)} duration</span>
          </div>
        </div>

        {/* Audio Player */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {/* Progress bar */}
          <div
            className="h-2 bg-zinc-800 rounded-full cursor-pointer group relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-red-500 rounded-full transition-all relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-red-400 border-2 border-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-zinc-500 font-mono">{formatDuration(currentTime)}</span>
            <span className="text-xs text-zinc-500 font-mono">{formatDuration(voicemail.duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={skipBack}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Back 10s"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={togglePlay}
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>

            <button
              onClick={skipForward}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Forward 10s"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={cycleSpeed}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-2 py-0.5 transition-colors"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* Transcription */}
        {voicemail.transcription && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-red-400" />
              <h4 className="text-sm font-semibold text-zinc-100">Transcription</h4>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm text-zinc-300 leading-relaxed">{voicemail.transcription}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onCallback(voicemail.fromNumber)}
            className="flex-1"
          >
            <Phone className="h-4 w-4 mr-1" /> Callback
          </Button>
          {!voicemail.isRead && (
            <Button
              variant="secondary"
              onClick={() => onMarkRead(voicemail.id)}
            >
              <CheckCheck className="h-4 w-4 mr-1" /> Mark Read
            </Button>
          )}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { onDelete(voicemail.id); setShowDeleteConfirm(false); }}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-zinc-500 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

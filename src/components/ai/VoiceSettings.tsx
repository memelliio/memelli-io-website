'use client';

import { Settings, X, Volume2, Zap, Repeat } from 'lucide-react';
import type { VoiceSettings, DeepgramVoice } from '../../hooks/useVoice';

interface VoiceSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  availableVoices: DeepgramVoice[];
  ttsSupported: boolean;
  sttSupported: boolean;
  onUpdate: (partial: Partial<VoiceSettings>) => void;
}

export default function VoiceSettingsPanel({
  open,
  onClose,
  settings,
  availableVoices,
  ttsSupported,
  sttSupported,
  onUpdate,
}: VoiceSettingsPanelProps) {
  if (!open) return null;

  return (
    <div
      className="absolute bottom-full right-0 mb-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-red-400" />
          <span className="text-sm font-semibold text-zinc-100">Voice Settings</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Continuous conversation mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-sm text-zinc-300">Continuous mode</span>
          </div>
          <button
            onClick={() => onUpdate({ continuousMode: !settings.continuousMode })}
            className={[
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              settings.continuousMode ? 'bg-red-600' : 'bg-zinc-700',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                settings.continuousMode ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
        {settings.continuousMode && (
          <p className="text-xs text-zinc-500 -mt-2 ml-5">
            After the AI responds, listening restarts automatically.
          </p>
        )}

        {/* Voice selection */}
        {ttsSupported && availableVoices.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
              <label className="text-sm text-zinc-300">Voice</label>
            </div>
            <select
              value={settings.voiceURI}
              onChange={e => onUpdate({ voiceURI: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500/60"
            >
              {availableVoices
                .filter(v => v.lang.startsWith('en'))
                .map(v => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-zinc-800">
                    {v.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-zinc-400" />
              <label className="text-sm text-zinc-300">Speed</label>
            </div>
            <span className="text-xs text-zinc-500">{settings.rate.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.rate}
            onChange={e => onUpdate({ rate: parseFloat(e.target.value) })}
            className="w-full accent-red-500 bg-zinc-700 rounded-full h-1.5"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>0.5×</span>
            <span>1.0×</span>
            <span>2.0×</span>
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
              <label className="text-sm text-zinc-300">Volume</label>
            </div>
            <span className="text-xs text-zinc-500">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={e => onUpdate({ volume: parseFloat(e.target.value) })}
            className="w-full accent-red-500 bg-zinc-700 rounded-full h-1.5"
          />
        </div>

        {/* Support status */}
        <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2">
          <div className={[
            'text-center text-[10px] rounded-lg py-1',
            sttSupported ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400',
          ].join(' ')}>
            {sttSupported ? 'Voice input: on' : 'Voice input: off'}
          </div>
          <div className={[
            'text-center text-[10px] rounded-lg py-1',
            ttsSupported ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400',
          ].join(' ')}>
            {ttsSupported ? 'Voice output: on' : 'Voice output: off'}
          </div>
        </div>

        {!sttSupported && (
          <p className="text-[10px] text-zinc-600 text-center">
            Use Chrome or Edge for full voice support.
          </p>
        )}
      </div>
    </div>
  );
}

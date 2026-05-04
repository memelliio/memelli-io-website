'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Mic, MicOff, Volume2, Sparkles, Square, AlertCircle, Send
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { useVoice } from '../../../../../hooks/useVoice';
import { Button } from '../../../../../components/ui/button';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let _counter = 0;
function genId() {
  return `ve_${Date.now()}_${++_counter}`;
}

export default function VoicePage() {
  const api = useApi();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Use the shared Deepgram-backed voice hook
  const handleVoiceTranscript = useCallback((text: string) => {
    if (text.trim()) {
      processVoiceInput(text.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const voice = useVoice(handleVoiceTranscript);

  // Auto-scroll on transcript changes
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, voice.state]);

  const processVoiceInput = useCallback(async (text: string) => {
    const userEntry: TranscriptEntry = {
      id: genId(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setTranscript((prev) => [...prev, userEntry]);
    setIsProcessing(true);

    try {
      const res = await api.post<{ responseText: string; sessionId?: string; actions?: unknown[] }>('/api/ai/chat', {
        message: text,
        inputMode: 'voice'
      });
      const responseText = res.data?.responseText ?? 'Sorry, I could not process that.';
      const assistantEntry: TranscriptEntry = {
        id: genId(),
        role: 'assistant',
        text: responseText,
        timestamp: Date.now()
      };
      setTranscript((prev) => [...prev, assistantEntry]);

      // Use Deepgram TTS to speak the response
      if (voice.ttsSupported) {
        voice.speak(responseText, () => {
          // If continuous mode is enabled, restart listening after speaking
          if (voice.settings.continuousMode) {
            voice.startListening();
          }
        });
      }
    } catch {
      toast.error('Failed to process voice input');
      const errorEntry: TranscriptEntry = {
        id: genId(),
        role: 'assistant',
        text: 'Sorry, something went wrong.',
        timestamp: Date.now()
      };
      setTranscript((prev) => [...prev, errorEntry]);

      if (voice.ttsSupported) {
        voice.speak('Sorry, something went wrong.');
      }
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, voice.ttsSupported]);

  const handleTextSubmit = useCallback(() => {
    const text = textInput.trim();
    if (!text || isProcessing) return;
    setTextInput('');
    processVoiceInput(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput, isProcessing]);

  const handleMicClick = useCallback(() => {
    switch (voice.state) {
      case 'listening':
        voice.stopListening();
        break;
      case 'speaking':
        voice.stopSpeaking();
        break;
      case 'error':
        voice.resetError();
        break;
      case 'thinking':
        break; // no-op while processing STT
      default:
        if (voice.sttSupported) voice.startListening();
    }
  }, [voice]);

  // Determine visual state — combine voice hook state with AI processing
  const displayState = isProcessing ? 'processing' : voice.state;

  const stateColors: Record<string, string> = {
    idle: 'border-white/[0.06] bg-card',
    listening: 'border-primary/30 bg-primary/10',
    thinking: 'border-amber-500/20 bg-amber-500/5',
    processing: 'border-primary/30 bg-primary/10',
    speaking: 'border-emerald-500/20 bg-emerald-500/5',
    error: 'border-primary/20 bg-primary/80/5'
  };

  const stateLabels: Record<string, string> = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Transcribing...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    error: 'Error - tap to retry'
  };

  const stateTextColors: Record<string, string> = {
    idle: 'text-muted-foreground',
    listening: 'text-primary',
    thinking: 'text-amber-400',
    processing: 'text-primary',
    speaking: 'text-emerald-400',
    error: 'text-primary'
  };

  const isDisabled = displayState === 'thinking' || displayState === 'processing';

  const iconEl = (() => {
    switch (displayState) {
      case 'listening':
        return <MicOff className="h-10 w-10 text-primary" />;
      case 'thinking':
      case 'processing':
        return <LoadingGlobe size="xl" />;
      case 'speaking':
        return <Volume2 className="h-10 w-10 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="h-10 w-10 text-primary" />;
      default:
        return <Mic className="h-10 w-10 text-muted-foreground" />;
    }
  })();

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-3rem)] max-w-2xl mx-auto bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <button
          onClick={() => router.push('/dashboard/ai-assistant')}
          className="rounded-xl p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Voice Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Speak naturally to interact with your AI</p>
        </div>
      </div>

      {!voice.sttSupported ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <MicOff className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-foreground font-semibold tracking-tight">Microphone Not Available</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              Your browser does not support microphone access. Please use a modern browser with HTTPS.
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/dashboard/ai-assistant')}>
            Use text chat instead
          </Button>
        </div>
      ) : (
        <>
          {/* Transcript display */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-6 min-h-0">
            {transcript.length === 0 && displayState === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <Sparkles className="h-12 w-12 text-primary/30" />
                <p className="text-muted-foreground leading-relaxed text-sm">Tap the microphone and start speaking</p>
              </div>
            )}

            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${entry.role === 'user' ? 'ml-6' : 'mr-6'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      entry.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm shadow-lg shadow-purple-900/20'
                        : 'bg-card backdrop-blur-xl text-foreground rounded-bl-sm border border-white/[0.04]'
                    }`}
                  >
                    {entry.text}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${entry.role === 'user' ? 'text-right' : ''}`}>
                    {entry.role === 'user' ? 'You (voice)' : 'AI'} · {formatTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Show STT transcript being captured */}
            {voice.transcript && voice.state === 'thinking' && (
              <div className="flex justify-end">
                <div className="max-w-[85%] ml-6">
                  <div className="rounded-2xl rounded-br-sm bg-primary/40 px-4 py-3 text-sm text-white/70 italic">
                    {voice.transcript}
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-card backdrop-blur-xl rounded-2xl rounded-bl-sm px-4 py-3 border border-white/[0.04]">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Big mic button area */}
          <div className="flex flex-col items-center gap-4 py-8 shrink-0">
            {/* State label */}
            <p className={`text-sm font-medium transition-all duration-200 ${stateTextColors[displayState] ?? 'text-muted-foreground'}`}>
              {stateLabels[displayState] ?? 'Tap to speak'}
            </p>

            {/* Mic button */}
            <button
              onClick={handleMicClick}
              disabled={isDisabled}
              className={`relative flex items-center justify-center h-24 w-24 rounded-full border-2 backdrop-blur-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${stateColors[displayState] ?? stateColors.idle}`}
            >
              {displayState === 'listening' && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <span className="absolute inset-[-8px] rounded-full border border-primary/10 animate-pulse" />
                </>
              )}
              {iconEl}
            </button>

            {/* Secondary controls */}
            <div className="flex items-center gap-3">
              {voice.state === 'speaking' && (
                <Button size="sm" variant="ghost" onClick={voice.stopSpeaking}>
                  <Square className="h-3 w-3 mr-1" /> Stop Speaking
                </Button>
              )}

              {/* Voice selector */}
              <select
                value={voice.settings.voiceURI}
                onChange={(e) => voice.updateSettings({ voiceURI: e.target.value })}
                className="bg-card backdrop-blur-xl border border-white/[0.04] text-muted-foreground text-xs rounded-xl px-2 py-1 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                {voice.availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>

              {/* Continuous mode toggle */}
              <button
                onClick={() => voice.updateSettings({ continuousMode: !voice.settings.continuousMode })}
                className={`text-xs px-2 py-1 rounded-xl border transition-all duration-200 ${
                  voice.settings.continuousMode
                    ? 'border-primary/25 bg-primary/10 text-primary/80'
                    : 'border-white/[0.04] bg-card text-muted-foreground hover:text-foreground'
                }`}
                title="Continuous conversation mode: auto-listen after AI responds"
              >
                {voice.settings.continuousMode ? 'Continuous: ON' : 'Continuous: OFF'}
              </button>
            </div>

            {/* Text input fallback */}
            <div className="flex w-full max-w-lg gap-2 mt-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="Or type here..."
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-white/[0.06] bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
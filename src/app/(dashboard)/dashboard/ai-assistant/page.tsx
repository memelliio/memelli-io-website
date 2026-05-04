'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Bot, User, Volume2, VolumeX, Sparkles, Zap } from 'lucide-react';
import { API_URL } from '../../../../lib/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  dispatched?: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token') || localStorage.getItem('memelli_live_token') || null;
}

function genId() { return Math.random().toString(36).slice(2, 10); }

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm Melli — your AI operating system. I can help you manage clients, run campaigns, send messages, build workflows, or answer any question about your business. What do you need?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sessionId] = useState(() => genId());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak text via Deepgram TTS
  const speakText = useCallback(async (text: string) => {
    if (!text || !voiceEnabled) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 500), voice: 'aura-2-aurora-en' }),
      });
      if (!res.ok) { setIsSpeaking(false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsSpeaking(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsSpeaking(false); };
      await audio.play().catch(() => setIsSpeaking(false));
    } catch { setIsSpeaking(false); }
  }, [voiceEnabled]);

  // Send message to Jessica/Claude
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: genId(), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/voice/jessica`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ transcript: text.trim(), sessionId }),
      });

      const data = await res.json();
      const responseText = data.response || "I'm processing that. Give me a moment.";

      const assistantMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        dispatched: data.dispatched,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Speak the response if voice enabled
      if (voiceEnabled) {
        speakText(responseText);
      }
    } catch {
      const errMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: "Sorry, I had trouble connecting. Check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, voiceEnabled, speakText]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          try {
            const token = getToken();
            const res = await fetch('/api/voice/stt', {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData,
            });
            const data = await res.json();
            const text = data.text || data.data?.text || '';
            if (text) sendMessage(text);
          } catch { /* ignore */ }
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
    } catch { /* mic denied */ }
  }, [sendMessage]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-card backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/80/15 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Melli</h1>
            <p className="text-xs text-muted-foreground">Your AI Operating System</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
              </span>
              <span>Thinking...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Volume2 className="h-3.5 w-3.5 animate-pulse" />
              <span>Speaking</span>
            </div>
          )}
          <button
            onClick={() => {
              setVoiceEnabled(v => !v);
              if (isSpeaking && audioRef.current) { audioRef.current.pause(); setIsSpeaking(false); }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${voiceEnabled ? 'bg-primary/80/15 text-primary border border-primary/20' : 'bg-card backdrop-blur-xl text-muted-foreground border border-white/[0.04]'}`}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-card backdrop-blur-xl border border-white/[0.04]' : 'bg-primary/80/15 border border-primary/20'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4 text-muted-foreground" /> : <Sparkles className="h-4 w-4 text-primary" />}
            </div>
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary/20 text-foreground border border-primary/20 rounded-tr-sm' : 'bg-card backdrop-blur-xl border border-white/[0.04] text-foreground rounded-tl-sm'}`}>
                {msg.content}
                {msg.dispatched && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-amber-400">Dispatched to agents</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/80/15 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary/70/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-primary/70/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-primary/70/60 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        {['Call my top leads', 'Show pipeline', 'Send follow-up texts', 'Run daily report'].map(s => (
          <button key={s} onClick={() => sendMessage(s)}
            className="shrink-0 px-3 py-1.5 bg-card border border-white/[0.04] rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-white/[0.08] transition-all">
            {s}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-center gap-2 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Melli anything..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${isRecording ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
            title="Hold to speak"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Hold mic to speak · Press Enter to send · Voice output {voiceEnabled ? 'on' : 'off'}
        </p>
      </div>
    </div>
  );
}

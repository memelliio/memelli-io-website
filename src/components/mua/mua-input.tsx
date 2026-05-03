'use client';

import { useRef, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { Send, Mic, MicOff, Volume2, Camera, Paperclip} from 'lucide-react';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface MUAInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: (text: string) => void;
  onScreenshot: () => void;
  onFileUpload: (files: FileList) => void;
  isThinking: boolean;
  // Voice
  isVoiceSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  /** True when background wake-word recognition is running */
  isBackgroundListening?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
}

const FILE_TYPES = '.pdf,.csv,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.json';

export default function MUAInput({
  value, onChange, onSend, onScreenshot, onFileUpload,
  isThinking, isVoiceSupported, isListening, isSpeaking, isVoiceActive, onToggleVoice, isBackgroundListening, placeholder
}: MUAInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !isThinking) {
      onSend(value);
    }
  }, [value, isThinking, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Auto-resize textarea
  const handleInput = useCallback((v: string) => {
    onChange(v);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [onChange]);

  return (
    <div className="shrink-0 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Input container — modern rounded card */}
      <div
        className="rounded-2xl transition-all duration-200"
        style={{
          background: 'rgba(24, 24, 27, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask Melli anything..."}
            disabled={isThinking}
            className="flex-1 resize-none bg-transparent text-base text-zinc-200 placeholder:text-zinc-500 focus:outline-none disabled:opacity-30 transition-all leading-relaxed"
            style={{ maxHeight: 140, minHeight: 24 }}
          />
          <button
            type="submit"
            disabled={!value.trim() || isThinking}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:opacity-15 active:scale-90"
            style={{
              background: value.trim() && !isThinking
                ? 'rgba(255, 255, 255, 0.1)'
                : 'transparent',
            }}
          >
            {isThinking ? <LoadingGlobe size="sm" /> : <Send className="h-4 w-4 text-zinc-300" />}
          </button>
        </form>

        {/* Action bar — inside the card, below input */}
        <div className="flex items-center gap-1 px-3 pb-2.5">
          {isVoiceSupported && (
            <button
              type="button"
              onClick={onToggleVoice}
              title={
                isListening ? 'Listening...' :
                isSpeaking ? 'Speaking...' :
                isVoiceActive ? 'Voice active' :
                isBackgroundListening ? 'Listening for wake word' :
                'Voice'
              }
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                isListening ? 'text-red-400/80 animate-pulse bg-red-500/10' :
                isSpeaking ? 'text-emerald-400/80 bg-emerald-500/10' :
                isVoiceActive ? 'text-red-400/60 bg-red-500/5' :
                isBackgroundListening ? 'text-red-400/30' :
                'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              {isSpeaking ? <Volume2 className="h-3.5 w-3.5" /> :
               (isVoiceActive || isBackgroundListening) ? <Mic className="h-3.5 w-3.5" /> :
               <MicOff className="h-3.5 w-3.5" />}
            </button>
          )}
          <button type="button" onClick={onScreenshot}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-all duration-200">
            <Camera className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-all duration-200">
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <input ref={fileRef} type="file" multiple accept={FILE_TYPES} className="hidden"
            onChange={e => { if (e.target.files) onFileUpload(e.target.files); e.target.value = ''; }} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useCallback, type KeyboardEvent, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SmartComposerProps {
  onSend: (text: string) => void;
  suggestions?: string[];
  contextAction?: string;
  placeholder?: string;
  disabled?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SmartComposer({
  onSend,
  suggestions,
  contextAction,
  placeholder = 'Type a message...',
  disabled = false,
}: SmartComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasText = text.trim().length > 0;
  const actionLabel = contextAction ?? 'Ask';

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  return (
    <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={disabled}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300
                         hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 rounded-xl border border-zinc-700/50 bg-zinc-900/60
                      px-3 py-2 focus-within:border-red-500/50 focus-within:ring-1
                      focus-within:ring-red-500/20 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm
                     text-zinc-100 placeholder-zinc-500 outline-none"
        />

        <button
          onClick={send}
          disabled={!hasText || disabled}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
                      transition-all ${
                        hasText
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-zinc-700/50 text-zinc-500'
                      } disabled:opacity-50`}
          aria-label={actionLabel}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* Context action label */}
      {contextAction && (
        <p className="mt-1.5 text-center text-[11px] text-zinc-500">
          Press Enter to <span className="text-zinc-400">{actionLabel}</span>
        </p>
      )}
    </div>
  );
}

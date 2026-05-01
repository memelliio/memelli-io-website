"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  X,
  Pin,
  PinOff,
  Send,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Lightbulb
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface MUASuggestion {
  text: string;
  command: string;
  priority: number;
}

interface MUAExplanation {
  title?: string;
  content: string;
  entityType?: string;
  entityId?: string;
}

interface MUAOverlayProps {
  /** Whether the overlay is visible */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Explanation content to display */
  explanation?: MUAExplanation | null;
  /** Suggestion cards to display */
  suggestions?: MUASuggestion[];
  /** Whether content is loading */
  loading?: boolean;
  /** Execute a MUA command from the overlay */
  onCommand?: (command: string) => void;
  /** Execute a suggestion action */
  onSuggestionAction?: (suggestion: MUASuggestion) => void;
  /** Whether the overlay is pinned (stays open) */
  pinned?: boolean;
  /** Toggle pin state */
  onTogglePin?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Markdown renderer (lightweight)                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-white mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-white mt-4 mb-1">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">
          {line.slice(2)}
        </h2>
      );
    }
    // Bullet points
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-zinc-300 ml-2 my-0.5">
          <span className="text-violet-400 mt-0.5 shrink-0">&#x2022;</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    }
    // Code blocks
    else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${i}`}
          className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 text-xs text-emerald-300 font-mono my-2 overflow-x-auto"
        >
          {codeLines.join("\n")}
        </pre>
      );
    }
    // Empty lines
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    }
    // Regular text
    else {
      elements.push(
        <p key={i} className="text-sm text-zinc-300 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }

  return elements;
}

/** Render inline formatting: **bold**, *italic*, `code` */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);
    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: "bold", match: boldMatch } : null,
      codeMatch ? { type: "code", match: codeMatch } : null,
      italicMatch ? { type: "italic", match: italicMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => (a!.match.index ?? 0) - (b!.match.index ?? 0));

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    const idx = first.match.index ?? 0;

    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }

    if (first.type === "bold") {
      parts.push(
        <span key={key++} className="font-semibold text-white">
          {first.match[1]}
        </span>
      );
      remaining = remaining.slice(idx + first.match[0].length);
    } else if (first.type === "code") {
      parts.push(
        <code
          key={key++}
          className="bg-zinc-800 text-violet-300 px-1 py-0.5 rounded text-xs font-mono"
        >
          {first.match[1]}
        </code>
      );
      remaining = remaining.slice(idx + first.match[0].length);
    } else if (first.type === "italic") {
      parts.push(
        <em key={key++} className="text-zinc-200 italic">
          {first.match[1]}
        </em>
      );
      remaining = remaining.slice(idx + first.match[0].length);
    }
  }

  return <>{parts}</>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function MUAOverlay({
  open,
  onClose,
  explanation,
  suggestions,
  loading,
  onCommand,
  onSuggestionAction,
  pinned,
  onTogglePin
}: MUAOverlayProps) {
  const [followUp, setFollowUp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Scroll to top when content changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [explanation]);

  const handleSubmitFollowUp = useCallback(async () => {
    if (!followUp.trim() || !onCommand || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCommand(followUp.trim());
      setFollowUp("");
    } finally {
      setIsSubmitting(false);
    }
  }, [followUp, onCommand, isSubmitting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmitFollowUp();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmitFollowUp, onClose]
  );

  const hasSuggestions = suggestions && suggestions.length > 0;
  const hasExplanation = explanation && explanation.content;

  return (
    <>
      {/* Backdrop */}
      {open && !pinned && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Overlay panel */}
      <div
        className={`
          fixed top-0 right-0 h-full z-40
          w-[420px] max-w-[90vw]
          bg-zinc-900/95 backdrop-blur-xl
          border-l border-zinc-700/50
          shadow-2xl shadow-black/40
          flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">MUA</h2>
              <p className="text-[10px] text-zinc-500 leading-none">
                Memelli Cockpit Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                className={`p-1.5 rounded-md transition-colors ${
                  pinned
                    ? "bg-violet-500/20 text-violet-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
                title={pinned ? "Unpin overlay" : "Pin overlay"}
              >
                {pinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <LoadingGlobe size="md" />
                <p className="text-sm text-zinc-500">Thinking...</p>
              </div>
            </div>
          )}

          {/* Explanation content */}
          {!loading && hasExplanation && (
            <div className="space-y-2">
              {explanation.title && (
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">
                    {explanation.title}
                  </h3>
                </div>
              )}
              {explanation.entityType && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/50 mb-2">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    {explanation.entityType}
                  </span>
                  {explanation.entityId && (
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {explanation.entityId.slice(0, 8)}
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-0.5">
                {renderMarkdown(explanation.content)}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {!loading && hasSuggestions && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Suggestions
                </h3>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSuggestionAction?.(suggestion)}
                    className="w-full group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 hover:border-violet-500/40 hover:bg-zinc-800 transition-all duration-150 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 group-hover:text-white truncate">
                        {suggestion.text}
                      </p>
                      <p className="text-[11px] text-zinc-600 font-mono truncate mt-0.5">
                        {suggestion.command}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !hasExplanation && !hasSuggestions && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">
                Ask me anything about what you see on screen.
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                I can explain metrics, suggest actions, and control surfaces.
              </p>
            </div>
          )}
        </div>

        {/* Follow-up input */}
        <div className="border-t border-zinc-700/50 p-3">
          <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3 py-2 focus-within:border-violet-500/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up..."
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmitFollowUp}
              disabled={!followUp.trim() || isSubmitting}
              className="p-1 rounded-md text-zinc-500 hover:text-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <LoadingGlobe size="sm" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MUAOverlay;

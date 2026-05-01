'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { IDockviewPanelProps } from 'dockview';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

/* ─── Storage keys ───────────────────────────────────────────────────────── */

const HISTORY_KEY = 'memelli_claude_history';   // full message log
const MEMORY_KEY  = 'memelli_claude_memory';    // pinned facts / project context

const MAX_STORED_MESSAGES = 400;
const CONTEXT_TURNS = 60;   // turns sent to API each request

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(msgs: Message[]) {
  try {
    const trimmed = msgs.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch { /* storage full — ignore */ }
}

function loadMemory(): string {
  try { return localStorage.getItem(MEMORY_KEY) || ''; } catch { return ''; }
}

function saveMemory(text: string) {
  try { localStorage.setItem(MEMORY_KEY, text); } catch { }
}

/** Scan a Claude response for [memory:...] tags and persist them. */
function extractAndSaveMemory(text: string): string {
  const match = text.match(/\[memory:([\s\S]*?)\]/);
  if (!match) return text;
  const fact = match[1].trim();
  if (fact) {
    const existing = loadMemory();
    const updated = existing
      ? `${existing}\n- ${fact}`
      : `- ${fact}`;
    saveMemory(updated);
  }
  return text.replace(/\s*\[memory:[\s\S]*?\]/g, '').trim();
}

/* ─── Panel ──────────────────────────────────────────────────────────────── */

export function AdminClaudePanel(_props: IDockviewPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [showMemory, setShowMemory] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  /* ── Restore from localStorage on mount ── */
  useEffect(() => {
    const history = loadHistory();
    if (history.length) setMessages(history);
    setMemoryNote(loadMemory());
  }, []);

  /* ── Keep localStorage in sync ── */
  useEffect(() => {
    if (messages.length) saveHistory(messages);
  }, [messages]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  /* ── Send ── */
  const send = useCallback(async () => {
    const msg = input.trim();
    if (!msg || thinking) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const token = localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token') || '';
      const history = messages.slice(-CONTEXT_TURNS).map(m => ({ role: m.role, content: m.content }));
      const memory  = loadMemory();

      const res = await fetch('/api/ai/admin-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: msg, history, memory }),
      });
      const data = res.ok ? await res.json() : null;
      const raw  = data?.responseText || 'No response.';
      const clean = extractAndSaveMemory(raw);

      const asstMsg: Message = { role: 'assistant', content: clean, ts: Date.now() };
      setMessages(prev => {
        const updated = [...prev, asstMsg];
        saveHistory(updated);
        return updated;
      });
      setMemoryNote(loadMemory());
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching Claude.', ts: Date.now() }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [input, thinking, messages]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clearHistory() {
    if (!confirm('Clear conversation history? (Memory notes are kept)')) return;
    localStorage.removeItem(HISTORY_KEY);
    setMessages([]);
  }

  function clearMemory() {
    if (!confirm('Clear all memory notes?')) return;
    localStorage.removeItem(MEMORY_KEY);
    setMemoryNote('');
  }

  function saveMemoryEdit() {
    saveMemory(memoryNote);
    setShowMemory(false);
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full bg-[#080808] text-[hsl(var(--foreground))]">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.05]"
        style={{ background: 'rgba(13,10,31,0.8)' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
          <span className="text-white text-[9px] font-black">C</span>
        </div>
        <span className="text-sm font-semibold text-white">Claude — Admin Terminal</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Memory toggle */}
          <button
            onClick={() => setShowMemory(v => !v)}
            title="Pinned memory"
            className="text-[10px] px-2 py-0.5 rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            {memoryNote ? 'memory ●' : 'memory'}
          </button>
          {/* Clear history */}
          <button
            onClick={clearHistory}
            title="Clear conversation history"
            className="text-[10px] px-2 py-0.5 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))] transition-colors"
          >
            clear
          </button>
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">claude-opus-4-6</span>
        </div>
      </div>

      {/* Memory editor drawer */}
      {showMemory && (
        <div className="px-4 py-3 border-b border-violet-500/10 bg-violet-950/20">
          <p className="text-[10px] uppercase tracking-widest text-violet-400 mb-2">
            Pinned Memory — injected into every session
          </p>
          <textarea
            value={memoryNote}
            onChange={e => setMemoryNote(e.target.value)}
            rows={4}
            className="w-full bg-[hsl(var(--card))] border border-violet-500/20 rounded-lg px-3 py-2 text-xs text-[hsl(var(--foreground))] font-mono resize-none focus:outline-none focus:border-violet-500/40"
            // placeholder="e.g.&#10;- Stack: Next.js, Fastify, Prisma, Redis&#10;- Deploy: Railway (api) + Vercel (web)&#10;- Admin: you are the founder"  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
          />
          <div className="flex gap-2 mt-2">
            <button onClick={saveMemoryEdit}
              className="text-[10px] px-3 py-1 rounded-full bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:bg-violet-600/50 transition-colors">
              save
            </button>
            <button onClick={clearMemory}
              className="text-[10px] px-3 py-1 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:border-red-500/30 transition-colors">
              clear all
            </button>
            <button onClick={() => setShowMemory(false)}
              className="text-[10px] px-3 py-1 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              close
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 select-none">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
            </div>
            <p className="text-[hsl(var(--muted-foreground))] text-xs text-center">
              Code, debug, architect, deploy.<br/>History persists across sessions.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
                <span className="text-white text-[8px] font-black">C</span>
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap font-mono ${
                m.role === 'user'
                  ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-tr-sm'
                  : 'text-[hsl(var(--foreground))] rounded-tl-sm'
              }`}
              style={m.role === 'assistant'
                ? { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)' }
                : {}}
            >
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
              <span className="text-white text-[8px] font-black">C</span>
            </div>
            <div className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)' }}>
              {[0,1,2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-violet-400"
                  style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.05]">
        <div className="flex gap-2 items-end rounded-xl border border-white/[0.08] bg-[hsl(var(--card))] px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Claude… (Enter to send)"
            rows={1}
            autoFocus
            className="flex-1 bg-transparent text-xs text-[hsl(var(--foreground))] placeholder-zinc-700 resize-none focus:outline-none leading-relaxed font-mono"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <button onClick={send} disabled={!input.trim() || thinking}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
            style={{ background: input.trim() && !thinking ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(255,255,255,0.05)' }}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1 text-center tabular-nums">
          {messages.length > 0 && `${messages.length} messages stored`}
        </p>
      </div>
    </div>
  );
}

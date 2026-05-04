'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Terminal,
  MessageCircle,
  Plus,
  ChevronDown,
  X,
  Send,
  Paperclip,
  Camera,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Copy,
  Check,
  Bot,
  Cpu,
  ArrowRight,
  Clock,
  Activity,
  Server,
  Zap,
  FolderTree,
  FileText,
  Eye,
  Users,
  Rocket,
  ScrollText,
  Radio,
  ChevronUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  ToggleLeft,
  ToggleRight,
  Play,
} from 'lucide-react';
import { ClaudeTerminal } from '@/components/claude-terminal';
import type { ClaudeTerminalHandle } from '@/components/claude-terminal';
import { useApi } from '@/hooks/useApi';
import ClaudeGlobe from '@/components/claude-globe';
import type { ClaudeGlobeState } from '@/components/claude-globe';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type ClaudeMode = 'plan' | 'build';

interface SessionTab {
  id: string;
  title: string;
  mode: ClaudeMode;
  messages: StudioMessage[];
  attachments: AttachedFile[];
  context: string;
  createdAt: Date;
  isStreaming: boolean;
}

interface StudioMessage {
  id: string;
  role: 'user' | 'claude' | 'system';
  content: string;
  mode: ClaudeMode;
  timestamp: Date;
  images?: string[];
  copied?: boolean;
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  language: string;
  code: string;
  filePath?: string;
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file' | 'screenshot';
  preview?: string;
}

interface JessicaMsg {
  id: string;
  role: 'user' | 'meli' | 'system';
  content: string;
  timestamp: Date;
}

type ConsoleTab = 'activity' | 'agents' | 'deploy' | 'events';

interface ConsoleEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'agent' | 'deploy';
  message: string;
  timestamp: Date;
  source?: string;
}

type SystemStatus = 'online' | 'degraded' | 'offline';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function uid(prefix = 'os') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `Unsupported: ${file.type}`;
  if (file.size > MAX_FILE_SIZE) return `Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 5MB)`;
  return null;
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }
  return blocks;
}

function renderMarkdownLite(text: string, mode: ClaudeMode): string {
  // Minimal markdown: headers, bold, code blocks (displayed separately), inline code, lists
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold mt-3 mb-1 text-[hsl(var(--foreground))]">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1.5 text-[hsl(var(--foreground))]">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-zinc-50">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[hsl(var(--foreground))]">$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded text-xs ${mode === 'build' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-blue-500/10 text-blue-300'} font-mono">$1</code>`)
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-[hsl(var(--foreground))]">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-[hsl(var(--foreground))]"><span class="text-[hsl(var(--muted-foreground))] mr-1">$1.</span>$2</li>');
  return html;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Injected Styles                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STUDIO_STYLES = `
@keyframes os-fade-in { 0% { opacity:0; transform:translateY(4px); } 100% { opacity:1; transform:translateY(0); } }
@keyframes os-slide-right { 0% { transform:translateX(100%); opacity:0; } 100% { transform:translateX(0); opacity:1; } }
@keyframes os-slide-up { 0% { transform:translateY(100%); opacity:0; } 100% { transform:translateY(0); opacity:1; } }
@keyframes os-pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
@keyframes os-typing { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
.os-fade-in { animation: os-fade-in 0.2s ease-out; }
.os-slide-right { animation: os-slide-right 0.25s cubic-bezier(0.16,1,0.3,1); }
.os-slide-up { animation: os-slide-up 0.2s cubic-bezier(0.16,1,0.3,1); }
.os-typing-dot { animation: os-typing 1.4s infinite; }
.os-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.os-typing-dot:nth-child(3) { animation-delay: 0.4s; }
.os-scrollbar::-webkit-scrollbar { width:6px; }
.os-scrollbar::-webkit-scrollbar-track { background:transparent; }
.os-scrollbar::-webkit-scrollbar-thumb { background:rgba(113,113,122,0.3); border-radius:3px; }
.os-scrollbar::-webkit-scrollbar-thumb:hover { background:rgba(113,113,122,0.5); }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mode Pill Toggle                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ModePill({
  mode,
  onChange,
  size = 'default',
}: {
  mode: ClaudeMode;
  onChange: (m: ClaudeMode) => void;
  size?: 'default' | 'small';
}) {
  const isSmall = size === 'small';
  return (
    <div className={`flex items-center rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] ${isSmall ? 'p-0.5' : 'p-0.5'}`}>
      <button
        onClick={() => onChange('plan')}
        className={`${isSmall ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full font-medium transition-all duration-200 ${
          mode === 'plan'
            ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]'
        }`}
      >
        PLAN
      </button>
      <button
        onClick={() => onChange('build')}
        className={`${isSmall ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full font-medium transition-all duration-200 ${
          mode === 'build'
            ? 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(225,29,46,0.15)]'
            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]'
        }`}
      >
        BUILD
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status Badge                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ label, status }: { label: string; status: SystemStatus }) {
  const colors = {
    online: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    degraded: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
    offline: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
  };
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
      <div className={`w-1.5 h-1.5 rounded-full ${colors[status]} ${status === 'online' ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Console Entry Row                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ConsoleRow({ entry }: { entry: ConsoleEntry }) {
  const typeColors: Record<string, string> = {
    info: 'text-[hsl(var(--muted-foreground))]',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    agent: 'text-blue-400',
    deploy: 'text-primary',
  };
  return (
    <div className="flex items-start gap-2 px-3 py-1 hover:bg-[hsl(var(--muted))] transition-colors text-[11px] font-mono">
      <span className="text-[hsl(var(--muted-foreground))] shrink-0">{fmtTime(entry.timestamp)}</span>
      {entry.source && <span className="text-[hsl(var(--muted-foreground))] shrink-0">[{entry.source}]</span>}
      <span className={typeColors[entry.type] || 'text-[hsl(var(--muted-foreground))]'}>{entry.message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Message Bubble                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MessageBubble({
  msg,
  onCopy,
}: {
  msg: StudioMessage;
  onCopy: (id: string) => void;
}) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center py-2 os-fade-in">
        <span className="text-[11px] text-amber-500/70 bg-amber-500/5 border border-amber-500/10 rounded-full px-3 py-1">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1 os-fade-in">
        <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
          <span className={`uppercase tracking-wider ${msg.mode === 'plan' ? 'text-blue-500/50' : 'text-red-500/50'}`}>
            {msg.mode}
          </span>
          <span>{fmtTime(msg.timestamp)}</span>
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 py-2.5">
          {msg.images && msg.images.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {msg.images.map((img, i) => (
                <div key={i} className="h-16 w-16 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  // Claude response
  const accentBorder = msg.mode === 'plan' ? 'border-blue-500/15' : 'border-emerald-500/15';
  const accentBg = msg.mode === 'plan' ? 'bg-blue-500/[0.03]' : 'bg-emerald-500/[0.03]';
  const codeBlocks = extractCodeBlocks(msg.content);
  const textWithoutCode = msg.content.replace(/```(\w+)?\n[\s\S]*?```/g, '<<CODE_BLOCK>>');
  const parts = textWithoutCode.split('<<CODE_BLOCK>>');

  return (
    <div className="flex flex-col items-start gap-1 os-fade-in">
      <div className="flex items-center gap-1.5 text-[10px]">
        <div className={`w-1.5 h-1.5 rounded-full ${msg.mode === 'plan' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
        <span className={msg.mode === 'plan' ? 'text-blue-400' : 'text-emerald-400'}>Claude</span>
        <span className={`uppercase tracking-wider ${msg.mode === 'plan' ? 'text-blue-500/40' : 'text-emerald-500/40'}`}>
          {msg.mode}
        </span>
        <span className="text-[hsl(var(--muted-foreground))]">{fmtTime(msg.timestamp)}</span>
      </div>
      <div className={`max-w-[92%] rounded-2xl rounded-tl-sm ${accentBg} border ${accentBorder} px-4 py-3 relative group`}>
        {/* Copy button */}
        <button
          onClick={() => onCopy(msg.id)}
          className="absolute top-2 right-2 p-1 rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          {msg.copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>

        {/* Render text + code blocks interleaved */}
        {parts.map((part, i) => (
          <div key={i}>
            {part.trim() && (
              <div
                className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap leading-relaxed [&_h2]:text-zinc-50 [&_h3]:text-[hsl(var(--foreground))] [&_h4]:text-[hsl(var(--foreground))] [&_strong]:text-[hsl(var(--foreground))] [&_li]:list-disc"
                dangerouslySetInnerHTML={{ __html: renderMarkdownLite(part.trim(), msg.mode) }}
              />
            )}
            {codeBlocks[i] && (
              <div className="mt-2 mb-2 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{codeBlocks[i].language}</span>
                  {msg.mode === 'build' && (
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <Play className="h-2.5 w-2.5" />
                      Apply
                    </button>
                  )}
                </div>
                <pre className="px-3 py-2.5 bg-[hsl(var(--background))] overflow-x-auto text-xs font-mono text-[hsl(var(--foreground))] leading-relaxed">
                  <code>{codeBlocks[i].code}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Melli Dock (Right Side)                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function JessicaDock({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const api = useApi();
  const [messages, setMessages] = useState<JessicaMsg[]>([
    { id: uid('jm'), role: 'system', content: 'Melli online. Context-aware. Route to Claude or operate independently.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [routeMode, setRouteMode] = useState<'meli' | 'claude'>('meli');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');

    const userMsg: JessicaMsg = { id: uid('jm'), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    if (routeMode === 'claude') {
      setMessages(prev => [...prev, { id: uid('jm'), role: 'meli', content: `Routing to Claude: "${text}"`, timestamp: new Date() }]);
      return;
    }

    setThinking(true);
    try {
      const res = await api.post<{ responseText: string; sessionId?: string }>('/api/ai/chat', {
        ...(sessionId ? { sessionId } : {}),
        message: text,
        context: { terminal: 'operator-studio-jessica', mode: 'meli' },
      });
      setThinking(false);
      if (res.data?.sessionId) setSessionId(res.data.sessionId);
      const reply = typeof res.data?.responseText === 'string' ? res.data.responseText : 'Done.';
      setMessages(prev => [...prev, { id: uid('jm'), role: 'meli', content: reply, timestamp: new Date() }]);
    } catch (err: any) {
      setThinking(false);
      setMessages(prev => [...prev, { id: uid('jm'), role: 'meli', content: `Error: ${err?.message || String(err)}`, timestamp: new Date() }]);
    }
  }, [api, input, thinking, routeMode, sessionId]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-1 px-1.5 py-3 rounded-l-lg bg-[hsl(var(--card))] border border-r-0 border-[hsl(var(--border))] text-red-400 hover:bg-[hsl(var(--muted))] transition-all duration-200 backdrop-blur-sm"
        title="Open Melli"
      >
        <Bot className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="w-[300px] shrink-0 flex flex-col bg-[hsl(var(--background))] os-slide-right">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[hsl(var(--border))] shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#E11D2E] shadow-[0_0_6px_rgba(225,29,46,0.4)]" />
        <Bot className="h-3.5 w-3.5 text-[#E11D2E]" />
        <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Melli</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setRouteMode(r => r === 'meli' ? 'claude' : 'meli')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
              routeMode === 'claude'
                ? 'border-blue-500/20 bg-blue-500/5 text-blue-400'
                : 'border-red-500/20 bg-red-500/5 text-red-400'
            }`}
          >
            {routeMode === 'claude' ? (
              <><ArrowRight className="h-2.5 w-2.5" /><Cpu className="h-2.5 w-2.5" /> Claude</>
            ) : (
              <><MessageCircle className="h-2.5 w-2.5" /> Direct</>
            )}
          </button>
          <button onClick={onToggle} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0 os-scrollbar">
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'system' ? (
              <div className="text-center py-1">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] italic">{msg.content}</span>
              </div>
            ) : msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-br-sm bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2">
                  <p className="text-xs text-[hsl(var(--foreground))]">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#E11D2E]/5 border border-[#E11D2E]/10 px-3 py-2">
                  <p className="text-xs text-[hsl(var(--foreground))]">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#E11D2E]/60 px-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Melli is thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-[hsl(var(--border))] shrink-0">
        <div className="flex items-center gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={routeMode === 'claude' ? 'Route to Claude...' : 'Ask Melli...'}
            disabled={thinking}
            className="flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-[#E11D2E]/30 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="p-1.5 rounded-lg bg-[#E11D2E] text-[hsl(var(--foreground))] hover:bg-[#E11D2E]/80 disabled:opacity-30 transition-colors"
          >
            {thinking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Context Sidebar (Left)                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ContextSidebar({
  isOpen,
  onToggle,
  attachments,
  onRemoveAttachment,
}: {
  isOpen: boolean;
  onToggle: () => void;
  attachments: AttachedFile[];
  onRemoveAttachment: (id: string) => void;
}) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-1 px-1.5 py-3 rounded-r-lg bg-[hsl(var(--card))] border border-l-0 border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200 backdrop-blur-sm"
        title="Open Context"
      >
        <FolderTree className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="w-[240px] shrink-0 flex flex-col bg-[hsl(var(--background))] os-fade-in">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[hsl(var(--border))] shrink-0">
        <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Context</span>
        <button onClick={onToggle} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Module Context */}
      <div className="px-3 py-2 border-b border-[hsl(var(--border))]">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Module</span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs text-[hsl(var(--foreground))]">Operator Studio</span>
        </div>
      </div>

      {/* Attachments */}
      <div className="px-3 py-2 border-b border-[hsl(var(--border))]">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Attachments ({attachments.length})</span>
        <div className="mt-1.5 space-y-1">
          {attachments.length === 0 ? (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] italic">No files attached</p>
          ) : (
            attachments.map(f => (
              <div key={f.id} className="flex items-center gap-1.5 group">
                {f.type === 'image' || f.type === 'screenshot' ? (
                  <ImageIcon className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                ) : (
                  <FileText className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                )}
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate flex-1">{f.name}</span>
                <button
                  onClick={() => onRemoveAttachment(f.id)}
                  className="p-0.5 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Files placeholder */}
      <div className="px-3 py-2 flex-1">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Recent Files</span>
        <div className="mt-1.5 space-y-1">
          {['schema.prisma', 'page.tsx', 'route.ts', 'layout.tsx'].map(f => (
            <div key={f} className="flex items-center gap-1.5 cursor-pointer hover:bg-[hsl(var(--muted))] px-1 py-0.5 rounded transition-colors">
              <FileText className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Directory Tree placeholder */}
      <div className="px-3 py-2 border-t border-[hsl(var(--border))]">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Directory</span>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 italic">Connect Claude Server for file access</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Bottom Console                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function BottomConsole({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('activity');
  const [entries, setEntries] = useState<ConsoleEntry[]>(() => [
    { id: uid('ce'), type: 'info', message: 'Operator Studio initialized', timestamp: new Date(), source: 'system' },
    { id: uid('ce'), type: 'success', message: 'Claude Runtime connected', timestamp: new Date(), source: 'claude' },
    { id: uid('ce'), type: 'info', message: 'Melli service online', timestamp: new Date(), source: 'meli' },
    { id: uid('ce'), type: 'agent', message: 'Agent pools: 12 active, 8 idle', timestamp: new Date(), source: 'workforce' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries]);

  // Simulate new entries
  useEffect(() => {
    const interval = setInterval(() => {
      const types: ConsoleEntry['type'][] = ['info', 'success', 'agent', 'deploy'];
      const msgs = [
        'Heartbeat check passed',
        'Agent pool health: nominal',
        'Queue depth: 0 pending',
        'Memory usage: 62%',
        'API latency: 45ms avg',
        'Worker pool cycling',
        'Cache hit ratio: 94%',
        'Event bus: 12 events/sec',
      ];
      setEntries(prev => {
        const next = [...prev, {
          id: uid('ce'),
          type: types[Math.floor(Math.random() * types.length)],
          message: msgs[Math.floor(Math.random() * msgs.length)],
          timestamp: new Date(),
          source: 'system',
        }];
        return next.slice(-100);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: ConsoleTab; label: string; icon: React.ReactNode }[] = [
    { id: 'activity', label: 'Activity Log', icon: <Activity className="h-3 w-3" /> },
    { id: 'agents', label: 'Agent Status', icon: <Users className="h-3 w-3" /> },
    { id: 'deploy', label: 'Deploy Log', icon: <Rocket className="h-3 w-3" /> },
    { id: 'events', label: 'System Events', icon: <Radio className="h-3 w-3" /> },
  ];

  if (!isOpen) {
    return (
      <div
        onClick={onToggle}
        className="h-8 flex items-center gap-3 px-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--card))] transition-colors shrink-0"
      >
        <ChevronUp className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">System Console</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{entries.length} entries</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[200px] flex flex-col bg-[hsl(var(--background))] border-t border-[hsl(var(--border))] shrink-0 os-slide-up">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[hsl(var(--border))] shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={onToggle} className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors">
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Console Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 os-scrollbar">
        {entries
          .filter(e => {
            if (activeTab === 'activity') return true;
            if (activeTab === 'agents') return e.type === 'agent';
            if (activeTab === 'deploy') return e.type === 'deploy';
            if (activeTab === 'events') return e.type === 'info' || e.type === 'success';
            return true;
          })
          .map(entry => (
            <ConsoleRow key={entry.id} entry={entry} />
          ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MUA Globe (Top-Right Ambient)                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MUAGlobe({ state }: { state: 'sleep' | 'idle' | 'live' }) {
  const colors = {
    sleep: 'from-zinc-800 to-zinc-900 border-[hsl(var(--border))]',
    idle: 'from-red-900/30 to-zinc-900 border-red-500/15',
    live: 'from-red-800/40 to-zinc-900 border-red-500/30',
  };
  return (
    <div className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${colors[state]} border flex items-center justify-center`}>
      <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">M</span>
      {state === 'live' && (
        <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping" />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Page Component — Memelli Operator Studio                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function OperatorStudioPage() {
  const api = useApi();
  const claudeServerUrl = process.env.NEXT_PUBLIC_CLAUDE_SERVER_URL || '';

  // ── Session state ────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionTab[]>(() => [{
    id: uid('session'),
    title: 'Main Session',
    mode: 'plan' as ClaudeMode,
    messages: [
      {
        id: uid('msg'),
        role: 'system' as const,
        content: 'Memelli Operator Studio initialized. Claude is ready.',
        mode: 'plan' as ClaudeMode,
        timestamp: new Date(),
      },
    ],
    attachments: [],
    context: 'operator-studio',
    createdAt: new Date(),
    isStreaming: false,
  }]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // ── UI state ─────────────────────────────────────────────────────────────
  const [jessicaOpen, setJessicaOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [newWindowDropdown, setNewWindowDropdown] = useState(false);
  const [claudeGlobeState, setClaudeGlobeState] = useState<ClaudeGlobeState>('idle');
  const [muaState, setMuaState] = useState<'sleep' | 'idle' | 'live'>('idle');

  // ── Input state ──────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Session timer ────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages]);

  // ── Inject styles ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'operator-studio-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = STUDIO_STYLES;
    document.head.appendChild(el);
  }, []);

  // ── Image processing ────────────────────────────────────────────────────
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setImageError(null);
    for (const file of Array.from(files)) {
      const err = validateImage(file);
      if (err) { setImageError(err); continue; }
      try {
        const b64 = await toBase64(file);
        setPendingImages(prev => [...prev, b64]);
      } catch { setImageError('Failed to read image.'); }
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounterRef.current = 0;
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imgs: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) imgs.push(f);
      }
    }
    if (imgs.length > 0) { e.preventDefault(); processFiles(imgs); }
  }, [processFiles]);

  // ── Screenshot capture ──────────────────────────────────────────────────
  const [capturing, setCapturing] = useState(false);
  const captureScreenshot = useCallback(async () => {
    if (capturing || !navigator.mediaDevices?.getDisplayMedia) return;
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' } as MediaTrackConstraints });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise(r => requestAnimationFrame(r));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(video, 0, 0);
      stream.getTracks().forEach(t => t.stop());
      if (ctx) {
        const dataUrl = canvas.toDataURL('image/png');
        setPendingImages(prev => [...prev, dataUrl]);
        // Add to session attachments
        updateSession(activeSessionId, s => ({
          ...s,
          attachments: [...s.attachments, { id: uid('att'), name: `screenshot-${Date.now()}.png`, type: 'screenshot' as const, preview: dataUrl }],
        }));
      }
    } catch { /* User cancelled */ }
    finally { setCapturing(false); }
  }, [capturing, activeSessionId]);

  // ── Session management ──────────────────────────────────────────────────
  const updateSession = useCallback((id: string, updater: (s: SessionTab) => SessionTab) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const createSession = useCallback(() => {
    const id = uid('session');
    const newSession: SessionTab = {
      id,
      title: `Session ${sessions.length + 1}`,
      mode: 'plan',
      messages: [{
        id: uid('msg'),
        role: 'system',
        content: 'New session started.',
        mode: 'plan',
        timestamp: new Date(),
      }],
      attachments: [],
      context: 'operator-studio',
      createdAt: new Date(),
      isStreaming: false,
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(id);
    setInput('');
    setPendingImages([]);
  }, [sessions.length]);

  const closeSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) return prev; // Prevent closing last tab
      return next;
    });
    if (activeSessionId === id) {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === id);
        const nextId = prev[Math.max(0, idx - 1)]?.id || prev[0]?.id;
        if (nextId && nextId !== id) setActiveSessionId(nextId);
        return prev;
      });
    }
  }, [activeSessionId]);

  const setSessionMode = useCallback((mode: ClaudeMode) => {
    updateSession(activeSessionId, s => ({ ...s, mode }));
  }, [activeSessionId, updateSession]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    const imgs = pendingImages.length > 0 ? [...pendingImages] : undefined;
    if (!text && !imgs) return;
    if (activeSession.isStreaming) return;

    const currentMode = activeSession.mode;
    setInput('');
    setPendingImages([]);
    setImageError(null);

    // Add user message
    const userMsg: StudioMessage = {
      id: uid('msg'),
      role: 'user',
      content: text,
      mode: currentMode,
      timestamp: new Date(),
      images: imgs,
    };
    updateSession(activeSessionId, s => ({
      ...s,
      messages: [...s.messages, userMsg],
      isStreaming: true,
    }));

    setClaudeGlobeState('live');

    try {
      const res = await api.post<{ responseText: string; sessionId?: string }>('/api/ai/chat', {
        message: text,
        images: imgs,
        context: {
          terminal: 'operator-studio',
          mode: currentMode,
          sessionId: activeSessionId,
          module: 'operator-studio',
          environment: typeof window !== 'undefined'
            ? window.location.hostname === 'localhost' ? 'development' : 'production'
            : 'unknown',
        },
      });

      const reply = typeof res.data?.responseText === 'string' ? res.data.responseText : (res.error || 'No response received.');
      const claudeMsg: StudioMessage = {
        id: uid('msg'),
        role: 'claude',
        content: reply,
        mode: currentMode,
        timestamp: new Date(),
        codeBlocks: extractCodeBlocks(reply),
      };

      updateSession(activeSessionId, s => ({
        ...s,
        messages: [...s.messages, claudeMsg],
        isStreaming: false,
      }));
    } catch (err: any) {
      const errMsg: StudioMessage = {
        id: uid('msg'),
        role: 'system',
        content: `Error: ${err?.message || String(err)}`,
        mode: currentMode,
        timestamp: new Date(),
      };
      updateSession(activeSessionId, s => ({
        ...s,
        messages: [...s.messages, errMsg],
        isStreaming: false,
      }));
    }

    setClaudeGlobeState('idle');
  }, [input, pendingImages, activeSession, activeSessionId, api, updateSession]);

  // ── Copy handler ─────────────────────────────────────────────────────────
  const handleCopy = useCallback((msgId: string) => {
    const msg = activeSession.messages.find(m => m.id === msgId);
    if (!msg) return;
    navigator.clipboard.writeText(msg.content);
    updateSession(activeSessionId, s => ({
      ...s,
      messages: s.messages.map(m => m.id === msgId ? { ...m, copied: true } : m),
    }));
    setTimeout(() => {
      updateSession(activeSessionId, s => ({
        ...s,
        messages: s.messages.map(m => m.id === msgId ? { ...m, copied: false } : m),
      }));
    }, 2000);
  }, [activeSession.messages, activeSessionId, updateSession]);

  // ── Remove attachment ────────────────────────────────────────────────────
  const removeAttachment = useCallback((attId: string) => {
    updateSession(activeSessionId, s => ({
      ...s,
      attachments: s.attachments.filter(a => a.id !== attId),
    }));
  }, [activeSessionId, updateSession]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!newWindowDropdown) return;
    const handler = () => setNewWindowDropdown(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [newWindowDropdown]);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="fixed inset-0 flex flex-col bg-[hsl(var(--background))] overflow-hidden select-none">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[hsl(var(--background))] border-2 border-dashed border-blue-500/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8 text-blue-400" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Drop image into session</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Top Toolbar                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-[50] flex items-center gap-3 px-4 h-12 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shrink-0">
        {/* Title + Globe */}
        <div className="flex items-center gap-2.5">
          <ClaudeGlobe size={28} state={claudeGlobeState} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[hsl(var(--foreground))] tracking-wide">Memelli Operator Studio</span>
            <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Powered by Claude</span>
          </div>
        </div>

        <div className="w-px h-6 bg-[hsl(var(--muted))] mx-1" />

        {/* Mode Toggle */}
        <ModePill mode={activeSession.mode} onChange={setSessionMode} />

        <div className="w-px h-6 bg-[hsl(var(--muted))] mx-1" />

        {/* New Session */}
        <button
          onClick={createSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-medium hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <Plus className="h-3 w-3" />
          New Session
        </button>

        {/* New Window dropdown */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setNewWindowDropdown(!newWindowDropdown); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-medium hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Plus className="h-3 w-3" />
            New Window
            <ChevronDown className="h-3 w-3" />
          </button>
          {newWindowDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl py-1 z-50 os-fade-in">
              {[
                { label: 'Claude Terminal', icon: <Terminal className="h-3.5 w-3.5" />, color: 'text-blue-400' },
                { label: 'Melli Chat', icon: <Bot className="h-3.5 w-3.5" />, color: 'text-red-400' },
                { label: 'File Inspector', icon: <Eye className="h-3.5 w-3.5" />, color: 'text-[hsl(var(--muted-foreground))]' },
                { label: 'Agent Monitor', icon: <Users className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setNewWindowDropdown(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <span className={item.color}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* System Status */}
        <div className="flex items-center gap-2">
          <StatusBadge label="Claude" status="online" />
          <StatusBadge label="Melli" status="online" />
          <StatusBadge label="Railway" status="online" />
        </div>

        <div className="w-px h-6 bg-[hsl(var(--muted))] mx-1" />

        {/* Session Timer */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <Clock className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">{fmtDuration(elapsed)}</span>
        </div>

        {/* MUA Globe */}
        <MUAGlobe state={muaState} />

        {/* Context toggle */}
        <button
          onClick={() => setContextOpen(!contextOpen)}
          className={`p-1.5 rounded-lg transition-colors ${contextOpen ? 'bg-blue-500/10 text-blue-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]'}`}
          title="Toggle Context Panel"
        >
          <FolderTree className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Session Tabs                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-0.5 px-3 h-9 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shrink-0 overflow-x-auto">
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer text-xs font-medium transition-all group ${
              session.id === activeSessionId
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-t border-x border-[hsl(var(--border))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--card))]'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${
              session.mode === 'plan' ? 'bg-blue-500' : 'bg-red-500'
            } ${session.isStreaming ? 'animate-pulse' : ''}`} />
            <span className="truncate max-w-[120px]">{session.title}</span>
            {sessions.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
                className="p-0.5 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Main Content Area                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Context Sidebar */}
        {contextOpen && (
          <ContextSidebar
            isOpen={contextOpen}
            onToggle={() => setContextOpen(false)}
            attachments={activeSession.attachments}
            onRemoveAttachment={removeAttachment}
          />
        )}

        {/* Center — Chat Workspace */}
        <div
          className="flex-1 flex flex-col min-h-0 min-w-0"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Session Header */}
          <div className="flex items-center gap-2 px-5 py-2 border-b border-[hsl(var(--border))] shrink-0 bg-[hsl(var(--background))]">
            <ClaudeGlobe size={20} state={claudeGlobeState} />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{activeSession.title}</span>
            <div className={`w-1 h-1 rounded-full ${activeSession.mode === 'plan' ? 'bg-blue-500' : 'bg-red-500'}`} />
            <span className={`text-[10px] uppercase tracking-wider ${activeSession.mode === 'plan' ? 'text-blue-500/60' : 'text-red-500/60'}`}>
              {activeSession.mode} mode
            </span>
            {activeSession.attachments.length > 0 && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto">
                {activeSession.attachments.length} file{activeSession.attachments.length !== 1 ? 's' : ''} attached
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0 os-scrollbar">
            {activeSession.messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />
            ))}

            {/* Streaming indicator */}
            {activeSession.isStreaming && (
              <div className="flex items-start gap-1.5 os-fade-in">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeSession.mode === 'plan' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <span className={`text-[10px] ${activeSession.mode === 'plan' ? 'text-blue-400' : 'text-emerald-400'}`}>Claude</span>
                </div>
                <div className="flex items-center gap-1 ml-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted))] os-typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted))] os-typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted))] os-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image error */}
          {imageError && (
            <div className="mx-5 mb-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-400 shrink-0">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{imageError}</span>
              <button onClick={() => setImageError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}

          {/* Pending images */}
          {pendingImages.length > 0 && (
            <div className="px-5 py-2 border-t border-[hsl(var(--border))] flex flex-wrap gap-1.5 bg-[hsl(var(--card))] shrink-0">
              {pendingImages.map((img, i) => (
                <div key={i} className="relative group h-14 w-14 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="px-5 py-3 border-t border-[hsl(var(--border))] shrink-0 bg-[hsl(var(--background))]">
            <div className="flex items-end gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 focus-within:border-blue-500/20 transition-colors">
              {/* Toolbar */}
              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                {/* Image upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                  title="Attach image"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  onChange={e => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ''; }}
                  className="hidden"
                />

                {/* Screenshot */}
                <button
                  onClick={captureScreenshot}
                  disabled={capturing}
                  className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-40 transition-colors"
                  title="Capture screenshot"
                >
                  {capturing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>

                {/* Separator */}
                <div className="w-px h-4 bg-[hsl(var(--muted))] mx-0.5" />

                {/* Mode toggle (per-message) */}
                <ModePill mode={activeSession.mode} onChange={setSessionMode} size="small" />
              </div>

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onPaste={handlePaste}
                placeholder={activeSession.mode === 'plan' ? 'Describe what you want to plan...' : 'Describe what you want to build...'}
                disabled={activeSession.isStreaming}
                rows={1}
                className="flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none resize-none disabled:opacity-50"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />

              {/* Context indicator */}
              {(pendingImages.length > 0 || activeSession.attachments.length > 0) && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] shrink-0 mb-0.5">
                  <Paperclip className="h-2.5 w-2.5 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                    {pendingImages.length + activeSession.attachments.length}
                  </span>
                </div>
              )}

              {/* Send */}
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && pendingImages.length === 0) || activeSession.isStreaming}
                className={`p-2 rounded-lg text-[hsl(var(--foreground))] transition-all duration-200 shrink-0 ${
                  activeSession.mode === 'plan'
                    ? 'bg-blue-500 hover:bg-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.2)] disabled:shadow-none'
                    : 'bg-[#E11D2E] hover:bg-[#E11D2E]/80 shadow-[0_0_12px_rgba(225,29,46,0.2)] disabled:shadow-none'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {activeSession.isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Bottom hints */}
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Enter to send | Shift+Enter for new line | Drop or paste images
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Muses Intelligence Layer
              </span>
            </div>
          </div>
        </div>

        {/* Right — Melli Dock */}
        <JessicaDock isOpen={jessicaOpen} onToggle={() => setJessicaOpen(!jessicaOpen)} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Bottom Console                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <BottomConsole isOpen={consoleOpen} onToggle={() => setConsoleOpen(!consoleOpen)} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Left Context Sidebar Toggle (when closed)                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!contextOpen && (
        <button
          onClick={() => setContextOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[40] flex items-center px-1 py-3 rounded-r-lg bg-[hsl(var(--card))] border border-l-0 border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--card))] transition-all"
          title="Open Context Panel"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

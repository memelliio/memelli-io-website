'use client';

import { useState, useRef, useEffect, useCallback, memo, forwardRef, useImperativeHandle } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Send,
  Circle,
  ChevronRight,
  Clock,
  AlertTriangle,
  Bot,
  Activity,
  Image as ImageIcon,
  Paperclip,
  X,
  Loader2,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import ClaudeGlobe from '../claude-globe';
import type { ClaudeGlobeState } from '../claude-globe';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type MessageType = 'user' | 'claude' | 'system' | 'error' | 'agent-status' | 'terminal_output';

interface TerminalMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  copied?: boolean;
  images?: string[];  // base64 data URLs attached to this message
  source?: 'direct' | 'jessica'; // where the message originated
  stream?: 'stdout' | 'stderr'; // for terminal_output messages
}

interface CommandSuggestion {
  command: string;
  description: string;
}

type WsConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface ClaudeTerminalProps {
  /** Unique instance ID for session isolation */
  instanceId?: string;
  /** Called when Claude responds — lets parent (Melli) see responses */
  onResponse?: (content: string) => void;
  /** WebSocket URL for Claude Server (e.g. wss://claude-server.example.com) */
  wsUrl?: string;
}

/** Imperative handle for parent components to inject messages */
export interface ClaudeTerminalHandle {
  sendMessage: (text: string, images?: string[], source?: 'direct' | 'jessica') => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_COMMAND_HISTORY = 50;
const WS_HEARTBEAT_INTERVAL = 30_000;
const WS_MAX_RECONNECT_DELAY = 30_000;

const COMMAND_SHORTCUTS: CommandSuggestion[] = [
  { command: '/status', description: 'Show system status' },
  { command: '/agents', description: 'Show active agents' },
  { command: '/deploy', description: 'Trigger deployment' },
  { command: '/health', description: 'Run health check' },
  { command: '/pools', description: 'Show agent pool status' },
  { command: '/tasks', description: 'Show recent tasks' },
  { command: '/clear', description: 'Clear terminal' },
  { command: '/run', description: 'Execute shell command' },
  { command: '/git', description: 'Git operations' },
  { command: '/read', description: 'Read a file' },
  { command: '/edit', description: 'Edit a file' },
  { command: '/ls', description: 'List directory' },
  { command: '/build', description: 'Trigger build' },
];

function genId() {
  return `tmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTimestamp(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  WebSocket Command Parser                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function parseCommandToWsMessage(text: string): { type: string; payload: Record<string, any> } | null {
  const trimmed = text.trim();

  // /run <cmd>
  if (trimmed.startsWith('/run ')) {
    return { type: 'command', payload: { command: trimmed.slice(5).trim() } };
  }

  // /git <action> [args...]
  if (trimmed.startsWith('/git ')) {
    const parts = trimmed.slice(5).trim().split(/\s+/);
    const action = parts[0] || 'status';
    const args = parts.slice(1);

    if (action === 'commit' && args.length > 0) {
      return { type: 'git', payload: { action: 'commit', args: [args.join(' ')] } };
    }
    if (action === 'log') {
      return { type: 'git', payload: { action: 'log', args: [args[0] || '20'] } };
    }
    return { type: 'git', payload: { action, ...(args.length > 0 ? { args } : {}) } };
  }

  // /read <path>
  if (trimmed.startsWith('/read ')) {
    return { type: 'file_read', payload: { path: trimmed.slice(6).trim() } };
  }

  // /edit <path>
  if (trimmed.startsWith('/edit ')) {
    return { type: 'file_edit', payload: { path: trimmed.slice(6).trim(), old: '...', new: '...' } };
  }

  // /ls [path]
  if (trimmed === '/ls' || trimmed.startsWith('/ls ')) {
    const path = trimmed.slice(3).trim() || '.';
    return { type: 'command', payload: { command: `ls ${path}` } };
  }

  // /build
  if (trimmed === '/build' || trimmed.startsWith('/build ')) {
    return { type: 'command', payload: { command: trimmed.slice(1).trim() } };
  }

  // /deploy
  if (trimmed === '/deploy' || trimmed.startsWith('/deploy ')) {
    return { type: 'command', payload: { command: trimmed.slice(1).trim() } };
  }

  // Not a recognized WS command
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Image Helpers                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Use PNG, JPG, GIF, or WebP.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is 5MB.`;
  }
  return null;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Screenshot Capture                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function captureScreenshot(): Promise<string> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Screen capture not supported in this browser.');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'browser' } as MediaTrackConstraints,
  });

  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();

  // Wait a frame for the video to render
  await new Promise((r) => requestAnimationFrame(r));

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('Could not create canvas context.');
  }
  ctx.drawImage(video, 0, 0);

  // Stop all tracks immediately
  stream.getTracks().forEach((t) => t.stop());

  return canvas.toDataURL('image/png');
}

/** Screenshot preview card */
function ScreenshotPreview({
  src,
  onSend,
  onRetake,
  onDiscard,
}: {
  src: string;
  onSend: () => void;
  onRetake: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="mx-3 mb-2 rounded-lg bg-zinc-900/80 border border-emerald-500/20 p-3 shrink-0 animate-[ct-fade-in_0.2s_ease-out]">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400 font-mono">Screenshot captured</span>
      </div>
      <div className="relative rounded-lg overflow-hidden border border-white/[0.08] mb-2 max-h-40">
        <img src={src} alt="Screenshot" className="w-full h-full object-contain bg-zinc-950" />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSend}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
        >
          <Send className="h-3 w-3" />
          Attach
        </button>
        <button
          onClick={onRetake}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/30 text-zinc-400 text-xs font-medium hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Retake
        </button>
        <button
          onClick={onDiscard}
          className="ml-auto p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
          title="Discard screenshot"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Injected Styles                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TERMINAL_STYLES = `
@keyframes ct-dot-bounce{0%,80%,100%{opacity:0.2;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
@keyframes ct-fade-in{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
@keyframes ct-blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes ct-scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100dvh)}}
@keyframes ct-drag-pulse{0%,100%{border-color:rgba(225,29,46,0.3)}50%{border-color:rgba(225,29,46,0.7)}}
@keyframes ct-flash{0%{opacity:0.7}100%{opacity:0}}
`;

let stylesInjected = false;
function injectTerminalStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = TERMINAL_STYLES;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

/** Image thumbnail with optional remove button */
function ImageThumbnail({ src, onRemove, size = 'sm' }: { src: string; onRemove?: () => void; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20';
  return (
    <div className={`relative group ${dims} rounded-lg overflow-hidden border border-white/[0.08] bg-zinc-900 shrink-0`}>
      <img src={src} alt="Attached" className="h-full w-full object-cover" />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** Typing indicator */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <Bot className="h-3.5 w-3.5 text-emerald-400/60" />
      <span className="text-xs text-emerald-400/60 font-mono">Claude is thinking</span>
      <div className="flex gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-1 h-1 rounded-full bg-emerald-400"
            style={{ animation: `ct-dot-bounce 1.2s infinite ${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Command suggestion dropdown */
function CommandSuggestions({
  suggestions,
  onSelect,
  activeIndex,
}: {
  suggestions: CommandSuggestion[];
  onSelect: (cmd: string) => void;
  activeIndex: number;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-zinc-700/50 rounded-lg overflow-hidden shadow-xl z-10">
      {suggestions.map((s, i) => (
        <button
          key={s.command}
          onClick={() => onSelect(s.command)}
          className={`w-full flex items-center gap-3 px-4 py-2 text-left font-mono text-sm transition-colors ${
            i === activeIndex
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <ChevronRight className="h-3 w-3 shrink-0 text-emerald-500/50" />
          <span className="text-emerald-400">{s.command}</span>
          <span className="text-zinc-600 text-xs ml-auto">{s.description}</span>
        </button>
      ))}
    </div>
  );
}

/** Single terminal message */
const TerminalMessageItem = memo(function TerminalMessageItem({
  msg,
  onCopy,
}: {
  msg: TerminalMessage;
  onCopy: (id: string, content: string) => void;
}) {
  const typeStyles: Record<MessageType, string> = {
    user: 'text-zinc-100',
    claude: 'text-emerald-300/90',
    system: 'text-amber-400/80',
    error: 'text-red-400',
    'agent-status': 'text-cyan-400/80',
    'terminal_output': 'text-zinc-300',
  };

  const bgStyles: Record<MessageType, string> = {
    user: 'bg-zinc-800/40',
    claude: 'bg-zinc-900/60',
    system: 'bg-transparent',
    error: 'bg-red-950/20',
    'agent-status': 'bg-cyan-950/10',
    'terminal_output': 'bg-zinc-900/80',
  };

  const isUser = msg.type === 'user';
  const isClaude = msg.type === 'claude';
  const isSystem = msg.type === 'system';
  const isError = msg.type === 'error';
  const isAgent = msg.type === 'agent-status';
  const isTerminalOutput = msg.type === 'terminal_output';

  if (isSystem) {
    return (
      <div className="flex justify-center py-1.5 animate-[ct-fade-in_0.2s_ease-out]">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/10">
          <AlertTriangle className="h-3 w-3 text-amber-500/60" />
          <span className="font-mono text-[11px] text-amber-400/70">{msg.content}</span>
          <span className="font-mono text-[10px] text-zinc-600">{formatTimestamp(msg.timestamp)}</span>
        </div>
      </div>
    );
  }

  // Terminal output: full-width, monospace, no avatar
  if (isTerminalOutput) {
    const isStderr = msg.stream === 'stderr';
    return (
      <div className="animate-[ct-fade-in_0.15s_ease-out]">
        <div className={`rounded-lg px-4 py-2 ${bgStyles[msg.type]} border ${isStderr ? 'border-red-500/20' : 'border-zinc-800/40'}`}>
          <pre className={`font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words ${isStderr ? 'text-red-400' : 'text-zinc-300'}`}>
            {msg.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group animate-[ct-fade-in_0.25s_ease-out] ${
        isUser ? 'flex justify-end' : 'flex justify-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] rounded-lg px-4 py-2.5 ${bgStyles[msg.type]} ${
          isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
        } ${isError ? 'border border-red-500/20' : isAgent ? 'border border-cyan-500/10' : ''}`}
      >
        {/* Label */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            {isClaude && <Bot className="h-3 w-3 text-emerald-500/60" />}
            {isAgent && <Activity className="h-3 w-3 text-cyan-500/60" />}
            {isError && <AlertTriangle className="h-3 w-3 text-red-500/60" />}
            <span className={`font-mono text-[10px] uppercase tracking-wider ${
              isClaude ? 'text-emerald-500/50' :
              isAgent ? 'text-cyan-500/50' :
              'text-red-500/50'
            }`}>
              {isClaude ? 'Claude' : isAgent ? 'Agent' : 'Error'}
            </span>
          </div>
        )}

        {/* Source indicator for Melli-forwarded messages */}
        {isUser && msg.source === 'jessica' && (
          <div className="flex items-center gap-1 mb-1">
            <span className="font-mono text-[10px] text-[#E11D2E]/60 uppercase tracking-wider">via Melli</span>
          </div>
        )}

        {/* Inline image thumbnails */}
        {msg.images && msg.images.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {msg.images.map((img, i) => (
              <ImageThumbnail key={i} src={img} size="md" />
            ))}
          </div>
        )}

        {/* Content */}
        <div className={`font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words ${typeStyles[msg.type]}`}>
          {isUser && (
            <span className="text-emerald-500/40 mr-1.5 select-none">&gt;</span>
          )}
          {renderContent(msg.content)}
        </div>

        {/* Timestamp */}
        <div className={`mt-1 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-mono text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatTimestamp(msg.timestamp)}
          </span>
        </div>

        {/* Copy button on Claude messages */}
        {isClaude && (
          <button
            onClick={() => onCopy(msg.id, msg.content)}
            className="absolute top-2 right-2 p-1 rounded bg-zinc-800/80 border border-zinc-700/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700/80"
            title="Copy response"
          >
            {msg.copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

/** Basic markdown-ish rendering for terminal content */
function renderContent(content: string) {
  return content.split('\n').map((line, i, arr) => {
    if (line.startsWith('```')) {
      return <span key={i} className="text-zinc-500">{line}<br /></span>;
    }
    if (line.startsWith('### ')) {
      return <span key={i} className="text-emerald-300 font-bold text-sm">{line.slice(4)}<br /></span>;
    }
    if (line.startsWith('## ')) {
      return <span key={i} className="text-emerald-200 font-bold">{line.slice(3)}<br /></span>;
    }
    if (line.startsWith('# ')) {
      return <span key={i} className="text-emerald-100 font-bold text-base">{line.slice(2)}<br /></span>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <span key={i}>
          <span className="text-emerald-500/40 mr-1">{'\u2022'}</span>
          {renderInlineFormatting(line.slice(2))}
          <br />
        </span>
      );
    }
    return <span key={i}>{renderInlineFormatting(line)}{i < arr.length - 1 && <br />}</span>;
  });
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="font-bold text-white">{part.slice(2, -2)}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <span key={i} className="bg-zinc-800/80 px-1 py-0.5 rounded text-emerald-300 text-[12px]">{part.slice(1, -1)}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  WebSocket Hook                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function useWebSocket(
  wsUrl: string | undefined,
  onMessage: (data: any) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!wsUrl || !mountedRef.current) return;

    cleanup();

    // Get JWT token from localStorage
    let token = '';
    try {
      token = localStorage.getItem('memelli_token') || '';
    } catch {}

    if (!token) {
      setStatus('disconnected');
      return;
    }

    const url = `${wsUrl}/ws?token=${encodeURIComponent(token)}`;
    setStatus('reconnecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStatus('connected');
        reconnectAttemptRef.current = 0;

        // Start heartbeat
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS_HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return; // heartbeat response
          onMessageRef.current(data);
        } catch {
          // Non-JSON message, ignore
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }

        setStatus('reconnecting');
        // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 30s
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptRef.current),
          WS_MAX_RECONNECT_DELAY,
        );
        reconnectAttemptRef.current++;
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      };

      ws.onerror = () => {
        // onclose will fire after onerror, so reconnect is handled there
      };
    } catch {
      setStatus('disconnected');
    }
  }, [wsUrl, cleanup]);

  // Connect on mount / wsUrl change
  useEffect(() => {
    mountedRef.current = true;
    if (wsUrl) {
      connect();
    } else {
      setStatus('disconnected');
    }
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [wsUrl, connect, cleanup]);

  const send = useCallback((data: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return { status, send };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ClaudeTerminal = forwardRef<ClaudeTerminalHandle, ClaudeTerminalProps>(function ClaudeTerminal(
  { instanceId, onResponse, wsUrl: wsUrlProp },
  ref
) {
  const api = useApi();

  // Resolve WS URL: prop > env > empty (disabled)
  const wsUrl = wsUrlProp || (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_CLAUDE_SERVER_URL || '') : '') || undefined;

  // State
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // Image state
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Screenshot state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Command history state
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const savedInputRef = useRef('');

  // Streaming message ref — tracks the ID of the message currently being streamed
  const streamingMsgIdRef = useRef<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const sessionRef = useRef(
    instanceId || `ct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );

  // ── WebSocket ───────────────────────────────────────────────────────────
  const handleWsMessage = useCallback((data: any) => {
    const { type, payload } = data;

    switch (type) {
      case 'chat_stream': {
        // Streaming chunks — append to current streaming message
        const chunk = typeof payload === 'string' ? payload : payload?.chunk || payload?.content || '';
        if (!chunk) return;

        if (!streamingMsgIdRef.current) {
          // Start a new streaming message
          const id = genId();
          streamingMsgIdRef.current = id;
          setMessages((prev) => [
            ...prev,
            { id, type: 'claude', content: chunk, timestamp: new Date() },
          ]);
        } else {
          // Append to existing
          const sid = streamingMsgIdRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === sid ? { ...m, content: m.content + chunk } : m
            )
          );
        }
        setIsThinking(false);
        break;
      }

      case 'chat_response': {
        // Final complete response
        const content = typeof payload === 'string' ? payload : payload?.content || payload?.message || 'Done.';
        if (streamingMsgIdRef.current) {
          // Finalize the streaming message with the full content if provided
          const sid = streamingMsgIdRef.current;
          streamingMsgIdRef.current = null;
          // If the payload has full content, replace; otherwise keep what was streamed
          if (payload?.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === sid ? { ...m, content: payload.content } : m
              )
            );
          }
        } else {
          // No streaming was in progress, add the full message
          setMessages((prev) => [
            ...prev,
            { id: genId(), type: 'claude', content, timestamp: new Date() },
          ]);
        }
        setIsThinking(false);
        onResponse?.(content);
        break;
      }

      case 'output': {
        // Terminal/command output
        const text = typeof payload === 'string' ? payload : payload?.output || payload?.content || '';
        const stream = payload?.stream === 'stderr' ? 'stderr' as const : 'stdout' as const;
        if (text) {
          setMessages((prev) => [
            ...prev,
            { id: genId(), type: 'terminal_output', content: text, timestamp: new Date(), stream },
          ]);
        }
        break;
      }

      case 'result': {
        // Formatted result
        const text = typeof payload === 'string' ? payload : payload?.result || payload?.content || JSON.stringify(payload);
        setMessages((prev) => [
          ...prev,
          { id: genId(), type: 'claude', content: text, timestamp: new Date() },
        ]);
        setIsThinking(false);
        break;
      }

      case 'error': {
        const errText = typeof payload === 'string' ? payload : payload?.error || payload?.message || 'Unknown error';
        setMessages((prev) => [
          ...prev,
          { id: genId(), type: 'error', content: errText, timestamp: new Date() },
        ]);
        setIsThinking(false);
        streamingMsgIdRef.current = null;
        break;
      }

      default:
        // Unknown message type — show as system if it has content
        if (payload?.content || payload?.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: genId(),
              type: 'system',
              content: payload.content || payload.message,
              timestamp: new Date(),
            },
          ]);
        }
        break;
    }
  }, [onResponse]);

  const { status: wsStatus, send: wsSend } = useWebSocket(wsUrl, handleWsMessage);
  const isWsConnected = wsStatus === 'connected';

  useEffect(() => {
    injectTerminalStyles();
  }, []);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: genId(),
        type: 'system',
        content: `Claude Terminal initialized [session: ${sessionRef.current.slice(0, 12)}...] — Drop images or paste screenshots`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  }, []);

  // Filter command suggestions
  const filteredSuggestions = inputText.startsWith('/')
    ? COMMAND_SHORTCUTS.filter((s) =>
        s.command.startsWith(inputText.toLowerCase())
      )
    : [];

  useEffect(() => {
    setShowSuggestions(inputText.startsWith('/') && filteredSuggestions.length > 0);
    setSuggestionIndex(0);
  }, [inputText, filteredSuggestions.length]);

  // Copy handler
  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, copied: true } : m))
      );
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, copied: false } : m))
        );
      }, 2000);
    });
  }, []);

  // Handle local commands
  const handleLocalCommand = useCallback(
    (cmd: string): boolean => {
      const lower = cmd.trim().toLowerCase();
      if (lower === '/clear') {
        setMessages([
          {
            id: genId(),
            type: 'system',
            content: 'Terminal cleared',
            timestamp: new Date(),
          },
        ]);
        return true;
      }
      return false;
    },
    []
  );

  // ── Command history helpers ──────────────────────────────────────────────
  const pushToHistory = useCallback((text: string) => {
    if (!text.trim()) return;
    setCommandHistory((prev) => {
      const filtered = prev.filter((h) => h !== text);
      const next = [text, ...filtered];
      return next.slice(0, MAX_COMMAND_HISTORY);
    });
    setHistoryIndex(-1);
  }, []);

  // ── Image processing ─────────────────────────────────────────────────────
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setImageError(null);
    const fileArr = Array.from(files);
    for (const file of fileArr) {
      const error = validateImageFile(file);
      if (error) {
        setImageError(error);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        setPendingImages((prev) => [...prev, base64]);
      } catch {
        setImageError('Failed to read image file.');
      }
    }
  }, []);

  // ── Drag & Drop handlers ─────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // ── Paste handler (Ctrl+V / Cmd+V with image) ───────────────────────────
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    },
    [processFiles]
  );

  // ── File picker handler ──────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Screenshot capture ──────────────────────────────────────────────────
  const handleScreenshot = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setImageError(null);
    try {
      const dataUrl = await captureScreenshot();
      // Camera flash effect
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      setScreenshotPreview(dataUrl);
    } catch (err: any) {
      // User cancelled the picker — not an error
      if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
        setImageError(err?.message || 'Screenshot capture failed.');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const handleScreenshotAttach = useCallback(() => {
    if (screenshotPreview) {
      setPendingImages((prev) => [...prev, screenshotPreview]);
      setScreenshotPreview(null);
    }
  }, [screenshotPreview]);

  const handleScreenshotRetake = useCallback(() => {
    setScreenshotPreview(null);
    // Small delay so the preview closes before the capture dialog opens
    setTimeout(() => handleScreenshot(), 150);
  }, [handleScreenshot]);

  const handleScreenshotDiscard = useCallback(() => {
    setScreenshotPreview(null);
  }, []);

  // ── Keyboard shortcut: Ctrl/Cmd+Shift+S for screenshot ──────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleScreenshot();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleScreenshot]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, images?: string[], source: 'direct' | 'jessica' = 'direct') => {
      const trimmed = text.trim();
      const imgs = images && images.length > 0 ? images : pendingImages.length > 0 ? [...pendingImages] : undefined;
      if (!trimmed && !imgs) return;
      if (isThinking) return;

      // Push to command history
      if (trimmed) pushToHistory(trimmed);

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          type: 'user',
          content: trimmed,
          timestamp: new Date(),
          images: imgs,
          source,
        },
      ]);
      setInputText('');
      setPendingImages([]);
      setImageError(null);
      setShowSuggestions(false);
      setAutoScroll(true);

      // Handle local commands
      if (trimmed && handleLocalCommand(trimmed)) return;

      // ── Try WebSocket first ─────────────────────────────────────────────
      if (isWsConnected) {
        setIsThinking(true);
        streamingMsgIdRef.current = null;

        // Check if it's a slash command that maps to a WS message
        if (trimmed.startsWith('/')) {
          const wsMsg = parseCommandToWsMessage(trimmed);
          if (wsMsg) {
            // Show command echo for terminal-style commands
            setMessages((prev) => [
              ...prev,
              { id: genId(), type: 'terminal_output', content: `$ ${trimmed.slice(1)}`, timestamp: new Date(), stream: 'stdout' },
            ]);
            wsSend(wsMsg);
            return;
          }
        }

        // Regular chat message via WS
        const sent = wsSend({ type: 'chat', payload: { message: trimmed, images: imgs } });
        if (sent) return;
        // If send failed, fall through to HTTP
        setIsThinking(false);
      }

      // ── Fallback to HTTP POST ───────────────────────────────────────────
      setIsThinking(true);

      try {
        const res = await api.post<{
          responseText: string;
          sessionId?: string;
          actions?: any[];
        }>('/api/ai/chat', {
          ...(sessionId ? { sessionId } : {}),
          message: trimmed,
          images: imgs,
          context: {
            terminal: 'claude-terminal',
            mode: 'owner-direct',
            source,
            screenshot: imgs && imgs.length > 0 ? 'true' : undefined,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
            environment:
              typeof window !== 'undefined'
                ? window.location.hostname === 'localhost'
                  ? 'development'
                  : 'production'
                : 'unknown',
          },
        });

        setIsThinking(false);

        if (res.error || !res.data) {
          const errorMsg =
            (res.errorData as any)?.responseText || res.error || 'Unknown error';
          setMessages((prev) => [
            ...prev,
            {
              id: genId(),
              type: 'error',
              content: `Error: ${errorMsg}`,
              timestamp: new Date(),
            },
          ]);
          setIsConnected(false);
          setTimeout(() => setIsConnected(true), 5000);
          return;
        }

        const { responseText, sessionId: newSid, actions } = res.data;
        if (newSid) setSessionId(newSid);

        const safeReply =
          typeof responseText === 'string'
            ? responseText
            : responseText != null
            ? JSON.stringify(responseText)
            : 'Done.';

        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            type: 'claude',
            content: safeReply,
            timestamp: new Date(),
          },
        ]);

        // Notify parent (Melli) of the response
        onResponse?.(safeReply);

        // Show agent actions as status updates
        if (actions?.length) {
          for (const action of actions) {
            setMessages((prev) => [
              ...prev,
              {
                id: genId(),
                type: 'agent-status',
                content: `[${action.type}] ${action.label} -- ${action.status}${action.result ? ` (${typeof action.result === 'string' ? action.result.slice(0, 80) : 'done'})` : ''}`,
                timestamp: new Date(),
              },
            ]);
          }
        }

        setIsConnected(true);
      } catch (err: any) {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            type: 'error',
            content: `Connection error: ${err?.message || String(err)}`,
            timestamp: new Date(),
          },
        ]);
        setIsConnected(false);
        setTimeout(() => setIsConnected(true), 5000);
      }
    },
    [api, sessionId, isThinking, handleLocalCommand, pendingImages, onResponse, isWsConnected, wsSend, pushToHistory]
  );

  // ── Expose imperative handle to parent ───────────────────────────────────
  useImperativeHandle(ref, () => ({
    sendMessage,
  }), [sendMessage]);

  // Input handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSuggestions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSuggestionIndex((i) =>
            i < filteredSuggestions.length - 1 ? i + 1 : 0
          );
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSuggestionIndex((i) =>
            i > 0 ? i - 1 : filteredSuggestions.length - 1
          );
          return;
        }
        if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          const selected = filteredSuggestions[suggestionIndex];
          if (selected) {
            if (e.key === 'Tab') {
              setInputText(selected.command + ' ');
            } else {
              sendMessage(selected.command);
            }
          }
          return;
        }
        if (e.key === 'Escape') {
          setShowSuggestions(false);
          return;
        }
      }

      // Command history: Up/Down arrow keys
      if (e.key === 'ArrowUp' && !showSuggestions) {
        e.preventDefault();
        if (commandHistory.length === 0) return;
        if (historyIndex === -1) {
          savedInputRef.current = inputText;
        }
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIdx);
        setInputText(commandHistory[nextIdx]);
        return;
      }

      if (e.key === 'ArrowDown' && !showSuggestions) {
        e.preventDefault();
        if (historyIndex <= 0) {
          setHistoryIndex(-1);
          setInputText(savedInputRef.current);
          return;
        }
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputText(commandHistory[nextIdx]);
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputText);
      }
    },
    [showSuggestions, filteredSuggestions, suggestionIndex, inputText, sendMessage, commandHistory, historyIndex]
  );

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Globe state derivation ──────────────────────────────────────────
  const globeState: ClaudeGlobeState = isThinking
    ? 'live'
    : isFocused
    ? 'idle'
    : 'sleep';

  // ── Connection status for display ──────────────────────────────────
  // If WS URL is set, use WS status. Otherwise use HTTP connected status.
  const displayConnectionStatus: WsConnectionStatus = wsUrl
    ? wsStatus
    : isConnected ? 'connected' : 'disconnected';

  const connectionStatusColor = {
    connected: 'text-emerald-400 fill-emerald-400',
    reconnecting: 'text-amber-400 fill-amber-400',
    disconnected: 'text-red-400 fill-red-400',
  }[displayConnectionStatus];

  const connectionStatusLabel = {
    connected: 'Connected',
    reconnecting: 'Reconnecting',
    disconnected: 'Disconnected',
  }[displayConnectionStatus];

  return (
    <div
      className="flex flex-col h-full max-h-[100dvh] md:max-h-full bg-zinc-950 overflow-hidden font-mono relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        // Only blur if focus left the entire terminal container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
    >
      {/* ── Drag overlay ──────────────────────────────────────────────── */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm"
          style={{ animation: 'ct-drag-pulse 1.5s ease-in-out infinite', border: '2px dashed rgba(225,29,46,0.5)', borderRadius: '12px' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-[#E11D2E]/10 border border-[#E11D2E]/30">
              <ImageIcon className="h-8 w-8 text-[#E11D2E]" />
            </div>
            <p className="text-sm font-medium text-zinc-300 font-sans">Drop image here</p>
            <p className="text-xs text-zinc-500 font-sans">PNG, JPG, GIF, WebP up to 5MB</p>
          </div>
        </div>
      )}

      {/* ── Screenshot flash ────────────────────────────────────────── */}
      {showFlash && (
        <div
          className="absolute inset-0 z-50 bg-white pointer-events-none"
          style={{ animation: 'ct-flash 0.3s ease-out forwards' }}
        />
      )}

      {/* ── Scanline effect ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.02]">
        <div
          className="h-px w-full bg-emerald-400"
          style={{ animation: 'ct-scanline 8s linear infinite' }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <ClaudeGlobe size={32} state={globeState} />
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold text-zinc-200 tracking-wide">
            Claude Terminal
          </span>

          {/* Mode badge */}
          {wsUrl ? (
            <span
              className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                isWsConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}
              title={
                isWsConnected
                  ? 'Full CLI mode — WebSocket connected to Claude Server. Shell commands, git, file operations available.'
                  : 'Chat mode — WebSocket disconnected. Messages sent via HTTP API. Reconnecting...'
              }
            >
              {isWsConnected ? 'FULL' : 'CHAT'}
            </span>
          ) : (
            <span
              className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20"
              title="Chat mode — No WebSocket URL configured. Messages sent via HTTP API."
            >
              CHAT
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Screenshot button */}
          <button
            onClick={handleScreenshot}
            disabled={isCapturing}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/40 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 disabled:opacity-40 transition-all"
            title="Capture screenshot (Cmd+Shift+S)"
          >
            {isCapturing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">Screenshot</span>
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800/40">
            <Circle
              className={`h-2 w-2 ${connectionStatusColor}`}
            />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {connectionStatusLabel}
            </span>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800/30">
            <span className="text-[10px] text-zinc-600">
              {sessionRef.current.slice(0, 12)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        onPaste={handlePaste}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 scroll-smooth pb-4 md:pb-4"
      >
        {messages.map((msg) => (
          <TerminalMessageItem key={msg.id} msg={msg} onCopy={handleCopy} />
        ))}

        {isThinking && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Resume auto-scroll ──────────────────────────────────────── */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-20 right-4 z-20 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700/50 text-[11px] text-zinc-400 font-mono hover:bg-zinc-700 transition-colors shadow-lg"
        >
          Scroll to bottom
        </button>
      )}

      {/* ── Image error ──────────────────────────────────────────────── */}
      {imageError && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400 font-sans shrink-0">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>{imageError}</span>
          <button onClick={() => setImageError(null)} className="ml-auto">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── Screenshot preview ──────────────────────────────────────── */}
      {screenshotPreview && (
        <ScreenshotPreview
          src={screenshotPreview}
          onSend={handleScreenshotAttach}
          onRetake={handleScreenshotRetake}
          onDiscard={handleScreenshotDiscard}
        />
      )}

      {/* ── Pending images preview ───────────────────────────────────── */}
      {pendingImages.length > 0 && (
        <div className="px-3 py-2 border-t border-zinc-800/60 flex flex-wrap gap-2 bg-zinc-900/40 shrink-0">
          {pendingImages.map((img, i) => (
            <ImageThumbnail key={i} src={img} onRemove={() => removePendingImage(i)} />
          ))}
          <div className="flex items-center text-[10px] text-zinc-500 font-sans ml-1">
            {pendingImages.length} image{pendingImages.length > 1 ? 's' : ''} ready
          </div>
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div className="relative px-3 py-3 bg-zinc-950 border-t border-zinc-800/60 shrink-0 sticky bottom-0 z-30 md:static">
        {showSuggestions && (
          <CommandSuggestions
            suggestions={filteredSuggestions}
            onSelect={(cmd) => sendMessage(cmd)}
            activeIndex={suggestionIndex}
          />
        )}

        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors shrink-0"
            title="Attach image (PNG, JPG, GIF, WebP)"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Prompt character */}
          <span className="text-emerald-500 text-sm pb-2 select-none font-bold">
            {isWsConnected ? '$' : '>'}
          </span>

          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setHistoryIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isWsConnected
                ? 'Type a message, / for commands, or run shell commands...'
                : 'Type a message, / for commands, or drop images...'
            }
            disabled={isThinking}
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-600 outline-none resize-none font-mono leading-relaxed max-h-32 scrollbar-none disabled:opacity-50"
            style={{
              height: 'auto',
              minHeight: '24px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />

          <button
            onClick={() => sendMessage(inputText)}
            disabled={(!inputText.trim() && pendingImages.length === 0) || isThinking}
            className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isThinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Hint */}
        <div className="flex items-center justify-between mt-1.5 px-4">
          <span className="text-[10px] text-zinc-700">
            Enter to send / Shift+Enter for newline / Type / for commands{isWsConnected ? ' / Up/Down for history' : ''}
          </span>
          <span className="text-[10px] text-zinc-700">
            {pendingImages.length > 0
              ? `${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''} attached`
              : typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')
              ? '\u2318\u21E7S screenshot / Drop or paste images'
              : 'Ctrl+Shift+S screenshot / Drop or paste images'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default memo(ClaudeTerminal);

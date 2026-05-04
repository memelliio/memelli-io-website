'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Terminal,
  MessageCircle,
  Plus,
  LayoutGrid,
  Layers,
  Minus,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Bot,
  Cpu,
  Send,
  Image as ImageIcon,
  Paperclip,
  Loader2,
  AlertTriangle,
  Camera,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ClaudeTerminal } from '@/components/claude-terminal';
import type { ClaudeTerminalHandle } from '@/components/claude-terminal';
import { useApi } from '@/hooks/useApi';
import ClaudeGlobe from '@/components/claude-globe';
import type { ClaudeGlobeState } from '@/components/claude-globe';
import ClaudeWakeWord from '@/components/claude-wake-word';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface WindowState {
  id: string;
  type: 'claude' | 'jessica';
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

type RoutingMode = 'jessica' | 'claude';

interface JessicaMessage {
  id: string;
  role: 'user' | 'jessica' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
  routedTo?: 'claude';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function genMsgId() {
  return `jm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `Unsupported: ${file.type}`;
  if (file.size > MAX_FILE_SIZE) return `Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 5MB)`;
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
/*  DraggableWindow                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function DraggableWindow({
  win,
  onMove,
  onResize,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  children,
}: {
  win: WindowState;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const isClaude = win.type === 'claude';

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return; // No drag on mobile
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      onFocus(win.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        const newX = Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.origX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + dy));
        onMove(win.id, newX, newY);
      };
      const onMouseUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [win.id, win.x, win.y, onMove, onFocus, isMobile]
  );

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return; // No resize on mobile
      e.preventDefault();
      e.stopPropagation();
      onFocus(win.id);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: win.w,
        origH: win.h,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dw = ev.clientX - resizeRef.current.startX;
        const dh = ev.clientY - resizeRef.current.startY;
        const newW = Math.max(360, resizeRef.current.origW + dw);
        const newH = Math.max(300, resizeRef.current.origH + dh);
        onResize(win.id, newW, newH);
      };
      const onMouseUp = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [win.id, win.w, win.h, onResize, onFocus, isMobile]
  );

  if (win.minimized) return null;

  // Mobile: full-screen sheet, no positioning
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 flex flex-col bg-[hsl(var(--background))] overflow-hidden"
        style={{ zIndex: win.zIndex }}
      >
        {/* Title Bar */}
        <div
          className={`flex items-center gap-2 px-3 py-2 select-none shrink-0 ${
            isClaude
              ? 'bg-[hsl(var(--card))] border-b border-emerald-500/10'
              : 'bg-[hsl(var(--card))] border-b border-[#E11D2E]/10'
          }`}
        >
          {isClaude ? (
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Bot className="h-3.5 w-3.5 text-[#E11D2E]" />
          )}
          <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
            {win.title}
          </span>

          <button
            onClick={() => onClose(win.id)}
            className="p-1.5 rounded hover:bg-red-500/20 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content — full remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    );
  }

  // Desktop: floating draggable window
  const style: React.CSSProperties = win.maximized
    ? { left: 0, top: 48, width: '100vw', height: 'calc(100dvh - 48px)', zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex };

  return (
    <div
      className="fixed flex flex-col overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] transition-shadow hover:shadow-[0_24px_70px_-12px_rgba(0,0,0,0.9)]"
      style={style}
      onMouseDown={() => onFocus(win.id)}
    >
      {/* Title Bar */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none shrink-0 ${
          isClaude
            ? 'bg-[hsl(var(--card))] border-b border-emerald-500/10'
            : 'bg-[hsl(var(--card))] border-b border-[#E11D2E]/10'
        }`}
        onMouseDown={onDragStart}
      >
        <GripHorizontal className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
        {isClaude ? (
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-[#E11D2E]" />
        )}
        <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
          {win.title}
        </span>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onMinimize(win.id)}
            className="p-1 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMaximize(win.id)}
            className="p-1 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {win.maximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={() => onClose(win.id)}
            className="p-1 rounded hover:bg-red-500/20 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      {/* Resize Handle */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
          onMouseDown={onResizeStart}
        >
          <svg
            className="absolute bottom-0.5 right-0.5 text-[hsl(var(--muted-foreground))]"
            width="10"
            height="10"
            viewBox="0 0 10 10"
          >
            <path d="M9 1L1 9" stroke="currentColor" strokeWidth="1" />
            <path d="M9 5L5 9" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Melli Chat with Routing + Image Support                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function JessicaChatInner({
  claudeRef,
}: {
  claudeRef: React.RefObject<ClaudeTerminalHandle | null>;
}) {
  const api = useApi();
  const [messages, setMessages] = useState<JessicaMessage[]>([
    {
      id: 'jessica-welcome',
      role: 'system',
      content: 'Melli online. Default: routes to Claude. Toggle to talk directly.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [routingMode, setRoutingMode] = useState<RoutingMode>('claude');

  // Image state
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // ── Image processing ─────────────────────────────────────────────────────
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setImageError(null);
    for (const file of Array.from(files)) {
      const err = validateImageFile(file);
      if (err) { setImageError(err); continue; }
      try {
        const b64 = await fileToBase64(file);
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const imgs = pendingImages.length > 0 ? [...pendingImages] : undefined;
      if (!trimmed && !imgs) return;
      if (thinking) return;

      setInput('');
      setPendingImages([]);
      setImageError(null);

      if (routingMode === 'claude') {
        // ── Route to Claude terminal ──────────────────────────────────
        const userMsg: JessicaMessage = {
          id: genMsgId(),
          role: 'user',
          content: trimmed,
          images: imgs,
          timestamp: new Date(),
          routedTo: 'claude',
        };
        setMessages(prev => [...prev, userMsg]);

        const routeMsg: JessicaMessage = {
          id: genMsgId(),
          role: 'jessica',
          content: 'Sending to Claude...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, routeMsg]);

        // Forward to Claude terminal via imperative handle
        claudeRef.current?.sendMessage(trimmed, imgs, 'jessica');
      } else {
        // ── Talk to Melli directly ────────────────────────────────────
        const userMsg: JessicaMessage = {
          id: genMsgId(),
          role: 'user',
          content: trimmed,
          images: imgs,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setThinking(true);

        try {
          const res = await api.post<{ responseText: string; sessionId?: string }>(
            '/api/ai/chat',
            {
              ...(sessionId ? { sessionId } : {}),
              message: trimmed,
              images: imgs,
              context: {
                terminal: 'jessica-workspace',
                mode: 'jessica',
                environment:
                  typeof window !== 'undefined'
                    ? window.location.hostname === 'localhost'
                      ? 'development'
                      : 'production'
                    : 'unknown',
              },
            }
          );

          setThinking(false);

          if (res.error || !res.data) {
            setMessages(prev => [
              ...prev,
              {
                id: genMsgId(),
                role: 'jessica',
                content: res.error || 'Something went wrong.',
                timestamp: new Date(),
              },
            ]);
            return;
          }

          if (res.data.sessionId) setSessionId(res.data.sessionId);

          const reply =
            typeof res.data.responseText === 'string'
              ? res.data.responseText
              : 'Done.';

          setMessages(prev => [
            ...prev,
            { id: genMsgId(), role: 'jessica', content: reply, timestamp: new Date() },
          ]);
        } catch (err: any) {
          setThinking(false);
          setMessages(prev => [
            ...prev,
            {
              id: genMsgId(),
              role: 'jessica',
              content: `Error: ${err?.message || String(err)}`,
              timestamp: new Date(),
            },
          ]);
        }
      }
    },
    [api, sessionId, thinking, routingMode, claudeRef, pendingImages]
  );

  // ── Handle Claude response callback (summarize back to Melli) ────────────
  const handleClaudeResponse = useCallback((content: string) => {
    const summary = content.length > 300
      ? content.slice(0, 300) + '...'
      : content;
    setMessages(prev => [
      ...prev,
      {
        id: genMsgId(),
        role: 'jessica',
        content: `Claude says: ${summary}`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Store for parent access
  const claudeResponseHandlerRef = useRef(handleClaudeResponse);
  claudeResponseHandlerRef.current = handleClaudeResponse;

  // Expose via a stable function
  (JessicaChatInner as any).__lastResponseHandler = handleClaudeResponse;

  return (
    <div
      className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[hsl(var(--background))] border-2 border-dashed border-[#E11D2E]/50 rounded-xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[#E11D2E]" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Drop image here</p>
          </div>
        </div>
      )}

      {/* Header with routing toggle */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--background))] border-b border-[#E11D2E]/10 shrink-0">
        <Bot className="h-4 w-4 text-[#E11D2E]" />
        <span className="text-sm font-bold text-[hsl(var(--foreground))]">Melli</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Routing mode toggle */}
          <button
            onClick={() => setRoutingMode(prev => prev === 'claude' ? 'jessica' : 'claude')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium"
            style={{
              borderColor: routingMode === 'claude' ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,46,0.3)',
              backgroundColor: routingMode === 'claude' ? 'rgba(16,185,129,0.08)' : 'rgba(225,29,46,0.08)',
              color: routingMode === 'claude' ? 'rgb(110,231,183)' : 'rgb(252,165,165)',
            }}
          >
            {routingMode === 'claude' ? (
              <>
                <ArrowRight className="h-3 w-3" />
                <Cpu className="h-3 w-3" />
                <span>To Claude</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-3 w-3" />
                <span>To Melli</span>
              </>
            )}
          </button>

          <button
            onClick={() => setRoutingMode(prev => prev === 'claude' ? 'jessica' : 'claude')}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title={`Switch to ${routingMode === 'claude' ? 'Melli' : 'Claude'} mode`}
          >
            {routingMode === 'claude' ? (
              <ToggleRight className="h-5 w-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-[#E11D2E]" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        onPaste={handlePaste}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'system' ? (
              <div className="text-center py-1">
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] italic">{msg.content}</span>
              </div>
            ) : msg.role === 'user' ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                  {msg.routedTo === 'claude' && (
                    <span className="flex items-center gap-1 text-emerald-500/70">
                      <ArrowRight className="h-2.5 w-2.5" /> Claude
                    </span>
                  )}
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div className="max-w-[85%] rounded-xl rounded-br-sm bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2">
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.images.map((img, i) => (
                        <div key={i} className="h-14 w-14 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-[#E11D2E]">Melli</span>
                  <span className="text-[hsl(var(--muted-foreground))]">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#E11D2E]/5 border border-[#E11D2E]/10 px-3 py-2">
                  <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2 text-xs text-[#E11D2E]/60 px-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Melli is thinking...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Image error */}
      {imageError && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-400 shrink-0">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>{imageError}</span>
          <button onClick={() => setImageError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Pending images */}
      {pendingImages.length > 0 && (
        <div className="px-3 py-2 border-t border-[hsl(var(--border))] flex flex-wrap gap-1.5 bg-[hsl(var(--card))] shrink-0">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative group h-12 w-12 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
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

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-[hsl(var(--border))] shrink-0 sticky bottom-0 z-30 bg-[hsl(var(--background))] md:static">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shrink-0"
            title="Attach image"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            onPaste={handlePaste}
            placeholder={routingMode === 'claude' ? 'Message (routes to Claude)...' : 'Talk to Melli...'}
            disabled={thinking}
            rows={1}
            className="flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-[#E11D2E]/30 disabled:opacity-50 resize-none"
            style={{ minHeight: '36px', maxHeight: '80px' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 80) + 'px';
            }}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && pendingImages.length === 0) || thinking}
            className="p-1.5 rounded-lg bg-[#E11D2E] text-[hsl(var(--foreground))] hover:bg-[#E11D2E]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {thinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-[hsl(var(--muted-foreground))]">
          <span>Enter to send</span>
          <span>
            {pendingImages.length > 0
              ? `${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''}`
              : 'Drop or paste images'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile Terminal — simple full-screen Claude chat                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MobileTerminalChat() {
  const claudeRef = useRef<ClaudeTerminalHandle | null>(null);
  const claudeServerUrl = process.env.NEXT_PUBLIC_CLAUDE_SERVER_URL || '';
  const [activeTab, setActiveTab] = useState<'claude' | 'jessica'>('claude');

  return (
    <div className="fixed inset-0 flex flex-col bg-[hsl(var(--background))]">
      {/* Mobile tab bar */}
      <div className="flex items-center shrink-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
        <button
          onClick={() => setActiveTab('claude')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'claude'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
              : 'text-[hsl(var(--muted-foreground))]'
          }`}
        >
          <Terminal className="h-4 w-4" />
          Claude
        </button>
        <button
          onClick={() => setActiveTab('jessica')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'jessica'
              ? 'text-red-400 border-b-2 border-red-400 bg-red-500/5'
              : 'text-[hsl(var(--muted-foreground))]'
          }`}
        >
          <Bot className="h-4 w-4" />
          Melli
        </button>
      </div>

      {/* Chat area — full remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'claude' ? (
          <ClaudeTerminal
            ref={claudeRef}
            instanceId="mobile-claude"
            wsUrl={claudeServerUrl || undefined}
          />
        ) : (
          <JessicaChatInner claudeRef={claudeRef} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Page Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

let nextZIndex = 10;
function getNextZ() {
  return ++nextZIndex;
}

function genWinId() {
  return `win_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function TerminalWorkspacePage() {
  const isMobile = useIsMobile();

  // Not yet mounted — show minimal loading to avoid desktop flash on mobile
  if (isMobile === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-3">
          <Terminal className="h-8 w-8 text-emerald-400/40 animate-pulse" />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Loading terminal...</span>
        </div>
      </div>
    );
  }

  // On mobile, render the simple chat immediately
  if (isMobile) {
    return <MobileTerminalChat />;
  }

  return <DesktopTerminalWorkspace />;
}

function DesktopTerminalWorkspace() {
  // Shared Claude terminal ref for Melli routing
  const claudeRef = useRef<ClaudeTerminalHandle | null>(null);
  const jessicaResponseHandlerRef = useRef<((content: string) => void) | null>(null);

  // WebSocket URL for Claude Server
  const claudeServerUrl = process.env.NEXT_PUBLIC_CLAUDE_SERVER_URL || '';

  // ── Claude globe + wake word state ──────────────────────────────────
  const [claudeGlobeState, setClaudeGlobeState] = useState<ClaudeGlobeState>('sleep');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [workspaceCapturing, setWorkspaceCapturing] = useState(false);
  const [workspaceFlash, setWorkspaceFlash] = useState(false);

  // ── Workspace screenshot capture ──────────────────────────────────
  const handleWorkspaceScreenshot = useCallback(async () => {
    if (workspaceCapturing) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      return;
    }
    setWorkspaceCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as MediaTrackConstraints,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => requestAnimationFrame(r));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      ctx.drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      const dataUrl = canvas.toDataURL('image/png');

      // Flash effect
      setWorkspaceFlash(true);
      setTimeout(() => setWorkspaceFlash(false), 300);

      // Send to the active Claude terminal with auto-context
      claudeRef.current?.sendMessage(
        `[Screenshot of workspace at ${window.location.pathname}]`,
        [dataUrl],
        'direct'
      );
    } catch {
      // User cancelled — ignore
    } finally {
      setWorkspaceCapturing(false);
    }
  }, [workspaceCapturing]);

  const [windows, setWindows] = useState<WindowState[]>(() => [
    {
      id: genWinId(),
      type: 'jessica',
      title: 'Melli / MUA',
      x: 40,
      y: 80,
      w: 440,
      h: 620,
      zIndex: 10,
      minimized: false,
      maximized: false,
    },
    {
      id: genWinId(),
      type: 'claude',
      title: 'Claude Terminal',
      x: 500,
      y: 80,
      w: 600,
      h: 620,
      zIndex: 11,
      minimized: false,
      maximized: false,
    },
  ]);

  // ── Wake word handlers (after setWindows is available) ────────────
  const handleWakeWord = useCallback(() => {
    setClaudeGlobeState('live');
    // Focus the first Claude window
    setWindows(prev => {
      const claudeWin = prev.find(w => w.type === 'claude' && !w.minimized);
      if (claudeWin) {
        return prev.map(w =>
          w.id === claudeWin.id
            ? { ...w, zIndex: getNextZ(), minimized: false }
            : w
        );
      }
      return prev;
    });
    // Reset globe after 3 seconds if no further interaction
    setTimeout(() => setClaudeGlobeState('idle'), 3000);
  }, []);

  const handleWakeWordCommand = useCallback((text: string) => {
    setClaudeGlobeState('live');
    // Send the voice command to Claude terminal
    claudeRef.current?.sendMessage(text);
    // Globe goes back to idle after sending
    setTimeout(() => setClaudeGlobeState('idle'), 2000);
  }, []);

  // When Claude responds, forward to Melli for summary
  const handleClaudeResponse = useCallback((content: string) => {
    jessicaResponseHandlerRef.current?.(content);
  }, []);

  // Window operations
  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const resizeWindow = useCallback((id: string, w: number, h: number) => {
    setWindows(prev => prev.map(win => win.id === id ? { ...win, w, h } : win));
  }, []);

  const focusWindow = useCallback((id: string) => {
    const z = getNextZ();
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: z } : w));
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  }, []);

  const addWindow = useCallback((type: 'claude' | 'jessica') => {
    setWindows(prev => {
      const count = prev.filter(w => w.type === type).length;
      const offset = count * 30;
      return [
        ...prev,
        {
          id: genWinId(),
          type,
          title: type === 'claude' ? `Claude Terminal ${count + 1}` : `Melli / MUA ${count + 1}`,
          x: (type === 'claude' ? 500 : 40) + offset,
          y: 80 + offset,
          w: type === 'claude' ? 600 : 440,
          h: 620,
          zIndex: getNextZ(),
          minimized: false,
          maximized: false,
        },
      ];
    });
  }, []);

  const tileWindows = useCallback(() => {
    setWindows(prev => {
      const visible = prev.filter(w => !w.minimized);
      if (visible.length === 0) return prev;
      const gap = 12;
      const toolbarH = 48;
      const availW = typeof window !== 'undefined' ? window.innerWidth - gap * 2 : 1200;
      const availH = typeof window !== 'undefined' ? window.innerHeight - toolbarH - gap * 2 : 700;
      const cols = Math.min(visible.length, 3);
      const rows = Math.ceil(visible.length / cols);
      const cellW = Math.floor((availW - gap * (cols - 1)) / cols);
      const cellH = Math.floor((availH - gap * (rows - 1)) / rows);

      let idx = 0;
      return prev.map(w => {
        if (w.minimized) return w;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        idx++;
        return {
          ...w,
          x: gap + col * (cellW + gap),
          y: toolbarH + gap + row * (cellH + gap),
          w: cellW,
          h: cellH,
          maximized: false,
          zIndex: getNextZ(),
        };
      });
    });
  }, []);

  const stackWindows = useCallback(() => {
    setWindows(prev =>
      prev.map((w, i) => ({
        ...w,
        x: 80 + i * 40,
        y: 100 + i * 40,
        w: w.type === 'claude' ? 600 : 440,
        h: 620,
        maximized: false,
        minimized: false,
        zIndex: getNextZ(),
      }))
    );
  }, []);

  const minimizedWindows = windows.filter(w => w.minimized);

  return (
    <div className="fixed inset-0 bg-[hsl(var(--background))] overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Workspace screenshot flash */}
      {workspaceFlash && (
        <div
          className="fixed inset-0 z-[99999] bg-white pointer-events-none"
          style={{
            animation: 'ct-flash 0.3s ease-out forwards',
          }}
        />
      )}
      <style>{`@keyframes ct-flash{0%{opacity:0.7}100%{opacity:0}}`}</style>

      {/* Toolbar */}
      <div className="relative z-[9999] flex items-center gap-2 px-4 h-12 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] overflow-x-auto">
        <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mr-4">
          Terminal Workspace
        </span>

        <button
          onClick={() => addWindow('claude')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
        >
          <Plus className="h-3 w-3" />
          <Terminal className="h-3 w-3" />
          Claude
        </button>

        <button
          onClick={() => addWindow('jessica')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-red-400 text-xs font-medium hover:bg-[#E11D2E]/20 transition-colors"
        >
          <Plus className="h-3 w-3" />
          <Bot className="h-3 w-3" />
          Melli
        </button>

        <div className="w-px h-5 bg-[hsl(var(--muted))] mx-1" />

        <button
          onClick={tileWindows}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-medium hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <LayoutGrid className="h-3 w-3" />
          Tile
        </button>

        <button
          onClick={stackWindows}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-medium hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <Layers className="h-3 w-3" />
          Stack
        </button>

        <div className="w-px h-5 bg-[hsl(var(--muted))] mx-1" />

        <button
          onClick={handleWorkspaceScreenshot}
          disabled={workspaceCapturing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-medium hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 disabled:opacity-40 transition-colors"
          title="Capture workspace screenshot and send to Claude"
        >
          {workspaceCapturing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
          Screenshot
        </button>

        <div className="ml-auto flex items-center gap-3">
          {/* Claude Globe + Wake Word */}
          <div className="flex items-center gap-2">
            <ClaudeWakeWord
              enabled={wakeWordEnabled}
              onWakeWord={handleWakeWord}
              onCommand={handleWakeWordCommand}
            >
              <ClaudeGlobe
                size={36}
                state={claudeGlobeState}
                onClick={() => setWakeWordEnabled(prev => !prev)}
              />
            </ClaudeWakeWord>
          </div>

          <div className="w-px h-5 bg-[hsl(var(--muted))]" />

          {/* Connection mode indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              claudeServerUrl
                ? 'bg-emerald-500/5 border-emerald-500/15'
                : 'bg-amber-500/5 border-amber-500/15'
            }`}
            title={
              claudeServerUrl
                ? `Claude Server: ${claudeServerUrl}`
                : 'No NEXT_PUBLIC_CLAUDE_SERVER_URL configured — HTTP chat mode only'
            }
          >
            {claudeServerUrl ? (
              <Wifi className="h-3 w-3 text-emerald-400" />
            ) : (
              <WifiOff className="h-3 w-3 text-amber-400" />
            )}
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              claudeServerUrl ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {claudeServerUrl ? 'WS' : 'HTTP'}
            </span>
          </div>

          {/* Global routing indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Melli routes to <span className="text-emerald-400">Claude</span>
            </span>
          </div>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {windows.length} window{windows.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Minimized taskbar */}
      {minimizedWindows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center gap-2 px-4 h-10 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
          {minimizedWindows.map(w => (
            <button
              key={w.id}
              onClick={() => minimizeWindow(w.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                w.type === 'claude'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-[#E11D2E]/10 border-[#E11D2E]/20 text-red-400 hover:bg-[#E11D2E]/20'
              }`}
            >
              {w.type === 'claude' ? (
                <Terminal className="h-3 w-3" />
              ) : (
                <Bot className="h-3 w-3" />
              )}
              {w.title}
            </button>
          ))}
        </div>
      )}

      {/* Windows */}
      {windows.map(win => (
        <DraggableWindow
          key={win.id}
          win={win}
          onMove={moveWindow}
          onResize={resizeWindow}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
        >
          {win.type === 'claude' ? (
            <ClaudeTerminal
              ref={claudeRef}
              instanceId={win.id}
              onResponse={handleClaudeResponse}
              wsUrl={claudeServerUrl || undefined}
            />
          ) : (
            <JessicaChatInner claudeRef={claudeRef} />
          )}
        </DraggableWindow>
      ))}

      {/* Empty state */}
      {windows.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Terminal className="h-16 w-16 text-zinc-800 mb-4" />
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">No windows open</p>
          <div className="flex gap-3">
            <button
              onClick={() => addWindow('claude')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
            >
              <Terminal className="h-4 w-4" />
              Open Claude Terminal
            </button>
            <button
              onClick={() => addWindow('jessica')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-red-400 text-sm hover:bg-[#E11D2E]/20 transition-colors"
            >
              <Bot className="h-4 w-4" />
              Open Melli Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

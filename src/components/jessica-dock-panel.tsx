'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { useJessica } from '../providers/jessica-provider';
import { useMUA } from '../providers/mua-provider';
import { useVoiceSession } from '../providers/voice-session';
import { usePageContext } from '../providers/page-context';
import UniversalGlobe from './universal-globe';
import type { GlobeState } from './universal-globe';
import { signalFullPanelMounted, revokeFullPanelMounted } from './mobile-fallback-chat';
import {
  MUAHeader,
  MUAMessage,
  MUAInput,
  MUASuggestions,
  MUATyping,
  MUAActivity,
  MUAWelcome,
  MUAAttachments,
  MUAAgentProgress,
  MUASystemManager,
} from './mua';
import type { AgentProgressData } from './mua';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Injected styles                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STYLES = `
@keyframes jessica-dock-open {
  0% { transform: translateX(20px) scale(0.97); opacity: 0; }
  100% { transform: translateX(0) scale(1); opacity: 1; }
}
@keyframes jessica-dock-slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes jessica-dock-slide-out {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}
@keyframes jessica-orb-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(225,29,46,0.08); }
  50% { box-shadow: 0 0 10px rgba(225,29,46,0.2); }
}
@keyframes jessica-orb-pulse-claude {
  0%, 100% { box-shadow: 0 0 4px rgba(59,130,246,0.08); }
  50% { box-shadow: 0 0 10px rgba(59,130,246,0.2); }
}
@keyframes jessica-mobile-sheet-in {
  0% { transform: translateX(-50%) translateY(24px) scale(0.95); opacity: 0; }
  100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
}
@keyframes jessica-pill-pop {
  0% { transform: scale(0.85); opacity: 0; }
  60% { transform: scale(1.04); }
  100% { transform: scale(1); opacity: 1; }
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Context label                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatContextLabel(module: string): string {
  const labels: Record<string, string> = {
    'general': 'General',
    'universe-overview': 'Cockpit Overview',
    'command-center': 'Command Center',
    'crm': 'CRM',
    'commerce': 'Commerce',
    'coaching': 'Coaching',
    'credit': 'Credit & Funding',
    'contacts': 'Contacts',
    'analytics': 'Analytics',
    'seo': 'SEO Traffic',
    'ai': 'AI Agents',
    'settings': 'Settings',
    'workflows': 'Workflows',
    'tasks': 'Tasks',
    'agents': 'AI Workforce',
    'tenants': 'Tenants',
    'system': 'System Health',
    'diagnostics': 'Diagnostics',
    'activation': 'Activation',
    'deploy': 'Deploy',
    'terminal': 'Terminal',
    'communications': 'Communications',
    'affiliates': 'Affiliates',
    'traffic': 'Traffic / SEO',
    'map': 'Cockpit Map',
    'guide': 'System Guide',
    'dashboard-overview': 'Dashboard',
  };
  return labels[module] || module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, ' ');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Melli Dock Panel — renders ONCE at provider level                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function JessicaDockPanel() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const { state, actions } = useJessica();
  const mua = useMUA();
  const voice = useVoiceSession();
  const page = usePageContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Debug: track render lifecycle on mobile
  useEffect(() => {
    console.log('[JessicaDockPanel] render state:', {
      mounted,
      user: !!user,
      authLoading,
      pathname,
      isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : 'ssr',
    });
  }, [mounted, user, authLoading, pathname]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Touch drag state for mobile compact panel
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const touchRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    const touch = e.touches[0];
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;
    if (!touchRef.current.moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    touchRef.current.moved = true;
    const newX = touchRef.current.origX + dx;
    const newY = touchRef.current.origY + dy;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    setDragOffset({
      x: Math.max(-20, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY)),
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchRef.current) return;
    touchRef.current = null;
    if (dragOffset) {
      const vw = window.innerWidth;
      const snappedX = dragOffset.x < vw / 2
        ? Math.max(8, dragOffset.x)
        : Math.min(vw - 8, dragOffset.x);
      setDragOffset({ x: snappedX, y: Math.max(0, dragOffset.y) });
    }
  }, [dragOffset]);

  // Listen for action execution events and show brief feedback
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.label) {
        setActionFeedback(detail.label);
        setTimeout(() => setActionFeedback(null), 2500);
      }
    };
    window.addEventListener('meli-action-executed', handler);
    return () => window.removeEventListener('meli-action-executed', handler);
  }, []);

  // Reset drag + maximize when panel closes
  useEffect(() => {
    if (!state.isOpen) {
      setDragOffset(null);
      setIsMaximized(false);
    }
  }, [state.isOpen]);

  useEffect(() => {
    setMounted(true);
    injectStyles();
    console.log('[JessicaDockPanel] mounted (waiting for auth before signalling fallback)');
  }, []);

  useEffect(() => {
    if (mounted && user && !authLoading) {
      signalFullPanelMounted();
      console.log('[JessicaDockPanel] auth ready, signalled fallback to hide');
    } else if (mounted && !authLoading && !user) {
      revokeFullPanelMounted();
      console.log('[JessicaDockPanel] no user after auth load, revoked fallback signal');
    }
  }, [mounted, user, authLoading]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isThinking]);

  const isAuthRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/universe');

  if (!mounted || !isAuthRoute) return null;
  const authReady = !!user && !authLoading;

  // Derive header props
  const headerStatus = (() => {
    if (state.isThinking) return 'thinking' as const;
    if (voice.isSpeaking) return 'speaking' as const;
    if (voice.sessionState === 'listening') return 'listening' as const;
    return 'idle' as const;
  })();

  const headerSubtitle = (() => {
    if (state.isThinking) return 'Processing your request...';
    if (voice.isSpeaking) return 'Speaking...';
    if (voice.sessionState === 'listening') return 'Listening...';
    if (voice.sessionState !== 'inactive') return 'Ready -- speak or type';
    if (voice.isBackgroundListening) return 'Listening for "Hey Melli"...';
    return 'Say "Hey Melli" or type below';
  })();

  const showWelcome =
    state.messages.length === 0 &&
    !state.isThinking &&
    !state.hasInteracted;
  const showSuggestions =
    state.messages.length === 0 &&
    !state.isThinking &&
    state.hasInteracted;

  const contextLabel = formatContextLabel(state.context.currentModule);

  const globeState: GlobeState =
    mua.state.globeState === 'live'
      ? 'live'
      : mua.state.globeState === 'idle'
        ? 'idle'
        : 'sleep';

  // Mode colors
  const isClaude = state.chatMode === 'claude';
  const accentColor = isClaude ? '#60A5FA' : '#F59E0B';
  const accentBorder = isClaude ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)';
  const activeGlow = isClaude ? 'rgba(59, 130, 246, 0.04)' : 'rgba(245, 158, 11, 0.04)';

  // Desktop panel width — sidebar or expanded command center
  const desktopWidth = isMaximized ? '60vw' : '420px';

  // Mobile compact panel positioning
  const mobilePanelStyle: React.CSSProperties = isMobile
    ? dragOffset
      ? {
          position: 'fixed' as const,
          left: dragOffset.x,
          top: dragOffset.y,
          width: '92vw',
          maxWidth: '92vw',
          height: '70vh',
          maxHeight: '70vh',
          borderRadius: 24,
          animation: undefined,
          transition: 'none',
        }
      : {
          position: 'fixed' as const,
          left: '50%',
          bottom: 80,
          transform: 'translateX(-50%)',
          width: '92vw',
          maxWidth: '92vw',
          height: '70vh',
          maxHeight: '70vh',
          borderRadius: 24,
          top: 'auto',
          right: 'auto',
          animation: 'jessica-mobile-sheet-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }
    : {
        animation: 'jessica-dock-open 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '100dvh',
        width: desktopWidth,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      };

  return (
    <>
      {/* ═══════════════════════ Floating Pill/Orb (visible when panel is CLOSED) ═══════════════════════ */}
      {!state.isOpen && (
        <div
          className="fixed z-50"
          style={isMobile
            ? { bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)' }
            : { bottom: 24, right: 24 }
          }
        >
          {/* Desktop: floating pill with label. Mobile: orb only. */}
          {isMobile ? (
            <div
              className="relative cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-0.5 active:scale-95"
              onClick={authReady ? actions.toggle : undefined}
              style={{
                filter: isClaude
                  ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))'
                  : 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.3))',
              }}
            >
              <UniversalGlobe state={authReady ? globeState : 'sleep'} size={48} onClick={authReady ? actions.toggle : undefined} />
              {/* Mobile status dot */}
              <span className="absolute top-0.5 right-0.5">
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full border border-zinc-900/80 ${
                    !authReady
                      ? 'bg-amber-400/80 animate-pulse'
                      : mua.state.isActive
                        ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.35)]'
                        : 'bg-zinc-600/80'
                  }`}
                />
                {authReady && mua.state.isListening && (
                  <span className="absolute inset-0 inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-40" />
                )}
              </span>
            </div>
          ) : (
            /* Desktop: premium floating pill button */
            <button
              onClick={authReady ? actions.toggle : undefined}
              className="flex items-center gap-3 cursor-pointer select-none transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: 'rgba(9, 9, 11, 0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: `1px solid rgba(255, 255, 255, 0.06)`,
                borderRadius: 999,
                padding: '10px 20px 10px 12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
                animation: 'jessica-pill-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  filter: isClaude
                    ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.3))'
                    : 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.3))',
                }}
              >
                <UniversalGlobe state={authReady ? globeState : 'sleep'} size={36} onClick={authReady ? actions.toggle : undefined} />
              </div>
              <span
                className="text-sm font-medium tracking-tight"
                style={{ color: accentColor }}
              >
                Ask {isClaude ? 'Claude' : 'Melli'}
              </span>
              <span
                className="inline-block h-2 w-2 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: !authReady
                    ? '#FBBF24'
                    : mua.state.isActive ? '#34D399' : '#52525b',
                  boxShadow: mua.state.isActive ? '0 0 6px rgba(52,211,153,0.4)' : 'none',
                }}
              />
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════ Panel (visible when OPEN) ═══════════════════════ */}
      {state.isOpen && (
        <div
          ref={panelRef}
          className={`fixed z-50 flex flex-col overflow-hidden ${
            isMobile
              ? ''
              : 'top-0 right-0 h-full'
          }`}
          style={{
            ...mobilePanelStyle,
            background: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: isMobile ? (mobilePanelStyle.borderRadius || 24) : 0,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.02), inset 0 0 60px ${activeGlow}`,
          }}
        >
          {/* ── Panel header ── */}
          <div
            className="shrink-0 select-none"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
          >
            <div
              className="flex items-center gap-3.5 px-5 py-4"
              style={isMobile ? { touchAction: 'none', cursor: 'grab' } : undefined}
              onTouchStart={isMobile ? onTouchStart : undefined}
              onTouchMove={isMobile ? onTouchMove : undefined}
              onTouchEnd={isMobile ? onTouchEnd : undefined}
            >
              {/* Drag handle on mobile */}
              {isMobile && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-zinc-600/30" />
              )}

              {/* Globe in header */}
              <div
                className="shrink-0"
                style={{
                  filter: isClaude
                    ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.3))'
                    : 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.3))',
                }}
              >
                <UniversalGlobe state={globeState} size={36} />
              </div>

              {/* Name + context */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-xl font-semibold tracking-tight"
                    style={{ color: accentColor }}
                  >
                    {isClaude ? 'Claude' : 'Melli'}
                  </span>
                  {/* Status dot — larger */}
                  <span
                    className="inline-block h-2 w-2 rounded-full transition-colors duration-500"
                    style={{
                      backgroundColor:
                        mua.state.globeState === 'live'
                          ? (isClaude ? '#3B82F6' : '#E11D2E')
                          : mua.state.globeState === 'idle'
                            ? '#52525b'
                            : '#3f3f46',
                      boxShadow:
                        mua.state.globeState === 'live'
                          ? (isClaude ? '0 0 6px rgba(59,130,246,0.5)' : '0 0 6px rgba(225,29,46,0.4)')
                          : 'none',
                    }}
                  />
                </div>
                <span className="text-xs text-zinc-500 tracking-wide">
                  {contextLabel}
                </span>
              </div>

              {/* Mode toggle — clean pill switch */}
              <button
                onClick={() => actions.setChatMode(state.chatMode === 'meli' ? 'claude' : 'meli')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: isClaude ? 'rgba(245, 158, 11, 0.08)' : 'rgba(96, 165, 250, 0.08)',
                  border: `1px solid ${isClaude ? 'rgba(245, 158, 11, 0.15)' : 'rgba(96, 165, 250, 0.15)'}`,
                }}
              >
                <span
                  className="text-[11px] font-medium tracking-wide"
                  style={{
                    color: isClaude ? 'rgba(245, 158, 11, 0.7)' : 'rgba(96, 165, 250, 0.7)',
                  }}
                >
                  {isClaude ? 'Melli' : 'Claude'}
                </span>
              </button>

              {/* Maximize / minimize — desktop only */}
              {!isMobile && (
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-all duration-200"
                  title={isMaximized ? 'Minimize' : 'Expand'}
                >
                  {isMaximized
                    ? <Minimize2 className="h-3.5 w-3.5" />
                    : <Maximize2 className="h-3.5 w-3.5" />
                  }
                </button>
              )}

              {/* Close / collapse */}
              <button
                onClick={actions.close}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-all duration-200"
                title="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="7" x2="11" y2="7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Agent progress / activity ── */}
          {state.agentProgress &&
          state.agentProgress.totalAgents > 2 ? (
            <MUAAgentProgress data={state.agentProgress} />
          ) : (
            <MUAActivity dispatches={state.activeDispatches} />
          )}

          {/* ── System Manager ── */}
          {state.systemManagerStatus && (
            <MUASystemManager status={state.systemManagerStatus} />
          )}

          {/* ── Action feedback banner ── */}
          {actionFeedback && (
            <div
              className="shrink-0 px-5 py-2 text-[11px] tracking-wide transition-opacity duration-500"
              style={{
                color: isClaude ? '#60A5FA' : '#F59E0B',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                backgroundColor: isClaude
                  ? 'rgba(59, 130, 246, 0.06)'
                  : 'rgba(245, 158, 11, 0.06)',
              }}
            >
              {actionFeedback}
            </div>
          )}

          {/* ── Messages area — generous spacing ── */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
            {/* Loading state */}
            {!state.ready && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className={`h-8 w-8 rounded-full border-2 animate-spin ${
                  isClaude
                    ? 'border-blue-500/30 border-t-blue-500'
                    : 'border-amber-500/30 border-t-amber-500'
                }`} />
                <span className="text-base text-zinc-500">
                  {isClaude ? 'Claude' : 'Melli'} is starting up...
                </span>
              </div>
            )}

            {state.ready && showWelcome && (
              <MUAWelcome
                onSuggest={(t) => actions.sendMessage(t)}
                sphereState={headerStatus === 'thinking' ? 'thinking' : headerStatus === 'speaking' ? 'speaking' : headerStatus === 'listening' ? 'listening' : 'idle'}
              />
            )}

            {state.ready && showSuggestions && (
              <MUASuggestions
                onSelect={(prompt) => actions.sendMessage(prompt)}
              />
            )}

            {state.messages.map((msg, i) => (
              <MUAMessage
                key={msg.id}
                role={msg.role as 'user' | 'assistant'}
                content={msg.content}
                timestamp={msg.timestamp}
                actions={msg.actions}
                attachments={msg.attachments}
                isLatest={i === state.messages.length - 1}
              />
            ))}

            {state.isThinking && <MUATyping />}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Attachments bar ── */}
          <MUAAttachments
            screenshot={state.pendingScreenshot}
            files={page.uploadedFiles.map((f) => ({
              id: f.id,
              name: f.name,
            }))}
            onRemoveScreenshot={actions.clearScreenshot}
            onRemoveFile={(id) => page.removeFile(id)}
          />

          {/* ── Input ── */}
          <MUAInput
            value={inputText}
            onChange={setInputText}
            onSend={(text) => {
              actions.sendMessage(text);
              setInputText('');
            }}
            onScreenshot={actions.captureScreenshot}
            onFileUpload={(files) => actions.handleFileUpload(files)}
            isThinking={state.isThinking || !state.ready}
            isVoiceSupported={voice.isSupported}
            isListening={mua.state.isListening}
            isSpeaking={mua.state.isSpeaking}
            isVoiceActive={voice.sessionState !== 'inactive'}
            onToggleVoice={() => {
              if (voice.sessionState === 'inactive') voice.activate();
              else voice.deactivate();
            }}
            isBackgroundListening={voice.isBackgroundListening}
            placeholder={!state.ready ? 'Starting up...' : isClaude ? 'Ask Claude anything...' : 'Ask Melli anything...'}
          />
        </div>
      )}
    </>
  );
}

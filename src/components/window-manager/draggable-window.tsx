'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Z-index management (module-level singleton)
// ---------------------------------------------------------------------------
let globalZIndex = 1000;
function bringToFront(): number {
  globalZIndex += 1;
  return globalZIndex;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
interface PersistedState {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadState(id: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(`memelli-window-${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveState(id: string, state: PersistedState): void {
  try {
    localStorage.setItem(`memelli-window-${id}`, JSON.stringify(state));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ResizeEdge =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | null;

export interface DraggableWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  onClose?: () => void;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TITLE_BAR_HEIGHT = 40;
const SNAP_THRESHOLD = 20;
const EDGE_HIT_SIZE = 6; // resize handle hit-area in px
const VIEWPORT_MARGIN = 16;
const DEFAULT_MIN_WIDTH = 300;
const DEFAULT_MIN_HEIGHT = 200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DraggableWindow({
  id,
  title,
  icon,
  defaultPosition = { x: 120, y: 80 },
  defaultSize = { width: 600, height: 420 },
  minSize,
  onClose,
  children,
  headerExtra,
  accentColor = '#E11D2E',
}: DraggableWindowProps) {
  const minW = minSize?.width ?? DEFAULT_MIN_WIDTH;
  const minH = minSize?.height ?? DEFAULT_MIN_HEIGHT;

  // --- persisted or default geometry ------------------------------------------
  const persisted = useRef(loadState(id));

  const [pos, setPos] = useState({
    x: persisted.current?.x ?? defaultPosition.x,
    y: persisted.current?.y ?? defaultPosition.y,
  });
  const [size, setSize] = useState({
    width: persisted.current?.width ?? defaultSize.width,
    height: persisted.current?.height ?? defaultSize.height,
  });

  const [zIndex, setZIndex] = useState(() => bringToFront());
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // stash pre-maximize / pre-minimize geometry
  const preMaxRef = useRef({ x: pos.x, y: pos.y, ...size });
  const preMinSizeRef = useRef(size.height);

  // refs for drag / resize RAF loop
  const windowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const resizing = useRef<ResizeEdge>(null);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const resizeStart = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const rafId = useRef<number | null>(null);

  // latest pos/size refs (avoid stale closure in RAF callbacks)
  const posRef = useRef(pos);
  const sizeRef = useRef(size);
  posRef.current = pos;
  sizeRef.current = size;

  // ---- mobile detection -------------------------------------------------------
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ---- persist on change ------------------------------------------------------
  useEffect(() => {
    if (!minimized && !maximized) {
      saveState(id, { x: pos.x, y: pos.y, ...size });
    }
  }, [id, pos, size, minimized, maximized]);

  // ---- focus (z-index) --------------------------------------------------------
  const focus = useCallback(() => setZIndex(bringToFront()), []);

  // ---- snap helper ------------------------------------------------------------
  const snap = useCallback(
    (x: number, y: number, w: number, h: number) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let sx = x;
      let sy = y;
      if (x < SNAP_THRESHOLD) sx = 0;
      else if (x + w > vw - SNAP_THRESHOLD) sx = vw - w;
      if (y < SNAP_THRESHOLD) sy = 0;
      else if (y + h > vh - SNAP_THRESHOLD) sy = vh - h;
      return { x: sx, y: sy };
    },
    [],
  );

  // ===========================================================================
  // DRAG
  // ===========================================================================
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (maximized) return;
      e.preventDefault();
      focus();
      dragging.current = true;
      dragStart.current = {
        mx: e.clientX,
        my: e.clientY,
        ox: posRef.current.x,
        oy: posRef.current.y,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          const dx = ev.clientX - dragStart.current.mx;
          const dy = ev.clientY - dragStart.current.my;
          let nx = dragStart.current.ox + dx;
          let ny = dragStart.current.oy + dy;
          const snapped = snap(nx, ny, sizeRef.current.width, sizeRef.current.height);
          nx = snapped.x;
          ny = snapped.y;
          // keep title bar on screen
          ny = Math.max(0, ny);
          setPos({ x: nx, y: ny });
        });
      };

      const onUp = () => {
        dragging.current = false;
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [focus, maximized, snap],
  );

  // ===========================================================================
  // RESIZE
  // ===========================================================================
  const startResize = useCallback(
    (edge: ResizeEdge, e: React.MouseEvent) => {
      if (maximized || minimized) return;
      e.preventDefault();
      e.stopPropagation();
      focus();
      resizing.current = edge;
      resizeStart.current = {
        mx: e.clientX,
        my: e.clientY,
        x: posRef.current.x,
        y: posRef.current.y,
        w: sizeRef.current.width,
        h: sizeRef.current.height,
      };

      const onMove = (ev: MouseEvent) => {
        if (!resizing.current) return;
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          const dx = ev.clientX - resizeStart.current.mx;
          const dy = ev.clientY - resizeStart.current.my;
          const s = resizeStart.current;
          let nx = s.x;
          let ny = s.y;
          let nw = s.w;
          let nh = s.h;

          const dir = resizing.current!;

          if (dir.includes('e')) nw = Math.max(minW, s.w + dx);
          if (dir.includes('s')) nh = Math.max(minH, s.h + dy);
          if (dir.includes('w')) {
            nw = Math.max(minW, s.w - dx);
            nx = s.x + (s.w - nw);
          }
          if (dir.includes('n')) {
            nh = Math.max(minH, s.h - dy);
            ny = s.y + (s.h - nh);
          }

          ny = Math.max(0, ny);
          setPos({ x: nx, y: ny });
          setSize({ width: nw, height: nh });
        });
      };

      const onUp = () => {
        resizing.current = null;
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [focus, maximized, minimized, minW, minH],
  );

  // ===========================================================================
  // MINIMIZE / MAXIMIZE / CLOSE
  // ===========================================================================
  const toggleMinimize = useCallback(() => {
    if (minimized) {
      setSize((s) => ({ ...s, height: preMinSizeRef.current }));
      setMinimized(false);
    } else {
      preMinSizeRef.current = sizeRef.current.height;
      setMinimized(true);
    }
  }, [minimized]);

  const toggleMaximize = useCallback(() => {
    if (maximized) {
      setPos({ x: preMaxRef.current.x, y: preMaxRef.current.y });
      setSize({
        width: preMaxRef.current.width,
        height: preMaxRef.current.height,
      });
      setMaximized(false);
    } else {
      preMaxRef.current = {
        x: posRef.current.x,
        y: posRef.current.y,
        ...sizeRef.current,
      };
      setPos({ x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN });
      setSize({
        width: window.innerWidth - VIEWPORT_MARGIN * 2,
        height: window.innerHeight - VIEWPORT_MARGIN * 2,
      });
      setMinimized(false);
      setMaximized(true);
    }
  }, [maximized]);

  // ===========================================================================
  // Derived values
  // ===========================================================================
  const displayHeight = minimized ? TITLE_BAR_HEIGHT : size.height;

  // Mobile: always full screen
  const mobileStyle: React.CSSProperties | undefined = isMobile
    ? {
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
      }
    : undefined;

  const desktopStyle: React.CSSProperties = {
    position: 'fixed',
    left: maximized ? VIEWPORT_MARGIN : pos.x,
    top: maximized ? VIEWPORT_MARGIN : pos.y,
    width: maximized ? window.innerWidth - VIEWPORT_MARGIN * 2 : size.width,
    height: maximized
      ? window.innerHeight - VIEWPORT_MARGIN * 2
      : displayHeight,
    zIndex,
    willChange: 'transform',
  };

  // Resize edge elements (invisible hit areas around the window)
  const edgeCursors: Record<string, string> = {
    n: 'n-resize',
    s: 's-resize',
    e: 'e-resize',
    w: 'w-resize',
    nw: 'nw-resize',
    ne: 'ne-resize',
    sw: 'sw-resize',
    se: 'se-resize',
  };

  const edgeStyles: Record<string, React.CSSProperties> = {
    n: { top: -EDGE_HIT_SIZE / 2, left: EDGE_HIT_SIZE, right: EDGE_HIT_SIZE, height: EDGE_HIT_SIZE },
    s: { bottom: -EDGE_HIT_SIZE / 2, left: EDGE_HIT_SIZE, right: EDGE_HIT_SIZE, height: EDGE_HIT_SIZE },
    e: { right: -EDGE_HIT_SIZE / 2, top: EDGE_HIT_SIZE, bottom: EDGE_HIT_SIZE, width: EDGE_HIT_SIZE },
    w: { left: -EDGE_HIT_SIZE / 2, top: EDGE_HIT_SIZE, bottom: EDGE_HIT_SIZE, width: EDGE_HIT_SIZE },
    nw: { top: -EDGE_HIT_SIZE / 2, left: -EDGE_HIT_SIZE / 2, width: EDGE_HIT_SIZE * 2, height: EDGE_HIT_SIZE * 2 },
    ne: { top: -EDGE_HIT_SIZE / 2, right: -EDGE_HIT_SIZE / 2, width: EDGE_HIT_SIZE * 2, height: EDGE_HIT_SIZE * 2 },
    sw: { bottom: -EDGE_HIT_SIZE / 2, left: -EDGE_HIT_SIZE / 2, width: EDGE_HIT_SIZE * 2, height: EDGE_HIT_SIZE * 2 },
    se: { bottom: -EDGE_HIT_SIZE / 2, right: -EDGE_HIT_SIZE / 2, width: EDGE_HIT_SIZE * 2, height: EDGE_HIT_SIZE * 2 },
  };

  return (
    <div
      ref={windowRef}
      onMouseDown={focus}
      style={isMobile ? mobileStyle : desktopStyle}
      className={`
        flex flex-col overflow-hidden select-none
        bg-zinc-900/80 backdrop-blur-xl
        border border-white/[0.06]
        ${isMobile ? '' : 'rounded-xl'}
        shadow-2xl shadow-black/40
        transition-[height] duration-200 ease-out
      `}
    >
      {/* ---- Resize handles (desktop, not maximized/minimized) ---- */}
      {!isMobile && !maximized && !minimized &&
        (Object.keys(edgeCursors) as ResizeEdge[]).map(
          (edge) =>
            edge && (
              <div
                key={edge}
                onMouseDown={(e) => startResize(edge, e)}
                style={{
                  position: 'absolute',
                  cursor: edgeCursors[edge],
                  zIndex: 10,
                  ...edgeStyles[edge],
                }}
              />
            ),
        )}

      {/* ============================================================ */}
      {/* TITLE BAR                                                     */}
      {/* ============================================================ */}
      <div
        onMouseDown={onDragStart}
        onDoubleClick={toggleMaximize}
        className="flex items-center h-10 shrink-0 px-3 gap-2 cursor-grab active:cursor-grabbing"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* accent pip */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />

        {/* icon */}
        {icon && (
          <span className="shrink-0 text-zinc-400 text-sm">{icon}</span>
        )}

        {/* title */}
        <span className="text-xs font-medium text-zinc-300 truncate flex-1">
          {title}
        </span>

        {/* extra header content */}
        {headerExtra && (
          <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
            {headerExtra}
          </div>
        )}

        {/* window controls */}
        <div
          className="flex items-center gap-1.5 shrink-0 ml-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* minimize */}
          <button
            onClick={toggleMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors flex items-center justify-center group"
            title="Minimize"
          >
            <svg
              className="w-1.5 h-1.5 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity"
              viewBox="0 0 8 8"
              fill="none"
            >
              <path d="M1 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* maximize */}
          <button
            onClick={toggleMaximize}
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors flex items-center justify-center group"
            title="Maximize"
          >
            <svg
              className="w-1.5 h-1.5 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity"
              viewBox="0 0 8 8"
              fill="none"
            >
              {maximized ? (
                <>
                  <rect x="1" y="2.5" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="3" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1" fill="none" />
                </>
              ) : (
                <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.2" fill="none" rx="0.5" />
              )}
            </svg>
          </button>

          {/* close */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors flex items-center justify-center group"
              title="Close"
            >
              <svg
                className="w-1.5 h-1.5 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 8 8"
                fill="none"
              >
                <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BODY                                                          */}
      {/* ============================================================ */}
      {!minimized && (
        <div className="flex-1 overflow-auto min-h-0">{children}</div>
      )}
    </div>
  );
}

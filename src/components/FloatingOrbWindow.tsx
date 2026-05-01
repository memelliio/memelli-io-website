'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import nextDynamic from 'next/dynamic';

const HomeSphere = nextDynamic(
  () => import('./melli-sphere/HomeSphere').then(m => ({ default: m.HomeSphere })),
  { ssr: false }
);

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  quickPrompts?: string[]; // kept for compat, no longer displayed
  replyText?: string;
  userText?: string;
  panelInput?: string;
  onPanelInputChange?: (v: string) => void;
  onPanelSubmit?: (v: string) => void;
  onClose?: () => void;
}

export function FloatingOrbWindow({
  replyText,
  userText,
  panelInput = '',
  onPanelInputChange,
  onPanelSubmit,
  onClose,
}: Props) {
  const dragControls = useDragControls();
  const motionX = useMotionValue(20);
  const motionY = useMotionValue(70);

  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const savedRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const [size, setSize] = useState({ w: 380, h: 520 });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const posRef = useRef({ x: 20, y: 70 });

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevReplyRef = useRef('');
  const prevUserRef = useRef('');

  // Append new messages to history
  useEffect(() => {
    if (userText && userText !== prevUserRef.current) {
      prevUserRef.current = userText;
      setMessages(m => [...m, { role: 'user', text: userText }]);
    }
  }, [userText]);

  useEffect(() => {
    if (replyText && replyText !== prevReplyRef.current) {
      prevReplyRef.current = replyText;
      setMessages(m => [...m, { role: 'assistant', text: replyText }]);
    }
  }, [replyText]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generic resize handler — directions: n/s/e/w and combos
  const handleMaximize = () => {
    if (maximized) {
      const s = savedRef.current;
      if (s) { setSize({ w: s.w, h: s.h }); motionX.set(s.x); motionY.set(s.y); posRef.current = { x: s.x, y: s.y }; }
      setMaximized(false);
    } else {
      savedRef.current = { x: motionX.get(), y: motionY.get(), w: sizeRef.current.w, h: sizeRef.current.h };
      setSize({ w: window.innerWidth, h: window.innerHeight });
      motionX.set(0); motionY.set(0); posRef.current = { x: 0, y: 0 };
      setMaximized(true); setMinimized(false);
    }
  };

  const makeResizeHandler = useCallback((dir: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.w;
    const startH = sizeRef.current.h;
    const startPX = posRef.current.x;
    const startPY = posRef.current.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let newW = startW;
      let newH = startH;
      let newX = startPX;
      let newY = startPY;

      if (dir.includes('e')) newW = Math.max(280, startW + dx);
      if (dir.includes('s')) newH = Math.max(300, startH + dy);
      if (dir.includes('w')) { newW = Math.max(280, startW - dx); newX = startPX + (startW - newW); }
      if (dir.includes('n')) { newH = Math.max(300, startH - dy); newY = startPY + (startH - newH); }

      setSize({ w: newW, h: newH });
      motionX.set(newX);
      motionY.set(newY);
      posRef.current = { x: newX, y: newY };
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [motionX, motionY]);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      style={{
        x: motionX,
        y: motionY,
        width: maximized ? '100vw' : size.w,
        height: minimized ? 40 : (maximized ? '100vh' : size.h),
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
        borderRadius: maximized ? 0 : 16,
        overflow: 'hidden',
      }}
      className="flex flex-col select-none"
      onDragEnd={() => { posRef.current = { x: motionX.get(), y: motionY.get() }; }}
    >
      {/* ── Title bar / drag handle ── */}
      <div
        onPointerDown={(e) => !maximized && dragControls.start(e)}
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{
          height: 40,
          background: 'rgba(18,18,18,0.98)',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.07)',
          cursor: maximized ? 'default' : 'grab',
          borderRadius: maximized ? 0 : minimized ? 16 : '16px 16px 0 0',
        }}
      >
        <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex-shrink-0" title="Close" />
        <button onClick={() => setMinimized(v => !v)} className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors flex-shrink-0" title={minimized ? 'Restore' : 'Minimize'} />
        <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-400 transition-colors flex-shrink-0" title={maximized ? 'Restore' : 'Maximize'} />
        <span className="flex-1 text-[10px] text-zinc-600 font-mono pl-1">Melli</span>
      </div>

      {/* ── Content ── */}
      {!minimized && <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
      >
        {/* Globe — HomeSphere at fixed 110px with wake-word reminder */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1" style={{ height: 136 }}>
          <HomeSphere state="idle" size={100} />
          <p className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Say "Hey Memelli"</p>
        </div>

        {/* Message history */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-center text-[11px] text-zinc-600 font-mono mt-6">Say something to Melli…</p>
          )}
          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div
                key={i}
                className="self-end text-xs text-white/70 max-w-[85%] text-right"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '6px 10px' }}
              >
                {m.text}
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-black text-white mt-0.5"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}
                >M</div>
                <div
                  className="flex-1 text-xs text-zinc-200 leading-relaxed"
                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 12, padding: '6px 10px' }}
                >
                  {m.text}
                </div>
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (panelInput.trim() && onPanelSubmit) onPanelSubmit(panelInput); }}
          className="flex items-center gap-2 px-3 pb-3 pt-1 flex-shrink-0"
        >
          <input
            value={panelInput}
            onChange={(e) => onPanelInputChange?.(e.target.value)}
            placeholder="Ask Melli…"
            className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!panelInput.trim()}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
            style={{ background: panelInput.trim() ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.06)' }}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </form>
      </div>}

      {/* ── Resize handles — all 8 directions ── */}
      {!maximized && !minimized && <><div onMouseDown={makeResizeHandler('n')}  className="absolute top-0 left-3 right-3"    style={{ height: 5, cursor: 'n-resize', zIndex: 10 }} />
      <div onMouseDown={makeResizeHandler('s')}  className="absolute bottom-0 left-3 right-3" style={{ height: 5, cursor: 's-resize', zIndex: 10 }} />
      <div onMouseDown={makeResizeHandler('e')}  className="absolute right-0 top-3 bottom-3"  style={{ width: 5, cursor: 'e-resize', zIndex: 10 }} />
      <div onMouseDown={makeResizeHandler('w')}  className="absolute left-0 top-3 bottom-3"   style={{ width: 5, cursor: 'w-resize', zIndex: 10 }} />
      {/* Corners */}
      <div onMouseDown={makeResizeHandler('ne')} className="absolute top-0 right-0"    style={{ width: 12, height: 12, cursor: 'ne-resize', zIndex: 11 }} />
      <div onMouseDown={makeResizeHandler('nw')} className="absolute top-0 left-0"     style={{ width: 12, height: 12, cursor: 'nw-resize', zIndex: 11 }} />
      <div onMouseDown={makeResizeHandler('se')} className="absolute bottom-0 right-0" style={{ width: 12, height: 12, cursor: 'se-resize', zIndex: 11 }} />
      <div onMouseDown={makeResizeHandler('sw')} className="absolute bottom-0 left-0"  style={{ width: 12, height: 12, cursor: 'sw-resize', zIndex: 11 }} /></>}
    </motion.div>
  );
}

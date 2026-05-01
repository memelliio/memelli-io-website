'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';

interface Props {
  title: string;
  icon?: React.ReactNode;
  accentColor?: string;
  defaultX?: number;
  defaultY?: number;
  defaultW?: number;
  defaultH?: number;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function FloatingWindow({
  title,
  icon,
  accentColor = '#dc2626',
  defaultX = 60,
  defaultY = 100,
  defaultW = 560,
  defaultH = 480,
  children,
  onClose,
}: Props) {
  const dragControls = useDragControls();
  const motionX = useMotionValue(defaultX);
  const motionY = useMotionValue(defaultY);

  const [size, setSize] = useState({ w: defaultW, h: defaultH });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const posRef = useRef({ x: defaultX, y: defaultY });
  // saved size/pos before maximize
  const savedRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleMinimize = () => {
    if (maximized) handleMaximize(); // restore first
    setMinimized(v => !v);
  };

  const handleMaximize = () => {
    if (maximized) {
      // restore
      const s = savedRef.current;
      if (s) {
        setSize({ w: s.w, h: s.h });
        motionX.set(s.x);
        motionY.set(s.y);
        posRef.current = { x: s.x, y: s.y };
      }
      setMaximized(false);
    } else {
      savedRef.current = { x: motionX.get(), y: motionY.get(), w: sizeRef.current.w, h: sizeRef.current.h };
      setSize({ w: window.innerWidth, h: window.innerHeight });
      motionX.set(0);
      motionY.set(0);
      posRef.current = { x: 0, y: 0 };
      setMaximized(true);
      setMinimized(false);
    }
  };

  const makeResizeHandler = useCallback((dir: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (maximized) return;
    const startX = e.clientX, startY = e.clientY;
    const startW = sizeRef.current.w, startH = sizeRef.current.h;
    const startPX = posRef.current.x, startPY = posRef.current.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      let newW = startW, newH = startH, newX = startPX, newY = startPY;
      if (dir.includes('e')) newW = Math.max(280, startW + dx);
      if (dir.includes('s')) newH = Math.max(200, startH + dy);
      if (dir.includes('w')) { newW = Math.max(280, startW - dx); newX = startPX + (startW - newW); }
      if (dir.includes('n')) { newH = Math.max(200, startH - dy); newY = startPY + (startH - newH); }
      setSize({ w: newW, h: newH });
      motionX.set(newX); motionY.set(newY);
      posRef.current = { x: newX, y: newY };
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [motionX, motionY, maximized]);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      style={{
        x: motionX, y: motionY,
        width: maximized ? '100vw' : size.w,
        height: minimized ? 40 : (maximized ? '100vh' : size.h),
        position: 'fixed',
        top: 0, left: 0,
        zIndex: 1001,
        boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
        borderRadius: maximized ? 0 : 16,
        overflow: 'hidden',
      }}
      className="flex flex-col select-none"
      onDragEnd={() => { posRef.current = { x: motionX.get(), y: motionY.get() }; }}
    >
      {/* Title bar */}
      <div
        onPointerDown={(e) => !maximized && dragControls.start(e)}
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{
          height: 40,
          background: 'rgba(18,18,18,0.99)',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.07)',
          cursor: maximized ? 'default' : 'grab',
          borderRadius: maximized ? 0 : '16px 16px 0 0',
        }}
      >
        {/* Traffic lights */}
        <button
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex-shrink-0"
          title="Close"
        />
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors flex-shrink-0"
          title={minimized ? 'Restore' : 'Minimize'}
        />
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-400 transition-colors flex-shrink-0"
          title={maximized ? 'Restore' : 'Maximize'}
        />

        {icon && <span className="ml-1 flex-shrink-0">{icon}</span>}
        <span className="flex-1 text-[10px] text-zinc-500 font-mono truncate pl-1">{title}</span>
      </div>

      {/* Content */}
      {!minimized && (
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)' }}
        >
          {children}
        </div>
      )}

      {/* Resize handles (disabled when maximized) */}
      {!maximized && !minimized && (<>
        <div onMouseDown={makeResizeHandler('n')}  style={{ position:'absolute', top:0,    left:12,  right:12, height:5,  cursor:'n-resize',  zIndex:10 }} />
        <div onMouseDown={makeResizeHandler('s')}  style={{ position:'absolute', bottom:0, left:12,  right:12, height:5,  cursor:'s-resize',  zIndex:10 }} />
        <div onMouseDown={makeResizeHandler('e')}  style={{ position:'absolute', right:0,  top:12,   bottom:12,width:5,   cursor:'e-resize',  zIndex:10 }} />
        <div onMouseDown={makeResizeHandler('w')}  style={{ position:'absolute', left:0,   top:12,   bottom:12,width:5,   cursor:'w-resize',  zIndex:10 }} />
        <div onMouseDown={makeResizeHandler('ne')} style={{ position:'absolute', top:0,    right:0,  width:14, height:14, cursor:'ne-resize', zIndex:11 }} />
        <div onMouseDown={makeResizeHandler('nw')} style={{ position:'absolute', top:0,    left:0,   width:14, height:14, cursor:'nw-resize', zIndex:11 }} />
        <div onMouseDown={makeResizeHandler('se')} style={{ position:'absolute', bottom:0, right:0,  width:14, height:14, cursor:'se-resize', zIndex:11 }} />
        <div onMouseDown={makeResizeHandler('sw')} style={{ position:'absolute', bottom:0, left:0,   width:14, height:14, cursor:'sw-resize', zIndex:11 }} />
      </>)}
    </motion.div>
  );
}

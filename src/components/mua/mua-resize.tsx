'use client';

import { useCallback, useRef } from 'react';

interface MUAResizeProps {
  panelSize: { w: number; h: number };
  panelPos: { x: number; y: number } | null;
  onResize: (size: { w: number; h: number }) => void;
  onMove: (pos: { x: number; y: number } | null) => void;
}

export default function MUAResize({ panelSize, panelPos, onResize, onMove }: MUAResizeProps) {
  const onEdge = useCallback((edge: 'top' | 'bottom' | 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const origW = panelSize.w, origH = panelSize.h;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (edge === 'right') onResize({ w: Math.max(360, Math.min(window.innerWidth * 0.9, origW + dx)), h: origH });
      else if (edge === 'bottom') onResize({ w: origW, h: Math.max(400, Math.min(window.innerHeight * 0.85, origH + dy)) });
      else if (edge === 'left') {
        const newW = Math.max(360, origW - dx);
        onResize({ w: newW, h: origH });
      }
      else if (edge === 'top') {
        const newH = Math.max(400, origH - dy);
        onResize({ w: origW, h: newH });
      }
    };
    const onUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
  }, [panelSize, onResize]);

  const onCorner = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const origW = panelSize.w, origH = panelSize.h;

    const onMouseMove = (ev: MouseEvent) => {
      const dw = ev.clientX - startX, dh = ev.clientY - startY;
      onResize({
        w: Math.max(360, Math.min(window.innerWidth * 0.9, origW + dw)),
        h: Math.max(400, Math.min(window.innerHeight * 0.85, origH + dh)),
      });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
  }, [panelSize, onResize]);

  return (
    <>
      <div onMouseDown={onEdge('right')} className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-ew-resize z-10 hover:bg-red-500/10 transition-colors" />
      <div onMouseDown={onEdge('bottom')} className="hidden md:block absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize z-10 hover:bg-red-500/10 transition-colors" />
      <div onMouseDown={onEdge('left')} className="hidden md:block absolute top-0 left-0 w-1.5 h-full cursor-ew-resize z-10 hover:bg-red-500/10 transition-colors" />
      <div onMouseDown={onEdge('top')} className="hidden md:block absolute top-0 left-0 w-full h-1.5 cursor-ns-resize z-10 hover:bg-red-500/10 transition-colors" />
      <div onMouseDown={onCorner} className="hidden md:block absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 group">
        <svg className="absolute bottom-0.5 right-0.5 w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors" viewBox="0 0 12 12">
          <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}

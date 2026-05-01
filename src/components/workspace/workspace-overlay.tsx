'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LoadingGlobe } from '../ui/loading-globe';

const OSWorkspace = dynamic(() => import('./os-workspace'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[hsl(var(--background))]">
      <LoadingGlobe size="md" />
    </div>
  ),
});

export function WorkspaceOverlay() {
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  // Intercept __memelliOpenModule via property descriptor so OSWorkspace
  // can still set its internal function without losing the overlay trigger.
  useEffect(() => {
    let internalFn: ((id: string, href?: string) => void) | undefined;

    const intercepted = (id: string, href?: string) => {
      show();
      setTimeout(() => { internalFn?.(id, href); }, 60);
    };

    try {
      Object.defineProperty(window, '__memelliOpenModule', {
        get: () => intercepted,
        set: (fn) => { internalFn = fn; },
        configurable: true,
        enumerable: true,
      });
    } catch { /* already defined non-configurable */ }

    (window as any).__memelliShowWorkspace = show;
    (window as any).__memelliHideWorkspace = hide;

    return () => {
      try {
        Object.defineProperty(window, '__memelliOpenModule', {
          value: internalFn,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch { /* ignore */ }
      delete (window as any).__memelliShowWorkspace;
      delete (window as any).__memelliHideWorkspace;
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[hsl(var(--background))]"
      style={{ animation: 'slideUpFadeIn 0.25s ease-out' }}
    >
      <style>{`
        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Top bar with Home button */}
      <div className="flex items-center gap-3 px-4 h-10 shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur">
        <button
          onClick={hide}
          className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-white transition-colors text-xs font-semibold tracking-widest uppercase"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Home
        </button>
        <span className="text-[hsl(var(--muted-foreground))] text-sm">|</span>
        <span className="text-[hsl(var(--muted-foreground))] text-[10px] tracking-widest uppercase">Memelli OS Workspace</span>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <OSWorkspace />
      </div>
    </div>
  );
}

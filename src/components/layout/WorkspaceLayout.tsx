'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWorkspacePanel } from '../../hooks/useWorkspacePanel';
import { SlidePanel } from '@memelli/ui';

interface WorkspaceLayoutProps {
  /** The data table / list content */
  children: React.ReactNode;
  /** Content to render inside the slide panel when a record is selected */
  panelContent?: React.ReactNode;
  /** Panel width: sm (384px), md (480px), lg (560px), xl (640px) */
  panelWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /** Panel header title */
  panelTitle?: string;
  /** Callback when a row / item is clicked — consumers can call openRecord inside */
  onRowClick?: (id: string, type: string, data?: any) => void;
}

export function WorkspaceLayout({
  children,
  panelContent,
  panelWidth = 'lg',
  panelTitle,
  onRowClick,
}: WorkspaceLayoutProps) {
  const {
    isOpen,
    closeRecord,
    selectedRecord,
    popNested,
    hasNested,
  } = useWorkspacePanel();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine whether the panel should be visible
  const showPanel = isOpen && !!panelContent;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left side: main list / table content ── */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          showPanel && isMobile ? 'hidden' : ''
        }`}
      >
        {children}
      </div>

      {/* ── Right side: slide panel for selected record ── */}
      {panelContent && (
        <>
          {isMobile ? (
            /* Mobile: full-screen overlay panel */
            showPanel && (
              <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(var(--card))]">
                {/* Mobile panel header */}
                <div className="flex shrink-0 items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
                  <div className="flex items-center gap-2">
                    {hasNested && (
                      <button
                        onClick={popNested}
                        className="rounded-md p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                        aria-label="Back"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                    )}
                    {panelTitle && (
                      <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                        {panelTitle}
                      </h2>
                    )}
                  </div>
                  <button
                    onClick={closeRecord}
                    className="rounded-md p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                    aria-label="Close"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {/* Mobile panel body */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedRecord && panelContent}
                </div>
              </div>
            )
          ) : (
            /* Desktop: inline SlidePanel from right, side-by-side with list */
            <SlidePanel
              open={showPanel}
              onClose={closeRecord}
              onBack={hasNested ? popNested : undefined}
              title={panelTitle}
              width={panelWidth}
            >
              {selectedRecord && panelContent}
            </SlidePanel>
          )}
        </>
      )}
    </div>
  );
}

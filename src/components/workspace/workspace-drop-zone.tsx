'use client';

/**
 * WorkspaceDropZone — Visual drop target for the workspace area.
 *
 * Accepts dragged items from the sidebar and opens them as workspace tabs
 * using their WorkspaceView component (shell-less). Shows a visual indicator
 * when dragging over.
 *
 * WORKSPACE MOUNTING LAW: On drop, opens the dragged module as a new tab
 * using its WorkspaceView — NEVER a full route page.
 */

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { resolveModule } from './workspace-views/module-registry';

interface WorkspaceDropZoneProps {
  /** Called when a valid module is dropped */
  onModuleDrop: (moduleId: string, href: string, label: string, icon: string) => void;
  children: React.ReactNode;
}

export function WorkspaceDropZone({ onModuleDrop, children }: WorkspaceDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidTarget, setIsValidTarget] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/memelli-module')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
      setIsValidTarget(true);
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/memelli-module')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false);
      setIsValidTarget(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsValidTarget(false);

    const data = e.dataTransfer.getData('application/memelli-module');
    if (!data) return;

    try {
      const { href, label, icon } = JSON.parse(data);
      const slug = href.replace('/dashboard/', '').split('/')[0];

      // Validate module has a registered WorkspaceView
      const entry = resolveModule(slug) || resolveModule(href);
      if (entry) {
        onModuleDrop(entry.id, entry.route, entry.title, entry.icon);
      } else {
        // Still open it — the WorkspaceView will show "not found" gracefully
        onModuleDrop(slug, href, label, icon);
      }
    } catch {
      /* ignore bad data */
    }
  }, [onModuleDrop]);

  return (
    <div
      className="relative flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator overlay */}
      {isDragOver && (
        <div
          className={`absolute inset-0 z-50 pointer-events-none transition-all duration-200 ${
            isValidTarget
              ? 'bg-red-500/[0.04] border-2 border-dashed border-red-500/30'
              : 'bg-[hsl(var(--muted-foreground))]/[0.02] border-2 border-dashed border-[hsl(var(--border))]'
          } rounded-xl m-2`}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div
              className={`flex items-center gap-3 rounded-2xl px-6 py-4 backdrop-blur-xl ${
                isValidTarget
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">
                {isValidTarget ? 'Drop to open module' : 'Invalid module'}
              </span>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

'use client';

/**
 * SidebarDraggable — Makes sidebar nav items draggable to the workspace.
 *
 * Uses native HTML5 drag/drop API (no external libs).
 * Data transfer includes module ID, href, label, and icon.
 * Visual feedback: item lifts with scale effect, ghost follows cursor.
 *
 * WORKSPACE MOUNTING LAW: Dragging opens WorkspaceView components,
 * NEVER full route pages.
 */

import { useState, useCallback, type ReactNode } from 'react';

interface SidebarDraggableProps {
  moduleId: string;
  href: string;
  label: string;
  icon: string;
  children: ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function SidebarDraggable({
  moduleId,
  href,
  label,
  icon,
  children,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
}: SidebarDraggableProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);

      // Set transfer data
      e.dataTransfer.setData(
        'application/memelli-module',
        JSON.stringify({ moduleId, href, label, icon })
      );
      e.dataTransfer.effectAllowed = 'copy';

      // Create a custom drag image
      const ghost = document.createElement('div');
      ghost.className =
        'fixed pointer-events-none bg-[hsl(var(--card))] border border-red-500/30 rounded-xl px-4 py-2 text-xs font-medium text-red-300 shadow-lg shadow-red-500/10 backdrop-blur-xl flex items-center gap-2';
      ghost.textContent = label;
      ghost.style.position = 'absolute';
      ghost.style.left = '-9999px';
      ghost.style.top = '-9999px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 20);

      // Clean up ghost after drag starts
      requestAnimationFrame(() => {
        document.body.removeChild(ghost);
      });

      onDragStartProp?.();
    },
    [moduleId, href, label, icon, onDragStartProp]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEndProp?.();
  }, [onDragEndProp]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`transition-all duration-200 ${
        isDragging
          ? 'opacity-50 scale-[0.97] ring-1 ring-red-500/20 rounded-xl'
          : ''
      }`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {children}
    </div>
  );
}

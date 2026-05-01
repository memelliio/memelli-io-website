"use client";

import { useState, useCallback, type ReactNode, type DragEvent } from "react";
import { cn } from "../lib/cn";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KanbanItem {
  id: string;
  [key: string]: any;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color?: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onDragEnd: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  renderCard: (item: KanbanItem) => ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KanbanBoard({
  columns,
  onDragEnd: onDragEndProp,
  renderCard,
  className,
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<{ item: KanbanItem; columnId: string } | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  /* ---- drag handlers ---- */

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, item: KanbanItem, columnId: string) => {
      setDraggedItem({ item, columnId });
      e.dataTransfer.effectAllowed = "move";
      // Firefox requires setData to fire drag events
      e.dataTransfer.setData("text/plain", item.id);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, columnId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverColumnId(columnId);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>, columnId: string) => {
      const related = e.relatedTarget as Node | null;
      const current = e.currentTarget as Node;
      if (!current.contains(related)) {
        setOverColumnId((prev) => (prev === columnId ? null : prev));
      }
    },
    [],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetColumnId: string) => {
      e.preventDefault();
      setOverColumnId(null);
      if (draggedItem && draggedItem.columnId !== targetColumnId) {
        onDragEndProp(draggedItem.item.id, draggedItem.columnId, targetColumnId);
      }
      setDraggedItem(null);
    },
    [draggedItem, onDragEndProp],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setOverColumnId(null);
  }, []);

  /* ---- render ---- */

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4",
        className,
      )}
    >
      {columns.map((column) => {
        const isOver = overColumnId === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={(e) => handleDragLeave(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={cn(
              "flex w-72 min-w-[18rem] flex-shrink-0 flex-col rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/[0.04] transition-all duration-200",
              isOver && "ring-2 ring-red-500/40 border-red-500/30",
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                {column.color && (
                  <span
                    className="h-2 w-2 rounded-full shadow-lg"
                    style={{ backgroundColor: column.color, boxShadow: `0 0 8px ${column.color}40` }}
                  />
                )}
                <span className="text-sm font-medium text-zinc-100 tracking-tight">
                  {column.title}
                </span>
              </div>
              <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-400 tabular-nums">
                {column.items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {column.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, column.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group cursor-grab rounded-xl bg-zinc-900/60 backdrop-blur-xl p-3 transition-all duration-200",
                    "border border-white/[0.04] hover:border-white/[0.08] shadow-lg shadow-black/10",
                    "active:cursor-grabbing active:scale-[0.98]",
                    draggedItem?.item.id === item.id && "opacity-40 ring-2 ring-red-500/50 scale-[0.97]",
                  )}
                >
                  <div className="flex gap-2">
                    {/* Drag grip dots */}
                    <div className="flex flex-col justify-center gap-[3px] opacity-0 group-hover:opacity-40 transition-opacity duration-200 shrink-0 pt-0.5">
                      <div className="flex gap-[3px]">
                        <div className="h-[3px] w-[3px] rounded-full bg-zinc-400" />
                        <div className="h-[3px] w-[3px] rounded-full bg-zinc-400" />
                      </div>
                      <div className="flex gap-[3px]">
                        <div className="h-[3px] w-[3px] rounded-full bg-zinc-400" />
                        <div className="h-[3px] w-[3px] rounded-full bg-zinc-400" />
                      </div>
                      <div className="flex gap-[3px]">
                        <div className="h-[3px] w-[3px] rounded-full bg-zinc-400" />
                        <div className="h-[3px] w-[3px] rounded-full bg-zinc-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {renderCard(item)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty column drop target */}
              {column.items.length === 0 && (
                <div
                  className={cn(
                    "flex h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.06] text-xs text-zinc-500 transition-all duration-200",
                    isOver && "border-red-500/40 text-red-400 bg-red-500/5",
                  )}
                >
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

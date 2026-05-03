"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Layout } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors duration-200"
      >
        <Layout className="h-3.5 w-3.5" />
        <span className="max-w-[120px] truncate">
          {activeWorkspace?.name ?? "Workspace"}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-zinc-800 bg-zinc-900 shadow-xl origin-top-left animate-[uniscreen-dropdown_200ms_ease-out_forwards]"
        >
          <div className="p-1">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-800 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {/* Accent dot for active workspace */}
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    )}
                    {ws.name}
                  </span>
                  <span className="ml-2 text-[10px] text-zinc-500">
                    {ws.tabs.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-800 p-1">
            <button
              onClick={() => {
                createWorkspace("New Workspace");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-all duration-150"
            >
              <Plus className="h-3.5 w-3.5" />
              New Workspace
            </button>
          </div>
        </div>
      )}

      {/* Dropdown animation keyframes */}
      <style jsx global>{`
        @keyframes uniscreen-dropdown {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

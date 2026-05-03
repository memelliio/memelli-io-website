"use client";

import { useRef, useState, useEffect } from "react";
import { X, Pin, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function TabBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [muaFlashId, setMuaFlashId] = useState<string | null>(null);

  const getActiveWorkspace = useWorkspaceStore((s) => s.getActiveWorkspace);
  const switchTab = useWorkspaceStore((s) => s.switchTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);
  const openTab = useWorkspaceStore((s) => s.openTab);

  const workspace = getActiveWorkspace();
  const tabs = workspace?.tabs ?? [];
  const activeTabId = workspace?.activeTabId ?? null;

  // Detect newly added MUA tabs and trigger highlight pulse
  const prevTabCountRef = useRef(tabs.length);
  useEffect(() => {
    if (tabs.length > prevTabCountRef.current) {
      // A tab was added — check if the newest one is from MUA
      const newest = tabs[tabs.length - 1];
      if (newest?.source === "mua") {
        setMuaFlashId(newest.id);
        const timer = setTimeout(() => setMuaFlashId(null), 1200);
        return () => clearTimeout(timer);
      }
    }
    prevTabCountRef.current = tabs.length;
  }, [tabs]);

  // Sort: pinned tabs first, then by creation order
  const sortedTabs = [...tabs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="flex h-10 items-center border-b border-zinc-800 bg-zinc-950">
      {/* Workspace switcher on the far left */}
      <WorkspaceSwitcher />

      {/* Divider */}
      <div className="h-5 w-px bg-zinc-800 flex-shrink-0" />

      {/* Scrollable tab area */}
      <div className="relative flex-1 min-w-0">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-zinc-950 to-transparent" />

        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto scrollbar-none"
        >
          {sortedTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isPinned = !!tab.pinned;
            const isMuaFlash = tab.id === muaFlashId;

            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  animation: isMuaFlash
                    ? "uniscreen-mua-pulse 1.2s ease-out"
                    : undefined,
                }}
                className={`group relative flex items-center gap-1.5 flex-shrink-0 border-r border-zinc-800/50 ${
                  isPinned ? "px-2.5" : "px-3"
                } py-2 text-sm transition-all duration-200 ease-out ${
                  isActive
                    ? "bg-zinc-800 text-white border-b-2 border-b-blue-500 shadow-[0_1px_4px_rgba(59,130,246,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900 hover:shadow-[0_1px_3px_rgba(255,255,255,0.04)]"
                }`}
              >
                {/* MUA source indicator dot */}
                {tab.source === "mua" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400/70 flex-shrink-0" />
                )}

                {/* Pin icon for pinned tabs */}
                {isPinned && (
                  <Pin className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                )}

                {/* Tab title */}
                <span className="truncate max-w-[140px]">{tab.title}</span>

                {/* Alert badge — with pulse animation */}
                {tab.alertBadge != null && tab.alertBadge > 0 && (
                  <span className="absolute -top-0.5 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
                    {tab.alertBadge > 99 ? "99+" : tab.alertBadge}
                  </span>
                )}

                {/* Close button (not for pinned tabs) */}
                {!isPinned && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-1 flex-shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all duration-150"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-zinc-950 to-transparent" />
      </div>

      {/* New tab button */}
      <button
        onClick={() =>
          openTab({
            type: "custom",
            title: "New Tab",
            route: "/dashboard",
          })
        }
        className="flex-shrink-0 p-2 text-zinc-500 hover:text-white hover:scale-110 transition-all duration-200"
        title="New Tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* MUA pulse keyframes — injected once */}
      <style jsx global>{`
        @keyframes uniscreen-mua-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          40% {
            box-shadow: 0 0 8px 3px rgba(59, 130, 246, 0.35);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useRef, useEffect, useState } from "react";
import { TabBar } from "./TabBar";
import { TabContent } from "./TabContent";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function UniScreen({ children }: { children: React.ReactNode }) {
  const getActiveTab = useWorkspaceStore((s) => s.getActiveTab);
  const activeTab = getActiveTab();
  const [visible, setVisible] = useState(true);
  const prevTabIdRef = useRef(activeTab?.id ?? null);

  // Crossfade on tab switch
  useEffect(() => {
    const currentId = activeTab?.id ?? null;
    if (currentId !== prevTabIdRef.current) {
      setVisible(false);
      // Brief opacity dip then fade in
      const timer = setTimeout(() => setVisible(true), 30);
      prevTabIdRef.current = currentId;
      return () => clearTimeout(timer);
    }
  }, [activeTab?.id]);

  return (
    <div className="flex flex-col h-full">
      <TabBar />
      <div
        className="flex-1 overflow-auto bg-zinc-950 transition-opacity duration-150 ease-out"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {activeTab ? children : <TabContent />}
      </div>
    </div>
  );
}

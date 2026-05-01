"use client";

import * as React from "react";
import { cn } from "../lib/cn";

// --- Context ---

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used inside <Tabs>");
  return ctx;
}

// --- Tabs root ---

export interface TabsProps {
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultTab = "", activeTab, onTabChange, children, className }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultTab);
  const controlled = activeTab !== undefined;
  const current = controlled ? activeTab : internal;

  const setActiveTab = React.useCallback(
    (id: string) => {
      if (!controlled) setInternal(id);
      onTabChange?.(id);
    },
    [controlled, onTabChange],
  );

  return (
    <TabsContext.Provider value={{ activeTab: current, setActiveTab }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// --- TabList ---

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl bg-zinc-900/40 backdrop-blur-xl p-1 border border-white/[0.04]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// --- Tab ---

export interface TabProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Tab({ id, children, className, disabled = false }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      id={`tab-${id}`}
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      className={cn(
        "relative shrink-0 px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-inset",
        "disabled:pointer-events-none disabled:opacity-40",
        isActive
          ? "bg-zinc-800/80 text-zinc-100 shadow-sm"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]",
        className,
      )}
    >
      {children}
    </button>
  );
}

// --- TabPanels ---

export interface TabPanelsProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={cn("mt-4", className)}>{children}</div>;
}

// --- TabPanel ---

export interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={cn("focus:outline-none", className)}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

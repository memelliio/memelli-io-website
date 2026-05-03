'use client';

import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

// Context
interface TabContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

function useTabContext() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('Tab components must be used within <Tabs>');
  return ctx;
}

// Tabs (root)
interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabContext.Provider>
  );
}

// TabList (container for Tab items)
interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn('flex border-b border-zinc-800', className)}
    >
      {children}
    </div>
  );
}

// Tab (individual tab button)
interface TabProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export function Tab({ id, label, icon, badge }: TabProps) {
  const { activeTab, setActiveTab } = useTabContext();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      onClick={() => setActiveTab(id)}
      className={cn(
        'relative flex items-center gap-1.5 px-4 py-3 md:py-2.5 text-sm font-medium transition-colors min-h-[44px] md:min-h-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50',
        isActive
          ? 'text-red-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-500'
          : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium',
            isActive
              ? 'bg-red-500/20 text-red-300'
              : 'bg-zinc-800 text-zinc-400'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// TabPanel
interface TabPanelProps {
  tabId: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ tabId, children, className }: TabPanelProps) {
  const { activeTab } = useTabContext();
  if (activeTab !== tabId) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={className}
    >
      {children}
    </div>
  );
}

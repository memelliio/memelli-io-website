'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, CreditCard, Building2, LineChart, Users, Briefcase,
  FileText, Workflow, BarChart3, Search, Bot, Shield,
  Terminal, Zap, Settings, Layout,
} from 'lucide-react';
import { OS_MODULES } from './os-workspace';

const ICON_MAP: Record<string, any> = {
  Rocket, CreditCard, Building2, LineChart, Users, Briefcase,
  FileText, Workflow, BarChart3, Search, Bot, Shield,
  ShoppingBag: Briefcase, GraduationCap: Users, Bell: Bot, Settings: Shield,
};

interface OSCommandMenuProps {
  onOpenModule: (moduleId: string) => void;
}

export function OSCommandMenu({ onOpenModule }: OSCommandMenuProps) {
  const [open, setOpen] = useState(false);

  // Cmd+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const runCommand = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-[hsl(var(--foreground))]/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Command palette */}
          <motion.div
            className="fixed top-[20%] left-1/2 z-[101] w-full max-w-lg -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <Command
              className="rounded-xl border border-[hsl(var(--border))]/80 bg-[hsl(var(--card))] shadow-2xl shadow-black/40 overflow-hidden"
              label="Memelli OS Command"
            >
              <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4">
                <Terminal className="h-4 w-4 text-primary shrink-0" />
                <Command.Input
                  placeholder="Command the OS... (/open, /launch, /show)"
                  className="flex-1 h-12 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No matching commands.
                </Command.Empty>

                {/* Module launchers */}
                <Command.Group heading="Open Module">
                  {OS_MODULES.map(mod => {
                    const Icon = ICON_MAP[mod.icon] || Zap;
                    return (
                      <Command.Item
                        key={mod.id}
                        value={`open launch ${mod.id} ${mod.title}`}
                        onSelect={() => runCommand(() => onOpenModule(mod.id))}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary/80"
                      >
                        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span>{mod.title}</span>
                        <span className="ml-auto text-[10px] font-mono text-[hsl(var(--muted-foreground))]">/open {mod.id}</span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>

              <div className="border-t border-[hsl(var(--border))] px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">Memelli OS v1.0</span>
                <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                  <kbd className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono">Esc</kbd>
                  <span>close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

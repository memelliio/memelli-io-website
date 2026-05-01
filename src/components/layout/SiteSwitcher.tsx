'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Building2,
  CreditCard,
  CheckCircle,
  Target,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  ArrowRightLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SiteDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  description: string;
  internal: boolean;
}

const sites: SiteDefinition[] = [
  {
    id: 'universe', // legacy id — display name is "Cockpit / Command Center", route group still (universe)/ — see CLAUDE.md
    name: 'Command Center (Cockpit)',
    icon: Globe,
    href: '/universe',
    description: 'Master command center',
    internal: true,
  },
  {
    id: 'dashboard',
    name: 'Memelli Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    description: 'Tenant workspace',
    internal: true,
  },
  {
    id: 'prequal',
    name: 'Prequal Hub',
    icon: CreditCard,
    href: 'https://prequalhub.com',
    description: 'Credit prequalification',
    internal: false,
  },
  {
    id: 'approval',
    name: 'Approval Standard',
    icon: CheckCircle,
    href: 'https://approvalstandard.com',
    description: 'Soft pull approvals',
    internal: false,
  },
  {
    id: 'leadpulse',
    name: 'LeadPulseLab',
    icon: Target,
    href: 'https://leadpulselab.com',
    description: 'Lead generation',
    internal: false,
  },
];

function getCurrentSite(pathname: string): SiteDefinition {
  if (pathname.startsWith('/universe')) return sites[0];
  if (pathname.startsWith('/dashboard')) return sites[1];
  return sites[0];
}

export function SiteSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const current = getCurrentSite(pathname);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
      >
        <CurrentIcon className="h-4 w-4 text-blue-400" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-72 origin-top-left animate-in fade-in zoom-in-95 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-2.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Switch Site
            </span>
          </div>

          {/* Site list */}
          <div className="p-1.5">
            {sites.map((site) => {
              const Icon = site.icon;
              const isCurrent = site.id === current.id;

              const content = (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    isCurrent
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 ${
                      isCurrent ? 'text-blue-400' : 'text-[hsl(var(--muted-foreground))]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{site.name}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-400">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                      {site.internal
                        ? site.description
                        : site.href.replace('https://', '')}
                    </p>
                  </div>
                  {!site.internal && (
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
              );

              if (site.internal) {
                return (
                  <Link
                    key={site.id}
                    href={site.href}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <a
                  key={site.id}
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {content}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SiteSwitcher;

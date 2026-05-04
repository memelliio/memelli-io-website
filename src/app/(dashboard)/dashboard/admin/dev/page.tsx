'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Beaker,
  Eye,
  Code2,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Palette,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

type PreviewSection = 'components' | 'cards' | 'badges' | 'status';

const PREVIEW_SECTIONS: { id: PreviewSection; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'components', label: 'Components', icon: Layers },
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'badges', label: 'Badges', icon: Palette },
  { id: 'status', label: 'Status', icon: Code2 },
];

export default function DevSandboxPage() {
  const [activeSection, setActiveSection] = useState<PreviewSection>('components');

  return (
    <div className="bg-card space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Beaker className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dev Sandbox</h1>
              <Badge variant="warning" className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-400 border-amber-500/20">
                DEV
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">Test and build safely</p>
          </div>
        </div>
        <Link
          href="/dashboard/admin/live"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card backdrop-blur-xl hover:bg-white/[0.04] text-muted-foreground hover:text-foreground border border-white/[0.04] hover:border-white/[0.08] text-xs transition-all duration-200"
        >
          <Eye className="h-3.5 w-3.5" />
          View Live Mirror
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Safety Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 backdrop-blur-xl px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">Development Mode</p>
          <p className="text-xs text-amber-500/70">
            Changes here don&apos;t affect production. Use this space to test components,
            preview layouts, and experiment freely.
          </p>
        </div>
      </div>

      {/* Component Preview Area */}
      <div>
        <h2 className="mb-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Component Preview
        </h2>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-card backdrop-blur-xl border border-white/[0.04] w-fit">
          {PREVIEW_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-primary/[0.08] text-primary/80 border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Preview Content */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl min-h-[300px]">
          <div className="p-6">
            {activeSection === 'components' && (
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed mb-4">UI component preview and testing area</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                    <div className="p-4 pb-2">
                      <p className="text-2xl font-semibold tracking-tight text-foreground">Sample Card</p>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="text-muted-foreground leading-relaxed">
                        This is a preview card component using the glass theme.
                      </p>
                    </div>
                  </div>
                  <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                    <div className="p-4 pb-2">
                      <p className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        Agent Card
                      </p>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-muted-foreground leading-relaxed">Active agent simulation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'cards' && (
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed mb-4">Card layout variations</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {['primary', 'green', 'blue'].map((color) => (
                    <div
                      key={color}
                      className={`rounded-2xl border bg-card backdrop-blur-xl p-5 ${
                        color === 'primary'
                          ? 'border-primary/15'
                          : color === 'green'
                          ? 'border-emerald-500/15'
                          : 'border-blue-500/15'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            color === 'primary'
                              ? 'bg-primary'
                              : color === 'green'
                              ? 'bg-emerald-400'
                              : 'bg-blue-400'
                          }`}
                        />
                        <span className="text-2xl font-semibold tracking-tight text-foreground capitalize">{color} Accent</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">Themed card with {color} border accent</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'badges' && (
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed mb-4">Badge and status indicator variants</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="muted">Muted</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Success
                  </Badge>
                  <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                    Warning
                  </Badge>
                  <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Info
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-muted-foreground leading-relaxed">Healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-muted-foreground leading-relaxed">Warning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-muted-foreground leading-relaxed">Live pulse</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-muted-foreground leading-relaxed">Error pulse</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'status' && (
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed mb-4">System status display components</p>
                <div className="bg-card backdrop-blur-2xl rounded-xl border border-white/[0.06] p-4 font-mono text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="text-muted-foreground">env:</span>{' '}
                    <span className="text-amber-400">development</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">api:</span>{' '}
                    <span className="text-emerald-400">connected</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">mode:</span>{' '}
                    <span className="text-amber-400">sandbox</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">production_safe:</span>{' '}
                    <span className="text-emerald-400">true</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Link
            href="/dashboard/admin/live"
            className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 hover:border-white/[0.08] transition-all duration-200"
          >
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">Live Mirror</p>
              <p className="text-muted-foreground leading-relaxed">Read-only production view</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 hover:border-white/[0.08] transition-all duration-200"
          >
            <LayoutGrid className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">Admin Home</p>
              <p className="text-muted-foreground leading-relaxed">Back to control center</p>
            </div>
          </Link>
          <Link
            href="/dashboard/ai"
            className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 hover:border-white/[0.08] transition-all duration-200"
          >
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">AI Console</p>
              <p className="text-muted-foreground leading-relaxed">Interact with MUA</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

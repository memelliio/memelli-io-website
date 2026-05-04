'use client';

import { Sparkles } from 'lucide-react';
import AgentChat from '../../../../../components/ai/AgentChat';
import { Card, CardContent, CardHeader, CardTitle } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Quick commands                                                     */
/* ------------------------------------------------------------------ */

const QUICK_COMMANDS = [
  'Pull my credit',
  "What's my score?",
  'Upload a document',
  'Show my reports',
  'Explain my decision',
  'How can I improve?',
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreditAiAgentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Credit AI Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Ask questions about your credit, pull reports, and get recommendations
        </p>
      </div>

      {/* Chat card */}
      <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Credit Assistant
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your AI-powered credit analysis assistant
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {/* Quick command pills */}
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('ai_pending_prompt', cmd);
                  }
                  window.dispatchEvent(
                    new CustomEvent('ai-quick-command', { detail: cmd })
                  );
                }}
                className="rounded-full border border-border bg-muted backdrop-blur-xl px-3 py-1 text-xs text-muted-foreground transition-all duration-200 hover:border-primary/20 hover:bg-primary/[0.06] hover:text-primary"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Agent chat targeting credit agents */}
          <AgentChat agentSlug="credit" compact={false} />
        </CardContent>
      </Card>
    </div>
  );
}

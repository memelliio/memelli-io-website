'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import AgentChat from '../../../components/ai/AgentChat';
import { Card, CardContent, CardHeader, CardTitle } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Greeting helper                                                    */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning! How can I help you today?';
  if (h < 17) return 'Good afternoon! What can I do for you?';
  return 'Good evening! Need anything before you wrap up?';
}

/* ------------------------------------------------------------------ */
/*  Quick commands                                                     */
/* ------------------------------------------------------------------ */

const QUICK_COMMANDS = [
  "What's new today?",
  'Show my tasks',
  'Create a contact',
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AiWidget() {
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <Sparkles className="h-4 w-4 text-red-400" />
          AI Assistant
        </CardTitle>
        <p className="text-xs text-zinc-500">{greeting}</p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Quick command pills */}
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                // Stash the prompt so AgentChat picks it up on mount
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('ai_pending_prompt', cmd);
                }
                // Force AgentChat to re-mount by dispatching a custom event
                window.dispatchEvent(new CustomEvent('ai-quick-command', { detail: cmd }));
              }}
              className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-red-700 hover:bg-red-950 hover:text-red-300"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Compact chat */}
        <AgentChat agentSlug="receptionist" compact />
      </CardContent>
    </Card>
  );
}

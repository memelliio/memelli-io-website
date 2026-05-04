'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sparkles,
  Send,
  User,
  Bot,
  RotateCcw,
  Copy
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  leads?: AgentLead[];
}

interface AgentLead {
  id: string;
  name: string;
  score: number;
  source: string;
  email?: string;
  city?: string;
}

interface AgentResponse {
  success: boolean;
  data: {
    message: string;
    leads?: AgentLead[];
  };
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-primary';
}

const SUGGESTIONS = [
  'Find credit repair leads in Atlanta',
  'Show me hot leads with score above 80',
  'What are the top converting lead sources?',
  'Find Instagram leads from this week',
  'Which leads should I contact first?',
  'Summarize my pipeline performance',
];

export default function AiAgentPage() {
  const api = useApi();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I\'m your Lead AI Agent. I can help you find leads, analyze your pipeline, and suggest outreach strategies. What would you like to do?',
      timestamp: new Date()
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await api.post<AgentResponse>('/api/leads/ai-agent', {
        message: prompt,
        history: messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }))
      });
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data: any) => {
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        leads: data.leads
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: (err) => {
      toast.error(err.message || 'Agent failed to respond');
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        },
      ]);
    }
  });

  const handleSend = (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    chatMutation.mutate(prompt);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Hi! I\'m your Lead AI Agent. I can help you find leads, analyze your pipeline, and suggest outreach strategies. What would you like to do?',
        timestamp: new Date()
      },
    ]);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      <PageHeader
        title="Lead AI Agent"
        subtitle="Conversational AI for lead discovery and analysis"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'AI Agent' },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={handleReset}
          >
            Reset
          </Button>
        }
        className="mb-4 shrink-0"
      />

      {/* Chat Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4 mb-4 shadow-lg shadow-black/10"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/80/15 border border-primary/20 backdrop-blur-xl">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary/90 backdrop-blur-xl text-white shadow-lg shadow-red-500/10'
                  : 'bg-white/[0.04] backdrop-blur-xl text-foreground border border-white/[0.04]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Lead Results */}
              {msg.leads && msg.leads.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Found {msg.leads.length} lead{msg.leads.length !== 1 ? 's' : ''}:
                  </p>
                  {msg.leads.map((lead) => (
                    <a
                      key={lead.id}
                      href={`/dashboard/leads/${lead.id}`}
                      className="block rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-3 hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium tracking-tight text-foreground">{lead.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="default" className="capitalize">{lead.source}</Badge>
                            {lead.city && (
                              <span className="text-xs text-muted-foreground">{lead.city}</span>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${scoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Copy button for assistant messages */}
              {msg.role === 'assistant' && msg.id !== 'welcome' && (
                <button
                  onClick={() => handleCopy(msg.content)}
                  className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              )}

              <p className="text-[10px] text-muted-foreground mt-1.5">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl">
                <User className="h-4 w-4 text-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {chatMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/80/15 border border-primary/20 backdrop-blur-xl">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl px-4 py-3 border border-white/[0.04]">
              <LoadingGlobe size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions (show when only welcome message) */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/80/5 transition-all duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-3 shadow-lg shadow-black/10">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask about leads, pipeline, sources, scoring..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={chatMutation.isPending}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Send className="h-3.5 w-3.5" />}
          onClick={() => handleSend()}
          isLoading={chatMutation.isPending}
          disabled={!input.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

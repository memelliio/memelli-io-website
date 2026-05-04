'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Sparkles, Search, MessageSquare,
  TrendingUp, FileText
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  results?: ForumResult[];
  timestamp: number;
}

interface ForumResult {
  id: string;
  title: string;
  source: string;
  url?: string;
  engagement?: number;
  relevance?: number;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const QUICK_PROMPTS = [
  { label: 'Find trending credit repair questions', icon: TrendingUp, prompt: 'Find trending credit repair questions being asked on forums right now' },
  { label: 'Generate threads for a cluster', icon: FileText, prompt: 'Generate forum thread ideas for my top keyword cluster' },
  { label: 'Analyze competitor forum activity', icon: Search, prompt: 'Analyze what competitors are discussing in credit repair forums' },
  { label: 'Find unanswered questions', icon: MessageSquare, prompt: 'Find unanswered credit repair questions I can create content for' },
];

export default function SEOAIAgentPage() {
  const api = useApi();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = { id: genId(), role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.post<{
        responseText: string;
        suggestions?: string[];
        results?: ForumResult[];
      }>('/api/ai/command', {
        inputText: text,
        engine: 'seo',
        context: 'forum_agent'
      });

      const assistantMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: res.data?.responseText ?? 'No response.',
        suggestions: res.data?.suggestions,
        results: res.data?.results,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error('Failed to get AI response');
      setMessages((prev) => [
        ...prev,
        { id: genId(), role: 'assistant', content: 'Sorry, something went wrong.', timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-3rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={() => router.push('/dashboard/seo')}
          className="rounded-xl p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/80/15 border border-primary/20 backdrop-blur-xl">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Forum AI Agent</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">Find trending topics and generate forum content</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/80/15 border border-primary/20 backdrop-blur-xl">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-lg tracking-tight">Forum Research AI</p>
              <p className="text-muted-foreground leading-relaxed text-sm mt-1">
                Find trending questions, analyze forums, and generate thread ideas
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg w-full">
              {QUICK_PROMPTS.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-3 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-3 text-left hover:border-primary/30 hover:bg-primary/80/[0.06] transition-all duration-200"
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground">{qp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-card backdrop-blur-xl border border-white/[0.04] text-foreground rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[10px] text-muted-foreground mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>

            {/* Forum results */}
            {msg.results && msg.results.length > 0 && (
              <div className="mt-3 space-y-2 ml-0 mr-8">
                {msg.results.map((result) => (
                  <Card key={result.id} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium tracking-tight text-foreground line-clamp-1">{result.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="muted" className="text-[10px]">{result.source}</Badge>
                            {result.engagement !== undefined && (
                              <span className="text-[10px] text-muted-foreground">{result.engagement} engagements</span>
                            )}
                          </div>
                        </div>
                        {result.relevance !== undefined && (
                          <span className={`text-xs font-medium shrink-0 ${
                            result.relevance >= 80 ? 'text-green-400' :
                            result.relevance >= 50 ? 'text-yellow-400' : 'text-muted-foreground'
                          }`}>
                            {result.relevance}% match
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Follow-up suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-0">
                {msg.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(sug)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-card backdrop-blur-xl border border-white/[0.04] text-muted-foreground hover:border-primary/40 hover:text-primary/80 hover:bg-primary/[0.08] transition-all duration-200"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-2 items-center text-xs text-muted-foreground">
                <LoadingGlobe size="sm" />
                Researching forums...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts bar (when has messages) */}
      {messages.length > 0 && !input && (
        <div className="flex flex-wrap gap-1.5 mb-2 shrink-0">
          {QUICK_PROMPTS.slice(0, 3).map((qp) => (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.prompt)}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-card backdrop-blur-xl border border-white/[0.04] text-muted-foreground hover:border-primary/40 hover:text-primary/80 hover:bg-primary/[0.08] transition-all duration-200"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/[0.04] pt-4 shrink-0">
        <div className="flex items-end gap-2 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-3 focus-within:border-primary/40 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about forum trends, topics, or generate content ideas..."
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder-muted-foreground focus:outline-none min-h-[24px] max-h-[120px] leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

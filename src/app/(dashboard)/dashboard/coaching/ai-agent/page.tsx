'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bot, Send, User, Sparkles, GraduationCap } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: { type: string; label: string; href: string };
}

const QUICK_PROMPTS = [
  'Create a credit repair coaching program',
  'Build a funding readiness course with quizzes',
  'Design a business building program for beginners',
  'Help me outline a 4-week coaching curriculum',
  'What modules should a credit repair program have?',
];

export default function CoachingAIAgentPage() {
  const api = useApi();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to the Coaching AI Agent! I can help you create and plan coaching programs. Try asking me to:\n\n- Create a credit repair program\n- Build a funding readiness course\n- Design a custom coaching curriculum\n\nWhat would you like to build today?',
    },
  ]);
  const [input, setInput] = useState('');

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // For now, use a smart local response since the AI coaching endpoint is per-enrollment
      // In production, this would call a dedicated program-builder AI endpoint
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('create') && (lowerMsg.includes('program') || lowerMsg.includes('course'))) {
        let template = '';
        if (lowerMsg.includes('credit')) template = 'credit-repair';
        else if (lowerMsg.includes('funding')) template = 'funding';
        else if (lowerMsg.includes('business')) template = 'business';

        if (template) {
          // Actually create the program
          const title =
            template === 'credit-repair'
              ? 'Credit Repair Mastery'
              : template === 'funding'
              ? 'Funding Readiness Program'
              : 'Business Building Blueprint';
          const slug = title.toLowerCase().replace(/\s+/g, '-');
          const res = await api.post<any>('/api/coaching/programs', {
            title,
            slug,
            description: `AI-generated ${template.replace('-', ' ')} coaching program`,
            template,
            isPublic: false,
          });
          if (res.error) throw new Error(res.error);
          const program = res.data?.data ?? res.data;
          return {
            content: `I've created your "${title}" program with pre-built modules and lessons! The program includes:\n\n${
              template === 'credit-repair'
                ? '1. Understanding Your Credit (3 lessons)\n2. Dispute Strategy (3 lessons)\n3. Building Positive Credit (2 lessons)'
                : template === 'funding'
                ? '1. Funding Readiness (2 lessons)\n2. Application Strategy (2 lessons)'
                : '1. Business Foundation (2 lessons)\n2. Revenue Generation (2 lessons)'
            }\n\nYou can now customize the content in the program builder.`,
            action: {
              type: 'navigate',
              label: 'Open Program Builder',
              href: `/dashboard/coaching/programs/${program.id}/builder`,
            },
          };
        }

        return {
          content:
            'I can create programs from these templates:\n\n- **Credit Repair** - Credit scores, disputes, rebuilding\n- **Funding Readiness** - Lending evaluation, application strategy\n- **Business Building** - Business structure, revenue generation\n\nWhich template would you like, or should I create a custom program? Just say something like "Create a credit repair program".',
        };
      }

      if (lowerMsg.includes('module') || lowerMsg.includes('outline') || lowerMsg.includes('curriculum')) {
        return {
          content:
            'Here is a recommended curriculum structure:\n\n**Module 1: Foundation** (3-4 lessons)\n- Introduction and overview (Video)\n- Core concepts (Text)\n- Self-assessment (Quiz)\n\n**Module 2: Core Skills** (4-5 lessons)\n- Deep dive lessons (Video + Text)\n- Practice exercises (Assignment)\n- Knowledge check (Quiz)\n\n**Module 3: Advanced Application** (3-4 lessons)\n- Real-world scenarios (Video)\n- Case studies (Document)\n- Final project (Assignment)\n\n**Module 4: Certification** (2 lessons)\n- Comprehensive review (Text)\n- Final exam (Quiz)\n\nWould you like me to create this as a program? Just tell me the topic!',
        };
      }

      return {
        content:
          'I can help you with:\n\n1. **Creating programs** - "Create a [topic] program"\n2. **Planning curricula** - "What modules should a [topic] program have?"\n3. **Building from templates** - Credit repair, funding, or business building\n\nTell me what you would like to build!',
      };
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', ...data }]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    chatMutation.mutate(msg);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.04] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-xl">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg tracking-tight font-semibold text-foreground">Coaching AI Agent</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">Build programs conversationally</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <div
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-xl">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary hover:bg-primary rounded-xl shadow-sm text-white backdrop-blur-xl transition-all duration-200'
                      : 'border border-white/[0.04] bg-card text-muted-foreground leading-relaxed backdrop-blur-xl'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] backdrop-blur-xl">
                    <User className="h-4 w-4 text-white/50" />
                  </div>
                )}
              </div>
              {msg.action && (
                <div className="ml-11 mt-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(msg.action!.href)}
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> {msg.action.label}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] px-4 py-3 backdrop-blur-xl">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/20" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/20" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/20" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="shrink-0 px-6 pb-2">
          <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-white/[0.06] bg-card backdrop-blur-xl px-3.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary/80"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.04] px-6 py-4">
        <div className="mx-auto flex max-w-2xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Tell me what program you'd like to build..."
            className="flex-1 rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            disabled={chatMutation.isPending}
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || chatMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

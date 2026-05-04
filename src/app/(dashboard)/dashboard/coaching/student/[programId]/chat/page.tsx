'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { useApi } from '../../../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../../../components/ui/card';
import { Button } from '../../../../../../../components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnrollmentBasic {
  id: string;
  progressPct?: number;
  program: { id: string; name: string };
}

export default function AICoachChatPage() {
  const { programId } = useParams<{ programId: string }>();
  const api = useApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const { data: enrollment } = useQuery({
    queryKey: ['coaching', 'enrollments', 'program', programId, 'basic'],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/enrollments?programId=${programId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list[0] as EnrollmentBasic | undefined;
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!enrollment) throw new Error('No enrollment found');
      const res = await api.post<any>('/api/coaching/ai/ai-chat', {
        enrollmentId: enrollment.id,
        message,
        context: {
          programName: enrollment.program?.name,
          progressPct: enrollment.progressPct ?? 0,
        },
      });
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as { response: string };
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date() },
      ]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (enrollment && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Welcome to your AI coaching session for "${enrollment.program?.name}"! I'm here to help you understand the material, answer questions, and keep you on track. What would you like to discuss?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [enrollment]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    chatMutation.mutate(text);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.04] bg-card px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/coaching/student/${programId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">AI Coach</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {enrollment?.program?.name ?? 'Loading...'} — {enrollment?.progressPct ?? 0}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary hover:bg-primary text-white'
                    : 'border border-white/[0.04] bg-card text-muted-foreground'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <p className="mt-1 text-xs opacity-40">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                  <User className="h-4 w-4 text-white/60" />
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-card px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/30" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/30" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-white/30" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.04] bg-card px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your AI coach anything..."
            className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground placeholder:text-white/20 backdrop-blur-xl focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            disabled={chatMutation.isPending}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || chatMutation.isPending} className="bg-primary hover:bg-primary rounded-xl transition-all duration-200">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

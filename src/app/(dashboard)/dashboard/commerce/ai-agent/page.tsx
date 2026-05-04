'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Textarea,
  Card,
  CardContent,
  Skeleton,
  Badge,
} from '@memelli/ui';
import { Sparkles, Send, ShoppingBag, Package, Truck, BarChart2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatResponse {
  data?: {
    responseText?: string;
  };
}

const SUGGESTED_COMMANDS = [
  { label: 'Create a store', prompt: 'Help me create a new store', icon: ShoppingBag },
  { label: 'Add a product', prompt: 'Help me add a new product to my store', icon: Package },
  { label: 'Show sales report', prompt: 'Give me a full sales report across all my stores', icon: BarChart2 },
  { label: "Show today's orders", prompt: "Show me today's orders across all stores", icon: Truck },
  { label: 'Top selling products', prompt: 'What are my top selling products this month?', icon: BarChart2 },
  { label: 'Create a coupon', prompt: 'Help me create a discount coupon for my store', icon: ShoppingBag },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CommerceAIAgentPage() {
  const { post } = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const result = await post<ChatResponse>('/api/ai/chat', {
        message,
        engine: 'commerce',
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      const responseText = data?.data?.responseText ?? 'No response.';
      const assistantMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: () => {
      const errMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || chatMutation.isPending) return;
    setInput('');

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    chatMutation.mutate(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="bg-card flex flex-col h-[calc(100dvh-3.5rem-3rem)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-6 pb-2">
        <PageHeader
          title="Commerce AI Agent"
          subtitle="Manage your stores, products, and orders with AI"
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'AI Agent' },
          ]}
          actions={
            <Badge variant="success" className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-xl">Online</Badge>
          }
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-8 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-white/[0.04] backdrop-blur-xl">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Commerce AI Assistant
              </h1>
              <p className="text-muted-foreground leading-relaxed text-sm mt-2">
                Ask me to create stores, add products, check orders, or analyze sales
              </p>
            </div>

            {/* Suggested commands */}
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
              {SUGGESTED_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Card
                    key={cmd.label}
                    className="cursor-pointer bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group"
                    onClick={() => sendMessage(cmd.prompt)}
                  >
                    <CardContent className="flex items-center gap-3 p-5">
                      <div className="rounded-xl bg-muted p-2 group-hover:bg-primary/10 transition-all duration-200">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-200" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-primary/80 transition-all duration-200">
                        {cmd.label}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
              <div
                className={`rounded-2xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md shadow-lg shadow-purple-500/10'
                    : 'bg-card backdrop-blur-xl border border-white/[0.04] text-foreground rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
              <p className={`text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] mr-8">
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <Skeleton variant="line" width="75%" />
                  <Skeleton variant="line" width="50%" />
                  <Skeleton variant="line" width="60%" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips when conversation is active */}
      {messages.length > 0 && !input && (
        <div className="flex flex-wrap gap-2 px-8 mb-4 shrink-0">
          {SUGGESTED_COMMANDS.slice(0, 4).map((cmd) => (
            <Button
              key={cmd.label}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(cmd.prompt)}
              className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-xs text-muted-foreground hover:text-primary/80 hover:bg-primary/80/[0.08] hover:border-primary/50 transition-all duration-200"
            >
              {cmd.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/[0.04] px-8 pt-6 pb-6 shrink-0 bg-card backdrop-blur-xl">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your commerce..."
              rows={1}
              autoResize
              maxRows={5}
              size="md"
              className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-foreground transition-all duration-200"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => sendMessage()}
            disabled={chatMutation.isPending || !input.trim()}
            isLoading={chatMutation.isPending}
            leftIcon={<Send className="h-4 w-4" />}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl shrink-0 shadow-lg shadow-purple-500/20 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          >
            Send
          </Button>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-3 text-center">
          Enter to send / Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
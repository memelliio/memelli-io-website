'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Phone, MessageSquare, Ticket,
  Bot, User, Zap, ChevronRight,
} from 'lucide-react';
import { Button, Badge } from '@memelli/ui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: ActionChip[];
}

interface ActionChip {
  label: string;
  type: string;
  payload?: Record<string, string>;
}

const SUGGESTED_PROMPTS = [
  { label: 'Call this contact', icon: <Phone className="h-3.5 w-3.5" />, prompt: 'Call the contact Sarah Chen at +1 (555) 123-4567' },
  { label: 'Send SMS to John', icon: <MessageSquare className="h-3.5 w-3.5" />, prompt: 'Send an SMS to John saying "Your appointment is confirmed for tomorrow at 2 PM"' },
  { label: 'Check ticket status', icon: <Ticket className="h-3.5 w-3.5" />, prompt: 'What is the current status of ticket TK-004?' },
  { label: 'Queue summary', icon: <Zap className="h-3.5 w-3.5" />, prompt: 'Give me a summary of all current queue wait times' },
  { label: 'Agent availability', icon: <User className="h-3.5 w-3.5" />, prompt: 'Which agents are currently available to take calls?' },
];

const MOCK_RESPONSES: Record<string, { content: string; actions?: ActionChip[] }> = {
  call: {
    content: 'I\'ll initiate a call to Sarah Chen at +1 (555) 123-4567. The call will be placed through your primary phone line.\n\nWould you like me to proceed?',
    actions: [
      { label: 'Place Call', type: 'call', payload: { number: '+15551234567' } },
      { label: 'Cancel', type: 'cancel' },
    ],
  },
  sms: {
    content: 'I\'ll send the following SMS to John:\n\n"Your appointment is confirmed for tomorrow at 2 PM"\n\nRecipient: John Wilson (+1 555-987-6543)\nFrom: Your business line',
    actions: [
      { label: 'Send SMS', type: 'sms', payload: { to: '+15559876543' } },
      { label: 'Edit Message', type: 'edit' },
    ],
  },
  ticket: {
    content: 'Ticket TK-004: Integration with Zapier not working\n\nStatus: Open\nPriority: Urgent\nAssignee: Alex Rivera\nCustomer: James Wilson\nSLA: 30 minutes remaining\n\nLatest comment from customer: "This is urgent - it\'s affecting our entire team."\n\nThis ticket requires immediate attention due to the SLA deadline.',
    actions: [
      { label: 'View Ticket', type: 'navigate', payload: { path: '/dashboard/communications/tickets' } },
      { label: 'Assign to me', type: 'assign' },
    ],
  },
  queue: {
    content: 'Current Queue Status:\n\nGeneral Support (Phone): 3 waiting, avg wait 2m\nLive Chat: 5 waiting, avg wait 45s\nTechnical Support: 1 waiting, avg wait 3m\nBilling: 0 waiting\n\nOverall: 9 customers waiting across 4 queues. Live Chat has the highest volume. Technical Support has the longest wait time.',
    actions: [
      { label: 'View Queues', type: 'navigate', payload: { path: '/dashboard/communications/queues' } },
    ],
  },
  agent: {
    content: 'Currently available agents:\n\n1. Alex Rivera - Available (2 active chats)\n2. Sam Patel - Available (no active sessions)\n\nOn Break:\n- Casey Morgan (15m)\n\nBusy:\n- Jordan Lee (1 call, 1 chat)\n\nSam Patel has the best availability right now with no active sessions and the highest CSAT score (4.9).',
    actions: [
      { label: 'View Agents', type: 'navigate', payload: { path: '/dashboard/communications/agents' } },
    ],
  },
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getResponse(input: string): { content: string; actions?: ActionChip[] } {
  const lower = input.toLowerCase();
  if (lower.includes('call')) return MOCK_RESPONSES.call;
  if (lower.includes('sms') || lower.includes('send')) return MOCK_RESPONSES.sms;
  if (lower.includes('ticket') || lower.includes('status')) return MOCK_RESPONSES.ticket;
  if (lower.includes('queue') || lower.includes('wait')) return MOCK_RESPONSES.queue;
  if (lower.includes('agent') || lower.includes('available')) return MOCK_RESPONSES.agent;
  return {
    content: 'I can help you with communications tasks. Try asking me to:\n\n- Call or SMS a contact\n- Check ticket status\n- View queue summaries\n- Check agent availability\n\nWhat would you like to do?',
  };
}

export default function CommsAiAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    const response = getResponse(text);
    const assistantMsg: Message = {
      id: genId(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      actions: response.actions,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleActionClick(action: ActionChip) {
    if (action.type === 'navigate' && action.payload?.path) {
      window.location.href = action.payload.path;
    } else {
      // Simulate executing the action
      const confirmMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: `Action "${action.label}" executed successfully.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg tracking-tight font-semibold text-foreground">Communications AI Agent</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">Call, message, check tickets - just ask</p>
        </div>
        <Badge variant="primary" className="ml-auto">AI Powered</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="tracking-tight font-semibold text-foreground text-lg">Communications AI Agent</p>
              <p className="text-muted-foreground leading-relaxed text-sm mt-1">Make calls, send messages, and manage tickets with natural language</p>
            </div>
            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSend(prompt.prompt)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-card border border-white/[0.04] text-muted-foreground hover:bg-white/[0.04] transition-all duration-200 backdrop-blur-xl"
                >
                  {prompt.icon}
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
              {/* Author indicator */}
              <div className={`flex items-center gap-1.5 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <Bot className="h-3 w-3 text-primary" />}
                <span className="text-[10px] text-white/30">{msg.role === 'user' ? 'You' : 'AI Agent'}</span>
                <span className="text-[10px] text-white/20">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Message bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-card backdrop-blur-xl border border-white/[0.04] text-muted-foreground leading-relaxed rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Action chips */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(action)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        action.type === 'cancel'
                          ? 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:border-white/[0.12] hover:text-white/60'
                          : 'border-primary/30 bg-primary/10 text-primary/80 hover:bg-primary/20'
                      }`}
                    >
                      {action.type === 'call' && <Phone className="h-3 w-3" />}
                      {action.type === 'sms' && <MessageSquare className="h-3 w-3" />}
                      {action.type === 'navigate' && <ChevronRight className="h-3 w-3" />}
                      {action.type === 'assign' && <User className="h-3 w-3" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips when conversation active */}
      {messages.length > 0 && !input && (
        <div className="flex flex-wrap gap-1.5 mb-2 shrink-0">
          {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleSend(prompt.prompt)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-white/[0.04] text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
            >
              {prompt.icon}
              {prompt.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/[0.04] pt-4 shrink-0">
        <div className="flex items-end gap-2 bg-card border border-white/[0.04] rounded-2xl p-3 focus-within:border-primary/30 transition-all duration-200 backdrop-blur-xl">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Call this contact, send SMS, check tickets..."
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm text-white/90 placeholder-white/30 focus:outline-none min-h-[24px] max-h-[120px] leading-relaxed"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
        <p className="text-xs text-white/20 mt-1.5 text-center">
          Enter to send - Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

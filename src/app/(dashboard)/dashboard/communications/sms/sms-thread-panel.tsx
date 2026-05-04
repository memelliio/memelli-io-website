'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Phone, MessageSquare } from 'lucide-react';
import {
  Avatar,
  Button,
  Skeleton,
  Textarea,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';

interface SmsMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'sent' | 'delivered' | 'failed' | 'received';
  createdAt: string;
}

interface ThreadResponse {
  threadId: string;
  contactName: string;
  contactPhone: string;
  messages: SmsMessage[];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function SmsThreadPanel() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedRecord } = useWorkspacePanel();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadId = selectedRecord?.id;
  const threadData = selectedRecord?.data as { contactName?: string; contactPhone?: string } | undefined;

  const { data, isLoading } = useQuery<ThreadResponse>({
    queryKey: ['sms-thread', threadId],
    queryFn: async () => {
      const res = await api.get<ThreadResponse>(`/api/comms/sms/${threadId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!threadId,
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await api.post('/api/comms/sms/send', {
        threadId,
        body,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['sms-thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['sms-threads'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const messages = data?.messages ?? [];
  const contactName = data?.contactName ?? threadData?.contactName ?? 'Unknown';
  const contactPhone = data?.contactPhone ?? threadData?.contactPhone ?? '';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!threadId) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-3 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-12 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3 ml-auto'} rounded-2xl`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -mx-6 -my-4">
      {/* Contact header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-3 shrink-0">
        <Avatar name={contactName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{contactName}</p>
          <p className="text-xs text-zinc-500 font-mono">{contactPhone}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Phone className="h-3.5 w-3.5" />}
          onClick={() => toast.info('Call feature coming soon')}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <MessageSquare className="h-8 w-8 mb-3 text-zinc-600" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-zinc-600 mt-1">Send the first message below</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.direction === 'outbound';
            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isSent
                      ? 'bg-red-600 text-white rounded-br-md'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isSent ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span
                      className={`text-[10px] ${
                        isSent ? 'text-red-200' : 'text-zinc-500'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                    {isSent && msg.status === 'failed' && (
                      <span className="text-[10px] text-red-300 ml-1">Failed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose area */}
      <div className="border-t border-zinc-800 px-6 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="resize-none min-h-[40px] max-h-[120px]"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

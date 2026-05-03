'use client';

import { memo } from 'react';
import { CheckCircle, XCircle, Zap } from 'lucide-react';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface ChatAction {
  id: string; type: string; label: string;
  status: 'pending' | 'executing' | 'done' | 'failed' | 'completed'; result?: string;
}

interface MUAMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  actions?: ChatAction[];
  attachments?: { type: 'file' | 'screenshot'; name: string }[];
  isLatest?: boolean;
}

function formatTime(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ActionList({ actions }: { actions: ChatAction[] }) {
  return (
    <div className="mt-3 space-y-2">
      {actions.map((a, idx) => (
        <div key={a.id || idx} className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] transition-all duration-200 ${
          (a.status === 'done' || a.status === 'completed') ? 'bg-emerald-500/8 text-emerald-300' :
          a.status === 'executing' ? 'bg-red-500/8 text-red-300' :
          a.status === 'failed' ? 'bg-red-500/10 text-red-400' :
          'bg-white/[0.04] text-zinc-400'
        }`}>
          {a.status === 'executing' ? <LoadingGlobe size="sm" /> :
           (a.status === 'done' || a.status === 'completed') ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> :
           a.status === 'failed' ? <XCircle className="h-3.5 w-3.5 shrink-0" /> :
           <Zap className="h-3.5 w-3.5 shrink-0" />}
          <span className="font-medium">{a.label || a.type || 'Action'}</span>
          {a.result && <span className="ml-auto text-[11px] opacity-50 truncate max-w-[120px]">{typeof a.result === 'string' ? a.result : ''}</span>}
        </div>
      ))}
    </div>
  );
}

function MUAMessage({ role, content, timestamp, actions, attachments, isLatest }: MUAMessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center animate-[mua-fade_0.3s_ease-out]">
        <span className="text-xs text-zinc-600 bg-zinc-900/50 px-3.5 py-1.5 rounded-full">{content}</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLatest ? 'animate-[mua-msg-in_0.3s_ease-out]' : ''}`}>
      <div className="max-w-[85%] group">
        <div className={`text-base leading-relaxed ${
          isUser
            ? 'bg-white/[0.06] text-zinc-100 px-4 py-3 rounded-2xl rounded-br-md'
            : 'text-zinc-200 px-1'
        }`}>
          {/* Render content with basic line breaks */}
          {content.split('\n').map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
          {attachments?.length ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 py-1 text-[11px] text-zinc-400">
                  {a.name}
                </span>
              ))}
            </div>
          ) : null}
          {actions?.length ? <ActionList actions={actions} /> : null}
        </div>
        {/* Timestamp — hidden by default, shows on hover */}
        <span className={`block mt-1.5 text-[10px] text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? 'text-right' : 'text-left'} px-1`}>
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}

export default memo(MUAMessage);

'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import QualificationCard from './cards/QualificationCard';
import ActionCard from './cards/ActionCard';
import ChannelSwitchCard from './cards/ChannelSwitchCard';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ActionItem {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}

interface ChannelOption {
  type: string;
  label: string;
  description: string;
}

interface QualificationField {
  field: 'name' | 'email' | 'phone' | 'state' | 'need' | 'amount';
  question: string;
}

export interface ChatWidgetMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type:
    | 'text'
    | 'quick_reply'
    | 'action_card'
    | 'qualification_card'
    | 'summary_card'
    | 'cta_block'
    | 'channel_switch'
    | 'system_notice';
  content: string;
  timestamp: Date;
  // Card payloads
  qualification?: QualificationField;
  qualificationSubmitted?: boolean;
  qualificationValue?: string;
  actionCard?: { title: string; description: string; icon?: string; actions: ActionItem[] };
  channelSwitch?: { channels: ChannelOption[] };
  ctaLabel?: string;
  ctaAction?: () => void;
}

interface ConversationThreadProps {
  messages: ChatWidgetMessage[];
  isTyping: boolean;
  onQuickAction?: (action: string) => void;
  onQualificationSubmit?: (field: string, value: string) => void;
  onChannelSelect?: (channel: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Group messages within 5-minute windows */
function shouldShowTimestamp(current: ChatWidgetMessage, prev?: ChatWidgetMessage): boolean {
  if (!prev) return true;
  return current.timestamp.getTime() - prev.timestamp.getTime() > 5 * 60 * 1000;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-500">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-zinc-800/50 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-zinc-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

function TimestampDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="text-[11px] text-zinc-500">{fmtTime(date)}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Message renderer                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MessageBubble({
  message,
  onQuickAction,
  onQualificationSubmit,
  onChannelSelect,
}: {
  message: ChatWidgetMessage;
  onQuickAction?: (action: string) => void;
  onQualificationSubmit?: (field: string, value: string) => void;
  onChannelSelect?: (channel: string) => void;
}) {
  /* System notice */
  if (message.type === 'system_notice') {
    return (
      <div className="flex justify-center px-4 py-1">
        <span className="text-xs text-zinc-500">{message.content}</span>
      </div>
    );
  }

  /* Qualification card */
  if (message.type === 'qualification_card' && message.qualification) {
    return (
      <div className="px-4 py-1">
        <QualificationCard
          field={message.qualification.field}
          question={message.qualification.question}
          onSubmit={(value) =>
            onQualificationSubmit?.(message.qualification!.field, value)
          }
          submitted={message.qualificationSubmitted}
          submittedValue={message.qualificationValue}
        />
      </div>
    );
  }

  /* Action card */
  if (message.type === 'action_card' && message.actionCard) {
    return (
      <div className="px-4 py-1">
        <ActionCard
          title={message.actionCard.title}
          description={message.actionCard.description}
          actions={message.actionCard.actions}
        />
      </div>
    );
  }

  /* Channel switch */
  if (message.type === 'channel_switch' && message.channelSwitch) {
    return (
      <div className="px-4 py-1">
        <ChannelSwitchCard
          channels={message.channelSwitch.channels}
          onSelect={(ch) => onChannelSelect?.(ch)}
        />
      </div>
    );
  }

  /* CTA block */
  if (message.type === 'cta_block') {
    return (
      <div className="px-4 py-1">
        <button
          onClick={message.ctaAction}
          className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold
                     text-white hover:bg-red-500 transition-colors"
        >
          {message.ctaLabel ?? message.content}
        </button>
      </div>
    );
  }

  /* Summary card */
  if (message.type === 'summary_card') {
    return (
      <div className="px-4 py-1">
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
            Summary
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2.5 px-4 py-1.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-500">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700">
          <User className="h-3.5 w-3.5 text-zinc-300" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'rounded-br-md bg-red-600 text-white'
            : 'rounded-bl-md bg-zinc-800/50 text-zinc-100'
        }`}
      >
        {message.content}

        {/* Quick reply buttons inline */}
        {message.type === 'quick_reply' && onQuickAction && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.content
              .split('|')
              .filter(Boolean)
              .map((opt) => (
                <button
                  key={opt}
                  onClick={() => onQuickAction(opt.trim())}
                  className="rounded-lg bg-zinc-700/60 px-3 py-1 text-xs text-zinc-200
                             hover:bg-zinc-600/60 transition-colors"
                >
                  {opt.trim()}
                </button>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ConversationThread({
  messages,
  isTyping,
  onQuickAction,
  onQualificationSubmit,
  onChannelSelect,
}: ConversationThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  return (
    <div className="flex flex-col gap-0.5 py-4" style={{ scrollBehavior: 'smooth' }}>
      {messages.map((msg, i) => (
        <div key={msg.id}>
          {shouldShowTimestamp(msg, messages[i - 1]) && (
            <TimestampDivider date={msg.timestamp} />
          )}
          <MessageBubble
            message={msg}
            onQuickAction={onQuickAction}
            onQualificationSubmit={onQualificationSubmit}
            onChannelSelect={onChannelSelect}
          />
        </div>
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}

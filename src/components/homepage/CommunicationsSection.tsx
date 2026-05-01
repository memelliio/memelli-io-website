'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Phone,
  MessageSquare,
  Bot,
  Calendar,
  Headphones,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Capability items                                                    */
/* ------------------------------------------------------------------ */

const capabilities = [
  {
    title: 'Business Phone System',
    icon: Phone,
    description: 'Real phone numbers, call routing, voicemail',
  },
  {
    title: 'SMS & Messaging',
    icon: MessageSquare,
    description: 'Two-way texting, templates, automation',
  },
  {
    title: 'AI Receptionist',
    icon: Bot,
    description: '24/7 intelligent call handling',
  },
  {
    title: 'Scheduling',
    icon: Calendar,
    description: 'Automated appointment booking',
  },
  {
    title: 'Call Center',
    icon: Headphones,
    description: 'Queue management, agent routing, analytics',
  },
];

/* ------------------------------------------------------------------ */
/*  Recent activity items                                               */
/* ------------------------------------------------------------------ */

const recentActivity = [
  {
    label: 'Inbound Call',
    detail: 'Sarah Johnson',
    time: '1m ago',
    color: 'text-green-400',
    dotColor: 'bg-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    label: 'SMS Sent',
    detail: 'Welcome message',
    time: '5m ago',
    color: 'text-blue-400',
    dotColor: 'bg-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    label: 'Voicemail',
    detail: 'New message',
    time: '12m ago',
    color: 'text-amber-400',
    dotColor: 'bg-amber-400',
    bgColor: 'bg-amber-400/10',
  },
];

/* ------------------------------------------------------------------ */
/*  Audio waveform visualization                                        */
/* ------------------------------------------------------------------ */

function AudioWaveform() {
  return (
    <div className="flex items-end gap-[3px]">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-blue-400/60"
          animate={{
            height: ['8px', `${12 + Math.random() * 16}px`, '8px'],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.6,
            delay: i * 0.08,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          style={{ height: '8px' }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Softphone mockup                                                    */
/* ------------------------------------------------------------------ */

function SoftphoneMockup({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-sm"
    >
      {/* Glow behind panel */}
      <div className="absolute -inset-4 rounded-3xl bg-blue-500/5 blur-2xl" />

      {/* Main panel */}
      <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_1px_rgba(74,222,128,0.5)]" />
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Receptionist Active
            </span>
          </div>
          <AudioWaveform />
        </div>

        {/* Active call */}
        <div className="border-b border-[hsl(var(--border))] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">John Smith</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Call</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="h-2 w-2 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="font-mono text-sm text-green-400">2:34</span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="px-5 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Recent Activity
          </p>
          <div className="space-y-2.5">
            {recentActivity.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                className={`flex items-center justify-between rounded-lg ${item.bgColor} px-3 py-2`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`}
                  />
                  <div>
                    <p className={`text-xs font-medium ${item.color}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{item.detail}</p>
                  </div>
                </div>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main section                                                        */
/* ------------------------------------------------------------------ */

export default function CommunicationsSection() {
  const { ref: sectionRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section className="relative overflow-hidden bg-[hsl(var(--background))] py-24">
      <div ref={sectionRef} className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-white">
            Professional Communications, Built In
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
            Business phone, SMS, call center, AI receptionist, and scheduling
            &mdash; all connected to your CRM.
          </p>
        </motion.div>

        {/* Two-column layout: visual left, text right */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — Softphone mockup */}
          <SoftphoneMockup inView={inView} />

          {/* RIGHT — Capabilities */}
          <div className="space-y-5">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, x: 30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.15 + i * 0.1,
                    ease: 'easeOut',
                  }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {cap.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                      {cap.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
          className="mt-14 text-center"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_24px_-4px_rgba(239,68,68,0.5)]"
          >
            Explore Communications
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

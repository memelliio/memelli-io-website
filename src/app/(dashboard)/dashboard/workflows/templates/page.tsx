'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Zap, Users, ShoppingBag, Ticket, Bell, Clock,
  CheckCircle, GitBranch, Sparkles, ArrowRight,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

interface TemplateStep {
  type: string;
  config: Record<string, string | number>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  icon: React.ComponentType<{className?: string}>;
  accentColor: string;
  steps: TemplateStep[];
  popular?: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: 'new-lead-qualify-notify',
    name: 'New Lead → Qualify → Notify',
    description: 'When a new contact is created, run AI qualification and notify your team if the lead is hot.',
    category: 'CRM',
    triggerType: 'contact.created',
    icon: Users,
    accentColor: 'green',
    popular: true,
    steps: [
      { type: 'action', config: { actionType: 'ai_command', title: 'Qualify lead with AI', engine: 'crm' } },
      { type: 'condition', config: { field: 'lead_score', operator: 'greater_than', value: '70' } },
      { type: 'notify', config: { title: 'Hot Lead Alert', body: 'A new qualified lead needs attention', channel: 'in_app' } },
    ],
  },
  {
    id: 'order-fulfill-thank',
    name: 'Order Placed → Fulfill → Thank',
    description: 'Automatically create a fulfillment task when an order is placed and send a thank-you notification.',
    category: 'Commerce',
    triggerType: 'order.created',
    icon: ShoppingBag,
    accentColor: 'blue',
    popular: true,
    steps: [
      { type: 'action', config: { actionType: 'create_task', title: 'Fulfill order' } },
      { type: 'delay', config: { duration: 1, unit: 'hours' } },
      { type: 'notify', config: { title: 'Thank you for your order!', body: 'Your order is being processed.', channel: 'email' } },
    ],
  },
  {
    id: 'ticket-assign-sla',
    name: 'Ticket Created → Assign → SLA',
    description: 'When a support ticket is created, assign it and set up SLA monitoring with escalation.',
    category: 'Support',
    triggerType: 'ticket.created',
    icon: Ticket,
    accentColor: 'orange',
    popular: true,
    steps: [
      { type: 'action', config: { actionType: 'create_task', title: 'Review and assign ticket' } },
      { type: 'delay', config: { duration: 4, unit: 'hours' } },
      { type: 'condition', config: { field: 'status', operator: 'equals', value: 'open' } },
      { type: 'notify', config: { title: 'SLA Warning', body: 'Ticket has been open for 4 hours without resolution', channel: 'in_app' } },
    ],
  },
  {
    id: 'deal-stage-follow-up',
    name: 'Deal Stage Changed → Follow Up',
    description: 'When a deal advances stages, automatically schedule a follow-up task with AI-generated notes.',
    category: 'CRM',
    triggerType: 'deal.stage_changed',
    icon: GitBranch,
    accentColor: 'primary',
    steps: [
      { type: 'action', config: { actionType: 'ai_command', title: 'Generate follow-up notes', engine: 'crm' } },
      { type: 'action', config: { actionType: 'create_task', title: 'Follow up on deal' } },
      { type: 'notify', config: { title: 'Deal Progress', body: 'Deal has moved to next stage — follow-up scheduled', channel: 'in_app' } },
    ],
  },
  {
    id: 'lesson-complete-reward',
    name: 'Lesson Completed → Reward → Next',
    description: 'Congratulate students when they complete a lesson and suggest the next one.',
    category: 'Coaching',
    triggerType: 'lesson.completed',
    icon: Sparkles,
    accentColor: 'yellow',
    steps: [
      { type: 'notify', config: { title: 'Great job!', body: 'You completed the lesson. Keep going!', channel: 'in_app' } },
      { type: 'delay', config: { duration: 1, unit: 'days' } },
      { type: 'notify', config: { title: 'Ready for the next lesson?', body: 'Your next lesson is waiting for you.', channel: 'email' } },
    ],
  },
  {
    id: 'daily-report',
    name: 'Daily Business Report',
    description: 'Generate and send a daily AI-powered business summary every morning.',
    category: 'Automation',
    triggerType: 'schedule.daily',
    icon: Clock,
    accentColor: 'cyan',
    steps: [
      { type: 'action', config: { actionType: 'ai_command', title: 'Generate daily business summary', engine: 'core' } },
      { type: 'notify', config: { title: 'Daily Report', body: 'Your daily business summary is ready', channel: 'email' } },
    ],
  },
];

const ACCENT_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  purple: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  yellow: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
};

export default function WorkflowTemplatesPage() {
  const api = useApi();
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);

  async function useTemplate(template: Template) {
    setCreating(template.id);
    const res = await api.post<{ id: string }>('/api/workflows', {
      name: template.name,
      triggerType: template.triggerType,
      steps: template.steps.map((s, i) => ({
        id: Math.random().toString(36).slice(2, 9),
        type: s.type,
        config: s.config,
        order: i,
      })),
    });
    if (res.error) {
      toast.error('Failed to create workflow from template');
      setCreating(null);
      return;
    }
    toast.success('Workflow created from template');
    const newId = res.data?.id;
    router.push(newId ? `/dashboard/workflows/${newId}` : '/dashboard/workflows');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/workflows')}
          className="rounded-xl p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/95">Workflow Templates</h1>
          <p className="mt-1 text-sm text-white/40">Start with a pre-built workflow and customize it</p>
        </div>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          const accent = ACCENT_MAP[template.accentColor] ?? ACCENT_MAP.purple;
          return (
            <Card
              key={template.id}
              className={`rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl hover:${accent.border} transition-all hover:bg-white/[0.04]`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${accent.bg}`}>
                    <Icon className={`h-5 w-5 ${accent.text}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {template.popular && (
                      <Badge variant="primary" className="text-[10px]">Popular</Badge>
                    )}
                    <Badge variant="muted" className="text-[10px]">{template.category}</Badge>
                  </div>
                </div>
                <CardTitle className="text-white/90 mt-3 text-base">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-white/40 leading-relaxed">{template.description}</p>

                {/* Mini step flow */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {template.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/60 capitalize">
                        {step.type}
                      </span>
                      {i < template.steps.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-white/15" />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => useTemplate(template)}
                  isLoading={creating === template.id}
                  disabled={!!creating}
                >
                  <Zap className="h-3.5 w-3.5" /> Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

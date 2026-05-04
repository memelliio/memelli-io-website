'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, BarChart3, GitMerge, Users} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickCommand {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const QUICK_COMMANDS: QuickCommand[] = [
  { label: 'Set up CRM for credit repair', prompt: 'Set up my CRM for credit repair. Create pipelines, stages, and tags that make sense for a credit repair business.', icon: <Zap className="h-3.5 w-3.5" /> },
  { label: 'Show pipeline health', prompt: 'Show me my pipeline health. What is the current state of all my deals, win rates, and where are the bottlenecks?', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { label: 'Summarize open deals', prompt: 'Give me a summary of all open deals including total value, average deal size, and which ones need attention.', icon: <GitMerge className="h-3.5 w-3.5" /> },
  { label: 'At-risk deal analysis', prompt: 'Analyze my at-risk deals. Which deals have had no activity recently and might be slipping away?', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { label: 'Contact engagement report', prompt: 'Give me a report on contact engagement. Which contacts have the most deals, highest value, and recent activity?', icon: <Users className="h-3.5 w-3.5" /> },
  { label: 'Forecast next quarter', prompt: 'Based on my current pipeline, forecast my revenue for next quarter. Include weighted and unweighted projections.', icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

export default function CRMAIAgentPage() {
  const api = useApi();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your CRM AI assistant. I can help you manage your pipeline, analyze deals, set up workflows, and get insights from your CRM data.\n\nTry one of the quick commands below or ask me anything about your CRM.',
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function handleSend(text?: string) {
    const msg = text ?? input;
    if (!msg.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: msg,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Gather CRM data for context
    const [pipelinesRes, dealsRes, forecastRes] = await Promise.all([
      api.get<any>('/api/crm/reports/pipeline-report'),
      api.get<any>('/api/crm/deals?status=OPEN&perPage=50'),
      api.get<any>('/api/crm/reports/forecast'),
    ]);

    const extract = (raw: any) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
    };

    const pipelines = extract(pipelinesRes.data);
    const deals = extract(dealsRes.data);
    const forecast = extract(forecastRes.data);

    // Generate AI response based on CRM data
    const response = generateResponse(msg, pipelines, deals, forecast);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setIsThinking(false);
    setMessages((prev) => [...prev, assistantMessage]);
    inputRef.current?.focus();
  }

  function generateResponse(query: string, pipelines: any[], deals: any[], forecast: any[]): string {
    const q = query.toLowerCase();
    const totalDeals = deals.length;
    const totalValue = deals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
    const avgDealSize = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;

    if (q.includes('set up') || q.includes('setup') || q.includes('credit repair')) {
      return `Here's a recommended CRM setup for credit repair:\n\n**Pipeline: Credit Repair Client Journey**\nStages:\n1. New Lead - Initial inquiry\n2. Consultation Scheduled - Meeting booked\n3. Credit Analysis - Reviewing credit reports\n4. Proposal Sent - Service plan delivered\n5. Agreement Signed - Client committed\n6. Active Repair - Disputes and letters being sent\n7. Monitoring - Tracking progress\n8. Completed - Goals achieved\n\n**Recommended Tags:**\n- credit-score-range: poor, fair, good\n- priority: high, medium, low\n- referral-source: website, referral, social\n- service-tier: basic, standard, premium\n\n**Quick Actions:**\n- Navigate to Pipelines to create these stages\n- Use Tags to set up your categorization\n- Set up Segments for each client tier\n\nWould you like me to help with anything else?`;
    }

    if (q.includes('pipeline health') || q.includes('pipeline status')) {
      if (pipelines.length === 0) {
        return 'You don\'t have any pipelines set up yet. Would you like me to help you create one? Try the "Set up CRM for credit repair" command to get started.';
      }
      const summary = pipelines.map((p: any) =>
        `**${p.pipelineName}**: ${p.totalDeals} deals, $${Number(p.totalValue).toLocaleString()} value, ${p.winRate}% win rate`
      ).join('\n');
      return `Here's your pipeline health overview:\n\n${summary}\n\n**Key Insights:**\n${pipelines.some((p: any) => p.winRate < 30) ? '- Some pipelines have low win rates. Consider reviewing your qualification criteria.' : '- Your win rates look healthy.'}\n${totalDeals > 0 ? `- Average deal size: $${avgDealSize.toLocaleString()}` : ''}\n- Total pipeline value: $${totalValue.toLocaleString()}\n\nWant me to drill deeper into any specific pipeline?`;
    }

    if (q.includes('open deals') || q.includes('summary')) {
      if (totalDeals === 0) {
        return 'You don\'t have any open deals right now. Start by adding deals to your pipeline from the Deals page.';
      }
      const topDeals = deals.slice(0, 5).map((d: any) =>
        `- ${d.title}: $${(Number(d.value) || 0).toLocaleString()}`
      ).join('\n');
      return `**Open Deals Summary:**\n\n- Total Open Deals: ${totalDeals}\n- Total Pipeline Value: $${totalValue.toLocaleString()}\n- Average Deal Size: $${avgDealSize.toLocaleString()}\n\n**Top Deals:**\n${topDeals}\n\nWould you like me to analyze specific deals or show at-risk ones?`;
    }

    if (q.includes('at-risk') || q.includes('risk') || q.includes('attention')) {
      const atRisk = deals.filter((d: any) => {
        const lastActivity = d.lastActivityAt ?? d.createdAt;
        if (!lastActivity) return false;
        const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
        return days >= 14;
      });
      if (atRisk.length === 0) {
        return 'Great news! None of your deals appear to be at risk right now. All deals have had recent activity within the last 14 days.';
      }
      const riskList = atRisk.slice(0, 5).map((d: any) => {
        const days = Math.floor((Date.now() - new Date(d.lastActivityAt ?? d.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return `- **${d.title}** ($${(Number(d.value) || 0).toLocaleString()}) - ${days} days without activity`;
      }).join('\n');
      return `**At-Risk Deals (no activity in 14+ days):**\n\n${riskList}\n\n**Recommendations:**\n1. Schedule follow-up calls for these contacts today\n2. Send a check-in email to re-engage\n3. Review if these deals should be moved to "Lost"\n\n${atRisk.length} of ${totalDeals} deals need attention.`;
    }

    if (q.includes('forecast') || q.includes('revenue') || q.includes('quarter')) {
      if (forecast.length === 0 && totalDeals === 0) {
        return 'Not enough data to forecast yet. Add deals with expected close dates to get revenue projections.';
      }
      const weighted = Math.round(totalValue * 0.7);
      return `**Revenue Forecast:**\n\n- Current Pipeline: $${totalValue.toLocaleString()}\n- Weighted Forecast (70%): $${weighted.toLocaleString()}\n- Open Deals: ${totalDeals}\n- Average Deal: $${avgDealSize.toLocaleString()}\n\n${forecast.length > 0 ? forecast.slice(0, 3).map((f: any) =>
        `- ${f.month}: $${Number(f.totalValue || f.projectedValue || 0).toLocaleString()} (${f.count || f.dealCount || 0} deals)`
      ).join('\n') : 'Add expected close dates to deals for monthly breakdown.'}\n\n**Tips:**\n- Focus on deals closest to closing\n- Review at-risk deals that may not convert\n- Consider increasing activity on high-value deals`;
    }

    if (q.includes('contact') || q.includes('engagement')) {
      return `**Contact Engagement Analysis:**\n\nBased on your CRM data:\n- Total pipeline contacts with deals: ${totalDeals}\n- Pipeline value per deal: $${avgDealSize.toLocaleString()}\n\n**Recommendations:**\n1. Use the Communications page to log all touchpoints\n2. Set up Segments to group contacts by engagement level\n3. Use Tags to track contact quality (hot, warm, cold)\n4. Review the Timeline on each contact's detail page\n\nFor a detailed contact report, visit the Analytics page.`;
    }

    // Default response
    return `I understand you're asking about: "${query}"\n\nHere's what I can help with:\n- **Pipeline setup** - Create and configure pipelines for your business\n- **Deal analysis** - Review open deals, at-risk deals, win/loss rates\n- **Forecasting** - Revenue projections and weighted pipeline\n- **Contact insights** - Engagement reports and segmentation\n- **Workflow tips** - Best practices for CRM management\n\nTry one of the quick commands below, or ask a more specific question about your CRM data.`;
  }

  return (
    <div className="bg-card flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 shadow-lg shadow-purple-900/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">CRM AI Agent</h1>
            <p className="text-muted-foreground leading-relaxed">Your intelligent CRM assistant</p>
          </div>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-3 mb-6">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => handleSend(cmd.prompt)}
            disabled={isThinking}
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-muted backdrop-blur-xl px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted hover:border-white/[0.08] hover:text-primary/80 transition-all duration-200 disabled:opacity-40"
          >
            {cmd.icon}
            {cmd.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <CardContent className="h-full p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-xl border border-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user'
                      ? 'bg-primary/80/[0.08] border border-primary/20 backdrop-blur-xl text-primary/80'
                      : 'bg-card border border-white/[0.04] backdrop-blur-xl text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {msg.content.split('\n').map((line, i) => {
                      // Simple markdown-like rendering
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold text-foreground mt-3 mb-2">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('- **')) {
                        const parts = line.replace(/^- \*\*/, '').split('**');
                        return (
                          <p key={i} className="pl-3">
                            <span className="font-semibold text-foreground">{parts[0]}</span>
                            <span className="text-muted-foreground">{parts.slice(1).join('')}</span>
                          </p>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return <p key={i} className="pl-3 text-muted-foreground">{line}</p>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={i} className="pl-3 text-muted-foreground">{line}</p>;
                      }
                      return <p key={i} className="text-muted-foreground">{line || '\u00A0'}</p>;
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted backdrop-blur-xl border border-white/[0.04]">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-xl border border-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card border border-white/[0.04] backdrop-blur-xl rounded-2xl px-5 py-4 flex items-center gap-3">
                  <LoadingGlobe size="sm" />
                  <span className="text-sm text-muted-foreground leading-relaxed">Analyzing your CRM data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.04] p-6">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about your CRM, deals, pipeline, contacts..."
                className="flex-1 rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                disabled={isThinking}
              />
              <Button onClick={() => handleSend()} isLoading={isThinking} disabled={!input.trim()} className="rounded-xl bg-primary hover:bg-primary/90 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
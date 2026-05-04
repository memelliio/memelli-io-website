'use client';

import { useState, useMemo } from 'react';
import {
  Phone, MessageSquare, Clock, TrendingUp, TrendingDown,
  BarChart2, Users, Star, ArrowUpRight, Calendar,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, StatCard, Badge } from '@memelli/ui';

interface DailyVolume {
  date: string;
  calls: number;
  chats: number;
  emails: number;
  sms: number;
}

interface ResponseTimeData {
  channel: string;
  avgTime: number; // seconds
  target: number;
}

interface AgentPerformance {
  name: string;
  handled: number;
  avgHandleTime: number;
  satisfaction: number;
  resolution: number;
}

const MOCK_DAILY_VOLUME: DailyVolume[] = [
  { date: 'Mon', calls: 45, chats: 78, emails: 32, sms: 15 },
  { date: 'Tue', calls: 52, chats: 85, emails: 28, sms: 18 },
  { date: 'Wed', calls: 48, chats: 92, emails: 35, sms: 22 },
  { date: 'Thu', calls: 61, chats: 88, emails: 30, sms: 20 },
  { date: 'Fri', calls: 55, chats: 95, emails: 38, sms: 25 },
  { date: 'Sat', calls: 22, chats: 45, emails: 12, sms: 8 },
  { date: 'Sun', calls: 15, chats: 38, emails: 8, sms: 5 },
];

const MOCK_RESPONSE_TIMES: ResponseTimeData[] = [
  { channel: 'Phone', avgTime: 25, target: 30 },
  { channel: 'Chat', avgTime: 45, target: 60 },
  { channel: 'Email', avgTime: 3600, target: 7200 },
  { channel: 'SMS', avgTime: 120, target: 300 },
];

const MOCK_AGENT_PERFORMANCE: AgentPerformance[] = [
  { name: 'Sam Patel', handled: 62, avgHandleTime: 280, satisfaction: 4.9, resolution: 95 },
  { name: 'Alex Rivera', handled: 47, avgHandleTime: 340, satisfaction: 4.8, resolution: 92 },
  { name: 'Taylor Kim', handled: 55, avgHandleTime: 310, satisfaction: 4.7, resolution: 90 },
  { name: 'Jordan Lee', handled: 38, avgHandleTime: 420, satisfaction: 4.6, resolution: 88 },
  { name: 'Casey Morgan', handled: 31, avgHandleTime: 390, satisfaction: 4.5, resolution: 85 },
];

const SATISFACTION_SCORES = {
  overall: 4.7,
  phone: 4.6,
  chat: 4.8,
  email: 4.5,
  trend: 0.2,
};

const PERIODS = ['Today', '7 Days', '30 Days', '90 Days'] as const;

function formatResponseTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export default function CommsAnalyticsPage() {
  const api = useApi();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('7 Days');

  const totalVolume = MOCK_DAILY_VOLUME.reduce(
    (acc, d) => acc + d.calls + d.chats + d.emails + d.sms, 0
  );
  const maxDailyTotal = Math.max(...MOCK_DAILY_VOLUME.map((d) => d.calls + d.chats + d.emails + d.sms));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">Communications Analytics</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">Performance insights across all channels</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-white/[0.04] rounded-2xl p-1 backdrop-blur-xl">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                period === p
                  ? 'bg-primary hover:bg-primary text-white'
                  : 'text-muted-foreground hover:bg-white/[0.04]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Volume" value={totalVolume.toLocaleString()} icon={<BarChart2 className="h-5 w-5" />} trend={{ value: 12, label: "vs last period" }} />
        <StatCard title="Avg Response" value="45s" icon={<Clock className="h-5 w-5" />} trend={{ value: -8, label: "faster" }} />
        <StatCard title="CSAT Score" value={SATISFACTION_SCORES.overall.toFixed(1)} icon={<Star className="h-5 w-5" />} trend={{ value: 4, label: "" }} />
        <StatCard title="Resolution Rate" value="91%" icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 2, label: "" }} />
      </div>

      {/* Call Volume Chart (CSS-based) */}
      <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <CardHeader>
          <CardTitle className="tracking-tight font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" /> Volume by Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-6">
            {[
              { label: 'Calls', color: 'bg-emerald-500' },
              { label: 'Chats', color: 'bg-blue-500' },
              { label: 'Emails', color: 'bg-primary' },
              { label: 'SMS', color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                <span className="text-xs text-muted-foreground leading-relaxed">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Stacked Bar Chart */}
          <div className="flex items-end gap-3 h-48">
            {MOCK_DAILY_VOLUME.map((day) => {
              const total = day.calls + day.chats + day.emails + day.sms;
              const scale = maxDailyTotal > 0 ? 100 / maxDailyTotal : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden" style={{ height: `${total * scale * 1.8}px` }}>
                    <div className="bg-emerald-500" style={{ height: `${(day.calls / total) * 100}%` }} />
                    <div className="bg-blue-500" style={{ height: `${(day.chats / total) * 100}%` }} />
                    <div className="bg-primary" style={{ height: `${(day.emails / total) * 100}%` }} />
                    <div className="bg-amber-500" style={{ height: `${(day.sms / total) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-white/30 mt-1">{day.date}</span>
                  <span className="text-[10px] text-white/20">{total}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Response Times */}
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="tracking-tight font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Average Response Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_RESPONSE_TIMES.map((rt) => {
              const pct = Math.min(100, (rt.avgTime / rt.target) * 100);
              const isOver = rt.avgTime > rt.target;
              return (
                <div key={rt.channel}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70 font-medium">{rt.channel}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isOver ? 'text-primary' : 'text-emerald-400'}`}>
                        {formatResponseTime(rt.avgTime)}
                      </span>
                      <span className="text-xs text-white/20">/ {formatResponseTime(rt.target)} target</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-primary' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Satisfaction Scores */}
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="tracking-tight font-semibold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" /> Satisfaction Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <p className="text-5xl tracking-tight font-semibold text-foreground">{SATISFACTION_SCORES.overall.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">Overall CSAT</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400">+{SATISFACTION_SCORES.trend} from last period</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Phone', score: SATISFACTION_SCORES.phone, icon: <Phone className="h-3.5 w-3.5" /> },
                { label: 'Chat', score: SATISFACTION_SCORES.chat, icon: <MessageSquare className="h-3.5 w-3.5" /> },
                { label: 'Email', score: SATISFACTION_SCORES.email, icon: <BarChart2 className="h-3.5 w-3.5" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-200">
                  <div className="flex items-center gap-2 text-white/60">
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= Math.round(item.score) ? 'text-amber-400 fill-amber-400' : 'text-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white/80">{item.score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Comparison */}
      <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <CardHeader>
          <CardTitle className="tracking-tight font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-4 py-3 font-medium text-white/30">#</th>
                  <th className="px-4 py-3 font-medium text-white/30">Agent</th>
                  <th className="px-4 py-3 font-medium text-white/30 text-center">Handled</th>
                  <th className="px-4 py-3 font-medium text-white/30">Avg Handle Time</th>
                  <th className="px-4 py-3 font-medium text-white/30">CSAT</th>
                  <th className="px-4 py-3 font-medium text-white/30">Resolution Rate</th>
                  <th className="px-4 py-3 font-medium text-white/30">Performance</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_AGENT_PERFORMANCE.map((agent, i) => {
                  const maxHandled = Math.max(...MOCK_AGENT_PERFORMANCE.map((a) => a.handled));
                  const barWidth = (agent.handled / maxHandled) * 100;
                  return (
                    <tr key={agent.name} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${
                          i === 0 ? 'text-amber-400' : i === 1 ? 'text-white/50' : i === 2 ? 'text-orange-400' : 'text-white/20'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white/85">{agent.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-white/70">{agent.handled}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/50">
                          {Math.floor(agent.avgHandleTime / 60)}m {agent.avgHandleTime % 60}s
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${
                          agent.satisfaction >= 4.8 ? 'text-emerald-400' :
                          agent.satisfaction >= 4.5 ? 'text-amber-400' : 'text-orange-400'
                        }`}>
                          {agent.satisfaction.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/50">{agent.resolution}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

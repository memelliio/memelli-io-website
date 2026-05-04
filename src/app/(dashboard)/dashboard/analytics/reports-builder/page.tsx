'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  BarChart2, PieChart, TrendingUp, Table2, Plus, Save, Clock,
  Calendar, Download, Copy, Play, ChevronDown, ChevronRight,
  FileText, Star, Trash2, RefreshCw, Search, Filter, X,
  Database, Users, ShoppingBag, Globe, Megaphone, MessageSquare,
  Check, ArrowUpRight, ArrowDownRight, Layers, Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type DataSource = 'crm' | 'commerce' | 'seo' | 'marketing' | 'communications';
type Visualization = 'table' | 'bar' | 'line' | 'pie';
type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'custom';
type Schedule = 'none' | 'daily' | 'weekly' | 'monthly';
type Tab = 'builder' | 'gallery';

interface Metric {
  id: string;
  label: string;
  source: DataSource;
}

interface SavedReport {
  id: string;
  name: string;
  source: DataSource;
  metrics: string[];
  visualization: Visualization;
  dateRange: DateRange;
  schedule: Schedule;
  lastRun: string;
  prebuilt?: boolean;
}

interface SimulatedRow {
  label: string;
  values: number[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DATA_SOURCES: { id: DataSource; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'commerce', label: 'Commerce', icon: ShoppingBag },
  { id: 'seo', label: 'SEO', icon: Globe },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
];

const METRICS: Metric[] = [
  { id: 'contacts_total', label: 'Total Contacts', source: 'crm' },
  { id: 'contacts_new', label: 'New Contacts', source: 'crm' },
  { id: 'deals_open', label: 'Open Deals', source: 'crm' },
  { id: 'deals_won', label: 'Deals Won', source: 'crm' },
  { id: 'deals_value', label: 'Pipeline Value', source: 'crm' },
  { id: 'win_rate', label: 'Win Rate %', source: 'crm' },
  { id: 'revenue_total', label: 'Total Revenue', source: 'commerce' },
  { id: 'revenue_recurring', label: 'Recurring Revenue', source: 'commerce' },
  { id: 'orders_count', label: 'Order Count', source: 'commerce' },
  { id: 'avg_order_value', label: 'Avg Order Value', source: 'commerce' },
  { id: 'products_sold', label: 'Products Sold', source: 'commerce' },
  { id: 'refund_rate', label: 'Refund Rate %', source: 'commerce' },
  { id: 'articles_published', label: 'Articles Published', source: 'seo' },
  { id: 'articles_indexed', label: 'Articles Indexed', source: 'seo' },
  { id: 'organic_traffic', label: 'Organic Traffic', source: 'seo' },
  { id: 'keyword_rankings', label: 'Keyword Rankings', source: 'seo' },
  { id: 'avg_position', label: 'Avg Position', source: 'seo' },
  { id: 'click_through_rate', label: 'Click-Through Rate %', source: 'seo' },
  { id: 'campaigns_active', label: 'Active Campaigns', source: 'marketing' },
  { id: 'campaign_reach', label: 'Campaign Reach', source: 'marketing' },
  { id: 'conversion_rate', label: 'Conversion Rate %', source: 'marketing' },
  { id: 'cost_per_lead', label: 'Cost Per Lead', source: 'marketing' },
  { id: 'roi', label: 'ROI %', source: 'marketing' },
  { id: 'leads_generated', label: 'Leads Generated', source: 'marketing' },
  { id: 'messages_sent', label: 'Messages Sent', source: 'communications' },
  { id: 'messages_received', label: 'Messages Received', source: 'communications' },
  { id: 'response_rate', label: 'Response Rate %', source: 'communications' },
  { id: 'avg_response_time', label: 'Avg Response Time', source: 'communications' },
  { id: 'channels_active', label: 'Active Channels', source: 'communications' },
  { id: 'sentiment_score', label: 'Sentiment Score', source: 'communications' },
];

const VISUALIZATIONS: { id: Visualization; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
  { id: 'line', label: 'Line Chart', icon: TrendingUp },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
];

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'ytd', label: 'Year to Date' },
  { id: 'custom', label: 'Custom Range' },
];

const SCHEDULES: { id: Schedule; label: string }[] = [
  { id: 'none', label: 'No Schedule' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const PREBUILT_REPORTS: SavedReport[] = [
  {
    id: 'prebuilt-revenue',
    name: 'Revenue Summary',
    source: 'commerce',
    metrics: ['revenue_total', 'revenue_recurring', 'orders_count', 'avg_order_value'],
    visualization: 'bar',
    dateRange: '30d',
    schedule: 'weekly',
    lastRun: '2026-03-15T08:00:00Z',
    prebuilt: true,
  },
  {
    id: 'prebuilt-pipeline',
    name: 'Lead Pipeline',
    source: 'crm',
    metrics: ['contacts_new', 'deals_open', 'deals_won', 'win_rate'],
    visualization: 'line',
    dateRange: '30d',
    schedule: 'daily',
    lastRun: '2026-03-15T06:00:00Z',
    prebuilt: true,
  },
  {
    id: 'prebuilt-seo',
    name: 'SEO Performance',
    source: 'seo',
    metrics: ['organic_traffic', 'keyword_rankings', 'articles_indexed', 'click_through_rate'],
    visualization: 'line',
    dateRange: '90d',
    schedule: 'weekly',
    lastRun: '2026-03-14T12:00:00Z',
    prebuilt: true,
  },
  {
    id: 'prebuilt-roi',
    name: 'Campaign ROI',
    source: 'marketing',
    metrics: ['campaigns_active', 'conversion_rate', 'roi', 'cost_per_lead'],
    visualization: 'bar',
    dateRange: '30d',
    schedule: 'monthly',
    lastRun: '2026-03-01T00:00:00Z',
    prebuilt: true,
  },
  {
    id: 'prebuilt-agents',
    name: 'Agent Productivity',
    source: 'communications',
    metrics: ['messages_sent', 'response_rate', 'avg_response_time', 'sentiment_score'],
    visualization: 'table',
    dateRange: '7d',
    schedule: 'daily',
    lastRun: '2026-03-15T07:30:00Z',
    prebuilt: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSimulatedData(metrics: string[], dateRange: DateRange): SimulatedRow[] {
  const pointCount = dateRange === '7d' ? 7 : dateRange === '30d' ? 6 : dateRange === '90d' ? 6 : 12;
  const labels =
    dateRange === '7d'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : dateRange === '30d'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']
        : dateRange === '90d'
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
          : ['Q1', 'Q2', 'Q3', 'Q4', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return metrics.map((metricId) => {
    const metric = METRICS.find((m) => m.id === metricId);
    const isPercent = metric?.label.includes('%');
    const base = isPercent ? 40 + Math.random() * 40 : 100 + Math.random() * 5000;
    const values = Array.from({ length: pointCount }, (_, i) => {
      const trend = 1 + (i / pointCount) * 0.3;
      const noise = 0.8 + Math.random() * 0.4;
      return Math.round(base * trend * noise * 100) / 100;
    });
    return { label: metric?.label ?? metricId, values };
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function sourceIcon(source: DataSource) {
  return DATA_SOURCES.find((s) => s.id === source)?.icon ?? Database;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BarChartViz({ data }: { data: SimulatedRow[] }) {
  const allValues = data.flatMap((r) => r.values);
  const max = Math.max(...allValues, 1);
  const pointCount = data[0]?.values.length ?? 0;
  const colors = ['bg-red-500', 'bg-rose-400', 'bg-red-300', 'bg-red-600', 'bg-rose-500', 'bg-red-400'];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1 h-48">
        {Array.from({ length: pointCount }, (_, pi) => (
          <div key={pi} className="flex-1 flex items-end gap-px h-full">
            {data.map((row, ri) => (
              <div
                key={ri}
                className={`flex-1 rounded-t ${colors[ri % colors.length]} opacity-80 hover:opacity-100 transition-opacity`}
                style={{ height: `${(row.values[pi] / max) * 100}%`, minHeight: '2px' }}
                title={`${row.label}: ${row.values[pi].toLocaleString()}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap mt-1">
        {data.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${colors[ri % colors.length]}`} />
            {row.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChartViz({ data }: { data: SimulatedRow[] }) {
  const allValues = data.flatMap((r) => r.values);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const w = 600;
  const h = 192;
  const pad = 4;
  const colors = ['#ef4444', '#fb7185', '#fca5a5', '#dc2626', '#f43f5e', '#e11d48'];

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48" preserveAspectRatio="none">
        {data.map((row, ri) => {
          const points = row.values
            .map((v, i) => {
              const x = pad + (i / (row.values.length - 1 || 1)) * (w - pad * 2);
              const y = h - pad - ((v - min) / range) * (h - pad * 2);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polyline
              key={ri}
              points={points}
              fill="none"
              stroke={colors[ri % colors.length]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          );
        })}
      </svg>
      <div className="flex gap-3 flex-wrap mt-1">
        {data.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[ri % colors.length] }} />
            {row.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartViz({ data }: { data: SimulatedRow[] }) {
  const totals = data.map((r) => r.values.reduce((a, b) => a + b, 0));
  const sum = totals.reduce((a, b) => a + b, 0) || 1;
  const colors = ['#ef4444', '#fb7185', '#fca5a5', '#dc2626', '#f43f5e', '#e11d48'];
  let cumAngle = 0;

  const slices = totals.map((t, i) => {
    const angle = (t / sum) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const midAngle = ((startAngle + angle / 2) * Math.PI) / 180;
    const r = 80;
    const cx = 100;
    const cy = 100;
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = cy + r * Math.sin(((startAngle + angle) * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
    return { path, color: colors[i % colors.length], label: data[i].label, pct: ((t / sum) * 100).toFixed(1) };
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.85} className="hover:opacity-100 transition-opacity">
            <title>{s.label}: {s.pct}%</title>
          </path>
        ))}
      </svg>
      <div className="flex flex-col gap-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
            <span className="text-foreground">{s.label}</span>
            <span className="text-muted-foreground">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableViz({ data, dateRange }: { data: SimulatedRow[]; dateRange: DateRange }) {
  const headers =
    dateRange === '7d'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : dateRange === '30d'
        ? ['W1', 'W2', 'W3', 'W4', 'W5', 'W6']
        : dateRange === '90d'
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
          : ['Q1', 'Q2', 'Q3', 'Q4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-2 pr-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Metric</th>
            {headers.slice(0, data[0]?.values.length ?? 0).map((h) => (
              <th key={h} className="text-right py-2 px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
            <th className="text-right py-2 pl-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => {
            const last = row.values[row.values.length - 1];
            const prev = row.values[row.values.length - 2] ?? last;
            const trend = prev !== 0 ? ((last - prev) / prev) * 100 : 0;
            return (
              <tr key={ri} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4 text-foreground font-medium">{row.label}</td>
                {row.values.map((v, vi) => (
                  <td key={vi} className="text-right py-2.5 px-2 text-muted-foreground tabular-nums">{v.toLocaleString()}</td>
                ))}
                <td className="text-right py-2.5 pl-4">
                  <span className={`inline-flex items-center gap-0.5 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReportsBuilderPage() {
  const [tab, setTab] = useState<Tab>('builder');
  const [reportName, setReportName] = useState('');
  const [selectedSource, setSelectedSource] = useState<DataSource>('crm');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [visualization, setVisualization] = useState<Visualization>('bar');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [schedule, setSchedule] = useState<Schedule>('none');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([...PREBUILT_REPORTS]);
  const [previewData, setPreviewData] = useState<SimulatedRow[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<DataSource | 'all'>('all');

  const availableMetrics = useMemo(() => METRICS.filter((m) => m.source === selectedSource), [selectedSource]);

  const toggleMetric = useCallback((metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId]
    );
  }, []);

  const runPreview = useCallback(() => {
    if (selectedMetrics.length === 0) return;
    const data = generateSimulatedData(selectedMetrics, dateRange);
    setPreviewData(data);
    setShowPreview(true);
  }, [selectedMetrics, dateRange]);

  const saveReport = useCallback(() => {
    if (!reportName.trim() || selectedMetrics.length === 0) return;
    const report: SavedReport = {
      id: `report-${Date.now()}`,
      name: reportName.trim(),
      source: selectedSource,
      metrics: [...selectedMetrics],
      visualization,
      dateRange,
      schedule,
      lastRun: new Date().toISOString(),
    };
    setSavedReports((prev) => [report, ...prev]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [reportName, selectedSource, selectedMetrics, visualization, dateRange, schedule]);

  const deleteReport = useCallback((id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const loadReport = useCallback((report: SavedReport) => {
    setReportName(report.name);
    setSelectedSource(report.source);
    setSelectedMetrics(report.metrics);
    setVisualization(report.visualization);
    setDateRange(report.dateRange);
    setSchedule(report.schedule);
    setTab('builder');
    const data = generateSimulatedData(report.metrics, report.dateRange);
    setPreviewData(data);
    setShowPreview(true);
  }, []);

  const exportCSV = useCallback(() => {
    if (!previewData) return;
    const headers = ['Metric', ...previewData[0].values.map((_, i) => `Period ${i + 1}`)];
    const rows = previewData.map((r) => [r.label, ...r.values.map((v) => v.toString())]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    navigator.clipboard.writeText(csv).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [previewData]);

  const filteredGalleryReports = useMemo(() => {
    let reports = savedReports;
    if (galleryFilter !== 'all') {
      reports = reports.filter((r) => r.source === galleryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      reports = reports.filter((r) => r.name.toLowerCase().includes(q));
    }
    return reports;
  }, [savedReports, galleryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-card px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Create custom reports, schedule delivery, and export data</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('builder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'builder'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Builder
          </button>
          <button
            onClick={() => setTab('gallery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'gallery'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Layers className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Gallery ({savedReports.length})
          </button>
        </div>
      </div>

      {/* ───────────────────── BUILDER TAB ───────────────────── */}
      {tab === 'builder' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-6">
          {/* Left: Configuration */}
          <div className="flex flex-col gap-5">
            {/* Report Name */}
            <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Report Name</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="My Custom Report..."
                className="w-full bg-muted border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>

            {/* Data Source */}
            <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Data Source</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DATA_SOURCES.map((ds) => {
                  const Icon = ds.icon;
                  const active = selectedSource === ds.id;
                  return (
                    <button
                      key={ds.id}
                      onClick={() => {
                        setSelectedSource(ds.id);
                        setSelectedMetrics([]);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-red-600/20 border border-red-500/40 text-red-300'
                          : 'bg-muted border border-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {ds.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metrics */}
            <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                  Metrics ({selectedMetrics.length} selected)
                </label>
                {selectedMetrics.length > 0 && (
                  <button
                    onClick={() => setSelectedMetrics([])}
                    className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {availableMetrics.map((m) => {
                  const active = selectedMetrics.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMetric(m.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                        active
                          ? 'bg-red-600/15 border border-red-500/30 text-red-300'
                          : 'bg-muted border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-red-600 border-red-500' : 'border-border'
                      }`}>
                        {active && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visualization */}
            <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Visualization</label>
              <div className="grid grid-cols-4 gap-2">
                {VISUALIZATIONS.map((v) => {
                  const Icon = v.icon;
                  const active = visualization === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVisualization(v.id)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? 'bg-red-600/20 border border-red-500/40 text-red-300'
                          : 'bg-muted border border-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range + Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRange)}
                  className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                >
                  {DATE_RANGES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-3">Schedule</label>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value as Schedule)}
                  className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                >
                  {SCHEDULES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={runPreview}
                disabled={selectedMetrics.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-900/30"
              >
                <Play className="h-4 w-4" />
                Run Preview
              </button>
              <button
                onClick={saveReport}
                disabled={!reportName.trim() || selectedMetrics.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted text-foreground font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
              >
                {saveSuccess ? <Check className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
                {saveSuccess ? 'Saved!' : 'Save Report'}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {reportName || 'Report Preview'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedMetrics.length > 0
                    ? `${selectedMetrics.length} metrics from ${DATA_SOURCES.find((s) => s.id === selectedSource)?.label}`
                    : 'Select metrics to preview'}
                </p>
              </div>
              {previewData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={runPreview}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Refresh data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs font-medium"
                  >
                    {copySuccess ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copySuccess ? 'Copied!' : 'CSV'}
                  </button>
                </div>
              )}
            </div>

            {!showPreview || !previewData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart2 className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">No preview yet</p>
                <p className="text-xs mt-1">Select metrics and click &quot;Run Preview&quot;</p>
              </div>
            ) : (
              <div className="flex-1">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {previewData.slice(0, 4).map((row, i) => {
                    const last = row.values[row.values.length - 1];
                    const prev = row.values[row.values.length - 2] ?? last;
                    const trend = prev !== 0 ? ((last - prev) / prev) * 100 : 0;
                    return (
                      <div key={i} className="rounded-xl bg-muted border border-white/[0.04] p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 truncate">{row.label}</p>
                        <p className="text-xl font-bold text-foreground tabular-nums">{last.toLocaleString()}</p>
                        <div className={`flex items-center gap-0.5 text-[10px] mt-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trend >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                          {Math.abs(trend).toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visualization */}
                <div className="rounded-xl bg-muted border border-white/[0.03] p-4">
                  {visualization === 'bar' && <BarChartViz data={previewData} />}
                  {visualization === 'line' && <LineChartViz data={previewData} />}
                  {visualization === 'pie' && <PieChartViz data={previewData} />}
                  {visualization === 'table' && <TableViz data={previewData} dateRange={dateRange} />}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground">
                  <span>Simulated data for preview purposes</span>
                  <span>Generated {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────── GALLERY TAB ───────────────────── */}
      {tab === 'gallery' && (
        <div>
          {/* Gallery Controls */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports..."
                className="w-full bg-muted border border-white/[0.06] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  galleryFilter === 'all'
                    ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                    : 'bg-muted text-muted-foreground border border-transparent hover:text-foreground'
                }`}
              >
                All
              </button>
              {DATA_SOURCES.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setGalleryFilter(ds.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    galleryFilter === ds.id
                      ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                      : 'bg-muted text-muted-foreground border border-transparent hover:text-foreground'
                  }`}
                >
                  {ds.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Grid */}
          {filteredGalleryReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No reports found</p>
              <p className="text-xs mt-1">Create one in the Builder tab</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGalleryReports.map((report) => {
                const SourceIcon = sourceIcon(report.source);
                const VizIcon = VISUALIZATIONS.find((v) => v.id === report.visualization)?.icon ?? BarChart2;
                return (
                  <div
                    key={report.id}
                    className="group rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 hover:border-red-500/20 transition-all cursor-pointer"
                    onClick={() => loadReport(report)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`rounded-xl p-2 ${report.prebuilt ? 'bg-red-50' : 'bg-white/[0.03]'}`}>
                          <SourceIcon className={`h-4 w-4 ${report.prebuilt ? 'text-red-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">{report.name}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{DATA_SOURCES.find((s) => s.id === report.source)?.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {report.prebuilt && (
                          <Star className="h-3.5 w-3.5 text-amber-500/60" />
                        )}
                        {!report.prebuilt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteReport(report.id);
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metric tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {report.metrics.slice(0, 3).map((mId) => {
                        const metric = METRICS.find((m) => m.id === mId);
                        return (
                          <span key={mId} className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground border border-white/[0.04]">
                            {metric?.label ?? mId}
                          </span>
                        );
                      })}
                      {report.metrics.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground border border-white/[0.04]">
                          +{report.metrics.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <VizIcon className="h-3 w-3" />
                          {VISUALIZATIONS.find((v) => v.id === report.visualization)?.label}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {DATE_RANGES.find((d) => d.id === report.dateRange)?.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.schedule !== 'none' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/15 text-[10px] text-red-400 font-medium">
                            <Clock className="h-2.5 w-2.5" />
                            {report.schedule}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(report.lastRun)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

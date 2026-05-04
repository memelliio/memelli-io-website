'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Clock,
  Bot,
  Calendar,
  AlertCircle,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SlidePanel,
  Spinner,
  Badge,
  StatusBadge,
} from '@memelli/ui';
import type { FilterConfig, FilterValues } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentReport {
  id: string;
  title: string;
  type: string;
  content: string;
  summary?: string;
  metadata?: any;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    role?: { slug: string; department: string };
  };
}

/* ------------------------------------------------------------------ */
/*  Type icon/color map                                                */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  daily_review:    { icon: Calendar,      color: 'text-blue-400',    badgeVariant: 'info' },
  weekly_summary:  { icon: ClipboardList, color: 'text-red-400',  badgeVariant: 'primary' },
  incident:        { icon: AlertCircle,   color: 'text-rose-400',    badgeVariant: 'error' },
  recommendation:  { icon: TrendingUp,    color: 'text-emerald-400', badgeVariant: 'success' },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: FileText, color: 'text-muted-foreground', badgeVariant: 'default' as const };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ReportsPage() {
  const api = useApi();
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({ type: '' });

  // Detail panel
  const [selected, setSelected] = useState<AgentReport | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    params.set('perPage', '50');

    const res = await api.get<any>(`/api/agents/reports?${params.toString()}`);
    if (res.data?.data) setReports(res.data.data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'type',
      label: 'Report Type',
      type: 'select',
      options: [
        { value: 'daily_review', label: 'Daily Review' },
        { value: 'weekly_summary', label: 'Weekly Summary' },
        { value: 'incident', label: 'Incident' },
        { value: 'recommendation', label: 'Recommendation' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agent Reports"
        subtitle="AI-generated reports, reviews, and recommendations"
        breadcrumb={[
          { label: 'AI Company', href: '/dashboard/ai-company' },
          { label: 'Reports' },
        ]}
      />

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ type: '' })}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm tracking-tight">No reports found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const cfg = getTypeConfig(report.type);
            const Icon = cfg.icon;
            return (
              <button
                key={report.id}
                onClick={() => {
                  setSelected(report);
                  setPanelOpen(true);
                }}
                className="flex flex-col rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 text-left transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <Badge variant={cfg.badgeVariant} className="text-[10px]">
                      {report.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-medium text-foreground mb-1.5 line-clamp-1 tracking-tight">
                  {report.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {report.summary ?? report.content}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                  <Bot className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {report.agent?.name ?? 'Unknown Agent'}
                  </span>
                  {report.agent?.role?.department && (
                    <Badge variant="default" className="text-[10px] capitalize">
                      {report.agent.role.department}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Report detail panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelected(null);
        }}
        title={selected?.title ?? 'Report Detail'}
        width="lg"
      >
        {selected && (
          <div className="space-y-6">
            {/* Meta */}
            <div className="flex items-center gap-3">
              <Badge variant={getTypeConfig(selected.type).badgeVariant}>
                {selected.type.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(selected.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Agent */}
            <div>
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Generated By
              </h4>
              <div className="flex items-center gap-2.5">
                <Bot className="h-3.5 w-3.5 text-red-400" />
                <span className="text-sm text-foreground tracking-tight">
                  {selected.agent?.name ?? 'Unknown'}
                </span>
                {selected.agent?.role?.department && (
                  <Badge variant="primary" className="text-[10px] capitalize">
                    {selected.agent.role.department}
                  </Badge>
                )}
              </div>
            </div>

            {/* Summary */}
            {selected.summary && (
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Summary
                </h4>
                <p className="text-sm text-foreground leading-relaxed">{selected.summary}</p>
              </div>
            )}

            {/* Full content */}
            <div>
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Full Report
              </h4>
              <div className="rounded-2xl border border-white/[0.04] bg-background backdrop-blur-xl p-5 text-sm text-foreground max-h-[60vh] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {selected.content}
              </div>
            </div>

            {/* Metadata */}
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Metadata
                </h4>
                <div className="rounded-2xl border border-white/[0.04] bg-background backdrop-blur-xl p-4 text-xs text-muted-foreground font-mono max-h-40 overflow-y-auto">
                  {JSON.stringify(selected.metadata, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

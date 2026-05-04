'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  Send,
  BarChart3,
  Users,
  Activity,
} from 'lucide-react';
import {
  PageHeader,
  Badge,
  StatusBadge,
  Button,
  Skeleton,
  EmptyState,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

interface LeadDetail {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  stage: string;
  score: number;
  city?: string;
  state?: string;
  tags: string[];
  createdAt: string;
  scoreBreakdown?: { factor: string; score: number; weight: number }[];
  outreachHistory?: {
    id: string;
    type: string;
    subject?: string;
    sentAt: string;
    status: string;
  }[];
  notes?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-primary';
}

function getDisplayName(lead: LeadDetail): string {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ');
  return name || lead.email || 'Unknown Lead';
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const api = useApi();

  const { data: lead, isLoading } = useQuery<LeadDetail>({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await api.get<LeadDetail>(`/api/leads/pipeline/${id}`);
      if (res.error) throw new Error(res.error);
      // Transform backend LeadProfile shape to frontend LeadDetail shape
      const raw = res.data as any;
      return {
        id: raw.id,
        firstName: raw.name?.split(' ')[0],
        lastName: raw.name?.split(' ').slice(1).join(' ') || undefined,
        email: raw.email,
        phone: raw.phone,
        company: raw.company,
        source: raw.signal?.source?.type ?? 'unknown',
        stage: raw.score?.tier ?? 'unknown',
        score: raw.score?.totalScore ?? 0,
        city: raw.location?.split(',')[0]?.trim(),
        state: raw.location?.split(',')[1]?.trim(),
        tags: [],
        createdAt: raw.createdAt,
        scoreBreakdown: raw.score?.factors
          ? Object.entries(raw.score.factors).map(([factor, val]: [string, any]) => ({
              factor,
              score: typeof val === 'number' ? val : 0,
              weight: 1,
            }))
          : undefined,
        outreachHistory: raw.outreachMessages?.map((m: any) => ({
          id: m.id,
          type: m.channel ?? m.campaign?.type ?? 'email',
          subject: m.content?.slice(0, 60),
          sentAt: m.sentAt ?? m.createdAt,
          status: m.status,
        })),
        notes: undefined,
      } as LeadDetail;
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      ) : !lead ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Lead not found"
          description="This lead may have been deleted."
        />
      ) : (
        <>
          <PageHeader
            title={getDisplayName(lead)}
            subtitle={lead.company ? `${lead.company}` : undefined}
            breadcrumb={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Leads', href: '/dashboard/leads' },
              { label: getDisplayName(lead) },
            ]}
            actions={
              <div className="flex items-center gap-3">
                {lead.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    onClick={() => {
                      window.location.href = `mailto:${lead.email}`;
                    }}
                  >
                    Email
                  </Button>
                )}
                <div className={`rounded-full border px-3 py-1 text-sm font-semibold tabular-nums backdrop-blur-xl ${
                  lead.score >= 80
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : lead.score >= 60
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : lead.score >= 40
                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                        : 'border-primary/30 bg-primary/10 text-primary'
                }`}>
                  Score: {lead.score}
                </div>
              </div>
            }
            className="mb-8"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultTab="overview">
                <TabList>
                  <Tab id="overview">Overview</Tab>
                  <Tab id="scoring">Score Breakdown</Tab>
                  <Tab id="outreach">Outreach History</Tab>
                </TabList>

                <TabPanels>
                  {/* Overview */}
                  <TabPanel id="overview">
                    <div className="space-y-4 mt-4">
                      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
                        <h4 className="text-sm font-semibold tracking-tight text-foreground mb-3">Contact Information</h4>
                        <div className="space-y-2.5 text-sm">
                          {lead.email && (
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{lead.phone}</span>
                            </div>
                          )}
                          {lead.company && (
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{lead.company}</span>
                            </div>
                          )}
                          {(lead.city || lead.state) && (
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">
                                {[lead.city, lead.state].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {lead.notes && (
                        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
                          <h4 className="text-sm font-semibold tracking-tight text-foreground mb-2">Notes</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                      )}
                    </div>
                  </TabPanel>

                  {/* Scoring */}
                  <TabPanel id="scoring">
                    <div className="mt-4">
                      {lead.scoreBreakdown && lead.scoreBreakdown.length > 0 ? (
                        <div className="space-y-3">
                          {lead.scoreBreakdown.map((item) => (
                            <div
                              key={item.factor}
                              className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-4"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-foreground tracking-tight">{item.factor}</span>
                                <span className={`text-sm font-semibold tabular-nums ${scoreColor(item.score)}`}>
                                  {item.score}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/80 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(item.score, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5">Weight: {item.weight}x</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<BarChart3 className="h-5 w-5" />}
                          title="No score breakdown"
                          description="Score breakdown will be available after enrichment."
                          className="border-0 bg-transparent py-10"
                        />
                      )}
                    </div>
                  </TabPanel>

                  {/* Outreach History */}
                  <TabPanel id="outreach">
                    <div className="mt-4">
                      {lead.outreachHistory && lead.outreachHistory.length > 0 ? (
                        <div className="space-y-3">
                          {lead.outreachHistory.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium tracking-tight text-foreground">
                                    {item.subject || `${item.type} outreach`}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="default" className="capitalize">{item.type}</Badge>
                                    <StatusBadge status={item.status} />
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.sentAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<Activity className="h-5 w-5" />}
                          title="No outreach yet"
                          description="Outreach messages will appear here."
                          className="border-0 bg-transparent py-10"
                        />
                      )}
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Identity Card */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 shadow-lg shadow-black/10">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Identity</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <Badge variant="default" className="capitalize">{lead.source}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stage</span>
                    <StatusBadge status={lead.stage} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {lead.tags.length > 0 && (
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 shadow-lg shadow-black/10">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Score */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 shadow-lg shadow-black/10">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Lead Score</h3>
                <div className="flex items-center justify-center">
                  <div className={`text-4xl font-bold tabular-nums tracking-tight ${scoreColor(lead.score)}`}>
                    {lead.score}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {lead.score >= 80
                    ? 'Hot Lead'
                    : lead.score >= 60
                      ? 'Warm Lead'
                      : lead.score >= 40
                        ? 'Cool Lead'
                        : 'Cold Lead'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Instagram,
  Search,
  ExternalLink,
  Users,
  Sparkles,
  Plus,
  Filter,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Card,
  CardContent,
  Badge,
  Skeleton,
  EmptyState,
  Select,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ClassifiedProfile {
  username: string;
  fullName: string;
  bio?: string;
  followers: number;
  classification: string;
  confidence: number;
  score: number;
  tags: string[];
  profileUrl: string;
}

interface DiscoverResponse {
  success: boolean;
  data: ClassifiedProfile[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CLASSIFICATION_OPTIONS = [
  { value: 'all', label: 'All Classifications' },
  { value: 'hot_lead', label: 'Hot Lead' },
  { value: 'warm_lead', label: 'Warm Lead' },
  { value: 'cold_lead', label: 'Cold Lead' },
  { value: 'high_intent', label: 'High Intent' },
  { value: 'medium_intent', label: 'Medium Intent' },
  { value: 'low_intent', label: 'Low Intent' },
  { value: 'business', label: 'Business' },
  { value: 'not_relevant', label: 'Not Relevant' },
];

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (score >= 40) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

function classificationVariant(
  classification: string,
): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'muted' {
  switch (classification.toLowerCase()) {
    case 'hot_lead':
    case 'high_intent':
      return 'success';
    case 'warm_lead':
    case 'medium_intent':
      return 'warning';
    case 'cold_lead':
    case 'low_intent':
      return 'error';
    case 'not_relevant':
      return 'muted';
    case 'business':
      return 'primary';
    default:
      return 'info';
  }
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function InstagramDiscoveryPage() {
  const api = useApi();

  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<ClassifiedProfile[]>([]);
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [addingToPipeline, setAddingToPipeline] = useState<Set<string>>(new Set());

  /* ---- Discover mutation ---- */
  const searchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<DiscoverResponse>(
        '/api/leads/instagram/discover',
        { query: searchQuery },
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data: any) => {
      // useApi auto-unwraps { success, data } -- data is already ClassifiedProfile[]
      const profiles = Array.isArray(data) ? data : data?.data ?? [];
      setProfiles(profiles);
      setClassificationFilter('all');
      if (profiles.length === 0) {
        toast.info('No matching profiles found');
      } else {
        toast.success(`Found ${profiles.length} profile${profiles.length > 1 ? 's' : ''}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Discovery failed');
    },
  });

  /* ---- Add to pipeline ---- */
  function togglePipelineLoading(username: string, loading: boolean) {
    setAddingToPipeline((prev) => {
      const next = new Set(prev);
      if (loading) next.add(username);
      else next.delete(username);
      return next;
    });
  }

  async function handleAddToPipeline(profile: ClassifiedProfile) {
    togglePipelineLoading(profile.username, true);
    const res = await api.post('/api/leads/pipeline', {
      source: 'instagram',
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      followers: profile.followers,
      classification: profile.classification,
      score: profile.score,
      tags: profile.tags,
      profileUrl: profile.profileUrl,
    });
    togglePipelineLoading(profile.username, false);

    if (res.error) {
      toast.error(`Failed to add @${profile.username}: ${res.error}`);
    } else {
      toast.success(`@${profile.username} added to pipeline`);
    }
  }

  /* ---- Filtered profiles ---- */
  const filteredProfiles = useMemo(() => {
    if (classificationFilter === 'all') return profiles;
    return profiles.filter(
      (p) => p.classification.toLowerCase() === classificationFilter,
    );
  }, [profiles, classificationFilter]);

  /* ---- Render ---- */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Instagram Discovery"
        subtitle="Search and classify Instagram profiles as potential leads"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Instagram' },
        ]}
        className="mb-8"
      />

      {/* ---- Search Bar ---- */}
      <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10 mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Instagram className="h-4 w-4 text-pink-400" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Profile Search</h3>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by username, hashtag, or keyword... e.g. 'credit repair Atlanta'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    searchMutation.mutate();
                  }
                }}
              />
            </div>
            <Button
              variant="primary"
              leftIcon={<Search className="h-3.5 w-3.5" />}
              onClick={() => searchMutation.mutate()}
              isLoading={searchMutation.isPending}
              disabled={!searchQuery.trim()}
            >
              Discover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---- Filter Row ---- */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              options={CLASSIFICATION_OPTIONS}
              value={classificationFilter}
              onChange={(val) => setClassificationFilter(val)}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              {filteredProfiles.length} of {profiles.length} profiles
            </span>
          </div>
        </div>
      )}

      {/* ---- Results ---- */}
      {searchMutation.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={<Instagram className="h-6 w-6" />}
          title="Discover leads on Instagram"
          description="Enter a search query above to find and classify potential leads."
          className="mt-8"
        />
      ) : filteredProfiles.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-6 w-6" />}
          title="No profiles match this filter"
          description="Try a different classification filter or broaden your search."
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProfiles.map((profile) => (
            <Card
              key={profile.username}
              className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-black/10"
            >
              <CardContent className="p-5">
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-lg shadow-red-500/20">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                        {profile.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                  </div>
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-150 shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Bio Preview */}
                {profile.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{profile.bio}</p>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {formatFollowers(profile.followers)} followers
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {(profile.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>

                {/* Classification + Score */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={classificationVariant(profile.classification)}>
                    {profile.classification.replace(/_/g, ' ')}
                  </Badge>
                  <span
                    className={`text-sm font-semibold tabular-nums rounded-full border px-2 py-0.5 backdrop-blur-xl ${scoreColor(profile.score)}`}
                  >
                    {profile.score}
                  </span>
                </div>

                {/* Tags */}
                {profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {profile.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                    {profile.tags.length > 4 && (
                      <Badge variant="default">+{profile.tags.length - 4}</Badge>
                    )}
                  </div>
                )}

                {/* Add to Pipeline */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  isLoading={addingToPipeline.has(profile.username)}
                  onClick={() => handleAddToPipeline(profile)}
                >
                  Add to Pipeline
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

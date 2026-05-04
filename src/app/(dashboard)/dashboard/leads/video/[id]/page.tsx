'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Download,
  Share2,
  Copy,
  Video,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  StatusBadge,
  Skeleton,
  EmptyState,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface VideoDetail {
  id: string;
  prompt: string;
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
  fileSize?: string;
  createdAt: string;
  completedAt?: string;
}

export default function VideoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const api = useApi();

  const { data: video, isLoading } = useQuery<VideoDetail>({
    queryKey: ['lead-video', id],
    queryFn: async () => {
      const res = await api.get<VideoDetail>(`/api/leads/video/${id}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const handleDownload = () => {
    if (video?.videoUrl) {
      const a = document.createElement('a');
      a.href = video.videoUrl;
      a.download = `lead-video-${video.id}.mp4`;
      a.click();
    }
  };

  const handleCopyLink = () => {
    if (video?.videoUrl) {
      navigator.clipboard.writeText(video.videoUrl);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Video Preview"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Video', href: '/dashboard/leads/video' },
          { label: 'Preview' },
        ]}
        actions={
          video?.videoUrl ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy className="h-3.5 w-3.5" />}
                onClick={handleCopyLink}
              >
                Copy Link
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </div>
          ) : undefined
        }
        className="mb-8"
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : !video ? (
        <EmptyState
          icon={<Video className="h-6 w-6" />}
          title="Video not found"
          description="This video may have been deleted or the link is invalid."
        />
      ) : (
        <div className="space-y-6">
          {/* Video Player */}
          <div className="rounded-2xl border border-white/[0.04] bg-background backdrop-blur-xl overflow-hidden shadow-lg shadow-black/30">
            {video.videoUrl ? (
              <video
                src={video.videoUrl}
                controls
                poster={video.thumbnailUrl}
                className="w-full aspect-video"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-white/[0.02] backdrop-blur-xl">
                <div className="text-center">
                  <Video className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <StatusBadge status={video.status} />
                  <p className="text-sm text-muted-foreground mt-2 tracking-tight">
                    {video.status === 'processing'
                      ? 'Your video is being generated...'
                      : 'Video is not available.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/10">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Video Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Prompt</p>
                  <p className="text-sm text-foreground mt-0.5 tracking-tight">{video.prompt}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm text-foreground tracking-tight">{new Date(video.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {video.duration != null && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm text-foreground tracking-tight">{video.duration}s</p>
                    </div>
                  </div>
                )}
                {video.resolution && (
                  <div className="flex items-center gap-3">
                    <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Resolution</p>
                      <p className="text-sm text-foreground tracking-tight">{video.resolution}</p>
                    </div>
                  </div>
                )}
                {video.fileSize && (
                  <div className="flex items-center gap-3">
                    <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">File Size</p>
                      <p className="text-sm text-foreground tracking-tight">{video.fileSize}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <StatusBadge status={video.status} />
          </div>
        </div>
      )}
    </div>
  );
}

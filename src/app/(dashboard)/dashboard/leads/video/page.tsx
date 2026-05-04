'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Video,
  Play,
  Sparkles,
  Download,
  CheckCircle2,
  Circle,
  User,
  Image,
  Film,
  FileText,
  Clock
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Textarea,
  Input,
  Card,
  CardContent,
  ProgressBar,
  Badge,
  Skeleton
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GenerationStep = 'idle' | 'script' | 'character' | 'scene' | 'video' | 'done' | 'error';

interface VideoGeneration {
  id: string;
  script: string;
  characterDescription: string;
  sceneDescription: string;
  status: string;
  step?: GenerationStep;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  error?: string;
}

interface GenerateResponse {
  success: boolean;
  data: {
    id: string;
    videoUrl?: string;
  };
}

interface GenerationsResponse {
  success: boolean;
  data: VideoGeneration[];
}

/* ------------------------------------------------------------------ */
/*  Progress Steps                                                     */
/* ------------------------------------------------------------------ */

const STEPS: { key: GenerationStep; label: string; icon: React.ReactNode }[] = [
  { key: 'script', label: 'Generating Script', icon: <FileText className="h-4 w-4" /> },
  { key: 'character', label: 'Creating Character', icon: <User className="h-4 w-4" /> },
  { key: 'scene', label: 'Building Scene', icon: <Image className="h-4 w-4" /> },
  { key: 'video', label: 'Rendering Video', icon: <Film className="h-4 w-4" /> },
];

function stepIndex(step: GenerationStep): number {
  const idx = STEPS.findIndex((s) => s.key === step);
  return idx === -1 ? (step === 'done' ? STEPS.length : -1) : idx;
}

function StepIndicator({ currentStep }: { currentStep: GenerationStep }) {
  const current = stepIndex(currentStep);
  const isDone = currentStep === 'done';
  const isError = currentStep === 'error';

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => {
        const isActive = i === current && !isDone && !isError;
        const isComplete = i < current || isDone;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                isComplete
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : isActive
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground'
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isActive ? (
                <LoadingGlobe size="sm" />
              ) : (
                step.icon
              )}
            </div>
            <span
              className={`text-sm font-medium tracking-tight ${
                isComplete
                  ? 'text-emerald-400'
                  : isActive
                    ? 'text-red-300'
                    : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
            {isActive && (
              <Badge variant="default" className="ml-auto text-xs bg-red-500/10 text-red-300 border-red-500/20 backdrop-blur-xl">
                In Progress
              </Badge>
            )}
            {isComplete && (
              <Badge variant="default" className="ml-auto text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/20 backdrop-blur-xl">
                Complete
              </Badge>
            )}
          </div>
        );
      })}

      {/* Progress bar */}
      <div className="pt-2">
        <ProgressBar
          value={isDone ? 100 : isError ? 0 : ((current + 0.5) / STEPS.length) * 100}
          color={isDone ? 'success' : isError ? 'error' : 'primary'}
          size="lg"
          indeterminate={!isDone && !isError && current >= 0}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function VideoGeneratorPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [script, setScript] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [currentStep, setCurrentStep] = useState<GenerationStep>('idle');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch recent generations
  const { data, isLoading } = useQuery<{ data: VideoGeneration[]; meta: { total: number; page: number; perPage: number } }>({
    queryKey: ['lead-videos'],
    queryFn: async () => {
      const res = await api.get<{ data: VideoGeneration[]; meta: { total: number; page: number; perPage: number } }>('/api/leads/video');
      if (res.error) throw new Error(res.error);
      return res.data!;
    }
  });

  // Poll for job status
  useEffect(() => {
    if (!activeJobId || currentStep === 'done' || currentStep === 'error') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get<VideoGeneration>(
          `/api/leads/video/${activeJobId}`
        );
        if (res.data) {
          const job = res.data as any;
          if (job.step) setCurrentStep(job.step);
          if (job.status === 'completed' || job.step === 'done') {
            setCurrentStep('done');
            setGeneratedVideoUrl(job.videoUrl ?? null);
            setActiveJobId(null);
            queryClient.invalidateQueries({ queryKey: ['lead-videos'] });
            toast.success('Video generated successfully!');
          }
          if (job.status === 'failed' || job.step === 'error') {
            setCurrentStep('error');
            setActiveJobId(null);
            toast.error(job.error || 'Video generation failed');
          }
        }
      } catch {
        // silent poll failure
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeJobId, currentStep]);

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<any>('/api/leads/video', {
        prompt: script,
        metadata: { characterDescription, sceneDescription }
      });
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (res) => {
      setCurrentStep('script');
      setGeneratedVideoUrl(null);
      if (res?.id) {
        setActiveJobId(res.id);
      }
      toast.success('Video generation started');
    },
    onError: (err) => {
      setCurrentStep('error');
      toast.error(err.message || 'Failed to start video generation');
    }
  });

  const isGenerating = currentStep !== 'idle' && currentStep !== 'done' && currentStep !== 'error';
  const canSubmit = script.trim().length > 0 && !isGenerating && !generateMutation.isPending;
  const generations = data?.data ?? [];

  const handleReset = () => {
    setCurrentStep('idle');
    setGeneratedVideoUrl(null);
    setActiveJobId(null);
    setScript('');
    setCharacterDescription('');
    setSceneDescription('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Video Generator"
        subtitle="Create AI-powered lead engagement videos with character and scene control"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Video' },
        ]}
        className="mb-8"
      />

      {/* ---- Generator Form ---- */}
      <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-red-400" />
            <h3 className="text-base font-semibold tracking-tight text-foreground">Generate New Video</h3>
          </div>

          <div className="space-y-4">
            {/* Script */}
            <div>
              <label className="text-sm font-medium tracking-tight text-foreground mb-1.5 block">
                Video Script
              </label>
              <Textarea
                placeholder="Write or describe the script for your video... e.g. 'Create a personalized outreach video for credit repair leads in Atlanta highlighting our 90-day program'"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={4}
                disabled={isGenerating}
              />
            </div>

            {/* Character + Scene side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Character Description"
                placeholder="e.g. Professional woman in business attire, mid-30s, warm smile"
                value={characterDescription}
                onChange={(e) => setCharacterDescription(e.target.value)}
                disabled={isGenerating}
              />
              <Input
                label="Scene Description"
                placeholder="e.g. Modern office with city skyline, warm lighting, clean desk"
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              {currentStep !== 'idle' && (
                <Button variant="ghost" onClick={handleReset} disabled={isGenerating}>
                  Reset
                </Button>
              )}
              <div className="ml-auto">
                <Button
                  variant="primary"
                  leftIcon={
                    generateMutation.isPending ? (
                      <LoadingGlobe size="sm" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )
                  }
                  onClick={() => generateMutation.mutate()}
                  disabled={!canSubmit}
                >
                  {generateMutation.isPending ? 'Starting...' : 'Generate Video'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Progress Steps ---- */}
      {currentStep !== 'idle' && (
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-5">
              <Film className="h-5 w-5 text-red-400" />
              <h3 className="text-base font-semibold tracking-tight text-foreground">Generation Progress</h3>
            </div>
            <StepIndicator currentStep={currentStep} />
          </CardContent>
        </Card>
      )}

      {/* ---- Video Preview ---- */}
      <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-5">
            <Play className="h-5 w-5 text-red-400" />
            <h3 className="text-base font-semibold tracking-tight text-foreground">Preview</h3>
          </div>

          {generatedVideoUrl ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-background aspect-video">
                <video
                  src={generatedVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster=""
                />
              </div>
              <div className="flex justify-end">
                <a href={generatedVideoUrl} download target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="primary"
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Download Video
                  </Button>
                </a>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <LoadingGlobe size="xl" />
              <p className="text-sm tracking-tight">Your video is being generated...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take a few minutes</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] backdrop-blur-xl">
              <Video className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground tracking-tight">No video yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fill out the form above and click Generate Video
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Recent Generations ---- */}
      <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-5 w-5 text-red-400" />
            <h3 className="text-base font-semibold tracking-tight text-foreground">Recent Generations</h3>
            <Badge variant="default" className="ml-auto text-xs bg-white/[0.04] text-muted-foreground border-white/[0.06] backdrop-blur-xl">
              {generations.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Video className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm tracking-tight">No videos generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your generated videos will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generations.map((gen) => {
                const isCompleted = gen.status === 'completed' || gen.step === 'done';
                const isFailed = gen.status === 'failed' || gen.step === 'error';
                const isProcessing = !isCompleted && !isFailed;

                return (
                  <div
                    key={gen.id}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-4 hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Thumbnail / status icon */}
                    <div className="relative h-14 w-24 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
                      {gen.thumbnailUrl ? (
                        <img
                          src={gen.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : isProcessing ? (
                        <LoadingGlobe size="sm" />
                      ) : isFailed ? (
                        <Circle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Video className="h-5 w-5 text-muted-foreground" />
                      )}
                      {gen.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background">
                          <Play className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground tracking-tight line-clamp-1">
                        {gen.script || 'Untitled video'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant="default"
                          className={`text-xs backdrop-blur-xl ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isFailed
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {isCompleted ? 'Completed' : isFailed ? 'Failed' : 'Processing'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(gen.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {gen.videoUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Play className="h-3.5 w-3.5" />}
                            onClick={() => setGeneratedVideoUrl(gen.videoUrl!)}
                          >
                            Preview
                          </Button>
                          <a
                            href={gen.videoUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Download className="h-3.5 w-3.5" />}
                            >
                              Download
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Pause,
  Download,
  SmilePlus,
  Frown,
  Meh,
  Clock,
  Save,
} from 'lucide-react';
import {
  Badge,
  Button,
  Skeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Textarea,
  Select,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';

interface CallDetail {
  id: string;
  direction: 'inbound' | 'outbound';
  contactName: string;
  phoneNumber: string;
  duration: number;
  status: string;
  createdAt: string;
  recordingUrl?: string | null;
  transcript?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  disposition?: string | null;
  notes?: string | null;
}

type CallResponse = CallDetail;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const sentimentConfig = {
  positive: { Icon: SmilePlus, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Positive' },
  neutral: { Icon: Meh, color: 'text-zinc-400', bg: 'bg-zinc-400/10', label: 'Neutral' },
  negative: { Icon: Frown, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Negative' },
};

const dispositionOptions = [
  { value: '', label: 'Select disposition...' },
  { value: 'interested', label: 'Interested' },
  { value: 'not-interested', label: 'Not Interested' },
  { value: 'callback', label: 'Callback Requested' },
  { value: 'left-voicemail', label: 'Left Voicemail' },
  { value: 'wrong-number', label: 'Wrong Number' },
  { value: 'completed', label: 'Completed' },
  { value: 'follow-up', label: 'Follow Up Needed' },
];

export function CallDetailPanel() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedRecord } = useWorkspacePanel();
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);

  const callId = selectedRecord?.id;

  const { data, isLoading } = useQuery<CallResponse>({
    queryKey: ['call', callId],
    queryFn: async () => {
      const res = await api.get<CallResponse>(`/api/comms/calls/${callId}`);
      if (res.error) throw new Error(res.error);
      const result = res.data!;
      if (!notesInitialized) {
        setNotes(result.notes ?? '');
        setDisposition(result.disposition ?? '');
        setNotesInitialized(true);
      }
      return result;
    },
    enabled: !!callId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/comms/calls/${callId}`, {
        notes,
        disposition,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Call notes saved');
      queryClient.invalidateQueries({ queryKey: ['call', callId] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
    onError: () => {
      toast.error('Failed to save notes');
    },
  });

  if (!callId) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const call = data;
  if (!call) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        Call not found.
      </div>
    );
  }

  const DirIcon = call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing;
  const sentimentCfg = call.sentiment ? sentimentConfig[call.sentiment] : null;

  return (
    <div className="space-y-6">
      {/* Call Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-red-600/15 p-3 text-red-400">
          <Phone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-100">{call.contactName}</h3>
          <p className="text-sm text-zinc-400 font-mono">{call.phoneNumber}</p>
          <div className="flex items-center gap-2 mt-2">
            <DirIcon className={`h-3.5 w-3.5 ${call.direction === 'inbound' ? 'text-blue-400' : 'text-emerald-400'}`} />
            <span className="text-xs text-zinc-500 capitalize">{call.direction}</span>
            <span className="text-zinc-700">|</span>
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">{formatDuration(call.duration)}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-xs text-zinc-500">
              {new Date(call.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Sentiment Indicator */}
      {sentimentCfg && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 ${sentimentCfg.bg}`}>
          <sentimentCfg.Icon className={`h-4 w-4 ${sentimentCfg.color}`} />
          <span className={`text-sm font-medium ${sentimentCfg.color}`}>
            {sentimentCfg.label} Sentiment
          </span>
        </div>
      )}

      <Tabs defaultTab="recording">
        <TabList>
          <Tab id="recording">Recording</Tab>
          <Tab id="transcript">Transcript</Tab>
          <Tab id="notes">Notes</Tab>
        </TabList>

        <TabPanels>
          {/* Recording Tab */}
          <TabPanel id="recording">
            {call.recordingUrl ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <audio
                    src={call.recordingUrl}
                    controls
                    className="w-full"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
                <div className="flex gap-2">
                  <a href={call.recordingUrl} download>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-3.5 w-3.5" />}
                    >
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Phone className="h-8 w-8 mb-3 text-zinc-600" />
                <p className="text-sm">No recording available</p>
              </div>
            )}
          </TabPanel>

          {/* Transcript Tab */}
          <TabPanel id="transcript">
            {call.transcript ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 max-h-80 overflow-y-auto">
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {call.transcript}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <p className="text-sm">No transcript available</p>
                <p className="text-xs text-zinc-600 mt-1">Transcripts are generated automatically from recordings</p>
              </div>
            )}
          </TabPanel>

          {/* Notes Tab */}
          <TabPanel id="notes">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Disposition
                </label>
                <Select
                  value={disposition}
                  onChange={(val) => setDisposition(val)}
                  options={dispositionOptions}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add call notes..."
                  rows={6}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-3.5 w-3.5" />}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

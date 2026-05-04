'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Mail,
  Reply,
  Forward,
  Trash2,
  Paperclip,
  Clock,
  Archive,
} from 'lucide-react';
import {
  Button,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';

interface EmailDetail {
  id: string;
  subject: string;
  from: string;
  to: string;
  cc?: string | null;
  body: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: { id: string; name: string; size: number; url: string }[];
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

type EmailResponse = EmailDetail;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EmailDetailPanel() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedRecord, closeRecord } = useWorkspacePanel();

  const emailId = selectedRecord?.id;

  const { data, isLoading } = useQuery<EmailResponse>({
    queryKey: ['email', emailId],
    queryFn: async () => {
      const res = await api.get<EmailResponse>(`/api/comms/email/${emailId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!emailId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.del(`/api/comms/email/${emailId}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Email deleted');
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      closeRecord();
    },
    onError: () => {
      toast.error('Failed to delete email');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/comms/email/${emailId}`, {
        archived: true,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Email archived');
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      closeRecord();
    },
    onError: () => {
      toast.error('Failed to archive email');
    },
  });

  if (!emailId) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const email = data;
  if (!email) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        Email not found.
      </div>
    );
  }

  const handleReply = () => {
    const params = new URLSearchParams({
      replyTo: email.id,
      to: email.direction === 'inbound' ? email.from : email.to,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
    });
    router.push(`/dashboard/communications/email/compose?${params}`);
  };

  const handleForward = () => {
    const params = new URLSearchParams({
      forward: email.id,
      subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
    });
    router.push(`/dashboard/communications/email/compose?${params}`);
  };

  return (
    <div className="space-y-5">
      {/* Subject */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{email.subject}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={email.direction === 'inbound' ? 'info' : 'primary'}>
            {email.direction === 'inbound' ? 'Received' : 'Sent'}
          </Badge>
          {email.hasAttachments && (
            <Badge variant="default">
              <Paperclip className="h-3 w-3 mr-1" />
              Attachments
            </Badge>
          )}
        </div>
      </div>

      {/* From / To / Date */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">From</span>
          <span className="text-zinc-100">{email.from}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">To</span>
          <span className="text-zinc-100">{email.to}</span>
        </div>
        {email.cc && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">CC</span>
            <span className="text-zinc-100">{email.cc}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Date</span>
          <span className="text-zinc-100 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            {new Date(email.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Reply className="h-3.5 w-3.5" />}
          onClick={handleReply}
        >
          Reply
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Forward className="h-3.5 w-3.5" />}
          onClick={handleForward}
        >
          Forward
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Archive className="h-3.5 w-3.5" />}
          onClick={() => archiveMutation.mutate()}
          disabled={archiveMutation.isPending}
        >
          Archive
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </Button>
      </div>

      {/* Email body */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <div
          className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-zinc-500" />
            Attachments ({email.attachments.length})
          </h4>
          <div className="space-y-1.5">
            {email.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors"
              >
                <span className="text-sm text-zinc-100 truncate">{attachment.name}</span>
                <span className="text-xs text-zinc-500 shrink-0 ml-3">
                  {formatFileSize(attachment.size)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { useAuth } from '../../../../../../contexts/auth';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@memelli/ui';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DocumentDetail {
  id: string;
  fileName: string;
  docType: string;
  status: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  fileKey: string;
  notes: string | null;
  userId: string;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DOC_TYPE_LABELS: Record<string, string> = {
  drivers_license: "Driver's License",
  pay_stub: 'Pay Stub',
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  utility_bill: 'Utility Bill',
  ssn_card: 'SSN Card',
  other: 'Other'
};

function statusConfig(status: string) {
  switch (status) {
    case 'verified':
      return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06] border-emerald-500/20', label: 'Verified' };
    case 'rejected':
      return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/[0.06] border-red-500/20', label: 'Rejected' };
    default:
      return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/[0.06] border-amber-500/20', label: 'Pending Review' };
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const api = useApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const docId = params.id as string;

  const isAdmin = (user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPER_ADMIN';

  const { data: doc, isLoading } = useQuery<DocumentDetail>({
    queryKey: ['document', docId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DocumentDetail }>(`/api/documents/${docId}`);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load');
      return res.data.data;
    },
    staleTime: 60_000
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.patch<{ success: boolean }>(`/api/documents/${docId}/status`, { status: newStatus });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
      queryClient.invalidateQueries({ queryKey: ['credit-documents'] });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 mx-auto max-w-3xl">
        <Skeleton variant="line" height={32} />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <XCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Document not found</p>
        <button
          onClick={() => router.push('/dashboard/credit/documents')}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Back to documents
        </button>
      </div>
    );
  }

  const status = statusConfig(doc.status);
  const StatusIcon = status.icon;
  const isImage = doc.mimeType.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/credit/documents')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Documents
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{doc.fileName}</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.bg}`}>
            <StatusIcon className={`h-3.5 w-3.5 ${status.color}`} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Preview */}
      <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Document Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isImage ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-4">
              <img
                src={`${api.baseUrl}/api/documents/${doc.id}/download`}
                alt={doc.fileName}
                className="max-h-[500px] rounded-xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <iframe
                src={`${api.baseUrl}/api/documents/${doc.id}/download`}
                className="w-full h-[600px]"
                title={doc.fileName}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
              <a
                href={`${api.baseUrl}/api/documents/${doc.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Download file
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="tracking-tight font-semibold text-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <MetaRow label="Document Type" value={DOC_TYPE_LABELS[doc.docType] ?? doc.docType} />
            <MetaRow label="Status" value={doc.status.charAt(0).toUpperCase() + doc.status.slice(1)} />
            <MetaRow label="File Size" value={formatSize(doc.fileSize)} />
            <MetaRow label="MIME Type" value={doc.mimeType} />
            <MetaRow label="Uploaded" value={formatDate(doc.createdAt)} />
            <MetaRow label="Document ID" value={doc.id} mono />
          </div>
          {doc.notes && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{doc.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin actions */}
      {isAdmin && (
        <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="tracking-tight font-semibold text-foreground">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {statusMutation.error && (
              <div className="mb-4 flex gap-2 rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
                <p className="text-sm text-red-300">{(statusMutation.error as Error).message}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => statusMutation.mutate('verified')}
                disabled={statusMutation.isPending || doc.status === 'verified'}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-all duration-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusMutation.isPending ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Verify
              </button>
              <button
                onClick={() => statusMutation.mutate('rejected')}
                disabled={statusMutation.isPending || doc.status === 'rejected'}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusMutation.isPending ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download */}
      <div className="flex justify-end">
        <a
          href={`${api.baseUrl}/api/documents/${doc.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card backdrop-blur-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Meta row                                                           */
/* ------------------------------------------------------------------ */

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm text-muted-foreground leading-relaxed ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Upload, ArrowLeft } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { DataTable, type DataTableColumn } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserDocument {
  id: string;
  fileName: string;
  docType: string;
  status: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
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
  other: 'Other',
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/[0.06] text-amber-400 border-amber-500/20',
    verified: 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/[0.06] text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreditDocumentsPage() {
  const api = useApi();
  const router = useRouter();

  const { data: documents, isLoading } = useQuery<UserDocument[]>({
    queryKey: ['credit-documents'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: UserDocument[] }>('/api/documents');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load');
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  const columns: DataTableColumn<UserDocument>[] = [
    {
      header: 'Name',
      accessor: 'fileName',
      render: (row) => (
        <button
          onClick={() => router.push(`/dashboard/credit/documents/${row.id}`)}
          className="text-sm font-medium tracking-tight text-foreground hover:text-primary transition-colors duration-200 truncate max-w-[200px] block"
        >
          {row.fileName}
        </button>
      ),
    },
    {
      header: 'Type',
      accessor: 'docType',
      render: (row) => <span className="text-sm text-muted-foreground">{DOC_TYPE_LABELS[row.docType] ?? row.docType}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => statusBadge(row.status),
    },
    {
      header: 'Uploaded',
      accessor: 'createdAt',
      render: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Size',
      accessor: 'fileSize',
      render: (row) => <span className="text-xs text-muted-foreground">{formatSize(row.fileSize)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/credit')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Credit Engine
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Manage uploaded identity and financial documents</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/credit/documents/upload')}
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-medium tracking-tight text-white shadow-lg shadow-red-500/20 transition-all duration-200"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={documents ?? []}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
              <button
                onClick={() => router.push('/dashboard/credit/documents/upload')}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Upload your first document
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}

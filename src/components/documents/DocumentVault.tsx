'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  Upload,
  FileText,
  Image,
  File,
  Eye,
  Pencil,
  Trash2,
  Download,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
  GripVertical,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  docType: string;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  createdAt: string;
  contactId?: string;
}

interface DocumentVaultProps {
  contactId?: string;
  allowUpload?: boolean;
  allowEdit?: boolean;
  compact?: boolean;
  onDocumentUploaded?: (doc: any) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DOC_TYPES = [
  'ID / Drivers License',
  'Pay Stub',
  'Bank Statement',
  'Tax Return',
  'Utility Bill',
  'SSN Card',
  'Business Document',
  'Signed Authorization',
  'Other',
] as const;

type DocType = (typeof DOC_TYPES)[number];

/** Map display labels to backend-accepted snake_case values */
const DOC_TYPE_TO_API: Record<string, string> = {
  'ID / Drivers License': 'drivers_license',
  'Pay Stub': 'pay_stub',
  'Bank Statement': 'bank_statement',
  'Tax Return': 'tax_return',
  'Utility Bill': 'utility_bill',
  'SSN Card': 'ssn_card',
  'Business Document': 'other',
  'Signed Authorization': 'other',
  'Other': 'other',
};

/** Map backend snake_case values back to display labels */
const API_TO_DOC_TYPE: Record<string, DocType> = {
  'drivers_license': 'ID / Drivers License',
  'pay_stub': 'Pay Stub',
  'bank_statement': 'Bank Statement',
  'tax_return': 'Tax Return',
  'utility_bill': 'Utility Bill',
  'ssn_card': 'SSN Card',
  'other': 'Other',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  'ID / Drivers License': 'bg-blue-600/20 text-blue-400',
  'Pay Stub': 'bg-emerald-600/20 text-emerald-400',
  'Bank Statement': 'bg-red-600/20 text-red-400',
  'Tax Return': 'bg-amber-600/20 text-amber-400',
  'Utility Bill': 'bg-cyan-600/20 text-cyan-400',
  'SSN Card': 'bg-red-600/20 text-red-400',
  'Business Document': 'bg-indigo-600/20 text-indigo-400',
  'Signed Authorization': 'bg-pink-600/20 text-pink-400',
  Other: 'bg-zinc-600/20 text-zinc-400',
};

const STATUS_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-yellow-500/20 text-yellow-500', icon: <Clock className="w-3 h-3" /> },
  verified: { bg: 'bg-green-500/20 text-green-500', icon: <Check className="w-3 h-3" /> },
  rejected: { bg: 'bg-red-500/20 text-red-500', icon: <AlertCircle className="w-3 h-3" /> },
};

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileType: string) {
  return fileType.startsWith('image/');
}

function isPdf(fileType: string) {
  return fileType === 'application/pdf';
}

function fileIcon(fileType: string) {
  if (isImage(fileType)) return <Image className="w-8 h-8 text-blue-400" />;
  if (isPdf(fileType)) return <FileText className="w-8 h-8 text-red-400" />;
  return <File className="w-8 h-8 text-zinc-400" />;
}

/* ------------------------------------------------------------------ */
/*  Upload Form (inline modal after file selection)                    */
/* ------------------------------------------------------------------ */

interface UploadFormProps {
  files: File[];
  onSubmit: (docType: DocType, notes: string) => void;
  onCancel: () => void;
  uploading: boolean;
  progress: number;
}

function UploadForm({ files, onSubmit, onCancel, uploading, progress }: UploadFormProps) {
  const [docType, setDocType] = useState<DocType>('Other');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Upload Documents</h3>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-400">
          {files.length} file{files.length > 1 ? 's' : ''} selected
        </p>

        <ul className="mb-4 max-h-32 space-y-1 overflow-y-auto text-sm text-zinc-300">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 truncate">
              {fileIcon(f.type)}
              <span className="truncate">{f.name}</span>
              <span className="ml-auto shrink-0 text-zinc-500">{formatSize(f.size)}</span>
            </li>
          ))}
        </ul>

        {/* Document type */}
        <label className="mb-1 block text-sm font-medium text-zinc-300">Document Type</label>
        <div className="relative mb-4">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-zinc-400" />
        </div>

        {/* Notes */}
        <label className="mb-1 block text-sm font-medium text-zinc-300">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mb-4 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          placeholder="Add optional notes..."
        />

        {/* Progress */}
        {uploading && (
          <div className="mb-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">{Math.round(progress)}% uploaded</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(docType, notes)}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View Modal                                                         */
/* ------------------------------------------------------------------ */

interface ViewModalProps {
  doc: Document;
  baseUrl: string;
  onClose: () => void;
}

function ViewModal({ doc, baseUrl, onClose }: ViewModalProps) {
  const downloadUrl = `${baseUrl}/api/documents/${doc.id}/download`;
  const statusStyle = STATUS_STYLES[doc.status] ?? STATUS_STYLES.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-[90vw] max-w-5xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            {fileIcon(doc.mimeType)}
            <div>
              <p className="font-medium text-white">{doc.fileName}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${DOC_TYPE_COLORS[doc.docType] ?? DOC_TYPE_COLORS.Other}`}>
                  {doc.docType}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg}`}>
                  {statusStyle.icon}
                  {doc.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          {isImage(doc.mimeType) ? (
            <img
              src={downloadUrl}
              alt={doc.fileName}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          ) : isPdf(doc.mimeType) ? (
            <iframe
              src={downloadUrl}
              title={doc.fileName}
              className="h-full w-full rounded-lg border border-zinc-700"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              {fileIcon(doc.mimeType)}
              <p className="text-zinc-300">{doc.fileName}</p>
              <p className="text-sm text-zinc-500">{formatSize(doc.fileSize)}</p>
              <a
                href={downloadUrl}
                download
                className="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm Dialog                                                     */
/* ------------------------------------------------------------------ */

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <p className="mb-4 text-sm text-zinc-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function DocumentVault({
  contactId,
  allowUpload = true,
  allowEdit = true,
  compact = false,
  onDocumentUploaded,
}: DocumentVaultProps) {
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- state ---- */
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // upload
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // view / edit / delete
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editDocType, setEditDocType] = useState<DocType>('Other');
  const [editNotes, setEditNotes] = useState('');
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);

  // filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  /* ---- fetch documents ---- */
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const query = contactId ? `?contactId=${contactId}` : '';
    const { data, error } = await api.get<any>(`/api/documents${query}`);
    if (error) {
      toast.error('Failed to load documents');
    } else if (data) {
      // useApi auto-unwraps { success, data }, and when meta is present
      // returns { data: [...], meta: {...} }. Extract the inner array.
      const raw: Document[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      // Map backend snake_case docType to display labels
      const mapped = raw.map((d) => ({
        ...d,
        docType: API_TO_DOC_TYPE[d.docType] ?? d.docType,
      }));
      setDocuments(mapped);
    }
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /* ---- drag handlers ---- */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (!allowUpload) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type),
      );
      if (files.length === 0) {
        toast.error('Unsupported file type');
        return;
      }
      setPendingFiles(files);
    },
    [allowUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!allowUpload || !e.target.files?.length) return;
      const files = Array.from(e.target.files).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (files.length === 0) {
        toast.error('Unsupported file type');
        return;
      }
      setPendingFiles(files);
      // reset input so same file can be re-selected
      e.target.value = '';
    },
    [allowUpload],
  );

  /* ---- upload ---- */
  const handleUpload = useCallback(
    async (docType: DocType, notes: string) => {
      if (!pendingFiles?.length) return;
      setUploading(true);
      setUploadProgress(0);

      const total = pendingFiles.length;
      let completed = 0;

      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', DOC_TYPE_TO_API[docType] ?? 'other');
        if (notes) formData.append('notes', notes);
        if (contactId) formData.append('contactId', contactId);

        const { data, error } = await api.upload<Document>('/api/documents/upload', formData);
        completed++;
        setUploadProgress((completed / total) * 100);

        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error}`);
        } else if (data) {
          toast.success(`${file.name} uploaded`);
          onDocumentUploaded?.(data);
        }
      }

      setPendingFiles(null);
      setUploading(false);
      setUploadProgress(0);
      fetchDocuments();
    },
    [pendingFiles, contactId, fetchDocuments, onDocumentUploaded],
  );

  /* ---- inline edit ---- */
  const startEdit = (doc: Document) => {
    setEditDoc(doc);
    setEditDocType(doc.docType as DocType);
    setEditNotes(doc.notes ?? '');
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    const { error } = await api.patch(`/api/documents/${editDoc.id}`, {
      docType: DOC_TYPE_TO_API[editDocType] ?? 'other',
      notes: editNotes,
    });
    if (error) {
      toast.error('Failed to update document');
    } else {
      toast.success('Document updated');
      setEditDoc(null);
      fetchDocuments();
    }
  };

  /* ---- delete ---- */
  const confirmDelete = async () => {
    if (!deleteDoc) return;
    const { error } = await api.del(`/api/documents/${deleteDoc.id}`);
    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document deleted');
      setDeleteDoc(null);
      fetchDocuments();
    }
  };

  /* ---- filtered + sorted list ---- */
  const filtered = documents
    .filter((d) => {
      if (searchQuery && !d.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType && d.docType !== filterType) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Upload Zone ---- */}
      {allowUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
          } ${compact ? 'p-4' : 'p-8'}`}
        >
          <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-400' : 'text-zinc-500'}`} />
          <p className={`text-sm font-medium ${dragActive ? 'text-blue-300' : 'text-zinc-400'}`}>
            {dragActive ? 'Drop files here' : 'Drag files here or click to browse'}
          </p>
          <p className="text-xs text-zinc-600">Images, PDFs, Word documents</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* ---- Upload Form Modal ---- */}
      {pendingFiles && (
        <UploadForm
          files={pendingFiles}
          onSubmit={handleUpload}
          onCancel={() => setPendingFiles(null)}
          uploading={uploading}
          progress={uploadProgress}
        />
      )}

      {/* ---- Filter / Search Bar ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            showFilters || filterType || filterStatus
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>

        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-500" />
        </div>
      </div>

      {/* ---- Expanded Filters ---- */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-8 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All types</option>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-zinc-500" />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-8 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-zinc-500" />
          </div>

          {(filterType || filterStatus) && (
            <button
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ---- Document Grid ---- */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        /* ---- Empty State ---- */
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <FileText className="h-8 w-8 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No documents found</p>
          {allowUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            compact
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filtered.map((doc) => {
            const statusStyle = STATUS_STYLES[doc.status] ?? STATUS_STYLES.pending;
            const isEditing = editDoc?.id === doc.id;

            return (
              <div
                key={doc.id}
                className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600"
              >
                {/* Thumbnail area */}
                <div className="flex h-32 items-center justify-center rounded-t-xl bg-zinc-950">
                  {isImage(doc.mimeType) && doc.fileUrl ? (
                    <img
                      src={doc.fileUrl}
                      alt={doc.fileName}
                      className="h-full w-full rounded-t-xl object-cover"
                    />
                  ) : (
                    fileIcon(doc.mimeType)
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2 p-3">
                  {isEditing ? (
                    /* ---- Inline Edit ---- */
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <select
                          value={editDocType}
                          onChange={(e) => setEditDocType(e.target.value as DocType)}
                          className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 pr-7 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {DOC_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1.5 h-3 w-3 text-zinc-500" />
                      </div>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                        placeholder="Notes..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                        <button
                          onClick={() => setEditDoc(null)}
                          className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="truncate text-sm font-medium text-white" title={doc.fileName}>
                        {doc.fileName}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            DOC_TYPE_COLORS[doc.docType] ?? DOC_TYPE_COLORS.Other
                          }`}
                        >
                          {doc.docType}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle.bg}`}
                        >
                          {statusStyle.icon}
                          {doc.status}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>{formatSize(doc.fileSize)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 border-t border-zinc-800 px-3 py-2">
                    <button
                      onClick={() => setViewDoc(doc)}
                      title="View"
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {allowEdit && (
                      <button
                        onClick={() => startEdit(doc)}
                        title="Edit"
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <a
                      href={`${api.baseUrl}/api/documents/${doc.id}/download`}
                      download
                      title="Download"
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {allowEdit && (
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        title="Delete"
                        className="ml-auto rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---- View Modal ---- */}
      {viewDoc && (
        <ViewModal doc={viewDoc} baseUrl={api.baseUrl} onClose={() => setViewDoc(null)} />
      )}

      {/* ---- Delete Confirm ---- */}
      {deleteDoc && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deleteDoc.fileName}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDoc(null)}
        />
      )}
    </div>
  );
}

export default DocumentVault;

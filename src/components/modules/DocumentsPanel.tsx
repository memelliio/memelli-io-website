'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const DOC_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'pay_stub', label: 'Pay Stub' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'ssn_card', label: 'SSN Card' },
  { value: 'other', label: 'Other' },
] as const;

type DocTypeValue = typeof DOC_TYPES[number]['value'];

const STATUSES = ['pending', 'verified', 'rejected'] as const;
type DocStatus = typeof STATUSES[number];

const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx';

/* =========================================================================
   Types
   ========================================================================= */

interface Document {
  id: string;
  docType: DocTypeValue;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  status: DocStatus;
  notes: string | null;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
}

/* =========================================================================
   Helpers
   ========================================================================= */

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    ''
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function docTypeLabel(value: string): string {
  return DOC_TYPES.find(d => d.value === value)?.label ?? value;
}

/* =========================================================================
   Sub-components
   ========================================================================= */

function StatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, { bg: string; color: string }> = {
    pending:  { bg: 'rgba(234,179,8,0.12)',  color: '#eab308' },
    verified: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
    rejected: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: s.bg,
      color: s.color,
    }}>
      {status}
    </span>
  );
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  let label = 'FILE';
  if (mimeType === 'application/pdf') label = 'PDF';
  else if (mimeType.startsWith('image/')) label = 'IMG';
  else if (mimeType.includes('word')) label = 'DOC';
  else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) label = 'XLS';

  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      background: 'linear-gradient(135deg, rgba(220,38,38,0.18), rgba(249,115,22,0.18))',
      border: '1px solid rgba(220,38,38,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 800,
      color: '#f97316',
      letterSpacing: '0.05em',
      flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

/* =========================================================================
   Upload Form
   ========================================================================= */

interface UploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function UploadForm({ onSuccess, onCancel }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocTypeValue>('other');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', docType);
      if (notes.trim()) fd.append('notes', notes.trim());

      const res = await fetch(`${API}/api/documents/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    padding: '9px 12px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '20px 20px 16px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Upload Document</span>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          &#x2715;
        </button>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {/* File picker */}
        <div>
          <label style={labelStyle}>File</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '1.5px dashed rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '14px',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 13,
              transition: 'border-color 0.15s',
            }}
          >
            {file ? (
              <span style={{ color: '#fff' }}>{file.name} &nbsp;<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>({fmtBytes(file.size)})</span></span>
            ) : (
              'Click to select file — PDF, image, Word, Excel (max 50 MB)'
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Doc type */}
        <div>
          <label style={labelStyle}>Document Type</label>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value as DocTypeValue)}
            style={{ ...inputStyle, appearance: 'none' }}
          >
            {DOC_TYPES.map(dt => (
              <option key={dt.value} value={dt.value} style={{ background: '#111' }}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note..."
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          color: '#f87171',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          type="submit"
          disabled={uploading}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 8,
            border: 'none',
            background: uploading ? 'rgba(220,38,38,0.35)' : 'linear-gradient(135deg, #dc2626, #f97316)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
   Document Row
   ========================================================================= */

interface DocRowProps {
  doc: Document;
  onDelete: (id: string) => void;
  onDownload: (doc: Document) => void;
}

function DocRow({ doc, onDelete, onDownload }: DocRowProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${doc.fileName}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/documents/${doc.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      onDelete(doc.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      transition: 'background 0.12s',
    }}>
      <FileTypeIcon mimeType={doc.mimeType} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {doc.fileName}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {docTypeLabel(doc.docType)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {fmtBytes(doc.fileSize)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {fmtDate(doc.createdAt)}
          </span>
        </div>
      </div>

      <StatusBadge status={doc.status} />

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onDownload(doc)}
          title="Download"
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Download
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.07)',
            color: deleting ? 'rgba(239,68,68,0.4)' : '#f87171',
            fontSize: 12,
            fontWeight: 500,
            cursor: deleting ? 'not-allowed' : 'pointer',
          }}
        >
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   Main Panel
   ========================================================================= */

export function DocumentsPanel() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, perPage: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<DocTypeValue | ''>('');
  const [filterStatus, setFilterStatus] = useState<DocStatus | ''>('');
  const [page, setPage] = useState(1);

  const fetchDocs = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), perPage: '25' });
      if (filterType) params.set('docType', filterType);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`${API}/api/documents?${params}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load documents');
      setDocs(Array.isArray(json.data) ? json.data : []);
      if (json.meta) setMeta(json.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, page]);

  useEffect(() => { fetchDocs(page); }, [filterType, filterStatus, page]);

  function handleDelete(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id));
    setMeta(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }

  function handleDownload(doc: Document) {
    // Open download endpoint in new tab — browser handles redirect to signed URL
    const token = getToken();
    window.open(`${API}/api/documents/${doc.id}/download?token=${token}`, '_blank');
  }

  function handleUploadSuccess() {
    setShowUpload(false);
    setPage(1);
    fetchDocs(1);
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage));

  const filterSelectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.8)',
    padding: '7px 10px',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
  };

  return (
    <div style={{
      background: 'rgba(10,10,10,0.97)',
      borderRadius: 16,
      padding: '24px 20px',
      minHeight: 520,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Documents
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {meta.total} {meta.total === 1 ? 'file' : 'files'} stored
          </p>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #dc2626, #f97316)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          + Upload
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <UploadForm
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value as DocTypeValue | ''); setPage(1); }}
          style={filterSelectStyle}
        >
          <option value="">All Types</option>
          {DOC_TYPES.map(dt => (
            <option key={dt.value} value={dt.value} style={{ background: '#111' }}>
              {dt.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value as DocStatus | ''); setPage(1); }}
          style={filterSelectStyle}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s} style={{ background: '#111', textTransform: 'capitalize' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        {(filterType || filterStatus) && (
          <button
            onClick={() => { setFilterType(''); setFilterStatus(''); setPage(1); }}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.45)',
              fontSize: 12,
              padding: '7px 12px',
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
          Loading documents...
        </div>
      )}

      {!loading && error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
          color: '#f87171',
          fontSize: 13,
        }}>
          {error}
          <button
            onClick={() => fetchDocs(page)}
            style={{
              marginLeft: 12,
              background: 'none',
              border: 'none',
              color: '#f97316',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && docs.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '56px 0',
          color: 'rgba(255,255,255,0.3)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>&#9783;</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>No documents found</div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
            {filterType || filterStatus ? 'Try clearing your filters.' : 'Upload your first document to get started.'}
          </div>
        </div>
      )}

      {!loading && !error && docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map(doc => (
            <DocRow
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          marginTop: 20,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: page === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
              fontSize: 12,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
              fontSize: 12,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

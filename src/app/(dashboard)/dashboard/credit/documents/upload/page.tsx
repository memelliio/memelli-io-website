'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@memelli/ui';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DOC_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'pay_stub', label: 'Pay Stub' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'ssn_card', label: 'SSN Card' },
  { value: 'other', label: 'Other' },
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocumentUploadPage() {
  const router = useRouter();
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [docType, setDocType] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file type. Please upload a PDF, JPG, PNG, GIF, or WebP file.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File exceeds maximum size of 50MB.');
      return;
    }
    setFile(f);

    // Preview for images
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file || !docType) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      if (notes) formData.append('notes', notes);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(90, p + 10));
      }, 300);

      const res = await api.upload<{ success: boolean }>('/api/documents/upload', formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (res.error) {
        throw new Error(res.error);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/credit/documents');
      }, 1500);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/credit/documents')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Documents
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Upload Document</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Upload identity and financial documents for credit verification
        </p>
      </div>

      {/* Success state */}
      {success && (
        <div className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-xl p-4">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold tracking-tight text-emerald-300">Upload successful!</p>
            <p className="text-xs text-emerald-400/60">Redirecting to documents...</p>
          </div>
        </div>
      )}

      {/* Upload card */}
      <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
            <Upload className="h-5 w-5 text-primary" />
            Select File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Drop zone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all duration-200 ${
                dragOver
                  ? 'border-primary/40 bg-primary/[0.04]'
                  : 'border-border hover:border-border hover:bg-muted'
              }`}
            >
              <div className="rounded-xl bg-muted p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium tracking-tight text-foreground">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  PDF, JPG, PNG, GIF, WebP -- Max 50MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-4">
              <div className="flex items-start gap-3">
                {/* Preview */}
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-20 w-20 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold tracking-tight text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB -- {file.type}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={clearFile}
                  className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              {progress > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{progress}%</p>
                </div>
              )}
            </div>
          )}

          {/* Document type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={uploading}
              className="w-full appearance-none rounded-xl border border-border bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200"
            >
              <option value="">Select document type...</option>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context about this document..."
              disabled={uploading}
              rows={3}
              className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none transition-all duration-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2 rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleUpload}
            disabled={!file || !docType || uploading || success}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-3 text-sm font-medium tracking-tight text-white shadow-lg shadow-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <LoadingGlobe size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

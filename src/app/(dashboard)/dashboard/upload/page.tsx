'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  FileJson,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UploadResult {
  success: boolean;
  message?: string;
  filename?: string;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setError(null);
    setSuccess(false);
    setResult(null);

    // Accept JSON files primarily, but also CSV/TXT
    const acceptedTypes = [
      'application/json',
      'text/csv',
      'text/plain',
    ];
    const acceptedExtensions = ['.json', '.csv', '.txt', '.jsonl'];
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.includes(f.type) && !acceptedExtensions.includes(ext)) {
      setError('Unsupported file type. Please upload JSON, CSV, or TXT files.');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError('File exceeds maximum size of 100MB.');
      return;
    }
    setFile(f);
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
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(90, p + 10));
      }, 200);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(body.message ?? `Upload failed (${res.status})`);
      }

      const data: UploadResult = await res.json();
      setResult(data);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileSizeDisplay = file
    ? file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`
    : '';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Upload
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Upload JSON, CSV, or text files to the system
        </p>
      </div>

      {/* Success state */}
      {success && (
        <div className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-xl p-4">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium tracking-tight text-emerald-300">
              Upload successful!
            </p>
            {result?.filename && (
              <p className="text-xs text-emerald-400/60">
                {result.filename}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upload card */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-white/90 tracking-tight font-semibold text-lg">
          <Upload className="h-5 w-5 text-red-400" />
          Select File
        </div>

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
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all duration-200 ${
              dragOver
                ? 'border-red-500/40 bg-red-500/[0.06] scale-[1.01]'
                : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
            }`}
          >
            <div className="rounded-xl bg-white/[0.04] p-4">
              <FileJson className="h-8 w-8 text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium tracking-tight text-white/60">
                Drag and drop your file here, or click to browse
              </p>
              <p className="mt-1.5 text-xs text-white/20">
                JSON, CSV, TXT, JSONL -- Max 100MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt,.jsonl,application/json,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
            <div className="flex items-start gap-3">
              {/* File icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.04]">
                <FileText className="h-7 w-7 text-white/20" />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium tracking-tight text-white/80 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {fileSizeDisplay}
                </p>
              </div>

              {/* Remove */}
              {!uploading && (
                <button
                  onClick={clearFile}
                  className="rounded-xl p-1.5 text-white/30 hover:bg-white/[0.04] hover:text-white/60 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-white/30">{progress}%</p>
              </div>
            )}
          </div>
        )}

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
          disabled={!file || uploading || success}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-medium tracking-tight text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:shadow-red-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Uploading...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload File
            </>
          )}
        </button>

        {/* Upload another after success */}
        {success && (
          <button
            onClick={clearFile}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
          >
            Upload another file
          </button>
        )}
      </div>
    </div>
  );
}

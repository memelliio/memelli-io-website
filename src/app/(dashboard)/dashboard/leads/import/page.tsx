'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Select,
  Badge,
  ProgressBar,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ParsedCSV {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface FieldMapping {
  csvColumn: string;
  leadField: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LEAD_FIELDS = [
  { value: '', label: '-- Skip --' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'source', label: 'Source' },
  { value: 'score', label: 'Score' },
  { value: 'tags', label: 'Tags (comma-separated)' },
  { value: 'notes', label: 'Notes' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'address', label: 'Address' },
];

const BATCH_SIZE = 50;

/* ------------------------------------------------------------------ */
/*  CSV parser (handles quoted fields with commas/newlines)            */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): ParsedCSV {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          cells.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseLine);
  return { headers, rows, totalRows: rows.length };
}

/* ------------------------------------------------------------------ */
/*  Auto-guess mapping                                                 */
/* ------------------------------------------------------------------ */

function guessField(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z]/g, '');
  if (h.includes('firstname') || h === 'first') return 'firstName';
  if (h.includes('lastname') || h === 'last') return 'lastName';
  if (h.includes('email')) return 'email';
  if (h.includes('phone') || h.includes('mobile') || h.includes('cell')) return 'phone';
  if (h.includes('company') || h.includes('business') || h.includes('org')) return 'company';
  if (h.includes('source')) return 'source';
  if (h.includes('score')) return 'score';
  if (h.includes('tag')) return 'tags';
  if (h.includes('note') || h.includes('comment')) return 'notes';
  if (h.includes('city')) return 'city';
  if (h.includes('state')) return 'state';
  if (h.includes('address')) return 'address';
  if (h.includes('name') && !h.includes('first') && !h.includes('last')) return 'firstName';
  return '';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImportLeadsPage() {
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<Step>('upload');
  const [csv, setCsv] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const activeMappings = useMemo(
    () => mappings.filter((m) => m.leadField !== ''),
    [mappings],
  );

  /* ---- File handling ---- */

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) {
        toast.error('Could not parse any columns from this file');
        return;
      }
      setCsv(parsed);
      setMappings(
        parsed.headers.map((h) => ({
          csvColumn: h,
          leadField: guessField(h),
        })),
      );
      setStep('map');
      toast.success(`Loaded ${parsed.totalRows} rows from ${file.name}`);
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  /* ---- Drag & drop ---- */

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  /* ---- Mapping updates ---- */

  const updateMapping = (index: number, field: string) => {
    setMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], leadField: field };
      return next;
    });
  };

  /* ---- Batched import ---- */

  const startImport = useCallback(async () => {
    if (!csv) return;
    setStep('importing');
    setImportProgress(0);

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      errorMessages: [],
    };

    const activeMaps = mappings.filter((m) => m.leadField !== '');
    const totalBatches = Math.ceil(csv.rows.length / BATCH_SIZE);

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batchRows = csv.rows.slice(
        batchIdx * BATCH_SIZE,
        (batchIdx + 1) * BATCH_SIZE,
      );

      const res = await api.post<{
        imported?: number;
        skipped?: number;
        errors?: number;
        errorMessages?: string[];
      }>('/api/leads/import', {
        headers: csv.headers,
        rows: batchRows,
        mappings: activeMaps,
      });

      if (res.error) {
        result.errors += batchRows.length;
        result.errorMessages.push(
          `Batch ${batchIdx + 1}: ${res.error}`,
        );
      } else if (res.data) {
        result.imported += res.data.imported ?? batchRows.length;
        result.skipped += res.data.skipped ?? 0;
        result.errors += res.data.errors ?? 0;
        if (res.data.errorMessages) {
          result.errorMessages.push(...res.data.errorMessages);
        }
      }

      setImportProgress(Math.round(((batchIdx + 1) / totalBatches) * 100));
    }

    setImportResult(result);
    setStep('done');

    if (result.errors === 0) {
      toast.success(`Successfully imported ${result.imported} leads`);
    } else {
      toast.warning(
        `Imported ${result.imported}, skipped ${result.skipped}, ${result.errors} errors`,
      );
    }
  }, [csv, mappings, api]);

  /* ---- Reset ---- */

  const reset = () => {
    setStep('upload');
    setCsv(null);
    setMappings([]);
    setFileName('');
    setImportProgress(0);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ---- Step indicator ---- */

  const STEPS: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'map', label: 'Map Fields' },
    { key: 'preview', label: 'Preview' },
    { key: 'importing', label: 'Import' },
    { key: 'done', label: 'Done' },
  ];

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Import Leads"
        subtitle="Upload a CSV file to import leads in bulk"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Import' },
        ]}
        className="mb-8"
      />

      {/* ---- Step indicator ---- */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 backdrop-blur-xl'
                    : isDone
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-xl'
                      : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06] backdrop-blur-xl'
                }`}
              >
                {isDone && <CheckCircle className="h-3.5 w-3.5" />}
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/*  STEP 1: Upload                                               */}
      {/* ============================================================ */}
      {step === 'upload' && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer backdrop-blur-xl transition-all duration-200 ${
            isDragging
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-red-500/30 hover:bg-white/[0.04]'
          }`}
        >
          <Upload
            className={`h-12 w-12 mx-auto mb-4 transition-colors duration-200 ${
              isDragging ? 'text-red-400' : 'text-muted-foreground'
            }`}
          />
          <p className="text-sm font-medium tracking-tight text-foreground mb-1">
            {isDragging ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground">CSV files only, up to 10 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 2: Map Fields                                           */}
      {/* ============================================================ */}
      {step === 'map' && csv && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-red-400" />
                  <CardTitle className="text-sm tracking-tight">Map CSV Columns</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{csv.totalRows} rows</Badge>
                  <Badge variant="muted">{csv.headers.length} columns</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mappings.map((mapping, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1/3 min-w-0">
                      <span className="text-sm text-foreground font-mono truncate block">
                        {mapping.csvColumn}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <Select
                        value={mapping.leadField}
                        onChange={(val) => updateMapping(i, val)}
                        options={LEAD_FIELDS}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview table (first 5 rows) */}
          <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10">
            <CardHeader>
              <CardTitle className="text-sm tracking-tight">Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium w-10">#</th>
                      {csv.headers.map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium tracking-tight">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csv.rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri} className="border-b border-white/[0.02]">
                        <td className="py-2 px-3 text-muted-foreground">{ri + 1}</td>
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-2 px-3 text-foreground max-w-[200px] truncate">
                            {cell || '\u2014'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csv.totalRows > 5 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Showing 5 of {csv.totalRows} rows
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={reset}>
              Back
            </Button>
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => setStep('preview')}
              disabled={activeMappings.length === 0}
            >
              Preview Import
            </Button>
            {activeMappings.length === 0 && (
              <span className="text-xs text-amber-400">Map at least one field to continue</span>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 3: Preview / Confirm                                    */}
      {/* ============================================================ */}
      {step === 'preview' && csv && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10">
            <CardHeader>
              <CardTitle className="text-sm tracking-tight">Import Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-foreground">{csv.totalRows}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Rows</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-red-400">{activeMappings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Mapped Fields</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {Math.ceil(csv.totalRows / BATCH_SIZE)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Batches</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.04] p-4 text-center">
                  <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">File</p>
                </div>
              </div>

              {/* Mapped fields */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Field Mappings</p>
                <div className="flex flex-wrap gap-2">
                  {activeMappings.map((m) => (
                    <Badge key={m.csvColumn} variant="primary">
                      {m.csvColumn} &rarr; {LEAD_FIELDS.find((f) => f.value === m.leadField)?.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {activeMappings.map((m) => (
                        <th key={m.csvColumn} className="text-left py-2 px-3 text-muted-foreground font-medium tracking-tight">
                          {LEAD_FIELDS.find((f) => f.value === m.leadField)?.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csv.rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri} className="border-b border-white/[0.02]">
                        {activeMappings.map((m) => {
                          const colIndex = csv.headers.indexOf(m.csvColumn);
                          return (
                            <td key={m.csvColumn} className="py-2 px-3 text-foreground">
                              {row[colIndex] || '\u2014'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csv.totalRows > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing 5 of {csv.totalRows} rows
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setStep('map')}>
              Back
            </Button>
            <Button
              variant="primary"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              onClick={startImport}
            >
              Import {csv.totalRows} Leads
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 4: Importing (progress)                                 */}
      {/* ============================================================ */}
      {step === 'importing' && (
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10">
          <CardHeader>
            <CardTitle className="text-sm tracking-tight">Importing Leads...</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar
              value={importProgress}
              max={100}
              size="lg"
              color="primary"
              label="Import progress"
              showPercentage
              className="mb-4"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Skeleton variant="circle" width={16} height={16} />
              <span>
                Processing batch {Math.ceil((importProgress / 100) * Math.ceil((csv?.totalRows ?? 0) / BATCH_SIZE))} of{' '}
                {Math.ceil((csv?.totalRows ?? 0) / BATCH_SIZE)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  STEP 5: Done (summary)                                       */}
      {/* ============================================================ */}
      {step === 'done' && importResult && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/10">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                {importResult.errors === 0 ? (
                  <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto mb-3" />
                ) : (
                  <AlertTriangle className="h-14 w-14 text-amber-400 mx-auto mb-3" />
                )}
                <h3 className="text-lg font-semibold tracking-tight text-foreground mb-1">Import Complete</h3>
                <p className="text-sm text-muted-foreground">
                  {importResult.errors === 0
                    ? 'All leads were imported successfully.'
                    : 'Import completed with some issues.'}
                </p>
              </div>

              {/* Result stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 backdrop-blur-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-2xl font-bold tracking-tight text-emerald-400">
                      {importResult.imported}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 backdrop-blur-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-2xl font-bold tracking-tight text-amber-400">
                      {importResult.skipped}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="rounded-xl bg-red-500/5 border border-red-500/15 backdrop-blur-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <X className="h-4 w-4 text-red-400" />
                    <span className="text-2xl font-bold tracking-tight text-red-400">
                      {importResult.errors}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>

              {/* Error details */}
              {importResult.errorMessages.length > 0 && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/15 backdrop-blur-xl p-4 mb-4">
                  <p className="text-xs font-medium text-red-400 mb-2">Error Details</p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errorMessages.slice(0, 20).map((msg, i) => (
                      <li key={i} className="text-xs text-red-300/80 flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        {msg}
                      </li>
                    ))}
                    {importResult.errorMessages.length > 20 && (
                      <li className="text-xs text-red-300/60">
                        ...and {importResult.errorMessages.length - 20} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-center gap-3 pb-6">
              <a href="/dashboard/leads">
                <Button variant="primary">View Leads</Button>
              </a>
              <Button
                variant="secondary"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={reset}
              >
                Import More
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

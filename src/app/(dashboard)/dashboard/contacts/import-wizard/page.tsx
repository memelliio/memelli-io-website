'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Download,
  X,
  Columns,
  Eye,
  Settings2,
  Loader2,
  FileWarning,
  CheckCircle2,
  XCircle,
  SkipForward,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Select,
  Badge,
  ProgressBar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ── Contact field definitions ──────────────────────────────────── */

const CONTACT_FIELDS = [
  { value: '', label: 'Skip this column' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'type', label: 'Type (PERSON/COMPANY)' },
  { value: 'source', label: 'Source' },
  { value: 'tags', label: 'Tags (comma-separated)' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'Zip Code' },
  { value: 'country', label: 'Country' },
  { value: 'website', label: 'Website' },
  { value: 'title', label: 'Job Title' },
];

type WizardStep = 'upload' | 'mapping' | 'preview' | 'options' | 'importing' | 'done';

const STEP_CONFIG: { key: WizardStep; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'mapping', label: 'Map Columns', icon: Columns },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'options', label: 'Options', icon: Settings2 },
  { key: 'importing', label: 'Import', icon: Loader2 },
];

interface ImportError {
  row: number;
  data: Record<string, string>;
  error: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  updated: number;
  errors: number;
  errorLog: ImportError[];
}

type DuplicateStrategy = 'skip' | 'update' | 'create';

/* ── CSV parser (handles quoted fields) ─────────────────────────── */

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

/* ── Auto-guess column mapping ──────────────────────────────────── */

function guessMapping(header: string): string {
  const lower = header.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.includes('firstname') || lower === 'first') return 'firstName';
  if (lower.includes('lastname') || lower === 'last') return 'lastName';
  if (lower.includes('company') || lower.includes('org') || lower.includes('organization')) return 'companyName';
  if (lower.includes('email') || lower.includes('mail')) return 'email';
  if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile') || lower.includes('cell')) return 'phone';
  if (lower.includes('type')) return 'type';
  if (lower.includes('source') || lower.includes('origin')) return 'source';
  if (lower.includes('tag')) return 'tags';
  if (lower.includes('status')) return 'status';
  if (lower.includes('note') || lower.includes('comment')) return 'notes';
  if (lower.includes('address') || lower.includes('street')) return 'address';
  if (lower.includes('city')) return 'city';
  if (lower.includes('state') || lower.includes('province')) return 'state';
  if (lower.includes('zip') || lower.includes('postal')) return 'zip';
  if (lower.includes('country')) return 'country';
  if (lower.includes('website') || lower.includes('url')) return 'website';
  if (lower.includes('title') || lower.includes('jobtitle') || lower.includes('position') || lower.includes('role')) return 'title';
  return '';
}

/* ── Download helper ────────────────────────────────────────────── */

function downloadErrorLog(errors: ImportError[]) {
  const headers = ['Row', 'Error', ...Object.keys(errors[0]?.data ?? {})];
  const csvRows = errors.map((e) => {
    const dataValues = Object.values(e.data).map((v) => `"${(v ?? '').replace(/"/g, '""')}"`);
    return [e.row, `"${e.error.replace(/"/g, '""')}"`, ...dataValues].join(',');
  });
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function ContactsImportWizardPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<WizardStep>('upload');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<number, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const stepIndex = STEP_CONFIG.findIndex((s) => s.key === step);
  const previewRows = rows.slice(0, 10);
  const mappedFields = Object.values(mappings).filter(Boolean);
  const hasMappedFields = mappedFields.length > 0;
  const hasIdentifier =
    mappedFields.includes('firstName') ||
    mappedFields.includes('lastName') ||
    mappedFields.includes('companyName') ||
    mappedFields.includes('email');

  const mappedCount = useMemo(
    () => Object.values(mappings).filter(Boolean).length,
    [mappings],
  );

  const skippedCount = useMemo(
    () => headers.length - mappedCount,
    [headers.length, mappedCount],
  );

  /* ── File handling ──────────────────────────────────────────────── */

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10 MB');
      return;
    }

    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.headers.length === 0) {
        toast.error('CSV file appears to be empty');
        return;
      }

      setHeaders(parsed.headers);
      setRows(parsed.rows);

      const guessed: Record<number, string> = {};
      parsed.headers.forEach((h, i) => {
        guessed[i] = guessMapping(h);
      });
      setMappings(guessed);
      setStep('mapping');
      toast.success(`Loaded ${parsed.rows.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  /* ── Import mutation ────────────────────────────────────────────── */

  const importMutation = useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      const contacts = rows.map((row, rowIndex) => {
        const contact: Record<string, unknown> = {};
        Object.entries(mappings).forEach(([colIndex, field]) => {
          if (!field) return;
          const value = row[parseInt(colIndex)]?.trim();
          if (!value) return;
          if (field === 'tags') {
            contact[field] = value.split(',').map((t) => t.trim()).filter(Boolean);
          } else {
            contact[field] = value;
          }
        });
        if (!contact.type) contact.type = 'PERSON';
        return { contact, rowIndex: rowIndex + 2 }; // +2 for 1-indexed + header row
      });

      const validContacts = contacts.filter(
        (c) => c.contact.firstName || c.contact.lastName || c.contact.companyName || c.contact.email,
      );
      const emptySkipped = contacts.length - validContacts.length;

      setStep('importing');
      setImportProgress(0);

      let imported = 0;
      let skipped = emptySkipped;
      let updated = 0;
      let errors = 0;
      const errorLog: ImportError[] = [];

      const batchSize = 10;
      for (let i = 0; i < validContacts.length; i += batchSize) {
        const batch = validContacts.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async ({ contact, rowIndex }) => {
            try {
              const payload = { ...contact, duplicateStrategy };
              const res = await api.post('/api/contacts', payload);
              if (res.error) {
                throw new Error(res.error);
              }
              // Check if the response indicates it was an update vs create
              const data = res.data as Record<string, unknown> | undefined;
              if (data?.updated) {
                return { status: 'updated' as const, rowIndex };
              }
              if (data?.skipped) {
                return { status: 'skipped' as const, rowIndex };
              }
              return { status: 'imported' as const, rowIndex };
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Unknown error';
              const dataMap: Record<string, string> = {};
              Object.entries(mappings).forEach(([colIndex, field]) => {
                if (field) {
                  const label = CONTACT_FIELDS.find((f) => f.value === field)?.label ?? field;
                  dataMap[label] = (contact[field] as string) ?? '';
                }
              });
              errorLog.push({ row: rowIndex, data: dataMap, error: message });
              throw err;
            }
          }),
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const val = result.value;
            if (val.status === 'updated') updated++;
            else if (val.status === 'skipped') skipped++;
            else imported++;
          } else {
            errors++;
          }
        });

        setImportProgress(Math.round(((i + batch.length) / validContacts.length) * 100));
      }

      return { imported, skipped, updated, errors, errorLog };
    },
    onSuccess: (result) => {
      setImportResult(result);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (result.imported > 0) {
        toast.success(`${result.imported} contacts imported successfully`);
      }
    },
    onError: () => {
      toast.error('Import failed unexpectedly');
      setStep('options');
    },
  });

  /* ── Reset wizard ───────────────────────────────────────────────── */

  const resetWizard = useCallback(() => {
    setStep('upload');
    setFileName('');
    setFileSize('');
    setHeaders([]);
    setRows([]);
    setMappings({});
    setDuplicateStrategy('skip');
    setImportProgress(0);
    setImportResult(null);
  }, []);

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <PageHeader
        title="Import Wizard"
        subtitle="Import contacts from a CSV file in 5 easy steps"
        breadcrumb={[
          { label: 'Contacts', href: '/dashboard/contacts' },
          { label: 'Import Wizard' },
        ]}
        className="mb-8"
      />

      {/* ── Step Progress Bar ───────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-10">
        {STEP_CONFIG.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stepIndex;
          const isComplete = i < stepIndex;
          const isDone = step === 'done' && i === STEP_CONFIG.length - 1;

          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isComplete || isDone
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : isActive
                      ? 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.08)]'
                      : 'bg-white/[0.02] text-muted-foreground border border-white/[0.04]'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isComplete || isDone
                      ? 'bg-red-500/20 text-red-300'
                      : isActive
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-white/[0.04] text-muted-foreground'
                  }`}
                >
                  {isComplete || isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEP_CONFIG.length - 1 && (
                <div className={`w-4 lg:w-8 h-px transition-colors duration-200 ${isComplete ? 'bg-red-500/30' : 'bg-white/[0.04]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Upload ──────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-2xl p-16 lg:p-24 text-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-red-500/20 hover:bg-white/[0.03] backdrop-blur-xl'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-5">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-200 ${
                isDragOver
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-white/[0.03] border border-white/[0.06] text-muted-foreground'
              }`}>
                <Upload className="h-9 w-9" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  or click anywhere to browse -- max 10 MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Format guidance */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">CSV Format Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                First row should contain column headers (e.g. First Name, Email, Phone)
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                Supported fields: name, email, phone, company, tags, status, address, and more
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                Tags can be comma-separated within a single column
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                Columns will be auto-matched where possible in the next step
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Step 2: Column Mapping ──────────────────────────────────── */}
      {step === 'mapping' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Map Columns</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Match each CSV column to a contact field. We auto-detected {mappedCount} of {headers.length} columns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground px-2.5 py-1 text-xs font-medium">
                <FileSpreadsheet className="h-3 w-3 mr-1.5" />
                {fileName}
              </span>
              <span className="inline-flex rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground px-2.5 py-1 text-xs">
                {rows.length} rows
              </span>
            </div>
          </div>

          {/* Mapping summary */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{mappedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mapped</p>
            </div>
            <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{skippedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
            </div>
            <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{headers.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Columns</p>
            </div>
          </div>

          {/* Mapping rows */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl divide-y divide-white/[0.04]">
            {headers.map((header, index) => {
              const mapped = mappings[index];
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between px-6 py-3.5 transition-colors duration-150 ${
                    mapped ? 'bg-white/[0.01]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                      mapped
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06]'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{header}</p>
                      {rows[0]?.[index] && (
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          e.g. &quot;{rows[0][index]}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="w-56">
                      <Select
                        options={CONTACT_FIELDS}
                        value={mappings[index] ?? ''}
                        onChange={(val: string) =>
                          setMappings((prev) => ({ ...prev, [index]: val }))
                        }
                        size="sm"
                        placeholder="Skip"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!hasIdentifier && hasMappedFields && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl px-5 py-3.5 text-sm text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Map at least one identifier field (first name, last name, company, or email) to proceed.
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => {
                setStep('upload');
                setHeaders([]);
                setRows([]);
                setMappings({});
                setFileName('');
                setFileSize('');
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => setStep('preview')}
              disabled={!hasMappedFields || !hasIdentifier}
            >
              Preview Data
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ─────────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Preview Import Data</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Showing first {Math.min(10, rows.length)} of {rows.length} rows. Only mapped columns are shown.
              </p>
            </div>
            <Badge variant="default">
              {rows.length} total rows
            </Badge>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <span className="text-muted-foreground">#</span>
                  </TableHead>
                  {headers.map((header, i) => {
                    const mapped = mappings[i];
                    if (!mapped) return null;
                    const fieldLabel = CONTACT_FIELDS.find((f) => f.value === mapped)?.label ?? mapped;
                    return (
                      <TableHead key={i}>
                        <div>
                          <span className="text-red-400 text-xs font-semibold">{fieldLabel}</span>
                          <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">{header}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, ri) => (
                  <TableRow key={ri}>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {ri + 1}
                    </TableCell>
                    {headers.map((_, ci) => {
                      if (!mappings[ci]) return null;
                      const value = row[ci];
                      return (
                        <TableCell key={ci} className="text-foreground text-sm">
                          {value || <span className="text-muted-foreground">--</span>}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {rows.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              ...and {rows.length - 10} more rows not shown
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => setStep('mapping')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => setStep('options')}
            >
              Import Options
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Import Options ──────────────────────────────────── */}
      {step === 'options' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Import Options</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how duplicates and new contacts are handled.
            </p>
          </div>

          {/* Duplicate strategy */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Duplicate Handling</h3>
            <p className="text-xs text-muted-foreground -mt-3">
              When a contact with a matching email already exists:
            </p>

            <div className="space-y-3">
              {([
                {
                  value: 'skip' as DuplicateStrategy,
                  label: 'Skip duplicates',
                  description: 'If a contact with the same email exists, skip the row entirely.',
                  icon: SkipForward,
                },
                {
                  value: 'update' as DuplicateStrategy,
                  label: 'Update existing',
                  description: 'If a contact with the same email exists, update it with the new data.',
                  icon: Settings2,
                },
                {
                  value: 'create' as DuplicateStrategy,
                  label: 'Always create new',
                  description: 'Create a new contact for every row, even if duplicates exist.',
                  icon: Upload,
                },
              ]).map((option) => {
                const Icon = option.icon;
                const isSelected = duplicateStrategy === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuplicateStrategy(option.value)}
                    className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors duration-200 ${
                      isSelected
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06]'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-red-300' : 'text-foreground'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </div>
                    <div className={`ml-auto shrink-0 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200 ${
                      isSelected
                        ? 'border-red-500/40 bg-red-500/20'
                        : 'border-white/[0.08] bg-white/[0.02]'
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-red-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Import summary */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Import Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
                <p className="text-xl font-bold text-foreground">{rows.length}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
                <p className="text-xl font-bold text-red-400">{mappedCount}</p>
                <p className="text-xs text-muted-foreground">Mapped Fields</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
                <p className="text-xl font-bold text-muted-foreground">{skippedCount}</p>
                <p className="text-xs text-muted-foreground">Skipped Columns</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
                <p className="text-xl font-bold text-foreground capitalize">{duplicateStrategy}</p>
                <p className="text-xs text-muted-foreground">Duplicate Mode</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => setStep('preview')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              onClick={() => importMutation.mutate()}
              isLoading={importMutation.isPending}
            >
              Start Import ({rows.length} contacts)
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5a: Importing Progress ─────────────────────────────── */}
      {step === 'importing' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-16 text-center">
          <div className="max-w-md mx-auto space-y-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/15 mx-auto">
              <Loader2 className="h-9 w-9 text-red-400 animate-spin" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">Importing Contacts</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processing {rows.length} contacts -- please do not close this page.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-red-400 font-bold">{importProgress}%</span>
              </div>
              <ProgressBar value={importProgress} max={100} color="primary" />
              <p className="text-xs text-muted-foreground">
                {Math.round((importProgress / 100) * rows.length)} of {rows.length} rows processed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5b: Results ────────────────────────────────────────── */}
      {step === 'done' && importResult && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl mx-auto ${
                importResult.errors > 0
                  ? 'bg-amber-500/10 border border-amber-500/15'
                  : 'bg-emerald-500/10 border border-emerald-500/15'
              }`}>
                {importResult.errors > 0 ? (
                  <FileWarning className="h-9 w-9 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                )}
              </div>

              <div>
                <p className="text-xl font-semibold text-foreground">Import Complete</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.errors > 0
                    ? 'Some rows could not be imported. Download the error log for details.'
                    : 'All contacts have been imported successfully.'}
                </p>
              </div>

              {/* Result stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-400">{importResult.imported}</span>
                  </div>
                  <p className="text-xs text-emerald-400/60 mt-1">Imported</p>
                </div>

                {importResult.updated > 0 && (
                  <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Settings2 className="h-4 w-4 text-blue-400" />
                      <span className="text-2xl font-bold text-blue-400">{importResult.updated}</span>
                    </div>
                    <p className="text-xs text-blue-400/60 mt-1">Updated</p>
                  </div>
                )}

                {importResult.skipped > 0 && (
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <div className="flex items-center justify-center gap-2">
                      <SkipForward className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold text-muted-foreground">{importResult.skipped}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Skipped</p>
                  </div>
                )}

                {importResult.errors > 0 && (
                  <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-2xl font-bold text-red-400">{importResult.errors}</span>
                    </div>
                    <p className="text-xs text-red-400/60 mt-1">Errors</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error log */}
          {importResult.errors > 0 && importResult.errorLog.length > 0 && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-red-300">
                    Error Log ({importResult.errorLog.length} errors)
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => downloadErrorLog(importResult.errorLog)}
                >
                  Download CSV
                </Button>
              </div>

              <div className="rounded-xl border border-white/[0.04] overflow-hidden max-h-64 overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Row</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Error</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {importResult.errorLog.slice(0, 50).map((err, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{err.row}</td>
                        <td className="px-4 py-2 text-red-400 text-xs">{err.error}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs truncate max-w-[200px]">
                          {Object.entries(err.data)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importResult.errorLog.length > 50 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-white/[0.04]">
                    Showing 50 of {importResult.errorLog.length} errors. Download the full log above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              onClick={resetWizard}
            >
              Import More
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => (window.location.href = '/dashboard/contacts')}
            >
              View Contacts
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

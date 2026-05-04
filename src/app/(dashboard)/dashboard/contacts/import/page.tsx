'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import {
  PageHeader,
  Button,
  Select,
  Badge,
  ProgressBar,
  Card,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

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
];

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

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

function guessMapping(header: string): string {
  const lower = header.toLowerCase().replace(/[^a-z]/g, '');
  if (lower.includes('firstname') || lower === 'first') return 'firstName';
  if (lower.includes('lastname') || lower === 'last') return 'lastName';
  if (lower.includes('company') || lower.includes('org')) return 'companyName';
  if (lower.includes('email') || lower.includes('mail')) return 'email';
  if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile')) return 'phone';
  if (lower.includes('type')) return 'type';
  if (lower.includes('source')) return 'source';
  if (lower.includes('tag')) return 'tags';
  return '';
}

export default function ContactsImportPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<number, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
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

      // Auto-guess mappings
      const guessed: Record<number, string> = {};
      parsed.headers.forEach((h, i) => {
        guessed[i] = guessMapping(h);
      });
      setMappings(guessed);
      setStep('mapping');
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

  const previewRows = rows.slice(0, 5);
  const mappedFields = Object.values(mappings).filter(Boolean);
  const hasMappedFields = mappedFields.length > 0;
  const hasNameOrCompany =
    mappedFields.includes('firstName') ||
    mappedFields.includes('lastName') ||
    mappedFields.includes('companyName') ||
    mappedFields.includes('email');

  const importMutation = useMutation({
    mutationFn: async () => {
      // Build contact objects from CSV rows using mappings
      const contacts = rows.map((row) => {
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
        // Default type to PERSON if not mapped
        if (!contact.type) contact.type = 'PERSON';
        return contact;
      });

      // Filter out empty contacts, track skipped
      const validContacts = contacts.filter(
        (c) => c.firstName || c.lastName || c.companyName || c.email,
      );
      const skipped = contacts.length - validContacts.length;

      setStep('importing');
      let imported = 0;
      let errors = 0;

      // Import in batches of 10
      const batchSize = 10;
      for (let i = 0; i < validContacts.length; i += batchSize) {
        const batch = validContacts.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((contact) => api.post('/api/contacts', contact)),
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled' && !result.value.error) {
            imported++;
          } else {
            errors++;
          }
        });

        setImportProgress(Math.round(((i + batch.length) / validContacts.length) * 100));
      }

      return { imported, skipped, errors };
    },
    onSuccess: (result) => {
      setImportResult(result);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (result.imported > 0) {
        toast.success(`${result.imported} contacts imported`);
      }
    },
    onError: () => {
      toast.error('Import failed');
      setStep('preview');
    },
  });

  /* ── Step progress indicator ────────────────────────────────────── */
  const stepIndex = ['upload', 'mapping', 'preview', 'importing', 'done'].indexOf(step);

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <PageHeader
        title="Import Contacts"
        subtitle="Upload a CSV file to import contacts in bulk"
        breadcrumb={[
          { label: 'Contacts', href: '/dashboard/contacts' },
          { label: 'Import' },
        ]}
        className="mb-8"
      />

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {['Upload', 'Map Fields', 'Preview', 'Import', 'Done'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              i <= stepIndex
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-white/[0.02] text-muted-foreground border border-white/[0.04]'
            }`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                i < stepIndex ? 'bg-red-500/20 text-red-300' : i === stepIndex ? 'bg-red-500/15 text-red-400' : 'bg-white/[0.04] text-muted-foreground'
              }`}>
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < 4 && <div className={`w-6 h-px ${i < stepIndex ? 'bg-red-500/30' : 'bg-white/[0.04]'}`} />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          className={`border-2 border-dashed rounded-2xl p-20 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] backdrop-blur-xl'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Drag and drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Step: Field Mapping */}
      {step === 'mapping' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Map Fields</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Map your CSV columns to contact fields. File: {fileName} ({rows.length} rows)
              </p>
            </div>
            <span className="inline-flex rounded-lg bg-red-500/10 text-red-400 px-2.5 py-1 text-xs font-medium">{fileName}</span>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl divide-y divide-white/[0.04]">
            {headers.map((header, index) => (
              <div key={index} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{header}</span>
                  {rows[0]?.[index] && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      e.g. &quot;{rows[0][index]}&quot;
                    </span>
                  )}
                </div>
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
            ))}
          </div>

          {!hasNameOrCompany && hasMappedFields && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl px-5 py-3.5 text-sm text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Map at least a name or email field to identify contacts.
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => {
                setStep('upload');
                setHeaders([]);
                setRows([]);
                setMappings({});
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => setStep('preview')}
              disabled={!hasMappedFields || !hasNameOrCompany}
            >
              Preview Import
            </Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Preview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Showing first {Math.min(5, rows.length)} of {rows.length} rows
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, i) => {
                    const mapped = mappings[i];
                    if (!mapped) return null;
                    const fieldLabel = CONTACT_FIELDS.find((f) => f.value === mapped)?.label ?? mapped;
                    return (
                      <TableHead key={i}>
                        <div>
                          <span className="text-foreground">{fieldLabel}</span>
                          <span className="block text-xs text-muted-foreground font-normal">{header}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, ri) => (
                  <TableRow key={ri}>
                    {headers.map((_, ci) => {
                      if (!mappings[ci]) return null;
                      return (
                        <TableCell key={ci} className="text-foreground">
                          {row[ci] || '\u2014'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
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
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              onClick={() => importMutation.mutate()}
              isLoading={importMutation.isPending}
            >
              Import {rows.length} Contacts
            </Button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-12 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/10 mx-auto">
              <Upload className="h-7 w-7 text-red-400 animate-pulse" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Importing contacts...</p>
              <p className="text-sm text-muted-foreground mt-1">{importProgress}% complete</p>
            </div>
            <ProgressBar value={importProgress} max={100} color="primary" />
            <div className="flex gap-3 justify-center">
              <Skeleton variant="line" className="h-3 w-24 rounded-xl" />
              <Skeleton variant="line" className="h-3 w-16 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && importResult && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-12 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/10 mx-auto">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Import Complete</p>
            </div>
            <div className="flex justify-center gap-3">
              <Badge variant="success">
                {importResult.imported} imported
              </Badge>
              {importResult.skipped > 0 && (
                <Badge variant="warning">
                  {importResult.skipped} skipped
                </Badge>
              )}
              {importResult.errors > 0 && (
                <Badge variant="error">
                  {importResult.errors} errors
                </Badge>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep('upload');
                  setHeaders([]);
                  setRows([]);
                  setMappings({});
                  setImportProgress(0);
                  setImportResult(null);
                }}
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
        </div>
      )}
    </div>
  );
}

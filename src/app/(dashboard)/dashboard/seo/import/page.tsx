'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Hash, CheckCircle, AlertCircle, X } from 'lucide-react';
import { API_URL as API } from '@/lib/config';

async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface CsvRow {
  keyword: string;
  question: string;
  cluster_name: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors?: string[];
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect if first row is a header
  const firstRow = lines[0].toLowerCase();
  const hasHeader = firstRow.includes('keyword') || firstRow.includes('question');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    // Simple CSV split (handles basic quoting)
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return {
      keyword: cols[0] ?? '',
      question: cols[1] ?? '',
      cluster_name: cols[2] ?? '',
    };
  }).filter(r => r.keyword || r.question);
}

function keywordsToQuestions(raw: string): CsvRow[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => ({
      keyword: line,
      question: line.endsWith('?') ? line : `What is ${line}?`,
      cluster_name: '',
    }));
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  // CSV section
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvResult, setCsvResult] = useState<ImportResult | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Keyword paste section
  const [keywordText, setKeywordText] = useState('');
  const [keywordRows, setKeywordRows] = useState<CsvRow[]>([]);
  const [kwImporting, setKwImporting] = useState(false);
  const [kwProgress, setKwProgress] = useState(0);
  const [kwResult, setKwResult] = useState<ImportResult | null>(null);
  const [kwError, setKwError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvResult(null);
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvRows(parseCSV(text));
    };
    reader.readAsText(file);
  }

  function handleKeywordChange(text: string) {
    setKeywordText(text);
    setKwResult(null);
    setKwError(null);
    if (text.trim()) {
      setKeywordRows(keywordsToQuestions(text));
    } else {
      setKeywordRows([]);
    }
  }

  async function importCSV() {
    if (csvRows.length === 0) return;
    setCsvImporting(true);
    setCsvProgress(0);
    setCsvResult(null);
    setCsvError(null);

    try {
      // Animate progress
      const interval = setInterval(() => setCsvProgress(p => Math.min(p + 10, 85)), 300);

      const raw = await api('/api/seo/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({
          // Backend expects array of { question, keyword?, clusterId? }
          questions: csvRows.map(r => ({
            keyword: r.keyword,
            question: r.question || `What is ${r.keyword}?`,
          })),
        }),
      });

      clearInterval(interval);
      setCsvProgress(100);
      // Backend returns { success, data: { created: number } }
      const data = raw?.data ?? raw;
      setCsvResult({
        imported: data.created ?? data.imported ?? data.count ?? csvRows.length,
        failed: 0,
        errors: undefined,
      });
    } catch (e) {
      setCsvError(e instanceof Error ? e.message : 'Import failed');
      setCsvProgress(0);
    } finally {
      setCsvImporting(false);
    }
  }

  async function importKeywords() {
    if (keywordRows.length === 0) return;
    setKwImporting(true);
    setKwProgress(0);
    setKwResult(null);
    setKwError(null);

    try {
      const interval = setInterval(() => setKwProgress(p => Math.min(p + 10, 85)), 300);

      const raw = await api('/api/seo/keywords/import-keywords', {
        method: 'POST',
        body: JSON.stringify({
          keywords: keywordRows.map(r => r.keyword),
        }),
      });

      clearInterval(interval);
      setKwProgress(100);
      // Backend returns { success, data: { created, questionIds } }
      const data = raw?.data ?? raw;
      setKwResult({
        imported: data.created ?? data.imported ?? data.count ?? keywordRows.length,
        failed: 0,
        errors: undefined,
      });
    } catch (e) {
      setKwError(e instanceof Error ? e.message : 'Import failed');
      setKwProgress(0);
    } finally {
      setKwImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl tracking-tight font-semibold text-foreground">Bulk Import</h1>
          <p className="text-muted-foreground leading-relaxed text-sm mt-1.5">Import questions and keywords in bulk to populate your SEO pipeline</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Import */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <div>
                <h2 className="tracking-tight font-semibold text-foreground">From CSV</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">Upload a .csv file with keyword/question data</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Format hint */}
              <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">Expected columns:</p>
                <code className="text-xs text-foreground font-mono">keyword, question, cluster_name</code>
                <p className="text-xs text-muted-foreground mt-1">First row can be a header row (auto-detected)</p>
              </div>

              {/* File upload */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/[0.06] hover:border-primary/30 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                {csvFileName ? (
                  <div>
                    <p className="text-sm text-foreground font-medium">{csvFileName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{csvRows.length} rows detected</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Click to upload CSV file</p>
                    <p className="text-xs text-muted-foreground mt-0.5">.csv files only</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Preview table */}
              {csvRows.length > 0 && (
                <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-white/[0.03] flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Preview (first 10 rows of {csvRows.length})</p>
                    <button
                      onClick={() => { setCsvRows([]); setCsvFileName(''); if (fileRef.current) fileRef.current.value = ''; }}
                      className="text-muted-foreground hover:text-muted-foreground transition-colors duration-150"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white/[0.02]">
                        <tr>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium">Keyword</th>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium">Question</th>
                          <th className="px-3 py-2 text-left text-muted-foreground font-medium">Cluster</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-100">
                            <td className="px-3 py-2 text-foreground truncate max-w-[100px]">{row.keyword || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground truncate max-w-[140px]">{row.question || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground truncate max-w-[80px]">{row.cluster_name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress */}
              {csvImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Importing {csvRows.length} rows...</span>
                    <span>{csvProgress}%</span>
                  </div>
                  <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                    <div
                      className="bg-primary/80 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${csvProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result */}
              {csvResult && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
                  csvResult.failed === 0
                    ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/[0.06] border-amber-500/15 text-amber-300'
                }`}>
                  {csvResult.failed === 0
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p>{csvResult.imported} questions imported{csvResult.failed > 0 ? `, ${csvResult.failed} failed` : ''}</p>
                    {csvResult.errors?.slice(0, 3).map((e, i) => (
                      <p key={i} className="text-xs opacity-75 mt-0.5">{e}</p>
                    ))}
                  </div>
                </div>
              )}

              {csvError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/80/[0.06] border border-primary/15 rounded-xl text-sm text-primary/80">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{csvError}
                </div>
              )}

              <button
                onClick={importCSV}
                disabled={csvImporting || csvRows.length === 0}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200"
              >
                {csvImporting ? 'Importing...' : `Import ${csvRows.length > 0 ? csvRows.length : ''} Questions`}
              </button>
            </div>
          </div>

          {/* Keyword Paste */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <div>
                <h2 className="tracking-tight font-semibold text-foreground">Paste Keywords</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">One keyword per line — auto-converted to questions</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Textarea */}
              <textarea
                value={keywordText}
                onChange={e => handleKeywordChange(e.target.value)}
                placeholder={`credit repair tips\nhow to dispute errors\nbest credit cards for bad credit\nimprove credit score fast`}
                rows={12}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 placeholder-muted-foreground resize-none font-mono"
              />

              {keywordRows.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-2">{keywordRows.length} keywords detected. Preview (first 5):</p>
                  <ul className="space-y-1">
                    {keywordRows.slice(0, 5).map((r, i) => (
                      <li key={i} className="text-xs text-foreground">
                        <span className="text-muted-foreground">{i + 1}. </span>
                        <span className="text-primary/80">{r.keyword}</span>
                        <span className="text-muted-foreground"> → </span>
                        {r.question}
                      </li>
                    ))}
                    {keywordRows.length > 5 && (
                      <li className="text-xs text-muted-foreground">...and {keywordRows.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Progress */}
              {kwImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Importing {keywordRows.length} keywords...</span>
                    <span>{kwProgress}%</span>
                  </div>
                  <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${kwProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result */}
              {kwResult && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
                  kwResult.failed === 0
                    ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/[0.06] border-amber-500/15 text-amber-300'
                }`}>
                  {kwResult.failed === 0
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p>{kwResult.imported} keywords imported{kwResult.failed > 0 ? `, ${kwResult.failed} failed` : ''}</p>
                    {kwResult.errors?.slice(0, 3).map((e, i) => (
                      <p key={i} className="text-xs opacity-75 mt-0.5">{e}</p>
                    ))}
                  </div>
                </div>
              )}

              {kwError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/[0.06] border border-primary/15 rounded-xl text-sm text-primary/80">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{kwError}
                </div>
              )}

              <button
                onClick={importKeywords}
                disabled={kwImporting || keywordRows.length === 0}
                className="w-full py-2.5 bg-primary hover:bg-primary disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200"
              >
                {kwImporting ? 'Importing...' : `Import ${keywordRows.length > 0 ? keywordRows.length : ''} Keywords`}
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
          <h3 className="tracking-tight font-semibold text-foreground mb-3">Import Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">•</span>CSV imports support up to 500 rows per batch</li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">•</span>Keyword paste auto-generates a question from each keyword (e.g., &quot;credit tips&quot; → &quot;What is credit tips?&quot;)</li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">•</span>If a <code className="text-foreground">cluster_name</code> is provided in CSV, the cluster will be created or matched automatically</li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">•</span>Imported questions start with <code className="text-foreground">PENDING</code> status and are ready for generation</li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">•</span>Duplicate keywords are automatically skipped</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

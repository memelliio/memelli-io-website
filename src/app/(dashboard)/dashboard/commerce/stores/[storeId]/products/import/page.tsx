'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';
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

type ImportTab = 'csv' | 'bulk';

interface ParsedProduct {
  name: string;
  type: string;
  price: number;
  sku?: string;
  inventory?: number;
  description?: string;
  [key: string]: any;
}

interface ImportResult {
  index: number;
  name: string;
  status: 'success' | 'error';
  error?: string;
}

const CSV_COLUMNS = ['name', 'type', 'price', 'sku', 'inventory', 'description'];
const PRODUCT_TYPES = ['DIGITAL', 'PHYSICAL', 'SERVICE', 'SUBSCRIPTION'];

function parseCSV(text: string): { rows: ParsedProduct[]; errors: string[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { rows: [], errors: ['CSV must have a header row and at least one data row'] };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const rows: ParsedProduct[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, any> = {};
    headers.forEach((h, j) => { row[h] = values[j] ?? ''; });

    if (!row.name) { errors.push(`Row ${i + 1}: Missing name`); continue; }
    if (!row.price || isNaN(parseFloat(row.price))) { errors.push(`Row ${i + 1}: Invalid price`); continue; }
    const type = (row.type ?? 'PHYSICAL').toUpperCase();
    if (!PRODUCT_TYPES.includes(type)) { errors.push(`Row ${i + 1}: Invalid type "${row.type}"`); continue; }

    rows.push({
      name: row.name,
      type,
      price: parseFloat(row.price),
      sku: row.sku || undefined,
      inventory: row.inventory ? parseInt(row.inventory) : undefined,
      description: row.description || undefined,
    });
  }

  return { rows, errors };
}

function generateTemplateCSV(): string {
  const header = CSV_COLUMNS.join(',');
  const example = 'Sample Product,PHYSICAL,29.99,SKU-001,100,A great product';
  return `${header}\n${example}\n`;
}

export default function ProductImportPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [storeName, setStoreName] = useState('Store');
  const [activeTab, setActiveTab] = useState<ImportTab>('csv');
  const [dragging, setDragging] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!storeId) return;
    api(`/api/commerce/stores/${storeId}`)
      .then((d) => setStoreName(d?.data?.name ?? d?.name ?? 'Store'))
      .catch(() => {});
  }, [storeId]);

  const handleCSVFile = useCallback((file: File) => {
    setCsvFile(file);
    setImportResults([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setPreview(rows);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleCSVFile(file);
    else showToast('Please drop a .csv file');
  };

  const handleJsonParse = () => {
    setParseErrors([]);
    setImportResults([]);
    try {
      const parsed = JSON.parse(jsonText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const errors: string[] = [];
      const rows: ParsedProduct[] = [];
      arr.forEach((item: any, i: number) => {
        if (!item.name) { errors.push(`Item ${i + 1}: Missing name`); return; }
        if (item.price == null || isNaN(parseFloat(item.price))) { errors.push(`Item ${i + 1}: Invalid price`); return; }
        rows.push({
          name: item.name,
          type: (item.type ?? 'PHYSICAL').toUpperCase(),
          price: parseFloat(item.price),
          sku: item.sku,
          inventory: item.inventory != null ? parseInt(item.inventory) : undefined,
          description: item.description,
        });
      });
      setPreview(rows);
      setParseErrors(errors);
    } catch (e: any) {
      setParseErrors([`JSON parse error: ${e.message}`]);
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setImportProgress(0);
    setImportResults([]);
    const results: ImportResult[] = [];

    for (let i = 0; i < preview.length; i++) {
      const product = preview[i];
      try {
        await api(`/api/commerce/stores/${storeId}/products`, {
          method: 'POST',
          body: JSON.stringify(product),
        });
        results.push({ index: i, name: product.name, status: 'success' });
      } catch (e: any) {
        results.push({ index: i, name: product.name, status: 'error', error: e.message });
      }
      setImportProgress(Math.round(((i + 1) / preview.length) * 100));
      setImportResults([...results]);
    }

    setImporting(false);
    const successCount = results.filter((r) => r.status === 'success').length;
    showToast(`Imported ${successCount}/${preview.length} products`);
  };

  const downloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setCsvFile(null);
    setJsonText('');
    setPreview([]);
    setParseErrors([]);
    setImportResults([]);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const successCount = importResults.filter((r) => r.status === 'success').length;
  const errorResults = importResults.filter((r) => r.status === 'error');

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-5 py-3 text-sm text-white/90 shadow-2xl shadow-black/40">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}/products`}
          className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Import Products</h1>
          <p className="text-sm text-white/40 mt-0.5">{storeName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.04]">
        {[
          { id: 'csv' as ImportTab, label: 'CSV Import', icon: Upload },
          { id: 'bulk' as ImportTab, label: 'Manual Bulk Add', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); clearAll(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
              activeTab === id
                ? 'border-red-400 text-red-300'
                : 'border-transparent text-white/30 hover:text-white/60'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeTab === 'csv' ? (
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white/90">CSV File Upload</h2>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] px-3 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-all duration-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Template
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-200 ${
                  dragging
                    ? 'border-red-400/40 bg-red-500/[0.04]'
                    : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                }`}
              >
                <Upload className={`h-10 w-10 ${dragging ? 'text-red-300/60' : 'text-white/15'}`} />
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">
                    {csvFile ? csvFile.name : 'Drop your CSV file here'}
                  </p>
                  <p className="text-xs text-white/20 mt-1">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVFile(f); }}
                />
              </div>

              {/* CSV Format Instructions */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                <p className="text-[11px] font-medium text-white/30 mb-2 uppercase tracking-widest">CSV Format</p>
                <p className="text-xs text-white/25 mb-2">Required columns (in order):</p>
                <div className="flex flex-wrap gap-1.5">
                  {CSV_COLUMNS.map((col) => (
                    <span key={col} className="inline-block font-mono text-xs bg-white/[0.04] text-white/50 rounded-lg px-2 py-0.5 border border-white/[0.04]">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white/20 mt-2">
                  <strong className="text-white/30">type</strong>: DIGITAL, PHYSICAL, SERVICE, or SUBSCRIPTION. Price must be a number.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-white/90">JSON Array Input</h2>
              <p className="text-sm text-white/30">
                Paste a JSON array of products. Each object should have: name, type, price, and optionally sku, inventory, description.
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={12}
                placeholder={`[\n  {\n    "name": "Product Name",\n    "type": "PHYSICAL",\n    "price": 29.99,\n    "sku": "SKU-001",\n    "inventory": 100\n  }\n]`}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 resize-none transition-all duration-200"
              />
              <button
                onClick={handleJsonParse}
                disabled={!jsonText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-all duration-200 self-start"
              >
                Validate & Preview
              </button>
            </div>
          )}

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-2xl border border-red-500/[0.15] bg-red-500/[0.04] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-300" />
                <p className="text-sm font-medium text-red-300">Parse Errors ({parseErrors.length})</p>
              </div>
              <ul className="space-y-1">
                {parseErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-300/60">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Stats / Actions */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
            <h3 className="font-semibold text-white/90 mb-4">Import Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Products to import</span>
                <span className="font-medium text-white/90">{preview.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Parse errors</span>
                <span className={`font-medium ${parseErrors.length > 0 ? 'text-red-300' : 'text-white/40'}`}>
                  {parseErrors.length}
                </span>
              </div>
              {importResults.length > 0 && (
                <>
                  <div className="border-t border-white/[0.04] pt-3 flex justify-between text-sm">
                    <span className="text-white/30">Successful</span>
                    <span className="font-medium text-emerald-300">{successCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/30">Failed</span>
                    <span className={`font-medium ${errorResults.length > 0 ? 'text-red-300' : 'text-white/40'}`}>
                      {errorResults.length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Progress Bar */}
            {importing && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/30 mb-1.5">
                  <span>Importing...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400/70 transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {!importing && preview.length > 0 && (
              <button
                onClick={handleImport}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                Import {preview.length} Product{preview.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
            <h2 className="font-semibold text-white/90">Preview ({preview.length} products)</h2>
            <button onClick={clearAll} className="text-xs text-white/25 hover:text-white/60 transition-colors duration-200">
              Clear
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">#</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Name</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Type</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Price</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">SKU</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Inventory</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {preview.map((p, i) => {
                  const result = importResults.find((r) => r.index === i);
                  return (
                    <tr key={i} className={`transition-all duration-200 ${
                      result?.status === 'success' ? 'bg-emerald-500/[0.03]' :
                      result?.status === 'error' ? 'bg-red-500/[0.03]' :
                      'hover:bg-white/[0.02]'
                    }`}>
                      <td className="px-4 py-3 text-white/20 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-white/90">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-red-500/[0.08] text-red-300 text-[11px] px-2.5 py-0.5 border border-red-500/[0.12]">
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/30">{p.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-white/40">{p.inventory ?? '—'}</td>
                      <td className="px-4 py-3">
                        {result ? (
                          result.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                              <CheckCircle className="h-3.5 w-3.5" /> Imported
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-300" title={result.error}>
                              <X className="h-3.5 w-3.5" /> Failed
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-white/20">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Summary */}
      {errorResults.length > 0 && (
        <div className="rounded-2xl border border-red-500/[0.15] bg-red-500/[0.04] backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            <h3 className="text-sm font-semibold text-red-300">Import Errors ({errorResults.length})</h3>
          </div>
          <ul className="space-y-1.5">
            {errorResults.map((r) => (
              <li key={r.index} className="text-xs text-red-300/60">
                Row {r.index + 1} — <strong>{r.name}</strong>: {r.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

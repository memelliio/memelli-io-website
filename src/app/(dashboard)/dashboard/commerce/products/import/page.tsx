'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertTriangle, X } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';

interface Store {
  id: string;
  name: string;
}

interface CsvRow {
  [key: string]: string;
}

interface FieldMapping {
  name: string;
  description: string;
  basePrice: string;
  comparePrice: string;
  sku: string;
  inventory: string;
  type: string;
  imageUrls: string;
}

const REQUIRED_FIELDS: (keyof FieldMapping)[] = ['name', 'basePrice'];
const ALL_FIELDS: { key: keyof FieldMapping; label: string; required: boolean }[] = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'basePrice', label: 'Price', required: true },
  { key: 'comparePrice', label: 'Compare-at Price', required: false },
  { key: 'sku', label: 'SKU', required: false },
  { key: 'inventory', label: 'Stock Quantity', required: false },
  { key: 'type', label: 'Product Type', required: false },
  { key: 'imageUrls', label: 'Image URLs (comma-separated)', required: false },
];

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
  return { headers, rows };
}

export default function ImportProductsPage() {
  const api = useApi();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<FieldMapping>({
    name: '',
    description: '',
    basePrice: '',
    comparePrice: '',
    sku: '',
    inventory: '',
    type: '',
    imageUrls: '',
  });
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(0);

  useEffect(() => {
    api.get<{ data: Store[] } | Store[]>('/api/commerce/stores').then((res) => {
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as { data: Store[] }).data ?? [];
        setStores(list);
        if (list.length > 0) setStoreId(list[0].id);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map based on header name similarity
      const autoMap: FieldMapping = { ...mapping };
      ALL_FIELDS.forEach(({ key }) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase() === key.toLowerCase() ||
            h.toLowerCase().replace(/[_\s-]/g, '') === key.toLowerCase().replace(/[_\s-]/g, '')
        );
        if (match) (autoMap as any)[key] = match;
      });
      // Extra common mappings
      if (!autoMap.name) {
        const n = headers.find((h) => /^(product.?name|title|product)$/i.test(h));
        if (n) autoMap.name = n;
      }
      if (!autoMap.basePrice) {
        const p = headers.find((h) => /^(price|base.?price|unit.?price|amount)$/i.test(h));
        if (p) autoMap.basePrice = p;
      }
      if (!autoMap.inventory) {
        const s = headers.find((h) => /^(stock|quantity|qty|inventory)$/i.test(h));
        if (s) autoMap.inventory = s;
      }
      setMapping(autoMap);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const canProceedToPreview = REQUIRED_FIELDS.every((f) => mapping[f]);

  const getMappedRows = () => {
    return csvRows.map((row) => ({
      name: row[mapping.name] ?? '',
      description: mapping.description ? row[mapping.description] ?? '' : '',
      basePrice: parseFloat(row[mapping.basePrice] ?? '0') || 0,
      comparePrice: mapping.comparePrice ? parseFloat(row[mapping.comparePrice] ?? '0') || undefined : undefined,
      sku: mapping.sku ? row[mapping.sku] ?? '' : '',
      inventory: mapping.inventory ? parseInt(row[mapping.inventory] ?? '0') || 0 : 0,
      type: mapping.type ? (row[mapping.type] ?? 'PHYSICAL').toUpperCase() : 'PHYSICAL',
      imageUrls: mapping.imageUrls
        ? (row[mapping.imageUrls] ?? '')
            .split(',')
            .map((u: string) => u.trim())
            .filter(Boolean)
        : [],
    }));
  };

  const handleImport = async () => {
    setStep('importing');
    const mapped = getMappedRows().filter((r) => r.name.trim());
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < mapped.length; i++) {
      setImportProgress(Math.round(((i + 1) / mapped.length) * 100));

      const product = mapped[i];
      const validType = ['PHYSICAL', 'DIGITAL', 'SERVICE', 'SUBSCRIPTION'].includes(product.type)
        ? product.type
        : 'PHYSICAL';

      const res = await api.post('/api/commerce/products', {
        storeId,
        name: product.name,
        description: product.description || undefined,
        basePrice: product.basePrice,
        comparePrice: product.comparePrice,
        sku: product.sku || undefined,
        inventory: product.inventory,
        type: validType,
        imageUrls: product.imageUrls,
      });

      if (res.error) {
        errors.push(`Row ${i + 1} (${product.name}): ${res.error}`);
      } else {
        success++;
      }
    }

    setImportErrors(errors);
    setImportSuccess(success);
    setStep('done');
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/commerce/products"
          className="rounded-2xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Import Products</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">Upload a CSV file to bulk import products</p>
        </div>
      </div>

      {/* Store selector */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Import to Store</label>
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.06] bg-card backdrop-blur-xl py-16 cursor-pointer hover:border-primary/30 hover:bg-white/[0.04] transition-all duration-200"
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-semibold tracking-tight text-foreground">Click to upload CSV file</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">Supports .csv files with headers</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">Map CSV Columns</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {fileName} - {csvRows.length} rows found
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {ALL_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="flex items-center gap-3">
                <label className="w-48 text-sm text-muted-foreground leading-relaxed flex-shrink-0">
                  {label}
                  {required && <span className="text-primary ml-1">*</span>}
                </label>
                <select
                  value={(mapping as any)[key]}
                  onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                  className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="">-- Skip --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                {(mapping as any)[key] && (
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setStep('upload');
                setCsvHeaders([]);
                setCsvRows([]);
              }}
              className="rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
            >
              Re-upload
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!canProceedToPreview}
              className="bg-primary hover:bg-primary/90 rounded-xl px-6 py-2 text-sm font-medium text-white disabled:opacity-30 transition-all duration-200"
            >
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="flex flex-col gap-4">
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.04]">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Preview ({getMappedRows().filter((r) => r.name.trim()).length} valid products)
              </p>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card backdrop-blur-xl">
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {getMappedRows()
                    .slice(0, 50)
                    .map((row, i) => (
                      <tr key={i} className={!row.name.trim() ? 'opacity-30' : 'hover:bg-white/[0.04]'}>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-4 py-2 text-foreground">{row.name || '(empty)'}</td>
                        <td className="px-4 py-2 text-muted-foreground">${row.basePrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.inventory}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{row.type}</td>
                        <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{row.sku || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {csvRows.length > 50 && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-white/[0.04]">
                Showing first 50 of {csvRows.length} rows
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('mapping')}
              className="rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              disabled={!storeId}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 rounded-xl px-6 py-2 text-sm font-medium text-white disabled:opacity-30 transition-all duration-200"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import {getMappedRows().filter((r) => r.name.trim()).length} Products
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/80 border-t-transparent" />
          <p className="text-sm font-semibold tracking-tight text-foreground">Importing products...</p>
          <div className="w-full max-w-sm">
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/80/80 transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 text-center">{importProgress}% complete</p>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 p-3">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold tracking-tight text-foreground">Import Complete</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {importSuccess} product{importSuccess !== 1 ? 's' : ''} imported successfully
          </p>

          {importErrors.length > 0 && (
            <div className="w-full rounded-2xl bg-primary/80/[0.06] border border-primary/[0.12] p-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">
                  {importErrors.length} error{importErrors.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {importErrors.map((err, i) => (
                  <p key={i} className="text-xs text-primary/80/80">
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/dashboard/commerce/products"
            className="mt-2 bg-primary hover:bg-primary/90 rounded-xl px-6 py-2 text-sm font-medium text-white transition-all duration-200"
          >
            View Products
          </Link>
        </div>
      )}
    </div>
  );
}

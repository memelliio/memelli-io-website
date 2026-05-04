'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  QrCode,
  Download,
  Printer,
  Image,
  FileCode2,
  Clock,
  Link2,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LinkOption {
  id: string;
  name: string;
  url: string;
}

interface QRCodeItem {
  id: string;
  linkId: string;
  linkName: string;
  imageUrl: string;
  format: string;
  createdAt: string;
}

interface QRGenResult {
  imageUrl: string;
  svgUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function QRCodePage() {
  const api = useApi();
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [generatedQR, setGeneratedQR] = useState<QRGenResult | null>(null);

  // Fetch links for dropdown
  const { data: links } = useQuery<LinkOption[]>({
    queryKey: ['lite-links-dropdown'],
    queryFn: async () => {
      const res = await api.get<LinkOption[]>('/api/lite/links?fields=id,name,url');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // QR code history
  const { data: history } = useQuery<QRCodeItem[]>({
    queryKey: ['lite-qr-history'],
    queryFn: async () => {
      const res = await api.get<QRCodeItem[]>('/api/lite/qr-codes');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Generate QR
  const generateQR = useMutation({
    mutationFn: async () => {
      const res = await api.post<QRGenResult>('/api/lite/qr-codes', { linkId: selectedLinkId });
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to generate');
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedQR(data);
      toast.success('QR code generated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const linkOptions = links ?? [];
  const qrHistory = history ?? [];
  const selectedLink = linkOptions.find((l) => l.id === selectedLinkId);

  function downloadQR(url: string, format: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code.${format}`;
    a.click();
  }

  function printQR() {
    const w = window.open('', '_blank');
    if (!w || !generatedQR) return;
    w.document.write(`
      <html>
        <head><title>QR Code - ${selectedLink?.name ?? 'Referral'}</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100dvh;margin:0;background:#fff;">
          <div style="text-align:center;">
            <img src="${generatedQR.imageUrl}" style="width:400px;height:400px;" />
            <p style="font-family:sans-serif;color:#333;margin-top:16px;">${selectedLink?.name ?? 'Referral Link'}</p>
            <p style="font-family:sans-serif;color:#999;font-size:12px;">${selectedLink?.url ?? ''}</p>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">QR Codes</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Generate QR codes for your referral links to share offline.</p>
      </div>

      {/* Generator */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-6">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100">
          <QrCode className="h-4 w-4 text-primary" />
          Generate QR Code
        </h3>

        {/* Select link */}
        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Select a Link</label>
          <select
            value={selectedLinkId}
            onChange={(e) => {
              setSelectedLinkId(e.target.value);
              setGeneratedQR(null);
            }}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="">Choose a referral link...</option>
            {linkOptions.map((link) => (
              <option key={link.id} value={link.id}>
                {link.name} - {link.url}
              </option>
            ))}
          </select>
        </div>

        {/* Generate button */}
        <button
          onClick={() => generateQR.mutate()}
          disabled={!selectedLinkId || generateQR.isPending}
          className="mb-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-40 sm:w-auto"
        >
          {generateQR.isPending ? 'Generating...' : 'Generate QR Code'}
        </button>

        {/* Preview */}
        {generatedQR && (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8">
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-4 shadow-2xl shadow-white/5">
              <img
                src={generatedQR.imageUrl}
                alt="QR Code"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/70">{selectedLink?.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{selectedLink?.url}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => downloadQR(generatedQR.imageUrl, 'png')}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
              >
                <Image className="h-4 w-4" />
                PNG
              </button>
              {generatedQR.svgUrl && (
                <button
                  onClick={() => downloadQR(generatedQR.svgUrl!, 'svg')}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
                >
                  <FileCode2 className="h-4 w-4" />
                  SVG
                </button>
              )}
              <button
                onClick={printQR}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR History Gallery */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100">
          <Clock className="h-4 w-4 text-zinc-400" />
          QR Code History
        </h2>
        {qrHistory.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl px-5 py-12 text-center">
            <QrCode className="mx-auto mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-zinc-400">No QR codes generated yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {qrHistory.map((qr) => (
              <div key={qr.id} className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-4">
                <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-white p-2 shadow-lg shadow-white/5">
                  <img src={qr.imageUrl} alt="QR" className="h-full w-full object-contain" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Link2 className="h-3 w-3 text-zinc-400/60" />
                  <span className="truncate">{qr.linkName}</span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-400/60">
                  {new Date(qr.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => downloadQR(qr.imageUrl, 'png')}
                  className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl border border-white/[0.06] py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-white/50 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

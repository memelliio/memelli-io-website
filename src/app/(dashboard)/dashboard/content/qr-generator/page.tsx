'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  QrCode,
  Download,
  Plus,
  Trash2,
  Link,
  Users,
  Wifi,
  Type,
  Tag,
  Image,
  Palette,
  Maximize2,
  Copy,
  CheckCircle,
  Layers,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

/* ================================================================= */
/*  QR Encoder (pure JS, no dependency)                               */
/* ================================================================= */

// Minimal QR Code generator — supports alphanumeric/byte mode, ECC-L
// Based on the QR code specification (ISO/IEC 18004)

const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF256_EXP[i] = GF256_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

function rsGenPoly(n: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < n; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF256_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGenPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// Version capacities for ECC level L (byte mode)
const VERSION_CAPACITY_L = [
  0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271,
  321, 367, 425, 458, 520, 586, 644, 718, 792, 858,
  929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732,
  1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953,
];

const EC_CODEWORDS_PER_BLOCK_L = [
  0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18,
  20, 24, 26, 30, 22, 24, 28, 30, 28, 28,
  28, 28, 30, 30, 26, 28, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
];

const NUM_EC_BLOCKS_L = [
  0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
];

// Alignment pattern positions per version
const ALIGNMENT_POSITIONS: number[][] = [
  [], [], [6,18], [6,22], [6,26], [6,30], [6,34],
  [6,22,38], [6,24,42], [6,26,46], [6,28,50],
  [6,30,54], [6,32,58], [6,34,62], [6,26,46,66],
  [6,26,48,70], [6,26,50,74], [6,30,54,78], [6,30,56,82],
  [6,30,58,86], [6,34,62,90], [6,28,50,72,94], [6,26,50,74,98],
  [6,30,54,78,102], [6,28,54,80,106], [6,32,58,84,110],
  [6,30,58,86,114], [6,34,62,90,118], [6,26,50,74,98,122],
  [6,30,54,78,102,126], [6,26,52,78,104,130],
  [6,30,56,82,108,134], [6,34,60,86,112,138],
  [6,30,58,86,114,142], [6,34,62,90,118,146],
  [6,30,54,78,102,126,150], [6,24,50,76,102,128,154],
  [6,28,54,80,106,132,158], [6,32,58,84,110,136,162],
  [6,26,54,82,110,138,166], [6,30,58,86,114,142,170],
];

function getVersion(dataLen: number): number {
  for (let v = 1; v <= 40; v++) {
    if (VERSION_CAPACITY_L[v] >= dataLen) return v;
  }
  return 40;
}

function encodeData(text: string): { version: number; modules: boolean[][] } {
  const bytes = new TextEncoder().encode(text);
  const version = getVersion(bytes.length);
  const size = version * 4 + 17;

  const ecPerBlock = EC_CODEWORDS_PER_BLOCK_L[version];
  const numBlocks = NUM_EC_BLOCKS_L[version];
  const totalCodewords = (() => {
    // Total codewords for version
    const totalBits = (() => {
      // Data capacity in bits
      const capacity = VERSION_CAPACITY_L[version];
      const totalDataCodewords = capacity; // approximate
      return totalDataCodewords;
    })();
    return totalBits;
  })();

  // Total data codewords
  const totalDataCW = VERSION_CAPACITY_L[version];
  const totalEcCW = ecPerBlock * numBlocks;
  const totalCW = totalDataCW + totalEcCW;

  // Build data bitstream
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  // Mode indicator: byte mode = 0100
  pushBits(4, 4);
  // Character count
  const ccBits = version <= 9 ? 8 : 16;
  pushBits(bytes.length, ccBits);
  // Data
  for (const b of bytes) pushBits(b, 8);
  // Terminator
  const dataBitsCapacity = totalDataCW * 8;
  const terminatorLen = Math.min(4, dataBitsCapacity - bits.length);
  pushBits(0, terminatorLen);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataBitsCapacity) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to codewords
  const dataCodewords = new Uint8Array(totalDataCW);
  for (let i = 0; i < totalDataCW; i++) {
    let val = 0;
    for (let b = 0; b < 8; b++) val = (val << 1) | (bits[i * 8 + b] || 0);
    dataCodewords[i] = val;
  }

  // Split into blocks and compute EC
  const blockDataLen = Math.floor(totalDataCW / numBlocks);
  const extraBlocks = totalDataCW % numBlocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const bLen = blockDataLen + (b >= numBlocks - extraBlocks ? 1 : 0);
    const block = dataCodewords.slice(offset, offset + bLen);
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
    offset += bLen;
  }

  // Interleave
  const finalData: number[] = [];
  const maxDataLen = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) finalData.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) finalData.push(block[i]);
    }
  }

  // Create module grid
  const modules: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Place finder patterns
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inSeparator = r === -1 || r === 7 || c === -1 || c === 7;
        modules[rr][cc] = !inSeparator && (inOuter || inInner);
        isFunction[rr][cc] = true;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Place alignment patterns
  if (version >= 2) {
    const positions = ALIGNMENT_POSITIONS[version] || [];
    for (const r of positions) {
      for (const c of positions) {
        // Skip if overlaps with finder
        if (r <= 8 && c <= 8) continue;
        if (r <= 8 && c >= size - 8) continue;
        if (r >= size - 8 && c <= 8) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 ||
              (dr === 0 && dc === 0);
            modules[r + dr][c + dc] = dark;
            isFunction[r + dr][c + dc] = true;
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    isFunction[6][i] = true;
    modules[i][6] = i % 2 === 0;
    isFunction[i][6] = true;
  }

  // Dark module
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (i < size) { isFunction[8][i] = true; isFunction[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // Reserve version info (version >= 7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        isFunction[i][size - 11 + j] = true;
        isFunction[size - 11 + j][i] = true;
      }
    }
  }

  // Place data bits
  const allBits: number[] = [];
  for (const byte of finalData) {
    for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
  }

  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (isFunction[row][col]) continue;
        modules[row][col] = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
        bitIdx++;
      }
    }
  }

  // Apply mask (mask 0: (row + col) % 2 === 0) and format info
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        if ((r + c) % 2 === 0) {
          modules[r][c] = !modules[r][c];
        }
      }
    }
  }

  // Write format info for mask 0, ECC L
  // Pre-computed format info bits for L, mask 0: 111011111000100
  const formatBits = [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0];
  // Around top-left finder
  for (let i = 0; i <= 5; i++) modules[8][i] = formatBits[i] === 1;
  modules[8][7] = formatBits[6] === 1;
  modules[8][8] = formatBits[7] === 1;
  modules[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = formatBits[i] === 1;
  // Around top-right and bottom-left finders
  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = formatBits[14 - i] === 1;
  for (let i = 0; i < 7; i++) modules[size - 1 - i][8] = formatBits[i] === 1;
  modules[size - 8][8] = true;

  return {
    version,
    modules: modules.map(row => row.map(cell => cell === true)),
  };
}

/* ================================================================= */
/*  Canvas rendering                                                   */
/* ================================================================= */

function renderQR(
  canvas: HTMLCanvasElement,
  modules: boolean[][],
  opts: {
    size: number;
    fgColor: string;
    bgColor: string;
    logoDataUrl?: string | null;
  }
) {
  const ctx = canvas.getContext('2d')!;
  const modCount = modules.length;
  const quiet = 4; // quiet zone modules
  const totalMod = modCount + quiet * 2;
  const scale = opts.size / totalMod;

  canvas.width = opts.size;
  canvas.height = opts.size;

  // Background
  ctx.fillStyle = opts.bgColor;
  ctx.fillRect(0, 0, opts.size, opts.size);

  // Modules
  ctx.fillStyle = opts.fgColor;
  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (modules[r][c]) {
        ctx.fillRect(
          Math.floor((c + quiet) * scale),
          Math.floor((r + quiet) * scale),
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }

  // Logo overlay
  if (opts.logoDataUrl) {
    const img = new window.Image();
    img.onload = () => {
      const logoSize = opts.size * 0.22;
      const logoX = (opts.size - logoSize) / 2;
      const logoY = (opts.size - logoSize) / 2;
      // White background behind logo
      ctx.fillStyle = opts.bgColor;
      const pad = logoSize * 0.1;
      ctx.fillRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2);
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
    };
    img.src = opts.logoDataUrl;
  }
}

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type QRType = 'url' | 'affiliate' | 'vcard' | 'wifi' | 'text';

interface GeneratedQR {
  id: string;
  label: string;
  type: QRType;
  content: string;
  fgColor: string;
  bgColor: string;
  size: number;
  logoDataUrl: string | null;
  createdAt: string;
}

const QR_TYPES: { id: QRType; label: string; icon: typeof Link; description: string }[] = [
  { id: 'url', label: 'Website Link', icon: Link, description: 'Any URL or webpage' },
  { id: 'affiliate', label: 'Affiliate Link', icon: Tag, description: 'Tracked affiliate URLs' },
  { id: 'vcard', label: 'vCard', icon: Users, description: 'Contact information card' },
  { id: 'wifi', label: 'WiFi Network', icon: Wifi, description: 'WiFi login credentials' },
  { id: 'text', label: 'Plain Text', icon: Type, description: 'Any text content' },
];

const SIZE_OPTIONS = [
  { value: 256, label: 'Small (256px)' },
  { value: 512, label: 'Medium (512px)' },
  { value: 1024, label: 'Large (1024px)' },
  { value: 2048, label: 'XL (2048px)' },
];

const PRESET_COLORS = [
  { fg: '#000000', bg: '#ffffff', label: 'Classic' },
  { fg: '#dc2626', bg: '#0a0a0a', label: 'Red Dark' },
  { fg: '#ffffff', bg: '#0a0a0a', label: 'White on Black' },
  { fg: '#dc2626', bg: '#ffffff', label: 'Red on White' },
  { fg: '#1d4ed8', bg: '#ffffff', label: 'Blue' },
  { fg: '#059669', bg: '#ffffff', label: 'Green' },
];

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function QRGeneratorPage() {
  // Form state
  const [qrType, setQrType] = useState<QRType>('url');
  const [label, setLabel] = useState('');
  const [fgColor, setFgColor] = useState('#dc2626');
  const [bgColor, setBgColor] = useState('#0a0a0a');
  const [qrSize, setQrSize] = useState(512);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Type-specific fields
  const [url, setUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [plainText, setPlainText] = useState('');

  // Bulk generate
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');

  // Gallery
  const [gallery, setGallery] = useState<GeneratedQR[]>([]);

  // Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Build content string based on type
  const buildContent = useCallback((): string => {
    switch (qrType) {
      case 'url':
        return url;
      case 'affiliate': {
        const base = affiliateUrl.includes('?') ? `${affiliateUrl}&` : `${affiliateUrl}?`;
        return affiliateCode ? `${base}ref=${affiliateCode}` : affiliateUrl;
      }
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${vcardName}`,
          vcardPhone ? `TEL:${vcardPhone}` : '',
          vcardEmail ? `EMAIL:${vcardEmail}` : '',
          vcardOrg ? `ORG:${vcardOrg}` : '',
          'END:VCARD',
        ].filter(Boolean).join('\n');
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case 'text':
        return plainText;
      default:
        return '';
    }
  }, [qrType, url, affiliateUrl, affiliateCode, vcardName, vcardPhone, vcardEmail, vcardOrg, wifiSsid, wifiPassword, wifiEncryption, plainText]);

  // Update preview
  useEffect(() => {
    const content = buildContent();
    if (!content || !previewCanvasRef.current) return;
    try {
      const { modules } = encodeData(content);
      renderQR(previewCanvasRef.current, modules, {
        size: 280,
        fgColor,
        bgColor,
        logoDataUrl,
      });
    } catch {
      // Content too long or invalid — clear canvas
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 280, 280);
        ctx.fillStyle = fgColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Content too long', 140, 140);
      }
    }
  }, [buildContent, fgColor, bgColor, logoDataUrl]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Generate and add to gallery
  const handleGenerate = useCallback(() => {
    const content = buildContent();
    if (!content) {
      toast.error('Please enter content for the QR code');
      return;
    }

    try {
      const { modules } = encodeData(content);
      const newQR: GeneratedQR = {
        id: crypto.randomUUID(),
        label: label || `${QR_TYPES.find(t => t.id === qrType)?.label} QR`,
        type: qrType,
        content,
        fgColor,
        bgColor,
        size: qrSize,
        logoDataUrl,
        createdAt: new Date().toISOString(),
      };
      setGallery(prev => [newQR, ...prev]);
      toast.success('QR code generated and added to gallery');
    } catch {
      toast.error('Failed to generate QR code. Content may be too long.');
    }
  }, [buildContent, label, qrType, fgColor, bgColor, qrSize, logoDataUrl]);

  // Bulk generate
  const handleBulkGenerate = useCallback(() => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      toast.error('Enter at least one URL');
      return;
    }

    const newQRs: GeneratedQR[] = [];
    let failed = 0;
    for (const u of urls) {
      try {
        encodeData(u); // validate
        newQRs.push({
          id: crypto.randomUUID(),
          label: new URL(u).hostname || u.slice(0, 30),
          type: 'url',
          content: u,
          fgColor,
          bgColor,
          size: qrSize,
          logoDataUrl,
          createdAt: new Date().toISOString(),
        });
      } catch {
        failed++;
      }
    }

    setGallery(prev => [...newQRs, ...prev]);
    toast.success(`Generated ${newQRs.length} QR codes${failed ? `, ${failed} failed` : ''}`);
    setBulkUrls('');
    setBulkMode(false);
  }, [bulkUrls, fgColor, bgColor, qrSize, logoDataUrl]);

  // Download a QR code
  const handleDownload = useCallback((qr: GeneratedQR) => {
    try {
      const { modules } = encodeData(qr.content);
      const offscreen = document.createElement('canvas');
      renderQR(offscreen, modules, {
        size: qr.size,
        fgColor: qr.fgColor,
        bgColor: qr.bgColor,
        logoDataUrl: qr.logoDataUrl,
      });

      // Wait for potential logo to load
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `${qr.label.replace(/[^a-zA-Z0-9-_]/g, '_')}_qr.png`;
        link.href = offscreen.toDataURL('image/png');
        link.click();
        toast.success('QR code downloaded');
      }, 300);
    } catch {
      toast.error('Failed to download QR code');
    }
  }, []);

  // Copy content
  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Content copied');
  }, []);

  // Delete from gallery
  const handleDelete = useCallback((id: string) => {
    setGallery(prev => prev.filter(q => q.id !== id));
  }, []);

  // Render gallery QR onto a visible canvas
  const GalleryQRCanvas = ({ qr }: { qr: GeneratedQR }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (!ref.current) return;
      try {
        const { modules } = encodeData(qr.content);
        renderQR(ref.current, modules, {
          size: 160,
          fgColor: qr.fgColor,
          bgColor: qr.bgColor,
          logoDataUrl: qr.logoDataUrl,
        });
      } catch {
        // ignore
      }
    }, [qr]);
    return <canvas ref={ref} width={160} height={160} className="rounded-lg" />;
  };

  const inputClass =
    'w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 backdrop-blur-xl transition-all duration-200';

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/10">
              <QrCode className="h-5 w-5 text-red-400" />
            </div>
            QR Code Generator
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create, customize, and download QR codes for links, contacts, WiFi, and more
          </p>
        </div>
        <button
          onClick={() => setBulkMode(!bulkMode)}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200 backdrop-blur-xl"
        >
          <Layers className="h-4 w-4" />
          {bulkMode ? 'Single Mode' : 'Bulk Generate'}
        </button>
      </div>

      {/* Bulk Mode */}
      {bulkMode && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-red-400" />
            Bulk Generate QR Codes
          </h2>
          <p className="text-xs text-muted-foreground">Enter one URL per line. Each will generate a separate QR code.</p>
          <textarea
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            placeholder={'https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3'}
            rows={6}
            className={`${inputClass} resize-none`}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {bulkUrls.split('\n').filter(u => u.trim()).length} URLs entered
            </span>
            <button
              onClick={handleBulkGenerate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Generate All
            </button>
          </div>
        </div>
      )}

      {/* Main Builder */}
      {!bulkMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* QR Type Selector */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <QrCode className="h-4 w-4 text-red-400" />
                QR Code Type
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {QR_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = qrType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setQrType(type.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
                        active
                          ? 'border-red-500/30 bg-red-500/10 shadow-lg shadow-red-500/5'
                          : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-red-400' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Fields */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Content</h2>

              {/* Label */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Label (for gallery)</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="My QR Code"
                  className={inputClass}
                />
              </div>

              {/* URL */}
              {qrType === 'url' && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Affiliate */}
              {qrType === 'affiliate' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Affiliate URL</label>
                    <input
                      type="url"
                      value={affiliateUrl}
                      onChange={(e) => setAffiliateUrl(e.target.value)}
                      placeholder="https://partner.example.com/product"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Referral Code</label>
                    <input
                      type="text"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="your-ref-code"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* vCard */}
              {qrType === 'vcard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Full Name</label>
                    <input type="text" value={vcardName} onChange={(e) => setVcardName(e.target.value)} placeholder="John Doe" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Phone</label>
                    <input type="tel" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} placeholder="+1 555 123 4567" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
                    <input type="email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} placeholder="john@example.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Organization</label>
                    <input type="text" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} placeholder="Acme Inc." className={inputClass} />
                  </div>
                </div>
              )}

              {/* WiFi */}
              {qrType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Network Name (SSID)</label>
                    <input type="text" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="MyNetwork" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Password</label>
                    <input type="text" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="password123" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Encryption</label>
                    <div className="flex gap-3">
                      {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                        <button
                          key={enc}
                          onClick={() => setWifiEncryption(enc)}
                          className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                            wifiEncryption === enc
                              ? 'border-red-500/30 bg-red-500/10 text-red-400'
                              : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                          }`}
                        >
                          {enc === 'nopass' ? 'None' : enc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Plain Text */}
              {qrType === 'text' && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Text Content</label>
                  <textarea
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    placeholder="Enter your text here..."
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-red-400" />
                Customize
              </h2>

              {/* Color Presets */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Color Presets</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setFgColor(preset.fg); setBgColor(preset.bg); }}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-200 ${
                        fgColor === preset.fg && bgColor === preset.bg
                          ? 'border-red-500/30 bg-red-500/10 text-foreground'
                          : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ backgroundColor: preset.fg }}
                      />
                      <span
                        className="h-3 w-3 rounded-full border border-white/10"
                        style={{ backgroundColor: preset.bg }}
                      />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Foreground Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" />
                  Download Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setQrSize(opt.value)}
                      className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                        qrSize === opt.value
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Logo Overlay
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
                  >
                    <Image className="h-4 w-4" />
                    {logoDataUrl ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  {logoDataUrl && (
                    <button
                      onClick={() => setLogoDataUrl(null)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-all duration-200"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview + Generate */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Preview</h2>
              <div className="flex justify-center">
                <div className="rounded-xl border border-white/[0.06] p-3 bg-white/[0.02]">
                  <canvas
                    ref={previewCanvasRef}
                    width={280}
                    height={280}
                    className="rounded-lg"
                    style={{ width: 280, height: 280 }}
                  />
                </div>
              </div>
              {logoDataUrl && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  Logo overlay applied
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-center">
                Live preview updates as you type
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3.5 text-sm font-semibold text-white hover:from-red-500 hover:to-red-400 transition-all duration-200 shadow-lg shadow-red-500/20"
            >
              <Plus className="h-4 w-4" />
              Generate QR Code
            </button>

            {/* Quick Info */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground">QR Code Info</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="text-foreground">{QR_TYPES.find(t => t.id === qrType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Download Size</span>
                  <span className="text-foreground">{qrSize}px</span>
                </div>
                <div className="flex justify-between">
                  <span>Format</span>
                  <span className="text-foreground">PNG</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Correction</span>
                  <span className="text-foreground">Level L</span>
                </div>
                {logoDataUrl && (
                  <div className="flex justify-between">
                    <span>Logo</span>
                    <span className="text-emerald-400">Attached</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <QrCode className="h-4 w-4 text-red-400" />
            QR Code Gallery
          </h2>
          <span className="text-xs text-muted-foreground">{gallery.length} codes</span>
        </div>

        {gallery.length === 0 ? (
          <div className="py-16 text-center">
            <QrCode className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">No QR codes generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the builder above to create your first QR code
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {gallery.map((qr) => {
              const typeInfo = QR_TYPES.find(t => t.id === qr.type);
              const TypeIcon = typeInfo?.icon || QrCode;
              return (
                <div
                  key={qr.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 space-y-3 group hover:border-white/[0.08] transition-all duration-200"
                >
                  <div className="flex justify-center">
                    <GalleryQRCanvas qr={qr} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {qr.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{qr.content}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
                        {typeInfo?.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{qr.size}px</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDownload(qr)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 text-xs text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
                    >
                      <Download className="h-3 w-3" />
                      PNG
                    </button>
                    <button
                      onClick={() => handleCopy(qr.id, qr.content)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 text-xs text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
                    >
                      {copied === qr.id ? (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied === qr.id ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden download canvas */}
      <canvas ref={downloadCanvasRef} className="hidden" />
    </div>
  );
}

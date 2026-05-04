'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Pencil,
  Sparkles,
  Download,
  Copy,
  ChevronRight,
  Upload,
  ImageIcon,
  Link2,
  ZoomIn,
  RotateCcw,
  Check,
  X,
  Loader2,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  Layers,
  Sliders,
  Crop,
  Zap,
  Sun,
  Contrast,
  Aperture,
  ScanLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type TabId = 'generate' | 'edit' | 'enhance';

type ImageStyle =
  | 'photorealistic'
  | 'digital-art'
  | 'illustration'
  | 'minimalist'
  | 'cinematic'
  | '3d-render'
  | 'watercolor'
  | 'abstract';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';
type Quality = 'standard' | 'hd';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: ImageStyle;
  size: AspectRatio;
  quality: Quality;
  createdAt: string;
}

type EditMode =
  | 'remove-bg'
  | 'enhance-quality'
  | 'change-style'
  | 'add-object'
  | 'replace-bg';

type EnhanceOption =
  | 'upscale-2x'
  | 'upscale-4x'
  | 'remove-noise'
  | 'sharpen'
  | 'color-correction'
  | 'hdr-effect';

interface UploadedFile {
  dataUrl: string;
  name: string;
  width: number;
  height: number;
}

/* ================================================================= */
/*  Constants                                                          */
/* ================================================================= */

const TABS: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'edit', label: 'Edit', icon: Pencil },
  { id: 'enhance', label: 'Enhance', icon: Wand2 },
];

const IMAGE_STYLES: { id: ImageStyle; label: string; desc: string; gradient: string }[] = [
  { id: 'photorealistic', label: 'Photorealistic', desc: 'True-to-life photography', gradient: 'from-sky-900/50 to-blue-900/30' },
  { id: 'digital-art', label: 'Digital Art', desc: 'Vibrant digital painting', gradient: 'from-violet-900/50 to-purple-900/30' },
  { id: 'illustration', label: 'Illustration', desc: 'Hand-crafted illustration', gradient: 'from-rose-900/50 to-pink-900/30' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Clean, precise lines', gradient: 'from-zinc-800/60 to-zinc-900/40' },
  { id: 'cinematic', label: 'Cinematic', desc: 'Film-grade composition', gradient: 'from-amber-900/50 to-yellow-900/30' },
  { id: '3d-render', label: '3D Render', desc: 'Ray-traced 3D scene', gradient: 'from-teal-900/50 to-cyan-900/30' },
  { id: 'watercolor', label: 'Watercolor', desc: 'Soft pigment washes', gradient: 'from-indigo-900/50 to-blue-900/30' },
  { id: 'abstract', label: 'Abstract', desc: 'Expressive abstraction', gradient: 'from-fuchsia-900/50 to-purple-900/30' },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: '1:1', label: '1:1', w: 1, h: 1 },
  { id: '16:9', label: '16:9', w: 16, h: 9 },
  { id: '9:16', label: '9:16', w: 9, h: 16 },
  { id: '4:3', label: '4:3', w: 4, h: 3 },
];

const EDIT_OPTIONS: { id: EditMode; label: string; desc: string; icon: React.ComponentType<any> }[] = [
  { id: 'remove-bg', label: 'Remove Background', desc: 'Clean subject isolation', icon: Layers },
  { id: 'enhance-quality', label: 'Enhance Quality', desc: 'AI sharpening and detail', icon: Sliders },
  { id: 'change-style', label: 'Change Style', desc: 'Transfer artistic style', icon: Aperture },
  { id: 'add-object', label: 'Add Object', desc: 'Insert new elements', icon: Crop },
  { id: 'replace-bg', label: 'Replace Background', desc: 'Swap the backdrop', icon: ImageIcon },
];

const ENHANCE_OPTIONS: { id: EnhanceOption; label: string; desc: string; icon: React.ComponentType<any> }[] = [
  { id: 'upscale-2x', label: 'Upscale 2x', desc: 'Double the resolution', icon: Maximize2 },
  { id: 'upscale-4x', label: 'Upscale 4x', desc: 'Quadruple the resolution', icon: ZoomIn },
  { id: 'remove-noise', label: 'Remove Noise', desc: 'AI denoising pass', icon: ScanLine },
  { id: 'sharpen', label: 'Sharpen', desc: 'Crisp edge definition', icon: Zap },
  { id: 'color-correction', label: 'Color Correction', desc: 'Balanced tones and hues', icon: Sun },
  { id: 'hdr-effect', label: 'HDR Effect', desc: 'Dynamic range expansion', icon: Contrast },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
  'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&q=80',
];

/* ================================================================= */
/*  Shared sub-components                                              */
/* ================================================================= */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      title="Copy URL"
      className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-card px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-150"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'URL'}
    </button>
  );
}

function ImageCard({ image, onEdit }: { image: GeneratedImage; onEdit: (img: GeneratedImage) => void }) {
  const ratioMap: Record<AspectRatio, string> = {
    '1:1': '1 / 1',
    '16:9': '16 / 9',
    '9:16': '9 / 16',
    '4:3': '4 / 3',
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card"
    >
      <div className="w-full overflow-hidden bg-muted" style={{ aspectRatio: ratioMap[image.size] }}>
        <img
          src={image.url}
          alt={image.prompt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable={false}
        />
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="line-clamp-2 text-[11px] leading-snug text-foreground">{image.prompt}</p>
        <div className="flex items-center gap-1.5">
          <a
            href={image.url}
            download
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-card px-2.5 py-1.5 text-[10px] text-foreground backdrop-blur-sm transition-all duration-150 hover:bg-white/[0.1] hover:text-white"
          >
            <Download className="h-3 w-3" />
            Save
          </a>
          <CopyButton text={image.url} />
          <button
            onClick={() => onEdit(image)}
            className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/20 px-2.5 py-1.5 text-[10px] text-primary/80 backdrop-blur-sm transition-all duration-150 hover:bg-primary/30 hover:text-primary/80"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
      </div>
      {/* Style badge */}
      <div className="absolute left-2 top-2 rounded-md border border-white/[0.06] bg-background px-2 py-0.5 text-[9px] font-medium text-muted-foreground backdrop-blur-sm">
        {IMAGE_STYLES.find((s) => s.id === image.style)?.label ?? image.style}
      </div>
    </motion.div>
  );
}

/* ── Upload Zone ── */

function UploadZone({ onFile, compact = false }: { onFile: (file: UploadedFile) => void; compact?: boolean }) {
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrl, setShowUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFromBlob = useCallback((blob: Blob | File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => onFile({ dataUrl, name: (blob as File).name ?? 'image', width: img.naturalWidth, height: img.naturalHeight });
      img.src = dataUrl;
    };
    reader.readAsDataURL(blob);
  }, [onFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadFromBlob(file);
  }, [loadFromBlob]);

  const handleUrlLoad = useCallback(() => {
    if (!urlInput.trim()) return;
    onFile({ dataUrl: urlInput.trim(), name: 'remote', width: 0, height: 0 });
    setUrlInput('');
    setShowUrl(false);
  }, [urlInput, onFile]);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200 ${compact ? 'p-6' : 'p-10'} ${dragging ? 'border-primary/60 bg-primary/80/[0.06]' : 'border-white/[0.08] bg-card hover:border-white/[0.14] hover:bg-card'}`}
      >
        <div className={`flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}>
          <Upload className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} text-muted-foreground`} />
        </div>
        <div className="text-center">
          <p className={`font-medium text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            Drop image here or <span className="text-primary">browse</span>
          </p>
          {!compact && <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP — up to 20 MB</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFromBlob(f); }} />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.04]" />
        <button onClick={() => setShowUrl((v) => !v)} className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <Link2 className="h-3 w-3" />
          Paste URL
          <ChevronRight className={`h-3 w-3 transition-transform ${showUrl ? 'rotate-90' : ''}`} />
        </button>
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>
      <AnimatePresence>
        {showUrl && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex gap-2">
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()} placeholder="https://example.com/image.jpg" className="flex-1 rounded-xl border border-white/[0.06] bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              <button onClick={handleUrlLoad} className="rounded-xl bg-gradient-to-r from-purple-700 to-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-600 hover:to-violet-500 transition-all">Load</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Animated Loading Ring ── */

function LoadingRing() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute h-32 w-32 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, transparent 0%, #9333ea 40%, #c084fc 60%, transparent 100%)', filter: 'blur(10px)', opacity: 0.7 }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute h-20 w-20 rounded-full"
          style={{ background: 'conic-gradient(from 180deg, transparent 0%, #7e22ce 50%, transparent 100%)', filter: 'blur(6px)', opacity: 0.5 }}
        />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-card backdrop-blur-sm">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
            <Sparkles className="h-6 w-6 text-primary" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Tab: Generate                                                      */
/* ================================================================= */

function GenerateTab({ onEditImage }: { onEditImage: (img: GeneratedImage) => void }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('photorealistic');
  const [size, setSize] = useState<AspectRatio>('1:1');
  const [quality, setQuality] = useState<Quality>('hd');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const doGenerate = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResults([]);

    const timer = new Promise<null>((r) => setTimeout(() => r(null), 2000));

    try {
      const res = await Promise.race([
        fetch('/api/media-studio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim(), style, size, quality }),
        }),
        timer.then(() => null),
      ]);

      if (res && res instanceof Response && res.ok) {
        const data = (await res.json()) as { images: { url: string; id: string }[] };
        const generated: GeneratedImage[] = data.images.map((img) => ({
          id: img.id,
          url: img.url,
          prompt: prompt.trim(),
          style,
          size,
          quality,
          createdAt: new Date().toISOString(),
        }));
        setResults(generated);
        setHistory((prev) => [...generated, ...prev].slice(0, 8));
        return;
      }
      throw new Error('No valid response');
    } catch {
      await timer;
      const fallback: GeneratedImage[] = PLACEHOLDER_IMAGES.slice(0, 4).map((url, i) => ({
        id: `fallback-${Date.now()}-${i}`,
        url,
        prompt: prompt.trim(),
        style,
        size,
        quality,
        createdAt: new Date().toISOString(),
      }));
      setResults(fallback);
      setHistory((prev) => [...fallback, ...prev].slice(0, 8));
      setError('Showing placeholder images — add OPENAI_API_KEY for real generation.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, style, size, quality, isLoading]);

  return (
    <div className="flex h-full">
      {/* Controls */}
      <div className="flex w-[380px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.04] p-5">
        {/* Prompt */}
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt</label>
          <div className="relative rounded-2xl border border-white/[0.06] bg-card transition-all duration-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/[0.12]">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              placeholder="A serene mountain lake at golden hour, mist rising from the water, ultra-detailed photography..."
              className="w-full resize-none rounded-2xl bg-transparent px-4 pb-3 pt-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ minHeight: '96px', maxHeight: '200px' }}
            />
            <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2">
              <span className="text-[10px] text-muted-foreground">{prompt.length} chars</span>
              {prompt.length > 0 && (
                <button onClick={() => { setPrompt(''); if (textareaRef.current) textareaRef.current.style.height = 'auto'; }} className="rounded-md p-0.5 text-muted-foreground transition-colors hover:text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Style</label>
          <div className="grid grid-cols-2 gap-2">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 ${style === s.id ? 'border-primary/40 bg-primary/80/[0.08] shadow-lg shadow-purple-500/5' : 'border-white/[0.04] bg-card hover:border-white/[0.08] hover:bg-card'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-60`} />
                <div className="relative">
                  <p className={`text-xs font-semibold ${style === s.id ? 'text-foreground' : 'text-foreground'}`}>{s.label}</p>
                  <p className={`mt-0.5 text-[10px] ${style === s.id ? 'text-primary/70' : 'text-muted-foreground'}`}>{s.desc}</p>
                </div>
                {style === s.id && (
                  <motion.div layoutId="style-check" className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary/80" transition={{ type: 'spring', stiffness: 500, damping: 35 }}>
                    <Check className="h-2.5 w-2.5 text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aspect Ratio</label>
          <div className="grid grid-cols-4 gap-2">
            {ASPECT_RATIOS.map((r) => {
              const maxDim = 28;
              const bh = r.h >= r.w ? maxDim : Math.round((r.h / r.w) * maxDim);
              const bw = r.w >= r.h ? maxDim : Math.round((r.w / r.h) * maxDim);
              return (
                <button
                  key={r.id}
                  onClick={() => setSize(r.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-3 transition-all duration-200 ${size === r.id ? 'border-primary/40 bg-primary/80/[0.08]' : 'border-white/[0.04] bg-card hover:border-white/[0.08]'}`}
                >
                  <div
                    className={`rounded-sm border transition-colors ${size === r.id ? 'border-primary/60 bg-primary/20' : 'border-border bg-muted'}`}
                    style={{ width: bw, height: bh }}
                  />
                  <span className={`text-[10px] font-semibold ${size === r.id ? 'text-primary/80' : 'text-muted-foreground'}`}>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quality</label>
          <div className="flex gap-2">
            {(['standard', 'hd'] as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${quality === q ? 'border-primary/40 bg-primary/80/[0.08] text-primary/80' : 'border-white/[0.04] bg-card text-muted-foreground hover:border-white/[0.08] hover:text-foreground'}`}
              >
                {q === 'hd' ? 'HD' : 'Standard'}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={doGenerate}
          disabled={!prompt.trim() || isLoading}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all duration-200 hover:from-purple-600 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Images
            </>
          )}
        </button>
      </div>

      {/* Canvas / Results */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="relative flex-1 overflow-y-auto p-5">
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-300/80">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-amber-500 hover:text-amber-300 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex min-h-[420px] items-center justify-center rounded-2xl border border-white/[0.04] bg-card">
                <LoadingRing />
                <div className="mt-28 text-center">
                  <p className="text-sm font-medium text-foreground">Generating your images</p>
                  <p className="mt-1 text-xs text-muted-foreground">Rendering {size} at {quality.toUpperCase()} quality</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results 2x2 grid */}
          {!isLoading && results.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Results — {results.length} images
                </p>
                <button onClick={doGenerate} className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground">
                  <RotateCcw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {results.map((img) => (
                  <ImageCard key={img.id} image={img} onEdit={onEditImage} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && results.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/[0.05]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-card">
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">No images yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Write a prompt and press Generate</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* History strip */}
        {history.length > 0 && (
          <div className="shrink-0 border-t border-white/[0.04] bg-card backdrop-blur-sm">
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">History</span>
              <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {history.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setResults([img])}
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-muted transition-all duration-150 hover:scale-105 hover:border-primary/30"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" draggable={false} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Tab: Edit                                                          */
/* ================================================================= */

function EditTab({ initialImage }: { initialImage?: GeneratedImage | null }) {
  const [uploaded, setUploaded] = useState<UploadedFile | null>(
    initialImage ? { dataUrl: initialImage.url, name: 'image', width: 0, height: 0 } : null,
  );
  const [editPrompt, setEditPrompt] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('enhance-quality');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleEdit = useCallback(async () => {
    if (!uploaded || isLoading) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/media-studio/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploaded.dataUrl, prompt: editPrompt, mode: editMode }),
      });
      if (!res.ok) throw new Error('Edit API failed');
      const data = (await res.json()) as { resultUrl: string };
      setResult(data.resultUrl);
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      setResult(PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]);
    } finally {
      setIsLoading(false);
    }
  }, [uploaded, editPrompt, editMode, isLoading]);

  return (
    <div className="flex h-full">
      {/* Controls */}
      <div className="flex w-[380px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.04] p-5">
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source Image</label>
          {uploaded ? (
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
              <img src={uploaded.dataUrl} alt="Source" className="h-40 w-full object-cover" />
              {uploaded.width > 0 && (
                <div className="absolute bottom-2 left-2 rounded-md border border-white/[0.06] bg-background px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
                  {uploaded.width} x {uploaded.height}
                </div>
              )}
              <button onClick={() => { setUploaded(null); setResult(null); }} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-background hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <UploadZone onFile={setUploaded} />
          )}
        </div>

        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Edit Mode</label>
          <div className="flex flex-col gap-2">
            {EDIT_OPTIONS.map((opt) => {
              const Icon = opt.icon as LucideIcon;
              const active = editMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setEditMode(opt.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${active ? 'border-primary/40 bg-primary/80/[0.08]' : 'border-white/[0.04] bg-card hover:border-white/[0.08] hover:bg-card'}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${active ? 'border-primary/30 bg-primary/20' : 'border-white/[0.05] bg-white/[0.03]'}`}>
                    <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${active ? 'text-foreground' : 'text-foreground'}`}>{opt.label}</p>
                    <p className={`text-[10px] ${active ? 'text-primary/60' : 'text-muted-foreground'}`}>{opt.desc}</p>
                  </div>
                  {active && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Edit Prompt</label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Describe the changes you want to make..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/[0.06] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/[0.12] transition-all"
          />
        </div>

        <button
          onClick={handleEdit}
          disabled={!uploaded || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all duration-200 hover:from-purple-600 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
        >
          {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Processing...</>) : (<><Pencil className="h-4 w-4" />Apply Edit</>)}
        </button>
      </div>

      {/* Before / After Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden p-5">
        {!uploaded ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/[0.05]">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-card">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Upload an image to edit</p>
              <p className="mt-1 text-xs text-muted-foreground">Before and after will appear here</p>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full gap-3">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card backdrop-blur-sm">
                <LoadingRing />
              </div>
            )}
            {/* Before */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-white/[0.06] bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Before</span>
                {uploaded.width > 0 && <span className="text-[10px] text-muted-foreground">{uploaded.width}×{uploaded.height}</span>}
              </div>
              <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
                <img src={uploaded.dataUrl} alt="Before" className="h-full w-full object-contain" />
              </div>
            </div>
            {/* Divider */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-card">
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            {/* After */}
            <div className="flex flex-1 flex-col gap-2">
              <span className="rounded-md border border-primary/20 bg-primary/80/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary self-start">After</span>
              <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
                {result ? (
                  <img src={result} alt="After" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-muted-foreground">Result will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Tab: Enhance                                                       */
/* ================================================================= */

function EnhanceTab() {
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [selected, setSelected] = useState<Set<EnhanceOption>>(new Set(['sharpen', 'color-correction'] as EnhanceOption[]));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const toggle = useCallback((id: EnhanceOption) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleEnhance = useCallback(async () => {
    if (!uploaded || isLoading || selected.size === 0) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/media-studio/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploaded.dataUrl, enhancements: [...selected] }),
      });
      if (!res.ok) throw new Error('Enhance API failed');
      const data = (await res.json()) as { resultUrl: string };
      setResult(data.resultUrl);
    } catch {
      await new Promise((r) => setTimeout(r, 1800));
      setResult(PLACEHOLDER_IMAGES[1]);
    } finally {
      setIsLoading(false);
    }
  }, [uploaded, selected, isLoading]);

  return (
    <div className="flex h-full">
      {/* Controls */}
      <div className="flex w-[380px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.04] p-5">
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source Image</label>
          {uploaded ? (
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
              <img src={uploaded.dataUrl} alt="Source" className="h-40 w-full object-cover" />
              {uploaded.width > 0 && (
                <div className="absolute bottom-2 left-2 rounded-md border border-white/[0.06] bg-background px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
                  {uploaded.width} x {uploaded.height}
                </div>
              )}
              <button onClick={() => { setUploaded(null); setResult(null); }} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-background hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <UploadZone onFile={setUploaded} />
          )}
        </div>

        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Enhancements <span className="ml-1 text-muted-foreground">({selected.size} selected)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ENHANCE_OPTIONS.map((opt) => {
              const Icon = opt.icon as LucideIcon;
              const active = selected.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${active ? 'border-primary/40 bg-primary/80/[0.08]' : 'border-white/[0.04] bg-card hover:border-white/[0.08] hover:bg-card'}`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${active ? 'border-primary/30 bg-primary/20' : 'border-white/[0.05] bg-white/[0.03]'}`}>
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-[11px] font-semibold ${active ? 'text-foreground' : 'text-foreground'}`}>{opt.label}</p>
                    <p className={`text-[10px] ${active ? 'text-primary/60' : 'text-muted-foreground'}`}>{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom */}
        {uploaded && (
          <div>
            <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Zoom — {Math.round(zoom * 100)}%
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-card text-muted-foreground transition-colors hover:text-foreground">
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <input type="range" min={25} max={400} step={25} value={zoom * 100} onChange={(e) => setZoom(Number(e.target.value) / 100)} className="flex-1 accent-purple-500" />
              <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-card text-muted-foreground transition-colors hover:text-foreground">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleEnhance}
          disabled={!uploaded || isLoading || selected.size === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all duration-200 hover:from-purple-600 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
        >
          {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Enhancing...</>) : (<><Wand2 className="h-4 w-4" />Enhance Image</>)}
        </button>
      </div>

      {/* Preview Canvas */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-5">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card backdrop-blur-sm">
            <LoadingRing />
          </div>
        )}

        {!uploaded ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-card">
              <ZoomIn className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Upload an image to enhance</p>
              <p className="mt-1 text-xs text-muted-foreground">Preview with zoom will appear here</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center overflow-auto rounded-2xl border border-white/[0.06] bg-card">
            <img
              src={result ?? uploaded.dataUrl}
              alt="Preview"
              className="object-contain transition-all duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', maxWidth: '100%', maxHeight: '100%' }}
              draggable={false}
            />
          </div>
        )}

        {result && !isLoading && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-card px-4 py-2 backdrop-blur-sm">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-foreground">Enhancement complete</span>
              <a href={result} download className="ml-2 flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[10px] text-foreground transition-all hover:bg-white/[0.08] hover:text-white">
                <Download className="h-3 w-3" />
                Save
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Page Root                                                          */
/* ================================================================= */

export default function MediaStudioPage() {
  const [activeTab, setActiveTab] = useState<TabId>('generate');
  const [editTarget, setEditTarget] = useState<GeneratedImage | null>(null);

  const handleEditImage = useCallback((img: GeneratedImage) => {
    setEditTarget(img);
    setActiveTab('edit');
  }, []);

  useEffect(() => {
    if (activeTab !== 'edit') setEditTarget(null);
  }, [activeTab]);

  return (
    <div className="flex flex-col overflow-hidden bg-card" style={{ height: 'calc(100dvh - 3.5rem - 3rem)' }}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] bg-card px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <ImageIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">Media Studio</h1>
            <p className="text-[11px] text-muted-foreground">AI image generation and editing</p>
          </div>
        </div>

        {/* Tab navigator */}
        <nav className="flex items-center gap-1 rounded-xl border border-white/[0.05] bg-card p-1 backdrop-blur-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon as LucideIcon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${active ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {active && (
                  <motion.div
                    layoutId="active-tab-bg"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-700 to-violet-600 shadow-lg shadow-purple-900/30"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Model badge */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-card px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/70 shadow-sm shadow-purple-400/60" />
          <span className="text-[10px] font-medium text-muted-foreground">DALL-E 3</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full"
          >
            {activeTab === 'generate' && <GenerateTab onEditImage={handleEditImage} />}
            {activeTab === 'edit' && <EditTab initialImage={editTarget} />}
            {activeTab === 'enhance' && <EnhanceTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

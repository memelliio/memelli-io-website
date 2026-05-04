'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { DemoBanner } from '@/components/shared/DemoBadge';
import {
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Upload,
  Download,
  Trash2,
  Pencil,
  Eye,
  X,
  Check,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Tag,
  Clock,
  History,
  Share2,
  FolderInput,
  Copy,
  HardDrive,
  Plus,
  CheckSquare,
  Square,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VaultFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  mimeType: string;
  size: number;
  folder: string;
  tags: string[];
  modifiedAt: string;
  createdAt: string;
  thumbnailUrl?: string;
  versions: FileVersion[];
}

interface FileVersion {
  id: string;
  version: number;
  size: number;
  modifiedAt: string;
  modifiedBy: string;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  fileCount: number;
}

type ViewMode = 'grid' | 'list';
type FileTypeFilter = 'all' | 'images' | 'docs' | 'video' | 'audio';
type SortField = 'name' | 'size' | 'modifiedAt' | 'type';
type SortDir = 'asc' | 'desc';

interface ContextMenu {
  x: number;
  y: number;
  fileId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_FOLDERS: FolderNode[] = [
  { name: 'marketing', path: '/marketing', children: [], fileCount: 0 },
  { name: 'products', path: '/products', children: [], fileCount: 0 },
  { name: 'campaigns', path: '/campaigns', children: [], fileCount: 0 },
  { name: 'seo', path: '/seo', children: [], fileCount: 0 },
  { name: 'ai_reports', path: '/ai_reports', children: [], fileCount: 0 },
  { name: 'uploads', path: '/uploads', children: [], fileCount: 0 },
  { name: 'assets', path: '/assets', children: [], fileCount: 0 },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <FileImage className="w-5 h-5 text-blue-400" />,
  document: <FileText className="w-5 h-5 text-red-400" />,
  video: <FileVideo className="w-5 h-5 text-primary" />,
  audio: <FileAudio className="w-5 h-5 text-emerald-400" />,
  other: <File className="w-5 h-5 text-muted-foreground" />,
};

const TYPE_ICONS_LG: Record<string, React.ReactNode> = {
  image: <FileImage className="w-10 h-10 text-blue-400" />,
  document: <FileText className="w-10 h-10 text-red-400" />,
  video: <FileVideo className="w-10 h-10 text-primary" />,
  audio: <FileAudio className="w-10 h-10 text-emerald-400" />,
  other: <File className="w-10 h-10 text-muted-foreground" />,
};

const STORAGE_TOTAL = 10 * 1024 * 1024 * 1024; // 10 GB

const SAMPLE_FILES: VaultFile[] = [
  {
    id: '1', name: 'hero-banner.png', type: 'image', mimeType: 'image/png',
    size: 2_400_000, folder: '/marketing', tags: ['homepage', 'banner'],
    modifiedAt: '2026-03-14T10:30:00Z', createdAt: '2026-03-10T08:00:00Z',
    versions: [
      { id: 'v1-1', version: 2, size: 2_400_000, modifiedAt: '2026-03-14T10:30:00Z', modifiedBy: 'admin' },
      { id: 'v1-0', version: 1, size: 2_100_000, modifiedAt: '2026-03-10T08:00:00Z', modifiedBy: 'admin' },
    ],
  },
  {
    id: '2', name: 'product-catalog-q1.pdf', type: 'document', mimeType: 'application/pdf',
    size: 5_800_000, folder: '/products', tags: ['catalog', 'q1-2026'],
    modifiedAt: '2026-03-12T14:00:00Z', createdAt: '2026-03-01T09:00:00Z',
    versions: [{ id: 'v2-0', version: 1, size: 5_800_000, modifiedAt: '2026-03-12T14:00:00Z', modifiedBy: 'admin' }],
  },
  {
    id: '3', name: 'campaign-video-spring.mp4', type: 'video', mimeType: 'video/mp4',
    size: 45_000_000, folder: '/campaigns', tags: ['spring-2026', 'video'],
    modifiedAt: '2026-03-11T16:00:00Z', createdAt: '2026-03-05T11:00:00Z',
    versions: [{ id: 'v3-0', version: 1, size: 45_000_000, modifiedAt: '2026-03-11T16:00:00Z', modifiedBy: 'admin' }],
  },
  {
    id: '4', name: 'seo-audit-march.pdf', type: 'document', mimeType: 'application/pdf',
    size: 1_200_000, folder: '/seo', tags: ['audit', 'march'],
    modifiedAt: '2026-03-13T09:00:00Z', createdAt: '2026-03-13T09:00:00Z',
    versions: [{ id: 'v4-0', version: 1, size: 1_200_000, modifiedAt: '2026-03-13T09:00:00Z', modifiedBy: 'admin' }],
  },
  {
    id: '5', name: 'ai-content-report.pdf', type: 'document', mimeType: 'application/pdf',
    size: 890_000, folder: '/ai_reports', tags: ['ai', 'content', 'weekly'],
    modifiedAt: '2026-03-14T08:00:00Z', createdAt: '2026-03-14T08:00:00Z',
    versions: [{ id: 'v5-0', version: 1, size: 890_000, modifiedAt: '2026-03-14T08:00:00Z', modifiedBy: 'admin' }],
  },
  {
    id: '6', name: 'logo-dark.svg', type: 'image', mimeType: 'image/svg+xml',
    size: 12_000, folder: '/assets', tags: ['logo', 'brand'],
    modifiedAt: '2026-02-20T12:00:00Z', createdAt: '2026-01-15T10:00:00Z',
    versions: [
      { id: 'v6-2', version: 3, size: 12_000, modifiedAt: '2026-02-20T12:00:00Z', modifiedBy: 'admin' },
      { id: 'v6-1', version: 2, size: 11_500, modifiedAt: '2026-02-01T10:00:00Z', modifiedBy: 'admin' },
      { id: 'v6-0', version: 1, size: 10_800, modifiedAt: '2026-01-15T10:00:00Z', modifiedBy: 'admin' },
    ],
  },
  {
    id: '7', name: 'podcast-episode-12.mp3', type: 'audio', mimeType: 'audio/mpeg',
    size: 32_000_000, folder: '/uploads', tags: ['podcast'],
    modifiedAt: '2026-03-10T07:00:00Z', createdAt: '2026-03-10T07:00:00Z',
    versions: [{ id: 'v7-0', version: 1, size: 32_000_000, modifiedAt: '2026-03-10T07:00:00Z', modifiedBy: 'admin' }],
  },
  {
    id: '8', name: 'social-templates.zip', type: 'other', mimeType: 'application/zip',
    size: 8_500_000, folder: '/marketing', tags: ['social', 'templates'],
    modifiedAt: '2026-03-09T15:00:00Z', createdAt: '2026-03-09T15:00:00Z',
    versions: [{ id: 'v8-0', version: 1, size: 8_500_000, modifiedAt: '2026-03-09T15:00:00Z', modifiedBy: 'admin' }],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function classifyMime(mime: string): VaultFile['type'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return 'document';
  return 'other';
}

function matchesTypeFilter(file: VaultFile, filter: FileTypeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'images') return file.type === 'image';
  if (filter === 'docs') return file.type === 'document';
  if (filter === 'video') return file.type === 'video';
  if (filter === 'audio') return file.type === 'audio';
  return true;
}

/* ------------------------------------------------------------------ */
/*  Folder Tree                                                        */
/* ------------------------------------------------------------------ */

function FolderTree({
  folders,
  currentPath,
  onSelect,
  fileCounts,
}: {
  folders: FolderNode[];
  currentPath: string;
  onSelect: (path: string) => void;
  fileCounts: Record<string, number>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(folders.map((f) => f.path)));

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-0.5">
      {/* Root */}
      <button
        onClick={() => onSelect('/')}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          currentPath === '/'
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
        }`}
      >
        <HardDrive className="w-4 h-4" />
        <span>All Files</span>
      </button>

      {folders.map((folder) => {
        const isActive = currentPath === folder.path;
        const isExpanded = expanded.has(folder.path);
        const count = fileCounts[folder.path] ?? 0;

        return (
          <div key={folder.path}>
            <button
              onClick={() => onSelect(folder.path)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              }`}
            >
              {folder.children.length > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(folder.path); }}
                  className="p-0.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}
              {isActive || isExpanded ? (
                <FolderOpen className="w-4 h-4 text-red-400" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
              <span className="flex-1 text-left truncate">{folder.name}</span>
              {count > 0 && (
                <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {count}
                </span>
              )}
            </button>

            {isExpanded && folder.children.length > 0 && (
              <div className="ml-4">
                <FolderTree
                  folders={folder.children}
                  currentPath={currentPath}
                  onSelect={onSelect}
                  fileCounts={fileCounts}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Context Menu                                                       */
/* ------------------------------------------------------------------ */

function ContextMenuPopup({
  x, y, onAction, onClose,
}: {
  x: number;
  y: number;
  onAction: (action: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { key: 'download', label: 'Download', icon: <Download className="w-4 h-4" /> },
    { key: 'rename', label: 'Rename', icon: <Pencil className="w-4 h-4" /> },
    { key: 'move', label: 'Move to...', icon: <FolderInput className="w-4 h-4" /> },
    { key: 'share', label: 'Share', icon: <Share2 className="w-4 h-4" /> },
    { key: 'versions', label: 'Version History', icon: <History className="w-4 h-4" /> },
    { key: 'divider', label: '', icon: null },
    { key: 'delete', label: 'Delete', icon: <Trash2 className="w-4 h-4 text-red-400" /> },
  ];

  // Adjust position to stay within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 320),
    left: Math.min(x, window.innerWidth - 200),
    zIndex: 100,
  };

  return (
    <div ref={ref} style={menuStyle} className="w-48 rounded-xl border border-border bg-card shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
      {items.map((item) =>
        item.key === 'divider' ? (
          <div key="divider" className="my-1 h-px bg-muted" />
        ) : (
          <button
            key={item.key}
            onClick={() => { onAction(item.key); onClose(); }}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
              item.key === 'delete'
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  File Preview Modal                                                 */
/* ------------------------------------------------------------------ */

function PreviewModal({ file, onClose }: { file: VaultFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-[85vh] w-[85vw] max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {TYPE_ICONS[file.type]}
            <div>
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)} &middot; {formatDate(file.modifiedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-8">
          {file.type === 'image' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-64 w-full max-w-lg items-center justify-center rounded-lg bg-card border border-border">
                <FileImage className="w-20 h-20 text-blue-400/30" />
              </div>
              <p className="text-sm text-muted-foreground">Image preview: {file.name}</p>
            </div>
          ) : file.type === 'document' && file.mimeType === 'application/pdf' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-80 w-full max-w-lg items-center justify-center rounded-lg bg-card border border-border">
                <FileText className="w-20 h-20 text-red-400/30" />
              </div>
              <p className="text-sm text-muted-foreground">PDF document: {file.name}</p>
            </div>
          ) : file.type === 'document' ? (
            <div className="w-full max-w-2xl rounded-lg bg-card border border-border p-6">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {`[Document content would render here]\n\nFile: ${file.name}\nType: ${file.mimeType}\nSize: ${formatSize(file.size)}`}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {TYPE_ICONS_LG[file.type]}
              <p className="text-foreground font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
              <button className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors">
                <Download className="h-4 w-4" />
                Download File
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="flex items-center gap-2 border-t border-border px-6 py-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {file.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs text-red-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Version History Panel                                              */
/* ------------------------------------------------------------------ */

function VersionPanel({ file, onClose }: { file: VaultFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-background backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md border-l border-border bg-card shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Version History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{file.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {file.versions.map((ver, i) => (
            <div key={ver.id} className={`rounded-lg border p-4 ${i === 0 ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${i === 0 ? 'text-red-400' : 'text-foreground'}`}>
                  Version {ver.version}
                  {i === 0 && <span className="ml-2 text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded-full">Current</span>}
                </span>
                <span className="text-xs text-muted-foreground">{formatSize(ver.size)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(ver.modifiedAt)}</span>
                <span>{ver.modifiedBy}</span>
              </div>
              {i > 0 && (
                <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-white transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rename Modal                                                       */
/* ------------------------------------------------------------------ */

function RenameModal({
  currentName, onRename, onClose,
}: {
  currentName: string;
  onRename: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-4">Rename File</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none mb-4"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onRename(name.trim()); }}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => name.trim() && onRename(name.trim())} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors">Rename</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Move Modal                                                         */
/* ------------------------------------------------------------------ */

function MoveModal({
  folders, currentFolder, onMove, onClose,
}: {
  folders: FolderNode[];
  currentFolder: string;
  onMove: (folder: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(currentFolder);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-4">Move to Folder</h3>
        <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
          {folders.map((f) => (
            <button
              key={f.path}
              onClick={() => setSelected(f.path)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                selected === f.path
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-muted-foreground hover:bg-muted border border-transparent'
              }`}
            >
              <Folder className="w-4 h-4" />
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onMove(selected)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors">Move</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tag Management Modal                                               */
/* ------------------------------------------------------------------ */

function TagModal({
  currentTags, onSave, onClose,
}: {
  currentTags: string[];
  onSave: (tags: string[]) => void;
  onClose: () => void;
}) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [input, setInput] = useState('');

  const addTag = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-4">Manage Tags</h3>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs text-red-400">
              {tag}
              <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none"
            placeholder="Add tag..."
          />
          <button onClick={addTag} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">Add</button>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onSave(tags)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload Progress                                                    */
/* ------------------------------------------------------------------ */

function UploadProgress({ files, progress }: { files: File[]; progress: number }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-border bg-card p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Uploading {files.length} file{files.length > 1 ? 's' : ''}</span>
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-red-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 max-h-20 overflow-y-auto space-y-1">
        {files.map((f, i) => (
          <p key={i} className="text-xs text-muted-foreground truncate">{f.name}</p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DocumentVaultPage() {
  /* ---- State ---- */
  const [files, setFiles] = useState<VaultFile[]>(SAMPLE_FILES);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('modifiedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drag-drop upload
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // Modals
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [versionFile, setVersionFile] = useState<VaultFile | null>(null);
  const [renameFile, setRenameFile] = useState<VaultFile | null>(null);
  const [moveFile, setMoveFile] = useState<VaultFile | null>(null);
  const [tagFile, setTagFile] = useState<VaultFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<VaultFile | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  /* ---- Computed ---- */
  const fileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach((f) => {
      counts[f.folder] = (counts[f.folder] ?? 0) + 1;
    });
    return counts;
  }, [files]);

  const totalStorage = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  const filteredFiles = useMemo(() => {
    let result = files;

    // Folder filter
    if (currentFolder !== '/') {
      result = result.filter((f) => f.folder === currentFolder);
    }

    // Type filter
    result = result.filter((f) => matchesTypeFilter(f, typeFilter));

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) =>
        f.name.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'size') cmp = a.size - b.size;
      else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
      else cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [files, currentFolder, typeFilter, searchQuery, sortField, sortDir]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach((f) => f.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [files]);

  /* ---- Handlers ---- */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;
    simulateUpload(dropped);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selected = Array.from(e.target.files);
    simulateUpload(selected);
    e.target.value = '';
  }, []);

  const simulateUpload = (incoming: File[]) => {
    setUploadFiles(incoming);
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 15 + 5;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);

        // Add files to vault
        const newFiles: VaultFile[] = incoming.map((f, i) => ({
          id: `upload-${Date.now()}-${i}`,
          name: f.name,
          type: classifyMime(f.type),
          mimeType: f.type,
          size: f.size,
          folder: currentFolder === '/' ? '/uploads' : currentFolder,
          tags: [],
          modifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          versions: [{
            id: `v-${Date.now()}-${i}`,
            version: 1,
            size: f.size,
            modifiedAt: new Date().toISOString(),
            modifiedBy: 'admin',
          }],
        }));

        setFiles((prev) => [...newFiles, ...prev]);
        setTimeout(() => {
          setUploading(false);
          setUploadFiles([]);
          setUploadProgress(0);
        }, 500);
      }
      setUploadProgress(prog);
    }, 200);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  const handleContextAction = (action: string) => {
    if (!contextMenu) return;
    const file = files.find((f) => f.id === contextMenu.fileId);
    if (!file) return;

    switch (action) {
      case 'preview': setPreviewFile(file); break;
      case 'download': break; // Would trigger download
      case 'rename': setRenameFile(file); break;
      case 'move': setMoveFile(file); break;
      case 'share': break; // Would open share dialog
      case 'versions': setVersionFile(file); break;
      case 'delete': setDeleteConfirm(file); break;
    }
  };

  const handleRename = (newName: string) => {
    if (!renameFile) return;
    setFiles((prev) => prev.map((f) => f.id === renameFile.id ? { ...f, name: newName } : f));
    setRenameFile(null);
  };

  const handleMove = (folder: string) => {
    if (moveFile) {
      setFiles((prev) => prev.map((f) => f.id === moveFile.id ? { ...f, folder } : f));
      setMoveFile(null);
    }
  };

  const handleTagSave = (tags: string[]) => {
    if (!tagFile) return;
    setFiles((prev) => prev.map((f) => f.id === tagFile.id ? { ...f, tags } : f));
    setTagFile(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setFiles((prev) => prev.filter((f) => f.id !== deleteConfirm.id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteConfirm.id); return next; });
    setDeleteConfirm(null);
  };

  const handleBulkDelete = () => {
    setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    setBulkAction(null);
  };

  const handleBulkMove = (folder: string) => {
    setFiles((prev) => prev.map((f) => selectedIds.has(f.id) ? { ...f, folder } : f));
    setSelectedIds(new Set());
    setBulkAction(null);
  };

  const cycleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ---- Render ---- */
  return (
    <div
      className="flex h-full min-h-screen flex-col bg-card"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-6 pt-4"><DemoBanner reason="Document API endpoint not yet available" /></div>
      {/* Drag overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-background backdrop-blur-sm border-4 border-dashed border-red-500 rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-16 h-16 text-red-400 animate-bounce" />
            <p className="text-xl font-semibold text-red-400">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">Files will be added to {currentFolder === '/' ? '/uploads' : currentFolder}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Document Vault</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Universal file management center</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setMobileSidebar(!mobileSidebar)}
              className="lg:hidden rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2 pl-9 pr-3 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Type filter buttons */}
          <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
            {([
              { key: 'all', label: 'All' },
              { key: 'images', label: 'Images' },
              { key: 'docs', label: 'Docs' },
              { key: 'video', label: 'Video' },
              { key: 'audio', label: 'Audio' },
            ] as { key: FileTypeFilter; label: string }[]).map((item) => (
              <button
                key={item.key}
                onClick={() => setTypeFilter(item.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === item.key
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <aside className={`${mobileSidebar ? 'block' : 'hidden'} lg:block w-64 shrink-0 border-r border-border bg-card overflow-y-auto p-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Folders</h2>
          <FolderTree
            folders={DEFAULT_FOLDERS}
            currentPath={currentFolder}
            onSelect={(p) => { setCurrentFolder(p); setMobileSidebar(false); }}
            fileCounts={fileCounts}
          />

          {/* Tags section */}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-3">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </aside>

        {/* File area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <button onClick={selectAll} className="text-red-400 hover:text-red-300 transition-colors">
                {selectedIds.size === filteredFiles.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setBulkAction('move')}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                  Move
                </button>
                <button
                  onClick={() => setBulkAction('tag')}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Tag
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Breadcrumb / path */}
          <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            <button onClick={() => setCurrentFolder('/')} className="hover:text-red-400 transition-colors">Vault</button>
            {currentFolder !== '/' && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">{currentFolder.replace('/', '')}</span>
              </>
            )}
            <span className="ml-auto text-xs">{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Empty state */}
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No files found</p>
              <p className="text-xs text-muted-foreground">Drag and drop files here or click Upload</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Upload Files
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ---- Grid View ---- */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                    onClick={() => setPreviewFile(file)}
                    className={`group relative flex flex-col rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20'
                        : 'border-border bg-card hover:border-border'
                    }`}
                  >
                    {/* Selection checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                      className={`absolute top-2 left-2 z-10 rounded-md p-0.5 transition-all ${
                        isSelected
                          ? 'opacity-100 text-red-400'
                          : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    {/* Context menu button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, file.id); }}
                      className="absolute top-2 right-2 z-10 rounded-md p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white hover:bg-muted transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Thumbnail */}
                    <div className="flex h-32 items-center justify-center rounded-t-xl bg-card border-b border-border">
                      {file.type === 'image' && file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt={file.name} className="h-full w-full rounded-t-xl object-cover" />
                      ) : (
                        TYPE_ICONS_LG[file.type]
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-1.5 p-3">
                      <p className="truncate text-sm font-medium text-white" title={file.name}>{file.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatSize(file.size)}</span>
                        <span>&middot;</span>
                        <span>{formatDate(file.modifiedAt)}</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 border border-red-500/20">
                              {tag}
                            </span>
                          ))}
                          {file.tags.length > 3 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              +{file.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 border-t border-border px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} title="Preview" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setTagFile(file); }} title="Tags" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
                        <Tag className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setVersionFile(file); }} title="Versions" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
                        <History className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(file); }} title="Delete" className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ---- List View ---- */
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[32px_1fr_100px_100px_120px_80px] gap-2 items-center bg-card px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button onClick={selectAll} className="text-muted-foreground hover:text-foreground">
                  {selectedIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <button onClick={() => cycleSort('name')} className="flex items-center gap-1 hover:text-foreground transition-colors text-left">
                  Name {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <button onClick={() => cycleSort('type')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Type {sortField === 'type' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <button onClick={() => cycleSort('size')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Size {sortField === 'size' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <button onClick={() => cycleSort('modifiedAt')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Modified {sortField === 'modifiedAt' && <ArrowUpDown className="w-3 h-3" />}
                </button>
                <span></span>
              </div>

              {/* Rows */}
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                    onClick={() => setPreviewFile(file)}
                    className={`grid grid-cols-[32px_1fr_100px_100px_120px_80px] gap-2 items-center px-4 py-3 border-b border-border cursor-pointer transition-colors ${
                      isSelected ? 'bg-red-500/5' : 'hover:bg-card'
                    }`}
                  >
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }} className="text-muted-foreground hover:text-foreground">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-3 min-w-0">
                      {TYPE_ICONS[file.type]}
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        {file.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {file.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full bg-red-500/10 px-1.5 py-0 text-[10px] text-red-400">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{file.type}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(file.modifiedAt)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setVersionFile(file); }} title="Versions" className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(file); }} title="Delete" className="rounded-lg p-1 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Storage meter */}
      <div className="border-t border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {formatSize(totalStorage)} of {formatSize(STORAGE_TOTAL)} used
              </span>
              <span className="text-xs text-muted-foreground">
                {((totalStorage / STORAGE_TOTAL) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                style={{ width: `${Math.min((totalStorage / STORAGE_TOTAL) * 100, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{files.length} files</span>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenuPopup
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Modals */}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {versionFile && <VersionPanel file={versionFile} onClose={() => setVersionFile(null)} />}
      {renameFile && <RenameModal currentName={renameFile.name} onRename={handleRename} onClose={() => setRenameFile(null)} />}
      {moveFile && <MoveModal folders={DEFAULT_FOLDERS} currentFolder={moveFile.folder} onMove={handleMove} onClose={() => setMoveFile(null)} />}
      {tagFile && <TagModal currentTags={tagFile.tags} onSave={handleTagSave} onClose={() => setTagFile(null)} />}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-foreground mb-4">
              Delete <span className="font-medium text-white">&ldquo;{deleteConfirm.name}&rdquo;</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk move modal */}
      {bulkAction === 'move' && (
        <MoveModal
          folders={DEFAULT_FOLDERS}
          currentFolder={currentFolder}
          onMove={handleBulkMove}
          onClose={() => setBulkAction(null)}
        />
      )}

      {/* Upload progress */}
      {uploading && <UploadProgress files={uploadFiles} progress={uploadProgress} />}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  Eye,
  Star,
  X,
  Image,
  FileText,
  Film,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface MarketingAsset {
  id: string;
  name: string;
  category: string;
  type: 'image' | 'pdf' | 'video';
  thumbnailUrl: string;
  downloadUrl: string;
  downloads: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const categories = [
  'All',
  'General',
  'Funding',
  'Credit',
  'Business',
  'Seasonal',
  'Social',
  'Story',
  'Print',
];

const typeIcons: Record<string, React.ComponentType<any>> = {
  image: Image,
  pdf: FileText,
  video: Film,
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function MarketingPage() {
  const api = useApi();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [previewAsset, setPreviewAsset] = useState<MarketingAsset | null>(null);

  // Fetch assets
  const { data: assets, isLoading } = useQuery<MarketingAsset[]>({
    queryKey: ['lite-marketing-assets'],
    queryFn: async () => {
      const res = await api.get<MarketingAsset[]>('/api/lite/marketing/assets');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 120_000,
  });

  const allAssets = assets ?? [];

  // Filter
  const filtered = allAssets.filter((a) => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Most popular (top 6 by downloads)
  const popular = [...allAssets].sort((a, b) => b.downloads - a.downloads).slice(0, 6);

  function downloadAsset(asset: MarketingAsset) {
    const a = document.createElement('a');
    a.href = asset.downloadUrl;
    a.download = asset.name;
    a.click();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Marketing Assets</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Download branded materials to promote your referral links.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets..."
          className="w-full rounded-2xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-xl py-2.5 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/15 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Most Popular */}
      {activeCategory === 'All' && !search && popular.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            <Star className="h-3.5 w-3.5 text-amber-400/60" />
            Most Popular
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {popular.map((asset) => {
              const TypeIcon = typeIcons[asset.type] ?? Image;
              return (
                <div
                  key={asset.id}
                  className="group cursor-pointer rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.04]"
                  onClick={() => setPreviewAsset(asset)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-white/[0.02]">
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white/50">
                      <Download className="h-2.5 w-2.5" />
                      {asset.downloads}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-3 w-3 text-zinc-400" />
                      <span className="truncate text-xs font-medium text-white/60">{asset.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Asset Grid */}
      <div>
        {activeCategory !== 'All' || search ? (
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            {activeCategory !== 'All' ? activeCategory : 'Search Results'} ({filtered.length})
          </h2>
        ) : (
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            All Assets ({filtered.length})
          </h2>
        )}

        {isLoading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl px-5 py-12 text-center">
            <Image className="mx-auto mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-zinc-400">No assets found.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((asset) => {
              const TypeIcon = typeIcons[asset.type] ?? Image;
              return (
                <div
                  key={asset.id}
                  className="group cursor-pointer rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.04]"
                  onClick={() => setPreviewAsset(asset)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-white/[0.02]">
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white/50">
                      <Download className="h-2.5 w-2.5" />
                      {asset.downloads}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-3 w-3 text-zinc-400" />
                      <span className="truncate text-xs font-medium text-white/60">{asset.name}</span>
                    </div>
                    <span className="mt-1 inline-block rounded-lg bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {asset.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.06] bg-zinc-900/95 backdrop-blur-2xl p-6 shadow-2xl">
            <button
              onClick={() => setPreviewAsset(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 overflow-hidden rounded-2xl bg-white/[0.03]">
              <img
                src={previewAsset.thumbnailUrl}
                alt={previewAsset.name}
                className="w-full object-contain"
                style={{ maxHeight: '400px' }}
              />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{previewAsset.name}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
              <span>{previewAsset.category}</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {previewAsset.downloads} downloads</span>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => downloadAsset(previewAsset)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => setPreviewAsset(null)}
                className="rounded-xl border border-white/[0.06] px-5 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

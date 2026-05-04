'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Tv2,
  Play,
  Heart,
  Filter,
  ChevronLeft,
  ChevronRight,
  Globe,
  Signal,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Channel {
  id: string;
  name: string;
  category: string;
  language: string;
  resolution: 'HD' | 'FHD' | '4K';
  streamUrl: string;
  logo: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data — 50 channels                                             */
/* ------------------------------------------------------------------ */

const ALL_CHANNELS: Channel[] = [
  // News (12)
  { id: 'bbc-news', name: 'BBC News', category: 'News', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'B', description: 'International news and current affairs.' },
  { id: 'cnn', name: 'CNN', category: 'News', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'C', description: 'Breaking news and world coverage.' },
  { id: 'al-jazeera', name: 'Al Jazeera', category: 'News', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'A', description: 'Independent global news coverage.' },
  { id: 'france24', name: 'France 24', category: 'News', language: 'FR', resolution: 'HD', streamUrl: '#', logo: 'F', description: 'International French news channel.' },
  { id: 'dw-news', name: 'DW News', category: 'News', language: 'DE', resolution: 'HD', streamUrl: '#', logo: 'D', description: 'German international broadcaster.' },
  { id: 'rt', name: 'RT News', category: 'News', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'R', description: 'Global news with Russian perspective.' },
  { id: 'nhk', name: 'NHK World', category: 'News', language: 'JA', resolution: 'FHD', streamUrl: '#', logo: 'N', description: "Japan's international public broadcaster." },
  { id: 'abc-news', name: 'ABC News', category: 'News', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'A', description: 'American broadcast news network.' },
  { id: 'sky-news', name: 'Sky News', category: 'News', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'S', description: 'British 24-hour news channel.' },
  { id: 'euronews', name: 'Euronews', category: 'News', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'E', description: 'Pan-European news network.' },
  { id: 'bloomberg', name: 'Bloomberg TV', category: 'News', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'B', description: 'Financial news and market data.' },
  { id: 'cnbc', name: 'CNBC', category: 'News', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'C', description: 'Business news and market coverage.' },
  // Sports (12)
  { id: 'espn', name: 'ESPN', category: 'Sports', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'E', description: 'Live sports and breaking sports news.' },
  { id: 'fox-sports', name: 'Fox Sports', category: 'Sports', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'F', description: 'NFL, MLB, NBA and more.' },
  { id: 'sky-sports', name: 'Sky Sports', category: 'Sports', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'S', description: 'Premier League and global sport.' },
  { id: 'eurosport', name: 'Eurosport', category: 'Sports', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'E', description: 'European and international sports.' },
  { id: 'beinsports', name: 'beIN Sports', category: 'Sports', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'B', description: 'Football, basketball and motorsport.' },
  { id: 'espn2', name: 'ESPN 2', category: 'Sports', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'E', description: 'More live sports and analysis.' },
  { id: 'nba-tv', name: 'NBA TV', category: 'Sports', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'N', description: 'Live NBA games and coverage.' },
  { id: 'nfl-network', name: 'NFL Network', category: 'Sports', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'N', description: 'Year-round NFL coverage.' },
  { id: 'golf-channel', name: 'Golf Channel', category: 'Sports', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'G', description: 'Tournament golf and instruction.' },
  { id: 'tennis-channel', name: 'Tennis Channel', category: 'Sports', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'T', description: 'Grand Slams and ATP/WTA tours.' },
  { id: 'olympic-channel', name: 'Olympic Channel', category: 'Sports', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'O', description: 'Olympic sports year-round.' },
  { id: 'motorsport-tv', name: 'Motorsport TV', category: 'Sports', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'M', description: 'F1, MotoGP and motorsport events.' },
  // Entertainment (13)
  { id: 'hbo', name: 'HBO', category: 'Entertainment', language: 'EN', resolution: '4K', streamUrl: '#', logo: 'H', description: 'Premium dramas and original series.' },
  { id: 'discovery', name: 'Discovery', category: 'Entertainment', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'D', description: 'Science and exploration docs.' },
  { id: 'nat-geo', name: 'Nat Geo Wild', category: 'Entertainment', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'N', description: 'Wildlife and nature programming.' },
  { id: 'comedy-central', name: 'Comedy Central', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'C', description: 'Stand-up and comedy series.' },
  { id: 'history', name: 'History Channel', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'H', description: 'Historical documentaries.' },
  { id: 'mtv', name: 'MTV', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'M', description: 'Music videos and reality shows.' },
  { id: 'vice', name: 'VICE TV', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'V', description: 'Documentary journalism and culture.' },
  { id: 'animal-planet', name: 'Animal Planet', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'A', description: 'Animal shows and wildlife docs.' },
  { id: 'food-network', name: 'Food Network', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'F', description: 'Cooking shows and food competitions.' },
  { id: 'travel-channel', name: 'Travel Channel', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'T', description: 'Travel destinations and adventures.' },
  { id: 'tlc', name: 'TLC', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'T', description: 'Reality and lifestyle programming.' },
  { id: 'bravo', name: 'Bravo', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'B', description: 'Pop culture and reality series.' },
  { id: 'a-and-e', name: 'A&E', category: 'Entertainment', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'A', description: 'True crime and documentary series.' },
  // Movies (13)
  { id: 'tcm', name: 'TCM Classic', category: 'Movies', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'T', description: 'Timeless Hollywood classics.' },
  { id: 'cinemax', name: 'Cinemax', category: 'Movies', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'C', description: 'Action films and blockbusters.' },
  { id: 'starz', name: 'Starz', category: 'Movies', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'S', description: 'First-run movies and originals.' },
  { id: 'fx', name: 'FX Movies', category: 'Movies', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'F', description: 'Contemporary films and FX originals.' },
  { id: 'showtime', name: 'Showtime', category: 'Movies', language: 'EN', resolution: '4K', streamUrl: '#', logo: 'S', description: 'Premium films and original dramas.' },
  { id: 'sundance', name: 'Sundance TV', category: 'Movies', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'S', description: 'Independent and art-house cinema.' },
  { id: 'ifc', name: 'IFC', category: 'Movies', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'I', description: 'Independent Film Channel.' },
  { id: 'hallmark', name: 'Hallmark Movies', category: 'Movies', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'H', description: 'Feel-good films and holiday movies.' },
  { id: 'amc', name: 'AMC', category: 'Movies', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'A', description: 'Classic and contemporary cinema.' },
  { id: 'encore', name: 'Encore', category: 'Movies', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'E', description: 'Movie favorites from past decades.' },
  { id: 'mgm-plus', name: 'MGM+', category: 'Movies', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'M', description: 'MGM library films and originals.' },
  { id: 'paramount', name: 'Paramount Network', category: 'Movies', language: 'EN', resolution: 'FHD', streamUrl: '#', logo: 'P', description: 'Hit movies and Paramount originals.' },
  { id: 'sony-movies', name: 'Sony Movies', category: 'Movies', language: 'EN', resolution: 'HD', streamUrl: '#', logo: 'S', description: 'Sony Pictures theatrical releases.' },
];

const CATEGORIES = ['All', 'News', 'Sports', 'Entertainment', 'Movies'];
const LANGUAGES = ['All', 'EN', 'FR', 'DE', 'JA'];
const RESOLUTIONS = ['All', 'HD', 'FHD', '4K'];
const PAGE_SIZE = 12;

const LOGO_GRADIENTS = [
  'from-purple-500 to-purple-700',
  'from-blue-500 to-blue-700',
  'from-rose-500 to-rose-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
];

function logoGradient(id: string): string {
  return LOGO_GRADIENTS[id.charCodeAt(0) % LOGO_GRADIENTS.length];
}

/* ------------------------------------------------------------------ */
/*  Channel card (larger grid variant)                                  */
/* ------------------------------------------------------------------ */

function ChannelGridCard({
  channel,
  isFavorite,
  onToggleFavorite,
  onWatch,
}: {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onWatch: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl overflow-hidden border border-white/[0.06] bg-card hover:bg-muted hover:border-primary/20 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className={`relative h-32 bg-gradient-to-br ${logoGradient(channel.id)} flex items-center justify-center`}>
        <span className="text-5xl font-black text-white/90">{channel.logo}</span>
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-background backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[9px] font-semibold tracking-wider text-red-300 uppercase">Live</span>
        </div>
        <div className="absolute top-2 right-2 bg-background backdrop-blur-sm rounded px-1.5 py-0.5">
          <span className="text-[9px] font-bold tracking-wider text-foreground">{channel.resolution}</span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background group-hover:bg-background flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={onWatch}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Play className="h-3 w-3 fill-white" /> Watch
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`rounded-xl p-2 text-xs font-semibold transition-colors ${
              isFavorite
                ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                : 'bg-white/10 border border-white/10 text-foreground hover:text-rose-400'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground truncate tracking-tight">{channel.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{channel.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="rounded-md bg-muted border border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <Globe className="h-2.5 w-2.5" /> {channel.language}
          </span>
          <span className="rounded-md bg-muted border border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{channel.category}</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
            <Signal className="h-2.5 w-2.5" /> HD
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar filter                                                       */
/* ------------------------------------------------------------------ */

function FilterSidebar({
  category,
  language,
  resolution,
  favoritesOnly,
  onCategory,
  onLanguage,
  onResolution,
  onFavoritesOnly,
  onReset,
}: {
  category: string;
  language: string;
  resolution: string;
  favoritesOnly: boolean;
  onCategory: (v: string) => void;
  onLanguage: (v: string) => void;
  onResolution: (v: string) => void;
  onFavoritesOnly: (v: boolean) => void;
  onReset: () => void;
}) {
  const hasFilters = category !== 'All' || language !== 'All' || resolution !== 'All' || favoritesOnly;

  return (
    <div className="w-56 flex-shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Filters</h3>
        </div>
        {hasFilters && (
          <button onClick={onReset} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Category</p>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategory(cat)}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all duration-150 ${
              category === cat
                ? 'bg-primary/80/15 border border-primary/25 text-primary/80 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Language</p>
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => onLanguage(lang)}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all duration-150 ${
              language === lang
                ? 'bg-primary/80/15 border border-primary/25 text-primary/80 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {lang === 'All' ? 'All Languages' : lang}
          </button>
        ))}
      </div>

      {/* Resolution */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Resolution</p>
        {RESOLUTIONS.map((res) => (
          <button
            key={res}
            onClick={() => onResolution(res)}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all duration-150 ${
              resolution === res
                ? 'bg-primary/80/15 border border-primary/25 text-primary/80 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {res === 'All' ? 'All Resolutions' : res}
          </button>
        ))}
      </div>

      {/* Favorites only */}
      <div className="rounded-2xl border border-white/[0.06] bg-card p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => onFavoritesOnly(!favoritesOnly)}
            className={`relative w-9 h-5 rounded-full border transition-all duration-200 ${
              favoritesOnly ? 'bg-primary border-primary' : 'bg-muted border-white/[0.08]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                favoritesOnly ? 'left-4' : 'left-0.5'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Favorites only</p>
            <p className="text-[10px] text-muted-foreground">Show saved channels</p>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function ChannelBrowserPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [language, setLanguage] = useState('All');
  const [resolution, setResolution] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return ALL_CHANNELS.filter((ch) => {
      if (search && !ch.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'All' && ch.category !== category) return false;
      if (language !== 'All' && ch.language !== language) return false;
      if (resolution !== 'All' && ch.resolution !== resolution) return false;
      if (favoritesOnly && !favorites.has(ch.id)) return false;
      return true;
    });
  }, [search, category, language, resolution, favoritesOnly, favorites]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setCategory('All');
    setLanguage('All');
    setResolution('All');
    setFavoritesOnly(false);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-card pb-16">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-white/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3">
              <Tv2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Channel Browser</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{ALL_CHANNELS.length} channels available</p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-card border border-white/[0.06] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:bg-card transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-8 px-8 pt-8">
        {/* Sidebar */}
        <FilterSidebar
          category={category}
          language={language}
          resolution={resolution}
          favoritesOnly={favoritesOnly}
          onCategory={(v) => { setCategory(v); setPage(1); }}
          onLanguage={(v) => { setLanguage(v); setPage(1); }}
          onResolution={(v) => { setResolution(v); setPage(1); }}
          onFavoritesOnly={(v) => { setFavoritesOnly(v); setPage(1); }}
          onReset={resetFilters}
        />

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Results info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} channel{filtered.length !== 1 ? 's' : ''}
              {search && <span className="text-muted-foreground"> matching &ldquo;{search}&rdquo;</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {/* Grid */}
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Tv2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No channels found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${category}-${language}-${resolution}-${page}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
              >
                {paginated.map((ch) => (
                  <ChannelGridCard
                    key={ch.id}
                    channel={ch}
                    isFavorite={favorites.has(ch.id)}
                    onToggleFavorite={() => toggleFavorite(ch.id)}
                    onWatch={() => {}}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 rounded-xl bg-card border border-white/[0.06] px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) {
                    p = i + 1;
                  } else if (currentPage <= 4) {
                    p = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    p = totalPages - 6 + i;
                  } else {
                    p = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-150 ${
                        p === currentPage
                          ? 'bg-primary text-white border border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 rounded-xl bg-card border border-white/[0.06] px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

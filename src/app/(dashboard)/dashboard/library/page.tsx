'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Library,
  Layers,
  Route,
  Sparkles,
  CreditCard,
  Globe,
  Star,
  Wrench,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface PageEntry {
  name: string;
  route: string;
  category: string;
}

interface Category {
  label: string;
  color: string;      // tailwind bg class for badge
  textColor: string;  // tailwind text class
  borderColor: string;
  icon: React.ReactNode;
  pages: PageEntry[];
}

const categories: Category[] = [
  {
    label: 'Free Tools',
    color: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    icon: <Wrench className="w-3.5 h-3.5" />,
    pages: [
      { name: 'Free Tools Hub', route: '/free-tools', category: 'Free Tools' },
      { name: 'Corporation Builder', route: '/free-tools/incorporate', category: 'Free Tools' },
      { name: 'EIN Walkthrough', route: '/free-tools/ein', category: 'Free Tools' },
    ],
  },
  {
    label: 'Credit & Funding',
    color: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    icon: <CreditCard className="w-3.5 h-3.5" />,
    pages: [
      { name: 'Credit Dashboard', route: '/dashboard/credit', category: 'Credit & Funding' },
      { name: 'Business Credit Builder', route: '/dashboard/credit/business-credit', category: 'Credit & Funding' },
      { name: 'Auto Funder', route: '/dashboard/credit/auto-funder', category: 'Credit & Funding' },
      { name: 'SBS Simulator', route: '/dashboard/credit/sbs-simulator', category: 'Credit & Funding' },
      { name: 'Funding Pipeline', route: '/dashboard/credit/funding-pipeline', category: 'Credit & Funding' },
      { name: 'Funding Application', route: '/dashboard/credit/funding-application', category: 'Credit & Funding' },
      { name: 'Credit Reports', route: '/dashboard/credit/reports', category: 'Credit & Funding' },
      { name: 'Disputes', route: '/dashboard/credit/disputes', category: 'Credit & Funding' },
    ],
  },
  {
    label: 'Universe',
    color: 'bg-violet-500/20',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    icon: <Globe className="w-3.5 h-3.5" />,
    pages: [
      { name: 'Revenue World', route: '/universe/revenue-world', category: 'Universe' },
      { name: 'Revenue Forecast', route: '/universe/revenue-forecast', category: 'Universe' },
      { name: 'Funding', route: '/universe/funding', category: 'Universe' },
    ],
  },
  {
    label: 'Special Pages',
    color: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    icon: <Star className="w-3.5 h-3.5" />,
    pages: [
      { name: 'Believer Vision Dashboard', route: '/vision', category: 'Special Pages' },
      { name: 'Mobile Command Center', route: '/dashboard/mobile-command', category: 'Special Pages' },
    ],
  },
];

const allPages = categories.flatMap((c) => c.pages);
const totalPages = allPages.length;
const totalCategories = categories.length;
const totalRoutes = new Set(allPages.map((p) => p.route)).size;

function getCategoryMeta(label: string) {
  return categories.find((c) => c.label === label)!;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WorkLibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let pages = allPages;
    if (activeCategory) {
      pages = pages.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      pages = pages.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.route.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    return pages;
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* ── Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06]">
              <Library className="w-5 h-5 text-white/70" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/95">
              Work Library
            </h1>
          </div>
          <p className="text-white/40 text-base sm:text-lg mt-1 max-w-xl">
            Everything we&apos;ve built. Browse, verify, preview.
          </p>
        </motion.div>

        {/* ── Stats ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          {[
            { label: 'Pages Built', value: `${totalPages}`, icon: <Layers className="w-4 h-4" /> },
            { label: 'Categories', value: `${totalCategories}`, icon: <Sparkles className="w-4 h-4" /> },
            { label: 'Routes', value: `${totalRoutes}`, icon: <Route className="w-4 h-4" /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 text-white/30 mb-2">
                {stat.icon}
                <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-white/90">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Search + Filters ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mb-8 space-y-4"
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages by name, route, or category..."
              className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm
                         pl-11 pr-4 py-3.5 text-sm text-white/80 placeholder:text-white/20
                         focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04]
                         transition-colors duration-200"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                ${!activeCategory
                  ? 'bg-white/10 text-white/80 border border-white/[0.12]'
                  : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50 hover:bg-white/[0.05]'
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                  ${activeCategory === cat.label
                    ? `${cat.color} ${cat.textColor} border ${cat.borderColor}`
                    : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50 hover:bg-white/[0.05]'
                  }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Results count ──────────────────────────────── */}
        <div className="mb-5">
          <p className="text-xs text-white/25 font-medium uppercase tracking-wider">
            {filtered.length} {filtered.length === 1 ? 'page' : 'pages'}
            {activeCategory ? ` in ${activeCategory}` : ''}
            {search ? ` matching "${search}"` : ''}
          </p>
        </div>

        {/* ── Card Grid ──────────────────────────────────── */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-white/20 text-sm">No pages match your search.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={`${activeCategory}-${search}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((page) => {
              const meta = getCategoryMeta(page.category);
              return (
                <motion.div
                  key={page.route}
                  variants={cardVariants}
                  className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm
                             p-5 sm:p-6 flex flex-col justify-between
                             hover:bg-white/[0.05] hover:border-white/[0.10]
                             transition-all duration-250"
                >
                  {/* Top row: category badge + status */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                                    ${meta.color} ${meta.textColor}`}
                      >
                        {meta.icon}
                        {page.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                       bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        Built
                      </span>
                    </div>

                    {/* Page name */}
                    <h3 className="text-lg font-medium text-white/90 mb-1.5 leading-snug">
                      {page.name}
                    </h3>

                    {/* Route */}
                    <p className="text-xs text-white/25 font-mono mb-5">{page.route}</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(page.route)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                 bg-white/[0.06] text-white/70 text-xs font-medium
                                 hover:bg-white/[0.10] hover:text-white/90
                                 transition-all duration-200"
                    >
                      Open
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={page.route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                 bg-white/[0.03] text-white/40 text-xs font-medium border border-white/[0.06]
                                 hover:bg-white/[0.06] hover:text-white/60
                                 transition-all duration-200"
                    >
                      Preview
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-white/[0.04] text-center">
          <p className="text-xs text-white/15">
            Memelli OS Work Library &middot; {totalPages} pages across {totalCategories} categories
          </p>
        </div>
      </div>
    </div>
  );
}

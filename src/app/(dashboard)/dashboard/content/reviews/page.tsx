'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Star,
  StarHalf,
  Check,
  X,
  Upload,
  Mail,
  Code,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  BarChart3,
  MessageSquareQuote,
  Eye,
  Pin,
  PinOff,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type ReviewStatus = 'approved' | 'pending' | 'rejected';

interface Review {
  id: string;
  author: string;
  email: string;
  rating: number;
  text: string;
  date: string;
  status: ReviewStatus;
  featured: boolean;
  product?: string;
  source: 'manual' | 'import' | 'request' | 'widget';
}

/* ================================================================= */
/*  Mock Data                                                          */
/* ================================================================= */

const INITIAL_REVIEWS: Review[] = [
  { id: '1', author: 'Sarah Mitchell', email: 'sarah@example.com', rating: 5, text: 'Absolutely incredible service. The team went above and beyond to help me with my credit repair journey. Highly recommend to anyone looking for real results.', date: '2026-03-14', status: 'approved', featured: true, product: 'Credit Repair Pro', source: 'manual' },
  { id: '2', author: 'James Carter', email: 'james@example.com', rating: 4, text: 'Great experience overall. The onboarding was smooth and I saw improvements within the first month. Only giving 4 stars because communication could be slightly faster.', date: '2026-03-13', status: 'approved', featured: false, product: 'Funding Package', source: 'request' },
  { id: '3', author: 'Maria Gonzalez', email: 'maria@example.com', rating: 5, text: 'Life-changing results. I went from a 520 to a 710 credit score in just 4 months. The AI-powered system really works!', date: '2026-03-12', status: 'approved', featured: true, source: 'widget' },
  { id: '4', author: 'David Thompson', email: 'david@example.com', rating: 3, text: 'Decent service but expected faster results. The platform is nice though.', date: '2026-03-11', status: 'pending', featured: false, product: 'Credit Repair Pro', source: 'import' },
  { id: '5', author: 'Emily Watson', email: 'emily@example.com', rating: 1, text: 'Not satisfied with the results. Felt misled about timelines.', date: '2026-03-10', status: 'rejected', featured: false, source: 'widget' },
  { id: '6', author: 'Robert Kim', email: 'robert@example.com', rating: 5, text: 'The coaching program is phenomenal. Every module was packed with actionable insights. Worth every penny.', date: '2026-03-09', status: 'approved', featured: false, product: 'Business Coaching', source: 'manual' },
  { id: '7', author: 'Amanda Foster', email: 'amanda@example.com', rating: 4, text: 'Love the dashboard and AI features. Makes managing everything so much easier. Looking forward to new features!', date: '2026-03-08', status: 'pending', featured: false, source: 'request' },
  { id: '8', author: 'Michael Brown', email: 'michael@example.com', rating: 2, text: 'Had some technical issues with the platform. Support resolved them but took a while.', date: '2026-03-07', status: 'pending', featured: false, product: 'Funding Package', source: 'import' },
  { id: '9', author: 'Lisa Chen', email: 'lisa@example.com', rating: 5, text: 'Second time using Memelli and I am still blown away. The universe ecosystem ties everything together beautifully.', date: '2026-03-06', status: 'approved', featured: true, product: 'Business Coaching', source: 'manual' },
  { id: '10', author: 'Chris Williams', email: 'chris@example.com', rating: 4, text: 'Solid platform with great potential. Already recommending it to my network.', date: '2026-03-05', status: 'approved', featured: false, source: 'widget' },
];

/* ================================================================= */
/*  Helpers                                                            */
/* ================================================================= */

const STATUS_STYLES: Record<ReviewStatus, string> = {
  approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
};

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Star key={i} size={size} className="fill-red-500 text-red-500" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<StarHalf key={i} size={size} className="fill-red-500 text-red-500" />);
    } else {
      stars.push(<Star key={i} size={size} className="text-muted-foreground" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ================================================================= */
/*  Widget Code Generator                                              */
/* ================================================================= */

function WidgetCodeModal({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [layout, setLayout] = useState<'grid' | 'carousel' | 'list'>('grid');
  const [maxReviews, setMaxReviews] = useState(6);
  const [showRating, setShowRating] = useState(true);

  const widgetCode = useMemo(() => {
    return `<!-- Memelli Reviews Widget -->
<div id="memelli-reviews-widget"></div>
<script src="https://universe.memelli.com/widgets/reviews.js"></script>
<script>
  MemelliReviews.init({
    containerId: 'memelli-reviews-widget',
    theme: '${theme}',
    layout: '${layout}',
    maxReviews: ${maxReviews},
    showRating: ${showRating},
    apiKey: 'YOUR_API_KEY'
  });
</script>`;
  }, [theme, layout, maxReviews, showRating]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(widgetCode);
    toast.success('Widget code copied to clipboard');
  }, [widgetCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Code size={20} className="text-red-500" />
            Display Widget Code
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Layout</label>
            <select value={layout} onChange={(e) => setLayout(e.target.value as 'grid' | 'carousel' | 'list')} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none">
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="list">List</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Max Reviews</label>
            <input type="number" min={1} max={20} value={maxReviews} onChange={(e) => setMaxReviews(Number(e.target.value))} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none" />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={showRating} onChange={(e) => setShowRating(e.target.checked)} className="h-4 w-4 rounded border-border bg-muted text-red-500 accent-red-500" />
              Show Star Rating
            </label>
          </div>
        </div>

        <div className="relative rounded-lg border border-border bg-card p-4">
          <pre className="overflow-x-auto text-xs text-foreground font-mono leading-relaxed">{widgetCode}</pre>
          <button onClick={copyCode} className="absolute right-3 top-3 rounded-lg border border-border bg-muted p-2 text-muted-foreground hover:bg-muted hover:text-white transition-colors" title="Copy code">
            <Copy size={14} />
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Request Review Modal                                               */
/* ================================================================= */

function RequestReviewModal({ onClose, onSend }: { onClose: () => void; onSend: (data: { email: string; name: string; message: string }) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState(
    'Hi! We would love to hear about your experience. Could you take a moment to leave us a review? Your feedback helps us improve and helps others make informed decisions. Thank you!'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSend({ email, name, message });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail size={20} className="text-red-500" />
            Request a Review
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Customer Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Customer Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors flex items-center gap-2">
              <Mail size={14} />
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Import Modal                                                       */
/* ================================================================= */

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (count: number) => void }) {
  const [source, setSource] = useState('csv');
  const [isDragging, setIsDragging] = useState(false);

  const handleImport = () => {
    onImport(12);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload size={20} className="text-red-500" />
            Import Reviews
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none">
            <option value="csv">CSV File</option>
            <option value="google">Google Reviews</option>
            <option value="trustpilot">Trustpilot</option>
            <option value="yelp">Yelp</option>
          </select>
        </div>

        <div
          className={`mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging ? 'border-red-500 bg-red-500/5' : 'border-border bg-muted'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
        >
          <Upload size={32} className="mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Drag & drop your file here</p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleImport} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors flex items-center gap-2">
            <Upload size={14} />
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Rating Distribution Chart                                          */
/* ================================================================= */

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });
    const max = Math.max(...counts, 1);
    return counts.map((count, i) => ({
      stars: i + 1,
      count,
      pct: Math.round((count / Math.max(reviews.length, 1)) * 100),
      barWidth: (count / max) * 100,
    }));
  }, [reviews]);

  return (
    <div className="space-y-2">
      {[...distribution].reverse().map((d) => (
        <div key={d.stars} className="flex items-center gap-3">
          <span className="w-8 text-right text-xs text-muted-foreground">{d.stars} <Star size={10} className="inline fill-zinc-500 text-muted-foreground" /></span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
              style={{ width: `${d.barWidth}%` }}
            />
          </div>
          <span className="w-12 text-right text-xs text-muted-foreground">{d.count} ({d.pct}%)</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================= */
/*  Page                                                               */
/* ================================================================= */

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<'date' | 'rating'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'approved');
    const avg = approved.length > 0 ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;
    return {
      total: reviews.length,
      approved: approved.length,
      pending: reviews.filter((r) => r.status === 'pending').length,
      rejected: reviews.filter((r) => r.status === 'rejected').length,
      average: avg,
      featured: reviews.filter((r) => r.featured).length,
    };
  }, [reviews]);

  /* ---- Filtered & sorted ---- */
  const filteredReviews = useMemo(() => {
    let list = [...reviews];
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (ratingFilter !== 'all') list = list.filter((r) => r.rating === ratingFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.author.toLowerCase().includes(q) || r.text.toLowerCase().includes(q) || (r.product && r.product.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return mul * (a.rating - b.rating);
    });
    return list;
  }, [reviews, statusFilter, ratingFilter, searchQuery, sortField, sortDir]);

  /* ---- Actions ---- */
  const updateStatus = useCallback((id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Review ${status}`);
  }, []);

  const toggleFeatured = useCallback((id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r)));
    toast.success('Featured status updated');
  }, []);

  const deleteReview = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success('Review deleted');
  }, []);

  const handleRequestSend = useCallback((data: { email: string; name: string; message: string }) => {
    toast.success(`Review request sent to ${data.email}`);
  }, []);

  const handleImport = useCallback((count: number) => {
    toast.success(`${count} reviews imported successfully`);
  }, []);

  const toggleSort = (field: 'date' | 'rating') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'date' | 'rating' }) =>
    sortField === field ? (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />) : null;

  /* ================================================================= */
  /*  Render                                                             */
  /* ================================================================= */

  return (
    <div className="min-h-screen bg-card p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquareQuote size={28} className="text-red-500" />
            Reviews & Testimonials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer reviews, testimonials, and display widgets</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
            <Upload size={14} />
            Import
          </button>
          <button onClick={() => setShowRequestModal(true)} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
            <Mail size={14} />
            Request Review
          </button>
          <button onClick={() => setShowWidgetModal(true)} className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            <Code size={14} />
            Widget Code
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Average Rating */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Rating</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{stats.average.toFixed(1)}</span>
            <Star size={20} className="mb-1 fill-red-500 text-red-500" />
          </div>
          <div className="mt-1">
            <StarRating rating={stats.average} size={14} />
          </div>
        </div>
        {/* Total */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">All reviews</p>
        </div>
        {/* Approved */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{stats.approved}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total</p>
        </div>
        {/* Pending */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{stats.pending}</p>
          <p className="mt-1 text-xs text-muted-foreground">Needs review</p>
        </div>
        {/* Rejected */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejected</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{stats.rejected}</p>
          <p className="mt-1 text-xs text-muted-foreground">Declined</p>
        </div>
        {/* Featured */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Featured</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{stats.featured}</p>
          <p className="mt-1 text-xs text-muted-foreground">Highlighted</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 size={16} className="text-red-500" />
          Rating Distribution
        </h3>
        <RatingDistribution reviews={reviews} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews by author, text, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder-muted-foreground focus:border-red-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | 'all')}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={ratingFilter === 'all' ? 'all' : String(ratingFilter)}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="mb-2 hidden rounded-lg border border-border bg-card px-4 py-2.5 sm:grid sm:grid-cols-12 sm:gap-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <div className="col-span-3">Author</div>
        <button className="col-span-1 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => toggleSort('rating')}>
          Rating <SortIcon field="rating" />
        </button>
        <div className="col-span-3">Review</div>
        <button className="col-span-1 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => toggleSort('date')}>
          Date <SortIcon field="date" />
        </button>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Featured</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Review List */}
      <div className="space-y-2">
        {filteredReviews.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <MessageSquareQuote size={48} className="mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reviews match your filters</p>
          </div>
        )}

        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`rounded-xl border bg-card transition-colors ${
              review.featured ? 'border-red-500/30 bg-red-500/[0.03]' : 'border-border hover:border-border'
            }`}
          >
            {/* Main row */}
            <div className="grid grid-cols-1 items-center gap-4 px-4 py-3 sm:grid-cols-12">
              {/* Author */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-red-400">
                  {review.author.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{review.author}</p>
                  <p className="text-xs text-muted-foreground">{review.email}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="col-span-1">
                <StarRating rating={review.rating} size={14} />
              </div>

              {/* Review text */}
              <div className="col-span-3">
                <p className="text-sm text-foreground line-clamp-2 cursor-pointer" onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}>
                  {review.text}
                </p>
                {review.product && <span className="mt-1 inline-block text-xs text-muted-foreground">{review.product}</span>}
              </div>

              {/* Date */}
              <div className="col-span-1">
                <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[review.status]}`}>
                  {STATUS_LABEL[review.status]}
                </span>
              </div>

              {/* Featured */}
              <div className="col-span-1">
                <button
                  onClick={() => toggleFeatured(review.id)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    review.featured ? 'text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:bg-muted hover:text-muted-foreground'
                  }`}
                  title={review.featured ? 'Remove from featured' : 'Add to featured'}
                >
                  {review.featured ? <Pin size={16} /> : <PinOff size={16} />}
                </button>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1">
                {review.status !== 'approved' && (
                  <button onClick={() => updateStatus(review.id, 'approved')} className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors" title="Approve">
                    <Check size={16} />
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button onClick={() => updateStatus(review.id, 'rejected')} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Reject">
                    <X size={16} />
                  </button>
                )}
                <button onClick={() => setExpandedId(expandedId === review.id ? null : review.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="View details">
                  <Eye size={16} />
                </button>
                <button onClick={() => deleteReview(review.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === review.id && (
              <div className="border-t border-border px-4 py-3 bg-card">
                <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Source: <span className="text-muted-foreground capitalize">{review.source}</span></span>
                  {review.product && <span>Product: <span className="text-muted-foreground">{review.product}</span></span>}
                  <span>Submitted: <span className="text-muted-foreground">{formatDate(review.date)}</span></span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw size={12} />
          Last synced: Just now
        </div>
      </div>

      {/* Modals */}
      {showWidgetModal && <WidgetCodeModal onClose={() => setShowWidgetModal(false)} />}
      {showRequestModal && <RequestReviewModal onClose={() => setShowRequestModal(false)} onSend={handleRequestSend} />}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImport} />}
    </div>
  );
}
